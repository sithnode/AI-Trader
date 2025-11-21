// Content script for detecting chart elements
// This can be enhanced to specifically target chart canvases on popular trading platforms

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'detectChart') {
    const chartInfo = detectChartOnPage();
    sendResponse(chartInfo);
  }
  return true;
});

function detectChartOnPage() {
  // Look for common chart elements on popular trading platforms
  const chartSelectors = [
    'canvas',  // Most charts use canvas
    '.chart-container',
    '#chart',
    '[class*="chart"]',
    '[id*="chart"]',
    '.tradingview-widget-container'
  ];
  
  let detectedCharts = [];
  
  chartSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 200 && rect.height > 100) {
        detectedCharts.push({
          selector: selector,
          width: rect.width,
          height: rect.height,
          position: { top: rect.top, left: rect.left }
        });
      }
    });
  });
  
  return {
    found: detectedCharts.length > 0,
    charts: detectedCharts,
    platform: detectTradingPlatform()
  };
}

function detectTradingPlatform() {
  const url = window.location.hostname;
  
  if (url.includes('tradingview.com')) return 'TradingView';
  if (url.includes('thinkorswim')) return 'ThinkorSwim';
  if (url.includes('webull')) return 'Webull';
  if (url.includes('robinhood')) return 'Robinhood';
  if (url.includes('etrade')) return 'E*TRADE';
  if (url.includes('schwab')) return 'Charles Schwab';
  if (url.includes('fidelity')) return 'Fidelity';
  if (url.includes('interactive')) return 'Interactive Brokers';
  
  return 'Unknown';
}

// Add a visual indicator when extension is active (optional)
function addVisualIndicator() {
  const indicator = document.createElement('div');
  indicator.id = 'ai-chart-analyzer-indicator';
  indicator.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 8px 15px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: bold;
    z-index: 10000;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
  indicator.textContent = '📈 AI Analyzer Active';
  document.body.appendChild(indicator);
  
  // Remove after 3 seconds
  setTimeout(() => {
    indicator.remove();
  }, 3000);
}

// Uncomment to show indicator on page load
// addVisualIndicator();