# Changelog

## 0.4.45

- Rebased the endpoint watcher on the stable 0.4.40 startup implementation.
- Added persistent browser, sound and optional desktop alerts for Paper Out, Paper Jam and Paper Problem.
- Added a bounded no-progress heuristic for drivers that expose only Printing or Idle while paper is missing or jammed.
- Propagated physical-job Paper Problem state to the active-printer inventory.

## 0.4.39

- Add a native Windows Spooler `EnumJobs` reader as the primary source for active jobs, independent of WMI and the PrintManagement module.
- Poll native queues every 100 ms while the Printers tab is active and sample them immediately during Spooler notification bursts.
- Preserve `Win32_PrintJob` and `Get-PrintJob` as enrichment/fallback sources for document, user, page and status data.
- Fall back to `Win32_Printer` when `Get-Printer` is unavailable while discovering queue names.
- Keep Remote Tools-style fault priority and the existing post-Spooler physical-print tracking after the job is captured.

## 0.4.38

- Capture very short USB print jobs through two independent sources: `Win32_PrintJob` and the direct PrintManagement `Get-PrintJob` interface.
- Recreate the `Win32_PrintJob` searcher for each snapshot so WMI provider caching cannot leave the live watcher on an obsolete result set.
- After a native Spooler notification, sample the queues for a longer high-frequency burst and query `Get-PrintJob` every second sample.
- Poll the direct PrintManagement source periodically even when native Spooler notifications are unavailable.
- Preserve the existing post-Spooler physical-print tracking once a fast job has been captured.

## 0.4.37

- Read the official `Win32_PrintJob.StatusMask` bit field instead of relying only on the often-generic `JobStatus` text.
- Detect queue-level **Paper Out**, **Offline**, **User Intervention**, **Blocked**, **Error** and **Paused** flags even when the driver simultaneously reports **Printing**.
- Give the most specific active job fault priority in both the printer row and the corresponding print-job row.
- Aggregate the numeric `Get-PrintJob.JobStatus` flags as a second signal, matching Remote Tools behavior more closely on Canon and Epson drivers.

## 0.4.36

- Match the Remote Tools status-resolution model by combining `Get-Printer`, `Get-PrintJob` and `Win32_Printer` signals.
- Give real printer faults priority over active jobs: Offline, Paper Jam, Paper Out, Door Open, No Toner, Output Bin Full, Out of Memory, Manual Feed, User Intervention, Error, Stopped and Paused are no longer overwritten by **Printing**.
- Apply the same effective fault state to both the physical-printer list and the corresponding print-job rows in real time.
- Cache device and cmdlet signals for 350 ms to keep the richer status polling responsive without repeatedly invoking PrintManagement for every event burst.


## 0.4.35

- Prevent drivers such as some Epson/Canon packages from leaving a completed printer permanently in **Printing** when `Win32_Printer` keeps reporting a stale Busy/Processing value.
- Keep the post-Spooler job visible while physical printing is expected, but apply a bounded busy-state grace period after the page-based estimate.
- Measure the estimate from the moment the job first appears in the queue instead of restarting the full estimate after Spooler handoff.
- Return the printer to **Idle** when there are no tracked jobs, even if the Windows driver continues exposing an obsolete Printing state.
- Preserve fast completion when a reliable driver actually transitions from Printing/Busy back to Idle.

## 0.4.34

- Keep a print-job row visible with status **Printing** after Windows transfers the job from Spooler to the printer buffer.
- Prefer the physical `Win32_Printer` transition from Printing/Busy back to Idle before removing the row.
- Use a bounded page-count estimate only when the driver does not expose reliable physical progress, and show that the duration is estimated.
- Keep multiple buffered jobs in order by extending the estimate per printer rather than removing all rows immediately.
- Disable Pause, Resume and Cancel after Spooler handoff because Windows no longer owns the job.
- Restart the live watcher after **Clear queue** so all shadow rows are removed, while warning that pages already buffered inside the printer may continue printing.

