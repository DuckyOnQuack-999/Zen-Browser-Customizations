document.addEventListener('DOMContentLoaded', async () => {
    // UI Elements
    const saveButton = document.getElementById('saveButton');
    const defaultQuality = document.getElementById('defaultQuality');
    const qualityValue = document.getElementById('qualityValue');
    const fileTypeInputs = document.querySelectorAll('input[type="checkbox"]');
    
    // Default settings
    const defaultSettings = {
        saveLocation: 'Downloads/Images',
        filenamePattern: 'image_{n}_{date}',
        quality: 85,
        optimization: 'balanced',
        minWidth: 50,
        minHeight: 50,
        fileTypes: ['jpg', 'png', 'gif', 'webp'],
        batchSize: 3,
        previewQuality: 'medium'
    };

    // Load saved settings
    async function loadSettings() {
        try {
            const saved = await browser.storage.local.get('settings');
            const settings = saved.settings || defaultSettings;
            
            // Apply settings to form
            document.getElementById('defaultLocation').value = settings.saveLocation;
            document.getElementById('defaultPattern').value = settings.filenamePattern;
            document.getElementById('defaultQuality').value = settings.quality;
            document.getElementById('optimization').value = settings.optimization;
            document.getElementById('defaultMinWidth').value = settings.minWidth;
            document.getElementById('defaultMinHeight').value = settings.minHeight;
            document.getElementById('batchSize').value = settings.batchSize;
            document.getElementById('previewQuality').value = settings.previewQuality;
            
            // Update file type checkboxes
            fileTypeInputs.forEach(input => {
                input.checked = settings.fileTypes.includes(input.value);
            });
            
            // Update quality display
            updateQualityDisplay();
        } catch (error) {
            console.error('Failed to load settings:', error);
            showNotification('Failed to load settings', 'error');
        }
    }

    // Save settings
    async function saveSettings() {
        try {
            const settings = {
                saveLocation: document.getElementById('defaultLocation').value,
                filenamePattern: document.getElementById('defaultPattern').value,
                quality: parseInt(document.getElementById('defaultQuality').value),
                optimization: document.getElementById('optimization').value,
                minWidth: parseInt(document.getElementById('defaultMinWidth').value),
                minHeight: parseInt(document.getElementById('defaultMinHeight').value),
                batchSize: parseInt(document.getElementById('batchSize').value),
                previewQuality: document.getElementById('previewQuality').value,
                fileTypes: Array.from(fileTypeInputs)
                    .filter(input => input.checked)
                    .map(input => input.value)
            };

            await browser.storage.local.set({ settings });
            showNotification('Settings saved successfully', 'success');
        } catch (error) {
            console.error('Failed to save settings:', error);
            showNotification('Failed to save settings', 'error');
        }
    }

    // Update quality display
    function updateQualityDisplay() {
        qualityValue.textContent = `${defaultQuality.value}%`;
    }

    // Show notification
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }

    // Validate settings
    function validateSettings() {
        const batchSize = parseInt(document.getElementById('batchSize').value);
        if (batchSize < 1 || batchSize > 50) {
            showNotification('Batch size must be between 1 and 50', 'error');
            return false;
        }

        const quality = parseInt(document.getElementById('defaultQuality').value);
        if (quality < 1 || quality > 100) {
            showNotification('Quality must be between 1 and 100', 'error');
            return false;
        }

        const fileTypes = Array.from(fileTypeInputs)
            .filter(input => input.checked)
            .map(input => input.value);
        if (fileTypes.length === 0) {
            showNotification('At least one file type must be selected', 'error');
            return false;
        }

        return true;
    }

    // Event Listeners
    saveButton.addEventListener('click', async () => {
        if (validateSettings()) {
            await saveSettings();
        }
    });

    defaultQuality.addEventListener('input', updateQualityDisplay);

    // Initialize
    loadSettings();

    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            if (validateSettings()) {
                saveSettings();
            }
        }
    });
}); 