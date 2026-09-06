import Papa from 'papaparse';

/**
 * STATION.11 — Tactical Stock Comparison & Momentum Analytics
 * Pure Vanilla TypeScript/JavaScript Engine
 */

// S&P 100 historical registry tracking names, tickers, sectors, and inclusion/removal dates.
// Enables dynamic and accurate tracking of components on any given targetDate.
const SP100_REGISTRY = [
  { name: '3M', ticker: 'MMM', in: '2020-01-01', out: null, sector: 'Industrials' },
  { name: 'AT&T', ticker: 'T', in: '2020-01-01', out: null, sector: 'Communication Services' },
  { name: 'AbbVie', ticker: 'ABBV', in: '2020-01-01', out: null, sector: 'Health Care' },
  { name: 'Abbott Laboratories', ticker: 'ABT', in: '2020-01-01', out: null, sector: 'Health Care' },
  { name: 'Accenture', ticker: 'ACN', in: '2020-01-01', out: null, sector: 'Technology' },
  { name: 'Adobe', ticker: 'ADBE', in: '2020-01-01', out: null, sector: 'Technology' },
  { name: 'Advanced Micro Devices', ticker: 'AMD', in: '2022-09-19', out: null, sector: 'Technology' },
  { name: 'Allergan', ticker: 'AGN', in: '2020-01-01', out: '2020-05-12', sector: 'Health Care' },
  { name: 'Allstate', ticker: 'ALL', in: '2020-01-01', out: '2021-03-22', sector: 'Financial Services' },
  { name: 'Alphabet Class A', ticker: 'GOOGL', in: '2020-01-01', out: null, sector: 'Communication Services' },
  { name: 'Alphabet Class C', ticker: 'GOOG', in: '2020-01-01', out: null, sector: 'Communication Services' },
  { name: 'Altria', ticker: 'MO', in: '2020-01-01', out: null, sector: 'Consumer Defensive' },
  { name: 'Amazon', ticker: 'AMZN', in: '2020-01-01', out: null, sector: 'Consumer Cyclical' },
  { name: 'American Express', ticker: 'AXP', in: '2020-01-01', out: null, sector: 'Financial Services' },
  { name: 'American International Group', ticker: 'AIG', in: '2020-01-01', out: '2026-03-23', sector: 'Financial Services' },
  { name: 'American Tower', ticker: 'AMT', in: '2020-04-06', out: null, sector: 'Real Estate' },
  { name: 'Amgen', ticker: 'AMGN', in: '2020-01-01', out: null, sector: 'Health Care' },
  { name: 'Apple', ticker: 'AAPL', in: '2020-01-01', out: null, sector: 'Technology' },
  { name: 'Applied Materials', ticker: 'AMAT', in: '2026-03-23', out: null, sector: 'Technology' },
  { name: 'Bank of America', ticker: 'BAC', in: '2020-01-01', out: null, sector: 'Financial Services' },
  { name: 'Berkshire Hathaway Class B', ticker: 'BRK.B', in: '2020-01-01', out: null, sector: 'Financial Services' },
  { name: 'Biogen', ticker: 'BIIB', in: '2020-01-01', out: '2022-03-21', sector: 'Health Care' },
  { name: 'BlackRock', ticker: 'BLK', in: '2020-01-01', out: null, sector: 'Financial Services' },
  { name: 'BNY Mellon', ticker: 'BK', in: '2020-01-01', out: null, sector: 'Financial Services' },
  { name: 'Boeing', ticker: 'BA', in: '2020-01-01', out: null, sector: 'Industrials' },
  { name: 'Booking Holdings', ticker: 'BKNG', in: '2020-01-01', out: null, sector: 'Consumer Cyclical' },
  { name: 'Bristol Myers Squibb', ticker: 'BMY', in: '2020-01-01', out: null, sector: 'Health Care' },
  { name: 'Broadcom', ticker: 'AVGO', in: '2021-03-22', out: null, sector: 'Technology' },
  { name: 'Capital One', ticker: 'COF', in: '2020-01-01', out: null, sector: 'Financial Services' },
  { name: 'Caterpillar', ticker: 'CAT', in: '2020-01-01', out: null, sector: 'Industrials' },
  { name: 'Charles Schwab', ticker: 'SCHW', in: '2022-03-21', out: null, sector: 'Financial Services' },
  { name: 'Charter Communications', ticker: 'CHTR', in: '2020-01-01', out: '2025-09-22', sector: 'Communication Services' },
  { name: 'Constellation Energy', ticker: 'CEG', in: '2022-01-01', out: null, sector: 'Utilities' },
  { name: 'Chevron', ticker: 'CVX', in: '2020-01-01', out: null, sector: 'Energy' },
  { name: 'Cisco', ticker: 'CSCO', in: '2020-01-01', out: null, sector: 'Technology' },
  { name: 'Citigroup', ticker: 'C', in: '2020-01-01', out: null, sector: 'Financial Services' },
  { name: 'Coca-Cola', ticker: 'KO', in: '2020-01-01', out: null, sector: 'Consumer Defensive' },
  { name: 'Colgate-Palmolive', ticker: 'CL', in: '2020-01-01', out: null, sector: 'Consumer Defensive' },
  { name: 'Comcast', ticker: 'CMCSA', in: '2020-01-01', out: null, sector: 'Communication Services' },
  { name: 'ConocoPhillips', ticker: 'COP', in: '2020-01-01', out: null, sector: 'Energy' },
  { name: 'Costco', ticker: 'COST', in: '2020-01-01', out: null, sector: 'Consumer Defensive' },
  { name: 'CVS Health', ticker: 'CVS', in: '2020-01-01', out: null, sector: 'Consumer Defensive' },
  { name: 'Danaher', ticker: 'DHR', in: '2020-01-01', out: null, sector: 'Health Care' },
  { name: 'Deere & Company', ticker: 'DE', in: '2023-09-18', out: null, sector: 'Industrials' },
  { name: 'Dow', ticker: 'DOW', in: '2020-01-01', out: '2025-03-24', sector: 'Basic Materials' },
  { name: 'DuPont de Nemours', ticker: 'DD', in: '2020-01-01', out: '2022-09-19', sector: 'Basic Materials' },
  { name: 'Duke Energy', ticker: 'DUK', in: '2020-01-01', out: null, sector: 'Utilities' },
  { name: 'Eli Lilly', ticker: 'LLY', in: '2020-01-01', out: null, sector: 'Health Care' },
  { name: 'Emerson Electric', ticker: 'EMR', in: '2020-01-01', out: null, sector: 'Industrials' },
  { name: 'Exelon', ticker: 'EXC', in: '2020-01-01', out: '2024-03-18', sector: 'Utilities' },
  { name: 'Exxon Mobil', ticker: 'XOM', in: '2020-01-01', out: null, sector: 'Energy' },
  { name: 'FedEx', ticker: 'FDX', in: '2020-01-01', out: null, sector: 'Industrials' },
  { name: 'Ford Motor', ticker: 'F', in: '2020-01-01', out: '2025-03-24', sector: 'Consumer Cyclical' },
  { name: 'Freeport-McMoRan', ticker: 'FCX', in: '2020-01-01', out: null, sector: 'Basic Materials' },
  { name: 'GE Aerospace', ticker: 'GE', in: '2020-01-01', out: null, sector: 'Industrials' },
  { name: 'GE Vernova', ticker: 'GEV', in: '2026-03-23', out: null, sector: 'Industrials' },
  { name: 'General Dynamics', ticker: 'GD', in: '2020-01-01', out: null, sector: 'Industrials' },
  { name: 'General Motors', ticker: 'GM', in: '2020-01-01', out: null, sector: 'Consumer Cyclical' },
  { name: 'Gilead Sciences', ticker: 'GILD', in: '2020-01-01', out: null, sector: 'Health Care' },
  { name: 'Goldman Sachs', ticker: 'GS', in: '2020-01-01', out: null, sector: 'Financial Services' },
  { name: 'Home Depot', ticker: 'HD', in: '2020-01-01', out: null, sector: 'Consumer Cyclical' },
  { name: 'Honeywell Aerospace', ticker: 'HONA', in: '2026-06-29', out: null, sector: 'Industrials' },
  { name: 'Honeywell International', ticker: 'HON', in: '2020-01-01', out: '2026-06-30', sector: 'Industrials' },
  { name: 'IBM', ticker: 'IBM', in: '2020-01-01', out: null, sector: 'Technology' },
  { name: 'Intel', ticker: 'INTC', in: '2020-01-01', out: null, sector: 'Technology' },
  { name: 'Intuit', ticker: 'INTU', in: '2024-03-18', out: null, sector: 'Technology' },
  { name: 'Intuitive Surgical', ticker: 'ISRG', in: '2025-03-24', out: null, sector: 'Health Care' },
  { name: 'Johnson & Johnson', ticker: 'JNJ', in: '2020-01-01', out: null, sector: 'Health Care' },
  { name: 'JPMorgan Chase', ticker: 'JPM', in: '2020-01-01', out: null, sector: 'Financial Services' },
  { name: 'Kinder Morgan', ticker: 'KMI', in: '2020-01-01', out: '2021-03-22', sector: 'Energy' },
  { name: 'Kraft Heinz', ticker: 'KHC', in: '2020-01-01', out: '2025-03-24', sector: 'Consumer Defensive' },
  { name: 'Lam Research', ticker: 'LRCX', in: '2026-03-23', out: null, sector: 'Technology' },
  { name: 'Linde', ticker: 'LIN', in: '2021-03-22', out: null, sector: 'Basic Materials' },
  { name: 'Lockheed Martin', ticker: 'LMT', in: '2020-01-01', out: null, sector: 'Industrials' },
  { name: 'Lowe\'s', ticker: 'LOW', in: '2020-01-01', out: null, sector: 'Consumer Cyclical' },
  { name: 'Mastercard', ticker: 'MA', in: '2020-01-01', out: null, sector: 'Financial Services' },
  { name: 'McDonald\'s', ticker: 'MCD', in: '2020-01-01', out: null, sector: 'Consumer Cyclical' },
  { name: 'Medtronic', ticker: 'MDT', in: '2020-01-01', out: null, sector: 'Health Care' },
  { name: 'Merck & Co.', ticker: 'MRK', in: '2020-01-01', out: null, sector: 'Health Care' },
  { name: 'MetLife', ticker: 'MET', in: '2020-01-01', out: '2026-03-23', sector: 'Financial Services' },
  { name: 'Meta Platforms', ticker: 'META', in: '2020-01-01', out: null, sector: 'Communication Services' },
  { name: 'Micron Technology', ticker: 'MU', in: '2026-03-23', out: null, sector: 'Technology' },
  { name: 'Microsoft', ticker: 'MSFT', in: '2020-01-01', out: null, sector: 'Technology' },
  { name: 'Mondelez International', ticker: 'MDLZ', in: '2020-01-01', out: null, sector: 'Consumer Defensive' },
  { name: 'Morgan Stanley', ticker: 'MS', in: '2020-01-01', out: null, sector: 'Financial Services' },
  { name: 'Netflix', ticker: 'NFLX', in: '2020-01-01', out: null, sector: 'Communication Services' },
  { name: 'Newmont Corporation', ticker: 'NEM', in: '2020-01-01', out: null, sector: 'Basic Materials' },
  { name: 'NextEra Energy', ticker: 'NEE', in: '2020-01-01', out: null, sector: 'Utilities' },
  { name: 'Nike', ticker: 'NKE', in: '2020-01-01', out: null, sector: 'Consumer Cyclical' },
  { name: 'Nvidia', ticker: 'NVDA', in: '2020-01-01', out: null, sector: 'Technology' },
  { name: 'Occidental Petroleum', ticker: 'OXY', in: '2020-01-01', out: '2020-12-21', sector: 'Energy' },
  { name: 'Oracle', ticker: 'ORCL', in: '2020-01-01', out: null, sector: 'Technology' },
  { name: 'Palantir Technologies', ticker: 'PLTR', in: '2025-03-24', out: null, sector: 'Technology' },
  { name: 'PayPal', ticker: 'PYPL', in: '2020-01-01', out: '2026-03-23', sector: 'Financial Services' },
  { name: 'PepsiCo', ticker: 'PEP', in: '2020-01-01', out: null, sector: 'Consumer Defensive' },
  { name: 'Pfizer', ticker: 'PFE', in: '2020-01-01', out: null, sector: 'Health Care' },
  { name: 'Philip Morris International', ticker: 'PM', in: '2020-01-01', out: null, sector: 'Consumer Defensive' },
  { name: 'Procter & Gamble', ticker: 'PG', in: '2020-01-01', out: null, sector: 'Consumer Defensive' },
  { name: 'Qualcomm', ticker: 'QCOM', in: '2020-01-01', out: null, sector: 'Technology' },
  { name: 'Raytheon Company', ticker: 'RTN', in: '2020-01-01', out: '2020-04-06', sector: 'Industrials' },
  { name: 'RTX', ticker: 'RTX', in: '2020-01-01', out: null, sector: 'Industrials' },
  { name: 'Salesforce', ticker: 'CRM', in: '2020-05-12', out: null, sector: 'Technology' },
  { name: 'SLB', ticker: 'SLB', in: '2020-01-01', out: '2021-03-22', sector: 'Energy' },
  { name: 'ServiceNow', ticker: 'NOW', in: '2025-03-24', out: null, sector: 'Technology' },
  { name: 'Simon Property Group', ticker: 'SPG', in: '2020-01-01', out: null, sector: 'Real Estate' },
  { name: 'Southern Company', ticker: 'SO', in: '2020-01-01', out: null, sector: 'Utilities' },
  { name: 'Starbucks', ticker: 'SBUX', in: '2020-01-01', out: null, sector: 'Consumer Cyclical' },
  { name: 'T-Mobile US', ticker: 'TMUS', in: '2021-03-22', out: null, sector: 'Communication Services' },
  { name: 'Target', ticker: 'TGT', in: '2020-01-01', out: '2026-03-23', sector: 'Consumer Cyclical' },
  { name: 'Tesla', ticker: 'TSLA', in: '2020-12-21', out: null, sector: 'Consumer Cyclical' },
  { name: 'Texas Instruments', ticker: 'TXN', in: '2020-01-01', out: null, sector: 'Technology' },
  { name: 'Thermo Fisher Scientific', ticker: 'TMO', in: '2020-01-01', out: null, sector: 'Health Care' },
  { name: 'Uber Technologies', ticker: 'UBER', in: '2025-09-22', out: null, sector: 'Technology' },
  { name: 'Union Pacific', ticker: 'UNP', in: '2020-01-01', out: null, sector: 'Industrials' },
  { name: 'United Parcel Service', ticker: 'UPS', in: '2020-01-01', out: null, sector: 'Industrials' },
  { name: 'UnitedHealth Group', ticker: 'UNH', in: '2020-01-01', out: null, sector: 'Health Care' },
  { name: 'U.S. Bancorp', ticker: 'USB', in: '2020-01-01', out: null, sector: 'Financial Services' },
  { name: 'Verizon', ticker: 'VZ', in: '2020-01-01', out: null, sector: 'Communication Services' },
  { name: 'Visa', ticker: 'V', in: '2020-01-01', out: null, sector: 'Financial Services' },
  { name: 'Walgreens Boots Alliance', ticker: 'WBA', in: '2020-01-01', out: '2023-09-18', sector: 'Consumer Defensive' },
  { name: 'Walmart', ticker: 'WMT', in: '2020-01-01', out: null, sector: 'Consumer Defensive' },
  { name: 'Walt Disney', ticker: 'DIS', in: '2020-01-01', out: null, sector: 'Communication Services' },
  { name: 'Wells Fargo', ticker: 'WFC', in: '2020-01-01', out: null, sector: 'Financial Services' }
];

