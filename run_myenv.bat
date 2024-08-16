@echo off

:: Activate virtual environment
echo Activating virtual environment...
call D:\Kubot-django\myenv\Scripts\activate

@REM :: Set environment variables
@REM echo Setting environment variables...
@REM set "DJANGO_SETTINGS_MODULE=accounts.settings"
@REM set "DATABASE_URL=postgres://myprojectuser:962002@localhost:5432/myprojectdb"

echo Environment setup complete.
