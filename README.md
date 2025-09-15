


























# Zen Browser Image Downloader Extension

A Firefox-based browser extension for Zen Browser that allows you to easily download all images from web pages with one click.

## Features

- Download all images from the current webpage
- Filter images by size and type
- Preview images before downloading
- Progress tracking for downloads
- Support for both regular images and background images
- Duplicate image detection
- Customizable filename patterns

## Installation

1. Go to `about:config` in Zen Browser
2. Set `xpinstall.signatures.required` to `false`
3. Go to `about:addons`
4. Click the gear icon (⚙️)
5. Choose "Install Add-on From File"
6. Select the `zen-image-downloader.xpi` file

## Development

To build the extension:

```bash
# On Unix-like systems
chmod +x build.sh
./build.sh

# On Windows
.\build.ps1
```

## Directory Structure

```
zen-image-downloader/
├── manifest.json        # Extension configuration
├── background.js       # Background script for downloads
├── content.js         # Content script for image scanning
├── popup/            # Popup UI files
│   ├── popup.html   # Popup layout
│   ├── popup.css    # Popup styles
│   └── popup.js     # Popup functionality
└── icons/           # Extension icons
    ├── icon-48.png
    └── icon-96.png
```

## License

MIT License

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request
