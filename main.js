/**
 * STATION.11 — Tactical Stock Comparison & Momentum Analytics
 * Pure Vanilla TypeScript/JavaScript Engine
 */

// Global state
let stocks = [];
let targetDate = '';
let twelvedataKey = '';

// Default stock roster (9 stocks to leave space for up to 11 limit)
const DEFAULT_STOCKS = [
  { ticker: 'AAPL', name: 'Apple Inc.', sector: 'Technology', basePrice: 175.50 },
  { ticker: 'MSFT', name: 'Microsoft Corp.', sector: 'Technology', basePrice: 415.20 },
  { ticker: 'NVDA', name: 'NVIDIA Corp.', sector: 'Technology', basePrice: 125.80 },
  { ticker: 'GOOGL', name: 'Alphabet Inc.', sector: 'Communication Services', basePrice: 168.40 },
  { ticker: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Cyclical', basePrice: 180.10 },
  { ticker: 'META', name: 'Meta Platforms Inc.', sector: 'Communication Services', basePrice: 485.30 },
  { ticker: 'TSLA', name: 'Tesla, Inc.', sector: 'Consumer Cyclical', basePrice: 195.20 },
  { ticker: 'LLY', name: 'Eli Lilly & Co.', sector: 'Healthcare', basePrice: 760.50 },
  { ticker: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Financial Services', basePrice: 198.60 }
];

// Seedable pseudo-random generator to make historical data deterministic for a given stock + date
function createSeededRandom(seedStr) {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = seedStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  return function() {
    const x = Math.sin(hash++) * 10000;
    return x - Math.floor(x);
  };
}

// Generate realistic 50-day daily price history to compute precise EMA/MACD values
function generateStockHistory(ticker, basePrice, dateStr) {
  const rand = createSeededRandom(ticker + dateStr);
  const history = [];
  
  let currentClose = basePrice;
  // Create 50 trading days walking backward
  for (let i = 49; i >= 0; i--) {
    const dailyChangePercent = (rand() - 0.49) * 0.025; // deterministic walk with tiny upward bias
    const prevClose = currentClose / (1 + dailyChangePercent);
    
    const open = prevClose * (1 + (rand() - 0.5) * 0.004);
    const close = currentClose;
    
    const minOC = Math.min(open, close);
    const maxOC = Math.max(open, close);
    
    const high = maxOC * (1 + rand() * 0.012);
    const low = minOC * (1 - rand() * 0.012);
    
    history.push({
      date: `Day-${i}`,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2))
    });
    
    currentClose = prevClose;
  }
  
  // Re-align so that history is in chronological order
  return history.reverse();
}

// Technical Analysis: Calculate EMA
function calculateEMA(prices, period) {
  const k = 2 / (period + 1);
  const ema = [];
  let prevEma = prices[0];
  ema.push(prevEma);
  
  for (let i = 1; i < prices.length; i++) {
    const val = prices[i] * k + prevEma * (1 - k);
    ema.push(val);
    prevEma = val;
  }
  return ema;
}

// Technical Analysis: Calculate MACD
function calculateMACD(history) {
  const closes = history.map(h => h.close);
  if (closes.length < 35) return { macd: [], signal: [], hist: [] };
  
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  
  const macdLine = [];
  for (let i = 0; i < closes.length; i++) {
    macdLine.push(ema12[i] - ema26[i]);
  }
  
  const signalLine = calculateEMA(macdLine, 9);
  
  const histogram = [];
  for (let i = 0; i < closes.length; i++) {
    histogram.push(macdLine[i] - signalLine[i]);
  }
  
  return {
    macd: macdLine,
    signal: signalLine,
    hist: histogram
  };
}