// Global state
let stocks = [];
let targetDate = '2026-09-01';
let selectedTimeline = 'manual'; 
let manualStartDate = '2026-01-01';
let twelvedataKey = '';
let openrouterKey = '';
const csvCompanyNames = {};
const expandedSectorCharts = new Set();
let csvHistoryData = null;
let isCsvLoading = false;

const BIG_30_TICKERS = [
  'NVDA', 'AAPL', 'MSFT',
  'GOOGL', 'META', 'NFLX',
  'AMZN', 'TSLA', 'HD',
  'LLY', 'UNH', 'JNJ',
  'BRK.B', 'JPM', 'V',
  'WMT', 'COST', 'PG',
  'XOM', 'CVX', 'COP',
  'GEV', 'RTX', 'CAT',
  'LIN', 'FCX', 'NEM',
  'NEE', 'CEG', 'SO'
];

// Selection pool restricted to 30 stocks maximum
let investPool = [...BIG_30_TICKERS];
let displayMode = 'top30'; // 'all' or 'top30'

// Load or restore default stocks list
function getDefaultStocksList(dateVal) {
  // Only return stocks that were actually active S&P 100 components on dateVal
  return SP100_REGISTRY.filter(item => {
    const included = item.in <= dateVal;
    const excluded = item.out ? item.out <= dateVal : false;
    return included && !excluded;
  }).map(item => {
    let basePrice = 150.0;
    if (csvHistoryData && csvHistoryData[item.ticker]) {
      const hist = csvHistoryData[item.ticker];
      const found = hist.filter(h => h.date <= dateVal).pop();
      if (found) basePrice = found.close;
    }
    return {
      ticker: item.ticker,
      name: item.name,
      sector: item.sector,
      basePrice: basePrice
    };
  });
}

// Load and parse the S&P 100 historical data from backend proxy
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

// Get stock historical data from CSV or fallback to simulated data
function getStockHistory(stock, dateVal, daysCount) {
  let history = [];
  
  if (!twelvedataKey && csvHistoryData && csvHistoryData[stock.ticker]) {
    const allTickerHistory = csvHistoryData[stock.ticker];
    const filteredHistory = allTickerHistory.filter(h => h.date <= dateVal);
    if (filteredHistory.length >= 5) {
      history = filteredHistory.slice(-(daysCount + 50));
    }
  }
  
  if (history.length < daysCount + 50) {
    history = generateStockHistory(stock.ticker, stock.basePrice, dateVal, daysCount);
  }
  
  return history;
}

// Seedable deterministic walk to generate high-fidelity history backfills
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

// Timeline display range math
function getTimelineDetails() {
  const target = new Date(targetDate);
  if (isNaN(target.getTime())) {
    return { daysCount: 21, label: '1 Month' };
  }
  
  let label = '1 Month';
  let daysCount = 21; 
  
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

// Generate high quality fallback price history
function generateStockHistory(ticker, basePrice, dateStr, displayDays) {
  const rand = createSeededRandom(ticker + dateStr);
  const history = [];
  const totalDays = displayDays + 50; 
  
  let currentClose = basePrice;
  for (let i = totalDays - 1; i >= 0; i--) {
    const dailyChangePercent = (rand() - 0.49) * 0.024;
    const prevClose = currentClose / (1 + dailyChangePercent);
    
    const open = prevClose * (1 + (rand() - 0.5) * 0.005);
    const close = currentClose;
    
    const minOC = Math.min(open, close);
    const maxOC = Math.max(open, close);
    const high = maxOC * (1 + rand() * 0.015);
    const low = minOC * (1 - rand() * 0.015);
    
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
  
  return history.reverse();
}

// Calculate Exponential Moving Average
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

// Calculate MACD lines
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

// Render OHLC Candlestick SVG sparkline
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
    const strokeColor = isBullish ? '#10b981' : '#f43f5e';
    
    const wickWidth = n > 100 ? 0.5 : 1;
    svgs += `<line x1="${x}" y1="${yHigh}" x2="${x}" y2="${yLow}" stroke="${strokeColor}" stroke-width="${wickWidth}" />`;
    
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

// Render MACD histogram sparkline (without average lines)
function renderMACDSparkline(macd, signal, hist, displayDays) {
  const width = 160;
  const height = 36;
  const padding = 3;
  
  const hDisp = hist.slice(-displayDays);
  const n = hDisp.length;
  
  const allVals = [...hDisp];
  const globalMax = Math.max(...allVals, 0.01);
  const globalMin = Math.min(...allVals, -0.01);
  const valRange = (globalMax - globalMin) || 1;
  
  const scaleY = (val) => {
    return height - padding - ((val - globalMin) / valRange) * (height - padding * 2);
  };
  
  const zeroY = scaleY(0);
  const colWidth = width / n;
  let svgs = `<svg width="${width}" height="${height}" class="mx-auto overflow-visible">`;
  
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
    
    svgs += `<rect x="${x - barWidth / 2}" y="${yStart}" width="${barWidth}" height="${hBar}" fill="${barColor}" fill-opacity="0.65" rx="0.2" />`;
  });
  
  svgs += `</svg>`;
  return svgs;
}

// Calculate Annualized Volatility
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

// Crossover signal generator
// "buy or sell - only when the colour changed that day"
// "hold or avoid - when the colour has been the same for 2 or more consecutive days"
function calculateMACDSignal(hist) {
  const hToday = hist[hist.length - 1] || 0;
  const hYesterday = hist[hist.length - 2] || 0;
  
  const isGreenToday = hToday >= 0;
  const isGreenYesterday = hYesterday >= 0;

  let text = 'HOLD';
  let badgeClass = 'bg-zinc-900/80 text-zinc-400 border border-zinc-800';
  let desc = 'MACD momentum flat';
  let icon = `
    <svg class="w-3.5 h-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M18 12H6" />
    </svg>
  `;
  
  if (isGreenToday && !isGreenYesterday) {
    // Red yesterday, Green today -> BUY (color changed to green today)
    text = 'BUY';
    badgeClass = 'bg-emerald-500 text-black border border-emerald-400 font-extrabold shadow-md shadow-emerald-950/40 animate-pulse';
    desc = 'Crossover to Green Today';
    icon = `
      <svg class="w-3.5 h-3.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
        <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l7.5-7.5 7.5 7.5m-15 6l7.5-7.5 7.5 7.5" />
      </svg>
    `;
  } else if (!isGreenToday && isGreenYesterday) {
    // Green yesterday, Red today -> SELL (color changed to red today)
    text = 'SELL';
    badgeClass = 'bg-rose-500 text-black border border-rose-400 font-extrabold shadow-md shadow-rose-950/40 animate-pulse';
    desc = 'Crossover to Red Today';
    icon = `
      <svg class="w-3.5 h-3.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 5.25l-7.5 7.5-7.5-7.5m15 6l-7.5 7.5-7.5-7.5" />
      </svg>
    `;
  } else if (isGreenToday && isGreenYesterday) {
    // Sustained Green -> HOLD (color same for 2 or more consecutive days)
    text = 'HOLD';
    badgeClass = 'bg-emerald-950/30 text-emerald-400 border border-emerald-900/60';
    desc = 'Sustained Green Momentum';
    icon = `
      <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M18 12H6" />
      </svg>
    `;
  } else {
    // Sustained Red -> AVOID (color same for 2 or more consecutive days)
    text = 'AVOID';
    badgeClass = 'bg-rose-950/20 text-rose-400 border border-rose-900/60';
    desc = 'Sustained Red Momentum';
    icon = `
      <svg class="w-3.5 h-3.5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    `;
  }
  
  return { text, badgeClass, desc, icon };
}

