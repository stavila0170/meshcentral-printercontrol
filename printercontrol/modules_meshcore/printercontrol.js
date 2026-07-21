/**
 * MeshCentral Printer Control plugin - MeshCore side.
 *
 * ES5 syntax is intentional because this runs inside MeshAgent's Duktape
 * runtime. Printer operations execute from a Gzip-compressed script expanded
 * only in Windows PowerShell memory under the existing LocalSystem Mesh Agent
 * service. No endpoint file, executable or additional service is created.
 */
"use strict";

var mesh;
var SCRIPT_VERSION = "0.4.1";
var SCRIPT_GZIP_BASE64 = "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";
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

function own(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
}

function isObject(value) {
    return value != null && typeof value === "object" && !Array.isArray(value);
}

function rejectUnexpected(params, allowed) {
    for (var key in params) {
        if (own(params, key) && !allowed[key]) return "Unexpected parameter: " + key;
    }
    return null;
}

function readString(params, name, required, maximum) {
    if (!own(params, name)) {
        if (required) throw new Error("Missing parameter: " + name);
        return null;
    }
    var value = params[name];
    if (typeof value !== "string" || value.length < 1 || value.length > maximum || /[\x00-\x1f]/.test(value)) {
        throw new Error("Invalid parameter: " + name);
    }
    return value;
}

function readBoolean(params, name, defaultValue) {
    if (!own(params, name)) return defaultValue;
    if (typeof params[name] !== "boolean") throw new Error("Invalid parameter: " + name);
    return params[name];
}

function validateParameters(operation, input) {
    var params = input == null ? {} : input;
    if (!isObject(params)) throw new Error("Operation parameters must be an object");
    var output = {};
    var unexpected;

    if (operation === "inventory" || operation === "spoolerStart" || operation === "spoolerStop" ||
            operation === "spoolerRestart" || operation === "clearQueue") {
        unexpected = rejectUnexpected(params, {});
        if (unexpected) throw new Error(unexpected);
        return output;
    }

    if (operation === "jobs" || operation === "testPage") {
        unexpected = rejectUnexpected(params, { printerName: true });
        if (unexpected) throw new Error(unexpected);
        output.printerName = readString(params, "printerName", true, 256);
        return output;
    }

    if (operation === "cancelJob" || operation === "pauseJob" || operation === "resumeJob") {
        unexpected = rejectUnexpected(params, { printerName: true, jobId: true });
        if (unexpected) throw new Error(unexpected);
        output.printerName = readString(params, "printerName", true, 256);
        if (typeof params.jobId !== "number" || !isFinite(params.jobId) || Math.floor(params.jobId) !== params.jobId ||
                params.jobId < 1 || params.jobId > 2147483647) {
            throw new Error("Invalid parameter: jobId");
        }
        output.jobId = params.jobId;
        return output;
    }

    if (operation === "addTcpPrinter") {
        unexpected = rejectUnexpected(params, { name: true, address: true, driverName: true, portName: true });
        if (unexpected) throw new Error(unexpected);
        output.name = readString(params, "name", true, 256);
        output.address = readString(params, "address", true, 255);
        output.driverName = readString(params, "driverName", true, 256);
        var portName = readString(params, "portName", false, 256);
        if (portName != null) output.portName = portName;
        return output;
    }

    if (operation === "deletePrinter") {
        unexpected = rejectUnexpected(params, { printerName: true, deletePort: true, deleteDriver: true });
        if (unexpected) throw new Error(unexpected);
        output.printerName = readString(params, "printerName", true, 256);
        output.deletePort = readBoolean(params, "deletePort", false);
        output.deleteDriver = readBoolean(params, "deleteDriver", false);
        return output;
    }

    if (operation === "removePort") {
        unexpected = rejectUnexpected(params, { portName: true });
        if (unexpected) throw new Error(unexpected);
        output.portName = readString(params, "portName", true, 256);
        return output;
    }

    if (operation === "removeDriver") {
        unexpected = rejectUnexpected(params, { driverName: true });
        if (unexpected) throw new Error(unexpected);
        output.driverName = readString(params, "driverName", true, 256);
        return output;
    }

    throw new Error("Unsupported printer operation");
}

