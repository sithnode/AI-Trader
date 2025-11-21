// Debug version with console logging
console.log('🚀 popup.js loaded!');

let autoRefreshInterval = null;
let currentInterval = 30;

// Provider configurations
const providerConfigs = {
  anthropic: {
    name: 'Anthropic Claude',
    defaultModel: 'claude-sonnet-4-20250514',
    info: 'Anthropic Claude: State-of-the-art vision and reasoning',
    endpoint: 'https://api.anthropic.com/v1/messages'
  },
  openai: {
    name: 'OpenAI GPT',
    defaultModel: 'gpt-4o',
    info: 'OpenAI GPT-4: Advanced vision model with strong multimodal capabilities',
    endpoint: 'https://api.openai.com/v1/chat/completions'
  },
  google: {
    name: 'Google Gemini',
    defaultModel: 'gemini-2.0-flash-exp',
    info: 'Google Gemini: Fast and efficient multimodal AI',
    endpoint: 'https://generativelanguage.googleapis.com/v1/models'
  },
  openrouter: {
    name: 'OpenRouter',
    defaultModel: 'anthropic/claude-sonnet-4',
    info: 'OpenRouter: Access multiple AI models through one API',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions'
  },
  custom: {
    name: 'Custom API',
    defaultModel: '',
    info: 'Custom: Configure your own API endpoint',
    endpoint: ''
  }
};

console.log('📋 Provider configs loaded:', Object.keys(providerConfigs));

// Load saved configuration
console.log('💾 Loading saved configuration...');
chrome.storage.local.get(['llmProvider', 'apiKey', 'modelName', 'apiEndpoint', 'refreshInterval'], (result) => {
  console.log('✅ Loaded config:', result);
  
  if (result.llmProvider) {
    document.getElementById('llmProvider').value = result.llmProvider;
    updateProviderUI(result.llmProvider);
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
    showStatus('Configuration loaded - Ready to analyze', 'success');
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
  btn.addEventListener('click', (e) => {
    const interval = parseInt(e.target.dataset.interval);
    console.log('⏱️ Interval button clicked:', interval);
    currentInterval = interval;
    chrome.storage.local.set({ refreshInterval: interval });
    updateIntervalButtons();
    
    if (interval > 0) {
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

function startAutoRefresh() {
  stopAutoRefresh();
  
  if (currentInterval > 0) {
    console.log('▶️ Starting auto-refresh:', currentInterval, 'seconds');
    autoRefreshInterval = setInterval(async () => {
      console.log('🔄 Auto-refresh triggered');
      await captureAndAnalyze();
    }, currentInterval * 1000);
    
    showStatus(`Auto-refresh enabled (${currentInterval}s)`, 'info');
  }
}

function stopAutoRefresh() {
  if (autoRefreshInterval) {
    console.log('⏸️ Stopping auto-refresh');
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
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
            text: getAnalysisPrompt()
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
            text: getAnalysisPrompt()
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
          { text: getAnalysisPrompt() },
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
            text: getAnalysisPrompt()
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
            text: getAnalysisPrompt()
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

function getAnalysisPrompt() {
  return `Analyze this stock/futures trading chart. Provide:

1. **Current Trend**: What's the overall market direction?
2. **Key Support/Resistance Levels**: Identify critical price levels
3. **Technical Indicators**: What do you observe (if visible)?
4. **Trading Recommendation**: 
   - Action: BUY, SELL, or HOLD
   - Entry point (if applicable)
   - Stop loss suggestion
   - Target price
   - Risk/Reward ratio
5. **Confidence Level**: Rate your confidence (Low/Medium/High)
6. **Key Risks**: What could invalidate this analysis?

Be specific and actionable. Format your response clearly.`;
}

function displayRecommendation(analysis, provider) {
  console.log('📊 Displaying recommendation');
  const container = document.getElementById('recommendations');
  const timestamp = new Date().toLocaleTimeString();
  const providerName = providerConfigs[provider].name;
  
  const item = document.createElement('div');
  item.className = 'recommendation-item';
  item.innerHTML = `
    <div class="timestamp">⏰ ${timestamp} | 🤖 ${providerName}</div>
    <div style="white-space: pre-wrap;">${analysis}</div>
  `;
  
  container.insertBefore(item, container.firstChild);
  
  // Keep only last 5 recommendations
  while (container.children.length > 5) {
    container.removeChild(container.lastChild);
  }
  console.log('✅ Recommendation displayed');
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

// Auto-start refresh if enabled
chrome.storage.local.get(['refreshInterval'], (result) => {
  if (result.refreshInterval && result.refreshInterval > 0) {
    console.log('🔄 Auto-starting refresh');
    startAutoRefresh();
  }
});

console.log('✅ popup.js initialization complete!');