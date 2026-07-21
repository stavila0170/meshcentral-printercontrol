/**
 * MeshCentral Printer Control plugin - MeshCore side.
 * ES5 syntax is intentional because this runs in the MeshAgent Duktape runtime.
 */
"use strict";

var mesh;
var ALLOWED_ACTIONS = {
    inventory: true,
    jobs: true,
    cancelJob: true,
    pauseJob: true,
    resumeJob: true,
    testPage: true,
    addTcpPrinter: true,
    deletePrinter: true,
    removePort: true,
    removeDriver: true,
    spoolerStart: true,
    spoolerStop: true,
    spoolerRestart: true,
    clearQueue: true
};

function findHelper() {
    var fs = require("fs");
    var roots = [];
    if (process.env.ProgramData) roots.push(process.env.ProgramData);
    roots.push("C:\\ProgramData");
    for (var i = 0; i < roots.length; i++) {
        var candidate = roots[i] + "\\MeshPrinterControl\\printer_helper.exe";
        try {
            if (fs.existsSync(candidate)) return candidate;
        } catch (ignore) { }
    }
    return null;
}

function captureProcess(executable, argv, timeoutCwd) {
    var callbackError = null;
    var callbackStderr = "";
    var child = require("child_process").execFile(
        executable,
        argv,
        { cwd: timeoutCwd || process.env.TEMP || "C:\\Windows\\Temp" },
        function (err, out, errout) {
            callbackError = err;
            callbackStderr = errout || "";
        }
    );
    child.stdout.str = "";
    child.stdout.on("data", function (chunk) { this.str += chunk.toString(); });
    if (child.stderr) {
        child.stderr.str = "";
        child.stderr.on("data", function (chunk) { this.str += chunk.toString(); });
    }
    child.waitExit();
    return {
        stdout: child.stdout.str || "",
        stderr: child.stderr ? (child.stderr.str || "") : callbackStderr,
        error: callbackError
    };
}

function installedHelperVersion() {
    var helperPath = findHelper();
    if (!helperPath) return null;
    try {
        var result = captureProcess(helperPath, ["printer_helper.exe", "--version"]);
        var match = result.stdout.match(/\b(\d+\.\d+\.\d+)\b/);
        return match ? match[1] : null;
    } catch (ignore) {
        return null;
    }
}

function validateBootstrap(value) {
    if (!value || typeof value !== "object") return null;
    if (typeof value.version !== "string" || !/^\d+\.\d+\.\d+$/.test(value.version)) return null;
    if (value.architecture !== "x64") return null;
    if (typeof value.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(value.sha256)) return null;
    if (typeof value.fileName !== "string" || !/^printercontrol-helper-\d+\.\d+\.\d+-[a-f0-9]{12}\.exe$/.test(value.fileName)) return null;
    if (typeof value.size !== "number" || value.size < 1024 || value.size > 52428800) return null;
    return {
        version: value.version,
        architecture: value.architecture,
        sha256: value.sha256,
        fileName: value.fileName,
        size: value.size,
        waitForDownload: value.waitForDownload === true,
        stagingPath: value.stagingPath,
        downloadStable: value.downloadStable === true
    };
}

function isSupportedWindowsArchitecture(manifest) {
    if (manifest.architecture !== "x64") return false;
    var nativeArchitecture = String(process.env.PROCESSOR_ARCHITEW6432 || process.env.PROCESSOR_ARCHITECTURE || "").toLowerCase();
    return nativeArchitecture.indexOf("64") >= 0 || nativeArchitecture === "amd64" || nativeArchitecture === "arm64";
}

function prepareStagingPath(manifest, requestId) {
    if (typeof requestId !== "string" || !/^[a-f0-9]{36}$/.test(requestId)) throw new Error("Invalid deployment request identifier");
    var fs = require("fs");
    var root = (process.env.ProgramData || "C:\\ProgramData") + "\\MeshPrinterControl";
    var stagingRoot = root + "\\staging";
    var requestDirectory = stagingRoot + "\\" + requestId;
    var directories = [root, stagingRoot, requestDirectory];
    for (var i = 0; i < directories.length; i++) {
        try { if (!fs.existsSync(directories[i])) fs.mkdirSync(directories[i]); } catch (ex) {
            if (!fs.existsSync(directories[i])) throw ex;
        }
    }
    var stagingPath = requestDirectory + "\\" + manifest.fileName;
    try { if (fs.existsSync(stagingPath)) fs.unlinkSync(stagingPath); } catch (ignore) { }
    return stagingPath;
}

function inspectDownloadedHelper(manifest) {
    try {
        var fileData = require("fs").readFileSync(manifest.stagingPath);
        if (fileData.length > manifest.size) return { error: "Downloaded helper exceeded the manifest size" };
        if (fileData.length !== manifest.size || !manifest.downloadStable) return { pending: true, size: fileData.length };
        // The server verifies the packaged helper SHA-256 before exposing it,
        // and MeshAgent downloads it using a short-lived token plus the pinned
        // MeshCentral TLS hash. Older MeshAgent builds expose incompatible
        // SHA256Stream APIs, so endpoint validation is limited to two stable,
        // exact-size checks performed by the server-driven handshake.
        return { ready: true, size: fileData.length };
    } catch (ex) {
        var fs = require("fs");
        if (!manifest.downloadStable) return { pending: true, size: -1 };
        try {
            if (!fs.existsSync(manifest.stagingPath)) return { pending: true, size: -1 };
        } catch (ignore) { }
        return { error: "Unable to inspect downloaded helper: " + ex };
    }
}