## 0.4.33

- Show only jobs that are currently active in the Windows Print Spooler.
- Remove a row immediately when Windows reports `Printed`, `Completed`, `Deleted`, or removes it from `Win32_PrintJob`.
- Remove the synthetic post-spool physical-completion holding period and the eight-second completed-row retention.
- Make **Clear queue** remove all jobs and spool files, verify that no jobs remain, and clear the browser table immediately after success.
- Keep the active physical-printer list and its job counts synchronized with the active queue only.

## 0.4.32

- Restored a dedicated **Active physical printers** table above the single all-printers print-jobs table.
- Exclude redirected, PDF, XPS, Fax, OneNote and other virtual queues, and hide printers reported offline or unavailable.
- Publish a lightweight live printer snapshot from the already-running endpoint watcher approximately every two seconds.
- Add or remove printer rows automatically as physical printers become active or offline, without requiring Refresh.
- Keep only one **Print jobs — all printers** table and filter its live jobs to printers in the active physical-printer list.

## 0.4.31

- Replaced the printer inventory, selected-printer queue and separate activity view with one visible **Print jobs — all printers** table.
- The live subscription now represents all endpoint printers and aggregates every queue event into that single table.
- Added the printer name to every job row and kept Pause, Resume and Cancel actions bound to the correct printer.
- Real-time monitoring still starts automatically in the Printers top tab and stops only when leaving that top tab.

## 0.4.30

- Keep real-time printer monitoring permanently enabled while the top-level **Printers** tab is selected.
- Remove the manual pause/start control so queue and printer status cannot be disabled accidentally inside the plugin.
- Stop monitoring only when the user changes to another main MeshCentral device tab such as **Desktop**, **Terminal**, **Files** or another plugin page.
- Do not stop monitoring when the browser is minimized, the browser tab becomes hidden, a printer is selected, a job is refreshed, or another control inside Printer Control is used.
- Restart the live subscription automatically after lease or 10-minute safety renewal while the **Printers** tab remains active.

## 0.4.29

- Start real-time printer monitoring automatically whenever the Printers tab is visible and the user has view permission.
- Update each printer row immediately from spooler and physical-device events, including effective `Printing`, `Paused`, `Offline`, `Error`, `Warming up` or `Idle` status and the active-job count.
- Keep one endpoint watcher for all printer queues when switching the selected printer or printing a test page.
- Pause monitoring when the tab is hidden, resume it automatically when visible again, and renew the subscription before the independent 10-minute safety limit.
- Retain manual pause/start controls and the event-driven design without continuous browser or inventory polling.

## 0.4.28

- Continue monitoring a job after Windows removes it from `Win32_PrintJob`, using the physical device state exposed by `Win32_Printer`.
- Keep the job active while the driver reports `Printing`, `Busy`, `Warming up`, `Offline`, or an error, and complete it after the device returns to `Idle`.
- Show explicitly when the driver does not expose physical progress; in this case a bounded 60-to-180-second safety window prevents the job from disappearing immediately.
- Disable queue actions for post-Spooler rows because Windows can no longer pause, resume or cancel a job after handing it to the device.
- Preserve the final completed row for eight seconds before removing it from the live tables.

## 0.4.27

- Wake live monitoring from native Windows Print Spooler job-change notifications instead of relying only on a fixed polling interval.
- Run a short 25-millisecond `Win32_PrintJob` snapshot burst after a native notification, with a one-second safety snapshot and the existing 100-millisecond fallback when native notification is unavailable.
- Keep completed jobs visible for eight seconds as `Sent to printer` in both the selected queue and the all-printers live table.
- Show a temporary generic Spooler activity row when a job completes before Windows exposes enough metadata for a queue snapshot.

## 0.4.26