// Fetch Twelve Data (optional endpoint)
async function fetchTwelveData(tickers, apiKey, displayDays) {
  try {
    const tickerParam = tickers.join(',');
    const outputsize = Math.min(250, displayDays + 50);
    const url = `https://api.twelvedata.com/time_series?symbol=${tickerParam}&interval=1day&outputsize=${outputsize}&apikey=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('API Response Error');
    return await response.json();
  } catch (error) {
    console.error('Twelve Data Fetch Failed:', error);
    return null;
  }
}

function getNormalizedSector(sector) {
  if (sector === 'Real Estate' || sector === 'Utilities') {
    return 'Utilities & Real Estate';
  }
  return sector;
}

// Render S&P 100 main overview dashboard with sector grouping and headers
async function renderDashboard() {
  const container = document.getElementById('stocks-list');
  const activeCountLabel = document.getElementById('active-count');
  if (!container) return;
  container.innerHTML = '';
  
  // Custom display filtering for the Big 30 vs all 100
  const activeList = displayMode === 'top30' 
    ? stocks.filter(s => BIG_30_TICKERS.includes(s.ticker))
    : stocks;

  activeCountLabel.textContent = activeList.length;
  
  // Restores standard controls
  const showAddBtn = document.getElementById('show-add-form-btn');
  if (showAddBtn) {
    showAddBtn.disabled = false;
    showAddBtn.classList.remove('opacity-40', 'cursor-not-allowed');
    showAddBtn.innerHTML = `
      <svg class="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
      <span>Add Stock <span class="text-zinc-500">(To active roster)</span></span>
    `;
  }

  if (activeList.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="8" class="py-12 text-center text-zinc-500 text-sm font-mono">
          No stocks currently listed on this target date.
        </td>
      </tr>
    `;
    return;
  }

  // 1. SEQUENTIAL PIOTROSKI F-SCORE CALCULATION (ONE-BY-ONE)
  // Ensure that all F-scores are calculated one-by-one before sorting or rendering
  container.innerHTML = `
    <tr>
      <td colspan="8" class="py-16 text-center text-zinc-400 text-xs font-mono">
        <div class="flex flex-col items-center justify-center gap-3.5 max-w-sm mx-auto bg-zinc-950/60 p-6 rounded-xl border border-zinc-800/80">
          <svg class="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span id="calculating-fscores-status" class="text-[11px] font-bold text-zinc-300">Analyzing SEC financials one by one...</span>
          <div class="w-full bg-zinc-900 rounded-full h-1 overflow-hidden mt-1">
            <div id="loading-inner-bar" class="bg-blue-500 h-full w-0 transition-all duration-150"></div>
          </div>
        </div>
      </td>
    </tr>
  `;

  const fProgress = document.getElementById('fscore-progress-container');
  if (fProgress) {
    fProgress.classList.remove('hidden');
    fProgress.classList.add('flex');
  }

  const big30Active = stocks.filter(s => BIG_30_TICKERS.includes(s.ticker));
  const remainingActive = stocks.filter(s => !BIG_30_TICKERS.includes(s.ticker));

  const pBar = document.getElementById('fscore-progress-bar');
  const pTxt = document.getElementById('fscore-progress-text');
  const innerBar = document.getElementById('loading-inner-bar');
  const statusSpan = document.getElementById('calculating-fscores-status');

  let completedCount = 0;
  const updateProgress = (ticker) => {
    completedCount++;
    const pct = Math.round((completedCount / big30Active.length) * 100);
    if (pBar) pBar.style.width = `${pct}%`;
    if (pTxt) pTxt.textContent = `${pct}% (${completedCount}/${big30Active.length})`;
    if (innerBar) innerBar.style.width = `${pct}%`;
    if (statusSpan) statusSpan.textContent = `Analyzing priority roster: ${ticker} (${completedCount} of ${big30Active.length})`;
  };

  const fetchPromises = big30Active.map(async (stock) => {
    if (!fScoresCache[stock.ticker]) {
      try {
        const res = await fetch(`/api/fscore?ticker=${stock.ticker}`);
        if (res.ok) {
          fScoresCache[stock.ticker] = await res.json();
        }
      } catch (error) {
        console.log(`Failed to calculate F-score for ${stock.ticker}:`, error);
      }
    }
    updateProgress(stock.ticker);
  });

  await Promise.all(fetchPromises);

  // Kick off remaining stocks F-scores calculation sequentially in the background
  calculateRemainingInBackground(remainingActive);

  // Once all priority calculated, hide progress container after a small grace delay
  setTimeout(() => {
    if (fProgress) fProgress.classList.add('hidden');
  }, 1000);

  // Clear container loading state
  container.innerHTML = '';

  const { daysCount, label: timelineLabel } = getTimelineDetails();
  
  const ohlcHeader = document.getElementById('ohlc-header');
  const macdHeader = document.getElementById('macd-header');
  if (ohlcHeader) ohlcHeader.textContent = `OHLC Candlesticks (${timelineLabel})`;
  if (macdHeader) macdHeader.textContent = `MACD Momentum (${timelineLabel})`;

  let liveData = null;
  const statusDot = document.getElementById('api-status-dot');
  
  if (twelvedataKey) {
    if (statusDot) statusDot.className = "w-2 h-2 rounded-full bg-yellow-500 animate-pulse";
    const tickers = activeList.map(s => s.ticker);
    liveData = await fetchTwelveData(tickers, twelvedataKey, daysCount);
    if (liveData && statusDot) {
      statusDot.className = "w-2 h-2 rounded-full bg-emerald-500";
    } else if (statusDot) {
      statusDot.className = "w-2 h-2 rounded-full bg-rose-500";
    }
  } else if (statusDot) {
    statusDot.className = "w-2 h-2 rounded-full bg-zinc-600";
  }

  // Pre-calculate statistics
  const processedStocks = activeList.map(stock => {
    let history = [];
    let isLive = false;

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

    if (history.length < daysCount + 50) {
      history = getStockHistory(stock, targetDate, daysCount);
    }

    const displayHistory = history.slice(-daysCount);
    const lastDay = displayHistory[displayHistory.length - 1] || { close: stock.basePrice, open: stock.basePrice };
    const prevDay = displayHistory[displayHistory.length - 2] || lastDay;
    
    const change = lastDay.close - prevDay.close;
    const changePercent = (change / prevDay.close) * 100;
    
    const { macd, signal, hist } = calculateMACD(history);
    const macdSig = calculateMACDSignal(hist);

    const ohlcSparkline = renderOHLCSparkline(history, daysCount);
    const macdSparkline = renderMACDSparkline(macd, signal, hist, daysCount);

    const fScoreCached = fScoresCache[stock.ticker];
    const scoreVal = fScoreCached ? fScoreCached.score : 0;

    const oneMonthVol = calculateAnnualizedVolatility(history, 30);
    const oneYearVol = calculateAnnualizedVolatility(history, history.length);
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
      latestHistVal,
      sector: getNormalizedSector(stock.sector) // Ensure normalized sectors always
    };
  });

  // Calculate & Render overall S&P 100 Index Headline details
  if (processedStocks.length > 0) {
    const totalChange = processedStocks.reduce((acc, s) => {
      const startClose = s.history[s.history.length - daysCount]?.close || s.basePrice;
      const changeFromStart = ((s.lastDay.close - startClose) / startClose) * 100;
      return acc + changeFromStart;
    }, 0) / processedStocks.length;

    const avgMacdMom = processedStocks.reduce((acc, s) => acc + s.latestHistVal, 0) / processedStocks.length;

    const devLabel = document.getElementById('index-headline-dev');
    if (devLabel) {
      devLabel.className = `text-sm font-black font-mono ${totalChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`;
      devLabel.textContent = `${totalChange >= 0 ? '▲ +' : '▼ '}${totalChange.toFixed(2)}%`;
    }

    const macdLabel = document.getElementById('index-headline-macd');
    if (macdLabel) {
      let momClass = 'text-zinc-400';
      let momText = 'Neutral';
      if (avgMacdMom > 0.05) {
        momClass = 'text-emerald-400 font-bold';
        momText = 'Bullish';
      } else if (avgMacdMom < -0.05) {
        momClass = 'text-rose-400 font-bold';
        momText = 'Bearish';
      }
      macdLabel.innerHTML = `<span class="${momClass}">${avgMacdMom >= 0 ? '+' : ''}${avgMacdMom.toFixed(4)} • ${momText}</span>`;
    }
  }

  // Group by sector
  const sectorsMap = {};
  processedStocks.forEach(stock => {
    if (!sectorsMap[stock.sector]) {
      sectorsMap[stock.sector] = [];
    }
    sectorsMap[stock.sector].push(stock);
  });

  const sortedSectors = Object.keys(sectorsMap).sort();

  // Sort within sector: Piotroski F-Score (Desc) -> Volatility Year (Asc) -> Volatility Month (Asc)
  sortedSectors.forEach(sector => {
    sectorsMap[sector].sort((a, b) => {
      if (b.scoreVal !== a.scoreVal) return b.scoreVal - a.scoreVal;
      if (a.oneYearVol !== b.oneYearVol) return a.oneYearVol - b.oneYearVol;
      return a.oneMonthVol - b.oneMonthVol;
    });
  });

  let displayedCount = 0;

  sortedSectors.forEach(sector => {
    const allSectorStocks = sectorsMap[sector];
    if (allSectorStocks.length === 0) return;

    // Slice for display count only
    const sectorStocksToDisplay = displayMode === 'top30'
      ? allSectorStocks.slice(0, 3)
      : allSectorStocks;

    displayedCount += sectorStocksToDisplay.length;

    const sumPrices = allSectorStocks.reduce((sum, s) => sum + s.lastDay.close, 0);
    let weightedHistAvg = 0;
    
    if (sumPrices > 0) {
      weightedHistAvg = allSectorStocks.reduce((sum, s) => {
        const weight = s.lastDay.close / sumPrices;
        return sum + (s.latestHistVal * weight);
      }, 0);
    } else {
      weightedHistAvg = allSectorStocks.reduce((sum, s) => sum + s.latestHistVal, 0) / allSectorStocks.length;
    }

    // Determine sector momentum
    let trendClass = 'text-zinc-400 bg-zinc-900/40 border-zinc-800/40';
    let trendText = 'Neutral';
    if (weightedHistAvg > 0.05) {
      trendClass = 'text-emerald-400 bg-emerald-950/20 border-emerald-400/20 font-bold';
      trendText = 'Bullish Momentum';
    } else if (weightedHistAvg > 0) {
      trendClass = 'text-emerald-500/80 bg-emerald-950/10 border-emerald-900/10';
      trendText = 'Mod. Bullish';
    } else if (weightedHistAvg < -0.05) {
      trendClass = 'text-rose-400 bg-rose-950/20 border-rose-400/20 font-bold';
      trendText = 'Bearish Momentum';
    } else if (weightedHistAvg < 0) {
      trendClass = 'text-rose-500/80 bg-rose-950/10 border-rose-900/10';
      trendText = 'Mod. Bearish';
    }

    // Calculate Sector change from beginning of timeline period
    const totalSectorChange = allSectorStocks.reduce((acc, s) => {
      const startClose = s.history[s.history.length - daysCount]?.close || s.basePrice;
      const changeFromStart = ((s.lastDay.close - startClose) / startClose) * 100;
      return acc + changeFromStart;
    }, 0) / allSectorStocks.length;

    // Calculate averages of ALL companies in the sector for Volatilities & F-Score
    const avgOneMonthVolAll = allSectorStocks.reduce((sum, s) => sum + s.oneMonthVol, 0) / allSectorStocks.length;
    const avgOneYearVolAll = allSectorStocks.reduce((sum, s) => sum + s.oneYearVol, 0) / allSectorStocks.length;
    const avgFScoreAll = allSectorStocks.reduce((sum, s) => sum + s.scoreVal, 0) / allSectorStocks.length;

    // Calculate Sector Aggregate MACD Sparkline (from ALL sector stocks)
    const aggregatedMacd = new Array(daysCount).fill(0);
    const aggregatedSignal = new Array(daysCount).fill(0);
    const aggregatedHist = new Array(daysCount).fill(0);

    for (let i = 0; i < daysCount; i++) {
      let count = 0;
      allSectorStocks.forEach(stock => {
        const mDisp = stock.macd;
        const sDisp = stock.signal;
        const hDisp = stock.hist;
        
        const idx = mDisp.length - daysCount + i;
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
    const sectorMacdSparkline = renderMACDSparkline(aggregatedMacd, aggregatedSignal, aggregatedHist, daysCount);

    // Render Sector Row - exactly identical size and layout columns as stock rows
    const sectorHeaderRow = document.createElement('tr');
    sectorHeaderRow.className = "bg-zinc-900/60 hover:bg-zinc-900/70 transition-all font-mono select-none border-t border-b border-zinc-800/80 text-sm align-middle";
    const isChartExpanded = expandedSectorCharts.has(sector);
    const sectorSafeId = sector.replace(/\s+/g, '-');
    const toggleBtnText = isChartExpanded ? 'Hide MACD' : 'Show MACD';
    const toggleBtnClass = isChartExpanded
      ? 'text-zinc-300 border-zinc-700 bg-zinc-800/40'
      : 'text-blue-400 border-blue-500/20 bg-blue-950/10';

    sectorHeaderRow.innerHTML = `
      <td class="py-4 px-6 bg-zinc-900/60">
        <div class="flex flex-col">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <span class="font-bold text-white tracking-wider text-sm">${sector}</span>
          </div>
          <span class="text-xs text-zinc-400 font-medium">${allSectorStocks.length} Stock${allSectorStocks.length > 1 ? 's' : ''}</span>
        </div>
      </td>
      <td class="py-4 px-4 text-right bg-zinc-900/60">
        <div class="flex flex-col items-end">
          <span class="font-mono text-[10px] text-zinc-500 uppercase tracking-wider">Sector Chg</span>
          <span class="text-xs font-mono flex items-center gap-0.5 ${totalSectorChange >= 0 ? 'text-emerald-500' : 'text-rose-500'} font-bold">
            ${totalSectorChange >= 0 ? '+' : ''}${totalSectorChange.toFixed(2)}%
          </span>
        </div>
      </td>
      <td class="py-4 px-4 text-center bg-zinc-900/60 font-mono text-zinc-600">—</td>
      <td class="py-4 px-4 text-center bg-zinc-900/60">
        <div class="inline-block py-1">
          ${sectorMacdSparkline}
        </div>
      </td>
      <td class="py-4 px-4 text-center bg-zinc-900/60">
        <div class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono select-none ${trendClass}">
          <span>${weightedHistAvg >= 0 ? '+' : ''}${weightedHistAvg.toFixed(4)} • ${trendText}</span>
        </div>
      </td>
      <td class="py-4 px-4 text-center bg-zinc-900/60">
        <div class="inline-flex items-center justify-center bg-zinc-950 px-2.5 py-1.5 rounded border border-zinc-800 text-xs font-mono text-zinc-400">
          Avg F: <span class="text-zinc-200 font-black ml-1">${avgFScoreAll.toFixed(1)}/9</span>
        </div>
      </td>
      <td class="py-4 px-4 text-center bg-zinc-900/60">
        <div class="flex flex-col items-center justify-center">
          <span class="font-mono text-xs font-bold text-white">${avgOneMonthVolAll.toFixed(1)}% <span class="text-[9px] text-zinc-500 font-normal">1M</span></span>
          <span class="font-mono text-[10px] text-zinc-400">${avgOneYearVolAll.toFixed(1)}% <span class="text-[9px] text-zinc-500 font-normal">1Y</span></span>
        </div>
      </td>
      <td class="py-4 px-6 text-center bg-zinc-900/60">
        <button class="toggle-sector-chart-btn text-[10px] font-mono px-3 py-1.5 border rounded-lg transition-all cursor-pointer whitespace-nowrap font-bold uppercase tracking-wider ${toggleBtnClass}" data-sector="${sector}" id="toggle-btn-${sectorSafeId}">
          ${toggleBtnText}
        </button>
      </td>
    `;
    container.appendChild(sectorHeaderRow);

    // Collapsible MACD Charts
    const sectorChartRow = document.createElement('tr');
    sectorChartRow.id = `sector-chart-row-${sectorSafeId}`;
    sectorChartRow.className = isChartExpanded ? "bg-zinc-950/30 border-b border-zinc-800/40" : "bg-zinc-950/30 border-b border-zinc-800/40 hidden";
    const chartSvg = renderSectorMACDChart(allSectorStocks, daysCount);
    
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

    // Render individual Stock Rows
    sectorStocksToDisplay.forEach(stock => {
      const row = document.createElement('tr');
      row.className = "hover:bg-zinc-900/40 transition-all border-b border-zinc-800/40 text-sm align-middle";
      row.id = `stock-row-${stock.ticker}`;
      
      const isInPool = investPool.includes(stock.ticker);
      const poolBtnClass = isInPool 
        ? 'bg-blue-600 text-white border-blue-500 hover:bg-blue-500 shadow-md font-bold'
        : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-900 hover:text-white';
      const poolBtnText = isInPool ? '★ In Pool' : '+ Add Pool';

      const fScoreData = fScoresCache[stock.ticker];

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
          ${getFScoreBadgeHtml(stock.ticker, fScoreData)}
        </td>
        <td class="py-4 px-4 text-center">
          <div class="flex flex-col items-center justify-center">
            <span class="font-mono text-xs font-bold text-white">${stock.oneMonthVol.toFixed(1)}% <span class="text-[9px] text-zinc-500 font-normal">1M</span></span>
            <span class="font-mono text-[10px] text-zinc-400">${stock.oneYearVol.toFixed(1)}% <span class="text-[9px] text-zinc-500 font-normal">1Y</span></span>
          </div>
        </td>
        <td class="py-4 px-6 text-center">
          <button data-pool-ticker="${stock.ticker}" class="toggle-pool-btn text-[10px] font-mono px-3 py-1.5 border rounded-lg transition-all cursor-pointer whitespace-nowrap font-bold uppercase tracking-wider ${poolBtnClass}">
            ${poolBtnText}
          </button>
        </td>
      `;
      container.appendChild(row);

      // Register modal handler instantly on fscore button click
      const cell = row.querySelector(`#fscore-cell-${stock.ticker}`);
      if (cell) {
        const btn = cell.querySelector('button');
        if (btn && fScoreData) {
          btn.addEventListener('click', () => {
            showFScoreDetailsModal(fScoreData);
          });
        }
      }
    });
  });

  // Update dynamic count label to display only the actually loaded/filtered stocks count
  activeCountLabel.textContent = displayedCount;

  // Toggle Pool Membership button click handler
  document.querySelectorAll('.toggle-pool-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const ticker = btn.getAttribute('data-pool-ticker');
      togglePoolMembership(ticker);
    });
  });

  // Sector MACD Chart expander clicks
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
          btn.textContent = 'Hide MACD';
          btn.className = 'toggle-sector-chart-btn text-[10px] font-mono px-3 py-1.5 border rounded-lg transition-all cursor-pointer whitespace-nowrap font-bold uppercase tracking-wider text-zinc-300 border-zinc-700 bg-zinc-800/40';
          expandedSectorCharts.add(sector);
        } else {
          chartRow.classList.add('hidden');
          btn.textContent = 'Show MACD';
          btn.className = 'toggle-sector-chart-btn text-[10px] font-mono px-3 py-1.5 border rounded-lg transition-all cursor-pointer whitespace-nowrap font-bold uppercase tracking-wider text-blue-400 border-blue-500/20 bg-blue-950/10';
          expandedSectorCharts.delete(sector);
        }
      }
    });
  });

  // Load brief analysis
  loadLLMStrategicSummary(processedStocks);

  // Auto-run backtest right after calculations have completed
  runInvestBacktest(true);
}

