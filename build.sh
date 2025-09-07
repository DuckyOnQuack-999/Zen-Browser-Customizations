#!/bin/bash

# Clean up any existing builds
rm -f zen-image-downloader.zip zen-image-downloader.xpi

# Create a clean build directory
rm -rf build
mkdir -p build/extension

# Copy files to build directory with proper structure
cp manifest.json background.js content.js build/extension/
cp -r popup icons build/extension/

# Set proper file permissions
find build/extension -type f -exec chmod 644 {} \;
find build/extension -type d -exec chmod 755 {} \;

# Create XPI file
cd build/extension
zip -r ../../zen-image-downloader.xpi *

# Clean up
cd ../..
rm -rf build

echo "Build complete! The extension is in zen-image-downloader.xpi" 