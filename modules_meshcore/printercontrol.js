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
var SCRIPT_VERSION = "0.4.10";
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
    clearQueue: true,
    watchJobsStart: true,
    watchJobsStop: true
};
var jobWatcherProcess = null;


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
            operation === "spoolerRestart" || operation === "clearQueue" ||
            operation === "watchJobsStart" || operation === "watchJobsStop") {
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

function captureProcess(executable, argv, stdinText) {
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
    // MeshAgent's Windows command-line builder can corrupt arguments that are
    // longer than roughly 4 KiB. Send the generated PowerShell program through
    // standard input instead of placing it in the -Command argument.
    if (stdinText != null && child.stdin) {
        child.stdin.write(String(stdinText));
        child.stdin.write("\r\nexit\r\n");
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
            "-Command", "-"
        ], inMemoryCommand);
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

function buildJobWatcherScript() {
    return [
        "$ErrorActionPreference='Stop'",
        "[Console]::OutputEncoding=[Text.Encoding]::UTF8",
        "$query=\"SELECT * FROM __InstanceOperationEvent WITHIN 1 WHERE TargetInstance ISA 'Win32_PrintJob'\"",
        "$watcher=New-Object System.Management.ManagementEventWatcher($query)",
        "$watcher.Start()",
        "[Console]::Out.WriteLine('{\"control\":\"ready\"}')",
        "[Console]::Out.Flush()",
        "try {",
        "  while ($true) {",
        "    $evt=$watcher.WaitForNextEvent()",
        "    $item=$evt.TargetInstance",
        "    if ($null -eq $item) { $item=$evt.PreviousInstance }",
        "    if ($null -eq $item) { continue }",
        "    $eventClass=[string]$evt.__CLASS",
        "    $name=[string]$item.Name",
        "    $printerName=$name",
        "    $jobId=0",
        "    if ($name -match '^(.*),\\s*(\\d+)$') { $printerName=$Matches[1]; $jobId=[int]$Matches[2] }",
        "    $jobs=@()",
        "    try {",
        "      $jobs=@(Get-PrintJob -PrinterName $printerName -ErrorAction Stop | Select-Object -First 250 | ForEach-Object {",
        "        [ordered]@{",
        "          id=[int]$_.Id",
        "          documentName=[string]$_.DocumentName",
        "          userName=[string]$_.UserName",
        "          jobStatus=[string]$_.JobStatus",
        "          totalPages=[int]$_.TotalPages",
        "          pagesPrinted=[int]$_.PagesPrinted",
        "          size=[long]$_.Size",
        "          submittedTime=if ($null -ne $_.SubmittedTime) { $_.SubmittedTime.ToUniversalTime().ToString('o') } else { $null }",
        "          recentCompleted=$false",
        "        }",
        "      })",
        "    } catch {}",
        "    $fallbackStatus=[string]$item.JobStatus",
        "    if ([string]::IsNullOrWhiteSpace($fallbackStatus)) {",
        "      if ($eventClass -eq '__InstanceCreationEvent') { $fallbackStatus='Queued' }",
        "      elseif ($eventClass -eq '__InstanceDeletionEvent') { $fallbackStatus='Completed' }",
        "      else { $fallbackStatus='Changed' }",
        "    }",
        "    $fallback=[ordered]@{ id=$jobId; documentName=[string]$item.Document; userName=[string]$item.Owner; jobStatus=$fallbackStatus; totalPages=[int]$item.TotalPages; pagesPrinted=[int]$item.PagesPrinted; size=[long]$item.Size; submittedTime=$null; recentCompleted=($eventClass -eq '__InstanceDeletionEvent') }",
        "    if ($eventClass -eq '__InstanceDeletionEvent') {",
        "      $remaining=@($jobs | Where-Object { [int]$_.id -ne $jobId })",
        "      $jobs=@($fallback) + $remaining",
        "    } elseif ($jobs.Count -eq 0) {",
        "      $jobs=@($fallback)",
        "    }",
        "    $payload=[ordered]@{",
        "      eventType=$eventClass",
        "      printerName=[string]$printerName",
        "      jobId=$jobId",
        "      document=[string]$item.Document",
        "      owner=[string]$item.Owner",
        "      status=$fallbackStatus",
        "      timestamp=(Get-Date).ToUniversalTime().ToString('o')",
        "      jobs=$jobs",
        "    }",
        "    [Console]::Out.WriteLine(($payload|ConvertTo-Json -Compress -Depth 4))",
        "    [Console]::Out.Flush()",
        "  }",
        "} finally {",
        "  try { $watcher.Stop() } catch {}",
        "  $watcher.Dispose()",
        "}"
    ].join("\r\n");
}

function sendWatcherStatus(success, error) {
    if (!mesh) return;
    mesh.SendCommand({
        action: "plugin",
        plugin: "printercontrol",
        pluginaction: "jobWatcherStatus",
        success: success === true,
        error: success === true ? null : String(error || "Print-job watcher stopped")
    });
}

function sendJobWatcherEvent(event) {
    if (!mesh || !event || typeof event !== "object") return;
    mesh.SendCommand({
        action: "plugin",
        plugin: "printercontrol",
        pluginaction: "jobQueueChanged",
        event: event
    });
}

function replyWatcherStart(child, result) {
    if (!child || child._printerControlStartReplied === true) return;
    child._printerControlStartReplied = true;
    if (child._printerControlReadyTimer != null) {
        clearTimeout(child._printerControlReadyTimer);
        child._printerControlReadyTimer = null;
    }
    var requestId = child._printerControlStartRequestId;
    child._printerControlStartRequestId = null;
    if (requestId) sendResult(requestId, "watchJobsStart", result);
}

function consumeWatcherOutput(child, chunk) {
    child._printerControlBuffer += String(chunk || "");
    if (child._printerControlBuffer.length > 262144) {
        child._printerControlBuffer = child._printerControlBuffer.substring(child._printerControlBuffer.length - 65536);
    }
    var newline;
    while ((newline = child._printerControlBuffer.indexOf("\n")) >= 0) {
        var line = child._printerControlBuffer.substring(0, newline).replace(/\r$/, "").trim();
        child._printerControlBuffer = child._printerControlBuffer.substring(newline + 1);
        if (!line || line.charAt(0) !== "{") continue;
        try {
            var parsed = JSON.parse(line);
            if (parsed && parsed.control === "ready") {
                child._printerControlReady = true;
                replyWatcherStart(child, { success: true, data: { watching: true, existing: false } });
            } else {
                sendJobWatcherEvent(parsed);
            }
        } catch (ignore) { }
    }
}

function startJobWatcher(requestId) {
    if (jobWatcherProcess != null) {
        sendResult(requestId, "watchJobsStart", { success: true, data: { watching: true, existing: true } });
        return;
    }

    var powershellPath;
    try {
        powershellPath = findPowerShell();
    } catch (findError) {
        sendResult(requestId, "watchJobsStart", { success: false, error: String(findError) });
        return;
    }

    var child;
    try {
        child = require("child_process").execFile(
            powershellPath,
            [
                "powershell.exe",
                "-NoLogo",
                "-NoProfile",
                "-NonInteractive",
                "-ExecutionPolicy", "Bypass",
                "-Command", "-"
            ],
            { cwd: process.env.TEMP || "C:\\Windows\\Temp" }
        );
    } catch (startError) {
        sendResult(requestId, "watchJobsStart", { success: false, error: "Unable to start print-job watcher: " + startError });
        return;
    }

    jobWatcherProcess = child;
    child._printerControlBuffer = "";
    child._printerControlStopping = false;
    child._printerControlReady = false;
    child._printerControlStartRequestId = requestId;
    child._printerControlStartReplied = false;
    child._printerControlReadyTimer = setTimeout(function () {
        if (child._printerControlReady === true || child._printerControlStartReplied === true) return;
        child._printerControlStopping = true;
        replyWatcherStart(child, { success: false, error: "PowerShell did not confirm that the print-job watcher started" });
        try { child.kill(); } catch (ignoreKill) { }
        if (jobWatcherProcess === child) jobWatcherProcess = null;
    }, 15000);

    if (child.stdout) child.stdout.on("data", function (chunk) { consumeWatcherOutput(child, chunk); });
    if (child.stderr) {
        child.stderr.str = "";
        child.stderr.on("data", function (chunk) {
            if (this.str.length < 8192) this.str += chunk.toString();
        });
    }
    child.on("exit", function (code) {
        var wasStopping = child._printerControlStopping === true;
        var detail = "";
        if (child.stderr && child.stderr.str) detail = child.stderr.str.substring(0, 1200);
        if (jobWatcherProcess === child) jobWatcherProcess = null;
        child._printerControlBuffer = "";
        if (child._printerControlReadyTimer != null) {
            clearTimeout(child._printerControlReadyTimer);
            child._printerControlReadyTimer = null;
        }
        if (child._printerControlStartReplied !== true) {
            replyWatcherStart(child, { success: false, error: detail || ("Print-job watcher exited with code " + code) });
        } else if (!wasStopping) {
            sendWatcherStatus(false, detail || ("Print-job watcher exited with code " + code));
        }
    });

    try {
        child.stdin.write(buildJobWatcherScript());
        child.stdin.write("\r\nexit\r\n");
        // PowerShell -Command - must receive EOF to reliably execute the complete
        // multi-line program. 0.4.8 left stdin open and could show a false active state.
        if (child.stdin && typeof child.stdin.end === "function") child.stdin.end();
    } catch (writeError) {
        child._printerControlStopping = true;
        replyWatcherStart(child, { success: false, error: "Unable to initialize print-job watcher: " + writeError });
        try { child.kill(); } catch (ignoreKill) { }
        if (jobWatcherProcess === child) jobWatcherProcess = null;
        return;
    }
}

function stopJobWatcher(requestId) {
    var child = jobWatcherProcess;
    if (child == null) {
        sendResult(requestId, "watchJobsStop", { success: true, data: { watching: false } });
        return;
    }
    child._printerControlStopping = true;
    if (jobWatcherProcess === child) jobWatcherProcess = null;
    child._printerControlBuffer = "";
    if (child._printerControlReadyTimer != null) {
        clearTimeout(child._printerControlReadyTimer);
        child._printerControlReadyTimer = null;
    }
    try {
        if (typeof child.kill === "function") child.kill();
    } catch (ignore) { }
    sendResult(requestId, "watchJobsStop", { success: true, data: { watching: false } });
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

    if (operation === "watchJobsStart") {
        startJobWatcher(args.requestId);
        return;
    }
    if (operation === "watchJobsStop") {
        stopJobWatcher(args.requestId);
        return;
    }

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
