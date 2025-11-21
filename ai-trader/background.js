// Background service worker for the Chrome extension

// Session management configuration
const SESSION_CONFIG = {
  MAX_SESSIONS_PER_DAY: 50,
  MAX_DAYS_TO_KEEP: 7,
  CACHE_CLEAR_TIME: '00:00' // Clear cache at midnight
};

chrome.runtime.onInstalled.addListener(() => {
  console.log('AI Chart Analyzer extension installed');
  
  // Set default settings
  chrome.storage.local.get(['refreshInterval'], (result) => {
    if (!result.refreshInterval && result.refreshInterval !== 0) {
      chrome.storage.local.set({ refreshInterval: 30 });
    }
  });
  
  // Initialize session management
  initializeSessionManagement();
});

// Initialize session management and daily cleanup
async function initializeSessionManagement() {
  console.log('🔄 Initializing session management...');
  
  // Check if we need to clear today's cache
  await checkAndClearDailyCache();
  
  // Set up daily cleanup alarm
  chrome.alarms.create('dailyCleanup', {
    when: getNextMidnight(),
    periodInMinutes: 24 * 60 // Repeat every 24 hours
  });
  
  console.log('✅ Session management initialized');
}

// Get timestamp for next midnight
function getNextMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime();
}

// Handle alarms (daily cleanup)
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'dailyCleanup') {
    console.log('🧹 Running daily cleanup...');
    await performDailyCleanup();
  }
});

// Check if we need to clear today's cache
async function checkAndClearDailyCache() {
  const today = getDateKey();
  const result = await chrome.storage.local.get(['lastCacheDate']);
  
  if (!result.lastCacheDate || result.lastCacheDate !== today) {
    console.log('🗑️ Clearing daily cache for new day:', today);
    await clearTodaysSessions();
    await chrome.storage.local.set({ lastCacheDate: today });
  }
}

// Perform daily cleanup - remove old sessions and clear today's cache
async function performDailyCleanup() {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - SESSION_CONFIG.MAX_DAYS_TO_KEEP);
    
    // Get all stored data
    const allData = await chrome.storage.local.get();
    const keysToRemove = [];
    
    // Find old session keys to remove
    for (const key in allData) {
      if (key.startsWith('sessions_')) {
        const dateStr = key.replace('sessions_', '');
        const sessionDate = new Date(dateStr);
        
        if (sessionDate < cutoffDate) {
          keysToRemove.push(key);
        }
      }
    }
    
    // Remove old sessions
    if (keysToRemove.length > 0) {
      await chrome.storage.local.remove(keysToRemove);
      console.log(`🗑️ Removed ${keysToRemove.length} old session days:`, keysToRemove);
    }
    
    // Clear today's sessions for fresh start
    await clearTodaysSessions();
    
    // Update last cache clear date
    await chrome.storage.local.set({ lastCacheDate: getDateKey() });
    
    console.log('✅ Daily cleanup completed');
  } catch (error) {
    console.error('❌ Error during daily cleanup:', error);
  }
}

// Clear today's sessions
async function clearTodaysSessions() {
  const todayKey = `sessions_${getDateKey()}`;
  await chrome.storage.local.remove([todayKey]);
  console.log('🧹 Cleared today\'s sessions:', todayKey);
}

// Get date key for storage (YYYY-MM-DD format)
function getDateKey(date = new Date()) {
  return date.toISOString().split('T')[0];
}

// Save a chat session
async function saveChatSession(sessionData) {
  try {
    const dateKey = getDateKey();
    const storageKey = `sessions_${dateKey}`;
    
    // Get existing sessions for today
    const result = await chrome.storage.local.get([storageKey]);
    const todaySessions = result[storageKey] || [];
    
    // Add new session with timestamp
    const newSession = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ...sessionData
    };
    
    todaySessions.push(newSession);
    
    // Keep only the last N sessions for today
    if (todaySessions.length > SESSION_CONFIG.MAX_SESSIONS_PER_DAY) {
      todaySessions.splice(0, todaySessions.length - SESSION_CONFIG.MAX_SESSIONS_PER_DAY);
    }
    
    // Save back to storage
    await chrome.storage.local.set({ [storageKey]: todaySessions });
    
    console.log('💾 Chat session saved:', newSession.id);
    return newSession.id;
  } catch (error) {
    console.error('❌ Error saving chat session:', error);
    throw error;
  }
}

// Get chat sessions for a specific date
async function getChatSessions(date = new Date()) {
  try {
    const dateKey = getDateKey(date);
    const storageKey = `sessions_${dateKey}`;
    const result = await chrome.storage.local.get([storageKey]);
    return result[storageKey] || [];
  } catch (error) {
    console.error('❌ Error getting chat sessions:', error);
    return [];
  }
}

// Get session statistics
async function getSessionStats() {
  try {
    const allData = await chrome.storage.local.get();
    const stats = {
      totalDays: 0,
      totalSessions: 0,
      todaySessions: 0,
      oldestDate: null,
      newestDate: null
    };
    
    const today = getDateKey();
    const dates = [];
    
    for (const key in allData) {
      if (key.startsWith('sessions_')) {
        const dateStr = key.replace('sessions_', '');
        const sessions = allData[key];
        
        stats.totalDays++;
        stats.totalSessions += sessions.length;
        dates.push(dateStr);
        
        if (dateStr === today) {
          stats.todaySessions = sessions.length;
        }
      }
    }
    
    if (dates.length > 0) {
      dates.sort();
      stats.oldestDate = dates[0];
      stats.newestDate = dates[dates.length - 1];
    }
    
    return stats;
  } catch (error) {
    console.error('❌ Error getting session stats:', error);
    return null;
  }
}

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzeChart') {
    handleChartAnalysis(request.data)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  }
  
  // Handle session management
  if (request.action === 'saveChatSession') {
    saveChatSession(request.data)
      .then(sessionId => sendResponse({ success: true, sessionId }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  if (request.action === 'getChatSessions') {
    getChatSessions(request.date ? new Date(request.date) : undefined)
      .then(sessions => sendResponse({ success: true, sessions }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  if (request.action === 'getSessionStats') {
    getSessionStats()
      .then(stats => sendResponse({ success: true, stats }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  if (request.action === 'clearTodaysSessions') {
    clearTodaysSessions()
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
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