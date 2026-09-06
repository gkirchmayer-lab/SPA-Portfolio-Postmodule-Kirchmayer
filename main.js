/**
 * STATION.11 — Tactical Stock Comparison & Momentum Analytics
 * Pure Vanilla TypeScript/JavaScript Engine
 */

// Global state
let stocks = [];
let targetDate = '';
let selectedTimeline = '1m'; // Default to 1 Month
let manualStartDate = '';
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

// Translate current timeline settings to display days
function getTimelineDetails() {
  const target = new Date(targetDate);
  if (isNaN(target.getTime())) {
    return { daysCount: 21, label: '1 Month' };
  }
  
  let label = '1 Month';
  let daysCount = 21; // approx trading days
  
  switch (selectedTimeline) {
    case '1w':
      label = '1 Week';
      daysCount = 5;
      break;
    case '1m':
      label = '1 Month';
      daysCount = 21;
      break;
    case '1q':
      label = '1 Quarter';
      daysCount = 63;
      break;
    case '1y':
      label = '1 Year';
      daysCount = 252;
      break;
    case '5y':
      label = '5 Years';
      daysCount = 1260;
      break;
    case 'ytd':
      label = 'YTD';
      const yearStart = new Date(target.getFullYear(), 0, 1);
      const diffMs = target.getTime() - yearStart.getTime();
      const calendarDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      daysCount = Math.max(5, Math.round(calendarDays * 5 / 7));
      break;
    case 'manual':
      label = 'Manual';
      if (manualStartDate) {
        const manualStart = new Date(manualStartDate);
        if (!isNaN(manualStart.getTime()) && manualStart.getTime() < target.getTime()) {
          const diffMsManual = target.getTime() - manualStart.getTime();
          const calDays = Math.max(1, Math.ceil(diffMsManual / (1000 * 60 * 60 * 24)));
          daysCount = Math.max(5, Math.round(calDays * 5 / 7));
          label = `Custom Range`;
        }
      }
      break;
  }
  
  return { daysCount, label };
}