// Render dynamic OHLC Candlestick Sparkline
function renderOHLCSparkline(history15) {
  const width = 140;
  const height = 32;
  const padding = 3;
  
  const highs = history15.map(h => h.high);
  const lows = history15.map(h => h.low);
  const globalMax = Math.max(...highs);
  const globalMin = Math.min(...lows);
  const priceRange = (globalMax - globalMin) || 1;
  
  const scaleY = (val) => {
    return height - padding - ((val - globalMin) / priceRange) * (height - padding * 2);
  };
  
  const colWidth = width / 15;
  let svgs = `<svg width="${width}" height="${height}" class="mx-auto overflow-visible">`;
  
  history15.forEach((day, index) => {
    const x = index * colWidth + colWidth / 2;
    const yHigh = scaleY(day.high);
    const yLow = scaleY(day.low);
    const yOpen = scaleY(day.open);
    const yClose = scaleY(day.close);
    
    const isBullish = day.close >= day.open;
    const strokeColor = isBullish ? '#10b981' : '#f43f5e'; // emerald-500 or rose-500
    
    // Draw Wick (High to Low)
    svgs += `<line x1="${x}" y1="${yHigh}" x2="${x}" y2="${yLow}" stroke="${strokeColor}" stroke-width="1" />`;
    
    // Draw Body (Open to Close)
    const bodyHeight = Math.max(Math.abs(yOpen - yClose), 1.5);
    const yBody = Math.min(yOpen, yClose);
    const bodyWidth = Math.max(colWidth - 2.5, 4);
    
    svgs += `<rect x="${x - bodyWidth / 2}" y="${yBody}" width="${bodyWidth}" height="${bodyHeight}" fill="${strokeColor}" rx="0.5" />`;
  });
  
  svgs += `</svg>`;
  return svgs;
}

// Render dynamic MACD Momentum Sparkline
function renderMACDSparkline(macd15, signal15, hist15) {
  const width = 140;
  const height = 32;
  const padding = 3;
  
  const allVals = [...macd15, ...signal15, ...hist15];
  const globalMax = Math.max(...allVals);
  const globalMin = Math.min(...allVals);
  const valRange = (globalMax - globalMin) || 1;
  
  const scaleY = (val) => {
    return height - padding - ((val - globalMin) / valRange) * (height - padding * 2);
  };
  
  const zeroY = scaleY(0);
  const colWidth = width / 15;
  let svgs = `<svg width="${width}" height="${height}" class="mx-auto overflow-visible">`;
  
  // 1. Draw Histogram Bars (Background)
  hist15.forEach((hist, index) => {
    const x = index * colWidth + colWidth / 2;
    const yHist = scaleY(hist);
    const barWidth = Math.max(colWidth - 3, 2.5);
    
    const isPositive = hist >= 0;
    const barColor = isPositive ? '#10b981' : '#f43f5e';
    
    const yStart = isPositive ? yHist : zeroY;
    const hBar = Math.max(Math.abs(zeroY - yHist), 1);
    
    svgs += `<rect x="${x - barWidth / 2}" y="${yStart}" width="${barWidth}" height="${hBar}" fill="${barColor}" fill-opacity="0.35" rx="0.5" />`;
  });
  
  // 2. Draw MACD and Signal Lines
  let macdPath = '';
  let signalPath = '';
  
  for (let i = 0; i < 15; i++) {
    const x = i * colWidth + colWidth / 2;
    const yM = scaleY(macd15[i]);
    const yS = scaleY(signal15[i]);
    
    if (i === 0) {
      macdPath += `M ${x} ${yM}`;
      signalPath += `M ${x} ${yS}`;
    } else {
      macdPath += ` L ${x} ${yM}`;
      signalPath += ` L ${x} ${yS}`;
    }
  }
  
  svgs += `<path d="${macdPath}" fill="none" stroke="#38bdf8" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" />`;
  svgs += `<path d="${signalPath}" fill="none" stroke="#f59e0b" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" />`;
  
  svgs += `</svg>`;
  return svgs;
}

