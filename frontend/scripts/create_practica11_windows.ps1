<#
Create three local users (alumno1, alumno2, invitado) with the same password,
report their properties and write a JSON file named evidence_practica11_windows.json

Run as Administrator in PowerShell:
  .\create_practica11_windows.ps1 -Password "P@ssw0rd123"

This script requires Windows 10/11 and PowerShell with LocalAccounts module.
#>

param(
  [Parameter(Mandatory=$true)]
  [string]$Password
)

function Create-UserIfMissing {
  param($UserName, $FullName)
  $exists = Get-LocalUser -Name $UserName -ErrorAction SilentlyContinue
  if (-not $exists) {
    $secure = ConvertTo-SecureString $Password -AsPlainText -Force
    New-LocalUser -Name $UserName -FullName $FullName -Password $secure -Description "Práctica 11" | Out-Null
    Add-LocalGroupMember -Group "Users" -Member $UserName
  }
}

$users = @(
  @{ username = 'alumno1'; fullname = 'Alumno Uno' },
  @{ username = 'alumno2'; fullname = 'Alumno Dos' },
  @{ username = 'invitado'; fullname = 'Invitado' }
)

foreach ($u in $users) {
  Create-UserIfMissing -UserName $u.username -FullName $u.fullname
}

$results = @()
foreach ($u in $users) {
  $name = $u.username
  # Use net user to fetch last logon and password change info
  $net = (net user $name)
  $lastLogon = ''
  $pwdChange = ''
  foreach ($line in $net) {
    if ($line -match 'Last logon') { $lastLogon = $line.Split(':',2)[1].Trim() }
    if ($line -match 'Password last set') { $pwdChange = $line.Split(':',2)[1].Trim() }
  }
  $enabled = -not ((Get-LocalUser -Name $name).Enabled -eq $false)
  $groups = (Get-LocalGroupMember -Member $name -ErrorAction SilentlyContinue | ForEach-Object { $_.Group }) -join ", "
  if ([string]::IsNullOrEmpty($groups)) { $groups = 'Users' }

  $results += [pscustomobject]@{
    usuario = $name
    nombre_completo = $u.fullname
    habilitado = $enabled
    fecha_creacion = (Get-LocalUser -Name $name).WhenCreated.ToString("u")
    ultimo_inicio = $lastLogon
    grupos = $groups
    requiere_cambio_contrasena = $false
    raw_net_user = ($net -join "\n")
  }
}

$out = @{ generated_at = (Get-Date).ToString("u"); evidence = $results }
$json = $out | ConvertTo-Json -Depth 5
$json | Out-File -FilePath "evidence_practica11_windows.json" -Encoding UTF8

Write-Host "Evidence written to evidence_practica11_windows.json"
Write-Host "To disable a user: Disable-LocalUser -Name alumno2" -ForegroundColor Yellow
Write-Host "To enable a user: Enable-LocalUser -Name alumno2" -ForegroundColor Yellow
