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
var SCRIPT_VERSION = "0.4.32";
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
        "$script:lastPrinterSnapshot=(Get-Date).AddYears(-1)",
        "$script:lastPrinterFingerprint=''",
        "$notifier=$null",
        "$nativeAvailable=$false",
        "try {",
        "  [void][Reflection.Assembly]::Load([Convert]::FromBase64String('" + SPOOLER_NOTIFIER_BASE64 + "'))",
        "  $notifier=New-Object MeshPrinterControl.Native.SpoolerNotifier",
        "  $nativeAvailable=$notifier.Initialize()",
        "} catch { $nativeAvailable=$false }",
        "function Test-IsRealActivePrinter($item) {",
        "  $name=[string]$item.Name",
        "  $driver=[string]$item.DriverName",
        "  $port=[string]$item.PortName",
        "  $identity=$name+'|'+$driver",
        "  if ($driver -ieq 'Remote Desktop Easy Print' -or $port -match '^TS\\d+$') { return $false }",
        "  if ($identity -match '(?i)(Microsoft Print to PDF|Microsoft XPS Document Writer|Microsoft Shared Fax Driver|(^|\\W)Fax(\\W|$)|OneNote|Adobe PDF|PDFCreator|PDF24|CutePDF|doPDF|Bullzip|Foxit.*PDF|Nitro.*PDF|Universal Document Converter)') { return $false }",
        "  if ($port -match '(?i)^(FILE:|PORTPROMPT:|XPSPort:|SHRFAX:|NUL:|Microsoft\\.Office\\.OneNote_)') { return $false }",
        "  $printerStatus=[int]$item.PrinterStatus",
        "  $extended=[int]$item.ExtendedPrinterStatus",
        "  $errorState=[int]$item.DetectedErrorState",
        "  if ([bool]$item.WorkOffline -or $printerStatus -eq 7 -or $extended -eq 7 -or $errorState -eq 9) { return $false }",
        "  return $true",
        "}",
        "function Get-LivePrinterState($item) {",
        "  $printerStatus=[int]$item.PrinterStatus",
        "  $extended=[int]$item.ExtendedPrinterStatus",
        "  $errorState=[int]$item.DetectedErrorState",
        "  if ($errorState -eq 8) { return 'Paper Jam' }",
        "  if ($errorState -eq 4) { return 'Paper Out' }",
        "  if ($errorState -eq 7) { return 'Door Open' }",
        "  if ($errorState -eq 6) { return 'No Toner' }",
        "  if ($errorState -eq 5) { return 'Toner Low' }",
        "  if ($errorState -eq 3) { return 'Paper Low' }",
        "  if ($extended -eq 9 -or $errorState -in @(10,11)) { return 'Error' }",
        "  if ($printerStatus -eq 6 -or $extended -in @(6,8)) { return 'Stopped' }",
        "  if ($printerStatus -eq 5 -or $extended -in @(5,14)) { return 'Warming up' }",
        "  if ($printerStatus -eq 4 -or $extended -in @(4,10,12,13,17,18)) { return 'Printing' }",
        "  if ($printerStatus -eq 3 -or $extended -eq 3) { return 'Idle' }",
        "  return 'Ready'",
        "}",
        "function Read-ActivePrinterSnapshot($current) {",
        "  $printerQuery=New-Object System.Management.ObjectQuery('SELECT Name,DriverName,PortName,Shared,ShareName,Default,PrinterStatus,ExtendedPrinterStatus,DetectedErrorState,WorkOffline FROM Win32_Printer')",
        "  $printerSearcher=New-Object System.Management.ManagementObjectSearcher($scope,$printerQuery)",
        "  $printerSearcher.Options.ReturnImmediately=$false",
        "  try {",
        "    $items=New-Object System.Collections.ArrayList",
        "    foreach ($item in @($printerSearcher.Get())) {",
        "      if (-not (Test-IsRealActivePrinter $item)) { continue }",
        "      $name=[string]$item.Name",
        "      $jobCount=@($current.Values | Where-Object { $_.printerName -eq $name }).Count",
        "      foreach ($physicalKey in @($script:physicalJobs.Keys)) { if ($script:physicalJobs[$physicalKey].printerName -eq $name) { $jobCount++ } }",
        "      [void]$items.Add([ordered]@{ name=$name; status=(Get-LivePrinterState $item); driverName=[string]$item.DriverName; portName=[string]$item.PortName; shared=[bool]$item.Shared; shareName=[string]$item.ShareName; default=[bool]$item.Default; jobCount=[int]$jobCount; active=$true; real=$true })",
        "    }",
        "    return @($items | Sort-Object name)",
        "  } catch { return @() }",
        "  finally { $printerSearcher.Dispose() }",
        "}",
        "function Publish-ActivePrinterSnapshot($current,$force) {",
        "  $now=Get-Date",
        "  if (-not $force -and ($now-$script:lastPrinterSnapshot).TotalMilliseconds -lt 2000) { return 0 }",
        "  $script:lastPrinterSnapshot=$now",
        "  $printers=@(Read-ActivePrinterSnapshot $current)",
        "  $fingerprint=($printers | ConvertTo-Json -Compress -Depth 3)",
        "  if (-not $force -and $fingerprint -eq $script:lastPrinterFingerprint) { return 0 }",
        "  $script:lastPrinterFingerprint=$fingerprint",
        "  $payload=[ordered]@{ eventType='PrinterInventorySnapshotEvent'; printerName='Windows Printer Inventory'; jobId=0; document=''; owner=''; status='Active physical printers'; timestamp=(Get-Date).ToUniversalTime().ToString('o'); jobs=@(); printers=$printers }",
        "  [Console]::Out.WriteLine(($payload|ConvertTo-Json -Compress -Depth 5))",
        "  [Console]::Out.Flush()",
        "  return 1",
        "}",
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
        "  if ($null -ne $initial) { [void](Publish-ActivePrinterSnapshot $initial $true); [void](Publish-PrintJobChanges $initial) }",
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
        "        if ($null -ne $current) { [void](Publish-PhysicalPrinterStates $current); [void](Publish-ActivePrinterSnapshot $current $false) }",
        "        if ($burstChanges -eq 0) { Publish-UnresolvedSpoolerActivity }",
        "      } else {",
        "        $current=Read-PrintJobSnapshot",
        "        if ($null -ne $current) { [void](Publish-PrintJobChanges $current); [void](Publish-PhysicalPrinterStates $current); [void](Publish-ActivePrinterSnapshot $current $false) }",
        "      }",
        "    } else {",
        "      $current=Read-PrintJobSnapshot",
        "      if ($null -ne $current) { [void](Publish-PrintJobChanges $current); [void](Publish-PhysicalPrinterStates $current); [void](Publish-ActivePrinterSnapshot $current $false) }",
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