// Generate realistic price history to compute precise EMA/MACD values
function generateStockHistory(ticker, basePrice, dateStr, displayDays) {
  const rand = createSeededRandom(ticker + dateStr);
  const history = [];
  const totalDays = displayDays + 50; // 50 extra days lookback for MACD stabilization
  
  let currentClose = basePrice;
  // Create trading days walking backward
  for (let i = totalDays - 1; i >= 0; i--) {
    const dailyChangePercent = (rand() - 0.49) * 0.024; // deterministic walk
    const prevClose = currentClose / (1 + dailyChangePercent);
    
    const open = prevClose * (1 + (rand() - 0.5) * 0.005);
    const close = currentClose;
    
    const minOC = Math.min(open, close);
    const maxOC = Math.max(open, close);
    
    const high = maxOC * (1 + rand() * 0.015);
    const low = minOC * (1 - rand() * 0.015);
    
    // Calculate calendar aligned date back in time
    const dateObj = new Date(dateStr);
    dateObj.setDate(dateObj.getDate() - i);
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    
    history.push({
      date: `${yyyy}-${mm}-${dd}`,
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

// Render dynamic OHLC Candlestick Sparkline representing any timeline
function renderOHLCSparkline(history, displayDays) {
  const width = 160;
  const height = 36;
  const padding = 3;
  
  const displayHistory = history.slice(-displayDays);
  const n = displayHistory.length;
  
  const highs = displayHistory.map(h => h.high);
  const lows = displayHistory.map(h => h.low);
  const globalMax = Math.max(...highs);
  const globalMin = Math.min(...lows);
  const priceRange = (globalMax - globalMin) || 1;
  
  const scaleY = (val) => {
    return height - padding - ((val - globalMin) / priceRange) * (height - padding * 2);
  };
  
  const colWidth = width / n;
  let svgs = `<svg width="${width}" height="${height}" class="mx-auto overflow-visible">`;
  
  displayHistory.forEach((day, index) => {
    const x = index * colWidth + colWidth / 2;
    const yHigh = scaleY(day.high);
    const yLow = scaleY(day.low);
    const yOpen = scaleY(day.open);
    const yClose = scaleY(day.close);
    
    const isBullish = day.close >= day.open;
    const strokeColor = isBullish ? '#10b981' : '#f43f5e'; // emerald-500 or rose-500
    
    // Wick width adjusts based on data density
    const wickWidth = n > 100 ? 0.5 : 1;
    svgs += `<line x1="${x}" y1="${yHigh}" x2="${x}" y2="${yLow}" stroke="${strokeColor}" stroke-width="${wickWidth}" />`;
    
    // Body width scales based on density
    let bodyWidth = colWidth - 1.5;
    if (n > 50) bodyWidth = colWidth - 0.8;
    if (n > 150) bodyWidth = colWidth - 0.2;
    bodyWidth = Math.max(bodyWidth, 0.8);
    
    const bodyHeight = Math.max(Math.abs(yOpen - yClose), 1.2);
    const yBody = Math.min(yOpen, yClose);
    
    svgs += `<rect x="${x - bodyWidth / 2}" y="${yBody}" width="${bodyWidth}" height="${bodyHeight}" fill="${strokeColor}" rx="0.3" />`;
  });
  
  svgs += `</svg>`;
  return svgs;
}

// Render dynamic MACD Momentum Sparkline representing any timeline
function renderMACDSparkline(macd, signal, hist, displayDays) {
  const width = 160;
  const height = 36;
  const padding = 3;
  
  const mDisp = macd.slice(-displayDays);
  const sDisp = signal.slice(-displayDays);
  const hDisp = hist.slice(-displayDays);
  const n = mDisp.length;
  
  const allVals = [...mDisp, ...sDisp, ...hDisp];
  const globalMax = Math.max(...allVals);
  const globalMin = Math.min(...allVals);
  const valRange = (globalMax - globalMin) || 1;
  
  const scaleY = (val) => {
    return height - padding - ((val - globalMin) / valRange) * (height - padding * 2);
  };
  
  const zeroY = scaleY(0);
  const colWidth = width / n;
  let svgs = `<svg width="${width}" height="${height}" class="mx-auto overflow-visible">`;
  
  // 1. Draw Histogram Bars (Background)
  hDisp.forEach((histVal, index) => {
    const x = index * colWidth + colWidth / 2;
    const yHist = scaleY(histVal);
    
    let barWidth = colWidth - 1.5;
    if (n > 50) barWidth = colWidth - 0.8;
    if (n > 150) barWidth = colWidth - 0.2;
    barWidth = Math.max(barWidth, 0.8);
    
    const isPositive = histVal >= 0;
    const barColor = isPositive ? '#10b981' : '#f43f5e';
    
    const yStart = isPositive ? yHist : zeroY;
    const hBar = Math.max(Math.abs(zeroY - yHist), 0.8);
    
    svgs += `<rect x="${x - barWidth / 2}" y="${yStart}" width="${barWidth}" height="${hBar}" fill="${barColor}" fill-opacity="0.3" rx="0.2" />`;
  });
  
  // 2. Draw MACD and Signal Lines
  let macdPath = '';
  let signalPath = '';
  
  for (let i = 0; i < n; i++) {
    const x = i * colWidth + colWidth / 2;
    const yM = scaleY(mDisp[i]);
    const yS = scaleY(sDisp[i]);
    
    if (i === 0) {
      macdPath += `M ${x} ${yM}`;
      signalPath += `M ${x} ${yS}`;
    } else {
      macdPath += ` L ${x} ${yM}`;
      signalPath += ` L ${x} ${yS}`;
    }
  }
  
  const strokeW = n > 100 ? 0.8 : 1.25;
  svgs += `<path d="${macdPath}" fill="none" stroke="#38bdf8" stroke-width="${strokeW}" stroke-linecap="round" stroke-linejoin="round" />`;
  svgs += `<path d="${signalPath}" fill="none" stroke="#f59e0b" stroke-width="${strokeW}" stroke-linecap="round" stroke-linejoin="round" />`;
  
  svgs += `</svg>`;
  return svgs;
}

// Compute standard MACD signals as requested: buy, hold, sell, avoid
function calculateMACDSignal(hist) {
  const hToday = hist[hist.length - 1] || 0;
  const hYesterday = hist[hist.length - 2] || 0;
  const hTwoDaysAgo = hist[hist.length - 3] || 0;

  // Crossovers:
  // "crossed to green the day before" -> yesterday crossed positive, today stays green or today is positive
  const crossedToGreenYesterday = hYesterday > 0 && hTwoDaysAgo <= 0;
  const crossedToGreenToday = hToday > 0 && hYesterday <= 0;

  // "crossed to red the day before" -> yesterday crossed negative, today stays red or today is negative
  const crossedToRedYesterday = hYesterday < 0 && hTwoDaysAgo >= 0;
  const crossedToRedToday = hToday < 0 && hYesterday >= 0;

  let text = 'HOLD';
  let badgeClass = 'bg-zinc-800/80 text-emerald-400 border border-emerald-900/40';
  let desc = 'MACD in the green';
  let icon = `
    <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12h15" />
    </svg>
  `;

  if (crossedToGreenYesterday || crossedToGreenToday) {
    text = 'BUY';
    badgeClass = 'bg-emerald-500 text-black border border-emerald-400 font-extrabold shadow-md shadow-emerald-950/40';
    desc = 'Crossed to Green';
    icon = `
      <svg class="w-3.5 h-3.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
        <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l7.5-7.5 7.5 7.5m-15 6l7.5-7.5 7.5 7.5" />
      </svg>
    `;
  } else if (crossedToRedYesterday || crossedToRedToday) {
    text = 'SELL';
    badgeClass = 'bg-rose-500 text-black border border-rose-400 font-extrabold shadow-md shadow-rose-950/40';
    desc = 'Crossed to Red';
    icon = `
      <svg class="w-3.5 h-3.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 5.25l-7.5 7.5-7.5-7.5m15 6l-7.5 7.5-7.5-7.5" />
      </svg>
    `;
  } else if (hToday > 0) {
    text = 'HOLD';
    badgeClass = 'bg-emerald-950/20 text-emerald-400 border border-emerald-900/60';
    desc = 'MACD in the green';
    icon = `
      <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12h15" />
      </svg>
    `;
  } else {
    text = 'AVOID';
    badgeClass = 'bg-rose-950/20 text-rose-400 border border-rose-900/60';
    desc = 'MACD in the red';
    icon = `
      <svg class="w-3.5 h-3.5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    `;
  }

  return { text, badgeClass, desc, icon };
}

// Fetch live stock data using Twelve Data API
async function fetchTwelveData(tickers, apiKey, displayDays) {
  try {
    const tickerParam = tickers.join(',');
    const outputsize = Math.min(250, displayDays + 50); // limit request size for rate limits
    const url = `https://api.twelvedata.com/time_series?symbol=${tickerParam}&interval=1day&outputsize=${outputsize}&apikey=${apiKey}`;
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
        <td colspan="7" class="py-12 text-center text-zinc-500 text-sm font-mono">
          No stocks currently listed. Click "Add Stock" below to start your matrix.
        </td>
      </tr>
    `;
    return;
  }

  // Get active timeline details
  const { daysCount, label: timelineLabel } = getTimelineDetails();
  
  // Update table headers dynamically
  document.getElementById('ohlc-header').textContent = `OHLC Candlesticks (${timelineLabel})`;
  document.getElementById('macd-header').textContent = `MACD Momentum (${timelineLabel})`;

  // Attempt to fetch Twelve Data if API key is provided
  let liveData = null;
  const statusDot = document.getElementById('api-status-dot');
  
  if (twelvedataKey) {
    statusDot.className = "w-2 h-2 rounded-full bg-yellow-500 animate-pulse";
    const tickers = stocks.map(s => s.ticker);
    liveData = await fetchTwelveData(tickers, twelvedataKey, daysCount);
    
    if (liveData) {
      statusDot.className = "w-2 h-2 rounded-full bg-emerald-500";
    } else {
      statusDot.className = "w-2 h-2 rounded-full bg-rose-500";
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
        })).reverse();
      }
    }

    // Fallback to high-quality simulated data
    if (history.length < daysCount + 50) {
      history = generateStockHistory(stock.ticker, stock.basePrice, targetDate, daysCount);
    }

    // Slice display period
    const displayHistory = history.slice(-daysCount);
    const lastDay = displayHistory[displayHistory.length - 1] || { close: stock.basePrice, open: stock.basePrice };
    const prevDay = displayHistory[displayHistory.length - 2] || lastDay;
    
    const change = lastDay.close - prevDay.close;
    const changePercent = (change / prevDay.close) * 100;
    
    // Calculate MACD values over full sequence
    const { macd, signal, hist } = calculateMACD(history);
    
    // Calculate precise Action / Signal details
    const macdSig = calculateMACDSignal(hist);

    // SVG elements
    const ohlcSparkline = renderOHLCSparkline(history, daysCount);
    const macdSparkline = renderMACDSparkline(macd, signal, hist, daysCount);

    const row = document.createElement('tr');
    row.className = "hover:bg-zinc-900/60 transition-all border-b border-zinc-800/40 text-sm align-middle";
    row.id = `stock-row-${stock.ticker}`;
    
    row.innerHTML = `
      <td class="py-4 px-6">
        <div class="flex flex-col">
          <div class="flex items-center gap-2">
            <span class="font-mono font-bold text-white tracking-wider">${stock.ticker}</span>
            ${isLive ? `<span class="bg-emerald-950 text-emerald-400 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border border-emerald-800/50 animate-pulse">LIVE</span>` : ''}
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
      <td class="py-4 px-4 text-center">
        <div class="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono select-none ${macdSig.badgeClass}" title="${macdSig.desc}">
          ${macdSig.icon}
          <span>${macdSig.text}</span>
        </div>
      </td>
      <td class="py-4 px-4 text-center" id="fscore-cell-${stock.ticker}">
        <!-- Populated dynamically via progressive backend fetch -->
      </td>
      <td class="py-4 px-6 text-right">
        <button data-ticker="${stock.ticker}" class="exclude-stock-btn p-2 rounded-lg bg-zinc-900 hover:bg-rose-950/40 text-zinc-500 hover:text-rose-400 border border-zinc-800 hover:border-rose-900/40 transition-all cursor-pointer shadow-sm group">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12h-15" />
          </svg>
        </button>
      </td>
    `;
    container.appendChild(row);

    // Progressive asynchronous load
    if (fScoresCache[stock.ticker]) {
      updateFScoreCell(stock.ticker, fScoresCache[stock.ticker]);
    } else {
      updateFScoreCell(stock.ticker, null); // Render loading state
      fetchFScore(stock.ticker);
    }
  });

  // Attach event listeners to all dynamic exclude buttons
  document.querySelectorAll('.exclude-stock-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const ticker = btn.getAttribute('data-ticker');
      excludeStock(ticker);
    });
  });
}

// F-Score Cache and Progressive Handlers
let fScoresCache = {};

async function fetchFScore(ticker) {
  try {
    const res = await fetch(`/api/fscore?ticker=${ticker}`);
    if (res.ok) {
      const data = await res.json();
      fScoresCache[ticker] = data;
      updateFScoreCell(ticker, data);
    } else {
      throw new Error(`Failed to fetch F-Score for ${ticker}`);
    }
  } catch (error) {
    console.error(error);
  }
}

function getFScoreBadgeHtml(ticker, fScoreData) {
  if (!fScoreData) {
    return `
      <div class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-zinc-900/50 rounded-lg text-xs font-mono border border-zinc-800 text-zinc-500 animate-pulse">
        <svg class="animate-spin h-3 w-3 text-zinc-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>SEC Facts...</span>
      </div>
    `;
  }

  const score = fScoreData.score;
  let bgClass = 'bg-blue-950/20 text-blue-300 border-blue-900/40 hover:bg-blue-900/30';
  let scoreLabel = 'Medium';
  
  if (score >= 7) {
    bgClass = 'bg-emerald-950/30 text-emerald-400 border-emerald-500/40 hover:bg-emerald-900/50';
    scoreLabel = 'Strong';
  } else if (score <= 3) {
    bgClass = 'bg-rose-950/30 text-rose-400 border-rose-500/40 hover:bg-rose-900/50';
    scoreLabel = 'Weak';
  }

  return `
    <button data-fscore-ticker="${ticker}" class="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-black border transition-all cursor-pointer shadow-sm ${bgClass}">
      <span class="text-[9px] opacity-75 font-medium uppercase font-mono">${scoreLabel}</span>
      <span class="text-xs font-black font-mono bg-black/40 px-1.5 py-0.5 rounded">${score}/9</span>
    </button>
  `;
}

function updateFScoreCell(ticker, fScoreData) {
  const cell = document.getElementById(`fscore-cell-${ticker}`);
  if (cell) {
    cell.innerHTML = getFScoreBadgeHtml(ticker, fScoreData);
    const btn = cell.querySelector('button');
    if (btn) {
      btn.addEventListener('click', () => {
        showFScoreDetailsModal(fScoreData);
      });
    }
  }
}

function showFScoreDetailsModal(data) {
  const modal = document.getElementById('fscore-modal');
  if (!modal) return;

  // Set header details
  const tickerObj = stocks.find(s => s.ticker === data.ticker) || { name: 'Company Details' };
  document.getElementById('modal-company-title').textContent = `${data.ticker} • ${tickerObj.name} • Fiscal Year ${data.fiscalYear}`;

  // Update Score Indicator
  const scoreNum = document.getElementById('modal-score-number');
  scoreNum.textContent = data.score;

  // Progress Circle animation
  const circle = document.getElementById('modal-progress-circle');
  const circumference = 301.6;
  const offset = circumference * (1 - data.score / 9);
  circle.style.strokeDashoffset = offset;

  // Set dynamic colors for progress ring based on score strength
  if (data.score >= 7) {
    circle.setAttribute('stroke', '#10b981'); // Emerald
    document.getElementById('modal-rating-label').textContent = 'Strong Financial Position';
    document.getElementById('modal-rating-label').className = 'text-xs font-bold font-mono uppercase tracking-wider text-emerald-400';
    document.getElementById('modal-rating-description').textContent = 'Highly optimized fundamentals. The company scores strongly across profitability, leverage reduction, and asset-turnover efficiency, aligning with Joseph Piotroski’s criteria for investment safety.';
  } else if (data.score <= 3) {
    circle.setAttribute('stroke', '#f43f5e'); // Rose
    document.getElementById('modal-rating-label').textContent = 'Weak Financial Position';
    document.getElementById('modal-rating-label').className = 'text-xs font-bold font-mono uppercase tracking-wider text-rose-400';
    document.getElementById('modal-rating-description').textContent = 'Vulnerable fundamental profile. Lower scores indicate potential liquidity, solvency, or operational efficiency constraints. Evaluate carefully for "value traps."';
  } else {
    circle.setAttribute('stroke', '#3b82f6'); // Blue
    document.getElementById('modal-rating-label').textContent = 'Stable Financial Position';
    document.getElementById('modal-rating-label').className = 'text-xs font-bold font-mono uppercase tracking-wider text-blue-400';
    document.getElementById('modal-rating-description').textContent = 'Moderate fundamentals. The company has a stable balance sheet with balanced operational dynamics, displaying consistent survival attributes but lacking top-tier momentum.';
  }

  // Update source badge
  const sourceBadge = document.getElementById('modal-source-badge');
  if (data.isSimulated) {
    sourceBadge.innerHTML = `
      <svg class="w-3.5 h-3.5 text-yellow-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>Calibrated Financial Model (Simulation Mode)</span>
    `;
    sourceBadge.className = 'inline-flex items-center gap-1.5 bg-yellow-950/20 px-2.5 py-1 rounded border border-yellow-900/30 text-[10px] font-mono text-yellow-400';
  } else {
    sourceBadge.innerHTML = `
      <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
      <span>SEC EDGAR Official Filing (10-K Disclosures)</span>
    `;
    sourceBadge.className = 'inline-flex items-center gap-1.5 bg-emerald-950/20 px-2.5 py-1 rounded border border-emerald-900/30 text-[10px] font-mono text-emerald-400';
  }

  // Populate Checklist items
  const container = document.getElementById('criteria-items-container');
  container.innerHTML = '';

  const formatCurrency = (val) => {
    if (val === null || val === undefined) return 'N/A';
    if (Math.abs(val) >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    if (Math.abs(val) >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
    return `$${val.toLocaleString()}`;
  };

  const criteriaList = [
    {
      title: 'Positive Net Income (F1)',
      desc: 'Net income is positive in the current fiscal year.',
      status: data.breakdown.f1,
      metric: `Net Income: ${formatCurrency(data.metrics.netIncome)}`
    },
    {
      title: 'Positive Cash Flow from Operations (F2)',
      desc: 'Operating cash flow is positive in the current fiscal year.',
      status: data.breakdown.f2,
      metric: `Operating CFO: ${formatCurrency(data.metrics.cfo)}`
    },
    {
      title: 'Increasing Return on Assets (F3)',
      desc: 'Return on Assets (ROA) is higher in the current year compared to the previous year.',
      status: data.breakdown.f3,
      metric: `ROA T: ${data.metrics.roa ? (data.metrics.roa * 100).toFixed(2) + '%' : 'N/A'} | ROA T-1: ${data.metrics.prevRoa ? (data.metrics.prevRoa * 100).toFixed(2) + '%' : 'N/A'}`
    },
    {
      title: 'Operating CFO exceeds Net Income (F4)',
      desc: 'Operating cash flow is greater than net income, showing high quality of earnings.',
      status: data.breakdown.f4,
      metric: `CFO: ${formatCurrency(data.metrics.cfo)} | Net Income: ${formatCurrency(data.metrics.netIncome)}`
    },
    {
      title: 'Decreasing Leverage Ratio (F5)',
      desc: 'Long-term debt-to-assets ratio is lower in the current year than the previous year.',
      status: data.breakdown.f5,
      metric: `Leverage Ratio T: ${(data.metrics.leverage * 100).toFixed(2)}% | Leverage Ratio T-1: ${(data.metrics.prevLeverage * 100).toFixed(2)}%`
    },
    {
      title: 'Increasing Liquidity Ratio (F6)',
      desc: 'Current ratio (Current Assets / Current Liabilities) is higher than the previous year.',
      status: data.breakdown.f6,
      metric: `Current Ratio T: ${(data.metrics.currentRatio || 0).toFixed(2)} | Current Ratio T-1: ${(data.metrics.prevCurrentRatio || 0).toFixed(2)}`
    },
    {
      title: 'No Share Dilution (F7)',
      desc: 'No new common shares outstanding were issued in the past year.',
      status: data.breakdown.f7,
      metric: `Shares Outstanding T: ${data.metrics.shares ? (data.metrics.shares / 1e6).toFixed(1) + 'M' : 'N/A'} | Shares Outstanding T-1: ${data.metrics.prevShares ? (data.metrics.prevShares / 1e6).toFixed(1) + 'M' : 'N/A'}`
    },
    {
      title: 'Increasing Gross Margin (F8)',
      desc: 'Gross margin (Gross Profit / Revenue) is higher in the current year than the previous year.',
      status: data.breakdown.f8,
      metric: `Gross Margin T: ${(data.metrics.grossMargin * 100).toFixed(2)}% | Gross Margin T-1: ${(data.metrics.prevGrossMargin * 100).toFixed(2)}%`
    },
    {
      title: 'Increasing Asset Turnover (F9)',
      desc: 'Asset turnover ratio (Revenue / Total Assets) is higher in the current year than the previous year.',
      status: data.breakdown.f9,
      metric: `Asset Turnover T: ${(data.metrics.assetTurnover || 0).toFixed(3)} | Asset Turnover T-1: ${(data.metrics.prevAssetTurnover || 0).toFixed(3)}`
    }
  ];

  criteriaList.forEach(item => {
    const isMet = item.status === 1;
    const itemEl = document.createElement('div');
    itemEl.className = `flex justify-between items-start p-3 rounded-lg border ${isMet ? 'bg-emerald-950/10 border-emerald-900/20' : 'bg-zinc-950 border-zinc-900/60'} text-xs font-sans transition-all`;
    
    itemEl.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="mt-0.5 flex items-center justify-center rounded-full p-1 ${isMet ? 'bg-emerald-900/20 text-emerald-400' : 'bg-zinc-900 text-zinc-600'}">
          ${isMet ? `
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          ` : `
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12h-15" />
            </svg>
          `}
        </div>
        <div class="flex flex-col gap-1">
          <span class="font-bold text-white leading-tight">${item.title}</span>
          <span class="text-[11px] text-zinc-400 leading-normal">${item.desc}</span>
          <span class="text-[10px] font-mono text-zinc-500 bg-zinc-900/40 px-2 py-0.5 rounded border border-zinc-900/50 w-fit mt-1">${item.metric}</span>
        </div>
      </div>
      <div class="flex flex-col items-end">
        <span class="font-mono text-[10px] font-bold ${isMet ? 'text-emerald-400' : 'text-zinc-500'}">${isMet ? '+1 Pt' : '0 Pts'}</span>
      </div>
    `;
    container.appendChild(itemEl);
  });

  // Display modal
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

// Close Modal event
function closeFScoreModal() {
  const modal = document.getElementById('fscore-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
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

// Setup Event Handlers and Listeners
function initializeApp() {
  // Load target date (default to today)
  const dateInput = document.getElementById('target-date');
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  targetDate = `${year}-${month}-${day}`;
  dateInput.value = targetDate;

  // Initialize manual start date to 30 days ago by default
  const defaultManualStart = new Date();
  defaultManualStart.setDate(defaultManualStart.getDate() - 30);
  const mYear = defaultManualStart.getFullYear();
  const mMonth = String(defaultManualStart.getMonth() + 1).padStart(2, '0');
  const mDay = String(defaultManualStart.getDate()).padStart(2, '0');
  manualStartDate = `${mYear}-${mMonth}-${mDay}`;
  
  const manualDateInput = document.getElementById('manual-start-date');
  if (manualDateInput) {
    manualDateInput.value = manualStartDate;
    manualDateInput.addEventListener('change', (e) => {
      manualStartDate = e.target.value;
      if (selectedTimeline === 'manual') {
        renderDashboard();
      }
    });
  }

  // Bind Timeline Selector clicks
  const timelineBtns = document.querySelectorAll('.timeline-box-btn');
  const manualDatePickerBox = document.getElementById('manual-date-picker-box');
  
  timelineBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Toggle button styling classes
      timelineBtns.forEach(b => {
        b.className = "timeline-box-btn px-4 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono font-semibold text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all cursor-pointer";
      });
      btn.className = "timeline-box-btn px-4 py-2 rounded-lg bg-blue-600 text-white border border-blue-500 text-xs font-mono font-semibold transition-all cursor-pointer";
      
      selectedTimeline = btn.getAttribute('data-timeline');
      
      if (selectedTimeline === 'manual') {
        manualDatePickerBox.classList.remove('hidden');
        manualDatePickerBox.classList.add('flex');
      } else {
        manualDatePickerBox.classList.add('hidden');
        manualDatePickerBox.classList.remove('flex');
      }
      
      renderDashboard();
    });
  });

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

  // Bind Target Date Events
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

  // Highlight default selected timeline (1m button)
  const initialBtn = document.querySelector('[data-timeline="1m"]');
  if (initialBtn) {
    initialBtn.className = "timeline-box-btn px-4 py-2 rounded-lg bg-blue-600 text-white border border-blue-500 text-xs font-mono font-semibold transition-all cursor-pointer";
  }

  // Close Modal triggers
  const closeModalBtn = document.getElementById('close-fscore-modal');
  const fscoreModal = document.getElementById('fscore-modal');
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeFScoreModal);
  }
  if (fscoreModal) {
    fscoreModal.addEventListener('click', (e) => {
      if (e.target === fscoreModal) {
        closeFScoreModal();
      }
    });
  }

  // Initial Draw
  renderDashboard();
}

// Launch Station.11
document.addEventListener('DOMContentLoaded', initializeApp);
