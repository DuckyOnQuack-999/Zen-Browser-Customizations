#!/bin/bash

# Create icons directory if it doesn't exist
mkdir -p icons

# If you have ImageMagick installed, this will create placeholder icons
convert -size 48x48 xc:white -gravity center -draw "text 0,0 'ZID'" icons/icon-48.png
convert -size 96x96 xc:white -gravity center -draw "text 0,0 'ZID'" icons/icon-96.png 