- Replace the transition history with a real-time `Active print jobs — all printers` table.
- Add jobs when they enter a Windows queue, update their current status and remove them immediately when they leave the spooler.
- Keep simultaneous active jobs grouped across every printer without retaining completed history rows.
- Move the all-printer table below the manually selected `Print jobs` queue.
- Make event notifications disappear automatically after five seconds.
- Add iframe document scrolling, bottom clearance and horizontally scrollable tables so MeshCentral's footer and narrow layouts do not hide information.

## 0.4.25

- Add a dedicated `Live print activity — all printers` feed instead of forcing simultaneous events into one selected-printer table.
- Preserve up to 100 status transitions with time, printer, job ID, document, user, status and driver-reported progress.
- Display events from multiple printer queues concurrently without switching or replacing the manually selected queue.
- Replace the coalescing WMI event watcher with a 100-millisecond `Win32_PrintJob` snapshot diff while Live events is explicitly enabled.
- Emit separate creation, modification and deletion transitions for every detected job, including multiple jobs changed in the same snapshot.
- Keep the existing live lease, visibility shutdown and 10-minute endpoint safety limit.

## 0.4.24

- Monitor print activity across all queues on the endpoint while Live events is enabled.
- Automatically switch the print-job panel to the printer that receives a job from Word or another local application.
- Forward authorized spooler events without filtering them to the printer that was selected when live monitoring started.
- Reduce the opt-in WMI event sampling window from one second to 200 milliseconds so fast TCP/IP jobs are much less likely to be missed.
- Retain the existing 10-minute watcher limit, lease checks and event coalescing to bound the additional live-monitoring work.

## 0.4.23

- Distinguish Windows spooler completion from physical printing by displaying `Sent to printer` instead of `Completed`.
- Explain that physical printing may continue after Windows removes a job from its queue.
- Rename the page column to `Driver progress` and show printed and remaining pages only from values reported by the Windows driver.
- Display `Not reported` or `Spooler finished` instead of misleading values such as `0/1` after queue deletion.
- Keep the most recent spooler hand-off visible for 60 seconds without endpoint polling.

## 0.4.22

- Display a provisional `Windows Test Page` job immediately when **Test** is pressed, including when live events are off.
- Query the selected print queue immediately after Windows accepts the test-page command.
- Retry an empty queue only twice, after 750 and 1750 milliseconds, without enabling background polling.
- Replace the indefinite `Waiting for test-page print events...` state with a clear final result when no active queue item can be observed.
- Handle virtual printers such as OneNote and interactive-output drivers without leaving the print-job panel blocked.
- Stop bounded queue discovery as soon as a matching live print-job event arrives.
- Preserve a matching live event when it arrives before the test-page command response or an in-flight queue check.

## 0.4.21

- Replace the single 120/135-second limit with operation-specific endpoint and server timeouts.
- Stop a stuck `testPage` PowerShell/CIM request after 30 seconds and release the server lock within a 45-second safety window.
- Limit print-job reads and job actions to 45/30 seconds on the endpoint, with corresponding server margins.
- Keep longer safety windows for inventory, printer installation/removal and queue cleanup.
- Send the operation-specific server limit to the browser countdown for direct, coalesced and queued work.
- Use the active operation's own timeout when recovering stale endpoint and server locks.
- Restore cached inventory silently when MeshCentral's periodic device refresh rebuilds the plugin iframe.

## 0.4.20

- Apply the dark Permissions theme immediately when the dialog is opened from MeshCentral's Action selector.
- Detect both `click` and `change` opening events without a permanent DOM observer.
- Inspect only compact control attributes and labels instead of reading `textContent` from large page containers on every click.
- Retry theme application briefly at 0, 50 and 200 milliseconds to cover asynchronous modal creation.

## 0.4.19

- Automatically move an active print-job live subscription to the printer whose **Test** button is pressed.
- Wait for the server to confirm the updated printer filter before starting the test page.
- Select the target printer and show its print-job panel while the test page is being monitored.
- Reuse the existing subscription and endpoint watcher instead of stopping and recreating live monitoring.
- Discard delayed events and short-lived completed-job entries from the previously monitored printer.

