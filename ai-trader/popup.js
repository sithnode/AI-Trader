// Debug version with console logging
console.log('🚀 popup.js loaded!');

let autoRefreshInterval = null;
let currentInterval = 30;
let isConfigExpanded = true;

// Dragging and resizing variables
let isDragging = false;
let isResizing = false;
let startX = 0;
let startY = 0;
let startWidth = 0;
let startHeight = 0;
let startLeft = 0;
let startTop = 0;

// Tab tracking variables
let originalTabId = null;
let originalTabUrl = null;
let tabCheckInterval = null;
let wasAutoRefreshActive = false;

// Provider configurations
const providerConfigs = {
  anthropic: {
    name: 'Anthropic Claude',
    defaultModel: 'claude-sonnet-4-20250514',
    info: 'Anthropic Claude: State-of-the-art vision and reasoning',
    endpoint: 'https://api.anthropic.com/v1/messages',
    supportsPromptMethods: ['text-prompt']
  },
  openai: {
    name: 'OpenAI GPT',
    defaultModel: 'gpt-4o',
    info: 'OpenAI GPT-4: Advanced vision model with strong multimodal capabilities',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    supportsPromptMethods: ['text-prompt', 'predefined-prompt']
  },
  google: {
    name: 'Google Gemini',
    defaultModel: 'gemini-2.0-flash-exp',
    info: 'Google Gemini: Fast and efficient multimodal AI',
    endpoint: 'https://generativelanguage.googleapis.com/v1/models',
    supportsPromptMethods: ['text-prompt']
  },
  openrouter: {
    name: 'OpenRouter',
    defaultModel: 'anthropic/claude-sonnet-4',
    info: 'OpenRouter: Access multiple AI models through one API',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    supportsPromptMethods: ['text-prompt', 'predefined-prompt']
  },
  custom: {
    name: 'Custom API',
    defaultModel: '',
    info: 'Custom: Configure your own API endpoint',
    endpoint: '',
    supportsPromptMethods: ['text-prompt']
  }
};

console.log('📋 Provider configs loaded:', Object.keys(providerConfigs));

// Drag and Resize Functionality
function initializeDragAndResize() {
  const dragHandle = document.getElementById('dragHandle');
  const resizeHandle = document.getElementById('resizeHandle');
  const body = document.body;
  
  if (dragHandle) {
    // Mouse down on drag handle
    dragHandle.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      
      const rect = body.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;
      
      body.style.position = 'fixed';
      body.style.left = startLeft + 'px';
      body.style.top = startTop + 'px';
      body.style.zIndex = '10000';
      
      dragHandle.style.cursor = 'grabbing';
      e.preventDefault();
      
      console.log('🎯 Started dragging');
    });
    
    console.log('✅ Drag handle initialized');
  }
  
  if (resizeHandle) {
    // Mouse down on resize handle
    resizeHandle.addEventListener('mousedown', (e) => {
      isResizing = true;
      startX = e.clientX;
      startY = e.clientY;
      startWidth = parseInt(window.getComputedStyle(body).width, 10);
      startHeight = parseInt(window.getComputedStyle(body).height, 10);
      
      e.preventDefault();
      console.log('📏 Started resizing');
    });
    
    console.log('✅ Resize handle initialized');
  }
  
  // Global mouse move handler
  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      body.style.left = (startLeft + deltaX) + 'px';
      body.style.top = (startTop + deltaY) + 'px';
    } else if (isResizing) {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      const newWidth = Math.max(420, Math.min(800, startWidth + deltaX));
      const newHeight = Math.max(500, Math.min(800, startHeight + deltaY));
      
      body.style.width = newWidth + 'px';
      body.style.height = newHeight + 'px';
      
      // Expand recommendations area when window is larger
      const recommendations = document.getElementById('recommendations');
      if (newHeight > 600) {
        recommendations.classList.add('expanded');
      } else {
        recommendations.classList.remove('expanded');
      }
    }
  });
  
  // Global mouse up handler
  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      dragHandle.style.cursor = 'move';
      console.log('✅ Finished dragging');
    }
    
    if (isResizing) {
      isResizing = false;
      console.log('✅ Finished resizing');
    }
  });
  
  // Double-click drag handle to reset position and size
  if (dragHandle) {
    dragHandle.addEventListener('dblclick', () => {
      resetWindowSize();
      console.log('🔄 Window reset to default size');
    });
  }
  
  // Add keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + R to reset window
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
      e.preventDefault();
      resetWindowSize();
      console.log('⌨️ Window reset via keyboard');
    }
    
    // Escape to stop dragging/resizing
    if (e.key === 'Escape') {
      if (isDragging || isResizing) {
        isDragging = false;
        isResizing = false;
        dragHandle.style.cursor = 'move';
        console.log('⏹️ Drag/resize cancelled');
      }
    }
  });
  
  console.log('🎮 Drag and resize functionality initialized');
}

// Reset window to default size and position
function resetWindowSize() {
  const body = document.body;
  body.style.width = '420px';
  body.style.height = '500px';
  body.style.position = 'relative';
  body.style.left = 'auto';
  body.style.top = 'auto';
  body.style.zIndex = 'auto';
  
  // Reset recommendations area
  const recommendations = document.getElementById('recommendations');
  recommendations.classList.remove('expanded');
  
  showStatus('🔄 Window reset to default size', 'success');
}

// Add expand/collapse functionality for recommendations
function toggleRecommendationsExpansion() {
  const recommendations = document.getElementById('recommendations');
  const isExpanded = recommendations.classList.contains('expanded');
  
  if (isExpanded) {
    recommendations.classList.remove('expanded');
    showStatus('📉 Analysis view collapsed', 'info');
  } else {
    recommendations.classList.add('expanded');
    showStatus('📈 Analysis view expanded', 'info');
  }
}

