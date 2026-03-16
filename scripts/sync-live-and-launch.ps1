param(
    [switch]$NoOpen,
    [switch]$SkipElevation
)

$ErrorActionPreference = 'Stop'

function Write-Step {
    param([string]$Message)
    Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Test-IsAdmin {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Invoke-Native {
    param(
        [string]$FilePath,
        [string[]]$Arguments,
        [string]$FailureMessage
    )

    & $FilePath @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw $FailureMessage
    }
}

function Wait-ForPort {
    param(
        [string]$HostName,
        [int]$Port,
        [int]$TimeoutSeconds = 60
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        try {
            $client = New-Object System.Net.Sockets.TcpClient
            $async = $client.BeginConnect($HostName, $Port, $null, $null)
            if ($async.AsyncWaitHandle.WaitOne(1000, $false)) {
                $client.EndConnect($async)
                $client.Close()
                return $true
            }
            $client.Close()
        } catch {
        }
        Start-Sleep -Seconds 1
    }
    return $false
}

if ((-not $SkipElevation) -and (-not (Test-IsAdmin))) {
    $argList = @(
        '-NoProfile',
        '-ExecutionPolicy', 'Bypass',
        '-File', ('"' + $PSCommandPath + '"')
    )
    if ($NoOpen) {
        $argList += '-NoOpen'
    }
    if ($SkipElevation) {
        $argList += '-SkipElevation'
    }

    Start-Process -FilePath 'powershell.exe' -Verb RunAs -ArgumentList $argList
    exit
}

$projectRoot = 'C:\laragon\www\DoctorMarriageBureauLaravel'
$frontendRoot = Join-Path $projectRoot 'New User Panel Frontend'
$scriptRoot = Split-Path -Parent $PSCommandPath
$backupsDir = Join-Path $projectRoot 'backups'
$tmpDir = Join-Path $projectRoot 'tmp\live-sync'
$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$logFile = Join-Path $backupsDir ("sync_live_and_launch_$stamp.log")

$sshExe = 'C:\Windows\System32\OpenSSH\ssh.exe'
$scpExe = 'C:\Windows\System32\OpenSSH\scp.exe'
$cmdExe = 'C:\Windows\System32\cmd.exe'
$powershellExe = 'C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe'
$bashExe = 'C:\Program Files\Git\usr\bin\bash.exe'

$laragonExe = 'C:\laragon\laragon.exe'
$nginxExe = 'C:\laragon\bin\nginx\nginx-1.28.2\nginx.exe'
$nginxPrefix = 'C:\laragon\bin\nginx\nginx-1.28.2'
$mysqlExe = 'C:\laragon\bin\mysql\mysql-8.4.3-winx64\bin\mysql.exe'
$mysqldumpExe = 'C:\laragon\bin\mysql\mysql-8.4.3-winx64\bin\mysqldump.exe'
$phpExe = 'C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64\php.exe'
$nodeExe = 'C:\laragon\bin\nodejs\node-v22\node.exe'
$npmCmd = 'C:\laragon\bin\nodejs\node-v22\npm.cmd'
$tarExe = 'C:\Windows\System32\tar.exe'

$sshKey = 'C:\Users\Dr Faisal Maqsood PC\.ssh\id_ed25519'
$sshTarget = 'root@185.252.233.186'
$remoteProject = '/root/doctormarriagebureau'
$siteUrl = 'http://DoctorMarriageBureauLaravel.test:8080'
$panelUrl = 'http://DoctorMarriageBureauLaravel.test:8080/panel/'
$adminUrl = 'http://DoctorMarriageBureauLaravel.test:8080/admin'

$localDb = 'doctormarriagebureau'
$localDbUser = 'root'
$localDbPassword = ''

$prodDumpFile = Join-Path $backupsDir ("production_live_$stamp.sql")
$localBackupFile = Join-Path $backupsDir ("local_before_prod_sync_$stamp.sql")
$remoteDumpFile = "/tmp/doctormarriagebureau_live_$stamp.sql"

New-Item -ItemType Directory -Force -Path $backupsDir | Out-Null
New-Item -ItemType Directory -Force -Path $tmpDir | Out-Null

Start-Transcript -Path $logFile | Out-Null

try {
    Write-Step 'Checking required tools and paths'
    $requiredPaths = @(
        $sshExe, $scpExe, $cmdExe, $laragonExe, $nginxExe,
        $mysqlExe, $mysqldumpExe, $phpExe, $nodeExe, $npmCmd,
        $tarExe, $bashExe, $sshKey, $projectRoot, $frontendRoot
    )
    foreach ($path in $requiredPaths) {
        if (-not (Test-Path $path)) {
            throw "Required path not found: $path"
        }
    }
    $env:Path = "C:\laragon\bin\nodejs\node-v22;C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64;C:\laragon\bin\mysql\mysql-8.4.3-winx64\bin;$env:Path"

    Write-Step 'Starting Laragon if needed'
    if (-not (Wait-ForPort -HostName '127.0.0.1' -Port 3306 -TimeoutSeconds 2)) {
        Start-Process -FilePath $laragonExe | Out-Null
        if (-not (Wait-ForPort -HostName '127.0.0.1' -Port 3306 -TimeoutSeconds 40)) {
            throw 'MySQL did not start after launching Laragon.'
        }
    }

    Write-Step 'Ensuring local Nginx is running with latest config'
    if (Get-Process nginx -ErrorAction SilentlyContinue) {
        Invoke-Native -FilePath $nginxExe -Arguments @('-p', "$nginxPrefix\", '-c', 'conf/nginx.conf', '-s', 'reload') -FailureMessage 'Failed to reload Nginx.'
    } else {
        Start-Process -FilePath $nginxExe -ArgumentList @('-p', "$nginxPrefix\", '-c', 'conf/nginx.conf') -WorkingDirectory $nginxPrefix | Out-Null
    }
    if (-not (Wait-ForPort -HostName '127.0.0.1' -Port 8080 -TimeoutSeconds 20)) {
        throw 'Nginx is not responding on port 8080.'
    }

    Write-Step 'Verifying SSH access to production VPS'
    Invoke-Native -FilePath $sshExe -Arguments @('-i', $sshKey, '-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=accept-new', $sshTarget, 'echo connected') -FailureMessage 'SSH connection to production VPS failed.'

    Write-Step 'Backing up current local database'
    Invoke-Native -FilePath $mysqldumpExe -Arguments @('-u', $localDbUser, '--result-file', $localBackupFile, $localDb) -FailureMessage 'Failed to back up the current local database.'

    Write-Step 'Dumping the live production database'
    $remoteDumpCommand = @"
bash -lc 'set -a; . "$remoteProject/.env"; set +a; docker exec marriagebureau-db mysqldump -u"`$DB_USERNAME" -p"`$DB_PASSWORD" --single-transaction --routines --triggers --no-tablespaces "`$DB_DATABASE" > "$remoteDumpFile"'
"@
    Invoke-Native -FilePath $sshExe -Arguments @('-i', $sshKey, $sshTarget, $remoteDumpCommand) -FailureMessage 'Failed to create the production database dump on the VPS.'
    Invoke-Native -FilePath $scpExe -Arguments @('-i', $sshKey, ($sshTarget + ':' + $remoteDumpFile), $prodDumpFile) -FailureMessage 'Failed to copy the production database dump locally.'
    Invoke-Native -FilePath $sshExe -Arguments @('-i', $sshKey, $sshTarget, "rm -f $remoteDumpFile") -FailureMessage 'Failed to remove the temporary production database dump from the VPS.'

    Write-Step 'Replacing local database with live production data'
    Invoke-Native -FilePath $mysqlExe -Arguments @('-u', $localDbUser, '-e', "DROP DATABASE IF EXISTS $localDb; CREATE DATABASE $localDb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;") -FailureMessage 'Failed to recreate the local database.'
    & $cmdExe /d /c "`"$mysqlExe`" -u $localDbUser $localDb < `"$prodDumpFile`""
    if ($LASTEXITCODE -ne 0) {
        throw 'Failed to import the production database locally.'
    }

    Write-Step 'Refreshing live media from production'
    $mediaSyncCommand = @"
cd '$projectRoot' &&
rm -rf public/uploads storage/app/public public/download &&
mkdir -p public storage/app &&
ssh -i '$sshKey' $sshTarget "cd $remoteProject && tar -czf - public/uploads storage/app/public public/download public/backVideo.mp4 public/backVideo1.mp4 public/backVideo2.mp4 public/event1.png public/event1.svg public/event2.png public/favicon.ico public/loginVideo.mp4 public/logo2.png public/logo3.png public/marriaglogo.png public/regVideo.mp4 public/registerVideo.mp4 public/startsvg.svg" | tar -xzf - -C .
"@
    Invoke-Native -FilePath $bashExe -Arguments @('-lc', $mediaSyncCommand) -FailureMessage 'Failed to sync production media.'

    Write-Step 'Rebuilding the React user panel'
    if (-not (Test-Path (Join-Path $frontendRoot 'node_modules'))) {
        Push-Location $frontendRoot
        try {
            Invoke-Native -FilePath $npmCmd -Arguments @('install') -FailureMessage 'npm install failed for the React frontend.'
        } finally {
            Pop-Location
        }
    }
    Push-Location $frontendRoot
    try {
        Invoke-Native -FilePath $npmCmd -Arguments @('run', 'build') -FailureMessage 'npm run build failed for the React frontend.'
    } finally {
        Pop-Location
    }

    Write-Step 'Refreshing Laravel runtime caches and storage link'
    Push-Location $projectRoot
    try {
        & $phpExe artisan storage:link --force | Out-Host
        & $phpExe artisan optimize:clear | Out-Host
        if ($LASTEXITCODE -ne 0) {
            throw 'php artisan optimize:clear failed.'
        }
        & $phpExe artisan optimize | Out-Host
        if ($LASTEXITCODE -ne 0) {
            throw 'php artisan optimize failed.'
        }
    } finally {
        Pop-Location
    }

    Write-Step 'Verifying localhost endpoints'
    $backendResponse = Invoke-WebRequest -UseBasicParsing -Uri $siteUrl -TimeoutSec 30
    $panelResponse = Invoke-WebRequest -UseBasicParsing -Uri $panelUrl -TimeoutSec 30
    if ($backendResponse.StatusCode -ne 200) {
        throw 'Backend homepage verification failed.'
    }
    if ($panelResponse.StatusCode -ne 200) {
        throw 'React panel verification failed.'
    }

    Write-Step 'Sync complete'
    Write-Host "Local backup: $localBackupFile" -ForegroundColor Green
    Write-Host "Production dump: $prodDumpFile" -ForegroundColor Green
    Write-Host "Log file: $logFile" -ForegroundColor Green
    Write-Host "Backend: $siteUrl" -ForegroundColor Green
    Write-Host "Admin:   $adminUrl" -ForegroundColor Green
    Write-Host "Panel:   $panelUrl" -ForegroundColor Green

    if (-not $NoOpen) {
        Start-Process $siteUrl | Out-Null
        Start-Process $panelUrl | Out-Null
        Start-Process $adminUrl | Out-Null
    }
} finally {
    Stop-Transcript | Out-Null
}
