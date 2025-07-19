// Popup script - Direct audio capture with proper user gesture

console.log('[Popup] Initializing popup');

const captureButton = document.getElementById('captureButton') as HTMLButtonElement;
const openPanelButton = document.getElementById('openPanelButton') as HTMLButtonElement;
const statusDiv = document.getElementById('status') as HTMLDivElement;

// Capture button - uses direct tabCapture API
captureButton.addEventListener('click', async () => {
  console.log('[Popup] Capture button clicked');
  statusDiv.textContent = 'Starting capture...';
  
  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      throw new Error('No active tab found');
    }
    
    console.log('[Popup] Capturing audio from tab:', tab.id);
    
    // Direct capture using popup context (has user gesture)
    chrome.tabCapture.capture(
      {
        audio: true,
        video: false
      },
      (stream) => {
        if (chrome.runtime.lastError) {
          console.error('[Popup] Capture error:', chrome.runtime.lastError);
          statusDiv.textContent = 'Error: ' + chrome.runtime.lastError.message;
          return;
        }
        
        if (!stream) {
          console.error('[Popup] No stream returned');
          statusDiv.textContent = 'Failed to capture audio';
          return;
        }
        
        console.log('[Popup] Audio stream captured successfully');
        statusDiv.textContent = 'Audio capture started!';
        
        // Store the stream ID for the offscreen document
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          // Send to background script to handle
          chrome.runtime.sendMessage({
            action: 'streamCaptured',
            tabId: tab.id,
            streamId: audioTrack.id
          }, (response) => {
            console.log('[Popup] Stream sent to background:', response);
            // Close popup after successful capture
            setTimeout(() => window.close(), 1500);
          });
        }
      }
    );
  } catch (error) {
    console.error('[Popup] Error:', error);
    statusDiv.textContent = 'Error: ' + error.message;
  }
});

// Open panel button
openPanelButton.addEventListener('click', async () => {
  console.log('[Popup] Open panel button clicked');
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (tab?.id) {
    chrome.sidePanel.open({ tabId: tab.id });
    window.close();
  }
});

// Check current status
chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
  console.log('[Popup] Current status:', response);
  if (response?.isRecording) {
    statusDiv.textContent = 'Recording in progress';
    captureButton.textContent = 'Recording...';
    captureButton.disabled = true;
  }
});