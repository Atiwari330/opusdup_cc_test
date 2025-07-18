# Simple PowerShell script to test EHR API endpoints

Write-Host "Testing EHR API Endpoints" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green

# Check if server is running
Write-Host ""
Write-Host "Checking if server is running..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/guest" -Method POST -ContentType "application/json"
    Write-Host "Server is running!" -ForegroundColor Green
} catch {
    Write-Host "Server not running! Please start with: pnpm dev" -ForegroundColor Red
    exit
}

# Check for PDF file
Write-Host ""
Write-Host "Checking for PDF file..." -ForegroundColor Yellow
$pdfPath = ".\test-transcripts\Initial Mental Health Session - Depression and Complicated Grief Following Paternal Loss.pdf"

if (Test-Path $pdfPath) {
    Write-Host "PDF file found!" -ForegroundColor Green
    Write-Host "Path: $pdfPath" -ForegroundColor Cyan
} else {
    Write-Host "PDF file not found at: $pdfPath" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Get patient ID from Supabase database" -ForegroundColor White
Write-Host "2. Run this SQL: SELECT id FROM Patient WHERE firstName = 'John'" -ForegroundColor White
Write-Host "3. Use the curl command I'll show you next" -ForegroundColor White

Write-Host ""
Write-Host "Ready for API testing!" -ForegroundColor Green