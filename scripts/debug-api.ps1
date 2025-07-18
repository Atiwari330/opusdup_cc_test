# Debug script to check API endpoints
Write-Host "Debugging API Endpoints" -ForegroundColor Green
Write-Host "======================" -ForegroundColor Green

# Test different endpoints to see what's available
$endpoints = @(
    "http://localhost:3000/api/ehr/transcripts/upload",
    "http://localhost:3000/api/chat",
    "http://localhost:3000/api/document",
    "http://localhost:3000/api/files/upload"
)

foreach ($endpoint in $endpoints) {
    Write-Host "`nTesting: $endpoint" -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri $endpoint -Method GET -ErrorAction SilentlyContinue
        Write-Host "GET Status: $($response.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "GET Error: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
    
    try {
        $response = Invoke-WebRequest -Uri $endpoint -Method POST -ErrorAction SilentlyContinue
        Write-Host "POST Status: $($response.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "POST Error: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}

Write-Host "`nServer logs should show these requests in your terminal running 'pnpm dev'" -ForegroundColor Cyan