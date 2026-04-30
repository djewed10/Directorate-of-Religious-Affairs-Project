param(
  [switch]$InstallOnly
)

Write-Host "Installing backend dependencies..."
Push-Location backend
npm install
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
Pop-Location

Write-Host "Installing mobile dependencies..."
Push-Location mobile
npm install
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
Pop-Location

if (-not $InstallOnly) {
  Write-Host "Start PostgreSQL and MinIO with: docker compose up -d"
  Write-Host "Then run:"
  Write-Host "  cd backend; npm run db:migrate; npm run db:seed; npm run start:dev"
  Write-Host "  cd mobile; npm run web"
}

