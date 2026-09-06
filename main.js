import Papa from 'papaparse';

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
let openrouterKey = '';
let csvCompanyNames = {};
const expandedSectorCharts = new Set();
let csvHistoryData = null;
let isCsvLoading = false;

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

// Load and parse the default S&P 100 historical data from GitHub releases when no Twelve Data API key is set
async function loadCSVData() {
  if (csvHistoryData) return csvHistoryData;
  if (isCsvLoading) return;
  
  isCsvLoading = true;
  const indicator = document.getElementById('csv-loading-indicator');
  if (indicator) {
    indicator.classList.remove('hidden');
    indicator.classList.add('flex');
  }
  
  try {
    const url = '/api/stocks-csv';
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to download CSV asset');
    
    const csvText = await response.text();
    
    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true
    });
    
    const dataByTicker = {};
    parsed.data.forEach(row => {
      const ticker = row.Ticker;
      if (!ticker) return;
      
      if (row.Company && !csvCompanyNames[ticker]) {
        csvCompanyNames[ticker] = row.Company;
      }
      
      if (!dataByTicker[ticker]) {
        dataByTicker[ticker] = [];
      }
      
      dataByTicker[ticker].push({
        date: String(row.Date),
        open: parseFloat(row.Open),
        high: parseFloat(row.High),
        low: parseFloat(row.Low),
        close: parseFloat(row.Close),
        volume: parseInt(row.Volume, 10) || 0
      });
    });
    
    Object.keys(dataByTicker).forEach(ticker => {
      dataByTicker[ticker].sort((a, b) => a.date.localeCompare(b.date));
    });
    
    csvHistoryData = dataByTicker;
    console.log('Successfully loaded S&P 100 CSV data for', Object.keys(csvHistoryData).length, 'tickers');
  } catch (error) {
    console.error('Error downloading or parsing CSV:', error);
  } finally {
    isCsvLoading = false;
    if (indicator) {
      indicator.classList.remove('flex');
      indicator.classList.add('hidden');
    }
  }
  
  return csvHistoryData;
}

// Get stock historical data from CSV (if API key not set and available) or fallback to simulated data
function getStockHistory(stock, targetDate, daysCount) {
  let history = [];
  
  if (!twelvedataKey && csvHistoryData && csvHistoryData[stock.ticker]) {
    const allTickerHistory = csvHistoryData[stock.ticker];
    const filteredHistory = allTickerHistory.filter(h => h.date <= targetDate);
    if (filteredHistory.length >= 5) {
      history = filteredHistory.slice(-(daysCount + 50));
    }
  }
  
  if (history.length < daysCount + 50) {
    history = generateStockHistory(stock.ticker, stock.basePrice, targetDate, daysCount);
  }
  
  return history;
}

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