function buildInMemoryCommand(operation, payloadBase64) {
    var command = "$ErrorActionPreference='Stop';" +
        "$b=[Convert]::FromBase64String('" + SCRIPT_GZIP_BASE64 + "');" +
        "$i=[IO.MemoryStream]::new($b);" +
        "$g=[IO.Compression.GzipStream]::new($i,[IO.Compression.CompressionMode]::Decompress);" +
        "$r=[IO.StreamReader]::new($g,[Text.Encoding]::UTF8);" +
        "$c=$r.ReadToEnd();" +
        "$r.Dispose();$g.Dispose();$i.Dispose();" +
        "& ([ScriptBlock]::Create($c)) -Action '" + operation + "' -PayloadBase64 '" + payloadBase64 + "';";
    if (command.length > 30000) throw new Error("The in-memory PowerShell command is too large");
    return command;
}

function findPowerShell() {
    var fs = require("fs");
    var systemRoot = process.env.SystemRoot || "C:\\Windows";
    var candidates = [];
    if (process.env.PROCESSOR_ARCHITEW6432) {
        candidates.push(systemRoot + "\\Sysnative\\WindowsPowerShell\\v1.0\\powershell.exe");
    }
    candidates.push(systemRoot + "\\System32\\WindowsPowerShell\\v1.0\\powershell.exe");
    for (var i = 0; i < candidates.length; i++) {
        try { if (fs.existsSync(candidates[i])) return candidates[i]; } catch (ignore) { }
    }
    throw new Error("Windows PowerShell 5.1 was not found");
}

function captureProcess(executable, argv) {
    var callbackError = null;
    var callbackStderr = "";
    var child = require("child_process").execFile(
        executable,
        argv,
        { cwd: process.env.TEMP || "C:\\Windows\\Temp" },
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

function parsePowerShellResult(stdout) {
    var text = String(stdout || "").trim();
    if (!text) throw new Error("PowerShell returned no data");
    if (text.length > 1048576) throw new Error("PowerShell response exceeded 1 MiB");
    try { return JSON.parse(text); } catch (ignore) { }

    var lines = text.split(/\r?\n/);
    for (var i = lines.length - 1; i >= 0; i--) {
        var candidate = lines[i].trim();
        if (candidate.charAt(0) === "{") {
            try { return JSON.parse(candidate); } catch (ignore2) { }
        }
    }
    throw new Error("PowerShell returned invalid JSON");
}

function runPowerShell(operation, params) {
    var powershellPath;
    try {
        powershellPath = findPowerShell();
    } catch (ex) {
        return { success: false, error: "Unable to prepare printer operations: " + ex };
    }

    var payloadBase64 = Buffer.from(JSON.stringify(params)).toString("base64");
    var inMemoryCommand;
    try {
        inMemoryCommand = buildInMemoryCommand(operation, payloadBase64);
    } catch (commandError) {
        return { success: false, error: "Unable to prepare the in-memory PowerShell command: " + commandError };
    }
    var result;
    try {
        result = captureProcess(powershellPath, [
            "powershell.exe",
            "-NoLogo",
            "-NoProfile",
            "-NonInteractive",
            "-ExecutionPolicy", "Bypass",
            "-Command", inMemoryCommand
        ]);
    } catch (ex2) {
        return { success: false, error: "Unable to start Windows PowerShell: " + ex2 };
    }

    try {
        return parsePowerShellResult(result.stdout);
    } catch (parseError) {
        var detail = String(result.stderr || result.error || parseError).substring(0, 1200);
        return { success: false, error: detail };
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

function consoleaction(args, rights, sessionid, parent) {
    mesh = parent;
    if (!args || process.platform !== "win32") {
        if (args && args.requestId) sendResult(args.requestId, args.pluginaction, { success: false, error: "Windows is required" });
        return;
    }

    var operation = args.pluginaction;
    if (!ALLOWED_ACTIONS[operation] || typeof args.requestId !== "string" || !/^[a-f0-9]{36}$/.test(args.requestId)) return;

    var params;
    try {
        params = validateParameters(operation, args.params);
    } catch (validationError) {
        sendResult(args.requestId, operation, { success: false, error: String(validationError.message || validationError) });
        return;
    }
    sendResult(args.requestId, operation, runPowerShell(operation, params));
}

module.exports = { consoleaction: consoleaction };
