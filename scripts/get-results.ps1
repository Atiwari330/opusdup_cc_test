# Get analysis results for a transcript
param(
    [string]$TranscriptId = "4ad6978c-6a8a-43fd-bd4b-2721e7d2842a"
)

Write-Host "Getting Analysis Results" -ForegroundColor Green
Write-Host "Transcript ID: $TranscriptId" -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/ehr/transcripts/$TranscriptId/analyze" -Method GET
    
    Write-Host "SUCCESS! Found existing results:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}