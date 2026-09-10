param(
    [ValidateRange(1, 65535)]
    [int]$Port = 8098
)

$ErrorActionPreference = 'Stop'
$pidFile = Join-Path $PSScriptRoot '.local-server.pid'
$outLog = Join-Path $PSScriptRoot 'local-server.out.log'
$errLog = Join-Path $PSScriptRoot 'local-server.err.log'
$serverScript = Join-Path $PSScriptRoot 'serve-local.cjs'

if (Test-Path -LiteralPath $pidFile) {
    $savedState = Get-Content -LiteralPath $pidFile -Raw | ConvertFrom-Json
    $savedPid = [int]$savedState.Pid
    $savedProcess = Get-Process -Id $savedPid -ErrorAction SilentlyContinue
    $sameStartTime = $savedProcess -and ($savedProcess.StartTime.ToUniversalTime().ToString('o') -eq $savedState.Started)
    if ($sameStartTime) {
        Write-Output "Local server is already running (PID $savedPid)."
        Write-Output "URL: http://127.0.0.1:$($savedState.Port)/"
        exit 0
    }
    Remove-Item -LiteralPath $pidFile -Force
}

$portOwner = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue
if ($portOwner) {
    throw "Port $Port is already in use. Start with a different -Port value."
}

$node = (Get-Command node.exe -ErrorAction Stop).Source
$process = Start-Process `
    -FilePath $node `
    -ArgumentList @($serverScript, '--port', $Port) `
    -WorkingDirectory $PSScriptRoot `
    -WindowStyle Hidden `
    -RedirectStandardOutput $outLog `
    -RedirectStandardError $errLog `
    -PassThru

$serverState = [ordered]@{
    Pid = $process.Id
    Started = $process.StartTime.ToUniversalTime().ToString('o')
    Port = $Port
}
$serverState | ConvertTo-Json | Set-Content -LiteralPath $pidFile -Encoding Ascii

for ($attempt = 0; $attempt -lt 20; $attempt++) {
    Start-Sleep -Milliseconds 250
    if ($process.HasExited) {
        $message = if (Test-Path -LiteralPath $errLog) { Get-Content -LiteralPath $errLog -Raw } else { 'Unknown error' }
        Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue
        throw "Local server failed to start: $message"
    }
    if (Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue) {
        Write-Output "Local server started (PID $($process.Id))."
        Write-Output "URL: http://127.0.0.1:$Port/"
        exit 0
    }
}

throw 'Local server startup timed out. Check local-server.err.log.'
