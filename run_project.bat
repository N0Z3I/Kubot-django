@echo off

:: รัน Backend ด้วย myenv.bat
start cmd /k "call run_myenv.bat && cd D:\Github\Kubot-django\myproject && python manage.py runserver"

:: รัน Frontend
start cmd /k "cd D:\Github\Kubot-django\myproject\frontend && npm run dev"