// Notification Management
async function showInAppNotification(analysisData) {
  const rating = analysisData.rating || 'Neutral';
  const confidence = analysisData.confidence || 'Medium';
  
  let icon = '📊';
  let bgColor = 'rgba(255, 255, 255, 0.2)';
  
  if (rating.toLowerCase() === 'bullish') {
    icon = '🐂';
    bgColor = 'rgba(76, 175, 80, 0.3)';
  } else if (rating.toLowerCase() === 'bearish') {
    icon = '🐻';
    bgColor = 'rgba(244, 67, 54, 0.3)';
  }
  
  // Create notification element
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 50px;
    right: 20px;
    background: ${bgColor};
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    z-index: 10001;
    border: 1px solid rgba(255,255,255,0.3);
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    transform: translateX(400px);
    transition: transform 0.3s ease;
  `;
  
  notification.innerHTML = `${icon} New Analysis: ${rating.toUpperCase()}<br><small>Confidence: ${confidence}</small>`;
  
  document.body.appendChild(notification);
  
  // Animate in
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 100);
  
  // Auto-remove after 4 seconds
  setTimeout(() => {
    notification.style.transform = 'translateX(400px)';
    setTimeout(() => {
      if (notification.parentNode) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 4000);
  
  console.log('🔔 In-app notification shown');
}

async function toggleNotifications() {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'toggleNotifications'
    });
    
    if (response.success) {
      const status = response.enabled ? 'enabled' : 'disabled';
      showStatus(`🔔 Notifications ${status}`, 'success');
      console.log('🔔 Notifications toggled:', response.enabled);
      
      // Update button appearance
      updateNotificationButton();
      
      return response.enabled;
    }
  } catch (error) {
    console.error('❌ Error toggling notifications:', error);
    showStatus('Error toggling notifications', 'error');
  }
}

async function getNotificationSettings() {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'getNotificationSettings'
    });
    
    if (response.success) {
      console.log('🔔 Notification settings:', response);
      return response;
    }
  } catch (error) {
    console.error('❌ Error getting notification settings:', error);
  }
  return null;
}

async function clearNotificationBadge() {
  try {
    await chrome.runtime.sendMessage({ action: 'clearBadge' });
    console.log('🔔 Badge cleared manually');
  } catch (error) {
    console.error('❌ Error clearing badge:', error);
  }
}

// Function to reload analysis prompt from file
async function reloadAnalysisPrompt() {
  cachedAnalysisPrompt = null;
  const newPrompt = await getAnalysisPrompt();
  console.log('🔄 Analysis prompt reloaded from file');
  showStatus('Analysis prompt reloaded', 'success');
  return newPrompt;
}

// Reload prompt from file (clear cache and reload)
async function reloadPrompt() {
  try {
    // Clear the cached prompt
    cachedAnalysisPrompt = null;
    console.log('🔄 Prompt cache cleared');
    
    // Load fresh prompt
    const newPrompt = await getAnalysisPrompt();
    
    if (newPrompt) {
      showStatus('📄 Analysis prompt reloaded', 'success');
      console.log('✅ Analysis prompt reloaded successfully');
      console.log('📄 New prompt length:', newPrompt.length, 'characters');
      return newPrompt;
    }
  } catch (error) {
    console.error('❌ Error reloading prompt:', error);
    showStatus('Error reloading prompt', 'error');
  }
}

// Prompt Editor Functions
function initializePromptEditor() {
  const modal = document.getElementById('promptEditorModal');
  const closeBtn = document.getElementById('closePromptEditor');
  const saveBtn = document.getElementById('savePromptBtn');
  const resetBtn = document.getElementById('resetPromptBtn');
  
  if (closeBtn) {
    closeBtn.addEventListener('click', closePromptEditor);
  }
  
  if (saveBtn) {
    saveBtn.addEventListener('click', savePromptChanges);
  }
  
  if (resetBtn) {
    resetBtn.addEventListener('click', resetPromptToDefault);
  }
  
  // Close modal when clicking outside
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closePromptEditor();
      }
    });
  }
  
  console.log('📝 Prompt editor initialized');
}

async function openPromptEditor() {
  const modal = document.getElementById('promptEditorModal');
  const textarea = document.getElementById('promptTextarea');
  
  if (!modal || !textarea) {
    console.error('❌ Prompt editor elements not found');
    return;
  }
  
  try {
    // Load current prompt
    textarea.value = 'Loading current prompt...';
    modal.style.display = 'flex';
    
    const currentPrompt = await getAnalysisPrompt();
    textarea.value = currentPrompt;
    textarea.focus();
    
    console.log('📝 Prompt editor opened');
    showStatus('📝 Prompt editor opened', 'info');
    
  } catch (error) {
    console.error('❌ Error opening prompt editor:', error);
    textarea.value = 'Error loading prompt. Please try again.';
    showStatus('Error opening prompt editor', 'error');
  }
}

function closePromptEditor() {
  const modal = document.getElementById('promptEditorModal');
  if (modal) {
    modal.style.display = 'none';
    console.log('📝 Prompt editor closed');
  }
}

async function savePromptChanges() {
  const textarea = document.getElementById('promptTextarea');
  const saveBtn = document.getElementById('savePromptBtn');
  
  if (!textarea) {
    console.error('❌ Prompt textarea not found');
    return;
  }
  
  const newPrompt = textarea.value.trim();
  
  if (!newPrompt) {
    showStatus('❌ Prompt cannot be empty', 'error');
    return;
  }
  
  try {
    // Save to chrome storage
    await chrome.storage.local.set({ customAnalysisPrompt: newPrompt });
    
    // Clear cached prompt to force reload
    cachedAnalysisPrompt = newPrompt;
    
    // Visual feedback
    const originalText = saveBtn.textContent;
    saveBtn.textContent = '✅ Saved!';
    saveBtn.disabled = true;
    
    setTimeout(() => {
      saveBtn.textContent = originalText;
      saveBtn.disabled = false;
      closePromptEditor();
    }, 1500);
    
    showStatus('💾 Analysis prompt saved successfully', 'success');
    console.log('💾 Prompt saved to storage, length:', newPrompt.length);
    
  } catch (error) {
    console.error('❌ Error saving prompt:', error);
    showStatus('Error saving prompt', 'error');
  }
}

async function resetPromptToDefault() {
  const textarea = document.getElementById('promptTextarea');
  const resetBtn = document.getElementById('resetPromptBtn');
  
  if (!textarea) return;
  
  const confirmed = confirm('🔄 Reset to Default Prompt\n\nThis will restore the original analysis prompt and discard any custom changes.\n\nContinue?');
  
  if (!confirmed) return;
  
  try {
    // Clear custom prompt from storage
    await chrome.storage.local.remove(['customAnalysisPrompt']);
    
    // Clear cache and reload default
    cachedAnalysisPrompt = null;
    
    // Load default prompt from file
    const response = await fetch(chrome.runtime.getURL('analysis-prompt.txt'));
    const defaultPrompt = await response.text();
    
    textarea.value = defaultPrompt.trim();
    cachedAnalysisPrompt = defaultPrompt.trim();
    
    // Visual feedback
    const originalText = resetBtn.textContent;
    resetBtn.textContent = '✅ Reset!';
    resetBtn.disabled = true;
    
    setTimeout(() => {
      resetBtn.textContent = originalText;
      resetBtn.disabled = false;
    }, 1500);
    
    showStatus('🔄 Prompt reset to default', 'success');
    console.log('🔄 Prompt reset to default');
    
  } catch (error) {
    console.error('❌ Error resetting prompt:', error);
    showStatus('Error resetting prompt', 'error');
  }
}

// Add global functions for console access
window.resetWindow = resetWindowSize;
window.toggleAnalysis = toggleRecommendationsExpansion;
window.toggleNotifications = toggleNotifications;
window.clearBadge = clearNotificationBadge;
window.getNotificationSettings = getNotificationSettings;
window.resetTabTracking = resetTabTracking;
window.checkTabChange = checkTabChange;
window.clearAllAnalyses = clearAllAnalyses;
window.clearAllAnalysesQuick = clearAllAnalysesQuick;
window.reloadPrompt = reloadPrompt;
window.openPromptEditor = openPromptEditor;
window.savePromptChanges = savePromptChanges;
window.resetPromptToDefault = resetPromptToDefault;
window.getPromptConfig = getPromptConfig;
window.setPromptMethod = setPromptMethod;

// Initialize drag and resize on load
initializeDragAndResize();

// Initialize tab tracking
initializeTabTracking();

// Initialize analysis control buttons
initializeAnalysisControlButtons();

// Initialize analysis control buttons
function initializeAnalysisControlButtons() {
  // Notification toggle button
  const notificationToggle = document.getElementById('notificationToggle');
  if (notificationToggle) {
    notificationToggle.addEventListener('click', toggleNotifications);
    console.log('✅ Notification toggle listener attached');
  }
  
  // Edit prompt button
  const editPromptBtn = document.getElementById('editPromptBtn');
  if (editPromptBtn) {
    editPromptBtn.addEventListener('click', openPromptEditor);
    console.log('✅ Edit prompt button listener attached');
  }
  
  // Prompt method toggle button
  const promptToggle = document.getElementById('promptMethodToggle');
  if (promptToggle) {
    promptToggle.addEventListener('click', togglePromptMethod);
    console.log('✅ Prompt method toggle listener attached');
  }
  
  // Clear analyses button
  const clearAnalysesBtn = document.getElementById('clearAnalysesBtn');
  if (clearAnalysesBtn) {
    clearAnalysesBtn.addEventListener('click', clearAllAnalyses);
    console.log('✅ Clear analyses button listener attached');
  }
  
  // Expand analysis button
  const expandAnalysisBtn = document.getElementById('expandAnalysisBtn');
  if (expandAnalysisBtn) {
    expandAnalysisBtn.addEventListener('click', toggleRecommendationsExpansion);
    console.log('✅ Expand analysis button listener attached');
  }
  
  // Initialize prompt editor modal events
  initializePromptEditor();
  
  console.log('🎮 Analysis control buttons initialized');
}

// Configuration collapse/expand handler
const configHeader = document.getElementById('configHeader');
const configSection = document.getElementById('configSection');
const configToggle = document.getElementById('configToggle');
const currentProviderBadge = document.getElementById('currentProvider');

if (configHeader) {
  configHeader.addEventListener('click', () => {
    isConfigExpanded = !isConfigExpanded;
    
    if (isConfigExpanded) {
      configSection.classList.add('expanded');
      configSection.classList.remove('collapsed');
      configToggle.classList.add('expanded');
    } else {
      configSection.classList.remove('expanded');
      configSection.classList.add('collapsed');
      configToggle.classList.remove('expanded');
    }
    
    console.log('🔄 Config section toggled:', isConfigExpanded ? 'expanded' : 'collapsed');
  });
  console.log('✅ Config header listener attached');
}

// Load saved configuration
console.log('💾 Loading saved configuration...');
chrome.storage.local.get(['llmProvider', 'apiKey', 'modelName', 'apiEndpoint', 'refreshInterval'], (result) => {
  console.log('✅ Loaded config:', result);
  
  if (result.llmProvider) {
    document.getElementById('llmProvider').value = result.llmProvider;
    updateProviderUI(result.llmProvider);
    
    // Update the current provider badge
    const providerName = providerConfigs[result.llmProvider].name;
    currentProviderBadge.textContent = providerName;
    
    // Auto-collapse if already configured
    if (result.apiKey && result.modelName) {
      isConfigExpanded = false;
      configSection.classList.remove('expanded');
      configSection.classList.add('collapsed');
      configToggle.classList.remove('expanded');
    }
  }
  if (result.apiKey) {
    document.getElementById('apiKey').value = result.apiKey;
  }
  if (result.modelName) {
    document.getElementById('modelName').value = result.modelName;
  }
  if (result.apiEndpoint) {
    document.getElementById('apiEndpoint').value = result.apiEndpoint;
  }
  if (result.refreshInterval !== undefined) {
    currentInterval = result.refreshInterval;
    updateIntervalButtons();
  }
  
  // Update status if configured
  if (result.apiKey && result.llmProvider) {
    showStatus('✅ Configuration loaded - Ready to analyze', 'success');
  }
});

// Provider selection handler
console.log('🎯 Setting up event listeners...');
const providerSelect = document.getElementById('llmProvider');
if (providerSelect) {
  providerSelect.addEventListener('change', (e) => {
    console.log('🔄 Provider changed to:', e.target.value);
    updateProviderUI(e.target.value);
  });
  console.log('✅ Provider select listener attached');
} else {
  console.error('❌ Could not find llmProvider element');
}

function updateProviderUI(provider) {
  console.log('🎨 Updating UI for provider:', provider);
  const config = providerConfigs[provider];
  const customEndpoint = document.getElementById('customEndpoint');
  const modelInput = document.getElementById('modelName');
  const providerInfo = document.getElementById('providerInfo');
  
  // Update model placeholder
  modelInput.value = config.defaultModel;
  modelInput.placeholder = config.defaultModel;
  
  // Show/hide custom endpoint
  if (provider === 'custom') {
    customEndpoint.classList.remove('hidden');
  } else {
    customEndpoint.classList.add('hidden');
  }
  
  // Update info text
  providerInfo.textContent = config.info;
  console.log('✅ UI updated');
}

// Save configuration
const saveBtn = document.getElementById('saveApiKey');
if (saveBtn) {
  saveBtn.addEventListener('click', () => {
    console.log('💾 Save button clicked');
    const provider = document.getElementById('llmProvider').value;
    const apiKey = document.getElementById('apiKey').value.trim();
    const modelName = document.getElementById('modelName').value.trim();
    const apiEndpoint = document.getElementById('apiEndpoint').value.trim();
    
    console.log('📝 Saving config:', { provider, apiKey: apiKey ? '***' : 'empty', modelName, apiEndpoint });
    
    if (!apiKey) {
      showStatus('Please enter your API key', 'error');
      return;
    }
    
    if (!modelName) {
      showStatus('Please enter a model name', 'error');
      return;
    }
    
    if (provider === 'custom' && !apiEndpoint) {
      showStatus('Please enter a custom API endpoint', 'error');
      return;
    }
    
    chrome.storage.local.set({ 
      llmProvider: provider,
      apiKey: apiKey,
      modelName: modelName,
      apiEndpoint: apiEndpoint
    }, () => {
      console.log('✅ Configuration saved');
      showStatus(`${providerConfigs[provider].name} configuration saved successfully`, 'success');
    });
  });
  console.log('✅ Save button listener attached');
} else {
  console.error('❌ Could not find saveApiKey button');
}

// Capture and analyze chart
const captureBtn = document.getElementById('captureBtn');
if (captureBtn) {
  captureBtn.addEventListener('click', async () => {
    console.log('📸 Capture button clicked');
    await captureAndAnalyze();
  });
  console.log('✅ Capture button listener attached');
} else {
  console.error('❌ Could not find captureBtn');
}

// Interval selector
document.querySelectorAll('.interval-btn').forEach((btn, index) => {
  console.log(`🔘 Setting up interval button ${index}`);
  btn.addEventListener('click', async (e) => {
    const interval = parseInt(e.target.dataset.interval);
    console.log('⏱️ Interval button clicked:', interval);
    currentInterval = interval;
    chrome.storage.local.set({ refreshInterval: interval });
    updateIntervalButtons();
    
    if (interval > 0) {
      // Reset tab tracking to current page when manually starting auto-refresh
      await resetTabTracking();
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }
  });
});
console.log('✅ All interval buttons set up');

function updateIntervalButtons() {
  document.querySelectorAll('.interval-btn').forEach(btn => {
    if (parseInt(btn.dataset.interval) === currentInterval) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

async function initializeTabTracking() {
  try {
    // Get current tab when extension starts
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    originalTabId = tab.id;
    originalTabUrl = tab.url;
    
    console.log('📍 Original tab tracked:', { id: originalTabId, url: originalTabUrl });
    
    // Start monitoring tab changes
    startTabMonitoring();
    
  } catch (error) {
    console.error('❌ Error initializing tab tracking:', error);
  }
}

function startTabMonitoring() {
  // Stop any existing monitoring
  if (tabCheckInterval) {
    clearInterval(tabCheckInterval);
  }
  
  // Check tab every 2 seconds when auto-refresh is active
  tabCheckInterval = setInterval(async () => {
    if (autoRefreshInterval) { // Only check if auto-refresh is active
      await checkTabChange();
    }
  }, 2000);
  
  console.log('👁️ Tab monitoring started');
}

function stopTabMonitoring() {
  if (tabCheckInterval) {
    clearInterval(tabCheckInterval);
    tabCheckInterval = null;
    console.log('👁️ Tab monitoring stopped');
  }
}

async function checkTabChange() {
  try {
    const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Check if we're on a different tab or URL
    const isOriginalTab = currentTab.id === originalTabId;
    const isSameUrl = currentTab.url === originalTabUrl;
    
    if (!isOriginalTab || !isSameUrl) {
      console.log('🔄 Tab change detected:');
      console.log('  Original:', { id: originalTabId, url: originalTabUrl });
      console.log('  Current:', { id: currentTab.id, url: currentTab.url });
      
      // Store that auto-refresh was active
      wasAutoRefreshActive = true;
      
      // Turn off auto-refresh
      stopAutoRefresh();
      
      // Update UI to reflect the change
      currentInterval = 0;
      chrome.storage.local.set({ refreshInterval: 0 });
      updateIntervalButtons();
      
      showStatus('🚫 Auto-refresh disabled - tab/page changed', 'info');
      
      // Stop monitoring since we've detected the change
      stopTabMonitoring();
    }
  } catch (error) {
    console.error('❌ Error checking tab change:', error);
  }
}

// Function to reset tab tracking (for manual restart)
async function resetTabTracking() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  originalTabId = tab.id;
  originalTabUrl = tab.url;
  wasAutoRefreshActive = false;
  
  console.log('🔄 Tab tracking reset to:', { id: originalTabId, url: originalTabUrl });
  showStatus('📍 Tab tracking reset to current page', 'success');
}

function startAutoRefresh() {
  stopAutoRefresh();
  
  if (currentInterval > 0) {
    console.log('▶️ Starting auto-refresh:', currentInterval, 'seconds');
    autoRefreshInterval = setInterval(async () => {
      console.log('🔄 Auto-refresh triggered');
      await captureAndAnalyze();
    }, currentInterval * 1000);
    
    // Start tab monitoring when auto-refresh begins
    startTabMonitoring();
    
    showStatus(`Auto-refresh enabled (${currentInterval}s)`, 'info');
  }
}

function stopAutoRefresh() {
  if (autoRefreshInterval) {
    console.log('⏸️ Stopping auto-refresh');
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
    
    // Stop tab monitoring when auto-refresh stops
    stopTabMonitoring();
  }
}

async function captureAndAnalyze() {
  console.log('🎬 Starting capture and analyze...');
  const loading = document.getElementById('loading');
  const captureBtn = document.getElementById('captureBtn');
  
  // Get configuration
  const config = await chrome.storage.local.get(['llmProvider', 'apiKey', 'modelName', 'apiEndpoint']);
  console.log('📦 Retrieved config:', { ...config, apiKey: config.apiKey ? '***' : 'empty' });
  
  if (!config.apiKey || !config.modelName) {
    console.warn('⚠️ Missing configuration');
    showStatus('Please configure your LLM provider first', 'error');
    return;
  }
  
  loading.style.display = 'block';
  captureBtn.disabled = true;
  showStatus('Capturing chart...', 'info');
  
  try {
    console.log('🔍 Getting active tab...');
    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    console.log('✅ Active tab:', tab.url);
    
    console.log('📷 Capturing screenshot...');
    // Capture screenshot
    const screenshot = await chrome.tabs.captureVisibleTab(null, { format: 'png' });

    console.log('✅ Screenshot captured, size:', screenshot.length, 'chars');
    
    showStatus('Analyzing with AI...', 'info');
    
    console.log('🤖 Sending to LLM...');
    // Send to LLM for analysis
    const analysis = await analyzeChartWithLLM(screenshot, config);
    console.log('✅ Analysis received, length:', analysis.length);
    
    // Display recommendations
    displayRecommendation(analysis, config.llmProvider);
    
    showStatus('Analysis complete', 'success');
    
  } catch (error) {
    console.error('❌ Error during capture/analysis:', error);
    showStatus(`Error: ${error.message}`, 'error');
  } finally {
    loading.style.display = 'none';
    captureBtn.disabled = false;
  }
}

async function analyzeChartWithLLM(screenshot, config) {
  console.log('🔀 Routing to provider:', config.llmProvider);
  const base64Image = screenshot.split(',')[1];
  const provider = config.llmProvider;
  
  switch (provider) {
    case 'anthropic':
      return await callAnthropicAPI(base64Image, config);
    case 'openai':
      return await callOpenAIAPI(base64Image, config);
    case 'google':
      return await callGoogleAPI(base64Image, config);
    case 'openrouter':
      return await callOpenRouterAPI(base64Image, config);
    case 'custom':
      return await callCustomAPI(base64Image, config);
    default:
      throw new Error('Unsupported provider');
  }
}

async function callAnthropicAPI(base64Image, config) {
  console.log('🟣 Calling Anthropic API...');
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: config.modelName,
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: base64Image
            }
          },
          {
            type: 'text',
            text: await getAnalysisPrompt()
          }
        ]
      }]
    })
  });
  
  console.log('📡 Response status:', response.status);
  
  if (!response.ok) {
    const error = await response.json();
    console.error('❌ API error:', error);
    throw new Error(error.error?.message || 'API request failed');
  }
  
  const data = await response.json();
  console.log('✅ API response received');
  return data.content[0].text;
}

async function callOpenAIAPI(base64Image, config) {
  console.log('🟢 Calling OpenAI API...');
  
  // Check prompt method preference
  const storage = await chrome.storage.local.get(['promptMethod', 'promptId', 'promptVersion']);
  const promptMethod = storage.promptMethod || 'text-prompt';
  
  if (promptMethod === 'predefined-prompt' && storage.promptId) {
    return await callOpenAIPredefinedPrompt(base64Image, config, storage);
  } else {
    return await callOpenAITextPrompt(base64Image, config);
  }
}

async function callOpenAITextPrompt(base64Image, config) {
  console.log('📝 Using OpenAI text prompt method');
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.modelName,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: await getAnalysisPrompt()
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/png;base64,${base64Image}`
            }
          }
        ]
      }],
      max_tokens: 2000
    })
  });
  
  console.log('📡 Response status:', response.status);
  
  if (!response.ok) {
    const error = await response.json();
    console.error('❌ API error:', error);
    throw new Error(error.error?.message || 'API request failed');
  }
  
  const data = await response.json();
  console.log('✅ API response received');
  return data.choices[0].message.content;
}