## 0.4.18

- Display a `MM:SS` countdown while a printer operation is running or waiting for the current endpoint operation.
- Send the authoritative remaining server timeout to the browser for direct, coalesced and queued reads.
- Restart the countdown when a queued read begins its own endpoint operation.
- Update the countdown locally once per second without adding MeshCentral or MeshAgent traffic.
- Stop the timer immediately when the operation completes, fails or the agent goes offline.

## 0.4.17

- Queue inventory and print-job reads per device when another endpoint operation is still finishing instead of returning a blocking error.
- Dispatch the next queued read after success, failure, agent-send failure or the 135-second server timeout.
- Show an explicit waiting state in the UI while a read is queued.
- Keep destructive printer and Spooler changes non-queued so they are never executed later than the user's action.
- Track the active PowerShell child and automatically terminate and clear an endpoint lock that outlives the normal operation timeout.

## 0.4.16

- Preserve the latest inventory and its in-flight state in the MeshCentral parent window, keyed by node id.
- Reuse cached inventory when returning to the Printers tab instead of automatically launching another endpoint operation.
- Let a recreated iframe wait for the existing inventory result, which MeshCentral routes to the current plugin message handler.
- Expire abandoned shared in-flight markers after 150 seconds, slightly beyond the server operation timeout.

## 0.4.15

- Replace the Printers-page placeholder instead of appending through MeshCentral's `QA()` helper, which could recreate an existing iframe.
- Guarantee one Printer Control iframe per device page and remove stale or duplicate frames before loading.
- Coalesce duplicate inventory requests and same-printer queue reads into the already-running endpoint operation.
- Return the shared result to every waiting browser using its own client request identifier.
- Self-heal stale per-node operation locks whose pending request no longer exists.

## 0.4.14

- Replace blocking `child.waitExit()` printer operations with asynchronous PowerShell execution so slow printer providers do not block the MeshAgent event loop.
- Enforce a 120-second endpoint timeout with process termination and bounded stdout/stderr collection.
- Serialize all normal printer PowerShell operations per endpoint in both MeshCentral and MeshAgent, including mutations initiated by multiple sessions.
- Add browser-generated request correlation identifiers and ignore stale results.
- Disable printer actions while an operation is active and add a 30-second permissions/status request timeout.
- Load the iframe from the generic Plugins tab only when the Printer Control child page is actually visible.
- Remove generic legacy PowerShell process cleanup; new watcher processes carry a unique Printer Control marker for precise future identification.
- Keep the watcher hard deadline anchored to its actual start time instead of resetting it for existing watchers.
- Coalesce rapid non-deletion job events before queue snapshots and bound agent-to-server event payloads.
- Start one watcher for the first subscription only, cap subscriptions and pending requests, and run subscription cleanup only while subscriptions exist.
- Require agent-originated results and events to match the authoritative MeshAgent node.
- Remove the obsolete root `printercontrol.handlebars` file containing the stale 0.4.5 MeshCore module.

## 0.4.13

- Lazy-load the Printer Control iframe only when the **Printers** device tab is actually opened, so opening a device or starting Desktop no longer triggers hidden printer inventory work.
- Reuse the same iframe for repeated `onDeviceRefreshEnd` callbacks on the same device instead of recreating it and restarting initialization.
- Stop live print-job monitoring immediately when another MeshCentral device or plugin tab is selected.
- Remove the two-second iframe visibility interval; the existing 15-second live lease heartbeat still verifies visibility while live monitoring is enabled.
- Replace the permanent permissions-dialog `MutationObserver` with a lightweight click-triggered dark-mode update.
- Reject overlapping inventory or queue-read requests for the same endpoint as a server-side safety guard.
- Keep inventory one-time on intentional Printers-page opening, manual thereafter, with no background printer polling.

## 0.4.12

