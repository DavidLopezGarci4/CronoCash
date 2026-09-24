Add-Type -AssemblyName System.Drawing

$srcLogo = "C:\Users\dace8\.gemini\antigravity\brain\2ea5d555-0918-497d-87e0-84531f995982\app_logo_concept_1790256823876.jpg"
if (!(Test-Path $srcLogo)) {
    $srcLogo = "public\logo.jpg"
}

$densities = @{
    "mipmap-mdpi" = @{ icon = 48; fg = 108 }
    "mipmap-hdpi" = @{ icon = 72; fg = 162 }
    "mipmap-xhdpi" = @{ icon = 96; fg = 216 }
    "mipmap-xxhdpi" = @{ icon = 144; fg = 324 }
    "mipmap-xxxhdpi" = @{ icon = 192; fg = 432 }
}

$img = [System.Drawing.Image]::FromFile((Resolve-Path $srcLogo))

foreach ($folder in $densities.Keys) {
    $targetDir = "android\app\src\main\res\$folder"
    if (!(Test-Path $targetDir)) { New-Item -ItemType Directory -Path $targetDir -Force }
    
    $iconSize = $densities[$folder].icon
    $fgSize = $densities[$folder].fg
    
    # 1. ic_launcher.png y ic_launcher_round.png
    $bmp = New-Object System.Drawing.Bitmap $iconSize, $iconSize
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($img, 0, 0, $iconSize, $iconSize)
    $g.Dispose()
    $bmp.Save("$targetDir\ic_launcher.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Save("$targetDir\ic_launcher_round.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    
    # 2. ic_launcher_foreground.png
    $bmpFg = New-Object System.Drawing.Bitmap $fgSize, $fgSize
    $gFg = [System.Drawing.Graphics]::FromImage($bmpFg)
    $gFg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gFg.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $gFg.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    
    $pad = [math]::Round($fgSize * 0.16)
    $drawSize = $fgSize - (2 * $pad)
    $gFg.DrawImage($img, $pad, $pad, $drawSize, $drawSize)
    $gFg.Dispose()
    $bmpFg.Save("$targetDir\ic_launcher_foreground.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $bmpFg.Dispose()
    
    Write-Host "Restaurados iconos estándar para $folder"
}

$img.Dispose()
Write-Host "Restauración de iconos estándar completada exitosamente!"
