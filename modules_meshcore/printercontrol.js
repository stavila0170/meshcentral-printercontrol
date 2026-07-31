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
var SCRIPT_VERSION = "0.4.33";
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
        "      if ($status -match '(?i)printed|completed|complete|deleted|deleting') { continue }",
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
        "function Get-DisplayJobsForPrinter($printerName,$current) {",
        "  return @($current.Values | Where-Object { $_.printerName -eq $printerName } | Select-Object -First 250)",
        "}",
        "function Publish-PrintJobChanges($current) {",
        "  $changeCount=0",
        "  foreach ($key in @($current.Keys)) {",
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
        "    $jobs=@(Get-DisplayJobsForPrinter $old.printerName $current)",
        "    $payload=[ordered]@{ eventType='__InstanceDeletionEvent'; printerName=$old.printerName; jobId=$old.id; document=$old.documentName; owner=$old.userName; status='Removed from queue'; timestamp=(Get-Date).ToUniversalTime().ToString('o'); jobs=$jobs }",
        "    [Console]::Out.WriteLine(($payload|ConvertTo-Json -Compress -Depth 4))",
        "    [Console]::Out.Flush()",
        "    $changeCount++",
        "  }",
        "  $script:previous=$current",
        "  return $changeCount",
        "}",
        "function Publish-UnresolvedSpoolerActivity { return 0 }",
        "[Console]::Out.WriteLine('{\"control\":\"ready\"}')",
        "[Console]::Out.Flush()",
        "try {",
        "  $initial=Read-PrintJobSnapshot",
        "  if ($null -ne $initial) { [void](Publish-ActivePrinterSnapshot $initial $true); [void](Publish-PrintJobChanges $initial) }",
        "  while ((Get-Date) -lt $deadline) {",
        "    if ($nativeAvailable) {",
        "      $signal=0",
        "      $waitMilliseconds=1000",
        "      try { $signal=$notifier.Wait($waitMilliseconds) } catch { $nativeAvailable=$false; continue }",
        "      if ($signal -ne 0) {",
        "        $burstChanges=0",
        "        for ($sample=0; $sample -lt 24; $sample++) {",
        "          $current=Read-PrintJobSnapshot",
        "          if ($null -ne $current) { $burstChanges += (Publish-PrintJobChanges $current) }",
        "          Start-Sleep -Milliseconds 25",
        "        }",
        "        if ($null -ne $current) { [void](Publish-ActivePrinterSnapshot $current $false) }",
        "        if ($burstChanges -eq 0) { Publish-UnresolvedSpoolerActivity }",
        "      } else {",
        "        $current=Read-PrintJobSnapshot",
        "        if ($null -ne $current) { [void](Publish-PrintJobChanges $current); [void](Publish-ActivePrinterSnapshot $current $false) }",
        "      }",
        "    } else {",
        "      $current=Read-PrintJobSnapshot",
        "      if ($null -ne $current) { [void](Publish-PrintJobChanges $current); [void](Publish-ActivePrinterSnapshot $current $false) }",
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
