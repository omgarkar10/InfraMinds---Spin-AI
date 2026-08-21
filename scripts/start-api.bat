@echo off
set PYTHONPATH=%~dp0..\backend
cd /d %~dp0..\backend
python -m uvicorn spin_agents.api:app --host 0.0.0.0 --port 8080 --reload