// Fetch live stock data using Twelve Data API
async function fetchTwelveData(tickers, apiKey) {
  try {
    const tickerParam = tickers.join(',');
    const url = `https://api.twelvedata.com/time_series?symbol=${tickerParam}&interval=1day&outputsize=50&apikey=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('API Response Error');
    
    const json = await response.json();
    if (json.status === 'error') throw new Error(json.message);
    
    return json;
  } catch (error) {
    console.error('Twelve Data Fetch Failed:', error);
    return null;
  }
}

// Render active stock list to the dashboard table
async function renderDashboard() {
  const container = document.getElementById('stocks-list');
  const activeCountLabel = document.getElementById('active-count');
  container.innerHTML = '';
  
  activeCountLabel.textContent = stocks.length;
  
  // Show/Hide Add button based on 11 stock limit
  const showAddBtn = document.getElementById('show-add-form-btn');
  if (stocks.length >= 11) {
    showAddBtn.disabled = true;
    showAddBtn.classList.add('opacity-40', 'cursor-not-allowed');
    showAddBtn.innerHTML = `
      <svg class="w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <span>Limit of 11 Stocks Reached</span>
    `;
  } else {
    showAddBtn.disabled = false;
    showAddBtn.classList.remove('opacity-40', 'cursor-not-allowed');
    showAddBtn.innerHTML = `
      <svg class="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
      <span>Add Stock <span class="text-zinc-500">(Up to 11)</span></span>
    `;
  }

  if (stocks.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="6" class="py-12 text-center text-zinc-500 text-sm font-mono">
          No stocks currently listed. Click "Add Stock" below to start your matrix.
        </td>
      </tr>
    `;
    return;
  }

  // Attempt to fetch Twelve Data if API key is provided
  let liveData = null;
  const statusDot = document.getElementById('api-status-dot');
  
  if (twelvedataKey) {
    statusDot.className = "w-2 h-2 rounded-full bg-yellow-500 animate-pulse";
    const tickers = stocks.map(s => s.ticker);
    liveData = await fetchTwelveData(tickers, twelvedataKey);
    
    if (liveData) {
      statusDot.className = "w-2 h-2 rounded-full bg-emerald-500";
    } else {
      statusDot.className = "w-2 h-2 rounded-full bg-rose-500";
      // Display visual toast notice
      console.warn("Falling back to Station.11 ultra-high fidelity procedural model.");
    }
  } else {
    statusDot.className = "w-2 h-2 rounded-full bg-zinc-600";
  }

  stocks.forEach((stock, idx) => {
    let history = [];
    let isLive = false;

    // Check if live API has returned values for this ticker
    if (liveData) {
      const tickerData = liveData[stock.ticker] || (liveData.values && liveData.meta && liveData.meta.symbol === stock.ticker ? liveData : null);
      if (tickerData && tickerData.values) {
        isLive = true;
        // Map Twelve Data array chronologically
        history = tickerData.values.map(v => ({
          date: v.datetime,
          open: parseFloat(v.open),
          high: parseFloat(v.high),
          low: parseFloat(v.low),
          close: parseFloat(v.close)
        })).reverse(); // Twelve data is reverse, chronological is needed
      }
    }

    // Fallback to high-quality simulated data
    if (history.length < 50) {
      history = generateStockHistory(stock.ticker, stock.basePrice, targetDate);
    }

    // Slice last 15 days for plotting & calculating
    const history15 = history.slice(-15);
    const lastDay = history15[history15.length - 1] || { close: stock.basePrice, open: stock.basePrice };
    const prevDay = history15[history15.length - 2] || lastDay;
    
    const change = lastDay.close - prevDay.close;
    const changePercent = (change / prevDay.close) * 100;
    
    // Calculate MACD values
    const { macd, signal, hist } = calculateMACD(history);
    const macd15 = macd.slice(-15);
    const signal15 = signal.slice(-15);
    const hist15 = hist.slice(-15);

    // SVG elements
    const ohlcSparkline = renderOHLCSparkline(history15);
    const macdSparkline = renderMACDSparkline(macd15, signal15, hist15);

    const row = document.createElement('tr');
    row.className = "hover:bg-zinc-900/60 transition-all border-b border-zinc-800/40 text-sm align-middle";
    row.id = `stock-row-${stock.ticker}`;
    
    row.innerHTML = `
      <td class="py-4 px-6">
        <div class="flex flex-col">
          <div class="flex items-center gap-2">
            <span class="font-mono font-bold text-white tracking-wider">${stock.ticker}</span>
            ${isLive ? `<span class="bg-emerald-950 text-emerald-400 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border border-emerald-800/50">LIVE</span>` : ''}
          </div>
          <span class="text-xs text-zinc-400 font-medium">${stock.name}</span>
        </div>
      </td>
      <td class="py-4 px-4 hidden md:table-cell">
        <span class="inline-flex items-center bg-zinc-800/80 text-zinc-300 text-xs px-2.5 py-0.5 rounded-full border border-zinc-700/50">
          ${stock.sector}
        </span>
      </td>
      <td class="py-4 px-4 text-right">
        <div class="flex flex-col items-end">
          <span class="font-mono font-bold text-white text-sm">$${lastDay.close.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
          <span class="text-[11px] font-mono flex items-center gap-0.5 ${change >= 0 ? 'text-emerald-500' : 'text-rose-500'}">
            ${change >= 0 ? '+' : ''}${changePercent.toFixed(2)}%
          </span>
        </div>
      </td>
      <td class="py-4 px-4 text-center">
        <div class="inline-block py-1">
          ${ohlcSparkline}
        </div>
      </td>
      <td class="py-4 px-4 text-center">
        <div class="inline-block py-1">
          ${macdSparkline}
        </div>
      </td>
      <td class="py-4 px-6 text-right">
        <button data-ticker="${stock.ticker}" class="exclude-stock-btn p-2 rounded-lg bg-zinc-900 hover:bg-rose-950/40 text-zinc-500 hover:text-rose-400 border border-zinc-800 hover:border-rose-900/40 transition-all cursor-pointer shadow-sm group">
          <!-- Minus Icon -->
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12h-15" />
          </svg>
        </button>
      </td>
    `;
    container.appendChild(row);
  });

  // Attach event listeners to all dynamic exclude buttons
  document.querySelectorAll('.exclude-stock-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const ticker = btn.getAttribute('data-ticker');
      excludeStock(ticker);
    });
  });
}

