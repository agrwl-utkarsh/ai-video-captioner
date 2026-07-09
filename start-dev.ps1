$Edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "Starting backend..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Root\backend'; py app.py"

Start-Sleep -Seconds 2

Write-Host "Starting frontend (opens in Edge)..."
$env:BROWSER = $Edge
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Root\frontend'; `$env:BROWSER='$Edge'; npm start"

Start-Sleep -Seconds 8
Start-Process $Edge "http://localhost:3000"
