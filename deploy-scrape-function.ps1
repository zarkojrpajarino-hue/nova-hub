# 🚀 Script PowerShell para desplegar scrape-and-extract Edge Function
# Ejecutar: .\deploy-scrape-function.ps1

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "🚀 Desplegando scrape-and-extract" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar directorio
if (-Not (Test-Path "supabase\functions\scrape-and-extract")) {
    Write-Host "❌ Error: No se encuentra supabase\functions\scrape-and-extract" -ForegroundColor Red
    Write-Host "Asegúrate de estar en el directorio raíz del proyecto (nova-hub)" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Directorio encontrado" -ForegroundColor Green
Write-Host ""

# 2. Verificar Supabase CLI
try {
    $null = Get-Command supabase -ErrorAction Stop
    Write-Host "✅ Supabase CLI instalado" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Error: Supabase CLI no está instalado" -ForegroundColor Red
    Write-Host "Instala con: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# 3. Verificar login
Write-Host "🔐 Verificando autenticación..." -ForegroundColor Yellow
try {
    $projects = supabase projects list 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Not authenticated"
    }
    Write-Host "✅ Autenticado correctamente" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ No estás logueado en Supabase" -ForegroundColor Red
    Write-Host "Ejecuta: supabase login" -ForegroundColor Yellow
    exit 1
}

# 4. Desplegar función
Write-Host "📦 Desplegando función scrape-and-extract..." -ForegroundColor Yellow
Write-Host ""

supabase functions deploy scrape-and-extract --no-verify-jwt

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "======================================" -ForegroundColor Green
    Write-Host "✅ ¡FUNCIÓN DESPLEGADA CON ÉXITO!" -ForegroundColor Green
    Write-Host "======================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 PRÓXIMOS PASOS:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Configura tu ANTHROPIC_API_KEY:" -ForegroundColor White
    Write-Host "   supabase secrets set ANTHROPIC_API_KEY=sk-ant-xxx" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "2. O desde la UI:" -ForegroundColor White
    Write-Host "   https://supabase.com/dashboard/project/_/settings/functions" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "3. Verifica que funciona:" -ForegroundColor White
    Write-Host "   supabase functions logs scrape-and-extract --follow" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Error al desplegar función" -ForegroundColor Red
    Write-Host "Revisa los logs arriba para más detalles" -ForegroundColor Red
    exit 1
}
