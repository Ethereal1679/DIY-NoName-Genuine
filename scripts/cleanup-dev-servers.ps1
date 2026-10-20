$ErrorActionPreference = "Stop"

$ports = @(18765, 18766, 18767, 8082)
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$projectRoot = $projectRoot.TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar

function Get-ListeningOwner {
	$owners = @()

	try {
		$owners = @(Get-NetTCPConnection -State Listen -ErrorAction Stop |
			Where-Object { $ports -contains $_.LocalPort } |
			ForEach-Object { [pscustomobject]@{ Port = $_.LocalPort; ProcessId = $_.OwningProcess } })
	} catch {
		foreach ($line in (& netstat.exe -ano -p tcp)) {
			if ($line -match '^\s*TCP\s+\S+:(\d+)\s+\S+\s+LISTENING\s+(\d+)\s*$') {
				$port = [int]$Matches[1]
				if ($ports -contains $port) {
					$owners += [pscustomobject]@{ Port = $port; ProcessId = [int]$Matches[2] }
				}
			}
		}
	}

	return $owners
}

function Get-ProjectRuntime {
	return @(Get-CimInstance Win32_Process | Where-Object {
		$_.Name -match '^(node|electron)\.exe$' -and
		$_.CommandLine -and
		$_.CommandLine.IndexOf($projectRoot, [StringComparison]::OrdinalIgnoreCase) -ge 0
	})
}

Write-Host "Project: $projectRoot"
Write-Host "Checking backend ports: $($ports -join ', ')"

$processes = @(Get-CimInstance Win32_Process)
$processById = @{}
foreach ($process in $processes) {
	$processById[[int]$process.ProcessId] = $process
}

$targets = [Collections.Generic.HashSet[int]]::new()
$listeners = @(Get-ListeningOwner)
foreach ($listener in $listeners) {
	$process = $processById[[int]$listener.ProcessId]
	$name = if ($process) { $process.Name } else { "unknown process" }
	Write-Host "Port $($listener.Port): PID $($listener.ProcessId) ($name)"
	[void]$targets.Add([int]$listener.ProcessId)

	# Stop Node-based dev-server supervisors too, so they cannot leave child services behind.
	$current = $process
	while ($current -and $processById.ContainsKey([int]$current.ParentProcessId)) {
		$parent = $processById[[int]$current.ParentProcessId]
		if ($parent.Name -notmatch '^(node|electron)\.exe$') { break }
		[void]$targets.Add([int]$parent.ProcessId)
		$current = $parent
	}
}

$projectProcesses = @(Get-ProjectRuntime)
foreach ($process in $projectProcesses) {
	[void]$targets.Add([int]$process.ProcessId)
}

if ($targets.Count -eq 0) {
	Write-Host "No project backend processes are running."
} else {
	Write-Host "Stopping $($targets.Count) port or project process(es)..."
	foreach ($processId in $targets) {
		& taskkill.exe /PID $processId /T /F 2>$null | Out-Null
	}
}

Start-Sleep -Milliseconds 800
$remainingListeners = @(Get-ListeningOwner)
$remainingProjectProcesses = @(Get-ProjectRuntime)

if ($remainingListeners.Count -gt 0 -or $remainingProjectProcesses.Count -gt 0) {
	Write-Warning "Some project backend processes are still running. Close them manually and retry."
	foreach ($listener in $remainingListeners) {
		Write-Host "Port $($listener.Port) remains owned by PID $($listener.ProcessId)."
	}
	foreach ($process in $remainingProjectProcesses) {
		Write-Host "Project process remains: PID $($process.ProcessId) ($($process.Name))."
	}
	exit 1
}

foreach ($port in $ports) {
	Write-Host "Port $port is clear."
}
Write-Host "Project backend and Electron development processes are stopped."
