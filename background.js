let downloadQueue = [];
let currentDownload = 0;
let downloadStats = {
    success: 0,
    failed: 0,
    total: 0
};

// Initialize badge
browser.browserAction.setBadgeBackgroundColor({ color: '#4CAF50' });

function updateBadge() {
    browser.browserAction.setBadgeText({
        text: downloadStats.success.toString()
    });
}

function getUniqueFilename(filename, saveLocation = '') {
    const base = filename.substring(0, filename.lastIndexOf('.'));
    const ext = filename.substring(filename.lastIndexOf('.'));
    const path = saveLocation ? `${saveLocation}/${filename}` : filename;
    let counter = 1;
    let newPath = path;
    
    while (downloadQueue.some(item => item.filename === newPath)) {
        newPath = saveLocation ? 
            `${saveLocation}/${base}_${counter}${ext}` : 
            `${base}_${counter}${ext}`;
        counter++;
    }
    
    return newPath;
}

function formatFilename(pattern, index, url, options = {}) {
    const date = new Date();
    const ext = url.split('.').pop().split('?')[0];
    
    return pattern
        .replace('{n}', String(index).padStart(3, '0'))
        .replace('{date}', date.toISOString().split('T')[0])
        .replace('{time}', date.toTimeString().split(' ')[0].replace(/:/g, '-'))
        .replace('{type}', ext)
        + '.' + ext;
}

async function processImage(imageUrl, quality) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            canvas.toBlob(
                blob => resolve(URL.createObjectURL(blob)),
                'image/jpeg',
                quality / 100
            );
        };
        
        img.onerror = reject;
        img.src = imageUrl;
    });
}

async function downloadImage(image, index, options) {
    try {
        let url = image.url;
        
        // Process image if quality is specified
        if (options.quality && options.quality < 100) {
            url = await processImage(image.url, options.quality);
        }
        
        // Generate filename using pattern
        const filename = formatFilename(
            options.filenamePattern || 'image_{n}',
            index + 1,
            image.url,
            options
        );
        
        // Add save location if specified
        const fullPath = options.saveLocation ? 
            `${options.saveLocation}/${filename}` : 
            filename;
        
        await browser.downloads.download({
            url: url,
            filename: fullPath,
            saveAs: false
        });
        
        downloadStats.success++;
        updateBadge();
        
        // Cleanup if we created an object URL
        if (url !== image.url) {
            URL.revokeObjectURL(url);
        }
        
        return true;
    } catch (error) {
        console.error('Download failed:', error);
        downloadStats.failed++;
        return false;
    }
}

async function startDownloading(images, options = {}) {
    downloadQueue = images;
    downloadStats = { success: 0, failed: 0, total: images.length };
    currentDownload = 0;
    
    for (let i = 0; i < images.length; i++) {
        await downloadImage(images[i], i, options);
        currentDownload++;
        
        browser.runtime.sendMessage({
            type: 'DOWNLOAD_PROGRESS',
            current: currentDownload,
            total: images.length
        });
    }
    
    browser.runtime.sendMessage({
        type: 'DOWNLOAD_COMPLETE',
        stats: downloadStats
    });
}

browser.runtime.onMessage.addListener((message, sender) => {
    if (message.type === 'START_DOWNLOAD') {
        startDownloading(message.images, message.options);
        return true;
    }
    return false;
});

