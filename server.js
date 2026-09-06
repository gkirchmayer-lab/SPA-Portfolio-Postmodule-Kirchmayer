import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const port = process.env.PORT || 3000;

  // CIK Cache and Ticker mapping
  let tickerCikMap = null;
  async function fetchTickerCikMap() {
    if (tickerCikMap) return tickerCikMap;
    try {
      console.log('Fetching ticker CIK map from SEC EDGAR...');
      const response = await fetch('https://www.sec.gov/files/company_tickers.json', {
        headers: {
          'User-Agent': 'Station11 Analytics gkirchmayer@gmail.com'
        }
      });
      if (response.ok) {
        const json = await response.json();
        tickerCikMap = {};
        Object.values(json).forEach(item => {
          tickerCikMap[item.ticker.toUpperCase()] = item.cik_str;
        });
        console.log(`Successfully mapped ${Object.keys(tickerCikMap).length} SEC tickers.`);
        return tickerCikMap;
      } else {
        console.error(`SEC ticker map returned status ${response.status}`);
      }
    } catch (e) {
      console.error('Failed to fetch ticker-CIK map from SEC:', e);
    }
    return null;
  }

  // Pre-seed some common ticker mapping in case SEC fetch fails or rate limited
  const localTickerCikMap = {
    'AAPL': 320193,
    'MSFT': 789019,
    'NVDA': 1045810,
    'GOOGL': 1652044,
    'GOOG': 1652044,
    'AMZN': 1018724,
    'META': 1326801,
    'TSLA': 1318605,
    'LLY': 59478,
    'JPM': 19617
  };

  // API endpoint for F-Score
  app.get('/api/fscore', async (req, res) => {
    const ticker = (req.query.ticker || '').toUpperCase().trim();
    if (!ticker) {
      return res.status(400).json({ error: 'Ticker is required' });
    }

    try {
      const map = await fetchTickerCikMap();
      let cik = map ? map[ticker] : null;
      if (!cik) {
        cik = localTickerCikMap[ticker];
      }

      if (!cik) {
        console.log(`Ticker ${ticker} not found in CIK maps. Using procedural model.`);
        return res.json(generateSimulatedFScore(ticker));
      }

      // Pad CIK to 10 digits
      const paddedCik = String(cik).padStart(10, '0');
      const factsUrl = `https://data.sec.gov/api/xbrl/companyfacts/CIK${paddedCik}.json`;

      console.log(`Fetching XBRL company facts for ${ticker} (CIK: ${paddedCik}) from SEC...`);
      const response = await fetch(factsUrl, {
        headers: {
          'User-Agent': 'Station11 Analytics gkirchmayer@gmail.com',
          'Accept-Encoding': 'gzip, deflate'
        }
      });

      if (!response.ok) {
        throw new Error(`SEC EDGAR API responded with ${response.status}`);
      }

      const companyData = await response.json();
      const facts = companyData.facts;
      if (!facts) {
        throw new Error('No facts found in SEC data');
      }

      const fScoreDetails = calculateRealFScore(facts, ticker);
      return res.json(fScoreDetails);
    } catch (error) {
      console.warn(`Error calculating real F-Score for ${ticker}: ${error.message}. Falling back to calibrated procedural calculations.`);
      return res.json(generateSimulatedFScore(ticker));
    }
  });

  // Serve static files in production, use Vite middleware in development
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    console.log('Mounting Vite dev middleware...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    console.log('Serving production build files...');
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Full-Stack STATION.11 running on http://0.0.0.0:${port}`);
  });
}

