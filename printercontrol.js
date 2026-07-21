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
    var fs = require("fs");
    var path = require("path");
    var obj = {};

    obj.parent = parent;
    obj.meshServer = parent.parent;
    obj.debug = obj.meshServer.debug;
    obj.VIEWS = __dirname + "/views/";
    obj.pending = Object.create(null);
    obj.deployment = null;
    obj.deploymentError = null;
    obj.exports = ["onDeviceRefreshEnd"];

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

    function loadDeploymentAsset() {
        var assetDirectory = path.join(__dirname, "assets", "windows-x64");
        var manifestPath = path.join(assetDirectory, "manifest.json");
        var manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
        if (!manifest || typeof manifest.version !== "string" || !/^\d+\.\d+\.\d+$/.test(manifest.version)) {
            throw new Error("Invalid helper deployment version");
        }
        if (manifest.architecture !== "x64" || manifest.file !== "printer_helper.exe" || typeof manifest.size !== "number" || manifest.size < 1024) {
            throw new Error("Invalid helper deployment manifest");
        }
        if (typeof manifest.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(manifest.sha256)) {
            throw new Error("Invalid helper SHA-256 in deployment manifest");
        }

        var assetPath = path.join(assetDirectory, manifest.file);
        var stat = fs.statSync(assetPath);
        if (!stat.isFile() || stat.size !== manifest.size) {
            throw new Error("Helper asset size does not match its manifest");
        }
        var actualHash = crypto.createHash("sha256").update(fs.readFileSync(assetPath)).digest("hex");
        if (actualHash !== manifest.sha256) {
            throw new Error("Helper asset failed SHA-256 validation");
        }

        var servedFileName = "printercontrol-helper-" + manifest.version + "-" + manifest.sha256.substring(0, 12) + ".exe";
        var temporaryDirectory = path.join(obj.meshServer.webserver.filespath, "tmp");
        fs.mkdirSync(temporaryDirectory, { recursive: true });
        var servedPath = path.join(temporaryDirectory, servedFileName);
        fs.copyFileSync(assetPath, servedPath);

        obj.deployment = {
            version: manifest.version,
            architecture: manifest.architecture,
            size: manifest.size,
            sha256: manifest.sha256,
            fileName: servedFileName,
            servedPath: servedPath
        };
    }

    function publicDeploymentManifest() {
        if (!obj.deployment) return null;
        return {
            version: obj.deployment.version,
            architecture: obj.deployment.architecture,
            size: obj.deployment.size,
            sha256: obj.deployment.sha256,
            fileName: obj.deployment.fileName
        };
    }

    obj.server_startup = function () {
        // MeshCentral defines the permission API after it constructs the plugin
        // handler, so registration must be deferred until this startup hook.
        registerPluginPermissions();
        try {
            loadDeploymentAsset();
            obj.debug("plugin:printercontrol", "Printer Control plugin started; helper " + obj.deployment.version + " is ready for automatic deployment");
        } catch (ex) {
            obj.deploymentError = String(ex && ex.message ? ex.message : ex);
            obj.debug("plugin:printercontrol", "Printer Control automatic deployment is unavailable: " + obj.deploymentError);
        }
    };

    // This function is serialized into the MeshCentral web application. Keep it
    // self-contained and use only browser globals supplied by MeshCentral.
    obj.onDeviceRefreshEnd = function (nodeid) {
        if (typeof currentNode === "undefined" || currentNode == null) return;
        if (!currentNode.osdesc || currentNode.osdesc.toLowerCase().indexOf("windows") < 0) return;
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
            } else if (session && session.ws) {
                session.ws.send(JSON.stringify(message));
            }
        } catch (ex) {
            obj.debug("plugin:printercontrol", "Unable to send browser response: " + ex);
        }
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

    function finishPendingWithError(requestId, error) {
        var pending = obj.pending[requestId];
        if (!pending) return;
        clearTimeout(pending.timer);
        if (pending.downloadTimer) clearTimeout(pending.downloadTimer);
        delete obj.pending[requestId];
        fail(pending.session, pending.operation, error, requestId);
    }

    function scheduleDownloadCheck(requestId, delay) {
        var pending = obj.pending[requestId];
        if (!pending) return;
        if (pending.downloadTimer) clearTimeout(pending.downloadTimer);
        pending.downloadTimer = setTimeout(function () {
            var current = obj.pending[requestId];
            if (!current) return;
            current.downloadTimer = null;
            if (!sendToAgent(current.nodeid, {
                action: "plugin",
                plugin: "printercontrol",
                pluginaction: current.operation,
                params: current.params,
                requestId: requestId,
                bootstrap: Object.assign(publicDeploymentManifest(), {
                    waitForDownload: true,
                    stagingPath: current.stagingPath,
                    downloadStable: current.downloadStable === true
                })
            })) {
                finishPendingWithError(requestId, "Unable to continue helper deployment");
            }
        }, delay);
    }

    function sourceMatchesPending(command, agent, pending) {
        var sourceNodeId = command.nodeid || (agent && agent.dbNodeKey);
        return !sourceNodeId || sourceNodeId === pending.nodeid;
    }

    function tlsHashForDomain(domainId) {
        var hashes = obj.meshServer.webserver && obj.meshServer.webserver.webCertificateFullHashs;
        var value = hashes && hashes[domainId];
        return value == null ? null : Buffer.from(value, "binary").toString("hex");
    }

    function isValidStagingPath(stagingPath, requestId) {
        if (!obj.deployment || typeof stagingPath !== "string" || stagingPath.length > 520 || !/^[a-f0-9]{36}$/.test(requestId)) return false;
        var normalized = stagingPath.replace(/\//g, "\\");
        var suffix = "\\MeshPrinterControl\\staging\\" + requestId + "\\" + obj.deployment.fileName;
        return /^[A-Za-z]:\\/.test(normalized) && normalized.toLowerCase().slice(-suffix.length) === suffix.toLowerCase();
    }

    function createAgentDownloadCommand(nodeid, stagingPath, requestId) {
        if (!obj.deployment) throw new Error(obj.deploymentError || "Helper deployment asset is unavailable");
        if (!isValidStagingPath(stagingPath, requestId)) throw new Error("Agent requested an invalid helper staging path");
        if (!obj.meshServer.loginCookieEncryptionKey) throw new Error("MeshCentral download encryption key is not ready");

        var domainId = nodeid.split("/")[1];
        var domain = obj.meshServer.config.domains[domainId];
        if (!domain) throw new Error("Unable to resolve the device domain");
        var cookie = obj.meshServer.encodeCookie({
            a: "tmpdl",
            d: domain.id,
            nid: nodeid,
            f: obj.deployment.fileName
        }, obj.meshServer.loginCookieEncryptionKey);
        if (!cookie) throw new Error("Unable to create the helper download token");

        return {
            action: "wget",
            overwrite: true,
            createFolder: true,
            urlpath: domain.url + "agentdownload.ashx?c=" + cookie,
            path: stagingPath,
            folder: path.win32.dirname(stagingPath),
            servertlshash: tlsHashForDomain(domainId)
        };
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
                if (!obj.deployment) {
                    fail(session, operation, "Automatic helper deployment is unavailable: " + (obj.deploymentError || "missing deployment asset"));
                    return;
                }

                var requestId = crypto.randomBytes(18).toString("hex");
                var timer = setTimeout(function () {
                    var pending = obj.pending[requestId];
                    if (!pending) return;
                    if (pending.downloadTimer) clearTimeout(pending.downloadTimer);
                    delete obj.pending[requestId];
                    fail(pending.session, pending.operation, "Printer helper request timed out", requestId);
                }, 180000);

                obj.pending[requestId] = {
                    nodeid: command.nodeid,
                    operation: operation,
                    params: command.params || {},
                    session: session,
                    userid: user._id,
                    bootstrapSent: false,
                    downloadTimer: null,
                    timer: timer
                };

                var sent = sendToAgent(command.nodeid, {
                    action: "plugin",
                    plugin: "printercontrol",
                    pluginaction: operation,
                    params: command.params || {},
                    requestId: requestId,
                    bootstrap: publicDeploymentManifest()
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

    function handleBootstrapRequired(command, agent) {
        if (typeof command.requestId !== "string") return;
        var pending = obj.pending[command.requestId];
        if (!pending || pending.bootstrapSent) return;
        if (!sourceMatchesPending(command, agent, pending)) {
            obj.debug("plugin:printercontrol", "Dropped helper deployment request with mismatched node id");
            return;
        }
        if (!obj.deployment || command.version !== obj.deployment.version) {
            finishPendingWithError(command.requestId, "Agent requested an unknown helper version");
            return;
        }

        var downloadCommand;
        try {
            downloadCommand = createAgentDownloadCommand(pending.nodeid, command.stagingPath, command.requestId);
        } catch (ex) {
            finishPendingWithError(command.requestId, ex.message || ex);
            return;
        }

        pending.bootstrapSent = true;
        pending.stagingPath = command.stagingPath;
        pending.downloadLastSize = -1;
        pending.downloadStable = false;
        if (!sendToAgent(pending.nodeid, downloadCommand)) {
            finishPendingWithError(command.requestId, "Unable to start the helper download");
            return;
        }
        scheduleDownloadCheck(command.requestId, 750);
    }

    function handleBootstrapPending(command, agent) {
        if (typeof command.requestId !== "string") return;
        var pending = obj.pending[command.requestId];
        if (!pending || !pending.bootstrapSent) return;
        if (!sourceMatchesPending(command, agent, pending)) return;
        if (!obj.deployment || command.version !== obj.deployment.version || command.stagingPath !== pending.stagingPath) {
            finishPendingWithError(command.requestId, "Agent returned an invalid helper download status");
            return;
        }
        var size = Number(command.size);
        if (!isFinite(size) || size < -1 || size > obj.deployment.size) {
            finishPendingWithError(command.requestId, "Downloaded helper exceeded the deployment manifest size");
            return;
        }
        pending.downloadStable = (size === obj.deployment.size && pending.downloadLastSize === obj.deployment.size);
        pending.downloadLastSize = size;
        scheduleDownloadCheck(command.requestId, pending.downloadStable ? 250 : 750);
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
        if (pending.downloadTimer) clearTimeout(pending.downloadTimer);
        delete obj.pending[command.requestId];
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
            if (command.pluginaction === "bootstrapRequired") {
                handleBootstrapRequired(command, myparent);
            } else if (command.pluginaction === "bootstrapPending") {
                handleBootstrapPending(command, myparent);
            } else {
                handleAgentResult(command, myparent);
            }
            return;
        }

        if (command.pluginaction === "getPermissions") {
            handlePermissions(command, myparent, grandparent);
            return;
        }
        handleBrowserOperation(command, myparent, grandparent);
    };

    return obj;
};
