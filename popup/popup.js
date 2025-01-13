let selectedImages = new Set();
let queuedImages = [];
let stats = {
    total: 0,
    selected: 0,
    downloaded: 0,
    failed: 0
};

function updateStats() {
    document.getElementById('totalImages').textContent = stats.total;
    document.getElementById('selectedCount').textContent = stats.selected;
    document.getElementById('downloadCount').textContent = stats.downloaded;
    document.getElementById('failureCount').textContent = stats.failed;
}

function updatePreviewPanel(images) {
    const previewGrid = document.getElementById('imagePreview');
    previewGrid.innerHTML = '';
    
    images.forEach(image => {
        const previewItem = document.createElement('div');
        previewItem.className = 'preview-item';
        if (selectedImages.has(image.url)) {
            previewItem.classList.add('selected');
        }
        
        const img = document.createElement('img');
        img.src = image.url;
        img.alt = image.filename;
        
        previewItem.appendChild(img);
        previewItem.addEventListener('click', () => toggleImageSelection(image, previewItem));
        previewGrid.appendChild(previewItem);
    });
}

function toggleImageSelection(image, element) {
    if (selectedImages.has(image.url)) {
        selectedImages.delete(image.url);
        element.classList.remove('selected');
    } else {
        selectedImages.add(image.url);
        element.classList.add('selected');
    }
    updateQueue();
    stats.selected = selectedImages.size;
    updateStats();
}

function updateQueue() {
    const queueList = document.getElementById('queueList');
    queueList.innerHTML = '';
    
    queuedImages = Array.from(selectedImages).map(url => {
        return { url, filename: url.split('/').pop() };
    });
    
    queuedImages.forEach((image, index) => {
        const queueItem = document.createElement('div');
        queueItem.className = 'queue-item';
        queueItem.draggable = true;
        
        const thumbnail = document.createElement('img');
        thumbnail.src = image.url;
        
        const details = document.createElement('div');
        details.textContent = image.filename;
        
        queueItem.appendChild(thumbnail);
        queueItem.appendChild(details);
        
        setupDragAndDrop(queueItem, index);
        queueList.appendChild(queueItem);
    });
}

function setupDragAndDrop(element, index) {
    element.addEventListener('dragstart', e => {
        e.target.classList.add('dragging');
        e.dataTransfer.setData('text/plain', index);
    });
    
    element.addEventListener('dragend', e => {
        e.target.classList.remove('dragging');
    });
    
    element.addEventListener('dragover', e => {
        e.preventDefault();
        e.target.classList.add('drag-over');
    });
    
    element.addEventListener('dragleave', e => {
        e.target.classList.remove('drag-over');
    });
    
    element.addEventListener('drop', e => {
        e.preventDefault();
        const draggedIdx = parseInt(e.dataTransfer.getData('text/plain'));
        const dropIdx = index;
        
        const temp = queuedImages[draggedIdx];
        queuedImages[draggedIdx] = queuedImages[dropIdx];
        queuedImages[dropIdx] = temp;
        
        updateQueue();
    });
}

// Handle collapsible sections
function setupCollapsible() {
    const collapsibles = document.querySelectorAll('.collapsible');
    collapsibles.forEach(button => {
        button.addEventListener('click', function() {
            this.classList.toggle('active');
            const content = this.nextElementSibling;
            if (content.style.maxHeight) {
                content.style.maxHeight = null;
            } else {
                content.style.maxHeight = content.scrollHeight + "px";
            }
        });
    });
}

// Handle quality selector
function setupQualitySelector() {
    const quality = document.getElementById('quality');
    const qualityValue = document.getElementById('qualityValue');
    const imagePreview = document.getElementById('imagePreview');
    
    quality.addEventListener('input', function() {
        qualityValue.textContent = this.value + '%';
        // Update preview image quality if any image is selected
        if (selectedImages.size > 0) {
            updateImagePreview(this.value);
        }
    });
}

// Update pattern preview
function updatePatternPreview() {
    const pattern = document.getElementById('namingPattern').value;
    const previewText = document.createElement('div');
    previewText.className = 'pattern-preview';
    
    // Generate example filename
    const example = pattern
        .replace('{n}', '1')
        .replace('{date}', new Date().toISOString().split('T')[0])
        .replace('{type}', 'jpg');
        
    previewText.textContent = `Example: ${example}`;
    
    // Update or add preview
    const existing = document.querySelector('.pattern-preview');
    if (existing) {
        existing.replaceWith(previewText);
    } else {
        document.getElementById('namingPattern').parentNode.appendChild(previewText);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const downloadButton = document.getElementById('downloadButton');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const progressContainer = document.getElementById('progressContainer');

    // Initially hide progress elements
    progressContainer.style.display = 'none';

    // Setup collapsible sections
    setupCollapsible();
    
    // Setup quality selector
    setupQualitySelector();
    
    // Setup naming pattern preview
    const namingPattern = document.getElementById('namingPattern');
    namingPattern.addEventListener('input', updatePatternPreview);
    
    // Setup format conversion
    const convertFormat = document.getElementById('convertFormat');
    convertFormat.addEventListener('change', function() {
        // Update quality selector visibility based on format
        const qualityGroup = document.querySelector('.filter-group:has(#quality)');
        qualityGroup.style.display = 
            this.value === 'original' ? 'none' : 'block';
    });

    downloadButton.addEventListener('click', async function() {
        try {
            // Disable button and show progress
            downloadButton.disabled = true;
            progressContainer.style.display = 'block';
            progressText.textContent = 'Scanning for images...';
            progressBar.value = 0;

            // Get the active tab
            const tabs = await browser.tabs.query({active: true, currentWindow: true});
            const activeTab = tabs[0];

            // Send message to content script to start scanning
            const response = await browser.tabs.sendMessage(activeTab.id, {
                action: 'scanImages'
            });

            if (response.images && response.images.length > 0) {
                const totalImages = response.images.length;
                let downloadedCount = 0;

                progressText.textContent = `Downloading 0 of ${totalImages} images`;

                // Send images to background script for download
                await browser.runtime.sendMessage({
                    action: 'downloadImages',
                    images: response.images,
                    onProgress: (completed) => {
                        downloadedCount = completed;
                        const progress = (downloadedCount / totalImages) * 100;
                        progressBar.value = progress;
                        progressText.textContent = `Downloading ${downloadedCount} of ${totalImages} images`;
                    }
                });

                progressText.textContent = 'Download complete!';
            } else {
                progressText.textContent = 'No images found on this page.';
            }
        } catch (error) {
            console.error('Error:', error);
            progressText.textContent = 'Error: ' + error.message;
        } finally {
            // Re-enable button after 3 seconds
            setTimeout(() => {
                downloadButton.disabled = false;
                progressContainer.style.display = 'none';
                progressBar.value = 0;
            }, 3000);
        }
    });
});

