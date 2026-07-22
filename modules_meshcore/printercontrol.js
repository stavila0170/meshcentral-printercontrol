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
var SCRIPT_VERSION = "0.4.2";
var SCRIPT_GZIP_BASE64 = "H4sIAAAAAAAC/+Uaa2/bOPK7f4UQGLCNq4xe926xSLBAc3ncudikvtjdfsgGgSLRsXoyqZWotLnU/32HQ0oiRUqWi6TYw+VDa5HDeXFeHDINsmAzHnjwdz0Xvwkn2fgioFHAWfbo/ewNeVaQyY0E+TVIYpghC8LlIvE3iukDoQJ89MobfWJ3ufg/DGhIknfsTnykQZET9TsjebGRHzUKTnI+D+6JAAiiaBmm8yymwIsYiEgCbGkDGdmwBzJnGddxyNHTLH6QUHnKWEKyBQ8EnPbNUu3zCigHJqIwIUH274IUZISDpfQ5Bxbub4bHIY8ZfTXorbZy4Tx4TFgQ/SPIyY9/G0wGg+FZlrFM4ptnZEUyAlqD5SPkcnB9wmgOXN4cHr4veFrwMxqyCHAByPXiMedkM12SL3z6YXn+UzkHwJR8Hg9XQZKTyWA4z9g9KD1vEIgT2LTkESjwmApRB6uCIifexyzmxAfNFAn3nlCGtDYUFOkOlHczXBRhCJhr3Q1PAx4I8WmRJPVwpQGU9wKWwF6XYFLH+O8wkzRBOpZFwGx08/bJyyUVAa8IelsEj1feGFF4PiWS9sR7KrFMI8UL8lSv8CnjFSYdngjmxAKDy63B2VcPFAYGxpfMf5eDrvxTkvK195Pnn7BNKvQ82Gqq/CfhfmUh4D4FMRRaKeYSIF4Bq2QVSAWgXEoracZSIIl2lYdZnPLDCmc+nS/e330iIZ/OJVhM8mvEd9NUEvm9xiUEzwgvMlpTlaKWoyXkFNm2pZL+CI6ct9hIp2fUTiHxoAI0g/kc83B9M5zdU5YR3JBcMxQOqJ4qaMXx23HFF3Dl+RpmTyfj+ZrbecLTYFvPWXYWhGtf6lJDjuzU1miMo34jYa6A/GZ4O52dWvMRCyHeUY6Uf65d4XZ6qs1YyyBgZvaSD2rUAoewC4GOF7kJ/64cthbkxd0m5pxEyxiJNHzpdrrQAYS1jK9F6OfwdWNNT5dsgUTHIzaaeFuPQOwRroUYtzb1+L8oWcIknwv4toA440EiskKuaXhZDVrwqRiV+6zvyVwbNtbUbG2lVW29MACr0zYftaLboOY2b8cTDQVfZ+yzxGK4ynEOW1Z5y9mXOOemv+zvJlVUwBGA1dzR83eZeyPuu2MELhayoljeQYldhM4VK2h0aJA4sEIHTglF1J46TGX6w7DZyF9a7hKpbAoSKXsqwVTYBYDzjG1kClUgZl6dKPVYgVIoVWehCuUCIQZzly4sNJgxXMiv0zwscs42DEMIxIotqAVxzjYpFCv+BYuKhHioONhrsEvh/nY4kotkCARm5MxEM0ut5GpEqqEqa5RVLEj2EEPCl1axUHM2QQNFGG9URhBigRjGtEB7Em9mFOomUUv4J0mQ54j/Y0x/eHNbWWKX2e2KuE1GrrWghrlNKFwWIRBIJVDDuU2hlEmiRGPDYRzJYCF2S/GFkvXhVlS+ZSBVuzBVMVlY0uiqoBQkGAkDMljAFGpmKymk55uhpwqrZujpk6XEH7XSiTOVYDR7TBugSxhxguaOtKNkaUk9mBWxTHfkxGrcuUy4kb1orkbd/K2DTOaD0lwWONIObBNYlMNupoq7JM7XJpF5OehckjDINLGMgzWZX9Soc0nINhgtjBUnctCt4qqWVEx1uZMTA1j0CQR7LEeFdU/xywI1LRFyqel5cqstx5M7/Wzu94zGvwlosQpCSGUYR7UlF9pMy9JPLPsVpFV7q0qQC23YbUKqPKAPccaovc9za37fXRCeY+2BcJw/4w5ERCZYy0NO6wnnwiCKMnlUtJX3L5bzYznfHluKzR1uulUOz6tZEb+r2rJes7PmxfhCN+kZDe4SDBZ2zX15MVfTSKWKWPX4bjrdhmCc7f3yPI3VJpxlxUl53LWREIXSgleRe0jow+HJ+4v5h+XZ1eXxxZld6Vf1iHGkt5KGmTGPPOzKLBtpSANSk7b4WqKvkv7AnX4QRv0cuMxBIhE/mjp1lBmy9dWsx1ItrdeSjB19gZEGOpoYWJyHCLNi0Ol89d4X3L8seyvPtPWmJDpB12nUijWOKidtnmm6FQwmf+v5sTh59WkvinrpJTZDpMJZdcB0LkaIF9lDQVw/8dmNDh2JPzst2e2u+TESqUksVmv94nlHUP3qXWGHVSMM1fwqzjaHstfoyCTbbirVxmlEFkWeEhppVPbFqpuAxrsY7I91P2fpcI4jr7QXuRNHXhCqxFZy3RJPqqb4nzimNLoQ33AwlAXHxzVosqot6gOQ1o7Aga2wEJIAVAnsn8dZzr2/2jbRp6ER59jTCB6COBH5FeeL+7XJ8qHBxEHDVERvOGU0F5sxow/sP0To4YLwNQO/m1FImIrXSlu+nEWRkMZS7XUPP5W1R0lzeoU9F7ndoox43ZSyQr0CGaGA+BzzNeTxCDZ47EQzOXg5X/hdXKtEZX+rzfLNK6Cm+dMedk8dcdsuDp1LFVhztfPE6kRQQzZxOI6vbq9VcCNvfDCb3x54f6m4n0wsg3C0/+jOvp9mJcfljmGJHnkjXD7ygiQjQfToEYwNB46wi1cprkOd5EJTWTcvDseUa0v/jEVQScB6D3WsvViSZxwV0Er972THKmng5NCN0T5l1BbX7dSmEBohczfr1oip2bL70Spek96e7qzcDbk40k5YpXRHZjNH4+1I79fU3LU4vXnN+zKlm6ShrLRsjLidWIMceeVlqgMZWkMPVHhd7UZU59D9knKPAFWCtzXWXCGpWuPsq/UtPXd0f/erJV2XFuWfjqn2GYOXXXWqo1cisWKmwkV2eaFtvx9QyPTNyOMsaypvlYVJ7ROuoGOK5o47O2WzGtUN8YTfd8QjZVd99VFmgP4a0eIa6kSz4z5aaU85+2vGEnWHbr7fiTrr4KnRGK9swwmkCad9Djr785pWWwA1rMZAn7aJ9prHCvr71kvdxdFe/miXJGJSFCQ5j+FgEVNxR39Yr3nBasTJiX4X28bDsweQfY8CDrM8ahpzt2GUKfjp2cvxPubRGZy6qtaGkexZtD57Ha0bSzsvLxJZ9zSZ9mKyp9kY7/4aZoOD33QrPm69Tp9MPwYxP2fqunNcXfS+8q7F45hFGlD1bGFBQkajfPzmdeMYt6eOqvZ5RWunMlhq64KlbaoAaULyfBoRa1MSfReNlLR2aKR892m9n1ACffv7CfkAQC5sewDgqGnyLtPssx/lxZCF+9uNfvuCLvD37+UC2nPe/ykPGGKvbB7wNUj5jsXUx9945SYfRV0xiOoj+fuHN7+hZf82v5pdLs+uFqNmj7IMnq8taxUdQonc/wU2IRMP7ASligGXxQ5XkH3qW56TdZxEM2CkDUel0nNYtyOP2cS02I90W54iKKaq46VkqJf3/H/kiSqLnqvdqzRreI96x2i8hzTf3No3RrWbiTKkvwabvYGt+RZTfbdIrhcg5YttKNvOvoQEXwlM1eBgO/gDcXOcL+wwAAA=";
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
