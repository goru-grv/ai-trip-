# Makefile for AI Trip Planner (Velora)
# Designed for Windows PowerShell / Command Prompt / Bash compatibility

.PHONY: run-frontend run-backend install-frontend install-backend run-all setup help

help:
	@echo =================================================================
	@echo                      VELORA AI TRIP PLANNER                      
	@echo =================================================================
	@echo Available commands:
	@echo   make setup            - Initialize virtual environment and install all deps
	@echo   make install-frontend - Install npm packages for frontend
	@echo   make install-backend  - Install pip packages for python backend
	@echo   make run-frontend     - Start the React frontend server
	@echo   make run-backend      - Start the FastAPI python backend server
	@echo   make run-all          - Run both Frontend and Backend concurrently
	@echo =================================================================

setup: install-frontend install-backend
	@echo Setup complete! Run 'make run-all' to start the application.

install-frontend:
	@echo Installing frontend dependencies...
	cd frontend && npm install

install-backend:
	@echo Setting up backend virtual environment...
	cd backend && python -m venv venv
	@echo Installing backend dependencies...
	cd backend && venv\Scripts\pip install -r requirements.txt

run-frontend:
	@echo Starting frontend dev server...
	cd frontend && npm run dev

run-backend:
	@echo Starting FastAPI backend server...
	cd backend && venv\Scripts\python -m uvicorn main:app --reload --port 8000

run-all:
	@echo Spawning Frontend and Backend servers in concurrent sessions...
	powershell -Command "Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd frontend; npm run dev' -Title 'Velora Frontend'"
	powershell -Command "Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd backend; venv\Scripts\python -m uvicorn main:app --reload --port 8000' -Title 'Velora Backend'"
	@echo Both servers have been spawned in separate terminal windows!
