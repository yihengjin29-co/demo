$ErrorActionPreference = 'Stop'
$pidFile = Join-Path $PSScriptRoot '.local-server.pid'
if (-not (Test-Path -LiteralPath $pidFile)) {
    Write-Output 'No local server PID file was found. The server may already be stopped.'
    exit 0
}

$savedState = Get-Content -LiteralPath $pidFile -Raw | ConvertFrom-Json
$savedPid = [int]$savedState.Pid
$processInfo = Get-Process -Id $savedPid -ErrorAction SilentlyContinue

if (-not $processInfo) {
    Remove-Item -LiteralPath $pidFile -Force
    Write-Output 'The server was already stopped. Removed the stale PID file.'
    exit 0
}

if ($processInfo.ProcessName -ne 'node' -or
    $processInfo.StartTime.ToUniversalTime().ToString('o') -ne $savedState.Started) {
    throw "PID $savedPid does not belong to this demo. No process was stopped."
}

Stop-Process -Id $savedPid
Remove-Item -LiteralPath $pidFile -Force
Write-Output "Local server stopped (PID $savedPid)."
