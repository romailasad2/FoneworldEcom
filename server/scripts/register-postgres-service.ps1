# Registers the local PostgreSQL 17 cluster as an auto-start Windows service.
# Must be run as Administrator. Safe to re-run.
$ErrorActionPreference = 'Stop'
Start-Transcript -Path "$env:TEMP\pg-register.log" -Force | Out-Null

$bin = 'C:\Program Files\PostgreSQL\17\bin'
$oldData = Join-Path $env:LOCALAPPDATA 'foneworld-pg'
$newData = 'C:\foneworld-pg'
$svc = 'postgresql-foneworld'
$account = 'NT AUTHORITY\NetworkService'

Write-Host "Stopping any manually-started PostgreSQL on the old data dir..."
if (Test-Path (Join-Path $oldData 'postmaster.pid')) {
  & "$bin\pg_ctl.exe" -D $oldData stop -m fast 2>$null
  Start-Sleep -Seconds 2
}

# Move the data directory out of the user profile (only if not already moved)
if (-not (Test-Path $newData)) {
  if (Test-Path $oldData) {
    Write-Host "Moving data directory to $newData ..."
    Move-Item -Path $oldData -Destination $newData
  } else {
    throw "No data directory found at $oldData or $newData"
  }
} else {
  Write-Host "Data directory already at $newData"
}

# Grant the service account access to the data directory
Write-Host "Granting $account access to $newData ..."
icacls $newData /grant "${account}:(OI)(CI)F" /T /C | Out-Null

# Register the service (remove existing first if present)
$existing = Get-Service -Name $svc -ErrorAction SilentlyContinue
if ($existing) {
  Write-Host "Service already exists; unregistering first..."
  & "$bin\pg_ctl.exe" unregister -N $svc 2>$null
  Start-Sleep -Seconds 2
}

Write-Host "Registering service '$svc' ..."
& "$bin\pg_ctl.exe" register -N $svc -U $account -D $newData -S auto -o "-p 5432"
Start-Sleep -Seconds 2

Write-Host "Starting service '$svc' ..."
Start-Service -Name $svc
Start-Sleep -Seconds 3

$status = (Get-Service -Name $svc).Status
Write-Host "SERVICE_STATUS=$status"
Stop-Transcript | Out-Null
