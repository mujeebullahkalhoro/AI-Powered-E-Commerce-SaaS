@echo off
setlocal

set MONGOD="C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe"
set DBPATH=%~dp0..\data\db
set LOGPATH=%~dp0..\data\mongod.log

if not exist "%DBPATH%" mkdir "%DBPATH%"

echo Starting local MongoDB replica set on port 27018...
%MONGOD% --port 27018 --bind_ip 127.0.0.1 --dbpath "%DBPATH%" --logpath "%LOGPATH%" --replSet rs0