async function callOpenAIPredefinedPrompt(base64Image, config, promptSettings) {
  console.log('🎯 Using OpenAI predefined prompt method');
  
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      prompt: {
        id: promptSettings.promptId,
        version: promptSettings.promptVersion || '1'
      },
      inputs: {
        chart_image: `data:image/png;base64,${base64Image}`
      }
    })
  });
  
  console.log('📡 Predefined prompt response status:', response.status);
  
  if (!response.ok) {
    const error = await response.json();
    console.error('❌ Predefined prompt API error:', error);
    
    // Fallback to text prompt if predefined fails
    console.log('🔄 Falling back to text prompt method');
    return await callOpenAITextPrompt(base64Image, config);
  }
  
  const data = await response.json();
  console.log('✅ Predefined prompt response received');
  
  // Extract the response content
  if (data.response && data.response.content) {
    return data.response.content;
  } else if (data.content) {
    return data.content;
  } else {
    return JSON.stringify(data);
  }
}

async function callGoogleAPI(base64Image, config) {
  console.log('🔵 Calling Google API...');
  const apiKey = config.apiKey;
  const modelName = config.modelName;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: await getAnalysisPrompt() },
          {
            inline_data: {
              mime_type: 'image/png',
              data: base64Image
            }
          }
        ]
      }]
    })
  });
  
  console.log('📡 Response status:', response.status);
  
  if (!response.ok) {
    const error = await response.json();
    console.error('❌ API error:', error);
    throw new Error(error.error?.message || 'API request failed');
  }
  
  const data = await response.json();
  console.log('✅ API response received');
  return data.candidates[0].content.parts[0].text;
}

