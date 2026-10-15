# TermsClarity - Packaging Script for Chrome Web Store Deployment
# Creates a clean release zip file ready for upload to the Chrome Web Store Developer Dashboard.

$outputZip = "terms-clarity-v1.0.0.zip"

if (Test-Path $outputZip) {
    Remove-Item $outputZip -Force
}

Write-Host "Packaging TermsClarity Chrome Extension..." -ForegroundColor Cyan

$filesToInclude = @(
    "manifest.json",
    "popup",
    "scripts",
    "icons",
    "README.md"
)

Compress-Archive -Path $filesToInclude -DestinationPath $outputZip -Force

if (Test-Path $outputZip) {
    $size = (Get-Item $outputZip).Length / 1KB
    Write-Host "Success! Created $outputZip ($([math]::Round($size, 2)) KB)" -ForegroundColor Green
    Write-Host "You can now upload this zip file directly to the Chrome Web Store Developer Dashboard." -ForegroundColor Yellow
} else {
    Write-Host "Error: Failed to create zip package." -ForegroundColor Red
}
