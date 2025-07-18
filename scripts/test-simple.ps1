# Simple test for all analyzers
param(
    [string]$TranscriptId = "4ad6978c-6a8a-43fd-bd4b-2721e7d2842a"
)

Write-Host "Testing All EHR Analyzers" -ForegroundColor Green
Write-Host "Transcript ID: $TranscriptId" -ForegroundColor Cyan

try {
    $body = '{"analysisTypes":["soap_note","cpt_codes","icd_codes"]}'
    
    Write-Host "Starting analysis..." -ForegroundColor Yellow
    
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/ehr/transcripts/$TranscriptId/analyze" -Method POST -Body $body -ContentType "application/json"
    
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host "Results:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 5
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}