async function callOpenRouterAPI(base64Image, config) {
  console.log('🟠 Calling OpenRouter API...');
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
      'HTTP-Referer': chrome.runtime.getURL(''),
      'X-Title': 'AI Chart Analyzer'
    },
    body: JSON.stringify({
      model: config.modelName,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: await getAnalysisPrompt()
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/png;base64,${base64Image}`
            }
          }
        ]
      }]
    })
  });
  
  console.log('📡 Response status:', response.status);
  
  if (!response.ok) {
    const error = await response.json();
    console.error('❌ API error:', error);
    throw new Error(error.error?.message || 'API request failed');
  }
  
  const data = await response.json();
  console.log('✅ API response received');
  return data.choices[0].message.content;
}

async function callCustomAPI(base64Image, config) {
  console.log('⚙️ Calling Custom API...');
  const response = await fetch(config.apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.modelName,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: await getAnalysisPrompt()
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/png;base64,${base64Image}`
            }
          }
        ]
      }],
      max_tokens: 2000
    })
  });
  
  console.log('📡 Response status:', response.status);
  
  if (!response.ok) {
    const error = await response.json();
    console.error('❌ API error:', error);
    throw new Error(error.error?.message || error.message || 'API request failed');
  }
  
  const data = await response.json();
  console.log('✅ API response received');
  
  // Try to handle different response formats
  if (data.choices && data.choices[0]) {
    return data.choices[0].message.content;
  } else if (data.content) {
    return Array.isArray(data.content) ? data.content[0].text : data.content;
  } else if (data.text) {
    return data.text;
  } else {
    return JSON.stringify(data);
  }
}

