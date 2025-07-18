# PowerShell script to test EHR API endpoints
# Run this from your project directory

Write-Host "🔍 Testing EHR API Endpoints" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green

# Check if server is running
Write-Host "`n📡 Checking if server is running..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/guest" -Method POST -ContentType "application/json"
    Write-Host "✅ Server is running!" -ForegroundColor Green
    Write-Host "Guest token: $($response.token)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Server not running! Please start with: pnpm dev" -ForegroundColor Red
    exit
}

# Test authentication
Write-Host "`n🔐 Testing authentication..." -ForegroundColor Yellow
try {
    $authResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/guest" -Method POST -ContentType "application/json"
    $token = $authResponse.token
    Write-Host "✅ Authentication successful!" -ForegroundColor Green
} catch {
    Write-Host "❌ Authentication failed!" -ForegroundColor Red
    exit
}

# Test PDF upload endpoint
Write-Host "`n📄 Testing PDF upload endpoint..." -ForegroundColor Yellow
$pdfPath = ".\test-transcripts\Initial Mental Health Session - Depression and Complicated Grief Following Paternal Loss.pdf"

if (Test-Path $pdfPath) {
    Write-Host "Found PDF file: $pdfPath" -ForegroundColor Cyan
    
    # Get John Doe patient ID (you'll need to replace this with actual patient ID)
    Write-Host "⚠️  You'll need to get the patient ID from your database first" -ForegroundColor Yellow
    Write-Host "Run this SQL in Supabase: SELECT id FROM `"Patient`" WHERE `"firstName`" = 'John'" -ForegroundColor Yellow
    
    # Example upload command (replace PATIENT_ID with actual ID)
    Write-Host "`n📤 Upload command (replace PATIENT_ID):" -ForegroundColor Yellow
    Write-Host "curl -X POST http://localhost:3000/api/ehr/transcripts/upload \\" -ForegroundColor White
    Write-Host "  -F 'file=@$pdfPath' \\" -ForegroundColor White
    Write-Host "  -F 'patientId=PATIENT_ID' \\" -ForegroundColor White
    Write-Host "  -F 'sessionDate=2024-01-15T10:00:00.000Z'" -ForegroundColor White
} else {
    Write-Host "❌ PDF file not found at: $pdfPath" -ForegroundColor Red
}

Write-Host "`n📋 Next steps:" -ForegroundColor Yellow
Write-Host "1. Make sure server is running: pnpm dev" -ForegroundColor White
Write-Host "2. Get patient ID from database" -ForegroundColor White
Write-Host "3. Use the curl commands above with real values" -ForegroundColor White