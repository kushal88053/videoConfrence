@echo off

:: Set environment variables from .env file
for /f "usebackq tokens=1,2 delims==" %%a in (integrations\.env) do (
  set %%a=%%b
)

:: Start the server using ts-node-dev
node_modules\.bin\ts-node-dev src\index.ts
