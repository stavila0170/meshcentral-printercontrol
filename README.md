# Mesh Printer Control 0.4.42

Mesh Printer Control adds a **Printers** tab to Windows devices in MeshCentral. Version 0.4.42 runs from the existing LocalSystem Mesh Agent service: it uses the existing LocalSystem **Mesh Agent** service, installs no additional service, and starts its long-running watcher entirely in memory. The watcher is transferred through stdin using an exact character count, so startup does not depend on temporary files or an EOF signal from MeshAgent. Windows PowerShell may use its normal temporary compiler workspace while loading the native Winspool interop type.

## Included operations

- Inventory printers, drivers, ports, Print Spooler and queues.
- List, pause, resume and cancel print jobs.
- Print a Windows test page.
- Add a TCP/IP printer using an installed driver.
- Delete printers and optionally remove unused ports and drivers.
- Remove unused ports and drivers.
- Start, stop or restart Print Spooler and clear its queue.

The browser cannot submit PowerShell. The server and endpoint accept only the fixed operations above, and MeshCore validates every parameter before starting PowerShell.

### Refresh and live print-job behavior

Version 0.4.42 displays two distinct sections:

- **Active physical printers** — only real printer queues that Windows currently reports as available. Remote Desktop redirected queues and common virtual PDF, XPS, Fax and OneNote printers are excluded. The existing endpoint watcher sends a lightweight printer-state snapshot approximately every two seconds, so an offline printer disappears and an available printer reappears without running a full inventory refresh.
- **Print jobs — all printers** — the only print-job table. It aggregates current jobs from every active physical printer and keeps Pause, Resume and Cancel bound to the printer named in each row.

The watcher starts automatically and remains enabled while the top-level **Printers** tab is selected. It stops only when another MeshCentral device tab such as Desktop, Terminal or Files is selected, or when the plugin page unloads. Browser minimization and browser-tab visibility changes do not stop monitoring. A 15-second lease heartbeat and automatic renewal before the independent 10-minute safety limit prevent orphaned endpoint processes.

Printer status is resolved with the same priority model used by Remote Tools. Version 0.4.42 combines `Get-Printer`, numeric `Get-PrintJob.JobStatus` flags, `Win32_PrintJob.StatusMask` and `Win32_Printer`. Queue-level flags such as Paper Out, Offline, User Intervention, Blocked, Error and Paused override Printing even when the driver still exposes a simultaneous Printing flag. Queue rows and the physical-printer list inherit the same effective fault state in real time.

Printer jobs are read first through the native Windows Spooler `EnumJobs` API, then enriched from `Win32_PrintJob` and the PrintManagement `Get-PrintJob` interface. For USB drivers that remove a job before any queue sampler can observe it, version 0.4.42 also uses new event 307 records from `Microsoft-Windows-PrintService/Operational` to reconstruct the document, user, printer, size and page count and then continue the same physical-print tracking. The native queue reader is sampled immediately after Spooler change notifications and every 100 ms while the Printers tab is active, so short USB jobs are no longer dependent on the slower WMI provider. Windows can remove a job as soon as it has been transferred to the printer buffer, before all pages have physically printed. Version 0.4.42 therefore keeps a shadow row with status **Printing** after Spooler handoff. A reliable Printing/Busy-to-Idle transition completes the row immediately. Some drivers keep an obsolete Busy/Processing value indefinitely; for those drivers, the watcher measures a bounded page-based estimate from the job's first queue appearance and applies only a short final grace period. When no tracked jobs remain, a stale driver-level Printing value is displayed as **Idle**. No completed-history row is retained after completion.

## Requirements

- MeshCentral 1.1.58 or newer with plugins enabled.
- Windows endpoints with Windows PowerShell 5.1 and the `PrintManagement` module.
- MeshAgent installed as a LocalSystem service.
- Administrator access for local MeshCentral plugin installation.

Both 32-bit and 64-bit MeshAgent installations on 64-bit Windows are supported. A 32-bit agent uses the native 64-bit PowerShell through `Sysnative`.

## Install locally

Copy `plugin\printercontrol` to:

```text
<meshcentral-data>/plugins/printercontrol
```

Enable the plugin in the `settings` section of `meshcentral-data/config.json`:

```json
{
  "settings": {
    "plugins": {
      "enabled": true,
      "list": ["printercontrol"]
    }
  }
}
```

