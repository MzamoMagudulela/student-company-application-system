# Mzamo's Youth Development Company - Server Startup Script
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "MZAMO'S YOUTH DEVELOPMENT COMPANY" -ForegroundColor Cyan
Write-Host "Student Company Application System — Enterprise Edition" -ForegroundColor Cyan
Write-Host "Creator & Developer: Mzamo Sandile Magudulela (ICT Student)" -ForegroundColor Cyan
Write-Host "Tagline: Your Skills. Your Opportunity. Your Future." -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Start Backend FastAPI Server
Write-Host "Starting FastAPI Backend Server on http://127.0.0.1:8000..." -ForegroundColor Green
$backendProcess = Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "`$env:PYTHONPATH='.'; .\backend\venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload" -PassThru

# Start Frontend Vite Server
Write-Host "Starting Vite React Frontend on http://localhost:5173..." -ForegroundColor Green
$frontendProcess = Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev" -PassThru

Write-Host "`nBoth servers are running in separate terminal windows." -ForegroundColor Yellow
Write-Host "Backend API Docs: http://127.0.0.1:8000/docs" -ForegroundColor Yellow
Write-Host "Frontend Portal:  http://localhost:5173" -ForegroundColor Yellow
Write-Host "Default Admin:   admin@mydc.org.za / MzamoAdmin2026!" -ForegroundColor Yellow
