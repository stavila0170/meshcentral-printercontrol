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
var SCRIPT_VERSION = "0.4.28";
var SPOOLER_NOTIFIER_BASE64 = "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AAAAAB4AAAAEAAAAAAAAAAAAAAABAEgAAAAAAAQAAAAAAAAAAAAAAAEAUQAAAAAAAAAAAAA8TW9kdWxlPgBTcG9vbGVyTm90aWZpZXIuZGxsAFNwb29sZXJOb3RpZmllcgBNZXNoUHJpbnRlckNvbnRyb2wuTmF0aXZlAG1zY29ybGliAFN5c3RlbQBPYmplY3QASURpc3Bvc2FibGUAUHJpbnRlckNoYW5nZUpvYgBXYWl0T2JqZWN0MABXYWl0VGltZW91dABXYWl0RmFpbGVkAHByaW50ZXJIYW5kbGUAbm90aWZpY2F0aW9uSGFuZGxlAE9wZW5QcmludGVyAENsb3NlUHJpbnRlcgBGaW5kRmlyc3RQcmludGVyQ2hhbmdlTm90aWZpY2F0aW9uAEZpbmROZXh0UHJpbnRlckNoYW5nZU5vdGlmaWNhdGlvbgBGaW5kQ2xvc2VQcmludGVyQ2hhbmdlTm90aWZpY2F0aW9uAEZyZWVQcmludGVyTm90aWZ5SW5mbwBXYWl0Rm9yU2luZ2xlT2JqZWN0AEluaXRpYWxpemUAV2FpdABEaXNwb3NlAC5jdG9yAHByaW50ZXJOYW1lAHByaW50ZXIAU3lzdGVtLlJ1bnRpbWUuSW50ZXJvcFNlcnZpY2VzAE91dEF0dHJpYnV0ZQBkZWZhdWx0cwBmaWx0ZXIAb3B0aW9ucwBub3RpZnlPcHRpb25zAG5vdGlmaWNhdGlvbgBjaGFuZ2UAbm90aWZ5SW5mbwBoYW5kbGUAbWlsbGlzZWNvbmRzAFN5c3RlbS5SdW50aW1lLkNvbXBpbGVyU2VydmljZXMAQ29tcGlsYXRpb25SZWxheGF0aW9uc0F0dHJpYnV0ZQBSdW50aW1lQ29tcGF0aWJpbGl0eUF0dHJpYnV0ZQBEbGxJbXBvcnRBdHRyaWJ1dGUAd2luc3Bvb2wuZHJ2AGtlcm5lbDMyLmRsbABJbnRQdHIAWmVybwBvcF9FcXVhbGl0eQBJbnZhbGlkT3BlcmF0aW9uRXhjZXB0aW9uAE1hcnNoYWwAR2V0TGFzdFdpbjMyRXJyb3IAU3lzdGVtLkNvbXBvbmVudE1vZGVsAFdpbjMyRXhjZXB0aW9uAFVJbnQzMgBTdHJpbmcAQ29uY2F0AG9wX0luZXF1YWxpdHkAAAAAAFFTAHAAbwBvAGwA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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAwAAAAgOgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
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
    watchJobsStop: true,
    watchJobsKeepAlive: true
};
var jobWatcherProcess = null;
var jobWatcherLeaseTimer = null;
var jobWatcherHardTimer = null;
var jobWatcherStartedAt = 0;
var activePrinterOperation = null;
var activePrinterOperationStartedAt = 0;
var activePrinterOperationTimeoutMs = 0;
var activePrinterProcess = null;
var DEFAULT_WATCHER_LEASE_MS = 55000;
var MIN_WATCHER_LEASE_MS = 15000;
var MAX_WATCHER_LEASE_MS = 120000;
var WATCHER_HARD_LIMIT_MS = 600000;
var DEFAULT_OPERATION_TIMEOUT_MS = 120000;
var OPERATION_TIMEOUTS_MS = {
    inventory: 90000,
    jobs: 45000,
    cancelJob: 30000,
    pauseJob: 30000,
    resumeJob: 30000,
    testPage: 30000,
    addTcpPrinter: 90000,
    deletePrinter: 90000,
    removePort: 90000,
    removeDriver: 90000,
    spoolerStart: 45000,
    spoolerStop: 45000,
    spoolerRestart: 60000,
    clearQueue: 90000
};
var MAX_PROCESS_OUTPUT_CHARS = 1048576;
var MAX_PROCESS_ERROR_CHARS = 16384;
var WATCHER_MARKER = "MESH_PRINTERCONTROL_WATCHER_0428";


