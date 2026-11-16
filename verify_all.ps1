# Cartly - Comprehensive 12-Project Test & Verification Runner
$ErrorActionPreference = "Continue"

$projects = @(
    "01-online-bookstore",
    "02-progressive-web-app-store",
    "03-job-board-platform",
    "04-hotel-booking-system",
    "05-restaurant-reservation-system",
    "06-movie-ticket-booking",
    "07-grocery-delivery-app",
    "08-car-rental-system",
    "09-real-estate-listing-platform",
    "10-house-rental-platform",
    "11-airbnb-clone",
    "12-flight-booking-system"
)

$results = @()
$totalPassed = 0
$totalFailed = 0

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   CARTLY: Running Automated Verification Across All 12 Projects   " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

foreach ($proj in $projects) {
    Write-Host "`n>> Testing $proj..." -ForegroundColor Yellow
    $projPath = Join-Path $PSScriptRoot $proj
    $startTime = Get-Date

    Push-Location $projPath
    $output = cmd.exe /c "npm test 2>&1"
    $exitCode = $LASTEXITCODE
    Pop-Location

    $duration = [math]::Round(((Get-Date) - $startTime).TotalSeconds, 2)

    if ($exitCode -eq 0) {
        Write-Host "   [PASS] $proj completed in ${duration}s" -ForegroundColor Green
        $results += [PSCustomObject]@{
            Project  = $proj
            Status   = "PASSED"
            Duration = "${duration}s"
            Code     = $exitCode
        }
        $totalPassed++
    } else {
        Write-Host "   [FAIL] $proj failed (Exit: $exitCode)" -ForegroundColor Red
        $results += [PSCustomObject]@{
            Project  = $proj
            Status   = "FAILED"
            Duration = "${duration}s"
            Code     = $exitCode
        }
        $totalFailed++
    }
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "   FINAL VERIFICATION REPORT" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
$results | Format-Table -AutoSize

Write-Host "`nTotal Projects Tested: $($projects.Count)" -ForegroundColor Cyan
Write-Host "Passed: $totalPassed | Failed: $totalFailed" -ForegroundColor $(if ($totalFailed -eq 0) { "Green" } else { "Red" })

if ($totalFailed -gt 0) {
    exit 1
} else {
    exit 0
}
