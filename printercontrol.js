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
    obj.jobSubscriptions = Object.create(null);
    obj.exports = ["onWebUIStartupEnd", "onDeviceRefreshEnd"];

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
        obj.debug("plugin:printercontrol", "Printer Control 0.4.11 started in fully in-memory agent mode");
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

        // The dialog does not exist when the page starts. Observe only DOM
        // insertions plus theme attributes on the page roots. Avoid watching every
        // style/class mutation in the entire MeshCentral interface.
        if (!window.__printerControlPermissionsThemeObserver && typeof MutationObserver !== "undefined") {
            var queued = false;
            var observer = new MutationObserver(function (mutations) {
                var relevant = false;
                for (var i = 0; i < mutations.length && !relevant; i++) {
                    var mutation = mutations[i];
                    if (mutation.type === "attributes") {
                        relevant = true;
                    } else if (mutation.type === "childList") {
                        for (var j = 0; j < mutation.addedNodes.length; j++) {
                            var node = mutation.addedNodes[j];
                            if (node && node.nodeType === 1 &&
                                    (node.id === "pluginPermModal" ||
                                     (node.querySelector && node.querySelector("#pluginPermModal")))) {
                                relevant = true;
                                break;
                            }
                        }
                    }
                }
                if (!relevant || queued) return;
                queued = true;
                window.setTimeout(function () {
                    queued = false;
                    applyThemeToDialog();
                }, 0);
            });
            var observationRoot = document.body || document.documentElement;
            observer.observe(observationRoot, { childList:true, subtree:true });
            observer.observe(document.documentElement, { attributes:true, attributeFilter:["class", "style"] });
            if (document.body) observer.observe(document.body, { attributes:true, attributeFilter:["class", "style"] });
            window.__printerControlPermissionsThemeObserver = observer;
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
        QA("pluginPrinterControl", '<iframe id="pluginIframePrinterControl" title="Printer Control" style="width:100%;height:760px;overflow:auto" scrolling="yes" frameBorder="0" src="/pluginadmin.ashx?pin=printercontrol&user=1&nodeid=' + encodeURIComponent(nodeid) + '"></iframe>');

        // MeshCentral exposes device extensions under a generic "Plugins" tab.
        // When Printer Control is the only device plugin, give that tab and the
        // page heading a task-specific label instead.
        setTimeout(function () {
            var headers = document.getElementById("p19headers");
            var printerHeader = document.getElementById("p19ph-pluginPrinterControl");
            if (!headers || !printerHeader || headers.querySelectorAll("span").length !== 1) return;

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

    function fail(session, action, error, requestId) {
        sendToSession(session, browserMessage("result", {
            requestId: requestId || null,
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
        var sourceNodeId = command.nodeid || (agent && agent.dbNodeKey);
        return !sourceNodeId || sourceNodeId === pending.nodeid;
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

    function sendWatcherControl(nodeid, action, session, userid) {
        if (!agentIsOnline(nodeid)) return false;
        var requestId = crypto.randomBytes(18).toString("hex");
        var timer = setTimeout(function () {
            var pending = obj.pending[requestId];
            if (!pending) return;
            delete obj.pending[requestId];
            if (pending.kind === "watcherStart") {
                sendToSession(pending.session, browserMessage("watcherStatus", {
                    nodeid: pending.nodeid,
                    success: false,
                    error: "Print-job event watcher timed out"
                }));
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
            params: {},
            requestId: requestId
        });
        if (!sent) {
            clearTimeout(timer);
            delete obj.pending[requestId];
        }
        return sent;
    }

    function stopWatcherIfUnused(nodeid) {
        var bucket = subscriptionBucket(nodeid, false);
        if (bucketHasEntries(bucket)) return;
        delete obj.jobSubscriptions[nodeid];
        sendWatcherControl(nodeid, "watchJobsStop", null, null);
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
                bucket[params.subscriptionId] = {
                    session: session,
                    userid: user._id,
                    printerName: params.printerName,
                    printerNameLower: params.printerName.toLowerCase(),
                    updated: Date.now()
                };
                sendToSession(session, browserMessage("subscription", {
                    nodeid: command.nodeid,
                    success: true,
                    active: true,
                    subscriptionId: params.subscriptionId,
                    printerName: params.printerName
                }));
                if (!sendWatcherControl(command.nodeid, "watchJobsStart", session, user._id)) {
                    sendToSession(session, browserMessage("watcherStatus", {
                        nodeid: command.nodeid,
                        success: false,
                        error: "Unable to contact MeshAgent for print-job events"
                    }));
                }
            }).catch(function (permissionError) {
                fail(session, operation, permissionError.message || permissionError);
            });
        });
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
        var nodeid = command.nodeid || (agent && agent.dbNodeKey);
        if (!isValidNodeId(nodeid)) return;

        if (command.pluginaction === "jobQueueChanged") {
            var event = sanitizeJobEvent(command);
            if (!event) return;
            var bucket = subscriptionBucket(nodeid, false);
            if (!bucket) return;
            var eventPrinter = event.printerName.toLowerCase();
            for (var id in bucket) {
                if (!Object.prototype.hasOwnProperty.call(bucket, id)) continue;
                var sub = bucket[id];
                if (!sub || sub.printerNameLower !== eventPrinter) continue;
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
            for (var subId in statusBucket) {
                if (!Object.prototype.hasOwnProperty.call(statusBucket, subId)) continue;
                if (!sendToSession(statusBucket[subId].session, browserMessage("watcherStatus", {
                    nodeid: nodeid,
                    success: command.success === true,
                    error: command.success === true ? null : String(command.error || "Print-job watcher stopped")
                }))) {
                    delete statusBucket[subId];
                }
            }
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
                var requestId = crypto.randomBytes(18).toString("hex");
                var timer = setTimeout(function () {
                    var pending = obj.pending[requestId];
                    if (!pending) return;
                    delete obj.pending[requestId];
                    fail(pending.session, pending.operation, "Printer operation timed out", requestId);
                }, 180000);

                obj.pending[requestId] = {
                    nodeid: command.nodeid,
                    operation: operation,
                    params: command.params || {},
                    session: session,
                    userid: user._id,
                    timer: timer
                };

                var sent = sendToAgent(command.nodeid, {
                    action: "plugin",
                    plugin: "printercontrol",
                    pluginaction: operation,
                    params: command.params || {},
                    requestId: requestId
                });
                if (!sent) {
                    clearTimeout(timer);
                    delete obj.pending[requestId];
                    fail(session, operation, "Unable to contact MeshAgent", requestId);
                }
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
            if (pending.kind === "watcherStart" && pending.session) {
                sendToSession(pending.session, browserMessage("watcherStatus", {
                    nodeid: pending.nodeid,
                    success: command.success === true,
                    error: command.success === true ? null : String(command.error || "Unable to start print-job watcher")
                }));
            }
            return;
        }

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
        sendToSession(pending.session, browserMessage("result", {
            requestId: command.requestId,
            operation: pending.operation,
            success: command.success === true,
            error: command.success === true ? null : String(command.error || "Operation failed"),
            data: command.data == null ? null : command.data
        }));
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
        handleBrowserOperation(command, myparent, grandparent);
    };

    return obj;
};
