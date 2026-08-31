# Prepares the /designs folder for the site. Run from the repo root:
#
#     powershell -ExecutionPolicy Bypass -File tools\prepare-designs.ps1
#
# Does two things, both safe to re-run:
#   1. Builds a lightweight grid thumbnail for every template in /designs.
#   2. Writes designs/manifest.json listing what artwork actually exists, so the
#      site can show the "no signal" placeholder without firing 404s at the server.
#
# The site works without this script — it falls back to trying the image and
# reacting to the error. Running it just makes the catalogue faster and quieter.

Add-Type -AssemblyName System.Drawing

$root   = Split-Path $PSScriptRoot -Parent
$srcDir = Join-Path $root 'designs'
$outDir = Join-Path $srcDir 'thumbs'
$maxW   = 320

if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

$built = 0; $skipped = 0
$designFiles = @(); $thumbFiles = @()

Get-ChildItem -Path $srcDir -Filter '*.png' -File | ForEach-Object {
  $designFiles += $_.Name
  $out = Join-Path $outDir $_.Name

  if ((Test-Path $out) -and ((Get-Item $out).LastWriteTime -ge $_.LastWriteTime)) {
    $skipped++; $thumbFiles += $_.Name; return
  }

  $src = [System.Drawing.Bitmap]::FromFile($_.FullName)
  $w = $maxW
  $h = [int][Math]::Round($src.Height * ($maxW / $src.Width))
  $dst = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($dst)
  $g.CompositingMode   = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode   = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.DrawImage($src, 0, 0, $w, $h)
  $g.Dispose()
  $dst.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
  $dst.Dispose(); $src.Dispose()
  $built++; $thumbFiles += $_.Name
}

$manifest = [ordered]@{
  generated = (Get-Date).ToString('yyyy-MM-ddTHH:mm:ssK')
  note      = 'Written by tools/prepare-designs.ps1. Lists artwork present in /designs.'
  designs   = @($designFiles | Sort-Object)
  thumbs    = @($thumbFiles  | Sort-Object)
}
$json = $manifest | ConvertTo-Json -Depth 4
# plain UTF-8, no BOM — keeps the file clean for any JSON reader
[System.IO.File]::WriteAllText((Join-Path $srcDir 'manifest.json'), $json, (New-Object System.Text.UTF8Encoding($false)))

Write-Output "thumbs:   $built built, $skipped up to date"
Write-Output "manifest: $($designFiles.Count) templates listed -> designs\manifest.json"
