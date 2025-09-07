let downloadQueue = [];
let currentDownload = 0;
let downloadStats = {
    success: 0,
    failed: 0,
    total: 0
};

function updateBadge() {
    browser.browserAction.setBadgeText({
        text: downloadStats.success.toString()
    });
    browser.browserAction.setBadgeBackgroundColor({
        color: '#4CAF50'
    });
}

function getUniqueFilename(filename, subdirectory) {
    const base = filename.substring(0, filename.lastIndexOf('.'));
    const ext = filename.substring(filename.lastIndexOf('.'));
    const path = subdirectory ? `${subdirectory}/${filename}` : filename;
    let counter = 1;
    let newPath = path;
    
    while (downloadQueue.some(item => item.filename === newPath)) {
        newPath = subdirectory ? 
            `${subdirectory}/${base}_${counter}${ext}` : 
            `${base}_${counter}${ext}`;
        counter++;
    }
    
    return newPath;
}

browser.runtime.onMessage.addListener((message, sender) => {
if (message.type === 'FOUND_IMAGES') {
    downloadQueue = message.images;
    currentDownload = 0;
    startDownloading();
    return true;
}
});

async function convertImage(imageData, format, quality) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            canvas.toBlob(
                blob => resolve(URL.createObjectURL(blob)),
                `image/${format}`,
                quality / 100
            );
        };
        img.onerror = reject;
        img.src = imageData;
    });
}

function startDownloading() {
if (currentDownload >= downloadQueue.length) {
    browser.runtime.sendMessage({
    type: 'DOWNLOAD_COMPLETE'
    });
    return;
}

const image = downloadQueue[currentDownload];

browser.downloads.download({
    url: image.url,
    filename: image.filename,
    saveAs: false
}).then(() => {
    currentDownload++;
    browser.runtime.sendMessage({
    type: 'DOWNLOAD_PROGRESS',
    current: currentDownload,
    total: downloadQueue.length
    });
    startDownloading();
}).catch(error => {
    console.error('Download failed:', error);
    currentDownload++;
    startDownloading();
});
}

