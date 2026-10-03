@echo off
echo ===================================================
echo   Starting Workforce CRM Platform (Dev Mode)
echo ===================================================

start cmd /k "cd backend && python run.py"
start cmd /k "cd frontend && npm run dev"

echo.
echo Both servers are launching!
echo   - Backend API: http://localhost:8000
echo   - API Docs:    http://localhost:8000/api/v1/docs
echo   - Frontend UI: http://localhost:3000
echo.
echo Default Admin: admin@crm.com / admin123
echo ===================================================
pause
