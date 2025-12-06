# MongoDB Local Startup Script
# Run this script to start MongoDB locally

Write-Host "🔍 Checking MongoDB installation..." -ForegroundColor Cyan

# Common MongoDB installation paths
$mongoPaths = @(
    "C:\Program Files\MongoDB\Server\*\bin\mongod.exe",
    "C:\mongodb\bin\mongod.exe",
    "$env:ProgramFiles\MongoDB\Server\*\bin\mongod.exe"
)

$mongodPath = $null
foreach ($path in $mongoPaths) {
    $found = Get-ChildItem -Path $path -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) {
        $mongodPath = $found.FullName
        Write-Host "✅ Found MongoDB at: $mongodPath" -ForegroundColor Green
        break
    }
}

if (-not $mongodPath) {
    Write-Host "❌ MongoDB not found in common locations" -ForegroundColor Red
    Write-Host "Please install MongoDB or provide the path manually" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "You can:" -ForegroundColor Cyan
    Write-Host "1. Install MongoDB from: https://www.mongodb.com/try/download/community" -ForegroundColor White
    Write-Host "2. Or start MongoDB manually if you know the path" -ForegroundColor White
    exit 1
}

# Check if MongoDB service is already running
$mongoService = Get-Service -Name "MongoDB" -ErrorAction SilentlyContinue
if ($mongoService -and $mongoService.Status -eq 'Running') {
    Write-Host "✅ MongoDB service is already running!" -ForegroundColor Green
    Write-Host "   Service Status: $($mongoService.Status)" -ForegroundColor White
    exit 0
}

# Check if port 27017 is in use
$portCheck = Test-NetConnection -ComputerName localhost -Port 27017 -WarningAction SilentlyContinue
if ($portCheck.TcpTestSucceeded) {
    Write-Host "⚠️  Port 27017 is already in use" -ForegroundColor Yellow
    Write-Host "   MongoDB might already be running" -ForegroundColor White
    Write-Host "   Trying to connect..." -ForegroundColor Cyan
    
    # Try to connect
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port 27017 -InformationLevel Quiet
        if ($connection) {
            Write-Host "✅ MongoDB is accessible on port 27017" -ForegroundColor Green
            exit 0
        }
    } catch {
        Write-Host "❌ Port is in use but MongoDB might not be responding" -ForegroundColor Red
    }
}

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "⚠️  Not running as Administrator" -ForegroundColor Yellow
    Write-Host "   Attempting to start MongoDB manually (non-service mode)..." -ForegroundColor Cyan
}

# Create data directory if it doesn't exist
$dataPath = "C:\data\db"
if (-not (Test-Path $dataPath)) {
    Write-Host "📁 Creating data directory: $dataPath" -ForegroundColor Cyan
    try {
        New-Item -ItemType Directory -Path $dataPath -Force | Out-Null
        Write-Host "✅ Data directory created" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to create data directory: $_" -ForegroundColor Red
        Write-Host "   Please create it manually or run as Administrator" -ForegroundColor Yellow
        exit 1
    }
}

# Try to start MongoDB service
if ($mongoService) {
    Write-Host "🚀 Starting MongoDB service..." -ForegroundColor Cyan
    try {
        Start-Service -Name "MongoDB" -ErrorAction Stop
        Start-Sleep -Seconds 2
        $mongoService = Get-Service -Name "MongoDB"
        if ($mongoService.Status -eq 'Running') {
            Write-Host "✅ MongoDB service started successfully!" -ForegroundColor Green
            Write-Host "   Service Status: $($mongoService.Status)" -ForegroundColor White
            exit 0
        }
    } catch {
        Write-Host "⚠️  Could not start MongoDB service: $_" -ForegroundColor Yellow
        Write-Host "   Attempting manual start..." -ForegroundColor Cyan
    }
}

# Manual start (non-service)
Write-Host "🚀 Starting MongoDB manually..." -ForegroundColor Cyan
Write-Host "   Data path: $dataPath" -ForegroundColor White
Write-Host "   Port: 27017" -ForegroundColor White
Write-Host ""

$mongodArgs = @(
    "--dbpath", $dataPath,
    "--logpath", "C:\data\log\mongod.log",
    "--logappend"
)

# Create log directory if needed
$logPath = "C:\data\log"
if (-not (Test-Path $logPath)) {
    New-Item -ItemType Directory -Path $logPath -Force | Out-Null
}

try {
    Start-Process -FilePath $mongodPath -ArgumentList $mongodArgs -NoNewWindow
    Write-Host "✅ MongoDB started in background" -ForegroundColor Green
    Write-Host "   Waiting for MongoDB to initialize..." -ForegroundColor Cyan
    
    # Wait and check if MongoDB is responding
    $maxAttempts = 10
    $attempt = 0
    $connected = $false
    
    while ($attempt -lt $maxAttempts) {
        Start-Sleep -Seconds 2
        $portCheck = Test-NetConnection -ComputerName localhost -Port 27017 -InformationLevel Quiet -WarningAction SilentlyContinue
        if ($portCheck) {
            $connected = $true
            break
        }
        $attempt++
        Write-Host "   Attempt $attempt/$maxAttempts..." -ForegroundColor Gray
    }
    
    if ($connected) {
        Write-Host "✅ MongoDB is running and accessible!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 Connection Details:" -ForegroundColor Cyan
        Write-Host "   URI: mongodb://127.0.0.1:27017/delhi_breathes" -ForegroundColor White
        Write-Host "   Port: 27017" -ForegroundColor White
        Write-Host "   Database: delhi_breathes" -ForegroundColor White
        Write-Host ""
        Write-Host "🚀 You can now start your backend server!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  MongoDB started but not responding yet" -ForegroundColor Yellow
        Write-Host "   Check logs at: C:\data\log\mongod.log" -ForegroundColor White
    }
} catch {
    Write-Host "❌ Failed to start MongoDB: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Try running as Administrator or start MongoDB manually:" -ForegroundColor Yellow
    Write-Host "   $mongodPath --dbpath $dataPath" -ForegroundColor White
    exit 1
}