// Generate realistic simulated F-Score
function generateSimulatedFScore(ticker) {
  // Use seeded pseudo-random based on ticker to get stable, realistic values
  let hash = 0;
  for (let i = 0; i < ticker.length; i++) {
    hash = ticker.charCodeAt(i) + ((hash << 5) - hash);
  }
  const rand = () => {
    const x = Math.sin(hash++) * 10000;
    return x - Math.floor(x);
  };

  const fy = 2024;
  const isTech = ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'TSLA'].includes(ticker);
  
  const netIncome = Math.round((rand() * 15000 + 8000) * 1000000);
  const prevNetIncome = Math.round((rand() * 12000 + 7000) * 1000000);
  
  const cfo = Math.round(netIncome * (1.1 + rand() * 0.25));
  const prevCfo = Math.round(prevNetIncome * (1.05 + rand() * 0.2));

  const assets = Math.round((netIncome * 7) * (0.95 + rand() * 0.15));
  const prevAssets = Math.round((prevNetIncome * 7) * (0.95 + rand() * 0.15));

  const ltDebt = Math.round(assets * (0.15 + rand() * 0.15));
  const prevLtDebt = Math.round(prevAssets * (0.18 + rand() * 0.15));

  const currentAssets = Math.round(assets * 0.38);
  const currentLiabilities = Math.round(assets * 0.22);
  const prevCurrentAssets = Math.round(prevAssets * 0.36);
  const prevCurrentLiabilities = Math.round(prevAssets * 0.24);

  const shares = Math.round((rand() * 800 + 400) * 1000000);
  const prevShares = Math.round(shares * (1.002 - rand() * 0.008)); // mostly flat or slight share reduction

  const grossProfit = Math.round(netIncome * (2.0 + rand() * 0.4));
  const revenue = Math.round(grossProfit / (isTech ? 0.55 : 0.32));
  const prevGrossProfit = Math.round(prevNetIncome * (2.0 + rand() * 0.4));
  const prevRevenue = Math.round(prevGrossProfit / (isTech ? 0.54 : 0.31));

  const facts = {
    'us-gaap': {
      NetIncomeLoss: createMockFact(netIncome, prevNetIncome, fy),
      NetCashProvidedByUsedInOperatingActivities: createMockFact(cfo, prevCfo, fy),
      Assets: createMockFact(assets, prevAssets, fy),
      LongTermDebt: createMockFact(ltDebt, prevLtDebt, fy),
      AssetsCurrent: createMockFact(currentAssets, prevCurrentAssets, fy),
      LiabilitiesCurrent: createMockFact(currentLiabilities, prevCurrentLiabilities, fy),
      CommonStockSharesOutstanding: createMockFact(shares, prevShares, fy),
      GrossProfit: createMockFact(grossProfit, prevGrossProfit, fy),
      Revenues: createMockFact(revenue, prevRevenue, fy)
    }
  };

  return calculateRealFScore(facts, ticker, true);
}

function createMockFact(curr, prev, fy) {
  return {
    units: {
      USD: [
        { fy: fy - 1, fp: 'FY', form: '10-K', val: prev, filed: `${fy-1}-10-25` },
        { fy: fy, fp: 'FY', form: '10-K', val: curr, filed: `${fy}-10-24` }
      ],
      shares: [
        { fy: fy - 1, fp: 'FY', form: '10-K', val: prev, filed: `${fy-1}-10-25` },
        { fy: fy, fp: 'FY', form: '10-K', val: curr, filed: `${fy}-10-24` }
      ]
    }
  };
}

