# Remove existing zip/xpi if they exist
Remove-Item -Path "zen-image-downloader.zip" -ErrorAction SilentlyContinue
Remove-Item -Path "zen-image-downloader.xpi" -ErrorAction SilentlyContinue

# Create zip file
Compress-Archive -Path "manifest.json", "background.js", "content.js", "popup", "icons" -DestinationPath "zen-image-downloader.zip"

# Rename to xpi
Rename-Item -Path "zen-image-downloader.zip" -NewName "zen-image-downloader.xpi" 