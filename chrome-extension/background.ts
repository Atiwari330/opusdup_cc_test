// Service worker for EHR Live Transcription Extension
// Handles extension lifecycle, audio capture initiation, and message routing

console.log('[Extension] Service worker starting...');

// Types for message handling
interface StartRecordingMessage {
  action: 'startRecording';
  tabId: number;
}

interface StopRecordingMessage {
  action: 'stopRecording';
}

interface StatusMessage {
  action: 'getStatus';
}

interface StreamCapturedMessage {
  action: 'streamCaptured';
  tabId: number;
  streamId: string;
}

type ExtensionMessage = StartRecordingMessage | StopRecordingMessage | StatusMessage | StreamCapturedMessage;

// Extension state (use chrome.storage for persistence)
let isRecording = false;
let recordingTabId: number | null = null;
let offscreenDocumentPath = 'offscreen.html';

// Keep service worker alive with periodic activity
const keepAlive = () => {
  console.log('[Extension] Keep-alive ping');
  setTimeout(keepAlive, 20000); // Every 20 seconds
};

// Initialize keep-alive
keepAlive();

// Top-level event listeners for Manifest V3 compliance
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[Extension] Extension installed/updated', details.reason);
  
  // Initialize storage
  chrome.storage.local.set({
    isRecording: false,
    recordingTabId: null,
    transcriptionHistory: []
  });
  
  // Don't auto-open side panel - let popup show instead
  // chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

// Note: action.onClicked is not used when default_popup is set
// The popup will handle the initial user interaction

// Listen for content script loaded messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'contentScriptLoaded') {
    console.log('[Extension] Content script loaded on:', message.url);
  }
  return false;
});

// Message handling from extension components
chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  console.log('[Extension] Message received:', message.action);
  
  switch (message.action) {
    case 'startRecording':
      handleStartRecording(message.tabId)
        .then(response => sendResponse(response))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // Will respond asynchronously
      
    case 'stopRecording':
      handleStopRecording()
        .then(response => sendResponse(response))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
      
    case 'getStatus':
      sendResponse({
        isRecording,
        recordingTabId
      });
      return false; // Synchronous response
      
    case 'streamCaptured':
      handleStreamCaptured(message.tabId, message.streamId)
        .then(response => sendResponse(response))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // Will respond asynchronously
      
    default:
      console.warn('[Extension] Unknown message action:', (message as any).action);
      sendResponse({ success: false, error: 'Unknown action' });
      return false;
  }
});

// Start recording handler
async function handleStartRecording(tabId: number) {
  console.log('[Extension] Starting recording for tab', tabId);
  
  try {
    // Check if already recording
    if (isRecording) {
      throw new Error('Recording already in progress');
    }
    
    // Get tab information (URL access may be restricted)
    try {
      const tab = await chrome.tabs.get(tabId);
      if (tab.url) {
        // Check if tab is supported (video conferencing sites)
        const supportedHosts = ['meet.google.com', 'zoom.us', 'teams.microsoft.com'];
        const url = new URL(tab.url);
        const isSupported = supportedHosts.some(host => url.hostname.includes(host));
        
        if (!isSupported && !url.hostname.includes('localhost')) {
          console.warn('[Extension] Unsupported site:', url.hostname);
        }
      } else {
        console.log('[Extension] Cannot access tab URL - proceeding anyway');
      }
    } catch (error) {
      console.log('[Extension] Tab access error:', error);
      // Continue anyway - audio capture may still work
    }
    
    // First, ensure content script is injected (for activeTab permission)
    try {
      console.log('[Extension] Injecting content script into tab', tabId);
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content.js']
      });
      // Give content script time to initialize
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.log('[Extension] Content script injection error (may already be injected):', error);
    }
    
    // Create offscreen document for audio capture
    await ensureOffscreenDocument();
    
    // Get stream ID for tab capture
    console.log('[Extension] Requesting tab capture stream ID...');
    const streamId = await new Promise<string>((resolve, reject) => {
      chrome.tabCapture.getMediaStreamId({
        targetTabId: tabId
      }, (streamId) => {
        if (chrome.runtime.lastError) {
          console.error('[Extension] Tab capture error:', chrome.runtime.lastError);
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          console.log('[Extension] Stream ID obtained:', streamId);
          resolve(streamId);
        }
      });
    });
    
    console.log('[Extension] Got stream ID:', streamId);
    
    // Send stream ID to offscreen document
    const response = await chrome.runtime.sendMessage({
      target: 'offscreen',
      action: 'startCapture',
      streamId: streamId
    });
    
    if (response.success) {
      isRecording = true;
      recordingTabId = tabId;
      await chrome.storage.local.set({ isRecording: true, recordingTabId: tabId });
      console.log('[Extension] Recording started successfully');
    }
    
    return response;
    
  } catch (error) {
    console.error('[Extension] Error starting recording:', error);
    throw error;
  }
}

// Stop recording handler
async function handleStopRecording() {
  console.log('[Extension] Stopping recording');
  
  try {
    if (!isRecording) {
      throw new Error('No recording in progress');
    }
    
    // Send stop message to offscreen document
    const response = await chrome.runtime.sendMessage({
      target: 'offscreen',
      action: 'stopCapture'
    });
    
    if (response.success) {
      isRecording = false;
      recordingTabId = null;
      await chrome.storage.local.set({ isRecording: false, recordingTabId: null });
      console.log('[Extension] Recording stopped successfully');
    }
    
    return response;
    
  } catch (error) {
    console.error('[Extension] Error stopping recording:', error);
    throw error;
  }
}

// Ensure offscreen document exists
async function ensureOffscreenDocument() {
  // Check if we can access the getContexts API (Chrome 116+)
  if ('getContexts' in chrome.runtime) {
    const existingContexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT' as any],
      documentUrls: [chrome.runtime.getURL(offscreenDocumentPath)]
    });
    
    if (existingContexts && existingContexts.length > 0) {
      console.log('[Extension] Offscreen document already exists');
      return;
    }
  }
  
  console.log('[Extension] Creating offscreen document');
  await chrome.offscreen.createDocument({
    url: offscreenDocumentPath,
    reasons: ['USER_MEDIA' as chrome.offscreen.Reason],
    justification: 'Capture tab audio for transcription'
  });
}

// Handle stream captured from popup
async function handleStreamCaptured(tabId: number, streamId: string) {
  console.log('[Extension] Stream captured from popup for tab', tabId, 'stream ID:', streamId);
  
  try {
    if (isRecording) {
      throw new Error('Recording already in progress');
    }
    
    // Create offscreen document for audio processing
    await ensureOffscreenDocument();
    
    // Send stream info to offscreen document
    // Note: We can't pass the actual stream, but we can use the stream ID
    const response = await chrome.runtime.sendMessage({
      target: 'offscreen',
      action: 'startCaptureFromPopup',
      tabId: tabId,
      streamId: streamId
    });
    
    if (response.success) {
      isRecording = true;
      recordingTabId = tabId;
      await chrome.storage.local.set({ isRecording: true, recordingTabId: tabId });
      console.log('[Extension] Recording started successfully from popup');
    }
    
    return response;
    
  } catch (error) {
    console.error('[Extension] Error handling stream capture:', error);
    throw error;
  }
}

// Handle tab close/navigate - stop recording if active
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === recordingTabId && isRecording) {
    console.log('[Extension] Recording tab closed, stopping recording');
    handleStopRecording();
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (tabId === recordingTabId && isRecording && changeInfo.status === 'loading') {
    console.log('[Extension] Recording tab navigated, stopping recording');
    handleStopRecording();
  }
});

console.log('[Extension] Service worker initialized');