function own(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
}

function operationTimeoutMs(operation) {
    var value = OPERATION_TIMEOUTS_MS[operation];
    return typeof value === "number" && isFinite(value) && value > 0 ? value : DEFAULT_OPERATION_TIMEOUT_MS;
}

function operationTimeoutError(operation, timeoutMs) {
    return String(operation || "Printer") + " operation exceeded the " + Math.ceil(timeoutMs / 1000) + "-second endpoint limit";
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

function runPowerShell(operation, params, callback) {
    var timeoutMs = operationTimeoutMs(operation);
    var powershellPath;
    try {
        powershellPath = findPowerShell();
    } catch (ex) {
        callback({ success: false, error: "Unable to prepare printer operations: " + ex });
        return;
    }

    var payloadBase64 = Buffer.from(JSON.stringify(params)).toString("base64");
    var inMemoryCommand;
    try {
        inMemoryCommand = buildInMemoryCommand(operation, payloadBase64);
    } catch (commandError) {
        callback({ success: false, error: "Unable to prepare the in-memory PowerShell command: " + commandError });
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
    } catch (ex2) {
        callback({ success: false, error: "Unable to start Windows PowerShell: " + ex2 });
        return;
    }
    activePrinterProcess = child;

    var stdout = "";
    var stderr = "";
    var completed = false;
    var timedOut = false;
    var outputExceeded = false;
    var timer = null;

    function finish(result) {
        if (completed) return;
        completed = true;
        if (activePrinterProcess === child) activePrinterProcess = null;
        if (timer != null) {
            clearTimeout(timer);
            timer = null;
        }
        callback(result);
    }

    if (child.stdout) {
        child.stdout.on("data", function (chunk) {
            if (completed) return;
            stdout += String(chunk || "");
            if (stdout.length > MAX_PROCESS_OUTPUT_CHARS) {
                outputExceeded = true;
                try { child.kill(); } catch (ignoreKill) { }
                finish({ success: false, error: "PowerShell response exceeded 1 MiB" });
            }
        });
    }
    if (child.stderr) {
        child.stderr.on("data", function (chunk) {
            if (stderr.length < MAX_PROCESS_ERROR_CHARS) {
                stderr = (stderr + String(chunk || "")).substring(0, MAX_PROCESS_ERROR_CHARS);
            }
        });
    }
    child.on("error", function (error) {
        finish({ success: false, error: "Windows PowerShell process failed: " + error });
    });
    child.on("exit", function (code) {
        if (completed) return;
        if (timedOut) {
            finish({ success: false, error: operationTimeoutError(operation, timeoutMs) });
            return;
        }
        if (outputExceeded) {
            finish({ success: false, error: "PowerShell response exceeded 1 MiB" });
            return;
        }
        try {
            finish(parsePowerShellResult(stdout));
        } catch (parseError) {
            var detail = String(stderr || parseError || ("PowerShell exited with code " + code)).substring(0, 1200);
            finish({ success: false, error: detail });
        }
    });

    timer = setTimeout(function () {
        if (completed) return;
        timedOut = true;
        try { child.kill(); } catch (ignoreTimeoutKill) { }
        finish({ success: false, error: operationTimeoutError(operation, timeoutMs) });
    }, timeoutMs);

    // MeshAgent's Windows command-line builder can corrupt arguments longer
    // than roughly 4 KiB. Transfer the program through stdin and close it after
    // the complete script has been written. No endpoint file is created.
    try {
        if (!child.stdin) throw new Error("PowerShell standard input is unavailable");
        child.stdin.write(String(inMemoryCommand));
        child.stdin.write("\r\nexit\r\n");
        if (typeof child.stdin.end === "function") child.stdin.end();
    } catch (writeError) {
        try { child.kill(); } catch (ignoreWriteKill) { }
        finish({ success: false, error: "Unable to initialize Windows PowerShell: " + writeError });
    }
}

function normalizeWatcherLeaseMs(params) {
    var value = params && params.leaseMs;
    if (typeof value !== "number" || !isFinite(value) || Math.floor(value) !== value) return DEFAULT_WATCHER_LEASE_MS;
    if (value < MIN_WATCHER_LEASE_MS) return MIN_WATCHER_LEASE_MS;
    if (value > MAX_WATCHER_LEASE_MS) return MAX_WATCHER_LEASE_MS;
    return value;
}

function clearWatcherSafetyTimers() {
    if (jobWatcherLeaseTimer != null) { clearTimeout(jobWatcherLeaseTimer); jobWatcherLeaseTimer = null; }
    if (jobWatcherHardTimer != null) { clearTimeout(jobWatcherHardTimer); jobWatcherHardTimer = null; }
}

function armWatcherLease(params) {
    var leaseMs = normalizeWatcherLeaseMs(params);
    if (jobWatcherLeaseTimer != null) clearTimeout(jobWatcherLeaseTimer);
    jobWatcherLeaseTimer = setTimeout(function () {
        jobWatcherLeaseTimer = null;
        stopJobWatcher(null, "Live-monitoring lease expired; the watcher was stopped for safety.", true);
    }, leaseMs);
}

function armWatcherHardLimit() {
    if (jobWatcherHardTimer != null) clearTimeout(jobWatcherHardTimer);
    jobWatcherHardTimer = setTimeout(function () {
        jobWatcherHardTimer = null;
        stopJobWatcher(null, "Live monitoring reached the 10-minute endpoint safety limit.", true);
    }, WATCHER_HARD_LIMIT_MS);
}

function buildJobWatcherScript() {
    return [
        "$ErrorActionPreference='Stop'",
        "[Console]::OutputEncoding=[Text.Encoding]::UTF8",
        "$scope=New-Object System.Management.ManagementScope('\\\\.\\root\\cimv2')",
        "$query=New-Object System.Management.ObjectQuery('SELECT Name,Document,Owner,JobStatus,TotalPages,PagesPrinted,Size FROM Win32_PrintJob')",
        "$searcher=New-Object System.Management.ManagementObjectSearcher($scope,$query)",
        "$searcher.Options.ReturnImmediately=$false",
        "$searcher.Options.Rewindable=$false",
        "$deadline=(Get-Date).AddMinutes(10)",
        "$script:previous=@{}",
        "$script:physicalJobs=@{}",
        "$script:lastPhysicalPoll=(Get-Date).AddYears(-1)",
        "$notifier=$null",
        "$nativeAvailable=$false",
        "try {",
        "  [void][Reflection.Assembly]::Load([Convert]::FromBase64String('" + SPOOLER_NOTIFIER_BASE64 + "'))",
        "  $notifier=New-Object MeshPrinterControl.Native.SpoolerNotifier",
        "  $nativeAvailable=$notifier.Initialize()",
        "} catch { $nativeAvailable=$false }",
        "function Read-PrintJobSnapshot {",
        "  $current=@{}",
        "  try {",
        "    foreach ($item in @($searcher.Get())) {",
        "      $name=[string]$item.Name",
        "      if ([string]::IsNullOrWhiteSpace($name)) { continue }",
        "      $printerName=$name",
        "      $jobId=0",
        "      if ($name -match '^(.*),\\s*(\\d+)$') { $printerName=$Matches[1]; $jobId=[int]$Matches[2] }",
        "      $status=[string]$item.JobStatus",
        "      if ([string]::IsNullOrWhiteSpace($status)) { $status='Queued' }",
        "      $job=[ordered]@{",
        "        key=$name",
        "        printerName=[string]$printerName",
        "        id=$jobId",
        "        documentName=[string]$item.Document",
        "        userName=[string]$item.Owner",
        "        jobStatus=$status",
        "        totalPages=[int]$item.TotalPages",
        "        pagesPrinted=[int]$item.PagesPrinted",
        "        size=[long]$item.Size",
        "        submittedTime=$null",
        "        recentCompleted=$false",
        "      }",
        "      $job['fingerprint']=('{0}|{1}|{2}|{3}|{4}|{5}' -f $job.documentName,$job.userName,$job.jobStatus,$job.totalPages,$job.pagesPrinted,$job.size)",
        "      $current[$name]=$job",
        "    }",
        "    return $current",
        "  } catch { return $null }",
        "}",
        "function Convert-PhysicalJob($physical,$completed) {",
        "  return [ordered]@{",
        "    id=$physical.id",
        "    documentName=$physical.documentName",
        "    userName=$physical.userName",
        "    jobStatus=if ($completed) { 'Sent to printer' } else { $physical.jobStatus }",
        "    totalPages=$physical.totalPages",
        "    pagesPrinted=$physical.pagesPrinted",
        "    size=$physical.size",
        "    submittedTime=$physical.submittedTime",
        "    recentCompleted=[bool]$completed",
        "    physicalPending=(-not [bool]$completed)",
        "    physicalStatusReported=[bool]$physical.statusReported",
        "    deviceState=[string]$physical.deviceState",
        "  }",
        "}",
        "function Get-DisplayJobsForPrinter($printerName,$current) {",
        "  $items=New-Object System.Collections.ArrayList",
        "  foreach ($job in @($current.Values | Where-Object { $_.printerName -eq $printerName })) { [void]$items.Add($job) }",
        "  foreach ($physicalKey in @($script:physicalJobs.Keys)) {",
        "    $physical=$script:physicalJobs[$physicalKey]",
        "    if ($physical.printerName -eq $printerName) { [void]$items.Add((Convert-PhysicalJob $physical $false)) }",
        "  }",
        "  return @($items | Select-Object -First 250)",
        "}",
        "function Read-PrinterDeviceState($printerName) {",
        "  $escaped=[string]$printerName.Replace(\"'\",\"''\")",
        "  $deviceQuery=New-Object System.Management.ObjectQuery(\"SELECT PrinterStatus,ExtendedPrinterStatus,DetectedErrorState,WorkOffline FROM Win32_Printer WHERE Name='$escaped'\")",
        "  $deviceSearcher=New-Object System.Management.ManagementObjectSearcher($scope,$deviceQuery)",
        "  $deviceSearcher.Options.ReturnImmediately=$false",
        "  try {",
        "    $device=@($deviceSearcher.Get() | Select-Object -First 1)",
        "    if ($device.Count -eq 0) { return [ordered]@{ state='Unknown'; reported=$false; busy=$false; idle=$false } }",
        "    $printerStatus=[int]$device[0].PrinterStatus",
        "    $extended=[int]$device[0].ExtendedPrinterStatus",
        "    $errorState=[int]$device[0].DetectedErrorState",
        "    $offline=[bool]$device[0].WorkOffline",
        "    if ($offline -or $printerStatus -eq 7 -or $extended -eq 7) { return [ordered]@{ state='Offline'; reported=$true; busy=$true; idle=$false } }",
        "    if ($extended -eq 9 -or ($errorState -gt 2 -and $errorState -ne 0)) { return [ordered]@{ state='Printer error'; reported=$true; busy=$true; idle=$false } }",
        "    if ($printerStatus -eq 6 -or $extended -eq 6 -or $extended -eq 8) { return [ordered]@{ state='Printing stopped'; reported=$true; busy=$true; idle=$false } }",
        "    if ($printerStatus -eq 5 -or $extended -eq 5 -or $extended -eq 14) { return [ordered]@{ state='Warming up'; reported=$true; busy=$true; idle=$false } }",
        "    if ($printerStatus -eq 4 -or $extended -in @(4,10,12,13,17,18)) { return [ordered]@{ state='Printing'; reported=$true; busy=$true; idle=$false } }",
        "    if ($printerStatus -eq 3 -or $extended -eq 3) { return [ordered]@{ state='Idle'; reported=$true; busy=$false; idle=$true } }",
        "    return [ordered]@{ state='Unknown'; reported=$false; busy=$false; idle=$false }",
        "  } catch { return [ordered]@{ state='Unknown'; reported=$false; busy=$false; idle=$false } }",
        "  finally { $deviceSearcher.Dispose() }",
        "}",
        "function Publish-PhysicalPrinterStates($current) {",
        "  if ($script:physicalJobs.Count -eq 0) { return 0 }",
        "  $now=Get-Date",
        "  if (($now-$script:lastPhysicalPoll).TotalMilliseconds -lt 450) { return 0 }",
        "  $script:lastPhysicalPoll=$now",
        "  $published=0",
        "  foreach ($physicalKey in @($script:physicalJobs.Keys)) {",
        "    if ($current.ContainsKey($physicalKey)) { $script:physicalJobs.Remove($physicalKey); continue }",
        "    $physical=$script:physicalJobs[$physicalKey]",
        "    $device=Read-PrinterDeviceState $physical.printerName",
        "    $physical.statusReported=[bool]$device.reported",
        "    $physical.deviceState=[string]$device.state",
        "    $complete=$false",
        "    if ($device.busy) {",
        "      $physical.busySeen=$true",
        "      $physical.idleSamples=0",
        "      $physical.jobStatus=if ($device.state -eq 'Printing') { 'Printer is physically printing' } else { [string]$device.state }",
        "    } elseif ($device.idle -and $physical.busySeen) {",
        "      $physical.idleSamples++",
        "      $physical.jobStatus='Printer is finishing the job'",
        "      if ($physical.idleSamples -ge 2) { $complete=$true }",
        "    } elseif ($now -ge $physical.holdUntil) {",
        "      $complete=$true",
        "    } else {",
        "      $physical.idleSamples=0",
        "      $physical.statusReported=$false",
        "      $physical.deviceState='Progress unavailable'",
        "      $physical.jobStatus='Sent to printer; waiting for physical completion'",
        "    }",
        "    if ($now -ge $physical.expiresAt) { $complete=$true }",
        "    if ($complete) {",
        "      $script:physicalJobs.Remove($physicalKey)",
        "      $completed=Convert-PhysicalJob $physical $true",
        "      $remaining=@(Get-DisplayJobsForPrinter $physical.printerName $current | Select-Object -First 249)",
        "      $jobs=@($completed)+$remaining",
        "      $payload=[ordered]@{ eventType='PhysicalPrintingCompletedEvent'; printerName=$physical.printerName; jobId=$physical.id; document=$physical.documentName; owner=$physical.userName; status='Sent to printer'; timestamp=(Get-Date).ToUniversalTime().ToString('o'); jobs=$jobs }",
        "      [Console]::Out.WriteLine(($payload|ConvertTo-Json -Compress -Depth 4))",
        "      [Console]::Out.Flush()",
        "      $published++",
        "      continue",
        "    }",
        "    $fingerprint=('{0}|{1}|{2}' -f $physical.jobStatus,$physical.deviceState,$physical.statusReported)",
        "    if ($fingerprint -ne $physical.lastPublished) {",
        "      $physical.lastPublished=$fingerprint",
        "      $jobs=@(Get-DisplayJobsForPrinter $physical.printerName $current)",
        "      $payload=[ordered]@{ eventType='PhysicalPrinterStatusEvent'; printerName=$physical.printerName; jobId=$physical.id; document=$physical.documentName; owner=$physical.userName; status=$physical.jobStatus; timestamp=(Get-Date).ToUniversalTime().ToString('o'); jobs=$jobs }",
        "      [Console]::Out.WriteLine(($payload|ConvertTo-Json -Compress -Depth 4))",
        "      [Console]::Out.Flush()",
        "      $published++",
        "    }",
        "  }",
        "  return $published",
        "}",
        "function Publish-PrintJobChanges($current) {",
        "  $changeCount=0",
        "  foreach ($key in @($current.Keys)) {",
        "    if ($script:physicalJobs.ContainsKey($key)) { $script:physicalJobs.Remove($key) }",
        "    $job=$current[$key]",
        "    $eventClass=$null",
        "    if (-not $script:previous.ContainsKey($key)) { $eventClass='__InstanceCreationEvent' }",
        "    elseif ($script:previous[$key].fingerprint -ne $job.fingerprint) { $eventClass='__InstanceModificationEvent' }",
        "    if ($null -eq $eventClass) { continue }",
        "    $jobs=@(Get-DisplayJobsForPrinter $job.printerName $current)",
        "    $payload=[ordered]@{ eventType=$eventClass; printerName=$job.printerName; jobId=$job.id; document=$job.documentName; owner=$job.userName; status=$job.jobStatus; timestamp=(Get-Date).ToUniversalTime().ToString('o'); jobs=$jobs }",
        "    [Console]::Out.WriteLine(($payload|ConvertTo-Json -Compress -Depth 4))",
        "    [Console]::Out.Flush()",
        "    $changeCount++",
        "  }",
        "  foreach ($key in @($script:previous.Keys)) {",
        "    if ($current.ContainsKey($key)) { continue }",
        "    $old=$script:previous[$key]",
        "    $now=Get-Date",
        "    $pageCount=[Math]::Max(1,[int]$old.totalPages)",
        "    $holdSeconds=[Math]::Min(180,[Math]::Max(60,30+($pageCount*15)))",
        "    $physical=[ordered]@{ key=$key; printerName=$old.printerName; id=$old.id; documentName=$old.documentName; userName=$old.userName; jobStatus='Sent to printer; waiting for physical completion'; totalPages=$old.totalPages; pagesPrinted=$old.pagesPrinted; size=$old.size; submittedTime=$old.submittedTime; statusReported=$false; deviceState='Progress unavailable'; busySeen=$false; idleSamples=0; holdUntil=$now.AddSeconds($holdSeconds); expiresAt=$now.AddMinutes(5); lastPublished='' }",
        "    $script:physicalJobs[$key]=$physical",
        "    $jobs=@(Get-DisplayJobsForPrinter $old.printerName $current)",
        "    $payload=[ordered]@{ eventType='PhysicalMonitoringStartedEvent'; printerName=$old.printerName; jobId=$old.id; document=$old.documentName; owner=$old.userName; status=$physical.jobStatus; timestamp=(Get-Date).ToUniversalTime().ToString('o'); jobs=$jobs }",
        "    [Console]::Out.WriteLine(($payload|ConvertTo-Json -Compress -Depth 4))",
        "    [Console]::Out.Flush()",
        "    $changeCount++",
        "  }",
        "  $script:previous=$current",
        "  return $changeCount",
        "}",
        "function Publish-UnresolvedSpoolerActivity {",
        "  $job=[ordered]@{ id=0; documentName='Print job changed too quickly to read'; userName=''; jobStatus='Sent to printer'; totalPages=0; pagesPrinted=0; size=0; submittedTime=$null; recentCompleted=$true }",
        "  $payload=[ordered]@{ eventType='SpoolerJobActivityEvent'; printerName='Windows Print Spooler'; jobId=0; document=$job.documentName; owner=''; status='Sent to printer'; timestamp=(Get-Date).ToUniversalTime().ToString('o'); jobs=@($job) }",
        "  [Console]::Out.WriteLine(($payload|ConvertTo-Json -Compress -Depth 4))",
        "  [Console]::Out.Flush()",
        "}",
        "[Console]::Out.WriteLine('{\"control\":\"ready\"}')",
        "[Console]::Out.Flush()",
        "try {",
        "  $initial=Read-PrintJobSnapshot",
        "  if ($null -ne $initial) { [void](Publish-PrintJobChanges $initial) }",
        "  while ((Get-Date) -lt $deadline) {",
        "    if ($nativeAvailable) {",
        "      $signal=0",
        "      $waitMilliseconds=if ($script:physicalJobs.Count -gt 0) { 500 } else { 1000 }",
        "      try { $signal=$notifier.Wait($waitMilliseconds) } catch { $nativeAvailable=$false; continue }",
        "      if ($signal -ne 0) {",
        "        $burstChanges=0",
        "        for ($sample=0; $sample -lt 24; $sample++) {",
        "          $current=Read-PrintJobSnapshot",
        "          if ($null -ne $current) { $burstChanges += (Publish-PrintJobChanges $current) }",
        "          Start-Sleep -Milliseconds 25",
        "        }",
        "        if ($null -ne $current) { [void](Publish-PhysicalPrinterStates $current) }",
        "        if ($burstChanges -eq 0) { Publish-UnresolvedSpoolerActivity }",
        "      } else {",
        "        $current=Read-PrintJobSnapshot",
        "        if ($null -ne $current) { [void](Publish-PrintJobChanges $current); [void](Publish-PhysicalPrinterStates $current) }",
        "      }",
        "    } else {",
        "      $current=Read-PrintJobSnapshot",
        "      if ($null -ne $current) { [void](Publish-PrintJobChanges $current); [void](Publish-PhysicalPrinterStates $current) }",
        "      Start-Sleep -Milliseconds 100",
        "    }",
        "  }",
        "} finally {",
        "  if ($null -ne $notifier) { $notifier.Dispose() }",
        "  $searcher.Dispose()",
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
    try {
        if (JSON.stringify(event).length > 262144) {
            if (Array.isArray(event.jobs)) event.jobs = event.jobs.slice(0, 50);
            event.truncated = true;
        }
    } catch (ignoreSize) {
        return;
    }
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

function startJobWatcher(requestId, params) {
    if (jobWatcherProcess != null) {
        armWatcherLease(params);
        var remainingMs = Math.max(0, WATCHER_HARD_LIMIT_MS - (Date.now() - jobWatcherStartedAt));
        sendResult(requestId, "watchJobsStart", { success: true, data: { watching: true, existing: true, remainingMs: remainingMs } });
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
                // Read the complete watcher program from stdin first, then execute it
                // as a ScriptBlock. This lets us close stdin without terminating
                // PowerShell's long-running watcher process.
                "-Command", "$pcMarker='" + WATCHER_MARKER + "';$pcScript=[Console]::In.ReadToEnd(); & ([ScriptBlock]::Create($pcScript))"
            ],
            { cwd: process.env.TEMP || "C:\\Windows\\Temp" }
        );
    } catch (startError) {
        sendResult(requestId, "watchJobsStart", { success: false, error: "Unable to start print-job watcher: " + startError });
        return;
    }

    jobWatcherProcess = child;
    jobWatcherStartedAt = Date.now();
    armWatcherLease(params);
    armWatcherHardLimit();
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
        jobWatcherStartedAt = 0;
        clearWatcherSafetyTimers();
    }, 15000);

    if (child.stdout) child.stdout.on("data", function (chunk) { consumeWatcherOutput(child, chunk); });
    if (child.stderr) {
        child.stderr.str = "";
        child.stderr.on("data", function (chunk) {
            if (this.str.length < 8192) this.str += chunk.toString();
        });
    }
    child.on("error", function (error) {
        child._printerControlStopping = true;
        replyWatcherStart(child, { success: false, error: "Print-job watcher process failed: " + error });
        if (jobWatcherProcess === child) jobWatcherProcess = null;
        jobWatcherStartedAt = 0;
        clearWatcherSafetyTimers();
        try { child.kill(); } catch (ignoreErrorKill) { }
    });
    child.on("exit", function (code) {
        var wasStopping = child._printerControlStopping === true;
        var detail = "";
        if (child.stderr && child.stderr.str) detail = child.stderr.str.substring(0, 1200);
        if (jobWatcherProcess === child) {
            jobWatcherProcess = null;
            jobWatcherStartedAt = 0;
            clearWatcherSafetyTimers();
        }
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
        // The short PowerShell bootstrap reads this complete program with
        // ReadToEnd(), then executes it as a ScriptBlock. Closing stdin supplies EOF
        // to the bootstrap but does not stop the long-running watcher loop.
        child.stdin.write(buildJobWatcherScript());
        if (child.stdin && typeof child.stdin.end === "function") child.stdin.end();
    } catch (writeError) {
        child._printerControlStopping = true;
        replyWatcherStart(child, { success: false, error: "Unable to initialize print-job watcher: " + writeError });
        try { child.kill(); } catch (ignoreKill) { }
        if (jobWatcherProcess === child) jobWatcherProcess = null;
        jobWatcherStartedAt = 0;
        clearWatcherSafetyTimers();
        return;
    }
}