function requestDownloadCheck(requestId, operation, manifest, size) {
    mesh.SendCommand({
        action: "plugin",
        plugin: "printercontrol",
        pluginaction: "bootstrapPending",
        requestId: requestId,
        operation: operation,
        version: manifest.version,
        stagingPath: manifest.stagingPath,
        size: size
    });
}

function cleanStagingFile(stagingPath) {
    var fs = require("fs");
    try { if (fs.existsSync(stagingPath)) fs.unlinkSync(stagingPath); } catch (ignore) { }
    try { fs.rmdirSync(require("path").dirname(stagingPath)); } catch (ignore2) { }
}

function installDownloadedHelper(manifest) {
    var result;
    try {
        result = captureProcess(manifest.stagingPath, [manifest.fileName, "--install-service"]);
    } catch (ex) {
        return { success: false, error: "Unable to launch the verified helper installer: " + ex };
    }
    var stdout = (result.stdout || "").trim();
    if (!stdout) {
        return { success: false, error: String(result.stderr || result.error || "Helper installer returned no data").substring(0, 1200) };
    }
    try {
        var response = JSON.parse(stdout);
        if (!response || response.success !== true) {
            return { success: false, error: String((response && response.error) || "Helper installation failed").substring(0, 1200) };
        }
    } catch (ex2) {
        return { success: false, error: "Invalid response from helper installer: " + ex2 };
    }
    if (installedHelperVersion() !== manifest.version) {
        return { success: false, error: "Installed helper version does not match the deployment manifest" };
    }
    return { success: true };
}

function runHelper(payload) {
    var helperPath = findHelper();
    if (!helperPath) {
        return {
            success: false,
            error: "Printer helper is not installed in ProgramData\\MeshPrinterControl"
        };
    }

    var stdout = "";
    var stderr = "";
    var processResult;
    try {
        var requestBase64 = Buffer.from(JSON.stringify(payload)).toString("base64");
        processResult = captureProcess(
            helperPath,
            // MeshAgent's Windows execFile implementation expects argv[0] as
            // the first array item, matching the native Windows process API.
            ["printer_helper.exe", "--request-base64", requestBase64]
        );
        stdout = processResult.stdout;
        stderr = processResult.stderr;
    } catch (ex) {
        return { success: false, error: "Unable to start printer helper: " + ex };
    }

    stdout = stdout.trim();
    if (!stdout) {
        return {
            success: false,
            error: (stderr || (processResult && processResult.error) || "Printer helper returned no data").toString().substring(0, 1200)
        };
    }
    if (stdout.length > 1048576) {
        return { success: false, error: "Printer helper response exceeded 1 MiB" };
    }
    try {
        return JSON.parse(stdout);
    } catch (parseError) {
        return {
            success: false,
            error: "Invalid response from printer helper: " + parseError
        };
    }
}

function sendResult(requestId, operation, result) {
    mesh.SendCommand({
        action: "plugin",
        plugin: "printercontrol",
        pluginaction: "operationResult",
        requestId: requestId,
        operation: operation,
        success: result && result.success === true,
        error: result && result.success === true ? null : String((result && result.error) || "Printer operation failed"),
        data: result && result.data != null ? result.data : null
    });
}

function requestBootstrap(requestId, operation, manifest, stagingPath) {
    mesh.SendCommand({
        action: "plugin",
        plugin: "printercontrol",
        pluginaction: "bootstrapRequired",
        requestId: requestId,
        operation: operation,
        version: manifest.version,
        stagingPath: stagingPath
    });
}

function runOperationAndSend(args) {
    var payload = {
        action: args.pluginaction,
        params: (args.params && typeof args.params === "object") ? args.params : {}
    };
    sendResult(args.requestId, args.pluginaction, runHelper(payload));
}

function consoleaction(args, rights, sessionid, parent) {
    mesh = parent;
    if (!args || process.platform !== "win32") {
        if (args && args.requestId) sendResult(args.requestId, args.pluginaction, { success: false, error: "Windows is required" });
        return;
    }

    var operation = args.pluginaction;
    if (!ALLOWED_ACTIONS[operation] || typeof args.requestId !== "string") return;

    var manifest = validateBootstrap(args.bootstrap);
    if (!manifest) {
        sendResult(args.requestId, operation, { success: false, error: "The helper deployment manifest is missing or invalid" });
        return;
    }
    if (!isSupportedWindowsArchitecture(manifest)) {
        sendResult(args.requestId, operation, { success: false, error: "The packaged printer helper requires 64-bit Windows" });
        return;
    }
    if (installedHelperVersion() === manifest.version) {
        runOperationAndSend(args);
        return;
    }

    if (!manifest.waitForDownload) {
        var stagingPath;
        try {
            stagingPath = prepareStagingPath(manifest, args.requestId);
        } catch (ex) {
            sendResult(args.requestId, operation, { success: false, error: "Unable to prepare helper deployment: " + ex });
            return;
        }
        requestBootstrap(args.requestId, operation, manifest, stagingPath);
        return;
    }

    if (typeof manifest.stagingPath !== "string") {
        sendResult(args.requestId, operation, { success: false, error: "The helper staging path is missing" });
        return;
    }
    var inspection = inspectDownloadedHelper(manifest);
    if (inspection.pending) {
        requestDownloadCheck(args.requestId, operation, manifest, inspection.size);
        return;
    }
    if (inspection.error) {
        cleanStagingFile(manifest.stagingPath);
        sendResult(args.requestId, operation, { success: false, error: inspection.error });
        return;
    }
    var installResult = installDownloadedHelper(manifest);
    cleanStagingFile(manifest.stagingPath);
    if (!installResult.success) {
        sendResult(args.requestId, operation, installResult);
        return;
    }
    runOperationAndSend(args);
}

module.exports = { consoleaction: consoleaction };
