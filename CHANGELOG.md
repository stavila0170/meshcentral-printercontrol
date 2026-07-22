# Changelog

## 0.4.3

- Apply dark mode to the MeshCentral plugin-permissions dialog in both legacy and modern UI, including dialogs inserted after page startup.
- Detect dark mode from actual page classes and computed background colors instead of requiring `.night` to be an ancestor of the modal.
- Report explicit `Get-PrintJob` errors instead of silently presenting an unreadable queue as empty.
- Avoid querying per-printer jobs during inventory while Print Spooler is stopped.

## 0.4.2

- Show the Printers device tab when MeshCentral has not populated `currentNode.osdesc` yet.
- Continue hiding the tab when the device explicitly reports a non-Windows operating system.
- Keep MeshCore's `process.platform` check as the authoritative endpoint guard.

## 0.4.1

- Execute the embedded PowerShell operation script entirely in memory.
- Gzip-compress the script in MeshCore and reconstruct it as a PowerShell script block at runtime.
- Stop creating `printer_ops.ps1`, `audit.log` or a `MeshPrinterControl` directory on endpoints.
- Emit operation audit records into the MeshCentral plugin log instead of an endpoint file.
- Keep endpoint action and parameter validation before constructing the in-memory command.

## 0.4.0

- Remove `printer_helper.exe` and the separate `MeshPrinterControl` Windows service.
- Run allow-listed printer operations directly from MeshCore through Windows PowerShell under the existing LocalSystem Mesh Agent service.
- Embed the versioned PowerShell operation script in the MeshCore module and verify its exact bytes after writing it to `%ProgramData%\MeshPrinterControl`.
- Validate every operation parameter again on the endpoint before starting PowerShell.
- Preserve local JSON-lines auditing with 5 MiB log rotation.
- Remove helper download, staging, hashing and installation logic from the server plugin.

## 0.3.1

- Remove the endpoint `SHA256Stream` dependency because its API differs across MeshAgent builds.
- Retain server-side SHA-256 verification, short-lived authenticated download tokens, pinned MeshCentral TLS hash, and two consecutive exact-size checks before installation.

## 0.3.0

- Move helper-download polling from MeshCore timers to a server-driven request/response handshake.
- Keep every agent-side deployment step synchronous: inspect size, verify SHA-256, install, and return.
- Require two consecutive complete-size reports before hashing and executing the helper.

## 0.2.4

- Use MeshAgent's native synchronous `SHA256Stream.syncHash(Buffer)` API for helper verification.
- Remove all asynchronous hashing streams, callbacks and external hashing processes from deployment.

## 0.2.3

- Feed the complete downloaded helper to `SHA256Stream` using its native `write()` and `end()` interface.
- Remove `fs.createReadStream().pipe()`, which does not finish reliably in the MeshAgent Duktape runtime.
- Return a hashing failure before the server-side printer request timeout.

## 0.2.2

- Use MeshAgent's native `SHA256Stream.hashString` interface for downloaded-helper verification.
- Remove the external `certutil.exe` hashing process, which could remain blocked inside the MeshAgent runtime.
- Add a bounded 30-second hashing timeout so deployment failures always return an actionable error.

## 0.2.1

- Fixed automatic helper deployment on MeshAgent 1.2.1 by replacing the incompatible `SHA256Stream` event usage with Windows `certutil.exe` SHA-256 verification.
- Completed downloads now proceed to verified service installation and the request staging directory is removed afterward.

## 0.2.0

- Bundle the Windows helper in the plugin and deploy it through MeshCentral's native, short-lived `agentdownload.ashx` transfer.
- Detect a missing or outdated helper in MeshCore, verify the downloaded byte length and SHA-256, install it as LocalSystem, and resume the original printer operation.
- Update the helper to 0.3.0 with self-install and self-upgrade support; its operation script and installer are embedded in the executable.
- Use request-specific staging paths and retain the helper's existing secret during upgrades.
- Reject the x64 helper on native 32-bit Windows while continuing to support a 32-bit MeshAgent running on 64-bit Windows.

## 0.1.5

- Label the MeshCentral device menu and page heading as `Printers` when Printer Control is the only registered device plugin.

## 0.1.4

- Encode MeshCore-to-helper CLI requests as Base64 so Windows process argument handling cannot strip JSON quotation marks.
- Update the Windows helper to 0.2.1 with strict Base64 request decoding and size validation.

## 0.1.3

- Supply the required Windows `argv[0]` entry when MeshCore launches the printer helper through MeshAgent's `execFile` implementation.

## 0.1.2

- Accept device identifiers from MeshCentral's default domain (`node//<id>`) while retaining strict node-ID validation.

## 0.1.1

- Defer permission registration until MeshCentral's `server_startup` hook so the plugin loads correctly with `settings.plugins.list`.

## 0.1.0

- Initial Windows printer inventory and Print Spooler status.
- Print job listing, pause, resume and cancellation.
- TCP/IP printer creation, printer deletion and optional unused port/driver cleanup.
- Test-page printing, port/driver removal and Spooler start/stop/restart/queue clearing.
- Per-plugin permissions and server-side request correlation.
- Local authenticated helper protocol with replay protection and an operation allow-list.
