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
var SCRIPT_VERSION = "0.4.41";
var SPOOLER_NOTIFIER_BASE64 = "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AAAAAB4AAAAEAAAAAAAAAAAAAAABAEgAAAAAAAQAAAAAAAAAAAAAAAEAUQAAAAAAAAAAAAA8TW9kdWxlPgBTcG9vbGVyTm90aWZpZXIuZGxsAFNwb29sZXJOb3RpZmllcgBNZXNoUHJpbnRlckNvbnRyb2wuTmF0aXZlAG1zY29ybGliAFN5c3RlbQBPYmplY3QASURpc3Bvc2FibGUAUHJpbnRlckNoYW5nZUpvYgBXYWl0T2JqZWN0MABXYWl0VGltZW91dABXYWl0RmFpbGVkAHByaW50ZXJIYW5kbGUAbm90aWZpY2F0aW9uSGFuZGxlAE9wZW5QcmludGVyAENsb3NlUHJpbnRlcgBGaW5kRmlyc3RQcmludGVyQ2hhbmdlTm90aWZpY2F0aW9uAEZpbmROZXh0UHJpbnRlckNoYW5nZU5vdGlmaWNhdGlvbgBGaW5kQ2xvc2VQcmludGVyQ2hhbmdlTm90aWZpY2F0aW9uAEZyZWVQcmludGVyTm90aWZ5SW5mbwBXYWl0Rm9yU2luZ2xlT2JqZWN0AEluaXRpYWxpemUAV2FpdABEaXNwb3NlAC5jdG9yAHByaW50ZXJOYW1lAHByaW50ZXIAU3lzdGVtLlJ1bnRpbWUuSW50ZXJvcFNlcnZpY2VzAE91dEF0dHJpYnV0ZQBkZWZhdWx0cwBmaWx0ZXIAb3B0aW9ucwBub3RpZnlPcHRpb25zAG5vdGlmaWNhdGlvbgBjaGFuZ2UAbm90aWZ5SW5mbwBoYW5kbGUAbWlsbGlzZWNvbmRzAFN5c3RlbS5SdW50aW1lLkNvbXBpbGVyU2VydmljZXMAQ29tcGlsYXRpb25SZWxheGF0aW9uc0F0dHJpYnV0ZQBSdW50aW1lQ29tcGF0aWJpbGl0eUF0dHJpYnV0ZQBEbGxJbXBvcnRBdHRyaWJ1dGUAd2luc3Bvb2wuZHJ2AGtlcm5lbDMyLmRsbABJbnRQdHIAWmVybwBvcF9FcXVhbGl0eQBJbnZhbGlkT3BlcmF0aW9uRXhjZXB0aW9uAE1hcnNoYWwAR2V0TGFzdFdpbjMyRXJyb3IAU3lzdGVtLkNvbXBvbmVudE1vZGVsAFdpbjMyRXhjZXB0aW9uAFVJbnQzMgBTdHJpbmcAQ29uY2F0AG9wX0luZXF1YWxpdHkAAAAAAFFTAHAAbwBvAGwA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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAwAAAAgOgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
var NATIVE_JOB_ENUMERATOR_CS_BASE64 = "dXNpbmcgU3lzdGVtOwp1c2luZyBTeXN0ZW0uQ29sbGVjdGlvbnMuR2VuZXJpYzsKdXNpbmcgU3lzdGVtLlJ1bnRpbWUuSW50ZXJvcFNlcnZpY2VzOwoKbmFtZXNwYWNlIE1lc2hQcmludGVyQ29udHJvbC5Kb2JBcGkKewogICAgW1N0cnVjdExheW91dChMYXlvdXRLaW5kLlNlcXVlbnRpYWwpXQogICAgaW50ZXJuYWwgc3RydWN0IFNZU1RFTVRJTUUKICAgIHsKICAgICAgICBwdWJsaWMgdXNob3J0IFllYXI7CiAgICAgICAgcHVibGljIHVzaG9ydCBNb250aDsKICAgICAgICBwdWJsaWMgdXNob3J0IERheU9mV2VlazsKICAgICAgICBwdWJsaWMgdXNob3J0IERheTsKICAgICAgICBwdWJsaWMgdXNob3J0IEhvdXI7CiAgICAgICAgcHVibGljIHVzaG9ydCBNaW51dGU7CiAgICAgICAgcHVibGljIHVzaG9ydCBTZWNvbmQ7CiAgICAgICAgcHVibGljIHVzaG9ydCBNaWxsaXNlY29uZHM7CiAgICB9CgogICAgW1N0cnVjdExheW91dChMYXlvdXRLaW5kLlNlcXVlbnRpYWwsIENoYXJTZXQgPSBDaGFyU2V0LlVuaWNvZGUpXQogICAgaW50ZXJuYWwgc3RydWN0IEpPQl9JTkZPXzEKICAgIHsKICAgICAgICBwdWJsaWMgdWludCBKb2JJZDsKICAgICAgICBwdWJsaWMgSW50UHRyIFByaW50ZXJOYW1lOwogICAgICAgIHB1YmxpYyBJbnRQdHIgTWFjaGluZU5hbWU7CiAgICAgICAgcHVibGljIEludFB0ciBVc2VyTmFtZTsKICAgICAgICBwdWJsaWMgSW50UHRyIERvY3VtZW50OwogICAgICAgIHB1YmxpYyBJbnRQdHIgRGF0YVR5cGU7CiAgICAgICAgcHVibGljIEludFB0ciBTdGF0dXNUZXh0OwogICAgICAgIHB1YmxpYyB1aW50IFN0YXR1czsKICAgICAgICBwdWJsaWMgdWludCBQcmlvcml0eTsKICAgICAgICBwdWJsaWMgdWludCBQb3NpdGlvbjsKICAgICAgICBwdWJsaWMgdWludCBUb3RhbFBhZ2VzOwogICAgICAgIHB1YmxpYyB1aW50IFBhZ2VzUHJpbnRlZDsKICAgICAgICBwdWJsaWMgU1lTVEVNVElNRSBTdWJtaXR0ZWQ7CiAgICB9CgogICAgcHVibGljIHNlYWxlZCBjbGFzcyBOYXRpdmVKb2IKICAgIHsKICAgICAgICBwdWJsaWMgaW50IElkOwogICAgICAgIHB1YmxpYyBzdHJpbmcgUHJpbnRlck5hbWU7CiAgICAgICAgcHVibGljIHN0cmluZyBNYWNoaW5lTmFtZTsKICAgICAgICBwdWJsaWMgc3RyaW5nIFVzZXJOYW1lOwogICAgICAgIHB1YmxpYyBzdHJpbmcgRG9jdW1lbnROYW1lOwogICAgICAgIHB1YmxpYyBzdHJpbmcgRGF0YVR5cGU7CiAgICAgICAgcHVibGljIHN0cmluZyBTdGF0dXNUZXh0OwogICAgICAgIHB1YmxpYyB1aW50IFN0YXR1c01hc2s7CiAgICAgICAgcHVibGljIGludCBQb3NpdGlvbjsKICAgICAgICBwdWJsaWMgaW50IFRvdGFsUGFnZXM7CiAgICAgICAgcHVibGljIGludCBQYWdlc1ByaW50ZWQ7CiAgICAgICAgcHVibGljIHN0cmluZyBTdWJtaXR0ZWRUaW1lOwogICAgfQoKICAgIHB1YmxpYyBzdGF0aWMgY2xhc3MgTmF0aXZlSm9iRW51bWVyYXRvcgogICAgewogICAgICAgIFtEbGxJbXBvcnQoIndpbnNwb29sLmRydiIsIEVudHJ5UG9pbnQgPSAiT3BlblByaW50ZXJXIiwgU2V0TGFzdEVycm9yID0gdHJ1ZSwgQ2hhclNldCA9IENoYXJTZXQuVW5pY29kZSldCiAgICAgICAgcHJpdmF0ZSBzdGF0aWMgZXh0ZXJuIGJvb2wgT3BlblByaW50ZXIoc3RyaW5nIHByaW50ZXJOYW1lLCBvdXQgSW50UHRyIHByaW50ZXJIYW5kbGUsIEludFB0ciBkZWZhdWx0cyk7CgogICAgICAgIFtEbGxJbXBvcnQoIndpbnNwb29sLmRydiIsIFNldExhc3RFcnJvciA9IHRydWUpXQogICAgICAgIHByaXZhdGUgc3RhdGljIGV4dGVybiBib29sIENsb3NlUHJpbnRlcihJbnRQdHIgcHJpbnRlckhhbmRsZSk7CgogICAgICAgIFtEbGxJbXBvcnQoIndpbnNwb29sLmRydiIsIEVudHJ5UG9pbnQgPSAiRW51bUpvYnNXIiwgU2V0TGFzdEVycm9yID0gdHJ1ZSwgQ2hhclNldCA9IENoYXJTZXQuVW5pY29kZSldCiAgICAgICAgcHJpdmF0ZSBzdGF0aWMgZXh0ZXJuIGJvb2wgRW51bUpvYnMoCiAgICAgICAgICAgIEludFB0ciBwcmludGVySGFuZGxlLAogICAgICAgICAgICB1aW50IGZpcnN0Sm9iLAogICAgICAgICAgICB1aW50IG51bWJlck9mSm9icywKICAgICAgICAgICAgdWludCBsZXZlbCwKICAgICAgICAgICAgSW50UHRyIGpvYkJ1ZmZlciwKICAgICAgICAgICAgdWludCBidWZmZXJTaXplLAogICAgICAgICAgICBvdXQgdWludCBieXRlc05lZWRlZCwKICAgICAgICAgICAgb3V0IHVpbnQgam9ic1JldHVybmVkKTsKCiAgICAgICAgcHJpdmF0ZSBzdGF0aWMgc3RyaW5nIFJlYWRTdHJpbmcoSW50UHRyIHBvaW50ZXIpCiAgICAgICAgewogICAgICAgICAgICByZXR1cm4gcG9pbnRlciA9PSBJbnRQdHIuWmVybyA/IFN0cmluZy5FbXB0eSA6IChNYXJzaGFsLlB0clRvU3RyaW5nVW5pKHBvaW50ZXIpID8/IFN0cmluZy5FbXB0eSk7CiAgICAgICAgfQoKICAgICAgICBwcml2YXRlIHN0YXRpYyBzdHJpbmcgRm9ybWF0U3VibWl0dGVkKFNZU1RFTVRJTUUgdmFsdWUpCiAgICAgICAgewogICAgICAgICAgICBpZiAodmFsdWUuWWVhciA8IDE2MDEgfHwgdmFsdWUuTW9udGggPCAxIHx8IHZhbHVlLkRheSA8IDEpIHJldHVybiBTdHJpbmcuRW1wdHk7CiAgICAgICAgICAgIHRyeQogICAgICAgICAgICB7CiAgICAgICAgICAgICAgICBEYXRlVGltZSBsb2NhbCA9IG5ldyBEYXRlVGltZSgKICAgICAgICAgICAgICAgICAgICB2YWx1ZS5ZZWFyLCB2YWx1ZS5Nb250aCwgdmFsdWUuRGF5LAogICAgICAgICAgICAgICAgICAgIHZhbHVlLkhvdXIsIHZhbHVlLk1pbnV0ZSwgdmFsdWUuU2Vjb25kLAogICAgICAgICAgICAgICAgICAgIHZhbHVlLk1pbGxpc2Vjb25kcywgRGF0ZVRpbWVLaW5kLkxvY2FsKTsKICAgICAgICAgICAgICAgIHJldHVybiBsb2NhbC5Ub1VuaXZlcnNhbFRpbWUoKS5Ub1N0cmluZygibyIpOwogICAgICAgICAgICB9CiAgICAgICAgICAgIGNhdGNoCiAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgIHJldHVybiBTdHJpbmcuRW1wdHk7CiAgICAgICAgICAgIH0KICAgICAgICB9CgogICAgICAgIHB1YmxpYyBzdGF0aWMgTmF0aXZlSm9iW10gR2V0Sm9icyhzdHJpbmcgcHJpbnRlck5hbWUpCiAgICAgICAgewogICAgICAgICAgICBpZiAoU3RyaW5nLklzTnVsbE9yV2hpdGVTcGFjZShwcmludGVyTmFtZSkpIHJldHVybiBuZXcgTmF0aXZlSm9iWzBdOwoKICAgICAgICAgICAgSW50UHRyIHByaW50ZXJIYW5kbGU7CiAgICAgICAgICAgIGlmICghT3BlblByaW50ZXIocHJpbnRlck5hbWUsIG91dCBwcmludGVySGFuZGxlLCBJbnRQdHIuWmVybykgfHwgcHJpbnRlckhhbmRsZSA9PSBJbnRQdHIuWmVybykKICAgICAgICAgICAgICAgIHJldHVybiBuZXcgTmF0aXZlSm9iWzBdOwoKICAgICAgICAgICAgdHJ5CiAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgIHVpbnQgYnl0ZXNOZWVkZWQ7CiAgICAgICAgICAgICAgICB1aW50IGpvYnNSZXR1cm5lZDsKICAgICAgICAgICAgICAgIEVudW1Kb2JzKHByaW50ZXJIYW5kbGUsIDAsIDk5OTksIDEsIEludFB0ci5aZXJvLCAwLCBvdXQgYnl0ZXNOZWVkZWQsIG91dCBqb2JzUmV0dXJuZWQpOwogICAgICAgICAgICAgICAgaWYgKGJ5dGVzTmVlZGVkID09IDApIHJldHVybiBuZXcgTmF0aXZlSm9iWzBdOwoKICAgICAgICAgICAgICAgIEludFB0ciBidWZmZXIgPSBNYXJzaGFsLkFsbG9jSEdsb2JhbChjaGVja2VkKChpbnQpYnl0ZXNOZWVkZWQpKTsKICAgICAgICAgICAgICAgIHRyeQogICAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgICAgIGlmICghRW51bUpvYnMocHJpbnRlckhhbmRsZSwgMCwgOTk5OSwgMSwgYnVmZmVyLCBieXRlc05lZWRlZCwgb3V0IGJ5dGVzTmVlZGVkLCBvdXQgam9ic1JldHVybmVkKSkKICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBOYXRpdmVKb2JbMF07CgogICAgICAgICAgICAgICAgICAgIGludCBpdGVtU2l6ZSA9IE1hcnNoYWwuU2l6ZU9mKHR5cGVvZihKT0JfSU5GT18xKSk7CiAgICAgICAgICAgICAgICAgICAgTGlzdDxOYXRpdmVKb2I+IGpvYnMgPSBuZXcgTGlzdDxOYXRpdmVKb2I+KGNoZWNrZWQoKGludClqb2JzUmV0dXJuZWQpKTsKICAgICAgICAgICAgICAgICAgICBmb3IgKHVpbnQgaW5kZXggPSAwOyBpbmRleCA8IGpvYnNSZXR1cm5lZDsgaW5kZXgrKykKICAgICAgICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAgICAgICAgIEludFB0ciBpdGVtUG9pbnRlciA9IG5ldyBJbnRQdHIoYnVmZmVyLlRvSW50NjQoKSArICgobG9uZylpdGVtU2l6ZSAqIGluZGV4KSk7CiAgICAgICAgICAgICAgICAgICAgICAgIEpPQl9JTkZPXzEgaXRlbSA9IChKT0JfSU5GT18xKU1hcnNoYWwuUHRyVG9TdHJ1Y3R1cmUoaXRlbVBvaW50ZXIsIHR5cGVvZihKT0JfSU5GT18xKSk7CiAgICAgICAgICAgICAgICAgICAgICAgIE5hdGl2ZUpvYiBqb2IgPSBuZXcgTmF0aXZlSm9iKCk7CiAgICAgICAgICAgICAgICAgICAgICAgIGpvYi5JZCA9IGNoZWNrZWQoKGludClpdGVtLkpvYklkKTsKICAgICAgICAgICAgICAgICAgICAgICAgam9iLlByaW50ZXJOYW1lID0gUmVhZFN0cmluZyhpdGVtLlByaW50ZXJOYW1lKTsKICAgICAgICAgICAgICAgICAgICAgICAgam9iLk1hY2hpbmVOYW1lID0gUmVhZFN0cmluZyhpdGVtLk1hY2hpbmVOYW1lKTsKICAgICAgICAgICAgICAgICAgICAgICAgam9iLlVzZXJOYW1lID0gUmVhZFN0cmluZyhpdGVtLlVzZXJOYW1lKTsKICAgICAgICAgICAgICAgICAgICAgICAgam9iLkRvY3VtZW50TmFtZSA9IFJlYWRTdHJpbmcoaXRlbS5Eb2N1bWVudCk7CiAgICAgICAgICAgICAgICAgICAgICAgIGpvYi5EYXRhVHlwZSA9IFJlYWRTdHJpbmcoaXRlbS5EYXRhVHlwZSk7CiAgICAgICAgICAgICAgICAgICAgICAgIGpvYi5TdGF0dXNUZXh0ID0gUmVhZFN0cmluZyhpdGVtLlN0YXR1c1RleHQpOwogICAgICAgICAgICAgICAgICAgICAgICBqb2IuU3RhdHVzTWFzayA9IGl0ZW0uU3RhdHVzOwogICAgICAgICAgICAgICAgICAgICAgICBqb2IuUG9zaXRpb24gPSBjaGVja2VkKChpbnQpaXRlbS5Qb3NpdGlvbik7CiAgICAgICAgICAgICAgICAgICAgICAgIGpvYi5Ub3RhbFBhZ2VzID0gY2hlY2tlZCgoaW50KWl0ZW0uVG90YWxQYWdlcyk7CiAgICAgICAgICAgICAgICAgICAgICAgIGpvYi5QYWdlc1ByaW50ZWQgPSBjaGVja2VkKChpbnQpaXRlbS5QYWdlc1ByaW50ZWQpOwogICAgICAgICAgICAgICAgICAgICAgICBqb2IuU3VibWl0dGVkVGltZSA9IEZvcm1hdFN1Ym1pdHRlZChpdGVtLlN1Ym1pdHRlZCk7CiAgICAgICAgICAgICAgICAgICAgICAgIGpvYnMuQWRkKGpvYik7CiAgICAgICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgICAgICAgIHJldHVybiBqb2JzLlRvQXJyYXkoKTsKICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgICAgIGZpbmFsbHkKICAgICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICAgICBNYXJzaGFsLkZyZWVIR2xvYmFsKGJ1ZmZlcik7CiAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgIH0KICAgICAgICAgICAgZmluYWxseQogICAgICAgICAgICB7CiAgICAgICAgICAgICAgICBDbG9zZVByaW50ZXIocHJpbnRlckhhbmRsZSk7CiAgICAgICAgICAgIH0KICAgICAgICB9CiAgICB9Cn0K";
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
var WATCHER_MARKER = "MESH_PRINTERCONTROL_WATCHER_0441";


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
        "$deadline=(Get-Date).AddMinutes(10)",
        "$script:previous=@{}",
        "$script:firstSeenAt=@{}",
        "$script:physicalJobs=@{}",
        "$script:lastPhysicalPoll=(Get-Date).AddYears(-1)",
        "$script:lastPrinterSnapshot=(Get-Date).AddYears(-1)",
        "$script:lastPrinterFingerprint=''",
        "$script:lastCmdletJobPoll=(Get-Date).AddYears(-1)",
        "$script:knownPrinterNames=@()",
        "$script:printerSignalCache=@{}",
        "$script:deviceStateCache=@{}",
        "$notifier=$null",
        "$nativeAvailable=$false",
        "$script:nativeJobApiAvailable=$false",
        "$script:lastWmiJobPoll=(Get-Date).AddYears(-1)",
        "$script:lastPrintEventPoll=(Get-Date).AddYears(-1)",
        "$script:lastPrintEventRecordId=[long]0",
        "$script:printEventLogAvailable=$false",
        "[Console]::Out.WriteLine('{\"control\":\"ready\"}')",
        "[Console]::Out.Flush()",
        "try {",
        "  [void][Reflection.Assembly]::Load([Convert]::FromBase64String('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AAAAAB4AAAAEAAAAAAAAAAAAAAABAEgAAAAAAAQAAAAAAAAAAAAAAAEAUQAAAAAAAAAAAAA8TW9kdWxlPgBTcG9vbGVyTm90aWZpZXIuZGxsAFNwb29sZXJOb3RpZmllcgBNZXNoUHJpbnRlckNvbnRyb2wuTmF0aXZlAG1zY29ybGliAFN5c3RlbQBPYmplY3QASURpc3Bvc2FibGUAUHJpbnRlckNoYW5nZUpvYgBXYWl0T2JqZWN0MABXYWl0VGltZW91dABXYWl0RmFpbGVkAHByaW50ZXJIYW5kbGUAbm90aWZpY2F0aW9uSGFuZGxlAE9wZW5QcmludGVyAENsb3NlUHJpbnRlcgBGaW5kRmlyc3RQcmludGVyQ2hhbmdlTm90aWZpY2F0aW9uAEZpbmROZXh0UHJpbnRlckNoYW5nZU5vdGlmaWNhdGlvbgBGaW5kQ2xvc2VQcmludGVyQ2hhbmdlTm90aWZpY2F0aW9uAEZyZWVQcmludGVyTm90aWZ5SW5mbwBXYWl0Rm9yU2luZ2xlT2JqZWN0AEluaXRpYWxpemUAV2FpdABEaXNwb3NlAC5jdG9yAHByaW50ZXJOYW1lAHByaW50ZXIAU3lzdGVtLlJ1bnRpbWUuSW50ZXJvcFNlcnZpY2VzAE91dEF0dHJpYnV0ZQBkZWZhdWx0cwBmaWx0ZXIAb3B0aW9ucwBub3RpZnlPcHRpb25zAG5vdGlmaWNhdGlvbgBjaGFuZ2UAbm90aWZ5SW5mbwBoYW5kbGUAbWlsbGlzZWNvbmRzAFN5c3RlbS5SdW50aW1lLkNvbXBpbGVyU2VydmljZXMAQ29tcGlsYXRpb25SZWxheGF0aW9uc0F0dHJpYnV0ZQBSdW50aW1lQ29tcGF0aWJpbGl0eUF0dHJpYnV0ZQBEbGxJbXBvcnRBdHRyaWJ1dGUAd2luc3Bvb2wuZHJ2AGtlcm5lbDMyLmRsbABJbnRQdHIAWmVybwBvcF9FcXVhbGl0eQBJbnZhbGlkT3BlcmF0aW9uRXhjZXB0aW9uAE1hcnNoYWwAR2V0TGFzdFdpbjMyRXJyb3IAU3lzdGVtLkNvbXBvbmVudE1vZGVsAFdpbjMyRXhjZXB0aW9uAFVJbnQzMgBTdHJpbmcAQ29uY2F0AG9wX0luZXF1YWxpdHkAAAAAAFFTAHAAbwBvAGwA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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAwAAAAgOgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='))",
        "  $notifier=New-Object MeshPrinterControl.Native.SpoolerNotifier",
        "  $nativeAvailable=$notifier.Initialize()",
        "} catch { $nativeAvailable=$false }",
        "try {",
        "  $jobApiSource=[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('dXNpbmcgU3lzdGVtOwp1c2luZyBTeXN0ZW0uQ29sbGVjdGlvbnMuR2VuZXJpYzsKdXNpbmcgU3lzdGVtLlJ1bnRpbWUuSW50ZXJvcFNlcnZpY2VzOwoKbmFtZXNwYWNlIE1lc2hQcmludGVyQ29udHJvbC5Kb2JBcGkKewogICAgW1N0cnVjdExheW91dChMYXlvdXRLaW5kLlNlcXVlbnRpYWwpXQogICAgaW50ZXJuYWwgc3RydWN0IFNZU1RFTVRJTUUKICAgIHsKICAgICAgICBwdWJsaWMgdXNob3J0IFllYXI7CiAgICAgICAgcHVibGljIHVzaG9ydCBNb250aDsKICAgICAgICBwdWJsaWMgdXNob3J0IERheU9mV2VlazsKICAgICAgICBwdWJsaWMgdXNob3J0IERheTsKICAgICAgICBwdWJsaWMgdXNob3J0IEhvdXI7CiAgICAgICAgcHVibGljIHVzaG9ydCBNaW51dGU7CiAgICAgICAgcHVibGljIHVzaG9ydCBTZWNvbmQ7CiAgICAgICAgcHVibGljIHVzaG9ydCBNaWxsaXNlY29uZHM7CiAgICB9CgogICAgW1N0cnVjdExheW91dChMYXlvdXRLaW5kLlNlcXVlbnRpYWwsIENoYXJTZXQgPSBDaGFyU2V0LlVuaWNvZGUpXQogICAgaW50ZXJuYWwgc3RydWN0IEpPQl9JTkZPXzEKICAgIHsKICAgICAgICBwdWJsaWMgdWludCBKb2JJZDsKICAgICAgICBwdWJsaWMgSW50UHRyIFByaW50ZXJOYW1lOwogICAgICAgIHB1YmxpYyBJbnRQdHIgTWFjaGluZU5hbWU7CiAgICAgICAgcHVibGljIEludFB0ciBVc2VyTmFtZTsKICAgICAgICBwdWJsaWMgSW50UHRyIERvY3VtZW50OwogICAgICAgIHB1YmxpYyBJbnRQdHIgRGF0YVR5cGU7CiAgICAgICAgcHVibGljIEludFB0ciBTdGF0dXNUZXh0OwogICAgICAgIHB1YmxpYyB1aW50IFN0YXR1czsKICAgICAgICBwdWJsaWMgdWludCBQcmlvcml0eTsKICAgICAgICBwdWJsaWMgdWludCBQb3NpdGlvbjsKICAgICAgICBwdWJsaWMgdWludCBUb3RhbFBhZ2VzOwogICAgICAgIHB1YmxpYyB1aW50IFBhZ2VzUHJpbnRlZDsKICAgICAgICBwdWJsaWMgU1lTVEVNVElNRSBTdWJtaXR0ZWQ7CiAgICB9CgogICAgcHVibGljIHNlYWxlZCBjbGFzcyBOYXRpdmVKb2IKICAgIHsKICAgICAgICBwdWJsaWMgaW50IElkOwogICAgICAgIHB1YmxpYyBzdHJpbmcgUHJpbnRlck5hbWU7CiAgICAgICAgcHVibGljIHN0cmluZyBNYWNoaW5lTmFtZTsKICAgICAgICBwdWJsaWMgc3RyaW5nIFVzZXJOYW1lOwogICAgICAgIHB1YmxpYyBzdHJpbmcgRG9jdW1lbnROYW1lOwogICAgICAgIHB1YmxpYyBzdHJpbmcgRGF0YVR5cGU7CiAgICAgICAgcHVibGljIHN0cmluZyBTdGF0dXNUZXh0OwogICAgICAgIHB1YmxpYyB1aW50IFN0YXR1c01hc2s7CiAgICAgICAgcHVibGljIGludCBQb3NpdGlvbjsKICAgICAgICBwdWJsaWMgaW50IFRvdGFsUGFnZXM7CiAgICAgICAgcHVibGljIGludCBQYWdlc1ByaW50ZWQ7CiAgICAgICAgcHVibGljIHN0cmluZyBTdWJtaXR0ZWRUaW1lOwogICAgfQoKICAgIHB1YmxpYyBzdGF0aWMgY2xhc3MgTmF0aXZlSm9iRW51bWVyYXRvcgogICAgewogICAgICAgIFtEbGxJbXBvcnQoIndpbnNwb29sLmRydiIsIEVudHJ5UG9pbnQgPSAiT3BlblByaW50ZXJXIiwgU2V0TGFzdEVycm9yID0gdHJ1ZSwgQ2hhclNldCA9IENoYXJTZXQuVW5pY29kZSldCiAgICAgICAgcHJpdmF0ZSBzdGF0aWMgZXh0ZXJuIGJvb2wgT3BlblByaW50ZXIoc3RyaW5nIHByaW50ZXJOYW1lLCBvdXQgSW50UHRyIHByaW50ZXJIYW5kbGUsIEludFB0ciBkZWZhdWx0cyk7CgogICAgICAgIFtEbGxJbXBvcnQoIndpbnNwb29sLmRydiIsIFNldExhc3RFcnJvciA9IHRydWUpXQogICAgICAgIHByaXZhdGUgc3RhdGljIGV4dGVybiBib29sIENsb3NlUHJpbnRlcihJbnRQdHIgcHJpbnRlckhhbmRsZSk7CgogICAgICAgIFtEbGxJbXBvcnQoIndpbnNwb29sLmRydiIsIEVudHJ5UG9pbnQgPSAiRW51bUpvYnNXIiwgU2V0TGFzdEVycm9yID0gdHJ1ZSwgQ2hhclNldCA9IENoYXJTZXQuVW5pY29kZSldCiAgICAgICAgcHJpdmF0ZSBzdGF0aWMgZXh0ZXJuIGJvb2wgRW51bUpvYnMoCiAgICAgICAgICAgIEludFB0ciBwcmludGVySGFuZGxlLAogICAgICAgICAgICB1aW50IGZpcnN0Sm9iLAogICAgICAgICAgICB1aW50IG51bWJlck9mSm9icywKICAgICAgICAgICAgdWludCBsZXZlbCwKICAgICAgICAgICAgSW50UHRyIGpvYkJ1ZmZlciwKICAgICAgICAgICAgdWludCBidWZmZXJTaXplLAogICAgICAgICAgICBvdXQgdWludCBieXRlc05lZWRlZCwKICAgICAgICAgICAgb3V0IHVpbnQgam9ic1JldHVybmVkKTsKCiAgICAgICAgcHJpdmF0ZSBzdGF0aWMgc3RyaW5nIFJlYWRTdHJpbmcoSW50UHRyIHBvaW50ZXIpCiAgICAgICAgewogICAgICAgICAgICByZXR1cm4gcG9pbnRlciA9PSBJbnRQdHIuWmVybyA/IFN0cmluZy5FbXB0eSA6IChNYXJzaGFsLlB0clRvU3RyaW5nVW5pKHBvaW50ZXIpID8/IFN0cmluZy5FbXB0eSk7CiAgICAgICAgfQoKICAgICAgICBwcml2YXRlIHN0YXRpYyBzdHJpbmcgRm9ybWF0U3VibWl0dGVkKFNZU1RFTVRJTUUgdmFsdWUpCiAgICAgICAgewogICAgICAgICAgICBpZiAodmFsdWUuWWVhciA8IDE2MDEgfHwgdmFsdWUuTW9udGggPCAxIHx8IHZhbHVlLkRheSA8IDEpIHJldHVybiBTdHJpbmcuRW1wdHk7CiAgICAgICAgICAgIHRyeQogICAgICAgICAgICB7CiAgICAgICAgICAgICAgICBEYXRlVGltZSBsb2NhbCA9IG5ldyBEYXRlVGltZSgKICAgICAgICAgICAgICAgICAgICB2YWx1ZS5ZZWFyLCB2YWx1ZS5Nb250aCwgdmFsdWUuRGF5LAogICAgICAgICAgICAgICAgICAgIHZhbHVlLkhvdXIsIHZhbHVlLk1pbnV0ZSwgdmFsdWUuU2Vjb25kLAogICAgICAgICAgICAgICAgICAgIHZhbHVlLk1pbGxpc2Vjb25kcywgRGF0ZVRpbWVLaW5kLkxvY2FsKTsKICAgICAgICAgICAgICAgIHJldHVybiBsb2NhbC5Ub1VuaXZlcnNhbFRpbWUoKS5Ub1N0cmluZygibyIpOwogICAgICAgICAgICB9CiAgICAgICAgICAgIGNhdGNoCiAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgIHJldHVybiBTdHJpbmcuRW1wdHk7CiAgICAgICAgICAgIH0KICAgICAgICB9CgogICAgICAgIHB1YmxpYyBzdGF0aWMgTmF0aXZlSm9iW10gR2V0Sm9icyhzdHJpbmcgcHJpbnRlck5hbWUpCiAgICAgICAgewogICAgICAgICAgICBpZiAoU3RyaW5nLklzTnVsbE9yV2hpdGVTcGFjZShwcmludGVyTmFtZSkpIHJldHVybiBuZXcgTmF0aXZlSm9iWzBdOwoKICAgICAgICAgICAgSW50UHRyIHByaW50ZXJIYW5kbGU7CiAgICAgICAgICAgIGlmICghT3BlblByaW50ZXIocHJpbnRlck5hbWUsIG91dCBwcmludGVySGFuZGxlLCBJbnRQdHIuWmVybykgfHwgcHJpbnRlckhhbmRsZSA9PSBJbnRQdHIuWmVybykKICAgICAgICAgICAgICAgIHJldHVybiBuZXcgTmF0aXZlSm9iWzBdOwoKICAgICAgICAgICAgdHJ5CiAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgIHVpbnQgYnl0ZXNOZWVkZWQ7CiAgICAgICAgICAgICAgICB1aW50IGpvYnNSZXR1cm5lZDsKICAgICAgICAgICAgICAgIEVudW1Kb2JzKHByaW50ZXJIYW5kbGUsIDAsIDk5OTksIDEsIEludFB0ci5aZXJvLCAwLCBvdXQgYnl0ZXNOZWVkZWQsIG91dCBqb2JzUmV0dXJuZWQpOwogICAgICAgICAgICAgICAgaWYgKGJ5dGVzTmVlZGVkID09IDApIHJldHVybiBuZXcgTmF0aXZlSm9iWzBdOwoKICAgICAgICAgICAgICAgIEludFB0ciBidWZmZXIgPSBNYXJzaGFsLkFsbG9jSEdsb2JhbChjaGVja2VkKChpbnQpYnl0ZXNOZWVkZWQpKTsKICAgICAgICAgICAgICAgIHRyeQogICAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgICAgIGlmICghRW51bUpvYnMocHJpbnRlckhhbmRsZSwgMCwgOTk5OSwgMSwgYnVmZmVyLCBieXRlc05lZWRlZCwgb3V0IGJ5dGVzTmVlZGVkLCBvdXQgam9ic1JldHVybmVkKSkKICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBOYXRpdmVKb2JbMF07CgogICAgICAgICAgICAgICAgICAgIGludCBpdGVtU2l6ZSA9IE1hcnNoYWwuU2l6ZU9mKHR5cGVvZihKT0JfSU5GT18xKSk7CiAgICAgICAgICAgICAgICAgICAgTGlzdDxOYXRpdmVKb2I+IGpvYnMgPSBuZXcgTGlzdDxOYXRpdmVKb2I+KGNoZWNrZWQoKGludClqb2JzUmV0dXJuZWQpKTsKICAgICAgICAgICAgICAgICAgICBmb3IgKHVpbnQgaW5kZXggPSAwOyBpbmRleCA8IGpvYnNSZXR1cm5lZDsgaW5kZXgrKykKICAgICAgICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAgICAgICAgIEludFB0ciBpdGVtUG9pbnRlciA9IG5ldyBJbnRQdHIoYnVmZmVyLlRvSW50NjQoKSArICgobG9uZylpdGVtU2l6ZSAqIGluZGV4KSk7CiAgICAgICAgICAgICAgICAgICAgICAgIEpPQl9JTkZPXzEgaXRlbSA9IChKT0JfSU5GT18xKU1hcnNoYWwuUHRyVG9TdHJ1Y3R1cmUoaXRlbVBvaW50ZXIsIHR5cGVvZihKT0JfSU5GT18xKSk7CiAgICAgICAgICAgICAgICAgICAgICAgIE5hdGl2ZUpvYiBqb2IgPSBuZXcgTmF0aXZlSm9iKCk7CiAgICAgICAgICAgICAgICAgICAgICAgIGpvYi5JZCA9IGNoZWNrZWQoKGludClpdGVtLkpvYklkKTsKICAgICAgICAgICAgICAgICAgICAgICAgam9iLlByaW50ZXJOYW1lID0gUmVhZFN0cmluZyhpdGVtLlByaW50ZXJOYW1lKTsKICAgICAgICAgICAgICAgICAgICAgICAgam9iLk1hY2hpbmVOYW1lID0gUmVhZFN0cmluZyhpdGVtLk1hY2hpbmVOYW1lKTsKICAgICAgICAgICAgICAgICAgICAgICAgam9iLlVzZXJOYW1lID0gUmVhZFN0cmluZyhpdGVtLlVzZXJOYW1lKTsKICAgICAgICAgICAgICAgICAgICAgICAgam9iLkRvY3VtZW50TmFtZSA9IFJlYWRTdHJpbmcoaXRlbS5Eb2N1bWVudCk7CiAgICAgICAgICAgICAgICAgICAgICAgIGpvYi5EYXRhVHlwZSA9IFJlYWRTdHJpbmcoaXRlbS5EYXRhVHlwZSk7CiAgICAgICAgICAgICAgICAgICAgICAgIGpvYi5TdGF0dXNUZXh0ID0gUmVhZFN0cmluZyhpdGVtLlN0YXR1c1RleHQpOwogICAgICAgICAgICAgICAgICAgICAgICBqb2IuU3RhdHVzTWFzayA9IGl0ZW0uU3RhdHVzOwogICAgICAgICAgICAgICAgICAgICAgICBqb2IuUG9zaXRpb24gPSBjaGVja2VkKChpbnQpaXRlbS5Qb3NpdGlvbik7CiAgICAgICAgICAgICAgICAgICAgICAgIGpvYi5Ub3RhbFBhZ2VzID0gY2hlY2tlZCgoaW50KWl0ZW0uVG90YWxQYWdlcyk7CiAgICAgICAgICAgICAgICAgICAgICAgIGpvYi5QYWdlc1ByaW50ZWQgPSBjaGVja2VkKChpbnQpaXRlbS5QYWdlc1ByaW50ZWQpOwogICAgICAgICAgICAgICAgICAgICAgICBqb2IuU3VibWl0dGVkVGltZSA9IEZvcm1hdFN1Ym1pdHRlZChpdGVtLlN1Ym1pdHRlZCk7CiAgICAgICAgICAgICAgICAgICAgICAgIGpvYnMuQWRkKGpvYik7CiAgICAgICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgICAgICAgIHJldHVybiBqb2JzLlRvQXJyYXkoKTsKICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgICAgIGZpbmFsbHkKICAgICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICAgICBNYXJzaGFsLkZyZWVIR2xvYmFsKGJ1ZmZlcik7CiAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgIH0KICAgICAgICAgICAgZmluYWxseQogICAgICAgICAgICB7CiAgICAgICAgICAgICAgICBDbG9zZVByaW50ZXIocHJpbnRlckhhbmRsZSk7CiAgICAgICAgICAgIH0KICAgICAgICB9CiAgICB9Cn0K'))",
        "  Add-Type -TypeDefinition $jobApiSource -Language CSharp -ErrorAction Stop | Out-Null",
        "  $script:nativeJobApiAvailable=$true",
        "} catch { $script:nativeJobApiAvailable=$false }",
        "try {",
        "  $logName='Microsoft-Windows-PrintService/Operational'",
        "  try { & wevtutil.exe sl $logName /e:true 2>$null | Out-Null } catch { }",
        "  $latest=@(Get-WinEvent -FilterHashtable @{ LogName=$logName; Id=307 } -MaxEvents 1 -ErrorAction SilentlyContinue)",
        "  if ($latest.Count -gt 0) { $script:lastPrintEventRecordId=[long]$latest[0].RecordId }",
        "  $script:printEventLogAvailable=$true",
        "} catch { $script:printEventLogAvailable=$false }",
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
        "function Read-PrinterCmdletSignals($printerName) {",
        "  $key=([string]$printerName).ToLowerInvariant()",
        "  $now=Get-Date",
        "  if ($script:printerSignalCache.ContainsKey($key)) {",
        "    $cached=$script:printerSignalCache[$key]",
        "    if (($now-$cached.timestamp).TotalMilliseconds -lt 350) { return $cached }",
        "  }",
        "  $printerText=''",
        "  $jobText=''",
        "  [uint32]$jobMask=0",
        "  try {",
        "    $printer=Get-Printer -Name $printerName -ErrorAction Stop",
        "    $printerText=[string]$printer.PrinterStatus",
        "    try {",
        "      $cmdletJobs=@(Get-PrintJob -PrinterName $printerName -ErrorAction SilentlyContinue)",
        "      $jobText=(@($cmdletJobs | ForEach-Object { [string]$_.JobStatus } | Where-Object { $_ } | Sort-Object -Unique) -join ', ')",
        "      foreach ($cmdletJob in $cmdletJobs) { try { $jobMask=$jobMask -bor [uint32][int]$cmdletJob.JobStatus } catch { } }",
        "    } catch { $jobText=''; $jobMask=0 }",
        "  } catch { }",
        "  $result=[ordered]@{ printerStatus=$printerText; jobStatus=$jobText; jobStatusMask=[uint32]$jobMask; timestamp=$now }",
        "  $script:printerSignalCache[$key]=$result",
        "  return $result",
        "}",
        "function Resolve-LivePrinterState($printerStatus,$extended,$errorState,$workOffline,$printerText,$jobText,$jobMask) {",
        "  $combined=(([string]$printerText)+'|'+([string]$jobText)).ToLowerInvariant()",
        "  [uint32]$mask=[uint32]$jobMask",
        "  if ([bool]$workOffline -or $printerStatus -eq 7 -or $extended -in @(7,11) -or $errorState -eq 9 -or (($mask -band 32) -ne 0) -or $combined -match 'offline|not.?available|server.?unknown') { return 'Offline' }",
        "  if ($errorState -eq 8 -or $combined -match 'paper.?jam') { return 'Paper Jam' }",
        "  if ($errorState -eq 4 -or (($mask -band 64) -ne 0) -or $combined -match 'paper.?out|no.?paper') { return 'Paper Out' }",
        "  if ($errorState -eq 7 -or $combined -match 'door.?open') { return 'Door Open' }",
        "  if ($errorState -eq 6 -or $combined -match 'no.?toner|toner.?empty') { return 'No Toner' }",
        "  if ($combined -match 'output.?bin.?full') { return 'Output Bin Full' }",
        "  if ($combined -match 'out.?of.?memory') { return 'Out of Memory' }",
        "  if ($combined -match 'manual.?feed') { return 'Manual Feed' }",
        "  if ((($mask -band 1024) -ne 0) -or (($mask -band 512) -ne 0) -or $combined -match 'user.?intervention|attention|blocked') { return 'User Intervention' }",
        "  if ($extended -eq 9 -or $errorState -in @(10,11) -or (($mask -band 2) -ne 0) -or $combined -match '(^|[^a-z])error([^a-z]|$)|paper.?problem|page.?punt') { return 'Error' }",
        "  if ($printerStatus -eq 6 -or $extended -eq 6 -or $combined -match 'stopped') { return 'Stopped' }",
        "  if ($extended -eq 8 -or (($mask -band 1) -ne 0) -or $combined -match 'paused') { return 'Paused' }",
        "  if ($errorState -eq 5 -or $combined -match 'toner.?low') { return 'Toner Low' }",
        "  if ($errorState -eq 3 -or $combined -match 'paper.?low') { return 'Paper Low' }",
        "  if ($printerStatus -eq 5 -or $extended -in @(5,14) -or $combined -match 'warming|initializ') { return 'Warming up' }",
        "  if ((($mask -band 24) -ne 0) -or $printerStatus -eq 4 -or $extended -in @(4,10,12,13,17) -or $combined -match 'printing|busy|processing|spooling|i/?o.?active|waiting') { return 'Printing' }",
        "  if ($printerStatus -eq 3 -or $extended -in @(3,15) -or $combined -match 'idle|ready|normal|power.?save') { return 'Idle' }",
        "  return 'Ready'",
        "}",
        "function Resolve-PrintJobState($statusMask,$jobStatus,$statusText) {",
        "  [uint32]$mask=[uint32]$statusMask",
        "  $combined=(([string]$jobStatus)+'|'+([string]$statusText)).ToLowerInvariant()",
        "  if ((($mask -band 32) -ne 0) -or $combined -match 'offline') { return 'Offline' }",
        "  if ((($mask -band 64) -ne 0) -or $combined -match 'paper.?out|no.?paper') { return 'Paper Out' }",
        "  if ((($mask -band 1024) -ne 0) -or (($mask -band 512) -ne 0) -or $combined -match 'user.?intervention|blocked|attention') { return 'User Intervention' }",
        "  if ((($mask -band 2) -ne 0) -or $combined -match '(^|[^a-z])error([^a-z]|$)') { return 'Error' }",
        "  if ((($mask -band 1) -ne 0) -or $combined -match 'paused') { return 'Paused' }",
        "  if ((($mask -band 4) -ne 0) -or (($mask -band 256) -ne 0) -or $combined -match 'deleted|deleting|cancelled|canceled') { return 'Deleting' }",
        "  if ((($mask -band 8) -ne 0) -or $combined -match 'spooling') { return 'Spooling' }",
        "  if ((($mask -band 16) -ne 0) -or $combined -match 'printing') { return 'Printing' }",
        "  if ((($mask -band 128) -ne 0) -or $combined -match 'printed|completed|complete') { return 'Printing' }",
        "  return $(if ([string]::IsNullOrWhiteSpace([string]$jobStatus)) { 'Queued' } else { [string]$jobStatus })",
        "}",
        "function Get-HighestPriorityQueueFault($jobs) {",
        "  $states=@($jobs | ForEach-Object { [string]$_.jobStatus })",
        "  foreach ($candidate in @('Offline','Paper Jam','Paper Out','Door Open','No Toner','Output Bin Full','Out of Memory','Manual Feed','User Intervention','Error','Stopped','Paused')) {",
        "    if ($states -contains $candidate) { return $candidate }",
        "  }",
        "  return ''",
        "}",
        "function Get-LivePrinterState($item) {",
        "  $signals=Read-PrinterCmdletSignals ([string]$item.Name)",
        "  return Resolve-LivePrinterState ([int]$item.PrinterStatus) ([int]$item.ExtendedPrinterStatus) ([int]$item.DetectedErrorState) ([bool]$item.WorkOffline) ([string]$signals.printerStatus) ([string]$signals.jobStatus) ([uint32]$signals.jobStatusMask)",
        "}",
        "function Read-ActivePrinterSnapshot($current) {",
        "  $printerQuery=New-Object System.Management.ObjectQuery('SELECT Name,DriverName,PortName,Shared,ShareName,Default,PrinterStatus,ExtendedPrinterStatus,DetectedErrorState,WorkOffline FROM Win32_Printer')",
        "  $printerSearcher=New-Object System.Management.ManagementObjectSearcher($scope,$printerQuery)",
        "  $printerSearcher.Options.ReturnImmediately=$false",
        "  try {",
        "    $items=New-Object System.Collections.ArrayList",
        "    $activeNames=New-Object System.Collections.ArrayList",
        "    foreach ($item in @($printerSearcher.Get())) {",
        "      if (-not (Test-IsRealActivePrinter $item)) { continue }",
        "      $name=[string]$item.Name",
        "      [void]$activeNames.Add($name)",
        "      $queueCount=@($current.Values | Where-Object { $_.printerName -eq $name }).Count",
        "      $physicalCount=0",
        "      foreach ($physicalKey in @($script:physicalJobs.Keys)) {",
        "        if ($script:physicalJobs[$physicalKey].printerName -eq $name) { $physicalCount++ }",
        "      }",
        "      $jobCount=$queueCount+$physicalCount",
        "      $liveState=Get-LivePrinterState $item",
        "      $queueFault=Get-HighestPriorityQueueFault @($current.Values | Where-Object { $_.printerName -eq $name })",
        "      if (-not [string]::IsNullOrWhiteSpace([string]$queueFault)) { $liveState=[string]$queueFault }",
        "      elseif ($jobCount -gt 0 -and $liveState -notmatch '^(Offline|Paper Jam|Paper Out|Door Open|No Toner|Output Bin Full|Out of Memory|Manual Feed|User Intervention|Error|Stopped|Paused)$') { $liveState='Printing' }",
        "      elseif ($jobCount -eq 0 -and $liveState -eq 'Printing') { $liveState='Idle' }",
        "      [void]$items.Add([ordered]@{ name=$name; status=$liveState; driverName=[string]$item.DriverName; portName=[string]$item.PortName; shared=[bool]$item.Shared; shareName=[string]$item.ShareName; default=[bool]$item.Default; jobCount=[int]$jobCount; active=$true; real=$true })",
        "    }",
        "    $script:knownPrinterNames=@($activeNames | Sort-Object -Unique)",
        "    return @($items | Sort-Object name)",
        "  } catch { return @() }",
        "  finally { $printerSearcher.Dispose() }",
        "}",
        "function Publish-ActivePrinterSnapshot($current,$force) {",
        "  $now=Get-Date",
        "  if (-not $force -and ($now-$script:lastPrinterSnapshot).TotalMilliseconds -lt 1000) { return 0 }",
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
        "function New-LivePrintJob($key,$printerName,$jobId,$document,$owner,$rawStatus,$statusText,$statusMask,$totalPages,$pagesPrinted,$size,$submittedTime,$source) {",
        "  if ([string]::IsNullOrWhiteSpace([string]$key) -or [string]::IsNullOrWhiteSpace([string]$printerName)) { return $null }",
        "  if (-not $script:firstSeenAt.ContainsKey($key)) { $script:firstSeenAt[$key]=Get-Date }",
        "  $displayStatus=Resolve-PrintJobState ([uint32]$statusMask) ([string]$rawStatus) ([string]$statusText)",
        "  $device=Read-PrinterDeviceState $printerName",
        "  if ([bool]$device.fault -or [bool]$device.paused) { $displayStatus=[string]$device.state }",
        "  $job=[ordered]@{",
        "    key=[string]$key",
        "    printerName=[string]$printerName",
        "    id=[int]$jobId",
        "    documentName=[string]$document",
        "    userName=[string]$owner",
        "    jobStatus=[string]$displayStatus",
        "    rawJobStatus=[string]$rawStatus",
        "    statusText=[string]$statusText",
        "    statusMask=[uint32]$statusMask",
        "    totalPages=[int]$totalPages",
        "    pagesPrinted=[int]$pagesPrinted",
        "    size=[long]$size",
        "    submittedTime=$submittedTime",
        "    firstSeenAt=$script:firstSeenAt[$key]",
        "    recentCompleted=$false",
        "    physicalPending=$false",
        "    physicalStatusReported=[bool]$device.reported",
        "    deviceState=$(if ([bool]$device.fault -or [bool]$device.paused) { [string]$device.state } else { '' })",
        "    trackingMode=[string]$source",
        "    estimatedSecondsRemaining=0",
        "    spoolerOwned=$true",
        "  }",
        "  $job['fingerprint']=('{0}|{1}|{2}|{3}|{4}|{5}|{6}|{7}|{8}|{9}|{10}' -f $job.documentName,$job.userName,$job.rawJobStatus,$job.statusText,$job.statusMask,$job.totalPages,$job.pagesPrinted,$job.size,$job.jobStatus,$job.deviceState,$job.trackingMode)",
        "  return $job",
        "}",
        "function Get-MonitorPrinterNames {",
        "  $names=@($script:knownPrinterNames)",
        "  if ($names.Count -gt 0) { return @($names | Sort-Object -Unique) }",
        "  try { $names=@(Get-Printer -ErrorAction Stop | Select-Object -ExpandProperty Name) } catch { $names=@() }",
        "  if ($names.Count -eq 0) {",
        "    $query=New-Object System.Management.ObjectQuery('SELECT Name FROM Win32_Printer')",
        "    $searcher=New-Object System.Management.ManagementObjectSearcher($scope,$query)",
        "    $searcher.Options.ReturnImmediately=$false",
        "    try { $names=@($searcher.Get() | ForEach-Object { [string]$_.Name } | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }) } catch { $names=@() } finally { $searcher.Dispose() }",
        "  }",
        "  return @($names | Sort-Object -Unique)",
        "}",
        "function Merge-NativePrintJobs($current) {",
        "  if (-not $script:nativeJobApiAvailable) { return }",
        "  foreach ($printerNameValue in @(Get-MonitorPrinterNames)) {",
        "    $queueName=[string]$printerNameValue",
        "    if ([string]::IsNullOrWhiteSpace($queueName)) { continue }",
        "    $nativeJobs=@()",
        "    try { $nativeJobs=@([MeshPrinterControl.JobApi.NativeJobEnumerator]::GetJobs($queueName)) } catch { continue }",
        "    foreach ($item in $nativeJobs) {",
        "      $jobId=0",
        "      try { $jobId=[int]$item.Id } catch { continue }",
        "      if ($jobId -lt 1) { continue }",
        "      $printerName=[string]$item.PrinterName",
        "      if ([string]::IsNullOrWhiteSpace($printerName)) { $printerName=$queueName }",
        "      $key=('{0}, {1}' -f $printerName,$jobId)",
        "      [uint32]$statusMask=0",
        "      try { $statusMask=[uint32]$item.StatusMask } catch { }",
        "      $rawStatus=[string]$item.StatusText",
        "      if ([string]::IsNullOrWhiteSpace($rawStatus)) { $rawStatus='Queued' }",
        "      $document=[string]$item.DocumentName",
        "      if ([string]::IsNullOrWhiteSpace($document)) { $document=('Print job #{0}' -f $jobId) }",
        "      $owner=[string]$item.UserName",
        "      $submitted=$null",
        "      if (-not [string]::IsNullOrWhiteSpace([string]$item.SubmittedTime)) { try { $submitted=[datetime]::Parse([string]$item.SubmittedTime) } catch { } }",
        "      $job=New-LivePrintJob $key $printerName $jobId $document $owner $rawStatus '' $statusMask ([int]$item.TotalPages) ([int]$item.PagesPrinted) 0 $submitted 'Winspool EnumJobs'",
        "      if ($null -eq $job) { continue }",
        "      if ($current.ContainsKey($key)) {",
        "        $existing=$current[$key]",
        "        if ([string]::IsNullOrWhiteSpace([string]$existing.documentName) -and -not [string]::IsNullOrWhiteSpace($document)) { $existing.documentName=$document }",
        "        if ([string]::IsNullOrWhiteSpace([string]$existing.userName) -and -not [string]::IsNullOrWhiteSpace($owner)) { $existing.userName=$owner }",
        "        if ([int]$existing.totalPages -lt 1 -and [int]$item.TotalPages -gt 0) { $existing.totalPages=[int]$item.TotalPages }",
        "        if ([int]$existing.pagesPrinted -lt [int]$item.PagesPrinted) { $existing.pagesPrinted=[int]$item.PagesPrinted }",
        "        $existing.statusMask=([uint32]$existing.statusMask -bor $statusMask)",
        "        if (-not [string]::IsNullOrWhiteSpace([string]$item.StatusText)) { $existing.statusText=[string]$item.StatusText; $existing.rawJobStatus=[string]$item.StatusText }",
        "        $existing.jobStatus=Resolve-PrintJobState ([uint32]$existing.statusMask) ([string]$existing.rawJobStatus) ([string]$existing.statusText)",
        "        $device=Read-PrinterDeviceState $printerName",
        "        if ([bool]$device.fault -or [bool]$device.paused) { $existing.jobStatus=[string]$device.state; $existing.deviceState=[string]$device.state; $existing.physicalStatusReported=$true }",
        "        $existing.trackingMode=(([string]$existing.trackingMode)+' + Winspool EnumJobs').Trim(' ','+')",
        "        $existing.fingerprint=('{0}|{1}|{2}|{3}|{4}|{5}|{6}|{7}|{8}|{9}|{10}' -f $existing.documentName,$existing.userName,$existing.rawJobStatus,$existing.statusText,$existing.statusMask,$existing.totalPages,$existing.pagesPrinted,$existing.size,$existing.jobStatus,$existing.deviceState,$existing.trackingMode)",
        "      } else { $current[$key]=$job }",
        "    }",
        "  }",
        "}",
        "function Merge-Win32PrintJobs($current) {",
        "  $jobQuery=New-Object System.Management.ObjectQuery('SELECT Name,Document,Owner,JobStatus,Status,StatusMask,TotalPages,PagesPrinted,Size FROM Win32_PrintJob')",
        "  $jobSearcher=New-Object System.Management.ManagementObjectSearcher($scope,$jobQuery)",
        "  $jobSearcher.Options.ReturnImmediately=$false",
        "  try {",
        "    foreach ($item in @($jobSearcher.Get())) {",
        "      $name=[string]$item.Name",
        "      if ([string]::IsNullOrWhiteSpace($name)) { continue }",
        "      $printerName=$name",
        "      $jobId=0",
        "      if ($name -match '^(.*),\\s*(\\d+)$') { $printerName=$Matches[1]; $jobId=[int]$Matches[2] }",
        "      $rawStatus=[string]$item.JobStatus",
        "      if ([string]::IsNullOrWhiteSpace($rawStatus)) { $rawStatus='Queued' }",
        "      $job=New-LivePrintJob $name $printerName $jobId ([string]$item.Document) ([string]$item.Owner) $rawStatus ([string]$item.Status) ([uint32]$item.StatusMask) ([int]$item.TotalPages) ([int]$item.PagesPrinted) ([long]$item.Size) $null 'Win32_PrintJob'",
        "      if ($null -ne $job) { $current[$name]=$job }",
        "    }",
        "  } catch { }",
        "  finally { $jobSearcher.Dispose() }",
        "}",
        "function Merge-PrintManagementJobs($current) {",
        "  $printerNames=@(Get-MonitorPrinterNames)",
        "  foreach ($printerNameValue in $printerNames) {",
        "    $printerName=[string]$printerNameValue",
        "    if ([string]::IsNullOrWhiteSpace($printerName)) { continue }",
        "    $cmdletJobs=@()",
        "    try { $cmdletJobs=@(Get-PrintJob -PrinterName $printerName -ErrorAction Stop) } catch { continue }",
        "    foreach ($item in $cmdletJobs) {",
        "      $jobId=0",
        "      try { $jobId=[int]$item.ID } catch { continue }",
        "      if ($jobId -lt 1) { continue }",
        "      $key=('{0}, {1}' -f $printerName,$jobId)",
        "      [uint32]$statusMask=0",
        "      try { $statusMask=[uint32][int]$item.JobStatus } catch { $statusMask=0 }",
        "      $rawStatus=[string]$item.JobStatus",
        "      if ([string]::IsNullOrWhiteSpace($rawStatus)) { $rawStatus='Queued' }",
        "      $document=[string]$item.DocumentName",
        "      if ([string]::IsNullOrWhiteSpace($document)) { $document=('Print job #{0}' -f $jobId) }",
        "      $owner=[string]$item.UserName",
        "      $totalPages=0; $pagesPrinted=0; [long]$size=0",
        "      try { $totalPages=[int]$item.TotalPages } catch { }",
        "      try { $pagesPrinted=[int]$item.PagesPrinted } catch { }",
        "      try { $size=[long]$item.Size } catch { try { $size=[long]$item.JobSize } catch { } }",
        "      $job=New-LivePrintJob $key $printerName $jobId $document $owner $rawStatus '' $statusMask $totalPages $pagesPrinted $size $item.SubmittedTime 'Get-PrintJob'",
        "      if ($null -eq $job) { continue }",
        "      if ($current.ContainsKey($key)) {",
        "        $existing=$current[$key]",
        "        if ([string]::IsNullOrWhiteSpace([string]$existing.documentName) -and -not [string]::IsNullOrWhiteSpace($document)) { $existing.documentName=$document }",
        "        if ([string]::IsNullOrWhiteSpace([string]$existing.userName) -and -not [string]::IsNullOrWhiteSpace($owner)) { $existing.userName=$owner }",
        "        if ([int]$existing.totalPages -lt 1 -and $totalPages -gt 0) { $existing.totalPages=$totalPages }",
        "        if ([int]$existing.pagesPrinted -lt $pagesPrinted) { $existing.pagesPrinted=$pagesPrinted }",
        "        if ([long]$existing.size -lt 1 -and $size -gt 0) { $existing.size=$size }",
        "        $existing.trackingMode='Win32_PrintJob + Get-PrintJob'",
        "        $existing.fingerprint=('{0}|{1}|{2}|{3}|{4}|{5}|{6}|{7}|{8}|{9}|{10}' -f $existing.documentName,$existing.userName,$existing.rawJobStatus,$existing.statusText,$existing.statusMask,$existing.totalPages,$existing.pagesPrinted,$existing.size,$existing.jobStatus,$existing.deviceState,$existing.trackingMode)",
        "      } else { $current[$key]=$job }",
        "    }",
        "  }",
        "}",
        "function Read-PrintJobSnapshot([bool]$forceDirect) {",
        "  $current=@{}",
        "  $now=Get-Date",
        "  if ($script:nativeJobApiAvailable) { Merge-NativePrintJobs $current }",
        "  if (-not $script:nativeJobApiAvailable -or $forceDirect -or (($now-$script:lastWmiJobPoll).TotalMilliseconds -ge 500)) {",
        "    $script:lastWmiJobPoll=$now",
        "    Merge-Win32PrintJobs $current",
        "  }",
        "  if ($forceDirect -or (($now-$script:lastCmdletJobPoll).TotalMilliseconds -ge 500)) {",
        "    $script:lastCmdletJobPoll=$now",
        "    Merge-PrintManagementJobs $current",
        "  }",
        "  return $current",
        "}",
        "function Get-EstimatedPhysicalSeconds($job) {",
        "  $pages=[int]$job.totalPages",
        "  if ($pages -lt 1) { $pages=1 }",
        "  $printed=[int]$job.pagesPrinted",
        "  $remaining=$pages-$printed",
        "  if ($remaining -lt 1) { $remaining=$pages }",
        "  $seconds=8+($remaining*4)",
        "  if ([long]$job.size -gt 10485760) { $seconds+=10 }",
        "  return [int][Math]::Min(240,[Math]::Max(10,$seconds))",
        "}",
        "function Get-PrintEventXmlValue($xml,$name,$position) {",
        "  try {",
        "    $node=$xml.SelectSingleNode(\"//*[local-name()='DocumentPrinted']/*[local-name()='$name']\")",
        "    if ($null -ne $node -and -not [string]::IsNullOrWhiteSpace([string]$node.InnerText)) { return [string]$node.InnerText }",
        "  } catch { }",
        "  try {",
        "    $nodes=@($xml.SelectNodes(\"//*[local-name()='EventData']/*[local-name()='Data']\"))",
        "    foreach ($item in $nodes) {",
        "      if ([string]$item.GetAttribute('Name') -eq $name) { return [string]$item.InnerText }",
        "    }",
        "    if ($position -gt 0 -and $nodes.Count -ge $position) { return [string]$nodes[$position-1].InnerText }",
        "  } catch { }",
        "  return ''",
        "}",
        "function Test-PrintEventAlreadyTracked($printerName,$jobId,$document,$current) {",
        "  foreach ($job in @($current.Values)) {",
        "    if ([string]$job.printerName -ne [string]$printerName) { continue }",
        "    if ($jobId -gt 0 -and [int]$job.id -eq $jobId) { return $true }",
        "    if (-not [string]::IsNullOrWhiteSpace([string]$document) -and [string]$job.documentName -eq [string]$document) { return $true }",
        "  }",
        "  foreach ($physicalKey in @($script:physicalJobs.Keys)) {",
        "    $job=$script:physicalJobs[$physicalKey]",
        "    if ([string]$job.printerName -ne [string]$printerName) { continue }",
        "    if ($jobId -gt 0 -and [int]$job.id -eq $jobId) { return $true }",
        "    if (-not [string]::IsNullOrWhiteSpace([string]$document) -and [string]$job.documentName -eq [string]$document) { return $true }",
        "  }",
        "  return $false",
        "}",
        "function Publish-PrintServiceFallbackEvents($current) {",
        "  if (-not $script:printEventLogAvailable) { return 0 }",
        "  $now=Get-Date",
        "  if (($now-$script:lastPrintEventPoll).TotalMilliseconds -lt 750) { return 0 }",
        "  $script:lastPrintEventPoll=$now",
        "  $events=@()",
        "  try {",
        "    $events=@(Get-WinEvent -FilterHashtable @{ LogName='Microsoft-Windows-PrintService/Operational'; Id=307; StartTime=$now.AddMinutes(-5) } -MaxEvents 32 -ErrorAction SilentlyContinue | Where-Object { [long]$_.RecordId -gt $script:lastPrintEventRecordId } | Sort-Object RecordId)",
        "  } catch { return 0 }",
        "  $published=0",
        "  foreach ($event in $events) {",
        "    $recordId=[long]$event.RecordId",
        "    if ($recordId -le $script:lastPrintEventRecordId) { continue }",
        "    $script:lastPrintEventRecordId=$recordId",
        "    try { $xml=[xml]$event.ToXml() } catch { continue }",
        "    $printerName=Get-PrintEventXmlValue $xml 'Param5' 5",
        "    if ([string]::IsNullOrWhiteSpace([string]$printerName)) { continue }",
        "    $document=Get-PrintEventXmlValue $xml 'Param2' 2",
        "    if ([string]::IsNullOrWhiteSpace([string]$document)) { $document='Print job detected by Windows PrintService' }",
        "    $owner=Get-PrintEventXmlValue $xml 'Param3' 3",
        "    $jobId=0",
        "    try { $jobId=[int](Get-PrintEventXmlValue $xml 'Param1' 1) } catch { $jobId=0 }",
        "    [long]$size=0",
        "    try { $size=[long](Get-PrintEventXmlValue $xml 'Param7' 7) } catch { $size=0 }",
        "    $pages=0",
        "    try { $pages=[int](Get-PrintEventXmlValue $xml 'Param8' 8) } catch { $pages=0 }",
        "    if (Test-PrintEventAlreadyTracked $printerName $jobId $document $current) { continue }",
        "    $key=('event307:{0}' -f $recordId)",
        "    $estimateJob=[ordered]@{ totalPages=$pages; pagesPrinted=0; size=$size }",
        "    $duration=Get-EstimatedPhysicalSeconds $estimateJob",
        "    $estimatedUntil=$now.AddSeconds($duration)",
        "    $physical=[ordered]@{ key=$key; printerName=[string]$printerName; id=[int]$jobId; documentName=[string]$document; userName=[string]$owner; jobStatus='Printing'; totalPages=[int]$pages; pagesPrinted=0; size=[long]$size; submittedTime=$(if ($null -ne $event.TimeCreated) { $event.TimeCreated.ToUniversalTime().ToString('o') } else { $now.ToUniversalTime().ToString('o') }); statusReported=$false; deviceState='Captured from Windows PrintService event 307'; trackingMode='PrintService event fallback'; busySeen=$false; idleSamples=0; estimatedUntil=$estimatedUntil; hardUntil=$estimatedUntil.AddSeconds(8); expiresAt=$now.AddMinutes(5); lastPublished='' }",
        "    $script:physicalJobs[$key]=$physical",
        "    $jobs=@(Get-DisplayJobsForPrinter $printerName $current)",
        "    $payload=[ordered]@{ eventType='PrintServiceFallbackEvent'; printerName=$printerName; jobId=$jobId; document=$document; owner=$owner; status='Printing'; timestamp=$now.ToUniversalTime().ToString('o'); jobs=$jobs }",
        "    [Console]::Out.WriteLine(($payload|ConvertTo-Json -Compress -Depth 5))",
        "    [Console]::Out.Flush()",
        "    $published++",
        "  }",
        "  return $published",
        "}",
        "function Convert-PhysicalJob($physical,$now) {",
        "  $seconds=[int][Math]::Max(0,[Math]::Ceiling(($physical.estimatedUntil-$now).TotalSeconds))",
        "  return [ordered]@{",
        "    id=$physical.id",
        "    documentName=$physical.documentName",
        "    userName=$physical.userName",
        "    jobStatus=[string]$physical.jobStatus",
        "    totalPages=$physical.totalPages",
        "    pagesPrinted=$physical.pagesPrinted",
        "    size=$physical.size",
        "    submittedTime=$physical.submittedTime",
        "    recentCompleted=$false",
        "    physicalPending=$true",
        "    physicalStatusReported=[bool]$physical.statusReported",
        "    deviceState=[string]$physical.deviceState",
        "    trackingMode=[string]$physical.trackingMode",
        "    estimatedSecondsRemaining=$seconds",
        "    spoolerOwned=$false",
        "  }",
        "}",
        "function Get-DisplayJobsForPrinter($printerName,$current) {",
        "  $items=New-Object System.Collections.ArrayList",
        "  foreach ($job in @($current.Values | Where-Object { $_.printerName -eq $printerName })) { [void]$items.Add($job) }",
        "  $now=Get-Date",
        "  foreach ($physicalKey in @($script:physicalJobs.Keys)) {",
        "    $physical=$script:physicalJobs[$physicalKey]",
        "    if ($physical.printerName -eq $printerName) { [void]$items.Add((Convert-PhysicalJob $physical $now)) }",
        "  }",
        "  return @($items | Select-Object -First 250)",
        "}",
        "function Read-PrinterDeviceState($printerName) {",
        "  $cacheKey=([string]$printerName).ToLowerInvariant()",
        "  $cacheNow=Get-Date",
        "  if ($script:deviceStateCache.ContainsKey($cacheKey)) {",
        "    $cached=$script:deviceStateCache[$cacheKey]",
        "    if (($cacheNow-$cached.timestamp).TotalMilliseconds -lt 350) { return $cached }",
        "  }",
        "  $escaped=[string]$printerName.Replace(\"'\",\"''\")",
        "  $deviceQuery=New-Object System.Management.ObjectQuery(\"SELECT PrinterStatus,ExtendedPrinterStatus,DetectedErrorState,WorkOffline FROM Win32_Printer WHERE Name='$escaped'\")",
        "  $deviceSearcher=New-Object System.Management.ManagementObjectSearcher($scope,$deviceQuery)",
        "  $deviceSearcher.Options.ReturnImmediately=$false",
        "  $result=$null",
        "  try {",
        "    $device=@($deviceSearcher.Get() | Select-Object -First 1)",
        "    if ($device.Count -eq 0) { $result=[ordered]@{ state='Unknown'; reported=$false; busy=$false; idle=$false; fault=$false; paused=$false; timestamp=$cacheNow } }",
        "    else {",
        "      $signals=Read-PrinterCmdletSignals $printerName",
        "      $state=Resolve-LivePrinterState ([int]$device[0].PrinterStatus) ([int]$device[0].ExtendedPrinterStatus) ([int]$device[0].DetectedErrorState) ([bool]$device[0].WorkOffline) ([string]$signals.printerStatus) ([string]$signals.jobStatus) ([uint32]$signals.jobStatusMask)",
        "      $fault=($state -match '^(Offline|Paper Jam|Paper Out|Door Open|No Toner|Output Bin Full|Out of Memory|Manual Feed|User Intervention|Error|Stopped)$')",
        "      $paused=($state -eq 'Paused')",
        "      $busy=($state -match '^(Printing|Warming up)$')",
        "      $idle=($state -match '^(Idle|Ready)$')",
        "      $reported=($state -ne 'Ready' -or -not [string]::IsNullOrWhiteSpace([string]$signals.printerStatus) -or -not [string]::IsNullOrWhiteSpace([string]$signals.jobStatus))",
        "      $result=[ordered]@{ state=$state; reported=$reported; busy=$busy; idle=$idle; fault=$fault; paused=$paused; timestamp=$cacheNow }",
        "    }",
        "  } catch { $result=[ordered]@{ state='Unknown'; reported=$false; busy=$false; idle=$false; fault=$false; paused=$false; timestamp=$cacheNow } }",
        "  finally { $deviceSearcher.Dispose() }",
        "  $script:deviceStateCache[$cacheKey]=$result",
        "  return $result",
        "}",
        "function Publish-PhysicalPrinterStates($current) {",
        "  if ($script:physicalJobs.Count -eq 0) { return 0 }",
        "  $now=Get-Date",
        "  if (($now-$script:lastPhysicalPoll).TotalMilliseconds -lt 500) { return 0 }",
        "  $script:lastPhysicalPoll=$now",
        "  $published=0",
        "  foreach ($physicalKey in @($script:physicalJobs.Keys)) {",
        "    if ($current.ContainsKey($physicalKey)) { $script:physicalJobs.Remove($physicalKey); continue }",
        "    $physical=$script:physicalJobs[$physicalKey]",
        "    $device=Read-PrinterDeviceState $physical.printerName",
        "    $physical.statusReported=[bool]$device.reported",
        "    $physical.deviceState=[string]$device.state",
        "    $complete=$false",
        "    $fault=[bool]$device.fault",
        "    if ($fault) {",
        "      $physical.busySeen=$true",
        "      $physical.idleSamples=0",
        "      $physical.trackingMode='Device'",
        "      $physical.jobStatus=[string]$device.state",
        "    } elseif ([bool]$device.paused) {",
        "      $physical.busySeen=$true",
        "      $physical.idleSamples=0",
        "      $physical.trackingMode='Device'",
        "      $physical.jobStatus='Paused'",
        "    } elseif ($device.idle -and $physical.busySeen) {",
        "      $physical.idleSamples++",
        "      $physical.trackingMode='Device'",
        "      $physical.jobStatus='Printing'",
        "      if ($physical.idleSamples -ge 3) { $complete=$true }",
        "    } elseif ($device.busy) {",
        "      $physical.busySeen=$true",
        "      $physical.idleSamples=0",
        "      $physical.trackingMode='Device'",
        "      $physical.jobStatus='Printing'",
        "      if ($now -ge $physical.hardUntil) {",
        "        $queueForPrinter=@($current.Values | Where-Object { $_.printerName -eq $physical.printerName }).Count",
        "        if ($queueForPrinter -eq 0) {",
        "          $physical.deviceState='Driver busy state expired after queue completion'",
        "          $complete=$true",
        "        }",
        "      }",
        "    } elseif ($now -ge $physical.estimatedUntil) {",
        "      $complete=$true",
        "    } else {",
        "      $physical.idleSamples=0",
        "      $physical.jobStatus='Printing'",
        "      $physical.trackingMode='Estimated'",
        "      if ($device.idle) { $physical.deviceState='Idle (waiting for bounded print estimate)' }",
        "      elseif (-not $device.reported) { $physical.deviceState='Physical progress unavailable' }",
        "    }",
        "    if ($now -ge $physical.expiresAt) { $complete=$true }",
        "    if ($complete) {",
        "      $script:physicalJobs.Remove($physicalKey)",
        "      $jobs=@(Get-DisplayJobsForPrinter $physical.printerName $current)",
        "      $payload=[ordered]@{ eventType='PhysicalPrintingCompletedEvent'; printerName=$physical.printerName; jobId=$physical.id; document=$physical.documentName; owner=$physical.userName; status='Completed'; timestamp=(Get-Date).ToUniversalTime().ToString('o'); jobs=$jobs }",
        "      [Console]::Out.WriteLine(($payload|ConvertTo-Json -Compress -Depth 5))",
        "      [Console]::Out.Flush()",
        "      $published++",
        "      continue",
        "    }",
        "    $seconds=[int][Math]::Max(0,[Math]::Ceiling(($physical.estimatedUntil-$now).TotalSeconds))",
        "    $bucket=[int][Math]::Floor($seconds/2)",
        "    $fingerprint=('{0}|{1}|{2}|{3}|{4}' -f $physical.jobStatus,$physical.deviceState,$physical.statusReported,$physical.trackingMode,$bucket)",
        "    if ($fingerprint -ne $physical.lastPublished) {",
        "      $physical.lastPublished=$fingerprint",
        "      $jobs=@(Get-DisplayJobsForPrinter $physical.printerName $current)",
        "      $payload=[ordered]@{ eventType='PhysicalPrinterStatusEvent'; printerName=$physical.printerName; jobId=$physical.id; document=$physical.documentName; owner=$physical.userName; status=$physical.jobStatus; timestamp=(Get-Date).ToUniversalTime().ToString('o'); jobs=$jobs }",
        "      [Console]::Out.WriteLine(($payload|ConvertTo-Json -Compress -Depth 5))",
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
        "    [Console]::Out.WriteLine(($payload|ConvertTo-Json -Compress -Depth 5))",
        "    [Console]::Out.Flush()",
        "    $changeCount++",
        "  }",
        "  foreach ($key in @($script:previous.Keys)) {",
        "    if ($current.ContainsKey($key)) { continue }",
        "    $old=$script:previous[$key]",
        "    if ([string]$old.rawJobStatus -match '(?i)deleted|deleting|cancelled|canceled') {",
        "      if ($script:firstSeenAt.ContainsKey($key)) { $script:firstSeenAt.Remove($key) }",
        "      $jobs=@(Get-DisplayJobsForPrinter $old.printerName $current)",
        "      $payload=[ordered]@{ eventType='__InstanceDeletionEvent'; printerName=$old.printerName; jobId=$old.id; document=$old.documentName; owner=$old.userName; status='Removed from queue'; timestamp=(Get-Date).ToUniversalTime().ToString('o'); jobs=$jobs }",
        "      [Console]::Out.WriteLine(($payload|ConvertTo-Json -Compress -Depth 5))",
        "      [Console]::Out.Flush()",
        "      $changeCount++",
        "      continue",
        "    }",
        "    $now=Get-Date",
        "    $duration=Get-EstimatedPhysicalSeconds $old",
        "    $estimateStart=if ($null -ne $old.firstSeenAt) { [datetime]$old.firstSeenAt } else { $now }",
        "    foreach ($existingKey in @($script:physicalJobs.Keys)) {",
        "      $existing=$script:physicalJobs[$existingKey]",
        "      if ($existing.printerName -eq $old.printerName -and $existing.estimatedUntil -gt $estimateStart) { $estimateStart=$existing.estimatedUntil }",
        "    }",
        "    $estimatedUntil=$estimateStart.AddSeconds($duration)",
        "    if ($estimatedUntil -lt $now.AddSeconds(2)) { $estimatedUntil=$now.AddSeconds(2) }",
        "    $hardUntil=$estimatedUntil.AddSeconds(8)",
        "    $physical=[ordered]@{ key=$key; printerName=$old.printerName; id=$old.id; documentName=$old.documentName; userName=$old.userName; jobStatus='Printing'; totalPages=$old.totalPages; pagesPrinted=$old.pagesPrinted; size=$old.size; submittedTime=$old.submittedTime; statusReported=$false; deviceState='Waiting for printer status'; trackingMode='Estimated'; busySeen=$false; idleSamples=0; estimatedUntil=$estimatedUntil; hardUntil=$hardUntil; expiresAt=$now.AddMinutes(5); lastPublished='' }",
        "    if ($script:firstSeenAt.ContainsKey($key)) { $script:firstSeenAt.Remove($key) }",
        "    $script:physicalJobs[$key]=$physical",
        "    $jobs=@(Get-DisplayJobsForPrinter $old.printerName $current)",
        "    $payload=[ordered]@{ eventType='PhysicalMonitoringStartedEvent'; printerName=$old.printerName; jobId=$old.id; document=$old.documentName; owner=$old.userName; status='Printing'; timestamp=(Get-Date).ToUniversalTime().ToString('o'); jobs=$jobs }",
        "    [Console]::Out.WriteLine(($payload|ConvertTo-Json -Compress -Depth 5))",
        "    [Console]::Out.Flush()",
        "    $changeCount++",
        "  }",
        "  $script:previous=$current",
        "  return $changeCount",
        "}",
        "function Publish-UnresolvedSpoolerActivity { return 0 }",
        "try {",
        "  $initial=Read-PrintJobSnapshot $true",
        "  if ($null -ne $initial) { [void](Publish-PrintJobChanges $initial); [void](Publish-PrintServiceFallbackEvents $initial); [void](Publish-PhysicalPrinterStates $initial); [void](Publish-ActivePrinterSnapshot $initial $true) }",
        "  while ((Get-Date) -lt $deadline) {",
        "    if ($nativeAvailable) {",
        "      $signal=0",
        "      $waitMilliseconds=if ($script:physicalJobs.Count -gt 0) { 250 } else { 100 }",
        "      try { $signal=$notifier.Wait($waitMilliseconds) } catch { $nativeAvailable=$false; continue }",
        "      if ($signal -ne 0) {",
        "        $burstChanges=0",
        "        for ($sample=0; $sample -lt 60; $sample++) {",
        "          $forceDirect=(($sample % 10) -eq 0)",
        "          $current=Read-PrintJobSnapshot $forceDirect",
        "          if ($null -ne $current) { $burstChanges += (Publish-PrintJobChanges $current) }",
        "          Start-Sleep -Milliseconds 15",
        "        }",
        "        if ($null -ne $current) { [void](Publish-PrintServiceFallbackEvents $current); [void](Publish-PhysicalPrinterStates $current); [void](Publish-ActivePrinterSnapshot $current $false) }",
        "        if ($burstChanges -eq 0) { Publish-UnresolvedSpoolerActivity }",
        "      } else {",
        "        $current=Read-PrintJobSnapshot $false",
        "        if ($null -ne $current) { [void](Publish-PrintJobChanges $current); [void](Publish-PrintServiceFallbackEvents $current); [void](Publish-PhysicalPrinterStates $current); [void](Publish-ActivePrinterSnapshot $current $false) }",
        "      }",
        "    } else {",
        "      $current=Read-PrintJobSnapshot $false",
        "      if ($null -ne $current) { [void](Publish-PrintJobChanges $current); [void](Publish-PrintServiceFallbackEvents $current); [void](Publish-PhysicalPrinterStates $current); [void](Publish-ActivePrinterSnapshot $current $false) }",
        "      Start-Sleep -Milliseconds 50",
        "    }",
        "  }",
        "} finally {",
        "  if ($null -ne $notifier) { $notifier.Dispose() }",
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
    if (!child) return;
    var requestIds = Array.isArray(child._printerControlStartRequestIds) ? child._printerControlStartRequestIds.slice(0) : [];
    child._printerControlStartRequestIds = [];
    child._printerControlStartReplied = true;
    if (child._printerControlReadyTimer != null) {
        clearTimeout(child._printerControlReadyTimer);
        child._printerControlReadyTimer = null;
    }
    for (var i = 0; i < requestIds.length; i++) {
        if (requestIds[i]) sendResult(requestIds[i], "watchJobsStart", result);
    }
}