// Compute annualized standard deviation of daily percentage returns
function calculateAnnualizedVolatility(history, days) {
  const slice = history.slice(-days);
  if (slice.length < 2) return 0;
  const returns = [];
  for (let i = 1; i < slice.length; i++) {
    const prev = slice[i - 1].close;
    const curr = slice[i].close;
    if (prev > 0) {
      returns.push((curr - prev) / prev);
    }
  }
  if (returns.length < 2) return 0;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (returns.length - 1);
  const dailyStdDev = Math.sqrt(variance);
  return dailyStdDev * Math.sqrt(252) * 100;
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

// Render active stock list to the dashboard table with sector grouping and custom sorting
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
        <td colspan="8" class="py-12 text-center text-zinc-500 text-sm font-mono">
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

  // Pre-process and calculate metrics for all stocks first
  const processedStocks = stocks.map(stock => {
    let history = [];
    let isLive = false;

    // Check if live API has returned values for this ticker
    if (liveData) {
      const tickerData = liveData[stock.ticker] || (liveData.values && liveData.meta && liveData.meta.symbol === stock.ticker ? liveData : null);
      if (tickerData && tickerData.values) {
        isLive = true;
        history = tickerData.values.map(v => ({
          date: v.datetime,
          open: parseFloat(v.open),
          high: parseFloat(v.high),
          low: parseFloat(v.low),
          close: parseFloat(v.close)
        })).reverse();
      }
    }

    // Fallback to actual CSV data or high-quality simulated data
    if (history.length < daysCount + 50) {
      history = getStockHistory(stock, targetDate, daysCount);
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

    // Retrieve cached Piotroski F-score value
    const fScoreCached = fScoresCache[stock.ticker];
    const scoreVal = fScoreCached ? fScoreCached.score : 0;

    // Compute Volatilities (annualized %)
    const oneMonthVol = calculateAnnualizedVolatility(history, 30);
    const oneYearVol = calculateAnnualizedVolatility(history, history.length);

    // Latest MACD histogram value for weighted average calculations
    const latestHistVal = hist[hist.length - 1] || 0;

    return {
      ...stock,
      history,
      isLive,
      lastDay,
      prevDay,
      change,
      changePercent,
      macd,
      signal,
      hist,
      macdSig,
      ohlcSparkline,
      macdSparkline,
      scoreVal,
      oneMonthVol,
      oneYearVol,
      latestHistVal
    };
  });

  // Group companies by Sector
  const sectorsMap = {};
  processedStocks.forEach(stock => {
    if (!sectorsMap[stock.sector]) {
      sectorsMap[stock.sector] = [];
    }
    sectorsMap[stock.sector].push(stock);
  });

  // Sort sectors alphabetically to keep the UI clean
  const sortedSectors = Object.keys(sectorsMap).sort();

  // For each sector, sort within sector:
  // 1. Piotroski f-score (high to low)
  // 2. 1-year volatility (low to high)
  // 3. 1-month volatility (low to high)
  sortedSectors.forEach(sector => {
    sectorsMap[sector].sort((a, b) => {
      // Piotroski f-score (high to low)
      if (b.scoreVal !== a.scoreVal) {
        return b.scoreVal - a.scoreVal;
      }
      // 1 year volatility (low to high)
      if (a.oneYearVol !== b.oneYearVol) {
        return a.oneYearVol - b.oneYearVol;
      }
      // 1 month volatility (low to high)
      return a.oneMonthVol - b.oneMonthVol;
    });
  });

  // Render grouped structure
  sortedSectors.forEach(sector => {
    const sectorStocks = sectorsMap[sector];
    
    // Calculate weighted average sector aggregate MACD momentum based on prices
    const sumPrices = sectorStocks.reduce((sum, s) => sum + s.lastDay.close, 0);
    let weightedHistAvg = 0;
    if (sumPrices > 0) {
      weightedHistAvg = sectorStocks.reduce((sum, s) => {
        const weight = s.lastDay.close / sumPrices;
        return sum + (s.latestHistVal * weight);
      }, 0);
    } else {
      weightedHistAvg = sectorStocks.reduce((sum, s) => sum + s.latestHistVal, 0) / sectorStocks.length;
    }

    // Determine aggregate trend badge styling
    let trendClass = 'text-zinc-400 bg-zinc-900/40 border-zinc-800/40';
    let trendText = 'Neutral';
    if (weightedHistAvg > 0.05) {
      trendClass = 'text-emerald-400 bg-emerald-950/20 border-emerald-900/40 font-bold';
      trendText = 'Bullish Momentum';
    } else if (weightedHistAvg > 0) {
      trendClass = 'text-emerald-500/80 bg-emerald-950/10 border-emerald-900/20';
      trendText = 'Mod. Bullish';
    } else if (weightedHistAvg < -0.05) {
      trendClass = 'text-rose-400 bg-rose-950/20 border-rose-900/40 font-bold';
      trendText = 'Bearish Momentum';
    } else if (weightedHistAvg < 0) {
      trendClass = 'text-rose-500/80 bg-rose-950/10 border-rose-900/20';
      trendText = 'Mod. Bearish';
    }

    // Render Sector Divider Row
    const sectorHeaderRow = document.createElement('tr');
    sectorHeaderRow.className = "bg-zinc-900/50 font-mono text-[10px] uppercase select-none border-t border-b border-zinc-800/80";
    const isChartExpanded = expandedSectorCharts.has(sector);
    const sectorSafeId = sector.replace(/\s+/g, '-');
    const toggleBtnText = isChartExpanded ? 'Hide MACD Chart' : 'Show MACD Chart';
    const toggleBtnClass = isChartExpanded
      ? 'text-zinc-300 border-zinc-700 bg-zinc-800/40'
      : 'text-blue-400 border-blue-500/20 bg-blue-950/10';

    sectorHeaderRow.innerHTML = `
      <td colspan="8" class="py-2.5 px-6">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded bg-blue-500"></span>
            <span class="font-bold text-zinc-300 tracking-wider">${sector}</span>
            <span class="text-[9px] text-zinc-500 font-normal">(${sectorStocks.length} Stock${sectorStocks.length > 1 ? 's' : ''})</span>
            <button class="toggle-sector-chart-btn hover:text-white text-[9px] font-semibold border px-2 py-0.5 rounded cursor-pointer transition-all ml-2 font-mono select-none ${toggleBtnClass}" data-sector="${sector}" id="toggle-btn-${sectorSafeId}">
              ${toggleBtnText}
            </button>
          </div>
          <div class="flex items-center gap-2 text-zinc-500">
            <span>Weighted MACD Mom:</span>
            <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[9px] ${trendClass}">
              ${weightedHistAvg >= 0 ? '+' : ''}${weightedHistAvg.toFixed(4)} • ${trendText}
            </span>
          </div>
        </div>
      </td>
    `;
    container.appendChild(sectorHeaderRow);

    // Collapsible Aggregate MACD Chart Row
    const sectorChartRow = document.createElement('tr');
    sectorChartRow.id = `sector-chart-row-${sectorSafeId}`;
    sectorChartRow.className = isChartExpanded ? "bg-zinc-950/30 border-b border-zinc-800/40" : "bg-zinc-950/30 border-b border-zinc-800/40 hidden";
    
    const chartSvg = renderSectorMACDChart(sectorStocks, daysCount);
    
    sectorChartRow.innerHTML = `
      <td colspan="8" class="py-3 px-6">
        <div class="flex flex-col gap-2 max-w-3xl mx-auto bg-zinc-950/40 p-4 rounded-xl border border-zinc-800/50">
          <div class="flex items-center justify-between border-b border-zinc-800/40 pb-2 mb-1.5">
            <span class="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">${sector} Aggregate MACD Momentum</span>
            <div class="flex items-center gap-3 text-[9px] font-mono select-none">
              <span class="flex items-center gap-1"><span class="w-2 h-0.5 bg-[#3b82f6]"></span> <span class="text-zinc-500">MACD</span></span>
              <span class="flex items-center gap-1"><span class="w-2 h-0.5 bg-[#f59e0b]"></span> <span class="text-zinc-500">SIGNAL</span></span>
              <span class="flex items-center gap-1"><span class="w-2 h-2.5 bg-emerald-500/30 rounded-sm"></span> <span class="text-emerald-500">HIST (+)</span></span>
              <span class="flex items-center gap-1"><span class="w-2 h-2.5 bg-rose-500/30 rounded-sm"></span> <span class="text-rose-500">HIST (-)</span></span>
            </div>
          </div>
          ${chartSvg}
        </div>
      </td>
    `;
    container.appendChild(sectorChartRow);

    // Render Stock Rows
    sectorStocks.forEach(stock => {
      const row = document.createElement('tr');
      row.className = "hover:bg-zinc-900/40 transition-all border-b border-zinc-800/40 text-sm align-middle";
      row.id = `stock-row-${stock.ticker}`;
      
      row.innerHTML = `
        <td class="py-4 px-6">
          <div class="flex flex-col">
            <div class="flex items-center gap-2">
              <span class="font-mono font-bold text-white tracking-wider">${stock.ticker}</span>
              ${stock.isLive ? `<span class="bg-emerald-950 text-emerald-400 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border border-emerald-800/50 animate-pulse">LIVE</span>` : ''}
            </div>
            <span class="text-xs text-zinc-400 font-medium">${stock.name}</span>
          </div>
        </td>
        <td class="py-4 px-4 text-right">
          <div class="flex flex-col items-end">
            <span class="font-mono font-bold text-white text-sm">$${stock.lastDay.close.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
            <span class="text-[11px] font-mono flex items-center gap-0.5 ${stock.change >= 0 ? 'text-emerald-500' : 'text-rose-500'}">
              ${stock.change >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%
            </span>
          </div>
        </td>
        <td class="py-4 px-4 text-center">
          <div class="inline-block py-1">
            ${stock.ohlcSparkline}
          </div>
        </td>
        <td class="py-4 px-4 text-center">
          <div class="inline-block py-1">
            ${stock.macdSparkline}
          </div>
        </td>
        <td class="py-4 px-4 text-center">
          <div class="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono select-none ${stock.macdSig.badgeClass}" title="${stock.macdSig.desc}">
            ${stock.macdSig.icon}
            <span>${stock.macdSig.text}</span>
          </div>
        </td>
        <td class="py-4 px-4 text-center" id="fscore-cell-${stock.ticker}">
          <!-- Populated dynamically via progressive backend fetch -->
        </td>
        <td class="py-4 px-4 text-center">
          <div class="flex flex-col items-center justify-center">
            <span class="font-mono text-xs font-bold text-white">${stock.oneMonthVol.toFixed(1)}% <span class="text-[9px] text-zinc-500 font-normal">1M</span></span>
            <span class="font-mono text-[10px] text-zinc-400">${stock.oneYearVol.toFixed(1)}% <span class="text-[9px] text-zinc-500 font-normal">1Y</span></span>
          </div>
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
  });

  // Attach event listeners to all dynamic exclude buttons
  document.querySelectorAll('.exclude-stock-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const ticker = btn.getAttribute('data-ticker');
      excludeStock(ticker);
    });
  });

  // Attach event listeners to all sector chart toggle buttons
  document.querySelectorAll('.toggle-sector-chart-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const sector = btn.getAttribute('data-sector');
      const sectorSafeId = sector.replace(/\s+/g, '-');
      const chartRow = document.getElementById(`sector-chart-row-${sectorSafeId}`);
      if (chartRow) {
        const isHidden = chartRow.classList.contains('hidden');
        if (isHidden) {
          chartRow.classList.remove('hidden');
          btn.textContent = 'Hide MACD Chart';
          btn.className = 'toggle-sector-chart-btn hover:text-white text-[9px] font-semibold border px-2 py-0.5 rounded cursor-pointer transition-all ml-2 font-mono select-none text-zinc-300 border-zinc-700 bg-zinc-800/40';
          expandedSectorCharts.add(sector);
        } else {
          chartRow.classList.add('hidden');
          btn.textContent = 'Show MACD Chart';
          btn.className = 'toggle-sector-chart-btn hover:text-white text-[9px] font-semibold border px-2 py-0.5 rounded cursor-pointer transition-all ml-2 font-mono select-none text-blue-400 border-blue-500/20 bg-blue-950/10';
          expandedSectorCharts.delete(sector);
        }
      }
    });
  });

  // Refresh LLM summary with latest stock changes
  loadLLMStrategicSummary(processedStocks);
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
  
  if (score === 9) {
    bgClass = 'bg-amber-950/40 text-amber-300 border-amber-500/50 hover:bg-amber-900/60 hover:border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]';
    scoreLabel = '★ PERFECT';
  } else if (score >= 7) {
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

  // Set header details to exactly ticker and name
  const tickerObj = stocks.find(s => s.ticker === data.ticker) || { name: 'Company Details' };
  document.getElementById('modal-company-title').textContent = `${data.ticker} • ${tickerObj.name}`;

  // Update Score Indicator
  const scoreNum = document.getElementById('modal-score-number');
  scoreNum.textContent = data.score;

  // Progress Circle animation
  const circle = document.getElementById('modal-progress-circle');
  const circumference = 251.2;
  const offset = circumference * (1 - data.score / 9);
  circle.style.strokeDashoffset = offset;

  // Set dynamic colors for progress ring based on score strength
  if (data.score >= 7) {
    circle.setAttribute('stroke', '#10b981'); // Emerald
    document.getElementById('modal-rating-label').textContent = 'Strong Financial Position';
    document.getElementById('modal-rating-label').className = 'text-xs font-bold font-mono uppercase tracking-wider text-emerald-400';
    document.getElementById('modal-rating-description').textContent = 'Robust financial health across profitability, efficiency, and leverage indicators.';
  } else if (data.score <= 3) {
    circle.setAttribute('stroke', '#f43f5e'); // Rose
    document.getElementById('modal-rating-label').textContent = 'Weak Financial Position';
    document.getElementById('modal-rating-label').className = 'text-xs font-bold font-mono uppercase tracking-wider text-rose-400';
    document.getElementById('modal-rating-description').textContent = 'Vulnerable financials. Higher risk of operational or solvency constraints.';
  } else {
    circle.setAttribute('stroke', '#3b82f6'); // Blue
    document.getElementById('modal-rating-label').textContent = 'Stable Financial Position';
    document.getElementById('modal-rating-label').className = 'text-xs font-bold font-mono uppercase tracking-wider text-blue-400';
    document.getElementById('modal-rating-description').textContent = 'Moderate fundamentals. Stable balance sheet with balanced operational dynamics.';
  }

  // Update source badge
  const sourceBadge = document.getElementById('modal-source-badge');
  if (data.isSimulated) {
    sourceBadge.innerHTML = `
      <svg class="w-3 h-3 text-yellow-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>Calibrated Model (Simulation Mode)</span>
    `;
    sourceBadge.className = 'inline-flex items-center gap-1 bg-yellow-950/20 px-2 py-0.5 rounded border border-yellow-900/30 text-[9px] font-mono text-yellow-400';
  } else {
    sourceBadge.innerHTML = `
      <svg class="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
      <span>SEC EDGAR Official Filing Check</span>
    `;
    sourceBadge.className = 'inline-flex items-center gap-1 bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-900/30 text-[9px] font-mono text-emerald-400';
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
      status: data.breakdown.f1,
      metric: `Net Income: ${formatCurrency(data.metrics.netIncome)}`
    },
    {
      title: 'Positive Operating Cash Flow (F2)',
      status: data.breakdown.f2,
      metric: `Operating CFO: ${formatCurrency(data.metrics.cfo)}`
    },
    {
      title: 'Increasing Return on Assets (F3)',
      status: data.breakdown.f3,
      metric: `ROA T: ${data.metrics.roa ? (data.metrics.roa * 100).toFixed(1) + '%' : 'N/A'} | Prev: ${data.metrics.prevRoa ? (data.metrics.prevRoa * 100).toFixed(1) + '%' : 'N/A'}`
    },
    {
      title: 'CFO Exceeds Net Income (F4)',
      status: data.breakdown.f4,
      metric: `CFO: ${formatCurrency(data.metrics.cfo)} | Net Income: ${formatCurrency(data.metrics.netIncome)}`
    },
    {
      title: 'Decreasing Leverage Ratio (F5)',
      status: data.breakdown.f5,
      metric: `Debt Ratio T: ${(data.metrics.leverage * 100).toFixed(1)}% | Prev: ${(data.metrics.prevLeverage * 100).toFixed(1)}%`
    },
    {
      title: 'Increasing Liquidity Ratio (F6)',
      status: data.breakdown.f6,
      metric: `Current Ratio: ${(data.metrics.currentRatio || 0).toFixed(1)} | Prev: ${(data.metrics.prevCurrentRatio || 0).toFixed(1)}`
    },
    {
      title: 'No Share Dilution (F7)',
      status: data.breakdown.f7,
      metric: `Shares T: ${data.metrics.shares ? (data.metrics.shares / 1e6).toFixed(1) + 'M' : 'N/A'} | Prev: ${data.metrics.prevShares ? (data.metrics.prevShares / 1e6).toFixed(1) + 'M' : 'N/A'}`
    },
    {
      title: 'Increasing Gross Margin (F8)',
      status: data.breakdown.f8,
      metric: `Gross Margin: ${(data.metrics.grossMargin * 100).toFixed(1)}% | Prev: ${(data.metrics.prevGrossMargin * 100).toFixed(1)}%`
    },
    {
      title: 'Increasing Asset Turnover (F9)',
      status: data.breakdown.f9,
      metric: `Asset Turnover: ${(data.metrics.assetTurnover || 0).toFixed(2)} | Prev: ${(data.metrics.prevAssetTurnover || 0).toFixed(2)}`
    }
  ];

  criteriaList.forEach((item, index) => {
    const isMet = item.status === 1;
    const itemEl = document.createElement('div');
    itemEl.className = `flex justify-between items-center p-2.5 rounded-lg border ${isMet ? 'bg-emerald-950/20 border-emerald-500/25 text-emerald-300' : 'bg-rose-950/20 border-rose-500/25 text-rose-300'} text-xs font-sans transition-all`;
    
    const displayNum = index + 1;

    itemEl.innerHTML = `
      <div class="flex items-center gap-2.5">
        <div class="flex items-center justify-center rounded-full p-1 ${isMet ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'}">
          ${isMet ? `
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          ` : `
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          `}
        </div>
        <div class="flex flex-col gap-0.5">
          <span class="text-xs font-bold text-white tracking-wide leading-tight">${displayNum}. ${item.title}</span>
          <span class="text-[10px] font-mono text-zinc-500">${item.metric}</span>
        </div>
      </div>
      <div class="flex flex-col items-end">
        <span class="font-mono text-[10px] font-bold ${isMet ? 'text-emerald-400' : 'text-rose-400'}">${isMet ? '+1' : '0'}</span>
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

function updateOpenRouterStatusDot() {
  const dot = document.getElementById('openrouter-status-dot');
  if (dot) {
    if (openrouterKey) {
      dot.className = 'w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]';
    } else {
      dot.className = 'w-2.5 h-2.5 rounded-full bg-zinc-600';
    }
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
async function initializeApp() {
  // Load target date (default to September 1, 2026)
  const dateInput = document.getElementById('target-date');
  targetDate = '2026-09-01';
  dateInput.value = targetDate;

  // Initialize manual start date to 30 days ago by default
  const defaultManualStart = new Date('2026-09-01');
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

  // Load Twelve Data API key if stored
  const savedKey = localStorage.getItem('twelvedata_apikey');
  if (savedKey) {
    twelvedataKey = savedKey;
    document.getElementById('twelvedata-key').value = savedKey;
  }

  // Load OpenRouter API key if stored
  const savedOrKey = localStorage.getItem('openrouter_apikey');
  if (savedOrKey) {
    openrouterKey = savedOrKey;
    document.getElementById('openrouter-key').value = savedOrKey;
  }
  updateOpenRouterStatusDot();

  // If no Twelve Data key is set, download and parse S&P 100 CSV data from release asset
  if (!twelvedataKey) {
    await loadCSVData();
    // If we loaded the CSV successfully and the stocks roster is unexpanded, load all 100 companies!
    if (csvHistoryData && stocks.length <= 11) {
      const allTickers = Object.keys(csvHistoryData);
      stocks = allTickers.map(ticker => ({
        ticker: ticker,
        name: csvCompanyNames[ticker] || ticker,
        sector: 'S&P 100',
        basePrice: csvHistoryData[ticker][csvHistoryData[ticker].length - 1]?.close || 150.0
      }));
      saveToStorage();
    }
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
    document.getElementById('openrouter-drawer').classList.add('hidden');
  });

  // OpenRouter Drawer toggle
  const toggleOrBtn = document.getElementById('toggle-openrouter-btn');
  const orDrawer = document.getElementById('openrouter-drawer');
  toggleOrBtn.addEventListener('click', () => {
    orDrawer.classList.toggle('hidden');
    apiDrawer.classList.add('hidden');
  });

  // Save API Key
  const saveKeyBtn = document.getElementById('save-api-key');
  const keyInput = document.getElementById('twelvedata-key');
  saveKeyBtn.addEventListener('click', async () => {
    twelvedataKey = keyInput.value.trim();
    localStorage.setItem('twelvedata_apikey', twelvedataKey);
    apiDrawer.classList.add('hidden');
    if (!twelvedataKey) {
      await loadCSVData();
    }
    renderDashboard();
  });

  // Save OpenRouter Key
  const saveOrKeyBtn = document.getElementById('save-openrouter-key');
  const orKeyInput = document.getElementById('openrouter-key');
  saveOrKeyBtn.addEventListener('click', () => {
    openrouterKey = orKeyInput.value.trim();
    localStorage.setItem('openrouter_apikey', openrouterKey);
    orDrawer.classList.add('hidden');
    updateOpenRouterStatusDot();
    renderDashboard();
  });

  // Show Add Stock form
  const showAddBtn = document.getElementById('show-add-form-btn');
  const addTriggerRow = document.getElementById('add-trigger-row');
  const addForm = document.getElementById('add-stock-form');
  
  showAddBtn.addEventListener('click', () => {
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

  // Bind AI briefing recalibration trigger
  const recalibrateBtn = document.getElementById('refresh-ai-briefing');
  if (recalibrateBtn) {
    recalibrateBtn.addEventListener('click', () => {
      loadLLMStrategicSummary();
    });
  }

  // Initial Draw
  renderDashboard();
}

// Render detailed Sector Aggregate MACD SVG Chart
function renderSectorMACDChart(sectorStocks, displayDays) {
  const n = displayDays;
  const aggregatedMacd = new Array(n).fill(0);
  const aggregatedSignal = new Array(n).fill(0);
  const aggregatedHist = new Array(n).fill(0);
  
  for (let i = 0; i < n; i++) {
    let count = 0;
    sectorStocks.forEach(stock => {
      const mDisp = stock.macd.slice(-displayDays);
      const sDisp = stock.signal.slice(-displayDays);
      const hDisp = stock.hist.slice(-displayDays);
      
      const idx = mDisp.length - n + i;
      if (idx >= 0 && idx < mDisp.length) {
        aggregatedMacd[i] += mDisp[idx];
        aggregatedSignal[i] += sDisp[idx];
        aggregatedHist[i] += hDisp[idx];
        count++;
      }
    });
    if (count > 0) {
      aggregatedMacd[i] /= count;
      aggregatedSignal[i] /= count;
      aggregatedHist[i] /= count;
    }
  }

  const width = 650;
  const height = 110;
  const padding = 10;
  
  const allVals = [...aggregatedMacd, ...aggregatedSignal, ...aggregatedHist];
  const globalMax = Math.max(...allVals, 0.01);
  const globalMin = Math.min(...allVals, -0.01);
  const valRange = (globalMax - globalMin) || 1;
  
  const scaleY = (val) => {
    return height - padding - ((val - globalMin) / valRange) * (height - padding * 2);
  };
  
  const zeroY = scaleY(0);
  const colWidth = (width - padding * 2) / n;
  
  let svgs = `<div class="overflow-x-auto"><svg width="${width}" height="${height}" class="overflow-visible mx-auto my-2">`;
  
  // Grid Lines
  svgs += `<line x1="${padding}" y1="${scaleY(globalMax)}" x2="${width - padding}" y2="${scaleY(globalMax)}" stroke="#27272a" stroke-dasharray="2,2" stroke-width="1" />`;
  svgs += `<line x1="${padding}" y1="${zeroY}" x2="${width - padding}" y2="${zeroY}" stroke="#3f3f46" stroke-width="1" />`;
  svgs += `<line x1="${padding}" y1="${scaleY(globalMin)}" x2="${width - padding}" y2="${scaleY(globalMin)}" stroke="#27272a" stroke-dasharray="2,2" stroke-width="1" />`;
  
  // Legend
  svgs += `<text x="${padding + 5}" y="${scaleY(globalMax) + 12}" fill="#a1a1aa" class="text-[9px] font-mono font-bold uppercase tracking-wider">MAX: ${globalMax.toFixed(3)}</text>`;
  svgs += `<text x="${padding + 5}" y="${scaleY(globalMin) - 4}" fill="#a1a1aa" class="text-[9px] font-mono font-bold uppercase tracking-wider">MIN: ${globalMin.toFixed(3)}</text>`;
  
  // Render Histogram Bars
  for (let i = 0; i < n; i++) {
    const x = padding + i * colWidth + colWidth / 2;
    const histVal = aggregatedHist[i];
    const yHist = scaleY(histVal);
    
    let barWidth = colWidth - 2;
    if (n > 50) barWidth = colWidth - 1;
    barWidth = Math.max(barWidth, 1.5);
    
    const isPositive = histVal >= 0;
    const barColor = isPositive ? '#10b981' : '#f43f5e';
    
    const yStart = isPositive ? yHist : zeroY;
    const hBar = Math.max(Math.abs(zeroY - yHist), 1);
    
    svgs += `<rect x="${x - barWidth / 2}" y="${yStart}" width="${barWidth}" height="${hBar}" fill="${barColor}" fill-opacity="0.25" rx="0.5" />`;
  }
  
  // Render MACD and Signal Lines
  let macdPath = '';
  let signalPath = '';
  
  for (let i = 0; i < n; i++) {
    const x = padding + i * colWidth + colWidth / 2;
    const yM = scaleY(aggregatedMacd[i]);
    const yS = scaleY(aggregatedSignal[i]);
    
    if (i === 0) {
      macdPath += `M ${x} ${yM}`;
      signalPath += `M ${x} ${yS}`;
    } else {
      macdPath += ` L ${x} ${yM}`;
      signalPath += ` L ${x} ${yS}`;
    }
  }
  
  svgs += `<path d="${macdPath}" fill="none" stroke="#3b82f6" stroke-width="1.8" stroke-linecap="round" />`;
  svgs += `<path d="${signalPath}" fill="none" stroke="#f59e0b" stroke-width="1.8" stroke-linecap="round" />`;
  
  svgs += `</svg></div>`;
  return svgs;
}

// Fetch and render LLM Tactical Intelligence Briefing
async function loadLLMStrategicSummary(processedStocks) {
  const contentDiv = document.getElementById('ai-briefing-content');
  if (!contentDiv) return;

  const stocksToUse = processedStocks || [];
  if (stocksToUse.length === 0) {
    contentDiv.innerHTML = `<p class="text-zinc-500 font-mono text-[11px] uppercase">No active stocks in matrix to construct a briefing. Add stocks below to initialize.</p>`;
    return;
  }

  // Pre-calculate minimal information to send to the server
  const processedPayload = stocksToUse.map(stock => {
    return {
      ticker: stock.ticker,
      name: stock.name,
      sector: stock.sector,
      price: stock.lastDay.close,
      changePercent: stock.changePercent,
      macdSignal: stock.macdSig.text,
      scoreVal: stock.scoreVal,
      oneMonthVol: stock.oneMonthVol,
      oneYearVol: stock.oneYearVol
    };
  });

  try {
    const res = await fetch('/api/summary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        stocks: processedPayload,
        timeline: selectedTimeline,
        openrouterKey: openrouterKey
      })
    });

    if (res.ok) {
      const data = await res.json();
      contentDiv.innerHTML = data.summary;
    } else {
      throw new Error('Failed to load LLM summary');
    }
  } catch (error) {
    console.error('Error fetching LLM summary:', error);
    contentDiv.innerHTML = `
      <p class="text-rose-400 font-mono text-xs">Error constructing live intelligence briefing. Recalibrate to retry.</p>
    `;
  }
}

// Launch Station.11
document.addEventListener('DOMContentLoaded', initializeApp);