// Save active stocks list to localStorage
function saveToStorage() {
  localStorage.setItem('station11_stocks', JSON.stringify(stocks));
}

// Remove stock from the active roster
function excludeStock(ticker) {
  stocks = stocks.filter(s => s.ticker !== ticker);
  saveToStorage();
  renderDashboard();
}

// Setup Event Handlers
function initializeApp() {
  // Load target date (default to today)
  const dateInput = document.getElementById('target-date');
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  targetDate = `${year}-${month}-${day}`;
  dateInput.value = targetDate;

  // Load from local storage or set defaults
  const storedStocks = localStorage.getItem('station11_stocks');
  if (storedStocks) {
    try {
      stocks = JSON.parse(storedStocks);
    } catch (e) {
      stocks = [...DEFAULT_STOCKS];
    }
  } else {
    stocks = [...DEFAULT_STOCKS];
  }

  // Load API key if stored
  const savedKey = localStorage.getItem('twelvedata_apikey');
  if (savedKey) {
    twelvedataKey = savedKey;
    document.getElementById('twelvedata-key').value = savedKey;
  }

  // Bind Events
  dateInput.addEventListener('change', (e) => {
    targetDate = e.target.value;
    renderDashboard();
  });

  // API Drawer toggle
  const toggleApiBtn = document.getElementById('toggle-api-btn');
  const apiDrawer = document.getElementById('api-drawer');
  toggleApiBtn.addEventListener('click', () => {
    apiDrawer.classList.toggle('hidden');
  });

  // Save API Key
  const saveKeyBtn = document.getElementById('save-api-key');
  const keyInput = document.getElementById('twelvedata-key');
  saveKeyBtn.addEventListener('click', () => {
    twelvedataKey = keyInput.value.trim();
    localStorage.setItem('twelvedata_apikey', twelvedataKey);
    apiDrawer.classList.add('hidden');
    renderDashboard();
  });

  // Show Add Stock form
  const showAddBtn = document.getElementById('show-add-form-btn');
  const addTriggerRow = document.getElementById('add-trigger-row');
  const addForm = document.getElementById('add-stock-form');
  
  showAddBtn.addEventListener('click', () => {
    if (stocks.length >= 11) return;
    addTriggerRow.classList.add('hidden');
    addForm.classList.remove('hidden');
    document.getElementById('new-ticker').focus();
  });

  // Cancel Add form
  const cancelAddBtn = document.getElementById('cancel-add-btn');
  cancelAddBtn.addEventListener('click', () => {
    addForm.classList.add('hidden');
    addTriggerRow.classList.remove('hidden');
    addForm.reset();
  });

  // Reset defaults
  const resetDefaultsBtn = document.getElementById('reset-defaults-btn');
  resetDefaultsBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to restore the default stock roster? This resets any added or excluded stocks.')) {
      stocks = [...DEFAULT_STOCKS];
      saveToStorage();
      renderDashboard();
    }
  });

  // Form Submit (Add stock)
  addForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (stocks.length >= 11) {
      alert('Maximum limit of 11 stocks reached. Exclude some before adding new ones.');
      return;
    }

    const ticker = document.getElementById('new-ticker').value.trim().toUpperCase();
    const name = document.getElementById('new-name').value.trim();
    const sector = document.getElementById('new-sector').value;
    const basePrice = parseFloat(document.getElementById('new-price').value);

    // Duplicate Check
    if (stocks.some(s => s.ticker === ticker)) {
      alert(`A stock with ticker ${ticker} is already active in your matrix.`);
      return;
    }

    stocks.push({ ticker, name, sector, basePrice });
    saveToStorage();
    
    // Reset and close form
    addForm.reset();
    addForm.classList.add('hidden');
    addTriggerRow.classList.remove('hidden');
    
    renderDashboard();
  });

  // Initial Draw
  renderDashboard();
}

// Launch Station.11
document.addEventListener('DOMContentLoaded', initializeApp);