- Make live print-job monitoring explicitly opt-in; pressing **Jobs** now performs only a one-time queue load.
- Add visible **Start live events** / **Stop live events** controls.
- Stop live monitoring automatically when the Printers iframe becomes hidden.
- Add a lightweight 15-second browser-to-server heartbeat only while live monitoring is enabled.
- Expire stale server subscriptions after 45 seconds and enforce a 10-minute maximum live session.
- Add an independent MeshAgent watcher lease, a PowerShell self-timeout and a 10-minute endpoint hard limit so orphaned PowerShell/WMI processes cannot remain active indefinitely.
- Perform a narrowly targeted one-time cleanup of legacy watcher processes left by earlier live-monitoring builds.
- Stop and remove subscriptions when watcher startup fails, the agent goes offline, or the watcher exits.
- Keep printer inventory and manual queue refresh free of periodic polling.

## 0.4.11

- Fix the live watcher exiting immediately with code 0 after startup.
- Launch the watcher through a short PowerShell bootstrap that first reads the complete program from standard input and then executes it as a ScriptBlock.
- Closing stdin now completes only the program transfer and no longer terminates the long-running watcher.

## 0.4.10

- Fix `ManagementException: Unparsable query` when starting live print-job events.
- Replace the unsupported 250 ms intrinsic-event interval with the valid WQL query `WITHIN 1`.
- Keep the design event-driven between endpoint, MeshCentral server and browser; only WMI performs its required local one-second intrinsic-event check while a Jobs subscription is active.

## 0.4.9

- Fix the 0.4.8 watcher startup bug by closing PowerShell standard input after sending the multi-line watcher program.
- Wait for an explicit `ready` message from PowerShell before showing **Live events on**.
- Reduce the local WMI intrinsic-event sampling interval from one second to 0.25 seconds so short-lived print jobs are much less likely to be missed.
- Preserve completed jobs as a recent event for 15 seconds using a one-shot browser timer, without any periodic server or endpoint refresh.
- Show a concrete watcher error instead of reporting live events as active when PowerShell did not actually start.

## 0.4.8

- Add event-driven print-job updates without browser or server polling.
- Start one local `Win32_PrintJob` WMI watcher only after **Jobs** is selected and stop it when the last browser subscription closes.
- Send bounded queue snapshots from MeshAgent to the subscribed MeshCentral session when a job is created, modified or deleted.
- Debounce rapid job events in the browser and render the newest queue snapshot directly, without launching a second PowerShell request.
- Keep **Refresh jobs** as a manual fallback and retain manual-only printer inventory refresh.
- Preserve redirected-printer filtering, dark-mode fixes and the PowerShell standard-input launcher from 0.4.7.

## 0.4.7

- Fix PowerShell parse failures on MeshAgent caused by passing a command longer than approximately 4 KiB through the Windows process command line.
- Stream the in-memory PowerShell launcher through standard input using `-Command -`; no endpoint file is created.
- Retain the 0.4.6 manual-only refresh behavior and redirected-printer filtering.

## 0.4.6

- Remove the remaining two-second automatic permission, agent-status, Print Spooler and printer-inventory polling.
- Load inventory once when the Printers page opens; all later inventory and connectivity checks are manual through **Refresh**.
- Keep one-time refreshes only after operations that change printer or Spooler state.
- Keep Print jobs fully manual through **Jobs** and **Refresh jobs**.
- Avoid a full inventory refresh after printing a test page.
- Reduce the dark-mode observer scope and style the legacy Permissions **Cancel** button correctly.

## 0.4.5

- Remove the one-second automatic Print jobs polling interval.
- Keep Print jobs updates manual through the **Jobs** and **Refresh jobs** buttons.
- Continue refreshing agent, Print Spooler and printer inventory status every two seconds.

## 0.4.4

- Hide Remote Desktop redirected printers from inventory by filtering the `Remote Desktop Easy Print` driver and `TSnnn` session ports.
- Hide the redirected-printer driver and transient Terminal Services ports from the add-printer inventory.
- Reject direct jobs, test-page and delete operations against redirected session printers.

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
