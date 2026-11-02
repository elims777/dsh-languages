<#
.SYNOPSIS
  Installs the dsh-locale-ru language pack into a DeepSeek Harness profile.

.DESCRIPTION
  Copies the package into <DSH_HOME>/profiles/<profile>/node_modules and adds it
  to the profile's `dsh.profile.bundles` list, which is what makes the app load
  the bundle patch. Works without pnpm and without network access.

.PARAMETER Source
  Folder with the package (default: this script's folder).

.PARAMETER Profile
  Profile name to install into (default: desktop).

.PARAMETER DshHome
  Harness home (default: %USERPROFILE%\.dsh).

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File install.ps1
#>
param(
  [string]$Source = $PSScriptRoot,
  [string]$Profile = 'desktop',
  [string]$DshHome = (Join-Path $env:USERPROFILE '.dsh')
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path (Join-Path $Source 'package.json'))) {
  throw "package.json not found in '$Source'. Run the script from the package folder or pass -Source."
}
if (-not (Test-Path (Join-Path $Source 'cordis.patch.yml'))) {
  throw "cordis.patch.yml not found in '$Source' - this is not the dsh-locale-ru package."
}

$profileDir = Join-Path $DshHome "profiles\$Profile"
$manifestPath = Join-Path $profileDir 'package.json'
if (-not (Test-Path $manifestPath)) {
  throw "Profile '$Profile' not found: $manifestPath. Pass -Profile <name> or -DshHome <path>."
}

$target = Join-Path $profileDir 'node_modules\dsh-locale-ru'
$targetFull = [System.IO.Path]::GetFullPath($target)
$sourceFull = [System.IO.Path]::GetFullPath($Source)
if ($sourceFull -ne $targetFull) {
  New-Item -ItemType Directory -Force (Split-Path $target) | Out-Null
  if (Test-Path $target) {
    # Keep the folder (it may be a junction) but refresh its contents.
    Get-ChildItem $target -Force | Where-Object { $_.Name -ne '.git' } |
      Remove-Item -Recurse -Force
  } else {
    New-Item -ItemType Directory -Force $target | Out-Null
  }
  Get-ChildItem $sourceFull -Force |
    Where-Object { $_.Name -notin @('.git', 'dist', '.npm-cache', 'node_modules') } |
    Copy-Item -Destination $target -Recurse -Force
}

# Add the bundle to the profile manifest without disturbing the rest of it.
$json = Get-Content $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
if ($null -eq $json.dsh) { $json | Add-Member -NotePropertyName dsh -NotePropertyValue ([pscustomobject]@{}) }
if ($null -eq $json.dsh.profile) { $json.dsh | Add-Member -NotePropertyName profile -NotePropertyValue ([pscustomobject]@{}) }
if ($null -eq $json.dsh.profile.bundles) {
  $json.dsh.profile | Add-Member -NotePropertyName bundles -NotePropertyValue @()
}

$bundles = @($json.dsh.profile.bundles)
if ($bundles -notcontains 'dsh-locale-ru') {
  $json.dsh.profile.bundles = @($bundles + 'dsh-locale-ru')
}

if ($null -eq $json.dependencies) {
  $json | Add-Member -NotePropertyName dependencies -NotePropertyValue ([pscustomobject]@{})
}
if (-not $json.dependencies.PSObject.Properties['dsh-locale-ru']) {
  $json.dependencies | Add-Member -NotePropertyName 'dsh-locale-ru' -NotePropertyValue "file:$target"
}

$utf8 = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($manifestPath, ($json | ConvertTo-Json -Depth 20), $utf8)

Write-Host "Installed into: $target" -ForegroundColor Green
Write-Host 'Restart DeepSeek Harness, then open Settings -> General -> Language -> Russian.'
