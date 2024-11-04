// popup.js
document.addEventListener('DOMContentLoaded', () => {
    const buttons = {
        start: document.getElementById('startReading'),
        pause: document.getElementById('pauseReading'),
        resume: document.getElementById('resumeReading'),
        stop: document.getElementById('stopReading')
    };

    const settings = {
        rate: document.getElementById('rate'),
        pitch: document.getElementById('pitch'),
        volume: document.getElementById('volume')
    };

    // Control buttons
    buttons.start.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'start' });
        });
    });

    buttons.pause.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'pause' });
        });
    });

    buttons.resume.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'resume' });
        });
    });

    buttons.stop.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'stop' });
        });
    });

    // Settings controls
    function updateSettings() {
        const newSettings = {
            rate: parseFloat(settings.rate.value),
            pitch: parseFloat(settings.pitch.value),
            volume: parseFloat(settings.volume.value)
        };

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'updateSettings',
                settings: newSettings
            });
        });
    }

    settings.rate.addEventListener('change', updateSettings);
    settings.pitch.addEventListener('change', updateSettings);
    settings.volume.addEventListener('change', updateSettings);
});