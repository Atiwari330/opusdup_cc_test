// Side Panel JavaScript - Handles UI interactions and communication with background script

console.log('[SidePanel] Initializing...');

// UI Elements
const startButton = document.getElementById('startButton') as HTMLButtonElement;
const stopButton = document.getElementById('stopButton') as HTMLButtonElement;
const clearButton = document.getElementById('clearButton') as HTMLButtonElement;
const exportButton = document.getElementById('exportButton') as HTMLButtonElement;
const processButton = document.getElementById('processButton') as HTMLButtonElement;
const transcriptionArea = document.getElementById('transcriptionArea') as HTMLDivElement;
const connectionStatus = document.getElementById('connectionStatus') as HTMLDivElement;
const statusMessage = document.getElementById('statusMessage') as HTMLDivElement;

// State
let isRecording = false;
let transcriptionSegments: Array<{
  timestamp: string;
  text: string;
  isFinal: boolean;
}> = [];

// Initialize UI
updateConnectionStatus('disconnected', 'Not connected');
updateRecordingState(false);

// Button Event Listeners
startButton.addEventListener('click', async () => {
  console.log('[SidePanel] Start recording clicked');
  await startRecording();
});

stopButton.addEventListener('click', async () => {
  console.log('[SidePanel] Stop recording clicked');
  await stopRecording();
});

clearButton.addEventListener('click', () => {
  console.log('[SidePanel] Clear transcription clicked');
  clearTranscription();
});

exportButton.addEventListener('click', () => {
  console.log('[SidePanel] Export transcript clicked');
  exportTranscript();
});

processButton.addEventListener('click', () => {
  console.log('[SidePanel] Process with EHR clicked');
  processWithEHR();
});

// Start Recording
async function startRecording() {
  try {
    updateStatusMessage('Starting recording...', 'info');
    
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.id) {
      // Try to get the last clicked tab
      const storage = await chrome.storage.local.get('lastClickedTabId');
      if (storage.lastClickedTabId) {
        console.log('[SidePanel] Using last clicked tab:', storage.lastClickedTabId);
        const response = await chrome.runtime.sendMessage({
          action: 'startRecording',
          tabId: storage.lastClickedTabId
        });
        console.log('[SidePanel] Start recording response:', response);
        if (response.success) {
          updateRecordingState(true);
          updateConnectionStatus('connecting', 'Connecting to server...');
          updateStatusMessage('Recording started', 'success');
          clearTranscription();
        } else {
          throw new Error(response.error || 'Failed to start recording');
        }
        return;
      }
      throw new Error('No active tab found');
    }
    
    console.log('[SidePanel] Starting recording for tab:', tab.id, tab.url);
    
    // Check if tab is supported
    if (tab.url && !isVideoConferencingSite(tab.url)) {
      updateStatusMessage('Warning: This may not be a video conferencing site', 'error');
    }
    
    // Send message to background script
    const response = await chrome.runtime.sendMessage({
      action: 'startRecording',
      tabId: tab.id
    });
    
    console.log('[SidePanel] Start recording response:', response);
    
    if (response.success) {
      updateRecordingState(true);
      updateConnectionStatus('connecting', 'Connecting to server...');
      updateStatusMessage('Recording started', 'success');
      
      // Clear previous transcription
      clearTranscription();
      
      // Start listening for transcription updates
      // TODO: This will be implemented when we add Deepgram
    } else {
      throw new Error(response.error || 'Failed to start recording');
    }
    
  } catch (error) {
    console.error('[SidePanel] Error starting recording:', error);
    updateStatusMessage(`Error: ${error.message}`, 'error');
  }
}

// Stop Recording
async function stopRecording() {
  try {
    updateStatusMessage('Stopping recording...', 'info');
    
    // Send message to background script
    const response = await chrome.runtime.sendMessage({
      action: 'stopRecording'
    });
    
    console.log('[SidePanel] Stop recording response:', response);
    
    if (response.success) {
      updateRecordingState(false);
      updateConnectionStatus('disconnected', 'Not connected');
      updateStatusMessage('Recording stopped', 'success');
      
      // Enable export/process buttons if we have transcription
      if (transcriptionSegments.length > 0) {
        exportButton.disabled = false;
        processButton.disabled = false;
      }
    } else {
      throw new Error(response.error || 'Failed to stop recording');
    }
    
  } catch (error) {
    console.error('[SidePanel] Error stopping recording:', error);
    updateStatusMessage(`Error: ${error.message}`, 'error');
  }
}

