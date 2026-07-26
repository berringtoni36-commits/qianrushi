import subprocess
result = subprocess.run(['powershell', '-Command', 
    'Get-Process | ForEach-Object { $p = $_; try { $p.Modules | Where-Object { $_.FileName -like "*SKILL*" -or $_.FileName -like "*project-learning*" } | ForEach-Object { Write-Host "$($p.Id) $($p.ProcessName) $($_.FileName)" } } catch {} }'],
    capture_output=True, text=True)
print(result.stdout)
print(result.stderr)