// Cache for the analysis prompt and configuration
let cachedAnalysisPrompt = null;
let cachedPromptConfig = null;

// Load prompt configuration
async function getPromptConfig() {
  if (cachedPromptConfig) {
    return cachedPromptConfig;
  }
  
  try {
    const response = await fetch(chrome.runtime.getURL('analysis-config.json'));
    
    if (!response.ok) {
      throw new Error(`Failed to load config: ${response.status}`);
    }
    
    cachedPromptConfig = await response.json();
    console.log('⚙️ Prompt configuration loaded');
    return cachedPromptConfig;
    
  } catch (error) {
    console.error('❌ Error loading prompt config:', error);
    
    // Fallback config
    const fallbackConfig = {
      promptMethod: {
        default: 'text-prompt',
        options: {
          'text-prompt': {
            name: 'Custom Text Prompt',
            description: 'Uses text-based prompts',
            requiresPromptId: false
          }
        }
      }
    };
    
    return fallbackConfig;
  }
}

async function getAnalysisPrompt() {
  // Return cached prompt if available
  if (cachedAnalysisPrompt) {
    return cachedAnalysisPrompt;
  }
  
  try {
    // First check for custom prompt in storage
    const storage = await chrome.storage.local.get(['customAnalysisPrompt']);
    
    if (storage.customAnalysisPrompt && storage.customAnalysisPrompt.trim()) {
      cachedAnalysisPrompt = storage.customAnalysisPrompt.trim();
      console.log('📄 Analysis prompt loaded from custom storage');
      return cachedAnalysisPrompt;
    }
    
    // Fallback to file if no custom prompt
    const response = await fetch(chrome.runtime.getURL('analysis-prompt.txt'));
    
    if (!response.ok) {
      throw new Error(`Failed to load prompt: ${response.status}`);
    }
    
    const promptText = await response.text();
    
    // Cache the prompt for future use
    cachedAnalysisPrompt = promptText.trim();
    console.log('📄 Analysis prompt loaded from file');
    
    return cachedAnalysisPrompt;
    
  } catch (error) {
    console.error('❌ Error loading analysis prompt from file:', error);
    
    // Fallback to a basic prompt if file loading fails
    const fallbackPrompt = `Analyze this trading chart and provide:
1. Action: BUY/SELL/NO TRADE
2. Entry point
3. Target price  
4. Stop loss
5. Reasoning

Keep it concise and actionable.`;
    
    console.log('⚠️ Using fallback analysis prompt');
    return fallbackPrompt;
  }
}

