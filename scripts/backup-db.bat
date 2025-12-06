@echo off
REM Database backup script for Windows
REM Usage: scripts\backup-db.bat

set MONGO_URI=mongodb://localhost:27017/delhi_breathes
set BACKUP_DIR=db-backup-%date:~-4,4%%date:~-7,2%%date:~-10,2%%time:~0,2%%time:~3,2%%time:~6,2%
set BACKUP_DIR=%BACKUP_DIR: =0%

echo Creating database backup...
echo MongoDB URI: %MONGO_URI%
echo Backup directory: %BACKUP_DIR%

mongodump --uri="%MONGO_URI%" --out="%BACKUP_DIR%"

if %errorlevel% equ 0 (
  echo Backup created successfully at: %BACKUP_DIR%
  echo To restore: mongorestore --uri="%MONGO_URI%" %BACKUP_DIR%
) else (
  echo Backup failed!
  exit /b 1
)