function stopJobWatcher(requestId, reason, notifyStatus) {
    var child = jobWatcherProcess;
    clearWatcherSafetyTimers();
    if (child == null) {
        if (requestId) sendResult(requestId, "watchJobsStop", { success: true, data: { watching: false } });
        return;
    }
    child._printerControlStopping = true;
    if (jobWatcherProcess === child) jobWatcherProcess = null;
    jobWatcherStartedAt = 0;
    child._printerControlBuffer = "";
    if (child._printerControlReadyTimer != null) {
        clearTimeout(child._printerControlReadyTimer);
        child._printerControlReadyTimer = null;
    }
    try {
        if (typeof child.kill === "function") child.kill();
    } catch (ignore) { }
    if (requestId) sendResult(requestId, "watchJobsStop", { success: true, data: { watching: false } });
    if (notifyStatus === true) sendWatcherStatus(false, reason || "Print-job watcher stopped");
}

function keepJobWatcherAlive(params) {
    if (jobWatcherProcess == null) {
        sendWatcherStatus(false, "The print-job watcher is no longer running.");
        return false;
    }
    armWatcherLease(params);
    return true;
}

function sendResult(requestId, operation, result) {
    mesh.SendCommand({
        action: "plugin",
        plugin: "printercontrol",
        pluginaction: "operationResult",
        requestId: requestId,
        operation: operation,
        moduleVersion: SCRIPT_VERSION,
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
    if (!ALLOWED_ACTIONS[operation]) return;

    if (operation === "watchJobsKeepAlive") {
        keepJobWatcherAlive(args.params || {});
        return;
    }

    if (typeof args.requestId !== "string" || !/^[a-f0-9]{36}$/.test(args.requestId)) return;

    if (operation === "watchJobsStart") {
        startJobWatcher(args.requestId, args.params || {});
        return;
    }
    if (operation === "watchJobsStop") {
        stopJobWatcher(args.requestId, null, false);
        return;
    }

    var params;
    try {
        params = validateParameters(operation, args.params);
    } catch (validationError) {
        sendResult(args.requestId, operation, { success: false, error: String(validationError.message || validationError) });
        return;
    }
    if (activePrinterOperation != null &&
            (Date.now() - activePrinterOperationStartedAt) > (activePrinterOperationTimeoutMs + 5000)) {
        try {
            if (activePrinterProcess && typeof activePrinterProcess.kill === "function") activePrinterProcess.kill();
        } catch (ignoreStaleKill) { }
        activePrinterProcess = null;
        activePrinterOperation = null;
        activePrinterOperationStartedAt = 0;
        activePrinterOperationTimeoutMs = 0;
    }
    if (activePrinterOperation != null) {
        sendResult(args.requestId, operation, {
            success: false,
            error: "Another printer operation is already running on this endpoint"
        });
        return;
    }

    activePrinterOperation = args.requestId;
    activePrinterOperationStartedAt = Date.now();
    activePrinterOperationTimeoutMs = operationTimeoutMs(operation);
    runPowerShell(operation, params, function (result) {
        if (activePrinterOperation === args.requestId) {
            activePrinterOperation = null;
            activePrinterOperationStartedAt = 0;
            activePrinterOperationTimeoutMs = 0;
        }
        sendResult(args.requestId, operation, result);
    });
}

module.exports = { consoleaction: consoleaction };
