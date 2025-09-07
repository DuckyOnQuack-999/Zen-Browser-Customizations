document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const downloadButton = document.getElementById('downloadButton');
    const selectAllBtn = document.getElementById('selectAllBtn');
    const themeToggle = document.getElementById('themeToggle');
    const progressBar = document.querySelector('.progress-container');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const qualitySlider = document.getElementById('quality');
    const qualityValue = document.getElementById('qualityValue');
    const collapsible = document.querySelector('.collapsible');
    const previewGrid = document.getElementById('previewGrid');
    
    // State
    let images = [];
    let selectedImages = new Set();
    let currentFocusIndex = -1;
    
    // Keyboard Navigation
    function handleGridKeyboard(event) {
        const items = Array.from(previewGrid.children);
        if (!items.length) return;

        switch (event.key) {
            case 'ArrowRight':
                currentFocusIndex = Math.min(currentFocusIndex + 1, items.length - 1);
                break;
            case 'ArrowLeft':
                currentFocusIndex = Math.max(currentFocusIndex - 1, 0);
                break;
            case 'ArrowDown':
                currentFocusIndex = Math.min(currentFocusIndex + 3, items.length - 1);
                break;
            case 'ArrowUp':
                currentFocusIndex = Math.max(currentFocusIndex - 3, 0);
                break;
            case 'Home':
                currentFocusIndex = 0;
                break;
            case 'End':
                currentFocusIndex = items.length - 1;
                break;
            case ' ':
            case 'Enter':
                event.preventDefault();
                items[currentFocusIndex].click();
                return;
            default:
                return;
        }

        event.preventDefault();
        items[currentFocusIndex].focus();
    }

    previewGrid.addEventListener('keydown', handleGridKeyboard);

    // Theme Management with Keyboard Support
    function initTheme() {
        const savedTheme = localStorage.getItem('theme') || 
            (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        document.documentElement.setAttribute('data-theme', savedTheme);
        themeToggle.querySelector('i').textContent = savedTheme === 'dark' ? 'light_mode' : 'dark_mode';
    }
    
    themeToggle.addEventListener('click', toggleTheme);
    themeToggle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleTheme();
        }
    });

    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        themeToggle.querySelector('i').textContent = newTheme === 'dark' ? 'light_mode' : 'dark_mode';
    }

    // Advanced Options with Keyboard Support
    collapsible.addEventListener('click', toggleAdvancedOptions);
    collapsible.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleAdvancedOptions();
        }
    });

    function toggleAdvancedOptions() {
        const content = document.getElementById('advancedContent');
        const isExpanded = collapsible.getAttribute('aria-expanded') === 'true';
        
        collapsible.setAttribute('aria-expanded', !isExpanded);
        content.hidden = isExpanded;
        
        if (!isExpanded) {
            content.style.maxHeight = content.scrollHeight + "px";
        } else {
            content.style.maxHeight = null;
        }
    }

    // Quality Slider with Keyboard Support
    qualitySlider.addEventListener('input', updateQuality);
    qualitySlider.addEventListener('keydown', (e) => {
        let value = parseInt(qualitySlider.value);
        switch(e.key) {
            case 'ArrowRight':
            case 'ArrowUp':
                e.preventDefault();
                qualitySlider.value = Math.min(value + 1, 100);
                break;
            case 'ArrowLeft':
            case 'ArrowDown':
                e.preventDefault();
                qualitySlider.value = Math.max(value - 1, 1);
                break;
            case 'Home':
                e.preventDefault();
                qualitySlider.value = 1;
                break;
            case 'End':
                e.preventDefault();
                qualitySlider.value = 100;
                break;
            default:
                return;
        }
        updateQuality();
    });

    function updateQuality() {
        const value = qualitySlider.value;
        qualityValue.textContent = value + '%';
        qualitySlider.setAttribute('aria-valuenow', value);
    }

    // Select All Functionality
    selectAllBtn.addEventListener('click', toggleSelectAll);
    selectAllBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleSelectAll();
        }
    });

    function toggleSelectAll() {
        const previewItems = document.querySelectorAll('.preview-item');
        if (selectedImages.size === images.length) {
            // Deselect all
            selectedImages.clear();
            previewItems.forEach(item => {
                item.classList.remove('selected');
                item.setAttribute('aria-selected', 'false');
            });
        } else {
            // Select all
            images.forEach(img => selectedImages.add(img.url));
            previewItems.forEach(item => {
                item.classList.add('selected');
                item.setAttribute('aria-selected', 'true');
            });
        }
        updateSelectedCount();
    }

    // Image Selection
    function createImagePreview(image) {
        const div = document.createElement('div');
        div.className = 'preview-item';
        div.setAttribute('role', 'gridcell');
        div.setAttribute('tabindex', '0');
        div.setAttribute('aria-selected', selectedImages.has(image.url) ? 'true' : 'false');
        
        if (selectedImages.has(image.url)) {
            div.classList.add('selected');
        }

        const img = document.createElement('img');
        img.src = image.url;
        img.alt = `Image ${image.filename}`;
        img.setAttribute('draggable', 'false');
        
        div.appendChild(img);
        
        div.addEventListener('click', () => toggleImageSelection(div, image));
        div.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleImageSelection(div, image);
            }
        });

        return div;
    }

    function toggleImageSelection(div, image) {
        div.classList.toggle('selected');
        const isSelected = div.classList.contains('selected');
        div.setAttribute('aria-selected', isSelected);
        
        if (isSelected) {
            selectedImages.add(image.url);
        } else {
            selectedImages.delete(image.url);
        }
        updateSelectedCount();
    }

    function updateSelectedCount() {
        const count = selectedImages.size;
        document.getElementById('selectedCount').textContent = count;
        downloadButton.disabled = count === 0;
        
        // Update aria-label for better screen reader feedback
        selectAllBtn.setAttribute('aria-label', 
            `${count === images.length ? 'Deselect' : 'Select'} all images (${count} currently selected)`
        );
    }

    // Download Management
    downloadButton.addEventListener('click', startDownload);
    downloadButton.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            startDownload();
        }
    });

    function startDownload() {
        const selectedImagesArray = images.filter(img => selectedImages.has(img.url));
        const quality = parseInt(qualitySlider.value);
        const saveLocation = document.getElementById('saveLocation').value;
        const filenamePattern = document.getElementById('filenamePattern').value;

        browser.runtime.sendMessage({
            type: 'START_DOWNLOAD',
            images: selectedImagesArray,
            options: {
                quality,
                saveLocation,
                filenamePattern
            }
        });

        downloadButton.disabled = true;
        progressBar.style.display = 'block';
        progressBar.setAttribute('aria-valuenow', '0');
    }

    // Message Handling
    browser.runtime.onMessage.addListener((message) => {
        switch (message.type) {
            case 'FOUND_IMAGES':
                images = message.images;
                document.getElementById('imageCount').textContent = images.length;
                
                previewGrid.innerHTML = '';
                images.forEach(image => {
                    previewGrid.appendChild(createImagePreview(image));
                });
                
                if (images.length > 0) {
                    currentFocusIndex = 0;
                    previewGrid.children[0].focus();
                }
                break;

            case 'DOWNLOAD_PROGRESS':
                const percent = Math.round((message.current / message.total) * 100);
                progressFill.style.width = `${percent}%`;
                progressText.textContent = `${percent}%`;
                progressBar.setAttribute('aria-valuenow', percent);
                break;

            case 'DOWNLOAD_COMPLETE':
                downloadButton.disabled = false;
                setTimeout(() => {
                    progressBar.style.display = 'none';
                    progressFill.style.width = '0%';
                    selectedImages.clear();
                    updateSelectedCount();
                }, 1000);
                break;
        }
    });

    // Initialize
    initTheme();
    browser.tabs.query({active: true, currentWindow: true})
        .then(tabs => {
            browser.tabs.sendMessage(tabs[0].id, {type: 'START_SCAN'});
        });

    // Listen for system color scheme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
            themeToggle.querySelector('i').textContent = e.matches ? 'light_mode' : 'dark_mode';
        }
    });
});

