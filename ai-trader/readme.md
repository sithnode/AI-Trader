# AI Chart Analyzer - Chrome Extension

A powerful Chrome extension that uses AI vision models to analyze stock and futures charts in real-time, providing live trading recommendations.

## 🌟 Features

- **Multiple LLM Support**: Choose from Anthropic Claude, OpenAI GPT, Google Gemini, OpenRouter, or your custom API
- **Real-time Analysis**: Capture and analyze charts with a single click
- **Auto-Refresh**: Set automatic intervals (30s, 1m, 5m) for continuous monitoring
- **Comprehensive Insights**: Get trend analysis, support/resistance levels, trading recommendations, and risk assessments
- **Trading Platform Compatible**: Works with TradingView, Webull, Robinhood, and more

## 📋 Prerequisites

- Google Chrome browser
- API key from one of the supported providers:
  - [Anthropic](https://console.anthropic.com/) - Claude API
  - [OpenAI](https://platform.openai.com/) - GPT-4 API
  - [Google AI Studio](https://makersuite.google.com/app/apikey) - Gemini API
  - [OpenRouter](https://openrouter.ai/) - Multi-model access
  - Or your own custom API endpoint

## 🚀 Installation

1. **Download the extension files**
   - Create a folder named `ai-chart-analyzer`
   - Save all the files in this folder:
     - `manifest.json`
     - `popup.html`
     - `popup.js`
     - `content.js`
     - `background.js`

2. **Create placeholder icons**
   - Create three simple icon images (or use any PNG images):
     - `icon16.png` (16x16 pixels)
     - `icon48.png` (48x48 pixels)
     - `icon128.png` (128x128 pixels)
   - You can generate these at [favicon.io](https://favicon.io/) or use any image editor

3. **Load the extension in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked"
   - Select the `ai-chart-analyzer` folder
   - The extension should now appear in your extensions list

## ⚙️ Configuration

1. **Click the extension icon** in your Chrome toolbar
2. **Select your LLM provider** from the dropdown:
   - **Anthropic Claude**: Best for detailed analysis and reasoning
   - **OpenAI GPT**: Strong multimodal capabilities
   - **Google Gemini**: Fast and efficient
   - **OpenRouter**: Access to multiple models
   - **Custom**: Use your own API endpoint

3. **Enter your API key**

4. **Specify the model name**:
   - Anthropic: `claude-sonnet-4-20250514` or `claude-opus-4-20250514`
   - OpenAI: `gpt-4o` or `gpt-4-turbo`
   - Google: `gemini-2.0-flash-exp` or `gemini-1.5-pro`
   - OpenRouter: `anthropic/claude-sonnet-4` or any available model
   - Custom: Your model identifier

5. **For custom APIs**: Enter your API endpoint URL

6. **Click "Save Configuration"**

## 📊 Usage

### Basic Analysis
1. Navigate to any stock/futures charting website (TradingView, Webull, etc.)
2. Open the extension popup
3. Click "📸 Capture & Analyze Chart"
4. Wait for the AI to analyze the chart
5. View the trading recommendations

### Auto-Refresh Mode
1. Select an interval: 30s, 1m, or 5m
2. The extension will automatically capture and analyze the chart at the specified interval
3. Click "Off" to stop auto-refresh

### Reading Recommendations
Each analysis includes:
- **Current Trend**: Market direction (bullish/bearish)
- **Support/Resistance Levels**: Key price points
- **Technical Indicators**: Observable patterns
- **Trading Recommendation**: BUY/SELL/HOLD with entry/exit points
- **Confidence Level**: How confident the AI is in its analysis
- **Risk Factors**: What could invalidate the analysis

## 🔧 Supported LLM Providers

### Anthropic Claude
- **API Key**: Get from [console.anthropic.com](https://console.anthropic.com/)
- **Recommended Models**: 
  - `claude-sonnet-4-20250514` (best balance)
  - `claude-opus-4-20250514` (most capable)
- **Pricing**: See [Anthropic pricing](https://www.anthropic.com/pricing)

### OpenAI GPT
- **API Key**: Get from [platform.openai.com](https://platform.openai.com/)
- **Recommended Models**:
  - `gpt-4o` (vision-capable)
  - `gpt-4-turbo` (also vision-capable)
- **Pricing**: See [OpenAI pricing](https://openai.com/pricing)

### Google Gemini
- **API Key**: Get from [AI Studio](https://makersuite.google.com/app/apikey)
- **Recommended Models**:
  - `gemini-2.0-flash-exp` (fast, experimental)
  - `gemini-1.5-pro` (high quality)
- **Pricing**: Generous free tier available

### OpenRouter
- **API Key**: Get from [openrouter.ai](https://openrouter.ai/keys)
- **Recommended Models**:
  - `anthropic/claude-sonnet-4`
  - `openai/gpt-4o`
  - Many others available
- **Pricing**: Pay-per-use, varies by model

### Custom API
- Must be OpenAI-compatible format
- Endpoint should accept POST requests with JSON body
- Response should contain `choices[0].message.content` or similar

## 🛡️ Security & Privacy

- API keys are stored locally in Chrome's storage (encrypted by Chrome)
- Screenshots are sent directly to your chosen LLM provider
- No data is stored on external servers (except by your LLM provider)
- All API calls are made directly from your browser

## ⚠️ Disclaimer

**IMPORTANT**: This tool is for informational purposes only. The AI's trading recommendations should NOT be considered financial advice. Always:
- Do your own research
- Consult with financial advisors
- Understand the risks of trading
- Never trade with money you can't afford to lose

The accuracy of AI analysis depends on:
- Chart quality and visibility
- Model capabilities
- Market conditions
- Available technical indicators

## 🐛 Troubleshooting

### "API request failed" error
- Verify your API key is correct
- Check that you have sufficient credits/quota
- Ensure the model name is spelled correctly
- For custom APIs, verify the endpoint URL

### Extension not capturing charts
- Refresh the trading page
- Ensure charts are visible on screen
- Try clicking directly on the chart area first

### Analysis seems incorrect
- Ensure the chart is fully visible in the browser window
- Try a different model or provider
- Verify chart timeframe and indicators are visible

### Auto-refresh not working
- Check that you've saved your API configuration
- Ensure you have an active internet connection
- Check Chrome's developer console for errors

## 📝 File Structure

```
ai-chart-analyzer/
├── manifest.json          # Extension configuration
├── popup.html            # Extension UI
├── popup.js              # Main logic and API calls
├── content.js            # Chart detection (future use)
├── background.js         # Service worker
├── icon16.png           # Small icon
├── icon48.png           # Medium icon
└── icon128.png          # Large icon
```

## 🔄 Updates & Improvements

Future enhancements could include:
- Historical analysis tracking
- Multiple chart comparison
- Custom prompt templates
- Export recommendations to CSV
- Integration with trading platforms
- Backtesting capabilities

## 📄 License

This project is provided as-is for educational purposes. Use at your own risk.

## 🤝 Contributing

Feel free to fork and improve this extension. Some ideas:
- Add more LLM providers
- Improve chart detection
- Add technical indicator overlays
- Create better prompts for specific trading strategies

---

**Happy Trading! 📈💰**

*Remember: Past performance does not guarantee future results.*