// Pool Toggle Membership
function togglePoolMembership(ticker) {
  const index = investPool.indexOf(ticker);
  if (index >= 0) {
    investPool.splice(index, 1);
  } else {
    if (investPool.length >= 30) {
      alert('Simulation basket is capped at 30 stocks maximum. Please remove a stock from the Invest tab pool first.');
      return;
    }
    investPool.push(ticker);
  }
  localStorage.setItem('station11_invest_pool', JSON.stringify(investPool));
  renderPool();
  renderDashboard();
}

// Render dynamic stock tags in the Backtest Invest Pool section
function renderPool() {
  const container = document.getElementById('pool-stocks-container');
  const countBadge = document.getElementById('pool-count-badge');
  if (!container) return;
  container.innerHTML = '';
  
  if (countBadge) countBadge.textContent = `${investPool.length} / 30`;

  if (investPool.length === 0) {
    container.innerHTML = `
      <span class="text-xs text-zinc-500 font-mono italic">No stocks added to the pool yet. Go to the OVERVIEW tab to build your custom pool of up to 30 stocks.</span>
    `;
    return;
  }

  investPool.forEach(ticker => {
    const itemInfo = SP100_REGISTRY.find(r => r.ticker === ticker) || { name: ticker, sector: 'S&P 100' };
    const tag = document.createElement('div');
    tag.className = "flex items-center gap-1.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-zinc-200 transition-all shadow-sm group select-none";
    tag.innerHTML = `
      <span>${ticker}</span>
      <span class="text-[9px] text-zinc-500 group-hover:text-zinc-300 font-normal">(${itemInfo.sector})</span>
      <button data-remove-pool="${ticker}" class="text-zinc-500 hover:text-rose-400 ml-1 cursor-pointer transition-all font-sans font-bold text-xs leading-none">✕</button>
    `;
    
    tag.querySelector('button').addEventListener('click', (e) => {
      e.stopPropagation();
      togglePoolMembership(ticker);
    });
    
    container.appendChild(tag);
  });
}