Retain existing entries in `plugins.list`. Restart MeshCentral after copying the plugin. On Windows-hosted MeshCentral, `Install-MeshCentralPlugin.ps1` performs the copy, verifies every installed file and optionally restarts the service.

For the Docker layout used during development, run these commands from the `MeshPrinterControl-0.4.42` directory. Removing the previous directory first is important because `docker cp` does not delete obsolete assets from older versions:

```powershell
docker exec meshcentral rm -rf /opt/meshcentral/meshcentral-data/plugins/printercontrol
docker cp ".\plugin\printercontrol" meshcentral:/opt/meshcentral/meshcentral-data/plugins/
docker restart meshcentral
```

No endpoint installation is needed. Opening a device does not load the plugin iframe. Selecting **Printers** loads it once and sends the MeshCore module through the normal MeshAgent update mechanism. For every operation, MeshCore expands its embedded Gzip-compressed PowerShell source directly in memory and invokes it as a script block. It does not create a script, executable, service, staging directory, secret or audit file on the endpoint.

Operation audit records are emitted by the server plugin under the `plugin:printercontrol` MeshCentral log category. They contain time, node ID, user ID, operation, outcome and a bounded error message.

## Publish from GitHub

The included `config.json` points to:

```text
https://github.com/stavila0170/meshcentral-printercontrol
```

Place the contents of `plugin\printercontrol` in the repository's `printercontrol` directory, commit and push to the `main` branch. Confirm that this URL returns only JSON, without a GitHub HTML page:

```text
https://raw.githubusercontent.com/stavila0170/meshcentral-printercontrol/main/printercontrol/config.json
```

Use that raw URL when adding the plugin to MeshCentral. The GitHub archive referenced by `downloadUrl` must retain the `printercontrol` directory at repository root.

## Upgrade from 0.3.x

Install 0.4.32 and restart MeshCentral. After confirming that the Printers tab works, artifacts left by versions 0.3.x or 0.4.0 can be removed from each endpoint in an elevated PowerShell prompt:

```powershell
Stop-Service MeshPrinterControl -Force -ErrorAction SilentlyContinue
sc.exe delete MeshPrinterControl
Remove-Item "$env:ProgramData\MeshPrinterControl" -Recurse -Force -ErrorAction SilentlyContinue
```

Version 0.4.42 does not recreate this directory.

## Security design

- MeshCentral node visibility and plugin permissions are checked before every action.
- Server-generated request identifiers bind endpoint responses to the initiating browser session.
- MeshCore accepts only an action allow-list and validates every parameter again on the endpoint.
- PowerShell receives Base64-encoded JSON data; names and addresses are never concatenated into PowerShell source.
- The operation script is Gzip-compressed inside the MeshCore module and expanded only into PowerShell process memory.
- Gzip integrity validation rejects damaged embedded content before the script can run.
- Execution remains inside the existing LocalSystem Mesh Agent trust boundary; no listener, shared secret, HMAC protocol or additional service is needed.
- Live queue updates are scoped to server-authorized browser subscriptions and filtered to the selected printer before being forwarded.
- The event watcher sends at most 250 jobs per queue snapshot, and the server bounds every string and numeric field before forwarding it to the browser.
- Operation outcomes are emitted to the MeshCentral plugin log; no endpoint audit file is created.

## Current limitations

- Machine-wide printers are supported. Per-user printer connections and default-printer settings require a user-session component.
- Printer drivers must already be installed. INF upload and driver installation are not included.
- The transport targets agents connected to the same MeshCentral server process; multi-server peering needs an additional routing adapter.
- Environments that block Windows PowerShell, WMI event subscriptions or the `PrintManagement` module cannot use the related printer features.
- Real-time status starts automatically, cannot be paused from inside the plugin, remains enabled while the top-level Printers tab is selected, and renews automatically before the independent 10-minute safety limit.

## Development checks

After changing `source\printer_ops.ps1`, regenerate the embedded script:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tools\Embed-PowerShell.ps1
```

Then run:

```powershell
node --check plugin\printercontrol\printercontrol.js
node --check plugin\printercontrol\modules_meshcore\printercontrol.js
node tests\test_agent_only.js
```


## Active physical printers and hybrid all-printers queue (0.4.42)

The browser displays one Print jobs table. It receives live queue events from every printer on the endpoint and includes the printer name in each row.
