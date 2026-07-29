/**
 * MeshCentral Printer Control plugin - server side.
 *
 * The browser never sends PowerShell. It can only request one of the actions in
 * ACTION_PERMISSIONS. Each action is checked against both normal MeshCentral
 * node visibility and the plugin permission model before being sent to an agent.
 */
"use strict";

module.exports.printercontrol = function (parent) {
    var crypto = require("crypto");
    var obj = {};

    obj.parent = parent;
    obj.meshServer = parent.parent;
    obj.debug = obj.meshServer.debug;
    obj.VIEWS = __dirname + "/views/";
    obj.pending = Object.create(null);
    obj.activeOperations = Object.create(null);
    obj.readQueues = Object.create(null);
    obj.jobSubscriptions = Object.create(null);
    obj.watcherLeaseRenewed = Object.create(null);
    obj.watcherState = Object.create(null);
    obj.subscriptionCleanupTimer = null;
    obj.exports = ["onWebUIStartupEnd", "onDeviceRefreshEnd"];

    var SUBSCRIPTION_TTL_MS = 45000;
    var SUBSCRIPTION_MAX_MS = 600000;
    var CLEANUP_INTERVAL_MS = 10000;
    var AGENT_WATCHER_LEASE_MS = 55000;
    var AGENT_LEASE_RENEW_MIN_MS = 10000;
    var MAX_SUBSCRIPTIONS_PER_NODE = 8;
    var MAX_SUBSCRIPTIONS_TOTAL = 128;
    var MAX_PENDING_REQUESTS = 256;
    var MAX_COALESCED_READ_WAITERS = 16;
    var MAX_QUEUED_READS_PER_NODE = 8;
    var QUEUED_READ_TTL_MS = 150000;
    var DEFAULT_OPERATION_TIMEOUT_MS = 135000;
    var OPERATION_TIMEOUTS_MS = {
        inventory: 105000,
        jobs: 60000,
        cancelJob: 45000,
        pauseJob: 45000,
        resumeJob: 45000,
        testPage: 45000,
        addTcpPrinter: 105000,
        deletePrinter: 105000,
        removePort: 105000,
        removeDriver: 105000,
        spoolerStart: 60000,
        spoolerStop: 60000,
        spoolerRestart: 75000,
        clearQueue: 105000
    };

    var ACTION_PERMISSIONS = {
        inventory: "can_view",
        jobs: "can_view",
        cancelJob: "manage_jobs",
        pauseJob: "manage_jobs",
        resumeJob: "manage_jobs",
        testPage: "manage_printers",
        addTcpPrinter: "manage_printers",
        deletePrinter: "manage_printers",
        removePort: "manage_printers",
        removeDriver: "manage_drivers",
        spoolerStart: "manage_spooler",
        spoolerStop: "manage_spooler",
        spoolerRestart: "manage_spooler",
        clearQueue: "manage_spooler"
    };

    function registerPluginPermissions() {
        if (typeof parent.registerPermissions !== "function") {
            throw new Error("MeshCentral plugin permission API is unavailable");
        }
        parent.registerPermissions("printercontrol", {
            can_view: {
                title: "View printers",
                desc: "View printers, ports, drivers and print jobs",
                default: "denied"
            },
            manage_jobs: {
                title: "Manage print jobs",
                desc: "Pause, resume and cancel print jobs",
                default: "denied"
            },
            manage_printers: {
                title: "Manage printers",
                desc: "Add, remove, test and reconfigure printers and ports",
                default: "denied"
            },
            manage_drivers: {
                title: "Manage printer drivers",
                desc: "Remove unused printer drivers",
                default: "denied"
            },
            manage_spooler: {
                title: "Manage Print Spooler",
                desc: "Start, stop or restart the Spooler and clear its queue",
                default: "denied"
            }
        });
    }

    obj.server_startup = function () {
        // MeshCentral defines the permission API after it constructs the plugin
        // handler, so registration must be deferred until this startup hook.
        registerPluginPermissions();
        obj.debug("plugin:printercontrol", "Printer Control 0.4.21 started with operation-specific timeout recovery");
    };

    obj.server_shutdown = function () {
        if (obj.subscriptionCleanupTimer != null) {
            clearInterval(obj.subscriptionCleanupTimer);
            obj.subscriptionCleanupTimer = null;
        }
        for (var requestId in obj.pending) {
            if (!Object.prototype.hasOwnProperty.call(obj.pending, requestId)) continue;
            if (obj.pending[requestId] && obj.pending[requestId].timer) clearTimeout(obj.pending[requestId].timer);
        }
        obj.pending = Object.create(null);
        obj.activeOperations = Object.create(null);
        obj.readQueues = Object.create(null);
        obj.jobSubscriptions = Object.create(null);
        obj.watcherLeaseRenewed = Object.create(null);
        obj.watcherState = Object.create(null);
    };

    // This function is serialized into the MeshCentral web application. Keep it
    // self-contained and use only browser globals supplied by MeshCentral.
    // The permissions dialog is created by MeshCentral itself, outside the plugin
    // iframe, and the legacy UI gives many of its elements inline light colors.
    // Detect the active page palette and mark the dialog when it is inserted.
    obj.onWebUIStartupEnd = function () {
        var styleId = "printerControlPluginPermissionsTheme";

        function ensureStyle() {
            if (document.getElementById(styleId)) return;
            var style = document.createElement("style");
            style.id = styleId;
            style.type = "text/css";
            style.textContent = [
                '#pluginPermModal.printercontrol-dark { color:#e8eaed !important; }',
                '#pluginPermModal.printercontrol-dark > div, #pluginPermModal.printercontrol-dark .modal-content { background:#1f1f1f !important; color:#e8eaed !important; border:1px solid #555 !important; box-shadow:0 12px 34px rgba(0,0,0,.7) !important; }',
                '#pluginPermModal.printercontrol-dark .modal-header, #pluginPermModal.printercontrol-dark .modal-body, #pluginPermModal.printercontrol-dark .modal-footer, #pluginPermModal.printercontrol-dark #pluginPermBody { background:#1f1f1f !important; color:#e8eaed !important; border-color:#4b4b4b !important; }',
                '#pluginPermModal.printercontrol-dark [style*="background:#fff"], #pluginPermModal.printercontrol-dark [style*="background: #fff"], #pluginPermModal.printercontrol-dark [style*="background:#ffffff"], #pluginPermModal.printercontrol-dark [style*="background: #ffffff"], #pluginPermModal.printercontrol-dark [style*="background:#f8f9fa"], #pluginPermModal.printercontrol-dark [style*="background: #f8f9fa"] { background:#2a2a2a !important; color:#e8eaed !important; }',
                '#pluginPermModal.printercontrol-dark [style*="#dee2e6"], #pluginPermModal.printercontrol-dark [style*="lightgray"], #pluginPermModal.printercontrol-dark [style*="lightgrey"] { border-color:#505050 !important; }',
                '#pluginPermModal.printercontrol-dark [style*="color:#666"], #pluginPermModal.printercontrol-dark [style*="color: #666"], #pluginPermModal.printercontrol-dark [style*="color:#333"], #pluginPermModal.printercontrol-dark [style*="color: #333"], #pluginPermModal.printercontrol-dark .text-muted { color:#aaa !important; }',
                '#pluginPermModal.printercontrol-dark input, #pluginPermModal.printercontrol-dark select, #pluginPermModal.printercontrol-dark textarea, #pluginPermModal.printercontrol-dark .form-control, #pluginPermModal.printercontrol-dark .form-select { background-color:#303030 !important; color:#f1f1f1 !important; border-color:#666 !important; color-scheme:dark; }',
                '#pluginPermModal.printercontrol-dark option { background:#303030 !important; color:#f1f1f1 !important; }',
                '#pluginPermModal.printercontrol-dark input::placeholder, #pluginPermModal.printercontrol-dark textarea::placeholder { color:#aaa !important; opacity:1; }',
                '#pluginPermModal.printercontrol-dark button[onclick*="closePluginPermModal"] { color:#f1f1f1 !important; }',
                '#pluginPermModal.printercontrol-dark button[onclick="closePluginPermModal()"][style*="margin-right"] { background:#3b3b3b !important; color:#fff !important; border:1px solid #707070 !important; border-radius:4px !important; opacity:1 !important; padding:6px 16px !important; }',
                '#pluginPermModal.printercontrol-dark .btn-close { filter:invert(1) grayscale(100%) brightness(200%); }',
                '#pluginPermModal.printercontrol-dark .btn-secondary { background:#3b3b3b !important; color:#fff !important; border-color:#666 !important; }',
                '#pluginPermModal.printercontrol-dark .btn-outline-secondary { background:#303030 !important; color:#ddd !important; border-color:#707070 !important; }',
                '#pluginPermModal.printercontrol-dark .btn-outline-primary { background:#24384d !important; color:#8ec5ff !important; border-color:#4a90d9 !important; }',
                '#pluginPermModal.printercontrol-dark .card, #pluginPermModal.printercontrol-dark .list-group-item, #pluginPermModal.printercontrol-dark .dropdown-menu, #pluginPermModal.printercontrol-dark .autocomplete-items, #pluginPermModal.printercontrol-dark .autocomplete-items div { background:#292929 !important; color:#e8eaed !important; border-color:#505050 !important; }',
                '#pluginPermModal.printercontrol-dark a { color:#8ec5ff !important; }'
            ].join("\n");
            (document.head || document.documentElement).appendChild(style);
        }

        function parseRgb(value) {
            var match = String(value || "").match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/i);
            if (!match) return null;
            return {
                r: parseInt(match[1], 10),
                g: parseInt(match[2], 10),
                b: parseInt(match[3], 10),
                a: match[4] == null ? 1 : parseFloat(match[4])
            };
        }

        function elementSignalsDark(element) {
            if (!element) return false;
            var className = " " + String(element.className || "").toLowerCase() + " ";
            if (className.indexOf(" night ") >= 0 || className.indexOf(" dark ") >= 0 || className.indexOf(" dark-mode ") >= 0 || className.indexOf(" darkmode ") >= 0) return true;
            try {
                var rgb = parseRgb(window.getComputedStyle(element).backgroundColor);
                if (rgb && rgb.a > 0.15) {
                    var luminance = (0.2126 * rgb.r) + (0.7152 * rgb.g) + (0.0722 * rgb.b);
                    if (luminance < 105) return true;
                }
            } catch (ignore) { }
            return false;
        }

        function pageIsDark() {
            var candidates = [
                document.body,
                document.documentElement,
                document.getElementById("container"),
                document.getElementById("column_l"),
                document.getElementById("p42")
            ];
            for (var i = 0; i < candidates.length; i++) {
                if (elementSignalsDark(candidates[i])) return true;
            }
            return false;
        }

        function applyThemeToDialog() {
            ensureStyle();
            var modal = document.getElementById("pluginPermModal");
            if (!modal) return;
            var dark = pageIsDark();
            if (dark) {
                modal.classList.add("printercontrol-dark");
            } else {
                modal.classList.remove("printercontrol-dark");
            }
        }

        ensureStyle();
        applyThemeToDialog();

        // Avoid a permanent MutationObserver on MeshCentral's entire DOM. The
        // permissions window can be opened by either a button click or an Action
        // select change. Listen only for those user events and inspect compact
        // attributes instead of reading textContent from large page containers.
        if (!window.__printerControlPermissionsThemeEventHandler) {
            var permissionEventHandler = function (event) {
                var target = event && event.target;
                var relevant = false;
                while (target && target !== document) {
                    var id = String(target.id || "").toLowerCase();
                    var onclick = "";
                    var value = "";
                    var label = "";
                    var selectedText = "";
                    try { onclick = String(target.getAttribute && target.getAttribute("onclick") || "").toLowerCase(); } catch (ignore) { }
                    try { value = String(target.value || "").toLowerCase(); } catch (ignoreValue) { }
                    try {
                        label = String(target.getAttribute && (target.getAttribute("aria-label") || target.getAttribute("title")) || "").toLowerCase();
                    } catch (ignoreLabel) { }
                    try {
                        if (target.options && target.selectedIndex >= 0 && target.options[target.selectedIndex]) {
                            selectedText = String(target.options[target.selectedIndex].text || target.options[target.selectedIndex].textContent || "").toLowerCase();
                        }
                    } catch (ignoreOption) { }
                    var tagName = String(target.tagName || "").toLowerCase();
                    var compactText = "";
                    if (tagName === "button" || tagName === "a" || tagName === "label" || tagName === "option") {
                        try { compactText = String(target.textContent || "").replace(/^\s+|\s+$/g, "").toLowerCase(); } catch (ignoreText) { }
                    }
                    if (id.indexOf("pluginperm") >= 0 || onclick.indexOf("pluginperm") >= 0 ||
                            onclick.indexOf("permission") >= 0 || value.indexOf("permission") >= 0 ||
                            label.indexOf("permission") >= 0 || selectedText.indexOf("permission") >= 0 ||
                            compactText === "permissions") {
                        relevant = true;
                        break;
                    }
                    target = target.parentNode;
                }
                if (!relevant) return;
                window.setTimeout(applyThemeToDialog, 0);
                window.setTimeout(applyThemeToDialog, 50);
                window.setTimeout(applyThemeToDialog, 200);
            };
            document.addEventListener("click", permissionEventHandler, true);
            document.addEventListener("change", permissionEventHandler, true);
            window.__printerControlPermissionsThemeEventHandler = permissionEventHandler;
        }

        // Expose a tiny diagnostic helper in the browser console.
        window.printerControlApplyPermissionsTheme = applyThemeToDialog;
    };

    obj.onDeviceRefreshEnd = function (nodeid) {
        if (typeof currentNode === "undefined" || currentNode == null) return;
        // Some freshly connected or older agents do not populate osdesc. In
        // that case expose the tab and let MeshCore perform the authoritative
        // process.platform check. Hide it only for an explicitly non-Windows OS.
        var osDescription = currentNode.osdesc == null ? "" : String(currentNode.osdesc).toLowerCase();
        if (osDescription && osDescription.indexOf("windows") < 0) return;

        pluginHandler.registerPluginTab({
            tabTitle: "Printers",
            tabId: "pluginPrinterControl"
        });

        var nodeKey = encodeURIComponent(String(nodeid || ""));
        var page = document.getElementById("pluginPrinterControl");
        if (!page) return;

        // Reuse the existing iframe for repeated device refresh callbacks. When
        // MeshCentral refreshes the device while Desktop is opening, do not reload
        // the plugin and do not start another printer inventory operation.
        var existing = document.getElementById("pluginIframePrinterControl");
        if (existing && !page.contains(existing)) existing = null;
        var existingNodeKey = existing ? String(existing.getAttribute("data-nodeid") || "") : "";
        if (existing && existingNodeKey !== nodeKey) {
            try {
                if (existing.contentWindow && existing.contentWindow.PrinterControl &&
                        typeof existing.contentWindow.PrinterControl.unsubscribeJobs === "function") {
                    existing.contentWindow.PrinterControl.unsubscribeJobs();
                }
            } catch (ignore) { }
            try {
                if (existing.parentNode) existing.parentNode.removeChild(existing);
            } catch (ignoreRemove) { }
            existing = null;
        }

        page.setAttribute("data-printercontrol-nodeid", nodeKey);
        if (!existing || existingNodeKey !== nodeKey) {
            // QA() appends through innerHTML and can recreate an existing iframe.
            // Replace the page explicitly so repeated device-refresh callbacks
            // cannot leave multiple placeholders or duplicate plugin frames.
            page.innerHTML = '<div id="pluginPrinterControlPlaceholder" style="padding:18px;color:#777;text-align:center">Printer Control loads only when the Printers tab is opened.</div>';
        } else {
            var stalePlaceholder = document.getElementById("pluginPrinterControlPlaceholder");
            if (stalePlaceholder && stalePlaceholder.parentNode === page) stalePlaceholder.parentNode.removeChild(stalePlaceholder);
        }

        function pageIsVisible(element) {
            if (!element) return false;
            try {
                var current = element;
                while (current && current.nodeType === 1) {
                    if (current.hidden === true) return false;
                    var style = window.getComputedStyle(current);
                    if (!style || style.display === "none" || style.visibility === "hidden" || parseFloat(style.opacity || "1") === 0) return false;
                    current = current.parentElement;
                }
                var rect = element.getBoundingClientRect();
                return rect.width > 0 && rect.height > 0;
            } catch (ignore) {
                return false;
            }
        }

        // Keep the loader generic so one click handler can survive device changes.
        window.__printerControlLoadCurrent = function (force) {
            var currentPage = document.getElementById("pluginPrinterControl");
            if (!currentPage) return false;
            var currentNodeKey = String(currentPage.getAttribute("data-printercontrol-nodeid") || "");
            if (!currentNodeKey) return false;
            var currentIframe = null;
            var frames = currentPage.querySelectorAll("iframe");
            for (var frameIndex = 0; frameIndex < frames.length; frameIndex++) {
                var candidate = frames[frameIndex];
                var candidateNodeKey = String(candidate.getAttribute("data-nodeid") || "");
                if (currentIframe == null && candidate.id === "pluginIframePrinterControl" && candidateNodeKey === currentNodeKey) {
                    currentIframe = candidate;
                } else {
                    try {
                        if (candidate.contentWindow && candidate.contentWindow.PrinterControl &&
                                typeof candidate.contentWindow.PrinterControl.unsubscribeJobs === "function") {
                            candidate.contentWindow.PrinterControl.unsubscribeJobs();
                        }
                    } catch (ignoreFrame) { }
                    try {
                        if (candidate.parentNode === currentPage) currentPage.removeChild(candidate);
                    } catch (ignoreFrameRemove) { }
                }
            }
            if (currentIframe) {
                var oldPlaceholder = document.getElementById("pluginPrinterControlPlaceholder");
                if (oldPlaceholder && oldPlaceholder.parentNode === currentPage) oldPlaceholder.parentNode.removeChild(oldPlaceholder);
                return true;
            }
            if (force !== true && !pageIsVisible(currentPage)) return false;
            currentPage.innerHTML = "";
            currentIframe = document.createElement("iframe");
            currentIframe.id = "pluginIframePrinterControl";
            currentIframe.setAttribute("data-nodeid", currentNodeKey);
            currentIframe.setAttribute("title", "Printer Control");
            currentIframe.setAttribute("scrolling", "yes");
            currentIframe.setAttribute("frameBorder", "0");
            currentIframe.style.width = "100%";
            currentIframe.style.height = "760px";
            currentIframe.style.overflow = "auto";
            currentIframe.src = "/pluginadmin.ashx?pin=printercontrol&user=1&nodeid=" + currentNodeKey;
            currentPage.appendChild(currentIframe);
            return true;
        };

        window.__printerControlStopLive = function () {
            var iframe = document.getElementById("pluginIframePrinterControl");
            if (!iframe) return;
            try {
                if (iframe.contentWindow && iframe.contentWindow.PrinterControl &&
                        typeof iframe.contentWindow.PrinterControl.stopLiveEvents === "function") {
                    iframe.contentWindow.PrinterControl.stopLiveEvents(null, true);
                }
            } catch (ignore) { }
        };

        // One lightweight, event-driven handler replaces hidden iframe polling.
        // It lazy-loads Printer Control only when Printers is selected and stops
        // live monitoring immediately when another device/plugin tab is opened.
        if (!window.__printerControlDeviceTabClickHandler) {
            var deviceTabClickHandler = function (event) {
                var target = event && event.target;
                while (target && target !== document) {
                    var id = String(target.id || "");
                    if (id.indexOf("MainDev") === 0 || id.indexOf("p19ph-") === 0) break;
                    target = target.parentNode;
                }
                if (!target || target === document) return;
                var targetId = String(target.id || "");
                if (targetId === "p19ph-pluginPrinterControl") {
                    window.setTimeout(function () {
                        if (typeof window.__printerControlLoadCurrent === "function") window.__printerControlLoadCurrent(true);
                    }, 0);
                } else if (targetId === "MainDevPlugins") {
                    // The generic Plugins tab can contain several extensions.
                    // Wait for MeshCentral to reveal the persisted child tab and
                    // load only when Printer Control is actually the visible page.
                    window.setTimeout(function () {
                        if (typeof window.__printerControlLoadCurrent === "function") window.__printerControlLoadCurrent(false);
                    }, 0);
                } else if (targetId.indexOf("MainDev") === 0 || targetId.indexOf("p19ph-") === 0) {
                    if (typeof window.__printerControlStopLive === "function") window.__printerControlStopLive();
                }
            };
            document.addEventListener("click", deviceTabClickHandler, true);
            window.__printerControlDeviceTabClickHandler = deviceTabClickHandler;
        }

        // MeshCentral exposes device extensions under a generic "Plugins" tab.
        // When Printer Control is the only device plugin, give that tab and the
        // page heading a task-specific label instead.
        setTimeout(function () {
            var headers = document.getElementById("p19headers");
            var printerHeader = document.getElementById("p19ph-pluginPrinterControl");
            if (headers && printerHeader && headers.querySelectorAll("span").length === 1) {
                var mainTab = document.getElementById("MainDevPlugins");
                if (mainTab) {
                    mainTab.textContent = "Printers";
                    mainTab.setAttribute("title", "Printers");
                }

                var deviceName = document.getElementById("p19deviceName");
                var heading = deviceName && deviceName.parentNode;
                if (heading) {
                    for (var i = 0; i < heading.childNodes.length; i++) {
                        var child = heading.childNodes[i];
                        if (child.nodeType === 3 && child.nodeValue.indexOf("Plugins") >= 0) {
                            child.nodeValue = child.nodeValue.replace("Plugins", "Printers");
                            break;
                        }
                    }
                }
            }

            // If the user was already on the persisted Printers page, load now.
            if (typeof window.__printerControlLoadCurrent === "function") window.__printerControlLoadCurrent(false);
        }, 0);
    };

    obj.handleAdminReq = function (req, res) {
        if (req.query.user !== "1") {
            res.sendStatus(401);
            return;
        }
        res.render(obj.VIEWS + "printercontrol", {});
    };

    function sendToSession(session, message) {
        try {
            if (session && typeof session.send === "function") {
                session.send(message);
                return true;
            }
            if (session && session.ws) {
                session.ws.send(JSON.stringify(message));
                return true;
            }
        } catch (ex) {
            obj.debug("plugin:printercontrol", "Unable to send browser response: " + ex);
        }
        return false;
    }

    function browserMessage(type, extra) {
        var message = {
            action: "plugin",
            plugin: "printercontrol",
            method: "handlePrinterMessage",
            type: type
        };
        if (extra) {
            Object.keys(extra).forEach(function (key) { message[key] = extra[key]; });
        }
        return message;
    }

    function fail(session, action, error, requestId, clientRequestId) {
        sendToSession(session, browserMessage("result", {
            requestId: requestId || null,
            clientRequestId: clientRequestId || null,
            operation: action || null,
            success: false,
            error: String(error || "Request failed")
        }));
    }

    function isValidNodeId(nodeid) {
        // The default MeshCentral domain has an empty domain segment, producing
        // identifiers such as `node//<id>`. Named domains use `node/<domain>/<id>`.
        return typeof nodeid === "string" && /^node\/[^/]*\/[^/]+$/.test(nodeid) && nodeid.length < 512;
    }

    function withNodeRights(session, webserver, nodeid, callback) {
        var user = session && session.user;
        var domain = session && session.domain;
        if (!user || !domain || !webserver || typeof webserver.GetNodeWithRights !== "function") {
            callback(new Error("Unable to resolve the current MeshCentral user"));
            return;
        }
        webserver.GetNodeWithRights(domain, user, nodeid, function (node, rights) {
            if (!node || typeof rights !== "number" || rights === 0) {
                callback(new Error("Access to this device is denied"));
                return;
            }
            callback(null, node, rights, user);
        });
    }

    function getPermissionChecker(user, nodeid) {
        return obj.parent.getAccessPermissions("printercontrol", user, { nodeid: nodeid });
    }

    function agentIsOnline(nodeid) {
        return !!(obj.meshServer.webserver && obj.meshServer.webserver.wsagents && obj.meshServer.webserver.wsagents[nodeid]);
    }

    function sendToAgent(nodeid, command) {
        var agent = obj.meshServer.webserver && obj.meshServer.webserver.wsagents && obj.meshServer.webserver.wsagents[nodeid];
        if (!agent) return false;
        try {
            agent.send(JSON.stringify(command));
            return true;
        } catch (ex) {
            obj.debug("plugin:printercontrol", "Unable to send command to agent: " + ex);
            return false;
        }
    }

    function sourceMatchesPending(command, agent, pending) {
        var agentNodeId = agent && agent.dbNodeKey;
        if (typeof agentNodeId === "string") {
            return agentNodeId === pending.nodeid && (!command.nodeid || command.nodeid === agentNodeId);
        }
        return typeof command.nodeid === "string" && command.nodeid === pending.nodeid;
    }


    function validSubscriptionId(value) {
        return typeof value === "string" && /^[a-f0-9]{32}$/.test(value);
    }

    function validPrinterName(value) {
        return typeof value === "string" && value.length > 0 && value.length <= 256 && !/[\x00-\x1f]/.test(value);
    }

    function subscriptionBucket(nodeid, create) {
        var bucket = obj.jobSubscriptions[nodeid];
        if (!bucket && create) {
            bucket = Object.create(null);
            obj.jobSubscriptions[nodeid] = bucket;
        }
        return bucket;
    }

    function bucketHasEntries(bucket) {
        if (!bucket) return false;
        for (var key in bucket) {
            if (Object.prototype.hasOwnProperty.call(bucket, key)) return true;
        }
        return false;
    }

    function countOwn(object) {
        var count = 0;
        if (!object) return count;
        for (var key in object) {
            if (Object.prototype.hasOwnProperty.call(object, key)) count++;
        }
        return count;
    }

    function operationTimeoutMs(operation) {
        var value = OPERATION_TIMEOUTS_MS[operation];
        return typeof value === "number" && isFinite(value) && value > 0 ? value : DEFAULT_OPERATION_TIMEOUT_MS;
    }

    function totalSubscriptionCount() {
        var count = 0;
        for (var nodeid in obj.jobSubscriptions) {
            if (Object.prototype.hasOwnProperty.call(obj.jobSubscriptions, nodeid)) count += countOwn(obj.jobSubscriptions[nodeid]);
        }
        return count;
    }

    function hasAnySubscriptions() {
        for (var nodeid in obj.jobSubscriptions) {
            if (Object.prototype.hasOwnProperty.call(obj.jobSubscriptions, nodeid) && bucketHasEntries(obj.jobSubscriptions[nodeid])) return true;
        }
        return false;
    }

    function updateSubscriptionCleanupTimer() {
        var needed = hasAnySubscriptions();
        if (needed && obj.subscriptionCleanupTimer == null) {
            obj.subscriptionCleanupTimer = setInterval(cleanupJobSubscriptions, CLEANUP_INTERVAL_MS);
            if (obj.subscriptionCleanupTimer && typeof obj.subscriptionCleanupTimer.unref === "function") obj.subscriptionCleanupTimer.unref();
        } else if (!needed && obj.subscriptionCleanupTimer != null) {
            clearInterval(obj.subscriptionCleanupTimer);
            obj.subscriptionCleanupTimer = null;
        }
    }

    function releaseActiveOperation(nodeid, requestId) {
        if (nodeid && obj.activeOperations[nodeid] === requestId) delete obj.activeOperations[nodeid];
    }

    function canCoalesceRead(pending, operation, params) {
        if (!pending || pending.kind || pending.operation !== operation) return false;
        if (operation === "inventory") return true;
        if (operation !== "jobs") return false;
        var activePrinter = pending.params && pending.params.printerName;
        var requestedPrinter = params && params.printerName;
        return typeof activePrinter === "string" && activePrinter === requestedPrinter;
    }

    function notifyPendingOperation(pending, requestId, success, error, data) {
        var recipients = [{
            session: pending.session,
            clientRequestId: pending.clientRequestId || null
        }].concat(Array.isArray(pending.waiters) ? pending.waiters : []);
        for (var i = 0; i < recipients.length; i++) {
            sendToSession(recipients[i].session, browserMessage("result", {
                requestId: requestId,
                clientRequestId: recipients[i].clientRequestId || null,
                operation: pending.operation,
                success: success === true,
                error: success === true ? null : String(error || "Operation failed"),
                data: data == null ? null : data
            }));
        }
    }

    function isReadOperation(operation) {
        return operation === "inventory" || operation === "jobs";
    }

    function readQueue(nodeid, create) {
        var queue = obj.readQueues[nodeid];
        if (!queue && create) {
            queue = [];
            obj.readQueues[nodeid] = queue;
        }
        return queue;
    }

    function startPendingOperation(item) {
        if (!item || !isValidNodeId(item.nodeid)) return false;
        if (!agentIsOnline(item.nodeid)) {
            notifyPendingOperation(item, null, false, "MeshAgent is offline", null);
            return false;
        }
        if (countOwn(obj.pending) >= MAX_PENDING_REQUESTS) {
            notifyPendingOperation(item, null, false, "The printer operation queue is temporarily full", null);
            return false;
        }

        var requestId = crypto.randomBytes(18).toString("hex");
        var timeoutMs = operationTimeoutMs(item.operation);
        obj.activeOperations[item.nodeid] = requestId;
        var timer = setTimeout(function () {
            var pending = obj.pending[requestId];
            if (!pending) return;
            delete obj.pending[requestId];
            releaseActiveOperation(pending.nodeid, requestId);
            notifyPendingOperation(pending, requestId, false, "Printer operation timed out", null);
            dispatchNextRead(pending.nodeid);
        }, timeoutMs);

        obj.pending[requestId] = {
            nodeid: item.nodeid,
            operation: item.operation,
            clientRequestId: item.clientRequestId || null,
            params: item.params || {},
            waiters: Array.isArray(item.waiters) ? item.waiters : [],
            session: item.session,
            userid: item.userid,
            startedAt: Date.now(),
            timeoutMs: timeoutMs,
            timer: timer
        };

        var sent = sendToAgent(item.nodeid, {
            action: "plugin",
            plugin: "printercontrol",
            pluginaction: item.operation,
            params: item.params || {},
            requestId: requestId
        });
        if (!sent) {
            clearTimeout(timer);
            var failedPending = obj.pending[requestId];
            delete obj.pending[requestId];
            releaseActiveOperation(item.nodeid, requestId);
            notifyPendingOperation(failedPending, requestId, false, "Unable to contact MeshAgent", null);
            dispatchNextRead(item.nodeid);
            return false;
        }
        sendToSession(item.session, browserMessage("started", {
            nodeid: item.nodeid,
            operation: item.operation,
            clientRequestId: item.clientRequestId || null,
            timeoutInMs: timeoutMs
        }));
        return true;
    }

    function queueReadOperation(item, activeOperation, activeTimeoutInMs) {
        var queue = readQueue(item.nodeid, true);
        if (queue.length >= MAX_QUEUED_READS_PER_NODE) return false;
        var remainingTimeout = Number(activeTimeoutInMs);
        if (!isFinite(remainingTimeout) || remainingTimeout < 0) remainingTimeout = operationTimeoutMs(activeOperation);
        item.queuedAt = Date.now();
        queue.push(item);
        sendToSession(item.session, browserMessage("queued", {
            nodeid: item.nodeid,
            operation: item.operation,
            clientRequestId: item.clientRequestId || null,
            activeOperation: activeOperation || null,
            timeoutInMs: remainingTimeout
        }));
        return true;
    }

    function dispatchNextRead(nodeid) {
        if (obj.activeOperations[nodeid]) return;
        var queue = readQueue(nodeid, false);
        if (!queue || queue.length === 0) {
            delete obj.readQueues[nodeid];
            return;
        }
        while (queue.length > 0) {
            var next = queue.shift();
            if (!next || (Date.now() - Number(next.queuedAt || 0)) > QUEUED_READ_TTL_MS) {
                if (next) notifyPendingOperation(next, null, false, "Queued printer read expired", null);
                continue;
            }
            if (queue.length === 0) delete obj.readQueues[nodeid];
            if (!startPendingOperation(next)) {
                setTimeout(function () { dispatchNextRead(nodeid); }, 0);
            }
            return;
        }
        delete obj.readQueues[nodeid];
    }

    function removeSubscriptionsForSession(nodeid, session) {
        var bucket = subscriptionBucket(nodeid, false);
        if (!bucket) return;
        for (var id in bucket) {
            if (Object.prototype.hasOwnProperty.call(bucket, id) && bucket[id] && bucket[id].session === session) delete bucket[id];
        }
        updateSubscriptionCleanupTimer();
    }

    function failSubscriptionsForNode(nodeid, error) {
        var bucket = subscriptionBucket(nodeid, false);
        if (bucket) {
            for (var id in bucket) {
                if (!Object.prototype.hasOwnProperty.call(bucket, id)) continue;
                var sub = bucket[id];
                if (sub && sub.session) {
                    sendToSession(sub.session, browserMessage("watcherStatus", {
                        nodeid: nodeid,
                        success: false,
                        error: String(error || "Print-job event watcher stopped")
                    }));
                }
            }
        }
        delete obj.jobSubscriptions[nodeid];
        delete obj.watcherLeaseRenewed[nodeid];
        delete obj.watcherState[nodeid];
        updateSubscriptionCleanupTimer();
    }

    function sendWatcherControl(nodeid, action, session, userid, params) {
        if (!agentIsOnline(nodeid)) return false;
        if (countOwn(obj.pending) >= MAX_PENDING_REQUESTS) return false;
        var requestId = crypto.randomBytes(18).toString("hex");
        if (action === "watchJobsStart") obj.watcherState[nodeid] = "starting";
        if (action === "watchJobsStop") obj.watcherState[nodeid] = "stopping";
        var timer = setTimeout(function () {
            var pending = obj.pending[requestId];
            if (!pending) return;
            delete obj.pending[requestId];
            if (pending.kind === "watcherStart") {
                failSubscriptionsForNode(pending.nodeid, "Print-job event watcher timed out");
            } else {
                delete obj.watcherState[pending.nodeid];
            }
        }, 30000);
        obj.pending[requestId] = {
            kind: action === "watchJobsStart" ? "watcherStart" : "watcherStop",
            nodeid: nodeid,
            operation: action,
            session: session || null,
            userid: userid || null,
            timer: timer
        };
        var sent = sendToAgent(nodeid, {
            action: "plugin",
            plugin: "printercontrol",
            pluginaction: action,
            params: params || {},
            requestId: requestId
        });
        if (!sent) {
            clearTimeout(timer);
            delete obj.pending[requestId];
            delete obj.watcherState[nodeid];
        }
        return sent;
    }

    function renewWatcherLease(nodeid, force) {
        if (!agentIsOnline(nodeid)) return false;
        var now = Date.now();
        var previous = obj.watcherLeaseRenewed[nodeid] || 0;
        if (force !== true && (now - previous) < AGENT_LEASE_RENEW_MIN_MS) return true;
        obj.watcherLeaseRenewed[nodeid] = now;
        return sendToAgent(nodeid, {
            action: "plugin",
            plugin: "printercontrol",
            pluginaction: "watchJobsKeepAlive",
            params: { leaseMs: AGENT_WATCHER_LEASE_MS }
        });
    }

    function stopWatcherIfUnused(nodeid) {
        var bucket = subscriptionBucket(nodeid, false);
        if (bucketHasEntries(bucket)) return;
        delete obj.jobSubscriptions[nodeid];
        delete obj.watcherLeaseRenewed[nodeid];
        updateSubscriptionCleanupTimer();
        if (obj.watcherState[nodeid] && obj.watcherState[nodeid] !== "stopping") {
            sendWatcherControl(nodeid, "watchJobsStop", null, null, {});
        }
    }

    function expireSubscription(nodeid, id, subscription, reason) {
        var bucket = subscriptionBucket(nodeid, false);
        if (bucket && bucket[id] === subscription) delete bucket[id];
        if (subscription && subscription.session) {
            sendToSession(subscription.session, browserMessage("subscriptionExpired", {
                nodeid: nodeid,
                subscriptionId: id,
                reason: reason || "Live monitoring expired"
            }));
        }
        updateSubscriptionCleanupTimer();
    }

    function cleanupJobSubscriptions() {
        var now = Date.now();
        for (var nodeid in obj.jobSubscriptions) {
            if (!Object.prototype.hasOwnProperty.call(obj.jobSubscriptions, nodeid)) continue;
            var bucket = obj.jobSubscriptions[nodeid];
            var online = agentIsOnline(nodeid);
            for (var id in bucket) {
                if (!Object.prototype.hasOwnProperty.call(bucket, id)) continue;
                var sub = bucket[id];
                var reason = null;
                if (!online) reason = "MeshAgent went offline; live monitoring was stopped.";
                else if (!sub || (now - sub.updated) > SUBSCRIPTION_TTL_MS) reason = "Live monitoring heartbeat expired.";
                else if ((now - sub.created) > SUBSCRIPTION_MAX_MS) reason = "Live monitoring reached the 10-minute safety limit.";
                if (reason) expireSubscription(nodeid, id, sub, reason);
            }
            stopWatcherIfUnused(nodeid);
        }
        updateSubscriptionCleanupTimer();
    }

    function handleJobSubscription(command, session, webserver, subscribe) {
        var operation = subscribe ? "subscribeJobs" : "unsubscribeJobs";
        if (!isValidNodeId(command.nodeid)) {
            fail(session, operation, "Invalid node identifier");
            return;
        }
        var params = command.params;
        if (!params || typeof params !== "object" || Array.isArray(params) || !validSubscriptionId(params.subscriptionId)) {
            fail(session, operation, "Invalid job-event subscription");
            return;
        }
        if (subscribe && !validPrinterName(params.printerName)) {
            fail(session, operation, "Invalid printer name");
            return;
        }

        withNodeRights(session, webserver, command.nodeid, function (err, node, rights, user) {
            if (err) {
                fail(session, operation, err.message);
                return;
            }
            getPermissionChecker(user, command.nodeid).then(function (hasPermission) {
                if (!hasPermission("can_view")) {
                    fail(session, operation, "Plugin permission denied: can_view");
                    return;
                }
                var bucket = subscriptionBucket(command.nodeid, subscribe);
                if (!subscribe) {
                    if (bucket && bucket[params.subscriptionId] && bucket[params.subscriptionId].session === session) {
                        delete bucket[params.subscriptionId];
                    }
                    sendToSession(session, browserMessage("subscription", {
                        nodeid: command.nodeid,
                        success: true,
                        active: false,
                        subscriptionId: params.subscriptionId
                    }));
                    stopWatcherIfUnused(command.nodeid);
                    return;
                }
                if (!agentIsOnline(command.nodeid)) {
                    fail(session, operation, "MeshAgent is offline");
                    return;
                }
                var existing = bucket[params.subscriptionId];
                var bucketWasEmpty = !bucketHasEntries(bucket);
                if (!existing && countOwn(bucket) >= MAX_SUBSCRIPTIONS_PER_NODE) {
                    if (!bucketHasEntries(bucket)) delete obj.jobSubscriptions[command.nodeid];
                    fail(session, operation, "Too many live-monitoring subscriptions for this device");
                    return;
                }
                if (!existing && totalSubscriptionCount() >= MAX_SUBSCRIPTIONS_TOTAL) {
                    if (!bucketHasEntries(bucket)) delete obj.jobSubscriptions[command.nodeid];
                    fail(session, operation, "The live-monitoring subscription limit was reached");
                    return;
                }
                var now = Date.now();
                bucket[params.subscriptionId] = {
                    session: session,
                    userid: user._id,
                    printerName: params.printerName,
                    printerNameLower: params.printerName.toLowerCase(),
                    created: now,
                    updated: now
                };
                updateSubscriptionCleanupTimer();
                sendToSession(session, browserMessage("subscription", {
                    nodeid: command.nodeid,
                    success: true,
                    active: true,
                    subscriptionId: params.subscriptionId,
                    printerName: params.printerName
                }));
                if (bucketWasEmpty && !sendWatcherControl(command.nodeid, "watchJobsStart", session, user._id, { leaseMs: AGENT_WATCHER_LEASE_MS })) {
                    delete bucket[params.subscriptionId];
                    updateSubscriptionCleanupTimer();
                    sendToSession(session, browserMessage("watcherStatus", {
                        nodeid: command.nodeid,
                        success: false,
                        error: "Unable to contact MeshAgent for print-job events"
                    }));
                    stopWatcherIfUnused(command.nodeid);
                } else if (!bucketWasEmpty && obj.watcherState[command.nodeid] === "active") {
                    renewWatcherLease(command.nodeid, false);
                }
            }).catch(function (permissionError) {
                fail(session, operation, permissionError.message || permissionError);
            });
        });
    }

    function handleJobHeartbeat(command, session) {
        var params = command.params;
        if (!isValidNodeId(command.nodeid) || !params || typeof params !== "object" || Array.isArray(params) || !validSubscriptionId(params.subscriptionId)) {
            fail(session, "heartbeatJobs", "Invalid live-monitoring heartbeat");
            return;
        }
        var bucket = subscriptionBucket(command.nodeid, false);
        var sub = bucket && bucket[params.subscriptionId];
        var user = session && session.user;
        if (!sub || sub.session !== session || !user || sub.userid !== user._id) {
            sendToSession(session, browserMessage("heartbeat", {
                nodeid: command.nodeid,
                subscriptionId: params.subscriptionId,
                success: false,
                error: "Live monitoring subscription is no longer active"
            }));
            return;
        }
        var now = Date.now();
        if ((now - sub.created) > SUBSCRIPTION_MAX_MS) {
            expireSubscription(command.nodeid, params.subscriptionId, sub, "Live monitoring reached the 10-minute safety limit.");
            stopWatcherIfUnused(command.nodeid);
            return;
        }
        sub.updated = now;
        if (!renewWatcherLease(command.nodeid, false)) {
            expireSubscription(command.nodeid, params.subscriptionId, sub, "Unable to renew the MeshAgent live-monitoring lease.");
            stopWatcherIfUnused(command.nodeid);
            return;
        }
        sendToSession(session, browserMessage("heartbeat", {
            nodeid: command.nodeid,
            subscriptionId: params.subscriptionId,
            success: true,
            expiresInMs: Math.max(0, SUBSCRIPTION_MAX_MS - (now - sub.created))
        }));
    }

    function sanitizeJobEvent(command) {
        var event = command.event;
        if (!event || typeof event !== "object" || Array.isArray(event)) return null;
        if (!validPrinterName(event.printerName)) return null;
        var jobs = [];
        if (Array.isArray(event.jobs)) {
            for (var i = 0; i < event.jobs.length && i < 250; i++) {
                var job = event.jobs[i];
                if (!job || typeof job !== "object" || Array.isArray(job)) continue;
                jobs.push({
                    id: typeof job.id === "number" ? job.id : parseInt(job.id, 10) || 0,
                    documentName: typeof job.documentName === "string" ? job.documentName.substring(0, 512) : "",
                    userName: typeof job.userName === "string" ? job.userName.substring(0, 256) : "",
                    jobStatus: typeof job.jobStatus === "string" ? job.jobStatus.substring(0, 128) : "",
                    totalPages: typeof job.totalPages === "number" ? job.totalPages : parseInt(job.totalPages, 10) || 0,
                    pagesPrinted: typeof job.pagesPrinted === "number" ? job.pagesPrinted : parseInt(job.pagesPrinted, 10) || 0,
                    size: typeof job.size === "number" ? job.size : parseInt(job.size, 10) || 0,
                    submittedTime: typeof job.submittedTime === "string" ? job.submittedTime.substring(0, 64) : null,
                    recentCompleted: job.recentCompleted === true
                });
            }
        }
        return {
            eventType: typeof event.eventType === "string" ? event.eventType.substring(0, 80) : "changed",
            printerName: event.printerName.substring(0, 256),
            jobId: typeof event.jobId === "number" ? event.jobId : parseInt(event.jobId, 10) || 0,
            document: typeof event.document === "string" ? event.document.substring(0, 512) : "",
            owner: typeof event.owner === "string" ? event.owner.substring(0, 256) : "",
            status: typeof event.status === "string" ? event.status.substring(0, 128) : "",
            timestamp: typeof event.timestamp === "string" ? event.timestamp.substring(0, 64) : new Date().toISOString(),
            jobs: jobs
        };
    }

    function handleAgentPush(command, agent) {
        var nodeid = agent && agent.dbNodeKey;
        if (!isValidNodeId(nodeid)) return;
        if (command.nodeid && command.nodeid !== nodeid) return;

        if (command.pluginaction === "jobQueueChanged") {
            var event = sanitizeJobEvent(command);
            if (!event) return;
            var bucket = subscriptionBucket(nodeid, false);
            if (!bucket) return;
            var eventPrinter = event.printerName.toLowerCase();
            for (var id in bucket) {
                if (!Object.prototype.hasOwnProperty.call(bucket, id)) continue;
                var sub = bucket[id];
                if (!sub || (Date.now() - sub.updated) > SUBSCRIPTION_TTL_MS || (Date.now() - sub.created) > SUBSCRIPTION_MAX_MS) {
                    expireSubscription(nodeid, id, sub, "Live monitoring subscription expired.");
                    continue;
                }
                if (sub.printerNameLower !== eventPrinter) continue;
                if (!sendToSession(sub.session, browserMessage("jobEvent", {
                    nodeid: nodeid,
                    subscriptionId: id,
                    event: event
                }))) {
                    delete bucket[id];
                }
            }
            stopWatcherIfUnused(nodeid);
            return;
        }

        if (command.pluginaction === "jobWatcherStatus") {
            var statusBucket = subscriptionBucket(nodeid, false);
            if (!statusBucket) return;
            if (command.success !== true) {
                failSubscriptionsForNode(nodeid, command.error || "Print-job watcher stopped");
                stopWatcherIfUnused(nodeid);
                return;
            }
            for (var subId in statusBucket) {
                if (!Object.prototype.hasOwnProperty.call(statusBucket, subId)) continue;
                if (!sendToSession(statusBucket[subId].session, browserMessage("watcherStatus", {
                    nodeid: nodeid,
                    success: true,
                    error: null
                }))) {
                    delete statusBucket[subId];
                }
            }
            obj.watcherState[nodeid] = "active";
            renewWatcherLease(nodeid, true);
            stopWatcherIfUnused(nodeid);
        }
    }

    function handlePermissions(command, session, webserver) {
        if (!isValidNodeId(command.nodeid)) {
            fail(session, "getPermissions", "Invalid node identifier");
            return;
        }
        withNodeRights(session, webserver, command.nodeid, function (err, node, rights, user) {
            if (err) {
                fail(session, "getPermissions", err.message);
                return;
            }
            getPermissionChecker(user, command.nodeid).then(function (hasPermission) {
                sendToSession(session, browserMessage("permissions", {
                    nodeid: command.nodeid,
                    online: agentIsOnline(command.nodeid),
                    permissions: hasPermission("_ALL_")
                }));
            }).catch(function (permissionError) {
                fail(session, "getPermissions", permissionError.message || permissionError);
            });
        });
    }

    function handleBrowserOperation(command, session, webserver) {
        var operation = command.pluginaction;
        var requiredPermission = ACTION_PERMISSIONS[operation];
        var clientRequestId = typeof command.clientRequestId === "string" && /^[a-f0-9]{32}$/.test(command.clientRequestId) ? command.clientRequestId : null;
        if (!requiredPermission) {
            fail(session, operation, "Unsupported printer operation");
            return;
        }
        if (!isValidNodeId(command.nodeid)) {
            fail(session, operation, "Invalid node identifier");
            return;
        }
        if (command.params != null && (typeof command.params !== "object" || Array.isArray(command.params))) {
            fail(session, operation, "Invalid operation parameters");
            return;
        }

        withNodeRights(session, webserver, command.nodeid, function (err, node, rights, user) {
            if (err) {
                fail(session, operation, err.message);
                return;
            }
            getPermissionChecker(user, command.nodeid).then(function (hasPermission) {
                if (!hasPermission(requiredPermission)) {
                    fail(session, operation, "Plugin permission denied: " + requiredPermission);
                    return;
                }
                if (operation === "deletePrinter" && command.params && command.params.deleteDriver === true && !hasPermission("manage_drivers")) {
                    fail(session, operation, "Plugin permission denied: manage_drivers");
                    return;
                }
                if (!agentIsOnline(command.nodeid)) {
                    fail(session, operation, "MeshAgent is offline");
                    return;
                }
                // Serialize all PowerShell work per endpoint. This protects the
                // shared MeshAgent process from overlapping reads and mutations
                // initiated by repeated clicks or multiple browser sessions.
                var activeRequestId = obj.activeOperations[command.nodeid];
                if (activeRequestId) {
                    var activePending = obj.pending[activeRequestId];
                    if (!activePending) {
                        delete obj.activeOperations[command.nodeid];
                        activeRequestId = null;
                    }
                }
                if (activeRequestId) {
                    activePending = obj.pending[activeRequestId];
                    if (canCoalesceRead(activePending, operation, command.params || {}) &&
                            activePending.waiters.length < MAX_COALESCED_READ_WAITERS) {
                        activePending.waiters.push({
                            session: session,
                            userid: user._id,
                            clientRequestId: clientRequestId
                        });
                        sendToSession(session, browserMessage("started", {
                            nodeid: command.nodeid,
                            operation: operation,
                            clientRequestId: clientRequestId,
                            timeoutInMs: Math.max(0, Number(activePending.timeoutMs || operationTimeoutMs(activePending.operation)) -
                                (Date.now() - Number(activePending.startedAt || Date.now())))
                        }));
                        obj.debug("plugin:printercontrol", "Coalesced duplicate " + operation + " request for " + command.nodeid);
                        return;
                    }
                    if (isReadOperation(operation)) {
                        if (!queueReadOperation({
                            nodeid: command.nodeid,
                            operation: operation,
                            clientRequestId: clientRequestId,
                            params: command.params || {},
                            waiters: [],
                            session: session,
                            userid: user._id
                        }, activePending && activePending.operation,
                            activePending ? Math.max(0, Number(activePending.timeoutMs || operationTimeoutMs(activePending.operation)) -
                                (Date.now() - Number(activePending.startedAt || Date.now()))) : operationTimeoutMs(operation))) {
                            fail(session, operation, "Too many printer reads are already waiting for this device", null, clientRequestId);
                        }
                        return;
                    }
                    fail(session, operation, "A " + String((activePending && activePending.operation) || "printer") + " operation is already running for this device", null, clientRequestId);
                    return;
                }
                startPendingOperation({
                    nodeid: command.nodeid,
                    operation: operation,
                    clientRequestId: clientRequestId,
                    params: command.params || {},
                    waiters: [],
                    session: session,
                    userid: user._id
                });
            }).catch(function (permissionError) {
                fail(session, operation, permissionError.message || permissionError);
            });
        });
    }

    function handleAgentResult(command, agent) {
        if (command.pluginaction !== "operationResult" || typeof command.requestId !== "string") return;
        var pending = obj.pending[command.requestId];
        if (!pending) return;

        if (!sourceMatchesPending(command, agent, pending)) {
            obj.debug("plugin:printercontrol", "Dropped response with mismatched node id");
            return;
        }

        clearTimeout(pending.timer);
        delete obj.pending[command.requestId];

        if (pending.kind === "watcherStart" || pending.kind === "watcherStop") {
            if (pending.kind === "watcherStart") {
                if (command.success !== true) {
                    failSubscriptionsForNode(pending.nodeid, command.error || "Unable to start print-job watcher");
                } else if (bucketHasEntries(subscriptionBucket(pending.nodeid, false))) {
                    obj.watcherState[pending.nodeid] = "active";
                    var startBucket = subscriptionBucket(pending.nodeid, false);
                    for (var startId in startBucket) {
                        if (!Object.prototype.hasOwnProperty.call(startBucket, startId)) continue;
                        sendToSession(startBucket[startId].session, browserMessage("watcherStatus", {
                            nodeid: pending.nodeid,
                            success: true,
                            error: null
                        }));
                    }
                    renewWatcherLease(pending.nodeid, true);
                } else {
                    stopWatcherIfUnused(pending.nodeid);
                }
            } else {
                delete obj.watcherState[pending.nodeid];
            }
            return;
        }

        releaseActiveOperation(pending.nodeid, command.requestId);

        var auditRecord = {
            time: new Date().toISOString(),
            nodeid: pending.nodeid,
            userid: pending.userid,
            operation: pending.operation,
            success: command.success === true
        };
        if (command.success !== true) {
            auditRecord.error = String(command.error || "Operation failed").substring(0, 500);
        }
        obj.debug("plugin:printercontrol", "audit " + JSON.stringify(auditRecord));
        notifyPendingOperation(
            pending,
            command.requestId,
            command.success === true,
            command.error || "Operation failed",
            command.data
        );
        dispatchNextRead(pending.nodeid);
    }

    obj.serveraction = function (command, myparent, grandparent) {
        if (!command || command.plugin !== "printercontrol") return;

        // Agent-originated messages do not have a logged-in user attached.
        if (!myparent || !myparent.user) {
            if (command.pluginaction === "operationResult") {
                handleAgentResult(command, myparent);
            } else {
                handleAgentPush(command, myparent);
            }
            return;
        }

        if (command.pluginaction === "getPermissions") {
            handlePermissions(command, myparent, grandparent);
            return;
        }
        if (command.pluginaction === "subscribeJobs") {
            handleJobSubscription(command, myparent, grandparent, true);
            return;
        }
        if (command.pluginaction === "unsubscribeJobs") {
            handleJobSubscription(command, myparent, grandparent, false);
            return;
        }
        if (command.pluginaction === "heartbeatJobs") {
            handleJobHeartbeat(command, myparent);
            return;
        }
        handleBrowserOperation(command, myparent, grandparent);
    };

    return obj;
};