function displayRecommendation(analysis, provider) {
  console.log('📊 Displaying recommendation');
  const container = document.getElementById('recommendations');
  const timestamp = new Date().toLocaleTimeString();
  const providerName = providerConfigs[provider].name;
  
  // Parse rating and confidence from the first line
  let rating = 'Neutral';
  let confidence = 'Medium';
  let analysisText = analysis;
  
  const ratingMatch = analysis.match(/RATING:\s*(Bullish|Bearish|Neutral)/i);
  const confidenceMatch = analysis.match(/CONFIDENCE:\s*(High|Medium|Low)/i);
  
  if (ratingMatch) {
    rating = ratingMatch[1];
    // Remove the rating line from display
    analysisText = analysis.replace(/RATING:.*?\n/i, '');
  }
  
  if (confidenceMatch) {
    confidence = confidenceMatch[1];
    // Remove the confidence line from display
    analysisText = analysisText.replace(/CONFIDENCE:.*?\n/i, '');
  }
  
  // Determine emoji and color based on rating
  let ratingEmoji = '⚖️';
  let ratingClass = '';
  
  if (rating.toLowerCase() === 'bullish') {
    ratingEmoji = '🐂';
    ratingClass = 'signal-buy';
  } else if (rating.toLowerCase() === 'bearish') {
    ratingEmoji = '🐻';
    ratingClass = 'signal-sell';
  }
  
  // Confidence badge class
  let confidenceClass = 'confidence-medium';
  if (confidence.toLowerCase() === 'high') {
    confidenceClass = 'confidence-high';
  } else if (confidence.toLowerCase() === 'low') {
    confidenceClass = 'confidence-low';
  }
  
  const item = document.createElement('div');
  item.className = 'recommendation-item';
  item.innerHTML = `
    <div class="recommendation-header">
      <div>
        <div class="timestamp">⏰ ${timestamp} | 🤖 ${providerName}</div>
        <div class="recommendation-action ${ratingClass}">
          ${ratingEmoji} ${rating.toUpperCase()}
        </div>
      </div>
      <div class="confidence-badge ${confidenceClass}">
        ${confidence} Confidence
      </div>
    </div>
    <div style="white-space: pre-wrap; line-height: 1.6;">${analysisText.trim()}</div>
  `;
  
  container.insertBefore(item, container.firstChild);
  
  // Save this session to persistent storage
  saveChatSessionToPersistentStorage({
    analysis: analysisText.trim(),
    rating: rating,
    confidence: confidence,
    provider: providerName,
    timestamp: new Date().toISOString(),
    displayTimestamp: timestamp
  });
  
  // Keep only last 5 recommendations in UI
  while (container.children.length > 5) {
    container.removeChild(container.lastChild);
  }
  console.log('✅ Recommendation displayed with rating:', rating, 'confidence:', confidence);
}

function showStatus(message, type) {
  console.log(`📢 Status [${type}]:`, message);
  const status = document.getElementById('status');
  status.textContent = message;
  
  // Color coding
  if (type === 'success') {
    status.style.background = 'rgba(76, 175, 80, 0.3)';
  } else if (type === 'error') {
    status.style.background = 'rgba(244, 67, 54, 0.3)';
  } else {
    status.style.background = 'rgba(255, 255, 255, 0.1)';
  }
}

// Session Management Functions
async function saveChatSessionToPersistentStorage(sessionData) {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'saveChatSession',
      data: sessionData
    });
    
    if (response.success) {
      console.log('💾 Session saved to persistent storage:', response.sessionId);
      
      // Show in-app notification
      showInAppNotification(sessionData);
      
      // Clear badge when popup is active (user is viewing)
      setTimeout(async () => {
        await chrome.runtime.sendMessage({ action: 'clearBadge' });
      }, 2000);
      
    } else {
      console.error('❌ Failed to save session:', response.error);
    }
  } catch (error) {
    console.error('❌ Error saving session:', error);
  }
}

async function loadTodaysSessions() {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'getChatSessions'
    });
    
    if (response.success) {
      console.log('📖 Loaded today\'s sessions:', response.sessions.length);
      return response.sessions;
    } else {
      console.error('❌ Failed to load sessions:', response.error);
      return [];
    }
  } catch (error) {
    console.error('❌ Error loading sessions:', error);
    return [];
  }
}

async function getSessionStatistics() {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'getSessionStats'
    });
    
    if (response.success) {
      console.log('📊 Session statistics:', response.stats);
      return response.stats;
    } else {
      console.error('❌ Failed to get session stats:', response.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting session stats:', error);
    return null;
  }
}

async function clearTodaysCache() {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'clearTodaysSessions'
    });
    
    if (response.success) {
      console.log('🧹 Today\'s cache cleared successfully');
      // Also clear the UI
      const container = document.getElementById('recommendations');
      container.innerHTML = '';
      showStatus('Today\'s sessions cleared', 'success');
    } else {
      console.error('❌ Failed to clear cache:', response.error);
      showStatus('Failed to clear cache', 'error');
    }
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
    showStatus('Error clearing cache', 'error');
  }
}

// Clear all analyses with confirmation
async function clearAllAnalyses() {
  // Show confirmation dialog
  const confirmed = confirm('🗑️ Clear All Analyses\n\nThis will permanently delete:\n• All today\'s analysis sessions\n• Current UI display\n• Notification badges\n\nThis action cannot be undone. Continue?');
  
  if (!confirmed) {
    console.log('🚫 Clear operation cancelled by user');
    return;
  }
  
  try {
    // Clear persistent storage
    const response = await chrome.runtime.sendMessage({
      action: 'clearTodaysSessions'
    });
    
    if (response.success) {
      // Clear the UI immediately
      const container = document.getElementById('recommendations');
      container.innerHTML = '';
      
      // Clear notification badge
      await chrome.runtime.sendMessage({ action: 'clearBadge' });
      
      // Update notification button
      updateNotificationButton();
      
      // Show success message
      showStatus('🗑️ All analyses cleared successfully', 'success');
      console.log('🗑️ All analyses cleared successfully');
      
      // Brief visual feedback
      const trashBtn = document.getElementById('clearAnalysesBtn');
      if (trashBtn) {
        const originalBg = trashBtn.style.background;
        trashBtn.style.background = 'rgba(76, 175, 80, 0.5)';
        trashBtn.textContent = '✅';
        
        setTimeout(() => {
          trashBtn.style.background = originalBg;
          trashBtn.textContent = '🗑️';
        }, 1500);
      }
      
    } else {
      console.error('❌ Failed to clear analyses:', response.error);
      showStatus('Failed to clear analyses', 'error');
    }
  } catch (error) {
    console.error('❌ Error clearing analyses:', error);
    showStatus('Error clearing analyses', 'error');
  }
}

