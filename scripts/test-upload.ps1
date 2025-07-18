# PowerShell script to test PDF upload
param(
    [string]$PatientId = "99f7c236-be47-437e-87e9-b3d2ff574c34"
)

Write-Host "Testing PDF Upload to EHR API" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green

$pdfPath = ".\test-transcripts\Initial Mental Health Session - Depression and Complicated Grief Following Paternal Loss.pdf"

if (-not (Test-Path $pdfPath)) {
    Write-Host "PDF file not found at: $pdfPath" -ForegroundColor Red
    exit
}

Write-Host "PDF file found: $pdfPath" -ForegroundColor Cyan
Write-Host "Patient ID: $PatientId" -ForegroundColor Cyan

try {
    # Create the multipart form data
    $boundary = [System.Guid]::NewGuid().ToString()
    $LF = "`r`n"
    
    # Read the PDF file
    $pdfBytes = [System.IO.File]::ReadAllBytes($pdfPath)
    $pdfContent = [System.Text.Encoding]::GetEncoding("iso-8859-1").GetString($pdfBytes)
    
    $bodyLines = @(
        "--$boundary",
        "Content-Disposition: form-data; name=`"file`"; filename=`"transcript.pdf`"",
        "Content-Type: application/pdf",
        "",
        $pdfContent,
        "--$boundary",
        "Content-Disposition: form-data; name=`"patientId`"",
        "",
        $PatientId,
        "--$boundary",
        "Content-Disposition: form-data; name=`"sessionDate`"",
        "",
        "2024-01-15T10:00:00.000Z",
        "--$boundary--"
    )
    
    $body = $bodyLines -join $LF
    
    Write-Host "Uploading PDF..." -ForegroundColor Yellow
    
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/ehr/transcripts/upload" -Method POST -Body $body -ContentType "multipart/form-data; boundary=$boundary"
    
    Write-Host "Upload successful!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 10
    
    # Store transcript ID for analysis
    $transcriptId = $response.transcript.id
    Write-Host "Transcript ID: $transcriptId" -ForegroundColor Yellow
    
    # Test analysis
    Write-Host "`nTesting SOAP analysis..." -ForegroundColor Yellow
    $analysisBody = @{
        analysisTypes = @("soap_note")
    } | ConvertTo-Json
    
    $analysisResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/ehr/transcripts/$transcriptId/analyze" -Method POST -Body $analysisBody -ContentType "application/json"
    
    Write-Host "Analysis successful!" -ForegroundColor Green
    Write-Host "Analysis Response:" -ForegroundColor Cyan
    $analysisResponse | ConvertTo-Json -Depth 10
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Full error:" -ForegroundColor Red
    $_.Exception | Format-List -Force
}