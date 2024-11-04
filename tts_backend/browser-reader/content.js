// content.js

class ReaderService {
    constructor() {
        this.ws = null;
        this.isReading = false;
        this.currentElement = null;
        this.queue = [];
        this.currentIndex = 0;
        this.audioContext = null;
        this.connectionAttempts = 0;
        this.maxConnectionAttempts = 5;
        this.initializeAudioContext();
        this.connect();
    }

    initializeAudioContext() {
        const initAudio = () => {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                document.removeEventListener('click', initAudio);
                document.removeEventListener('keydown', initAudio);
            }
        };

        document.addEventListener('click', initAudio);
        document.addEventListener('keydown', initAudio);
    }

    connect() {
        const reconnect = () => {
            this.ws = new WebSocket('ws://localhost:8000/ws/tts/');
            this.ws.onopen = () => {
                console.log('WebSocket connection established');
                this.connectionAttempts = 0;
            };

            this.ws.onmessage = async (event) => {
                // ... (existing message handling)
            };

            this.ws.onclose = () => {
                console.log('WebSocket connection closed');
                this.connectionAttempts++;

                if (this.connectionAttempts < this.maxConnectionAttempts) {
                    setTimeout(() => reconnect(), Math.min(1000 * this.connectionAttempts, 5000));
                } else {
                    console.error('Max connection attempts reached. Please check if the server is running.');
                }
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.connectionAttempts++;
                setTimeout(() => reconnect(), Math.min(1000 * this.connectionAttempts, 5000));
            };
        };

        reconnect.call(this);
    }

    playAudioChunk(arrayBuffer) {
        if (!this.audioContext) {
            console.warn('AudioContext not initialized. Waiting for user interaction...');
            return;
        }

        const audioPromise = new Promise((resolve, reject) => {
            const source = this.audioContext.createBufferSource();
            source.buffer = arrayBuffer;
            source.connect(this.audioContext.destination);

            source.onended = () => {
                if (this.isReading) {
                    this.currentIndex++;
                    this.readNext();
                }
                resolve();
            };

            source.onerror = (error) => {
                console.error('Error playing audio:', error);
                reject(error);
            };

            try {
                source.start(0);
            } catch (error) {
                console.error('Error starting audio source:', error);
                reject(error);
            }
        });

        return audioPromise;
    }

    sendMessage(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            try {
                this.ws.send(JSON.stringify(message));
            } catch (error) {
                console.error('Error sending message:', error);
            }
        }
    }

    readNext() {
        if (!this.isReading || this.currentIndex >= this.queue.length) {
            this.stop();
            return;
        }

        const current = this.queue[this.currentIndex];
        if (current && current.element) {
            this.highlightElement(current.element);
            this.sendMessage({
                action: 'speak',
                text: current.text
            });
        }
    }

    extractTextContent() {
        this.queue = [];

        const textNodes = document.evaluate('//text()[normalize-space(.)!=""]', document.body, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

        for (let i = 0; i < textNodes.snapshotLength; i++) {
            const textNode = textNodes.snapshotItem(i);
            const parentElement = textNode.parentElement;

            if (parentElement.tagName.toLowerCase() !== 'script' &&
                parentElement.tagName.toLowerCase() !== 'style' &&
                parentElement.style.display !== 'none' &&
                parentElement.style.visibility !== 'hidden') {
                const text = textNode.textContent.trim();
                if (text) {
                    this.queue.push({ element: parentElement, text });
                }
            }
        }

        return this.queue.length > 0;
    }

    highlightElement(element) {
        if (this.currentElement) {
            this.currentElement.style.backgroundColor = '';
        }
        this.currentElement = element;
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.style.backgroundColor = 'yellow';
        }
    }

    start() {
        console.log('Starting reader service...');

        if (this.queue.length === 0) {
            if (!this.extractTextContent()) {
                console.warn('No readable content found on page');
                return;
            }
        }

        if (this.isReading) {
            console.log('Already reading');
            return;
        }

        if (!this.audioContext) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (error) {
                console.error('Failed to initialize AudioContext:', error);
                return;
            }
        }

        console.log(`Starting to read ${this.queue.length} elements`);
        this.isReading = true;
        this.currentIndex = 0;
        this.readNext();
    }

    updateSettings(settings) {
        this.sendMessage({
            action: 'update_settings',
            settings: settings
        });
    }

    pause() {
        this.isReading = false;
        this.sendMessage({ action: 'stop' });
    }

    resume() {
        this.isReading = true;
        this.readNext();
    }

    stop() {
        this.isReading = false;
        this.currentIndex = 0;
        this.sendMessage({ action: 'stop' });
        if (this.currentElement) {
            this.currentElement.style.backgroundColor = '';
            this.currentElement = null;
        }
    }
}

const readerService = new ReaderService();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Received message:', request);
    try {
        switch (request.action) {
            case 'start':
                readerService.start();
                sendResponse({ success: true, message: 'Started reading' });
                break;
            case 'stop':
                readerService.stop();
                sendResponse({ success: true, message: 'Stopped reading' });
                break;
            case 'pause':
                readerService.pause();
                sendResponse({ success: true, message: 'Paused reading' });
                break;
            case 'resume':
                readerService.resume();
                sendResponse({ success: true, message: 'Resumed reading' });
                break;
            case 'updateSettings':
                readerService.updateSettings(request.settings);
                sendResponse({ success: true, message: 'Updated settings' });
                break;
            default:
                console.warn('Unknown action:', request.action);
                sendResponse({ success: false, message: 'Unknown action' });
        }
    } catch (error) {
        console.error('Error handling message:', error);
        sendResponse({ success: false, error: error.message });
    }
    return true; // Keep the message channel open for async responses
});