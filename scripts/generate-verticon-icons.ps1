Add-Type -AssemblyName System.Drawing

$srcVerticon = "C:\Users\dace8\.gemini\antigravity\brain\2ea5d555-0918-497d-87e0-84531f995982\crono_cash_verticon_1790283048449.jpg"
if (!(Test-Path $srcVerticon)) {
    $srcVerticon = "public\verticon-icon.jpg"
}

$densities = @{
    "mipmap-mdpi" = @{ icon = 48; fg = 108 }
    "mipmap-hdpi" = @{ icon = 72; fg = 162 }
    "mipmap-xhdpi" = @{ icon = 96; fg = 216 }
    "mipmap-xxhdpi" = @{ icon = 144; fg = 324 }
    "mipmap-xxxhdpi" = @{ icon = 192; fg = 432 }
}

$img = [System.Drawing.Image]::FromFile((Resolve-Path $srcVerticon))
$aspectRatio = $img.Width / $img.Height # ~0.6708

foreach ($folder in $densities.Keys) {
    $targetDir = "android\app\src\main\res\$folder"
    if (!(Test-Path $targetDir)) { New-Item -ItemType Directory -Path $targetDir -Force }
    
    $iconSize = $densities[$folder].icon
    $fgSize = $densities[$folder].fg
    
    # 1. ic_launcher.png (Tarjeta Verticons 2:3 centrada en lienzo cuadrado transparente)
    $bmp = New-Object System.Drawing.Bitmap $iconSize, $iconSize, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    
    $cardHeight = [math]::Round($iconSize * 0.94)
    $cardWidth = [math]::Round($cardHeight * $aspectRatio)
    $posX = [math]::Round(($iconSize - $cardWidth) / 2)
    $posY = [math]::Round(($iconSize - $cardHeight) / 2)
    
    $g.DrawImage($img, $posX, $posY, $cardWidth, $cardHeight)
    $g.Dispose()
    $bmp.Save("$targetDir\ic_launcher.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    
    # 2. ic_launcher_round.png (Tarjeta Verticons ajustada para máscara redonda con fondo oscuro #0B111E)
    $bmpRound = New-Object System.Drawing.Bitmap $iconSize, $iconSize, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $gRound = [System.Drawing.Graphics]::FromImage($bmpRound)
    $gRound.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gRound.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $gRound.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $gRound.Clear([System.Drawing.Color]::Transparent)
    
    # Fondo circular oscuro para no recortar la tarjeta en launchers redondos
    $darkBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml("#0B111E"))
    $gRound.FillEllipse($darkBrush, 0, 0, $iconSize, $iconSize)
    $darkBrush.Dispose()
    
    # Tarjeta ajustada dentro del diámetro
    $cardHeightRound = [math]::Round($iconSize * 0.84)
    $cardWidthRound = [math]::Round($cardHeightRound * $aspectRatio)
    $posXRound = [math]::Round(($iconSize - $cardWidthRound) / 2)
    $posYRound = [math]::Round(($iconSize - $cardHeightRound) / 2)
    
    $gRound.DrawImage($img, $posXRound, $posYRound, $cardWidthRound, $cardHeightRound)
    $gRound.Dispose()
    $bmpRound.Save("$targetDir\ic_launcher_round.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $bmpRound.Dispose()
    
    # 3. ic_launcher_foreground.png (Tarjeta Verticons en zona segura del 66% para Android Adaptive Icons)
    $bmpFg = New-Object System.Drawing.Bitmap $fgSize, $fgSize, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $gFg = [System.Drawing.Graphics]::FromImage($bmpFg)
    $gFg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gFg.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $gFg.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $gFg.Clear([System.Drawing.Color]::Transparent)
    
    $cardHeightFg = [math]::Round($fgSize * 0.64)
    $cardWidthFg = [math]::Round($cardHeightFg * $aspectRatio)
    $posXFg = [math]::Round(($fgSize - $cardWidthFg) / 2)
    $posYFg = [math]::Round(($fgSize - $cardHeightFg) / 2)
    
    $gFg.DrawImage($img, $posXFg, $posYFg, $cardWidthFg, $cardHeightFg)
    $gFg.Dispose()
    $bmpFg.Save("$targetDir\ic_launcher_foreground.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $bmpFg.Dispose()
    
    Write-Host "Generados iconos Verticons para $folder ($iconSize px, fg $fgSize px)"
}

$img.Dispose()
Write-Host "Generación de iconos Verticons completada exitosamente!"
