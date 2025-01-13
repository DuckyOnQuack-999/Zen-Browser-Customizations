async function getImageSize(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.onerror = () => resolve({ width: 0, height: 0 });
        img.src = url;
    });
}

async function extractImageMetadata(url) {
    const metadata = {
        url,
        filename: url.split('/').pop().split('?')[0] || 'image.jpg',
        type: url.split('.').pop().toLowerCase(),
        size: 0,
        dimensions: { width: 0, height: 0 }
    };
    
    try {
        const response = await fetch(url, { method: 'HEAD' });
        metadata.size = parseInt(response.headers.get('content-length') || '0');
        
        const img = new Image();
        await new Promise((resolve, reject) => {
            img.onload = () => {
                metadata.dimensions = {
                    width: img.width,
                    height: img.height
                };
                resolve();
            };
            img.onerror = reject;
            img.src = url;
        });
    } catch (error) {
        console.warn('Failed to extract metadata:', error);
    }
    
    return metadata;
}

async function findAllImages() {
    const images = new Set();
    
    // Get regular img elements
    const imgElements = Array.from(document.getElementsByTagName('img'));
    for (const img of imgElements) {
        const srcset = img.srcset?.split(',').map(src => src.trim().split(' ')[0]) || [];
        const sources = [img.src, ...srcset].filter(Boolean);
        
        for (const src of sources) {
            const size = await getImageSize(src);
            images.add({
                url: src,
                filename: src.split('/').pop().split('?')[0] || 'image.jpg',
                width: size.width,
                height: size.height,
                type: src.split('.').pop().toLowerCase()
            });
        }
    }

    // Get CSS background images
    const styleSheets = Array.from(document.styleSheets);
    for (const sheet of styleSheets) {
        try {
            const rules = Array.from(sheet.cssRules || []);
            for (const rule of rules) {
                const bgImage = rule.style?.backgroundImage;
                if (bgImage && bgImage.includes('url(')) {
                    const url = bgImage.match(/url\(['"]?(.*?)['"]?\)/)[1];
                    const size = await getImageSize(url);
                    images.add({
                        url: url,
                        filename: url.split('/').pop().split('?')[0] || 'image.jpg',
                        width: size.width,
                        height: size.height,
                        type: url.split('.').pop().toLowerCase()
                    });
                }
            }
        } catch (e) {
            console.warn('Failed to process stylesheet:', e);
        }
    }

browser.runtime.sendMessage({
    type: 'FOUND_IMAGES',
    images: imageUrls
});
}

browser.runtime.onMessage.addListener((message) => {
if (message.type === 'START_SCAN') {
    findAllImages();
}
});