function calculateRealFScore(facts, ticker, isSimulated = false) {
  const findLatestYears = () => {
    // We look for any category from us-gaap to determine the latest year
    const candidates = ['NetIncomeLoss', 'ProfitLoss', 'AssetsTotal', 'Assets'];
    for (const tag of candidates) {
      const cat = facts['us-gaap']?.[tag];
      if (cat?.units) {
        const keys = Object.keys(cat.units);
        if (keys.length > 0) {
          const arr = cat.units[keys[0]] || [];
          const years = [...new Set(arr.filter(d => d.fy && (d.form === '10-K' || d.fp === 'FY')).map(d => d.fy))];
          if (years.length > 0) {
            years.sort((a, b) => b - a);
            return { fyT: years[0], fyT1: years[0] - 1 };
          }
        }
      }
    }
    return { fyT: 2024, fyT1: 2023 };
  };

  const { fyT, fyT1 } = findLatestYears();

  // Helpers to retrieve financial values with alternative taxonomy tags
  const getVal = (tags) => {
    for (const tag of tags) {
      for (const ns of ['us-gaap', 'dei']) {
        const cat = facts[ns]?.[tag];
        if (cat?.units) {
          const uKeys = Object.keys(cat.units);
          for (const uk of uKeys) {
            const arr = cat.units[uk] || [];
            const valT = arr.find(d => d.fy === fyT && (d.form === '10-K' || d.fp === 'FY' || d.frame === `CY${fyT}`));
            const valT1 = arr.find(d => d.fy === fyT1 && (d.form === '10-K' || d.fp === 'FY' || d.frame === `CY${fyT1}`));
            if (valT || valT1) {
              return {
                curr: valT ? valT.val : null,
                prev: valT1 ? valT1.val : null
              };
            }
          }
        }
      }
    }
    return { curr: null, prev: null };
  };

  const ni = getVal(['NetIncomeLoss', 'ProfitLoss', 'NetIncomeLossAvailableToCommonStockholdersBasic']);
  const cfo = getVal(['NetCashProvidedByUsedInOperatingActivities', 'CashFlowsFromUsedInOperatingActivities', 'NetCashProvidedByUsedInOperatingActivitiesContinuingOperations']);
  const assets = getVal(['Assets', 'AssetsTotal', 'AssetsNoncurrent']);
  const ltDebt = getVal(['LongTermDebt', 'LongTermDebtNoncurrent', 'LongTermDebtAndCapitalLeaseObligations', 'LongTermDebtLiabilities']);
  const ca = getVal(['AssetsCurrent']);
  const cl = getVal(['LiabilitiesCurrent']);
  const gross = getVal(['GrossProfit', 'GrossMargin']);
  const rev = getVal(['Revenues', 'SalesRevenueNet', 'RevenueFromContractWithCustomerExcludingAssessedTax', 'SalesRevenueGoodsNet']);
  const shares = getVal(['CommonStockSharesOutstanding', 'WeightedAverageNumberOfSharesOutstandingBasic', 'EntityCommonStockSharesOutstanding', 'WeightedAverageNumberOfDilutedSharesOutstanding']);

  // Compute Piotroski 9 Criteria
  const f1 = (ni.curr !== null && ni.curr > 0) ? 1 : 0;
  const f2 = (cfo.curr !== null && cfo.curr > 0) ? 1 : 0;

  const roaT = (ni.curr !== null && assets.curr) ? (ni.curr / assets.curr) : 0;
  const roaT1 = (ni.prev !== null && assets.prev) ? (ni.prev / assets.prev) : 0;
  const f3 = (roaT > roaT1 && ni.curr !== null && ni.prev !== null) ? 1 : 0;

  const f4 = (cfo.curr !== null && ni.curr !== null && cfo.curr > ni.curr) ? 1 : 0;

  const dRatioT = (ltDebt.curr !== null && assets.curr) ? (ltDebt.curr / assets.curr) : 0;
  const dRatioT1 = (ltDebt.prev !== null && assets.prev) ? (ltDebt.prev / assets.prev) : 0;
  const f5 = (ltDebt.curr === null && ltDebt.prev === null) || (dRatioT < dRatioT1) ? 1 : 0;

  const cRatioT = (ca.curr !== null && cl.curr) ? (ca.curr / cl.curr) : 0;
  const cRatioT1 = (ca.prev !== null && cl.prev) ? (ca.prev / cl.prev) : 0;
  const f6 = (cRatioT > cRatioT1 && ca.curr !== null && ca.prev !== null) ? 1 : 0;

  const f7 = (shares.curr === null || shares.prev === null || shares.curr <= shares.prev) ? 1 : 0;

  const gmT = (gross.curr !== null && rev.curr) ? (gross.curr / rev.curr) : (gross.curr !== null ? 0.35 : 0);
  const gmT1 = (gross.prev !== null && rev.prev) ? (gross.prev / rev.prev) : (gross.prev !== null ? 0.34 : 0);
  const f8 = (gmT > gmT1) ? 1 : 0;

  const atT = (rev.curr !== null && assets.curr) ? (rev.curr / assets.curr) : 0;
  const atT1 = (rev.prev !== null && assets.prev) ? (rev.prev / assets.prev) : 0;
  const f9 = (atT > atT1 && rev.curr !== null && rev.prev !== null) ? 1 : 0;

  const score = f1 + f2 + f3 + f4 + f5 + f6 + f7 + f8 + f9;

  return {
    ticker,
    fiscalYear: fyT,
    score,
    isSimulated,
    metrics: {
      netIncome: ni.curr,
      cfo: cfo.curr,
      roa: roaT,
      prevRoa: roaT1,
      leverage: dRatioT,
      prevLeverage: dRatioT1,
      currentRatio: cRatioT,
      prevCurrentRatio: cRatioT1,
      shares: shares.curr,
      prevShares: shares.prev,
      grossMargin: gmT,
      prevGrossMargin: gmT1,
      assetTurnover: atT,
      prevAssetTurnover: atT1
    },
    breakdown: { f1, f2, f3, f4, f5, f6, f7, f8, f9 }
  };
}

startServer();
