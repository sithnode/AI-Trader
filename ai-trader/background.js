// Background service worker for the Chrome extension

chrome.runtime.onInstalled.addListener(() => {
  console.log('AI Chart Analyzer extension installed');
  
  // Set default settings
  chrome.storage.local.get(['refreshInterval'], (result) => {
    if (!result.refreshInterval && result.refreshInterval !== 0) {
      chrome.storage.local.set({ refreshInterval: 30 });
    }
  });
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzeChart') {
    handleChartAnalysis(request.data)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  }
  
  // Handle other message types here if needed
  return true;
});

async function handleChartAnalysis(data) {
  // This can be expanded to handle more complex background processing
  // For now, most processing happens in popup.js
  // This is a placeholder for future features like:
  // - Scheduled analysis
  // - Background data fetching
  // - Notification triggers
  return { status: 'processed' };
}

// Optional: Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // This won't fire if popup.html is set, but kept for reference
  console.log('Extension icon clicked on tab:', tab.id);
});