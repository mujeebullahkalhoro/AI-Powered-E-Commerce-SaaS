#Requires -RunAsAdministrator
$ErrorActionPreference = "Stop"

$cfgPath = "C:\Program Files\MongoDB\Server\8.0\bin\mongod.cfg"
$serviceName = "MongoDB"

Write-Host "Configuring MongoDB replica set for local transactions..."

if (-not (Test-Path $cfgPath)) {
  throw "MongoDB config not found at $cfgPath"
}

$cfg = Get-Content $cfgPath -Raw

if ($cfg -notmatch "replSetName:\s*rs0") {
  if ($cfg -match "#replication:\s*") {
    $cfg = $cfg -replace "#replication:\s*", "replication:`r`n  replSetName: rs0`r`n"
  } elseif ($cfg -notmatch "replication:") {
    $cfg = $cfg.TrimEnd() + "`r`n`r`nreplication:`r`n  replSetName: rs0`r`n"
  } else {
    $cfg = $cfg -replace "replication:\s*", "replication:`r`n  replSetName: rs0`r`n"
  }

  Set-Content -Path $cfgPath -Value $cfg -Encoding UTF8
  Write-Host "Added replSetName: rs0 to mongod.cfg"
} else {
  Write-Host "Replica set already configured in mongod.cfg"
}

Write-Host "Restarting MongoDB service..."
Restart-Service $serviceName

$ready = $false
for ($i = 0; $i -lt 30; $i++) {
  Start-Sleep -Seconds 1
  try {
    $null = & mongosh --quiet --eval "db.runCommand({ ping: 1 })"
    $ready = $true
    break
  } catch {
    continue
  }
}

if (-not $ready) {
  throw "MongoDB did not become ready after restart."
}

Write-Host "Initializing replica set (if needed)..."
& mongosh --quiet --file "$PSScriptRoot\init-replica-set.js"

for ($i = 0; $i -lt 30; $i++) {
  $state = & mongosh --quiet --eval "try { rs.status().members[0].stateStr } catch { 'STARTUP' }"
  if ($state -eq "PRIMARY") {
    Write-Host "Replica set is PRIMARY. Transactions are enabled."
    exit 0
  }
  Start-Sleep -Seconds 1
}

throw "Replica set did not reach PRIMARY state."