// Quick clear without confirmation (for console/advanced users)
async function clearAllAnalysesQuick() {
  try {
    // Clear persistent storage
    const response = await chrome.runtime.sendMessage({
      action: 'clearTodaysSessions'
    });
    
    if (response.success) {
      // Clear the UI
      const container = document.getElementById('recommendations');
      container.innerHTML = '';
      
      // Clear notification badge
      await chrome.runtime.sendMessage({ action: 'clearBadge' });
      
      // Update notification button
      updateNotificationButton();
      
      showStatus('🗑️ All analyses cleared (quick)', 'success');
      console.log('🗑️ All analyses cleared (quick mode)');
    }
  } catch (error) {
    console.error('❌ Error in quick clear:', error);
    showStatus('Error in quick clear', 'error');
  }
}

// Load and display sessions from persistent storage on popup open
async function loadAndDisplayStoredSessions() {
  const sessions = await loadTodaysSessions();
  const container = document.getElementById('recommendations');
  
  // Display sessions in reverse chronological order (newest first)
  sessions.reverse().slice(0, 5).forEach(session => {
    const item = document.createElement('div');
    item.className = 'recommendation-item';
    
    // Determine rating styling
    let ratingEmoji = '⚖️';
    let ratingClass = '';
    
    if (session.rating && session.rating.toLowerCase() === 'bullish') {
      ratingEmoji = '🐂';
      ratingClass = 'signal-buy';
    } else if (session.rating && session.rating.toLowerCase() === 'bearish') {
      ratingEmoji = '🐻';
      ratingClass = 'signal-sell';
    }
    
    // Confidence badge class
    let confidenceClass = 'confidence-medium';
    if (session.confidence && session.confidence.toLowerCase() === 'high') {
      confidenceClass = 'confidence-high';
    } else if (session.confidence && session.confidence.toLowerCase() === 'low') {
      confidenceClass = 'confidence-low';
    }
    
    const displayTime = session.displayTimestamp || new Date(session.timestamp).toLocaleTimeString();
    
    item.innerHTML = `
      <div class="recommendation-header">
        <div>
          <div class="timestamp">⏰ ${displayTime} | 🤖 ${session.provider} 💾</div>
          <div class="recommendation-action ${ratingClass}">
            ${ratingEmoji} ${(session.rating || 'NEUTRAL').toUpperCase()}
          </div>
        </div>
        <div class="confidence-badge ${confidenceClass}">
          ${session.confidence || 'Medium'} Confidence
        </div>
      </div>
      <div style="white-space: pre-wrap; line-height: 1.6;">${session.analysis}</div>
    `;
    
    container.appendChild(item);
  });
  
  console.log(`📚 Displayed ${Math.min(sessions.length, 5)} stored sessions`);
}

// Prompt Method Management Functions
async function setPromptMethod(method, promptId = null, version = '1') {
  try {
    const config = await getPromptConfig();
    const validMethods = Object.keys(config.promptMethod.options);
    
    if (!validMethods.includes(method)) {
      throw new Error(`Invalid prompt method. Valid options: ${validMethods.join(', ')}`);
    }
    
    const methodConfig = config.promptMethod.options[method];
    
    if (methodConfig.requiresPromptId && !promptId) {
      throw new Error(`Prompt method '${method}' requires a prompt ID`);
    }
    
    // Save to storage
    const storageData = { promptMethod: method };
    if (promptId) {
      storageData.promptId = promptId;
      storageData.promptVersion = version;
    }
    
    await chrome.storage.local.set(storageData);
    
    console.log(`✅ Prompt method set to: ${methodConfig.name}`);
    showStatus(`Prompt method: ${methodConfig.name}`, 'success');
    
    return true;
  } catch (error) {
    console.error('❌ Error setting prompt method:', error);
    showStatus(`Error: ${error.message}`, 'error');
    return false;
  }
}

async function getCurrentPromptMethod() {
  try {
    const storage = await chrome.storage.local.get(['promptMethod', 'promptId', 'promptVersion']);
    const config = await getPromptConfig();
    
    const method = storage.promptMethod || config.promptMethod.default;
    const methodConfig = config.promptMethod.options[method];
    
    return {
      method: method,
      name: methodConfig.name,
      description: methodConfig.description,
      promptId: storage.promptId || methodConfig.defaultPromptId,
      version: storage.promptVersion || methodConfig.defaultVersion
    };
  } catch (error) {
    console.error('❌ Error getting current prompt method:', error);
    return null;
  }
}

async function togglePromptMethod() {
  const toggleBtn = document.getElementById('promptMethodToggle');
  const toggleIcon = document.getElementById('toggleIcon');
  const toggleText = document.getElementById('toggleText');
  
  if (!toggleBtn || !toggleIcon || !toggleText) {
    console.error('❌ Toggle elements not found');
    return;
  }
  
  try {
    // Add switching animation
    toggleBtn.classList.add('switching');
    
    // Get current method
    const currentMethod = await getCurrentPromptMethod();
    const isTextMode = currentMethod.method === 'text-prompt';
    
    // Check if provider supports predefined prompts when switching to predefined
    if (isTextMode) {
      const config = await chrome.storage.local.get(['llmProvider']);
      const provider = config.llmProvider;
      
      if (!provider) {
        showStatus('❌ Please configure LLM provider first', 'error');
        toggleBtn.classList.remove('switching');
        return;
      }
      
      const providerConfig = providerConfigs[provider];
      if (!providerConfig || !providerConfig.supportsPromptMethods.includes('predefined-prompt')) {
        showStatus(`❌ ${providerConfig.name} doesn't support predefined prompts`, 'error');
        toggleBtn.classList.remove('switching');
        return;
      }
      
      // Switch to predefined prompt
      const promptConfig = await getPromptConfig();
      const predefinedConfig = promptConfig.promptMethod.options['predefined-prompt'];
      
      const success = await setPromptMethod(
        'predefined-prompt', 
        predefinedConfig.defaultPromptId, 
        predefinedConfig.defaultVersion
      );
      
      if (success) {
        updateToggleUI('predefined-prompt');
        showStatus('🎯 Switched to predefined prompt mode', 'success');
      }
    } else {
      // Switch to text prompt
      const success = await setPromptMethod('text-prompt');
      
      if (success) {
        updateToggleUI('text-prompt');
        showStatus('📝 Switched to text prompt mode', 'success');
      }
    }
    
  } catch (error) {
    console.error('❌ Error toggling prompt method:', error);
    showStatus('Error switching prompt method', 'error');
  } finally {
    // Remove switching animation
    setTimeout(() => {
      if (toggleBtn) {
        toggleBtn.classList.remove('switching');
      }
    }, 300);
  }
}

