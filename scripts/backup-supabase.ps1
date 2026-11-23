param(
    [string]$ProjectRef = "cmkroryimxskgqlaiiym",
    [string]$OutputRoot = ""
)

$ErrorActionPreference = "Stop"

function Assert-Command {
    param([string]$Name)
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Required command '$Name' was not found. Install the Supabase CLI first: https://supabase.com/docs/guides/local-development/cli/getting-started"
    }
}

Assert-Command -Name "supabase"

if ([string]::IsNullOrWhiteSpace($OutputRoot)) {
    $repoRoot = Split-Path -Parent $PSScriptRoot
    $OutputRoot = Join-Path $repoRoot "backups"
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDir = Join-Path $OutputRoot "nexus-$stamp"
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

$schemaFile = Join-Path $backupDir "schema-public-private.sql"
$dataFile = Join-Path $backupDir "data-public-private.sql"
$rolesFile = Join-Path $backupDir "custom-roles.sql"
$manifestFile = Join-Path $backupDir "BACKUP-MANIFEST.txt"

Write-Host "Davonium Nexus manual backup"
Write-Host "Project: $ProjectRef"
Write-Host "Destination: $backupDir"
Write-Host ""
Write-Warning "This backup contains company data. Keep this folder private and never commit it to Git."
Write-Warning "Supabase CLI dumps exclude managed auth/storage/extension schemas. This script does not back up Auth users or Storage file contents."
Write-Host ""

# Schema and policies/functions in the custom application schemas.
& supabase db dump "--remote=$ProjectRef" "--schema=public,private" "--file=$schemaFile"
if ($LASTEXITCODE -ne 0) { throw "Schema backup failed with exit code $LASTEXITCODE." }

# Application data in the same custom schemas. Use COPY to keep large backups compact.
& supabase db dump "--remote=$ProjectRef" "--schema=public,private" "--data-only" "--use-copy" "--file=$dataFile"
if ($LASTEXITCODE -ne 0) { throw "Data backup failed with exit code $LASTEXITCODE." }

# Custom roles are exported separately by the CLI.
& supabase db dump "--remote=$ProjectRef" "--role-only" "--file=$rolesFile"
if ($LASTEXITCODE -ne 0) { throw "Role backup failed with exit code $LASTEXITCODE." }

@(
    "Davonium Nexus manual backup"
    "Project reference: $ProjectRef"
    "Created locally: $((Get-Date).ToString('o'))"
    "Schema: schema-public-private.sql"
    "Data: data-public-private.sql"
    "Roles: custom-roles.sql"
    ""
    "Scope notes:"
    "- Includes custom public/private schema definitions and their data."
    "- Includes custom database roles."
    "- Supabase-managed auth, storage and extension schemas are excluded by the CLI."
    "- This does not download Storage file objects."
    "- This is not a point-in-time recovery backup."
    "- Store this folder securely and keep a second encrypted copy off this computer."
) | Set-Content -Path $manifestFile -Encoding UTF8

Write-Host ""
Write-Host "Backup completed: $backupDir" -ForegroundColor Green
Write-Host "Review the manifest and copy the backup to a secure, separate location."