// Update Recording State
function updateRecordingState(recording: boolean) {
  isRecording = recording;
  startButton.disabled = recording;
  stopButton.disabled = !recording;
  
  if (recording) {
    startButton.textContent = 'Recording...';
  } else {
    startButton.innerHTML = '<span class="btn-icon">🎙️</span>Start Recording';
  }
}

// Update Connection Status
function updateConnectionStatus(status: 'connected' | 'connecting' | 'disconnected' | 'error', text: string) {
  connectionStatus.className = `status-indicator ${status}`;
  const statusText = connectionStatus.querySelector('.status-text');
  if (statusText) {
    statusText.textContent = text;
  }
}

// Update Status Message
function updateStatusMessage(message: string, type: 'info' | 'error' | 'success' = 'info') {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
  
  // Clear message after 5 seconds
  if (message) {
    setTimeout(() => {
      statusMessage.textContent = '';
      statusMessage.className = 'status-message';
    }, 5000);
  }
}

// Clear Transcription
function clearTranscription() {
  transcriptionSegments = [];
  transcriptionArea.innerHTML = '<p class="placeholder">Transcription will appear here...</p>';
  exportButton.disabled = true;
  processButton.disabled = true;
}

// Add Transcription Segment
function addTranscriptionSegment(text: string, isFinal: boolean = false) {
  // Skip empty transcripts
  if (!text || !text.trim()) return;
  
  const timestamp = new Date().toLocaleTimeString();
  
  transcriptionSegments.push({
    timestamp,
    text,
    isFinal
  });
  
  // Remove placeholder
  if (transcriptionArea.querySelector('.placeholder')) {
    transcriptionArea.innerHTML = '';
  }
  
  // Create segment element
  const segment = document.createElement('div');
  segment.className = 'transcription-segment';
  
  const timeElement = document.createElement('div');
  timeElement.className = 'segment-time';
  timeElement.textContent = timestamp;
  
  const textElement = document.createElement('div');
  textElement.className = `segment-text ${isFinal ? '' : 'interim'}`;
  textElement.textContent = text;
  
  segment.appendChild(timeElement);
  segment.appendChild(textElement);
  
  transcriptionArea.appendChild(segment);
  
  // Auto-scroll to bottom
  transcriptionArea.scrollTop = transcriptionArea.scrollHeight;
}

// Export Transcript
function exportTranscript() {
  const transcript = transcriptionSegments
    .map(seg => `[${seg.timestamp}] ${seg.text}`)
    .join('\n\n');
  
  // Create blob and download
  const blob = new Blob([transcript], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `transcript-${new Date().toISOString().slice(0, 10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  
  updateStatusMessage('Transcript exported', 'success');
}

// Process with EHR
async function processWithEHR() {
  try {
    updateStatusMessage('Processing transcript...', 'info');
    
    // Compile transcript text
    const transcriptText = transcriptionSegments
      .filter(seg => seg.isFinal)
      .map(seg => seg.text)
      .join(' ');
    
    if (!transcriptText.trim()) {
      throw new Error('No transcript text to process');
    }
    
    // TODO: In Epic 8, this will send to the EHR API
    console.log('[SidePanel] Would process transcript:', transcriptText.length, 'characters');
    
    // For now, just show a message
    updateStatusMessage('EHR processing will be implemented in Epic 8', 'info');
    
  } catch (error) {
    console.error('[SidePanel] Error processing transcript:', error);
    updateStatusMessage(`Error: ${error.message}`, 'error');
  }
}

// Check if URL is a video conferencing site
function isVideoConferencingSite(url: string): boolean {
  const supportedHosts = [
    'meet.google.com',
    'zoom.us',
    'teams.microsoft.com',
    'whereby.com',
    'webex.com'
  ];
  
  try {
    const urlObj = new URL(url);
    return supportedHosts.some(host => urlObj.hostname.includes(host));
  } catch {
    return false;
  }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[SidePanel] Message received:', message);
  
  if (message.action === 'transcriptUpdate') {
    // Update connection status to show we're getting transcriptions
    updateConnectionStatus('connected', 'Transcribing...');
    
    // Add transcription segment
    addTranscriptionSegment(message.transcript, message.isFinal);
  }
  
  return false;
});

// Check initial recording state
chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
  console.log('[SidePanel] Initial status:', response);
  if (response && response.isRecording) {
    updateRecordingState(true);
    updateConnectionStatus('connected', 'Connected to server');
  }
});

console.log('[SidePanel] Initialized');