// F-Score Progressive Async Fetchers
let fScoresCache = {};
let pendingBackgroundFetches = new Set();

async function calculateRemainingInBackground(remainingList) {
  for (const stock of remainingList) {
    if (fScoresCache[stock.ticker] || pendingBackgroundFetches.has(stock.ticker)) {
      continue;
    }
    pendingBackgroundFetches.add(stock.ticker);
    try {
      const res = await fetch(`/api/fscore?ticker=${stock.ticker}`);
      if (res.ok) {
        const data = await res.json();
        fScoresCache[stock.ticker] = data;
        updateFScoreCell(stock.ticker, data);
      }
    } catch (e) {
      console.log(`Background F-score skip: ${stock.ticker}`);
    } finally {
      pendingBackgroundFetches.delete(stock.ticker);
    }
    // Stagger sequential background loading by 100ms
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

async function fetchFScore(ticker) {
  try {
    const res = await fetch(`/api/fscore?ticker=${ticker}`);
    if (res.ok) {
      const data = await res.json();
      fScoresCache[ticker] = data;
      updateFScoreCell(ticker, data);
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
        <span>SEC facts...</span>
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

  const tickerObj = SP100_REGISTRY.find(s => s.ticker === data.ticker) || { name: 'Company Details' };
  document.getElementById('modal-company-title').textContent = `${data.ticker} • ${tickerObj.name}`;

  const scoreNum = document.getElementById('modal-score-number');
  scoreNum.textContent = data.score;

  const circle = document.getElementById('modal-progress-circle');
  const circumference = 251.2;
  const offset = circumference * (1 - data.score / 9);
  circle.style.strokeDashoffset = offset;

  if (data.score >= 7) {
    circle.setAttribute('stroke', '#10b981');
    document.getElementById('modal-rating-label').textContent = 'Strong Financial Position';
    document.getElementById('modal-rating-label').className = 'text-xs font-bold font-mono uppercase tracking-wider text-emerald-400';
    document.getElementById('modal-rating-description').textContent = 'Robust financial health across profitability, efficiency, and leverage indicators.';
  } else if (data.score <= 3) {
    circle.setAttribute('stroke', '#f43f5e');
    document.getElementById('modal-rating-label').textContent = 'Weak Financial Position';
    document.getElementById('modal-rating-label').className = 'text-xs font-bold font-mono uppercase tracking-wider text-rose-400';
    document.getElementById('modal-rating-description').textContent = 'Vulnerable financials. Higher risk of operational or solvency constraints.';
  } else {
    circle.setAttribute('stroke', '#3b82f6');
    document.getElementById('modal-rating-label').textContent = 'Stable Financial Position';
    document.getElementById('modal-rating-label').className = 'text-xs font-bold font-mono uppercase tracking-wider text-blue-400';
    document.getElementById('modal-rating-description').textContent = 'Moderate fundamentals. Stable balance sheet with balanced operational dynamics.';
  }

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

  const container = document.getElementById('criteria-items-container');
  container.innerHTML = '';

  const formatCurrency = (val) => {
    if (val === null || val === undefined) return 'N/A';
    if (Math.abs(val) >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    if (Math.abs(val) >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
    return `$${val.toLocaleString()}`;
  };

  const criteriaList = [
    { title: 'Positive Net Income (F1)', status: data.breakdown.f1, metric: `Net Income: ${formatCurrency(data.metrics.netIncome)}` },
    { title: 'Positive Operating Cash Flow (F2)', status: data.breakdown.f2, metric: `Operating CFO: ${formatCurrency(data.metrics.cfo)}` },
    { title: 'Increasing Return on Assets (F3)', status: data.breakdown.f3, metric: `ROA T: ${data.metrics.roa ? (data.metrics.roa * 100).toFixed(1) + '%' : 'N/A'} | Prev: ${data.metrics.prevRoa ? (data.metrics.prevRoa * 100).toFixed(1) + '%' : 'N/A'}` },
    { title: 'CFO Exceeds Net Income (F4)', status: data.breakdown.f4, metric: `CFO: ${formatCurrency(data.metrics.cfo)} | Net Income: ${formatCurrency(data.metrics.netIncome)}` },
    { title: 'Decreasing Leverage Ratio (F5)', status: data.breakdown.f5, metric: `Debt Ratio T: ${(data.metrics.leverage * 100).toFixed(1)}% | Prev: ${(data.metrics.prevLeverage * 100).toFixed(1)}%` },
    { title: 'Increasing Liquidity Ratio (F6)', status: data.breakdown.f6, metric: `Current Ratio: ${(data.metrics.currentRatio || 0).toFixed(1)} | Prev: ${(data.metrics.prevCurrentRatio || 0).toFixed(1)}` },
    { title: 'No Share Dilution (F7)', status: data.breakdown.f7, metric: `Shares T: ${data.metrics.shares ? (data.metrics.shares / 1e6).toFixed(1) + 'M' : 'N/A'} | Prev: ${data.metrics.prevShares ? (data.metrics.prevShares / 1e6).toFixed(1) + 'M' : 'N/A'}` },
    { title: 'Increasing Gross Margin (F8)', status: data.breakdown.f8, metric: `Gross Margin: ${(data.metrics.grossMargin * 100).toFixed(1)}% | Prev: ${(data.metrics.prevGrossMargin * 100).toFixed(1)}%` },
    { title: 'Increasing Asset Turnover (F9)', status: data.breakdown.f9, metric: `Asset Turnover: ${(data.metrics.assetTurnover || 0).toFixed(2)} | Prev: ${(data.metrics.prevAssetTurnover || 0).toFixed(2)}` }
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

  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

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

// Save list
function saveToStorage() {
  localStorage.setItem('station11_stocks_cur', JSON.stringify(stocks));
}

// Render dynamic Sector Aggregate MACD SVG Chart
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
  
  svgs += `<line x1="${padding}" y1="${scaleY(globalMax)}" x2="${width - padding}" y2="${scaleY(globalMax)}" stroke="#27272a" stroke-dasharray="2,2" stroke-width="1" />`;
  svgs += `<line x1="${padding}" y1="${zeroY}" x2="${width - padding}" y2="${zeroY}" stroke="#3f3f46" stroke-width="1" />`;
  svgs += `<line x1="${padding}" y1="${scaleY(globalMin)}" x2="${width - padding}" y2="${scaleY(globalMin)}" stroke="#27272a" stroke-dasharray="2,2" stroke-width="1" />`;
  
  svgs += `<text x="${padding + 5}" y="${scaleY(globalMax) + 10}" fill="#a1a1aa" class="text-[8px] font-mono tracking-wider">MAX: ${globalMax.toFixed(3)}</text>`;
  svgs += `<text x="${padding + 5}" y="${scaleY(globalMin) - 3}" fill="#a1a1aa" class="text-[8px] font-mono tracking-wider">MIN: ${globalMin.toFixed(3)}</text>`;
  
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
    
    svgs += `<rect x="${x - barWidth / 2}" y="${yStart}" width="${barWidth}" height="${hBar}" fill="${barColor}" fill-opacity="0.65" rx="0.5" />`;
  }
  
  svgs += `</svg></div>`;
  return svgs;
}

// Fetch and render LLM Tactical Intelligence Briefing
async function loadLLMStrategicSummary(processedStocks) {
  const contentDiv = document.getElementById('ai-briefing-content');
  if (!contentDiv) return;

  const stocksToUse = processedStocks || [];
  if (stocksToUse.length === 0) {
    contentDiv.innerHTML = `<p class="text-zinc-500 font-mono text-[11px] uppercase">No active stocks in matrix to construct a briefing. Select target date to load S&P 100 elements.</p>`;
    return;
  }

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

// Setup Backtest simulation engine
// Implements 1% p.a. idle cash interest, 1.5% dividend yield, max 10 holding positions, max 2 stocks per sector
function runInvestBacktest(isAuto = false) {
  if (!csvHistoryData) {
    if (!isAuto) {
      alert('S&P 100 historical database is still loading. Please wait a second and retry!');
    }
    return;
  }

  if (investPool.length === 0) {
    if (!isAuto) {
      alert('Please choose at least one stock to build your simulation pool basket!');
    }
    return;
  }

  const initialCapitalInput = document.getElementById('invest-capital');
  const startDateInput = document.getElementById('invest-start-date');

  const startVal = parseFloat(initialCapitalInput.value) || 100000;
  const startDateStr = startDateInput.value || '2026-03-01';
  const endDateStr = targetDate;

  if (startDateStr >= endDateStr) {
    if (!isAuto) {
      alert('Simulation start date must be strictly prior to the synced target end date!');
    }
    return;
  }

  // Find all active business trading days in the backtest range from reference stock history
  const referenceStock = 'MSFT';
  const refHistory = csvHistoryData[referenceStock] || [];
  const activeDates = refHistory
    .filter(h => h.date >= startDateStr && h.date <= endDateStr)
    .map(h => h.date)
    .sort();

  if (activeDates.length < 3) {
    alert('Insufficient active business trading dates found in this range. Select a wider date range.');
    return;
  }

  console.log(`Launching backtest across ${activeDates.length} trading days: ${startDateStr} to ${endDateStr}`);

  // Pre-calculate MACD histogram sequences for the selected pool basket
  const poolMacdByDate = {};
  investPool.forEach(ticker => {
    const fullHistory = csvHistoryData[ticker] || [];
    const { hist } = calculateMACD(fullHistory);
    poolMacdByDate[ticker] = {};
    fullHistory.forEach((h, idx) => {
      poolMacdByDate[ticker][h.date] = {
        close: h.close,
        histVal: hist[idx] || 0,
        histPrev: hist[idx - 1] || 0
      };
    });
  });

  // State
  let freeCash = startVal;
  let positions = []; // Elements: { ticker, sector, shares, buyPrice, buyDate, currentPrice }
  const equityTimeline = []; // Chart path elements: { date, portfolio, sp100, sp500 }
  const tradeStats = {}; // Tracks: { ticker, name, sector, tradesCount, totalCapitalInvested, totalProceedsRealized, isActive }
  const tradeEvents = []; // Capture trades for chart visualization

  // Loop over every trading day
  activeDates.forEach((currentDate, dayIdx) => {
    // 1. Idle cash interest compounding at 1% p.a.
    // Daily compounding fraction = 0.01 / 365
    const idleCashInterest = freeCash * (0.01 / 365);
    freeCash += idleCashInterest;

    // 2. Refresh current position prices and calculate dividends yielding at 1.5% p.a.
    positions.forEach(pos => {
      const todayQuote = poolMacdByDate[pos.ticker]?.[currentDate];
      if (todayQuote) {
        pos.currentPrice = todayQuote.close;
      }
      
      const positionValue = pos.shares * pos.currentPrice;
      const posDividend = positionValue * (0.015 / 365);
      freeCash += posDividend;
    });

    // 3. Process SELLS (Morning)
    // Sell a position if MACD crosses below the Signal line (histVal goes negative)
    const survivors = [];
    positions.forEach(pos => {
      const todayQuote = poolMacdByDate[pos.ticker]?.[currentDate];
      if (todayQuote) {
        const histVal = todayQuote.histVal;
        const histPrev = todayQuote.histPrev;
        const crossedBelowZero = histVal < 0 && histPrev >= 0;

        if (crossedBelowZero) {
          // Liquidate complete position at today's close
          const proceeds = pos.shares * todayQuote.close;
          freeCash += proceeds;

          tradeEvents.push({ date: currentDate, ticker: pos.ticker, type: 'SELL', price: todayQuote.close, shares: pos.shares });

          if (!tradeStats[pos.ticker]) {
            tradeStats[pos.ticker] = { ticker: pos.ticker, name: csvCompanyNames[pos.ticker] || pos.ticker, sector: pos.sector, tradesCount: 0, totalCapitalInvested: 0, totalProceedsRealized: 0 };
          }
          tradeStats[pos.ticker].tradesCount++;
          tradeStats[pos.ticker].totalProceedsRealized += proceeds;
        } else {
          survivors.push(pos);
        }
      } else {
        survivors.push(pos);
      }
    });
    positions = survivors;

    // 4. Process BUYS (Afternoon)
    // Collect pool stocks triggering buy signals (bullish MACD crossover: histVal goes positive)
    const buyTriggers = [];
    investPool.forEach(ticker => {
      // Skip if already holding this stock
      if (positions.some(p => p.ticker === ticker)) return;

      const registryItem = SP100_REGISTRY.find(r => r.ticker === ticker);
      const sector = registryItem ? registryItem.sector : 'Other';

      // Constraint check: max 2 stocks per sector held concurrently
      const sectorCount = positions.filter(p => p.sector === sector).length;
      if (sectorCount >= 2) return;

      const todayQuote = poolMacdByDate[ticker]?.[currentDate];
      if (todayQuote) {
        const histVal = todayQuote.histVal;
        const histPrev = todayQuote.histPrev;
        const crossedAboveZero = histVal > 0 && histPrev <= 0;

        if (crossedAboveZero) {
          buyTriggers.push({ ticker, sector, closePrice: todayQuote.close });
        }
      }
    });

    // Buy triggered candidates up to holding cap limits
    const emptySlots = 10 - positions.length;
    if (emptySlots > 0 && buyTriggers.length > 0) {
      // Divide remaining free cash equally among open slots
      // Budget size = freeCash / emptySlots
      const budgetPerSlot = freeCash / emptySlots;

      // Buy up to the available slots
      const toBuy = buyTriggers.slice(0, emptySlots);
      toBuy.forEach(candidate => {
        if (freeCash <= 0 || budgetPerSlot <= 10) return;

        const allocation = Math.min(freeCash, budgetPerSlot);
        const sharesToBuy = allocation / candidate.closePrice;

        positions.push({
          ticker: candidate.ticker,
          sector: candidate.sector,
          shares: sharesToBuy,
          buyPrice: candidate.closePrice,
          buyDate: currentDate,
          currentPrice: candidate.closePrice
        });

        tradeEvents.push({ date: currentDate, ticker: candidate.ticker, type: 'BUY', price: candidate.closePrice, shares: sharesToBuy });

        freeCash -= allocation;

        if (!tradeStats[candidate.ticker]) {
          tradeStats[candidate.ticker] = { ticker: candidate.ticker, name: csvCompanyNames[candidate.ticker] || candidate.ticker, sector: candidate.sector, tradesCount: 0, totalCapitalInvested: 0, totalProceedsRealized: 0 };
        }
        tradeStats[candidate.ticker].totalCapitalInvested += allocation;
      });
    }

    // 5. Calculate cumulative total portfolio asset equity
    const activePositionEquity = positions.reduce((sum, p) => sum + (p.shares * p.currentPrice), 0);
    const dayTotalPortfolioEquity = freeCash + activePositionEquity;

    // Calculate S&P 100 Index Benchmark return
    // Calculate the average return of all S&P 100 registry companies active at currentDate compared to start date
    const sp100Ratio = getBenchmarkPriceRatio(currentDate, startDateStr);
    const daySp100Val = startVal * sp100Ratio;

    const activePositionsOnDay = {};
    positions.forEach(p => {
      activePositionsOnDay[p.ticker] = p.shares * p.currentPrice;
    });

    equityTimeline.push({
      date: currentDate,
      portfolio: dayTotalPortfolioEquity,
      capitalEmployed: activePositionEquity,
      sp100: daySp100Val,
      holdings: activePositionsOnDay
    });
  });

  // Highlight positions currently active at end of simulation
  positions.forEach(pos => {
    if (tradeStats[pos.ticker]) {
      tradeStats[pos.ticker].totalProceedsRealized += (pos.shares * pos.currentPrice);
    }
  });

  // Plot results
  const finalVal = equityTimeline[equityTimeline.length - 1]?.portfolio || startVal;
  const earningsVal = finalVal - startVal;
  const roiVal = (earningsVal / startVal) * 100;

  const sp100RatioFinal = getBenchmarkPriceRatio(endDateStr, startDateStr);
  const sp100ReturnFinal = (sp100RatioFinal - 1) * 100;

  // Render Display Metric Cards
  document.getElementById('res-init-val').textContent = `$${startVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  document.getElementById('res-end-val').textContent = `$${finalVal.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  
  const earningsLabel = document.getElementById('res-earnings');
  earningsLabel.textContent = `${earningsVal >= 0 ? '+' : ''}$${earningsVal.toLocaleString(undefined, { maximumFractionDigits: 2 })} (${earningsVal >= 0 ? '+' : ''}${roiVal.toFixed(2)}%)`;
  if (earningsVal >= 0) {
    earningsLabel.className = "text-base font-bold font-mono text-emerald-400";
  } else {
    earningsLabel.className = "text-base font-bold font-mono text-rose-500";
  }

  document.getElementById('res-benchmarks').innerHTML = `S&P 100: <span class="${sp100ReturnFinal >= 0 ? 'text-emerald-400' : 'text-rose-400'} font-bold">${sp100ReturnFinal >= 0 ? '+' : ''}${sp100ReturnFinal.toFixed(2)}%</span>`;

  // Draw Line Chart
  renderBacktestEquityChart(equityTimeline, tradeEvents);

  // Render Table Breakdown of Stock Earnings
  renderBacktestTable(tradeStats, positions);

  // Trigger AI Intelligence Briefing
  loadLLMPortfolioBriefing(equityTimeline, tradeStats, startDateStr, endDateStr, startVal, finalVal, roiVal, sp100ReturnFinal);
}

// Get average price return ratio of active S&P 100 registry companies on dateVal compared to startDateStr
function getBenchmarkPriceRatio(dateVal, startDateStr) {
  if (!csvHistoryData) return 1.0;
  
  const activeComps = SP100_REGISTRY.filter(item => item.in <= dateVal && (!item.out || item.out > dateVal));
  let cumulativeRatio = 0;
  let count = 0;

  activeComps.forEach(item => {
    const history = csvHistoryData[item.ticker];
    if (history) {
      const quoteStart = history.filter(h => h.date <= startDateStr).pop() || history[0];
      const quoteEnd = history.filter(h => h.date <= dateVal).pop();
      if (quoteStart && quoteEnd && quoteStart.close > 0) {
        cumulativeRatio += (quoteEnd.close / quoteStart.close);
        count++;
      }
    }
  });

  return count > 0 ? (cumulativeRatio / count) : 1.0;
}

// Draw backtesting interactive growth curve comparison in SVG (widescreen with active stock holding segment tracks)
function renderBacktestEquityChart(timeline, tradeEvents) {
  const container = document.getElementById('equity-chart-container');
  if (!container) return;
  container.innerHTML = '';

  const width = container.clientWidth || 980;
  const height = 400; // Large 400px high visualization
  const paddingLeft = 52;
  const paddingRight = 64; // Padding for labels on the right side
  const paddingTop = 20;
  const paddingBottom = 25;

  const portVals = timeline.map(t => t.portfolio);
  const sp100Vals = timeline.map(t => t.sp100);
  const capEmpVals = timeline.map(t => t.capitalEmployed || 0);

  // Collect all left-axis values to compute max Left
  const leftVals = [...portVals, ...sp100Vals];

  const tradesByTicker = {};
  tradeEvents.forEach(e => {
    if (!tradesByTicker[e.ticker]) tradesByTicker[e.ticker] = [];
    tradesByTicker[e.ticker].push(e);
  });

  const dateToIndex = {};
  timeline.forEach((day, idx) => dateToIndex[day.date] = idx);

  Object.entries(tradesByTicker).forEach(([ticker, trades]) => {
    trades.sort((a, b) => new Date(a.date) - new Date(b.date));
    for (let i = 0; i < trades.length; i += 2) {
      const buy = trades[i];
      const sell = trades[i + 1];
      if (!buy) continue;

      const idxBuy = dateToIndex[buy.date];
      const idxSell = sell ? dateToIndex[sell.date] : timeline.length - 1;
      if (idxBuy === undefined) continue;

      const portfolioAtBuy = timeline[idxBuy].portfolio;
      const shares = buy.shares;
      const initialStockValue = shares * buy.price;

      for (let dayIdx = idxBuy; dayIdx <= idxSell; dayIdx++) {
        const stockValueAtDay = timeline[dayIdx].holdings[buy.ticker] || 0;
        const yValue = portfolioAtBuy + (stockValueAtDay - initialStockValue);
        leftVals.push(yValue);
      }
    }
  });

  // Create a fast lookup for stock closing prices to calculate actual held-stock trajectory
  const poolPriceByDate = {};
  Object.keys(tradesByTicker).forEach(ticker => {
    poolPriceByDate[ticker] = {};
    const history = csvHistoryData?.[ticker] || [];
    history.forEach(h => {
      poolPriceByDate[ticker][h.date] = h.close;
    });
  });

  // Left axis minimum is 85% of the least value of total equity, maximum is 115% of the highest value of total equity
  const minP = portVals.length > 0 ? portVals.reduce((min, val) => val < min ? val : min, portVals[0]) : 1000;
  const maxP = portVals.length > 0 ? portVals.reduce((max, val) => val > max ? val : max, portVals[0]) : 1000;
  const minValLeft = Math.max(0, minP * 0.85);
  const maxValLeft = maxP * 1.15;

  // Right axis from 0 to max fully used
  const peakRight = capEmpVals.length > 0 ? capEmpVals.reduce((max, val) => val > max ? val : max, capEmpVals[0]) : 1000;
  const maxValRight = Math.max(peakRight, 1000) * 1.02; // Tiny margin to avoid drawing lines right on the top boundary
  const minValRight = 0;

  const scaleX = (idx) => {
    return paddingLeft + (idx / (timeline.length - 1)) * (width - paddingLeft - paddingRight);
  };

  const scaleY_Left = (val) => {
    const range = maxValLeft - minValLeft || 1;
    return height - paddingBottom - ((val - minValLeft) / range) * (height - paddingTop - paddingBottom);
  };

  const scaleY_Right = (val) => {
    const range = maxValRight - minValRight || 1;
    return height - paddingBottom - ((val - minValRight) / range) * (height - paddingTop - paddingBottom);
  };

  let svgs = `<svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" class="overflow-visible select-none">`;

  // Draw subtle horizontal grid lines with absolute price tags on both Left and Right axes
  const gridSteps = 5;
  for (let i = 0; i <= gridSteps; i++) {
    const gridYValueLeft = minValLeft + ((maxValLeft - minValLeft) / gridSteps) * i;
    const y = scaleY_Left(gridYValueLeft);
    svgs += `<line x1="${paddingLeft}" y1="${y}" x2="${width - paddingRight}" y2="${y}" stroke="#1f1f23" stroke-width="1" />`;
    // Left axis tags (Blue for Portfolio / S&P 100)
    svgs += `<text x="5" y="${y + 3}" fill="#3b82f6" class="text-[9px] font-mono font-medium">$${Math.round(gridYValueLeft).toLocaleString()}</text>`;
    
    // Right axis tags (Muted light grey for Capital Employed)
    const gridYValueRight = minValRight + ((maxValRight - minValRight) / gridSteps) * i;
    svgs += `<text x="${width - paddingRight + 8}" y="${y + 3}" fill="#71717a" class="text-[9px] font-mono font-medium">$${Math.round(gridYValueRight).toLocaleString()}</text>`;
  }

  // Generate paths for S&P 100, Total Portfolio, and Capital Employed
  let portfolioPath = '';
  let sp100Path = '';
  let capitalEmployedPath = '';
  let portfolioAreaPath = `M ${scaleX(0)} ${scaleY_Left(minValLeft)}`;

  timeline.forEach((day, idx) => {
    const x = scaleX(idx);
    const yP = scaleY_Left(day.portfolio);
    const y100 = scaleY_Left(day.sp100);
    const yCap = scaleY_Right(day.capitalEmployed || 0);

    if (idx === 0) {
      portfolioPath += `M ${x} ${yP}`;
      sp100Path += `M ${x} ${y100}`;
      capitalEmployedPath += `M ${x} ${yCap}`;
    } else {
      portfolioPath += ` L ${x} ${yP}`;
      sp100Path += ` L ${x} ${y100}`;
      capitalEmployedPath += ` L ${x} ${yCap}`;
    }
    
    portfolioAreaPath += ` L ${x} ${yP}`;
  });

  portfolioAreaPath += ` L ${scaleX(timeline.length - 1)} ${scaleY_Left(minValLeft)} Z`;

  // Plot Total Equity Area fill (Left axis)
  svgs += `<path d="${portfolioAreaPath}" fill="#3b82f6" fill-opacity="0.04" />`;

  // Plot Benchmark S&P 100 Line (Left axis, dashed)
  svgs += `<path d="${sp100Path}" fill="none" stroke="#52525b" stroke-width="1.2" stroke-dasharray="3,3" stroke-linecap="round" />`;

  // Plot Individual Stock Trade Paths (Left axis, anchored to Portfolio Total at buy date to show contribution)
  Object.entries(tradesByTicker).forEach(([ticker, trades]) => {
    // Draw lines and dots
    for (let i = 0; i < trades.length; i += 2) {
      const buy = trades[i];
      const sell = trades[i + 1];
      if (!buy) continue;

      const idxBuy = dateToIndex[buy.date];
      const idxSell = sell ? dateToIndex[sell.date] : timeline.length - 1;
      if (idxBuy === undefined) continue;

      const portfolioAtBuy = timeline[idxBuy].portfolio;
      const shares = buy.shares;
      const initialStockValue = shares * buy.price;

      // Calculate actual final value based on physical stock price at exit day, completely removing downward hockey sticks
      const sellDate = timeline[idxSell].date;
      const sellPrice = poolPriceByDate[buy.ticker]?.[sellDate] || buy.price;
      const finalStockValue = shares * sellPrice;
      const isProfit = finalStockValue >= initialStockValue;
      const pathColor = isProfit ? '#22c55e' : '#ef4444';

      let stockPath = '';
      for (let dayIdx = idxBuy; dayIdx <= idxSell; dayIdx++) {
        const x = scaleX(dayIdx);
        // Calculate stock value at this specific day based on actual historic prices
        const dayDate = timeline[dayIdx].date;
        const dayPrice = poolPriceByDate[buy.ticker]?.[dayDate] || buy.price;
        const stockValueAtDay = shares * dayPrice;
        const yValue = portfolioAtBuy + (stockValueAtDay - initialStockValue);
        const y = scaleY_Left(yValue);
        
        if (dayIdx === idxBuy) stockPath += `M ${x} ${y}`;
        else stockPath += ` L ${x} ${y}`;
        
        // Save midpoint for label
        if (dayIdx === Math.floor((idxBuy + idxSell) / 2)) {
          svgs += `<text x="${x}" y="${y - 10}" fill="${pathColor}" class="text-[9px] font-mono font-bold" text-anchor="middle" filter="drop-shadow(0px 1px 1px rgba(0,0,0,0.5))">${buy.ticker}</text>`;
        }
      }
      
      // Draw stock path (dashed line, Left axis)
      svgs += `<path d="${stockPath}" fill="none" stroke="${pathColor}" stroke-width="1.2" stroke-dasharray="2,2" />`;
      
      // Buy dot on the stock path (Left axis)
      const yBuyDot = scaleY_Left(portfolioAtBuy);
      svgs += `<circle cx="${scaleX(idxBuy)}" cy="${yBuyDot}" r="3.5" fill="#22c55e" stroke="#000" stroke-width="1" />`;
      
      // Sell dot on the stock path (Left axis)
      if (sell) {
        const finalYValue = portfolioAtBuy + (finalStockValue - initialStockValue);
        const ySellDot = scaleY_Left(finalYValue);
        svgs += `<circle cx="${scaleX(idxSell)}" cy="${ySellDot}" r="3.5" fill="#ef4444" stroke="#000" stroke-width="1" />`;
      }
    }
  });

  // Plot Capital Employed line (Right axis - light grey, thin, and less dominant)
  svgs += `<path d="${capitalEmployedPath}" fill="none" stroke="#52525b" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />`;

  // Plot Total Portfolio Equity (Left axis, highest layer for peak visibility)
  svgs += `<path d="${portfolioPath}" fill="none" stroke="#3b82f6" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />`;

  // Render Date Labels
  const labelSteps = 6;
  for (let i = 0; i < labelSteps; i++) {
    const idx = Math.floor((timeline.length - 1) * (i / (labelSteps - 1)));
    const day = timeline[idx];
    if (day) {
      const x = scaleX(idx);
      const dateParts = day.date.split('-');
      const label = `${dateParts[1]}/${dateParts[2]}`;
      svgs += `<text x="${x}" y="${height - 5}" fill="#52525b" class="text-[9px] font-mono text-center" text-anchor="middle">${label}</text>`;
    }
  }

  svgs += `</svg>`;
  container.innerHTML = svgs;
}

// Fetch and render AI Strategic Portfolio Briefing from the server
function loadLLMPortfolioBriefing(timeline, tradeStats, startDate, endDate, startVal, finalVal, roiVal, sp100ReturnFinal) {
  const contentDiv = document.getElementById('portfolio-briefing-content');
  if (!contentDiv) return;

  contentDiv.innerHTML = `
    <div class="flex items-center justify-center py-8 text-zinc-500 gap-2.5">
      <svg class="w-4 h-4 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
      </svg>
      <span class="font-mono text-[10px] uppercase tracking-wider animate-pulse text-zinc-400">Synthesizing AI Strategic Portfolio Briefing...</span>
    </div>
  `;

  // Compile individual stock performance contributions
  const tickerBreakdown = Object.values(tradeStats).map(item => {
    const netReturn = item.totalProceedsRealized - item.totalCapitalInvested;
    const roi = item.totalCapitalInvested > 0 ? (netReturn / item.totalCapitalInvested) * 100 : 0.0;
    return {
      ticker: item.ticker,
      tradesCount: item.tradesCount || 1,
      totalCapitalInvested: item.totalCapitalInvested,
      netReturn: netReturn,
      roi: roi
    };
  });

  fetch('/api/portfolio-summary', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      startDate,
      endDate,
      initialCapital: startVal,
      finalCapital: finalVal,
      netReturn: finalVal - startVal,
      roi: roiVal,
      sp100Return: sp100ReturnFinal,
      tickerBreakdown,
      openrouterKey: openrouterKey
    })
  })
  .then(res => {
    if (!res.ok) throw new Error('API return is offline');
    return res.json();
  })
  .then(data => {
    contentDiv.innerHTML = data.summary;
  })
  .catch(err => {
    console.error('Failed to formulate AI portfolio briefing:', err);
    contentDiv.innerHTML = `<p class="text-rose-400 font-mono text-xs">Offline: Error formulating strategic briefing. Recalibrate and relaunch simulation.</p>`;
  });
}

// Render simulation outcome list per stock
function renderBacktestTable(stats, activePositions) {
  const container = document.getElementById('invest-earnings-list');
  if (!container) return;
  container.innerHTML = '';

  const statList = Object.values(stats);

  if (statList.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="7" class="py-8 text-center text-zinc-500 font-mono text-xs">
          Simulation completed without any trades triggered. Adjust capital, pool, or timelines and relaunch.
        </td>
      </tr>
    `;
    return;
  }

  statList.forEach(item => {
    const netReturn = item.totalProceedsRealized - item.totalCapitalInvested;
    const roi = item.totalCapitalInvested > 0 ? (netReturn / item.totalCapitalInvested) * 100 : 0.0;
    
    const isActive = activePositions.some(p => p.ticker === item.ticker);
    const activePositionObj = activePositions.find(p => p.ticker === item.ticker);

    const row = document.createElement('tr');
    row.className = "hover:bg-zinc-900/40 border-b border-zinc-800/40 text-xs text-zinc-300 transition-all";
    row.innerHTML = `
      <td class="py-3 px-5">
        <div class="flex flex-col">
          <span class="font-mono font-bold text-white tracking-wider">${item.ticker}</span>
          <span class="text-[10px] text-zinc-500 font-medium">${item.name}</span>
        </div>
      </td>
      <td class="py-3 px-4 font-mono text-[10px] text-zinc-400">${item.sector}</td>
      <td class="py-3 px-4 text-center font-mono font-bold text-zinc-200">${item.tradesCount || 1}</td>
      <td class="py-3 px-4 text-right font-mono">$${(item.totalCapitalInvested / (item.tradesCount || 1)).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
      <td class="py-3 px-4 text-right font-mono">$${(item.totalProceedsRealized / (item.tradesCount || 1)).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
      <td class="py-3 px-4 text-right">
        <span class="font-mono font-bold ${netReturn >= 0 ? 'text-emerald-400' : 'text-rose-500'}">
          ${netReturn >= 0 ? '+' : ''}$${netReturn.toLocaleString(undefined, { maximumFractionDigits: 2 })} (${netReturn >= 0 ? '+' : ''}${roi.toFixed(1)}%)
        </span>
      </td>
      <td class="py-3 px-5 text-center">
        ${isActive ? `
          <span class="bg-blue-950 text-blue-400 border border-blue-900 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase" title="Hold shares: ${activePositionObj.shares.toFixed(2)}">
            ACTIVE (${activePositionObj.shares.toFixed(1)} SHS)
          </span>
        ` : `
          <span class="text-zinc-600 font-mono text-[10px]">Liquidated</span>
        `}
      </td>
    `;
    container.appendChild(row);
  });
}

// Setup Event Handlers and Listeners on Page Init
async function initializeApp() {
  // Navigation Routing Tabs Bindings
  const btnInvest = document.getElementById('tab-btn-invest');
  const btnOverview = document.getElementById('tab-btn-overview');
  const contentInvest = document.getElementById('invest-tab-content');
  const contentOverview = document.getElementById('overview-tab-content');

  function selectTab(activeTab) {
    if (activeTab === 'invest') {
      btnInvest.className = "flex-1 py-2 text-center text-xs font-mono font-bold rounded-lg transition-all cursor-pointer bg-blue-600 text-white shadow";
      btnOverview.className = "flex-1 py-2 text-center text-xs font-mono font-bold rounded-lg transition-all cursor-pointer text-zinc-400 hover:text-white";
      contentInvest.classList.remove('hidden');
      contentOverview.classList.add('hidden');
    } else {
      btnOverview.className = "flex-1 py-2 text-center text-xs font-mono font-bold rounded-lg transition-all cursor-pointer bg-blue-600 text-white shadow";
      btnInvest.className = "flex-1 py-2 text-center text-xs font-mono font-bold rounded-lg transition-all cursor-pointer text-zinc-400 hover:text-white";
      contentOverview.classList.remove('hidden');
      contentInvest.classList.add('hidden');
    }
  }

  btnInvest.addEventListener('click', () => selectTab('invest'));
  btnOverview.addEventListener('click', () => selectTab('overview'));

  // Put Backtest Portfolio in front by default
  selectTab('invest');

  // Display Mode Slide buttons
  const modeAllBtn = document.getElementById('mode-all-btn');
  const modeTop30Btn = document.getElementById('mode-top30-btn');

  if (modeAllBtn && modeTop30Btn) {
    modeAllBtn.addEventListener('click', () => {
      displayMode = 'all';
      modeAllBtn.className = "flex-1 py-1.5 text-center text-[10px] font-mono font-bold uppercase tracking-wider rounded-md cursor-pointer transition-all bg-blue-600 text-white";
      modeTop30Btn.className = "flex-1 py-1.5 text-center text-[10px] font-mono font-bold uppercase tracking-wider rounded-md cursor-pointer transition-all text-zinc-400 hover:text-white bg-transparent";
      renderDashboard();
    });

    modeTop30Btn.addEventListener('click', () => {
      displayMode = 'top30';
      modeTop30Btn.className = "flex-1 py-1.5 text-center text-[10px] font-mono font-bold uppercase tracking-wider rounded-md cursor-pointer transition-all bg-blue-600 text-white";
      modeAllBtn.className = "flex-1 py-1.5 text-center text-[10px] font-mono font-bold uppercase tracking-wider rounded-md cursor-pointer transition-all text-zinc-400 hover:text-white bg-transparent";
      renderDashboard();
    });
  }

  // Load target dates
  const dateInput = document.getElementById('target-date');
  targetDate = '2026-09-01';
  dateInput.value = targetDate;

  // Initialize manual start date for dashboard
  manualStartDate = '2026-01-01';
  
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

  // Timeline selector clicks
  const timelineBtns = document.querySelectorAll('.timeline-box-btn');
  const manualDatePickerBox = document.getElementById('manual-date-picker-box');
  
  timelineBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      timelineBtns.forEach(b => {
        b.className = "timeline-box-btn px-4 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono font-semibold text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all cursor-pointer";
      });
      btn.className = "timeline-box-btn px-4 py-2 rounded-lg bg-blue-600 text-white border border-blue-500 text-xs font-mono font-semibold transition-all cursor-pointer";
      
      selectedTimeline = btn.getAttribute('data-timeline');
      
      if (selectedTimeline === 'manual') {
        if (manualDatePickerBox) {
          manualDatePickerBox.classList.remove('hidden');
          manualDatePickerBox.classList.add('flex');
        }
      } else {
        if (manualDatePickerBox) {
          manualDatePickerBox.classList.add('hidden');
          manualDatePickerBox.classList.remove('flex');
        }
      }
      
      renderDashboard();
    });
  });

  // Load credentials
  const savedKey = localStorage.getItem('twelvedata_apikey');
  if (savedKey) {
    twelvedataKey = savedKey;
    document.getElementById('twelvedata-key').value = savedKey;
  }

  const savedOrKey = localStorage.getItem('openrouter_apikey');
  if (savedOrKey) {
    openrouterKey = savedOrKey;
    document.getElementById('openrouter-key').value = savedOrKey;
  }
  updateOpenRouterStatusDot();

  // Load S&P 100 CSV asset database
  await loadCSVData();

  // Populate dynamic S&P 100 active components at targetDate
  stocks = getDefaultStocksList(targetDate);
  saveToStorage();

  // Sync backtest end date display on targetDate changes
  const backtestEndDisplay = document.getElementById('invest-end-date-display');
  if (backtestEndDisplay) backtestEndDisplay.textContent = targetDate;

  // Render pool basket tags
  renderPool();

  // Bind simulation trigger
  const runSimBtn = document.getElementById('run-simulation-btn');
  if (runSimBtn) {
    runSimBtn.addEventListener('click', () => {
      runInvestBacktest();
    });
  }

  // Clear pool click
  const clearPoolBtn = document.getElementById('clear-pool-btn');
  if (clearPoolBtn) {
    clearPoolBtn.addEventListener('click', () => {
      investPool = [];
      localStorage.setItem('station11_invest_pool', JSON.stringify(investPool));
      renderPool();
      renderDashboard();
    });
  }

  // Bind Target Date Events
  dateInput.addEventListener('change', (e) => {
    targetDate = e.target.value;
    stocks = getDefaultStocksList(targetDate);
    saveToStorage();
    if (backtestEndDisplay) backtestEndDisplay.textContent = targetDate;
    renderDashboard();
  });

  // CSV Download
  document.getElementById('download-csv-btn').addEventListener('click', downloadConstituentsCSV);

  // API Drawer controls
  const toggleApiBtn = document.getElementById('toggle-api-btn');
  const apiDrawer = document.getElementById('api-drawer');
  toggleApiBtn.addEventListener('click', () => {
    apiDrawer.classList.toggle('hidden');
    document.getElementById('openrouter-drawer').classList.add('hidden');
  });

  const toggleOrBtn = document.getElementById('toggle-openrouter-btn');
  const orDrawer = document.getElementById('openrouter-drawer');
  toggleOrBtn.addEventListener('click', () => {
    orDrawer.classList.toggle('hidden');
    apiDrawer.classList.add('hidden');
  });

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

  const saveOrKeyBtn = document.getElementById('save-openrouter-key');
  const orKeyInput = document.getElementById('openrouter-key');
  saveOrKeyBtn.addEventListener('click', () => {
    openrouterKey = orKeyInput.value.trim();
    localStorage.setItem('openrouter_apikey', openrouterKey);
    orDrawer.classList.add('hidden');
    updateOpenRouterStatusDot();
    renderDashboard();
  });

  // Modal close buttons
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

  // Recalibrate LLM AI Briefing
  const recalibrateBtn = document.getElementById('refresh-ai-briefing');
  if (recalibrateBtn) {
    recalibrateBtn.addEventListener('click', () => {
      loadLLMStrategicSummary();
    });
  }

  // Inline Custom Add Stock Ticker Form Binder
  const showAddBtnElement = document.getElementById('show-add-form-btn');
  const addTriggerRow = document.getElementById('add-trigger-row');
  const addForm = document.getElementById('add-stock-form');
  
  if (showAddBtnElement) {
    showAddBtnElement.addEventListener('click', () => {
      addTriggerRow.classList.add('hidden');
      addForm.classList.remove('hidden');
      document.getElementById('new-ticker').focus();
    });
  }

  const cancelAddBtn = document.getElementById('cancel-add-btn');
  if (cancelAddBtn) {
    cancelAddBtn.addEventListener('click', () => {
      addForm.classList.add('hidden');
      addTriggerRow.classList.remove('hidden');
      addForm.reset();
    });
  }

  // Form Submit to add custom item to active list
  if (addForm) {
    addForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const ticker = document.getElementById('new-ticker').value.trim().toUpperCase();
      const name = document.getElementById('new-name').value.trim();
      const sector = document.getElementById('new-sector').value;
      const basePrice = parseFloat(document.getElementById('new-price').value) || 100.0;

      if (stocks.some(s => s.ticker === ticker)) {
        alert(`Stock with symbol ${ticker} is already active in your matrix.`);
        return;
      }

      stocks.push({ ticker, name, sector, basePrice });
      saveToStorage();

      addForm.reset();
      addForm.classList.add('hidden');
      addTriggerRow.classList.remove('hidden');
      
      renderDashboard();
    });
  }

  const resetDefaultsBtn = document.getElementById('reset-defaults-btn');
  if (resetDefaultsBtn) {
    resetDefaultsBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to restore the default S&P 100 active list?')) {
        stocks = getDefaultStocksList(targetDate);
        saveToStorage();
        renderDashboard();
      }
    });
  }

  // Select initial timeline 1m button state
  const initialBtn = document.querySelector('[data-timeline="1m"]');
  if (initialBtn) {
    initialBtn.className = "timeline-box-btn px-4 py-2 rounded-lg bg-blue-600 text-white border border-blue-500 text-xs font-mono font-semibold transition-all cursor-pointer";
  }

  // Initial draw and load simulation outcome automatically on load
  renderDashboard();
  setTimeout(() => {
    runInvestBacktest();
  }, 1000);
}

// Run station init
document.addEventListener('DOMContentLoaded', initializeApp);

function downloadConstituentsCSV() {
  if (!stocks || stocks.length === 0) return;

  const headers = ['Ticker', 'Name', 'Sector', 'Current Price', 'Piotroski F-Score'];
  const rows = stocks.map(s => [
    s.ticker,
    `"${(s.name || '').replace(/"/g, '""')}"`,
    s.sector || 'N/A',
    s.currentPrice || 'N/A',
    s.fScore !== undefined ? s.fScore : 'N/A'
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `sp100_constituents_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
