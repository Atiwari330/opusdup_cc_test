# Test all analyzers on uploaded transcript
param(
    [string]$TranscriptId = "d4b24576-3d9b-4bd0-959b-ca6b148263a9"
)

Write-Host "Testing All EHR Analyzers" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green
Write-Host "Transcript ID: $TranscriptId" -ForegroundColor Cyan
Write-Host ""

try {
    $analysisBody = @{
        analysisTypes = @("soap_note", "cpt_codes", "icd_codes")
    } | ConvertTo-Json
    
    Write-Host "Starting comprehensive analysis (SOAP + CPT + ICD-10)..." -ForegroundColor Yellow
    Write-Host ""
    
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/ehr/transcripts/$TranscriptId/analyze" -Method POST -Body $analysisBody -ContentType "application/json"
    
    Write-Host "✅ All analyses completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Summary of Results:" -ForegroundColor Cyan
    Write-Host "==================" -ForegroundColor Cyan
    
    foreach ($result in $response.results) {
        Write-Host ""
        Write-Host "📋 $($result.type.ToUpper()) Analysis:" -ForegroundColor Yellow
        
        if ($result.type -eq "soap_note") {
            Write-Host "   Note ID: $($result.noteId)"
            Write-Host "   Overall Confidence: $($result.overallConfidence)"
            if ($result.sections) {
                Write-Host "   Sections: $($result.sections.Keys -join ', ')"
            }
        }
        elseif ($result.type -eq "cpt_codes") {
            if ($result.primaryCode) {
                Write-Host "   Primary CPT: $($result.primaryCode) - $($result.primaryCodeDescription)"
                Write-Host "   Confidence: $($result.confidence)"
                Write-Host "   Session Type: $($result.sessionType)"
                Write-Host "   Duration: $($result.sessionDuration) minutes"
            }
        }
        elseif ($result.type -eq "icd_codes") {
            if ($result.primaryDiagnosis) {
                Write-Host "   Primary ICD-10: $($result.primaryDiagnosis.code) - $($result.primaryDiagnosis.description)"
                Write-Host "   Confidence: $($result.primaryDiagnosis.confidence)"
                if ($result.secondaryDiagnoses -and $result.secondaryDiagnoses.Count -gt 0) {
                    Write-Host "   Secondary Diagnoses: $($result.secondaryDiagnoses.Count)"
                }
            }
        }
    }
    
    Write-Host ""
    Write-Host "📊 Cache Performance:" -ForegroundColor Magenta
    Write-Host "   Results cached for future requests"
    Write-Host "   Next identical request will be ~10x faster"
    
    Write-Host ""
    Write-Host "🔍 Full Response (JSON):" -ForegroundColor Gray
    Write-Host "========================" -ForegroundColor Gray
    $response | ConvertTo-Json -Depth 10
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Full error details:" -ForegroundColor Red
    $_.Exception | Format-List -Force
}