// Cache for processed images
const imageCache = new Map();

// URL validation and sanitization
function isValidImageUrl(url) {
    try {
        const parsedUrl = new URL(url);
        return ['http:', 'https:'].includes(parsedUrl.protocol) &&
               !parsedUrl.href.includes('javascript:') &&
               /\.(jpg|jpeg|png|gif|webp)$/i.test(parsedUrl.pathname);
    } catch {
        return false;
    }
}

function sanitizeFilename(filename) {
    return filename
        .replace(/[^a-zA-Z0-9-_\.]/g, '_')
        .replace(/_{2,}/g, '_')
        .substring(0, 255);
}

// Image processing worker
const imageWorker = new Worker(URL.createObjectURL(new Blob([`
    self.onmessage = async function(e) {
        const { imageUrl, maxSize, quality } = e.data;
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const bitmap = await createImageBitmap(blob);
            
            const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
            const ctx = canvas.getContext('2d');
            
            // Scale down large images
            const scale = maxSize ? Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height)) : 1;
            canvas.width = bitmap.width * scale;
            canvas.height = bitmap.height * scale;
            
            ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
            const processedBlob = await canvas.convertToBlob({
                type: 'image/jpeg',
                quality: quality / 100
            });
            
            self.postMessage({
                success: true,
                data: await processedBlob.arrayBuffer(),
                width: canvas.width,
                height: canvas.height
            });
        } catch (error) {
            self.postMessage({
                success: false,
                error: error.message
            });
        }
    };
`], { type: 'application/javascript' })));

// Memory-efficient image processing with caching
async function processImage(imageUrl, options = {}) {
    // Check cache first
    const cacheKey = `${imageUrl}-${options.maxSize}-${options.quality}`;
    if (imageCache.has(cacheKey)) {
        return imageCache.get(cacheKey);
    }

    return new Promise((resolve, reject) => {
        imageWorker.onmessage = (e) => {
            if (e.data.success) {
                const result = {
                    data: e.data.data,
                    width: e.data.width,
                    height: e.data.height
                };
                // Cache the result
                imageCache.set(cacheKey, result);
                resolve(result);
            } else {
                reject(new Error(e.data.error));
            }
        };
        
        imageWorker.postMessage({
            imageUrl,
            maxSize: options.maxSize || 300,
            quality: options.quality || 85
        });
    });
}

// Progressive image loading
async function* imageGenerator(elements, batchSize) {
    for (let i = 0; i < elements.length; i += batchSize) {
        yield Array.from(elements).slice(i, i + batchSize);
    }
}

// Scan for images with memory management and progressive loading
async function scanImages(options = {}) {
    const settings = await browser.storage.local.get('settings');
    const { 
        minWidth = 50, 
        minHeight = 50, 
        fileTypes = ['jpg', 'png', 'gif', 'webp'],
        batchSize = 10
    } = settings.settings || {};
    
    const images = [];
    const processedUrls = new Set();
    
    // Process images progressively
    const imgElements = document.getElementsByTagName('img');
    for await (const batch of imageGenerator(imgElements, batchSize)) {
        await Promise.all(batch.map(async (img) => {
            try {
                if (!isValidForProcessing(img, minWidth, minHeight, processedUrls)) {
                    return;
                }
                
                const url = getOriginalImageUrl(img);
                if (!isValidImageUrl(url)) {
                    return;
                }
                
                const ext = url.split('.').pop().toLowerCase().split('?')[0];
                if (!fileTypes.includes(ext)) {
                    return;
                }
                
                const processed = await processImage(url, {
                    maxSize: 300,
                    quality: 60
                });
                
                const previewUrl = URL.createObjectURL(
                    new Blob([processed.data], { type: 'image/jpeg' })
                );
                
                processedUrls.add(url);
                images.push({
                    url: url,
                    previewUrl: previewUrl,
                    filename: sanitizeFilename(url.split('/').pop().split('?')[0]),
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                    type: ext
                });
            } catch (error) {
                console.error('Failed to process image:', error);
            }
        }));
    }
    
    // Clean up cache periodically
    if (imageCache.size > 100) {
        const oldestKeys = Array.from(imageCache.keys()).slice(0, 50);
        oldestKeys.forEach(key => imageCache.delete(key));
    }
    
    return images;
}

// Helper functions
function isValidForProcessing(img, minWidth, minHeight, processedUrls) {
    return img.naturalWidth >= minWidth && 
           img.naturalHeight >= minHeight && 
           !img.src.startsWith('data:') && 
           img.src.startsWith('http') &&
           !processedUrls.has(img.src);
}

function getOriginalImageUrl(img) {
    return img.dataset.src || img.dataset.original || img.src;
}

// Message handling
browser.runtime.onMessage.addListener(async (message, sender) => {
    if (message.type === 'START_SCAN') {
        try {
            const images = await scanImages();
            browser.runtime.sendMessage({
                type: 'FOUND_IMAGES',
                images: images
            });
        } catch (error) {
            console.error('Scan failed:', error);
            browser.runtime.sendMessage({
                type: 'SCAN_ERROR',
                error: error.message
            });
        }
    }
    return true;
});

// Cleanup on unload
window.addEventListener('unload', () => {
    imageWorker.terminate();
});

