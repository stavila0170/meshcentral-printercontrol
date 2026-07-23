# Mesh Printer Control 0.4.6

Mesh Printer Control adds a **Printers** tab to Windows devices in MeshCentral. Version 0.4.6 is fully in-memory on endpoints: it uses the existing LocalSystem **Mesh Agent** service, contains no `.exe`, installs no additional service and writes no operation files to the endpoint.

## Included operations

- Inventory printers, drivers, ports, Print Spooler and queues.
- List, pause, resume and cancel print jobs.
- Print a Windows test page.
- Add a TCP/IP printer using an installed driver.
- Delete printers and optionally remove unused ports and drivers.
- Remove unused ports and drivers.
- Start, stop or restart Print Spooler and clear its queue.

The browser cannot submit PowerShell. The server and endpoint accept only the fixed operations above, and MeshCore validates every parameter before starting PowerShell.

### Refresh behavior

Version 0.4.6 performs no periodic printer or print-job polling. Inventory is loaded once when the Printers page opens, then updated only through the manual **Refresh** button or once after an operation that changes printer state. Print jobs are loaded only through **Jobs** and **Refresh jobs**.

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

For the Docker layout used during development, run these commands from the `MeshPrinterControl-0.4.2` directory. Removing the previous directory first is important because `docker cp` does not delete obsolete assets from older versions:

```powershell
docker exec meshcentral rm -rf /opt/meshcentral/meshcentral-data/plugins/printercontrol
docker cp ".\plugin\printercontrol" meshcentral:/opt/meshcentral/meshcentral-data/plugins/
docker restart meshcentral
```

No endpoint installation is needed. Opening **Printers** sends the MeshCore module through the normal MeshAgent update mechanism. For every operation, MeshCore expands its embedded Gzip-compressed PowerShell source directly in memory and invokes it as a script block. It does not create a script, executable, service, staging directory, secret or audit file on the endpoint.

Operation audit records are emitted by the server plugin under the `plugin:printercontrol` MeshCentral log category. They contain time, node ID, user ID, operation, outcome and a bounded error message.

## Publish from GitHub

The included `config.json` points to:

```text
https://github.com/stavila0170/meshcentral-printercontrol
```

Place the contents of `plugin\printercontrol` in the repository's `printercontrol` directory, commit and push to the `main` branch. Confirm that this URL returns only JSON, without a GitHub HTML page:

```text
https://raw.githubusercontent.com/stavila0170/meshcentral-printercontrol/main/config.json
```

Use that raw URL when adding the plugin to MeshCentral. The GitHub archive referenced by `downloadUrl` must retain the `printercontrol` directory at repository root.

## Upgrade from 0.3.x

Install 0.4.6 and restart MeshCentral. After confirming that the Printers tab works, artifacts left by versions 0.3.x or 0.4.0 can be removed from each endpoint in an elevated PowerShell prompt:

```powershell
Stop-Service MeshPrinterControl -Force -ErrorAction SilentlyContinue
sc.exe delete MeshPrinterControl
Remove-Item "$env:ProgramData\MeshPrinterControl" -Recurse -Force -ErrorAction SilentlyContinue
```

Version 0.4.2 does not recreate this directory.

## Security design

- MeshCentral node visibility and plugin permissions are checked before every action.
- Server-generated request identifiers bind endpoint responses to the initiating browser session.
- MeshCore accepts only an action allow-list and validates every parameter again on the endpoint.
- PowerShell receives Base64-encoded JSON data; names and addresses are never concatenated into PowerShell source.
- The operation script is Gzip-compressed inside the MeshCore module and expanded only into PowerShell process memory.
- Gzip integrity validation rejects damaged embedded content before the script can run.
- Execution remains inside the existing LocalSystem Mesh Agent trust boundary; no listener, shared secret, HMAC protocol or additional service is needed.
- Operation outcomes are emitted to the MeshCentral plugin log; no endpoint audit file is created.

## Current limitations

- Machine-wide printers are supported. Per-user printer connections and default-printer settings require a user-session component.
- Printer drivers must already be installed. INF upload and driver installation are not included.
- The transport targets agents connected to the same MeshCentral server process; multi-server peering needs an additional routing adapter.
- Environments that block Windows PowerShell or the `PrintManagement` module cannot use printer operations.

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