function cleanupWatcherScript(child) {
    if (!child || !child._printerControlScriptPath) return;
    var scriptPath = child._printerControlScriptPath;
    child._printerControlScriptPath = null;
    try { require("fs").unlinkSync(scriptPath); } catch (ignore) { }
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
                // Also publish an unsolicited ready state. This repairs the UI if
                // the request/response acknowledgement was lost during a page rebuild.
                sendWatcherStatus(true, null);
            } else {
                sendJobWatcherEvent(parsed);
            }
        } catch (ignore) { }
    }
}

function startJobWatcher(requestId, params) {
    if (jobWatcherProcess != null) {
        armWatcherLease(params);
        if (jobWatcherProcess._printerControlReady === true) {
            var remainingMs = Math.max(0, WATCHER_HARD_LIMIT_MS - (Date.now() - jobWatcherStartedAt));
            sendResult(requestId, "watchJobsStart", { success: true, data: { watching: true, existing: true, remainingMs: remainingMs } });
        } else {
            // The process exists but is still starting. Attach this request to the
            // same startup instead of falsely reporting the watcher as active.
            if (!Array.isArray(jobWatcherProcess._printerControlStartRequestIds)) {
                jobWatcherProcess._printerControlStartRequestIds = [];
            }
            jobWatcherProcess._printerControlStartRequestIds.push(requestId);
        }
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
    var watcherScriptPath = null;
    try {
        var fs = require("fs");
        var tempDir = process.env.TEMP || "C:\\Windows\\Temp";
        tempDir = String(tempDir).replace(/[\\\/]+$/, "");
        watcherScriptPath = tempDir + "\\MeshPrinterControlWatcher_" + process.pid + "_" + Date.now() + ".ps1";
        // Windows PowerShell 5.1 detects UTF-8 reliably when a BOM is present.
        fs.writeFileSync(watcherScriptPath, "\uFEFF" + buildJobWatcherScript(), "utf8");
        child = require("child_process").execFile(
            powershellPath,
            [
                "powershell.exe",
                "-NoLogo",
                "-NoProfile",
                "-NonInteractive",
                "-ExecutionPolicy", "Bypass",
                "-File", watcherScriptPath
            ],
            { cwd: tempDir }
        );
    } catch (startError) {
        if (watcherScriptPath) {
            try { require("fs").unlinkSync(watcherScriptPath); } catch (ignoreDelete) { }
        }
        sendResult(requestId, "watchJobsStart", { success: false, error: "Unable to start print-job watcher: " + startError });
        return;
    }

    child._printerControlScriptPath = watcherScriptPath;

    jobWatcherProcess = child;
    jobWatcherStartedAt = Date.now();
    armWatcherLease(params);
    armWatcherHardLimit();
    child._printerControlBuffer = "";
    child._printerControlStopping = false;
    child._printerControlReady = false;
    child._printerControlStartRequestIds = [requestId];
    child._printerControlStartReplied = false;
    child._printerControlReadyTimer = setTimeout(function () {
        if (child._printerControlReady === true || child._printerControlStartReplied === true) return;
        child._printerControlStopping = true;
        var startupDetail = (child.stderr && child.stderr.str) ? String(child.stderr.str).substring(0, 1200).trim() : "";
        replyWatcherStart(child, { success: false, error: "PowerShell did not confirm that the print-job watcher started" + (startupDetail ? ": " + startupDetail : "") });
        try { child.kill(); } catch (ignoreKill) { }
        if (jobWatcherProcess === child) jobWatcherProcess = null;
        jobWatcherStartedAt = 0;
        clearWatcherSafetyTimers();
        cleanupWatcherScript(child);
    }, 30000);

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
        cleanupWatcherScript(child);
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
        cleanupWatcherScript(child);
    });

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
    cleanupWatcherScript(child);
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
        if (operation === "clearQueue" && result && result.success === true && jobWatcherProcess != null) {
            setTimeout(function () {
                stopJobWatcher(null, "Print queue cleared; restarting live monitoring.", true);
            }, 100);
        }
    });
}

module.exports = { consoleaction: consoleaction };