function updateToggleUI(method) {
  const toggleBtn = document.getElementById('promptMethodToggle');
  const toggleIcon = document.getElementById('toggleIcon');
  const toggleText = document.getElementById('toggleText');
  
  if (!toggleBtn || !toggleIcon || !toggleText) return;
  
  // Remove existing classes
  toggleBtn.classList.remove('text-mode', 'predefined-mode');
  
  if (method === 'predefined-prompt') {
    toggleBtn.classList.add('predefined-mode');
    toggleIcon.textContent = '🎯';
    toggleText.textContent = 'AI';
    toggleBtn.title = 'Currently using predefined prompts - Click to switch to text prompts';
  } else {
    toggleBtn.classList.add('text-mode');
    toggleIcon.textContent = '📄';
    toggleText.textContent = 'Text';
    toggleBtn.title = 'Currently using text prompts - Click to switch to predefined prompts';
  }
}

// Initialize prompt method toggle UI
initializePromptMethodToggle();

// Load stored sessions when popup opens
loadAndDisplayStoredSessions();

// Display session statistics
getSessionStatistics().then(stats => {
  if (stats) {
    console.log(`📊 Session Stats: ${stats.todaySessions} today, ${stats.totalSessions} total across ${stats.totalDays} days`);
    
    // Add stats to status if there are sessions
    if (stats.totalSessions > 0) {
      const statusElement = document.getElementById('status');
      const currentStatus = statusElement.textContent;
      const statsText = `💾 ${stats.todaySessions} sessions today, ${stats.totalSessions} total`;
      
      if (!currentStatus || currentStatus.trim() === '') {
        showStatus(statsText, 'info');
      }
    }
  }
});

async function initializePromptMethodToggle() {
  try {
    const currentMethod = await getCurrentPromptMethod();
    if (currentMethod) {
      updateToggleUI(currentMethod.method);
      console.log(`🎯 Initialized prompt toggle: ${currentMethod.name}`);
    }
  } catch (error) {
    console.error('❌ Error initializing prompt method toggle:', error);
    // Default to text mode if error
    updateToggleUI('text-prompt');
  }
}

// Add clear cache functionality (can be triggered via console or future UI)
window.clearTodaysCache = clearTodaysCache;
window.getSessionStats = getSessionStatistics;
window.loadSessions = loadTodaysSessions;
window.getCurrentPromptMethod = getCurrentPromptMethod;
window.togglePromptMethod = togglePromptMethod;

// Auto-start refresh if enabled
chrome.storage.local.get(['refreshInterval'], (result) => {
  if (result.refreshInterval && result.refreshInterval > 0) {
    console.log('🔄 Auto-starting refresh');
    startAutoRefresh();
  }
});

// Update notification button appearance
async function updateNotificationButton() {
  const settings = await getNotificationSettings();
  const button = document.getElementById('notificationToggle');
  
  if (button && settings) {
    button.textContent = settings.enabled ? '🔔' : '🔕';
    button.title = settings.enabled ? 'Disable notifications' : 'Enable notifications';
    
    if (settings.analysisCount > 0) {
      button.style.background = 'rgba(244, 67, 54, 0.4)';
      button.textContent = `🔔${settings.analysisCount}`;
    } else {
      button.style.background = '';
    }
  }
}

// Initialize notification settings display
getNotificationSettings().then(settings => {
  if (settings) {
    const statusText = settings.enabled ? '🔔 Notifications enabled' : '🔕 Notifications disabled';
    if (settings.analysisCount > 0) {
      console.log(`📊 ${settings.analysisCount} unread analysis updates`);
    }
    updateNotificationButton();
  }
});

// Auto-clear badge when popup is opened
clearNotificationBadge();

console.log('✅ popup.js initialization complete!');
console.log('🔧 Available commands:');
console.log('  📊 Session Management:');
console.log('    clearTodaysCache() - Clear today\'s sessions');
console.log('    getSessionStats() - Get session statistics'); 
console.log('    loadSessions() - Load today\'s sessions');
console.log('  🎮 Window Controls:');
console.log('    resetWindow() - Reset window size and position');
console.log('    toggleAnalysis() - Expand/collapse analysis area');
console.log('  🔔 Notifications:');
console.log('    toggleNotifications() - Enable/disable notifications');
console.log('    clearBadge() - Clear extension badge');
console.log('    getNotificationSettings() - View notification status');
console.log('  📍 Tab Tracking:');
console.log('    resetTabTracking() - Reset to current tab/page');
console.log('    checkTabChange() - Manually check for tab changes');
console.log('  📄 Analysis Prompt:');
console.log('    openPromptEditor() - Open prompt editor interface');
console.log('    reloadPrompt() - Reload prompt from storage/file');
console.log('    resetPromptToDefault() - Reset to default prompt');
console.log('  🎯 Prompt Methods:');
console.log('    togglePromptMethod() - Toggle between text and predefined prompts');
console.log('    setPromptMethod(\'text-prompt\') - Use custom text prompts');
console.log('    setPromptMethod(\'predefined-prompt\', \'prompt_id\') - Use OpenAI predefined prompts');
console.log('    getCurrentPromptMethod() - Get current prompt method info');
console.log('    getPromptConfig() - View all prompt configuration options');
console.log('  🎮 Click the toggle button (📄 Text / 🎯 AI) to switch prompt methods');
console.log('  🗑️ Clear Functions:');
console.log('    clearAllAnalyses() - Clear all analyses (with confirmation)');
console.log('    clearAllAnalysesQuick() - Clear all analyses (no confirmation)');
console.log('    clearTodaysCache() - Clear today\'s cached sessions only');
console.log('  📝 Click the edit button (📝) or use openPromptEditor() to customize instructions');
console.log('  ⌨️ Keyboard Shortcuts:');
console.log('    Ctrl/Cmd + R - Reset window');
console.log('    Double-click header - Reset window');
console.log('    Escape - Cancel drag/resize');
console.log('  🤖 Auto-refresh will stop if you switch tabs or navigate away');
console.log('  🗑️ Click the trash button or use clearAllAnalyses() to clear everything');