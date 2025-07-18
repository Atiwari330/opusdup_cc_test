# Test ICD-10 code analysis on uploaded transcript
param(
    [string]$TranscriptId = "d4b24576-3d9b-4bd0-959b-ca6b148263a9"
)

Write-Host "Testing ICD-10 Code Analysis" -ForegroundColor Green
Write-Host "============================" -ForegroundColor Green
Write-Host "Transcript ID: $TranscriptId" -ForegroundColor Cyan

try {
    $analysisBody = @{
        analysisTypes = @("icd_codes")
    } | ConvertTo-Json
    
    Write-Host "Starting ICD-10 code analysis..." -ForegroundColor Yellow
    
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/ehr/transcripts/$TranscriptId/analyze" -Method POST -Body $analysisBody -ContentType "application/json"
    
    Write-Host "ICD-10 Analysis successful!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 10
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Full error:" -ForegroundColor Red
    $_.Exception | Format-List -Force
}