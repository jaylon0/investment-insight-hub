import express from 'express'
import cors from 'cors'
import axios from 'axios'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_FILE = join(__dirname, 'data.json')
const app = express()
app.use(cors())
app.use(express.json())

// MiMo API
const MIMO_API_URL = 'https://token-plan-ams.xiaomimimo.com/v1'
const MIMO_API_KEY = 'tp-e88i2id2qrm7jw6khlccdqq2j1232sdlq5dkcnaa9s4b2315'

// Seed influencers
const seedInfluencers = [
  { id: 1, handle: 'zaborsky', displayName: 'Serenity', bio: '美股购买预测和建议', category: 'macro', followers: 50000, isActive: true },
  { id: 2, handle: 'DeItaone', displayName: 'DeItaone', bio: '金融快讯第一手来源', category: 'macro', followers: 800000, isActive: true },
  { id: 3, handle: 'FirstSquawk', displayName: 'First Squawk', bio: '市场快讯', category: 'macro', followers: 600000, isActive: true },
  { id: 4, handle: 'SoberLook', displayName: 'Sober Look', bio: '宏观数据分析', category: 'macro', followers: 200000, isActive: true },
  { id: 5, handle: 'CathieDWood', displayName: 'Cathie Wood', bio: 'ARK Invest CEO', category: 'stock', followers: 1500000, isActive: true },
  { id: 6, handle: 'jimcramer', displayName: 'Jim Cramer', bio: 'CNBC Mad Money 主持人', category: 'stock', followers: 2000000, isActive: true },
  { id: 7, handle: 'ChanosKynikos', displayName: 'Jim Chanos', bio: '著名空头', category: 'stock', followers: 300000, isActive: true },
  { id: 8, handle: 'MichaelBurryScion', displayName: 'Michael Burry', bio: '大空头', category: 'stock', followers: 400000, isActive: true },
  { id: 9, handle: 'unusual_whales', displayName: 'Unusual Whales', bio: '异常期权活动追踪', category: 'quant', followers: 900000, isActive: true },
  { id: 10, handle: 'optionslam', displayName: 'OptionSlam', bio: '期权数据分析', category: 'quant', followers: 150000, isActive: true },
  { id: 11, handle: 'tier10k', displayName: 'Tier10k', bio: 'SEC 文件速报', category: 'quant', followers: 250000, isActive: true },
  { id: 12, handle: 'traderstewie', displayName: 'Trader Stewie', bio: '技术分析图表', category: 'tech', followers: 180000, isActive: true },
  { id: 13, handle: 'ChartMonkey', displayName: 'Chart Monkey', bio: 'K线形态分析', category: 'tech', followers: 120000, isActive: true },
  { id: 14, handle: 'markets', displayName: 'Bloomberg Markets', bio: 'Bloomberg 官方', category: 'tech', followers: 3000000, isActive: true },
  { id: 15, handle: 'EricBalchunas', displayName: 'Eric Balchunas', bio: 'Bloomberg ETF 分析师', category: 'fund', followers: 200000, isActive: true },
  { id: 16, handle: 'MebFaber', displayName: 'Meb Faber', bio: 'Cambria Investment 联合创始人', category: 'fund', followers: 250000, isActive: true },
  { id: 17, handle: 'RyanDetrick', displayName: 'Ryan Detrick', bio: 'LPL Financial 首席策略师', category: 'fund', followers: 180000, isActive: true },
  { id: 18, handle: 'TashaARK', displayName: 'Tasha ARK', bio: 'ARK 分析师', category: 'techstock', followers: 100000, isActive: true },
  { id: 19, handle: 'Jukanlosreve', displayName: 'Jukanlosreve', bio: '半导体行业分析', category: 'techstock', followers: 80000, isActive: true },
  { id: 20, handle: 'SamirTabar', displayName: 'Samir Tabar', bio: 'AI/科技股投资观点', category: 'techstock', followers: 60000, isActive: true }
]

// Seed tweets
const seedTweets = [
  { id: 1, influencerId: 1, tweetId: 'seed_1', content: 'AAPL is showing strong momentum above $190. Key resistance at $195. If it breaks, we could see $200+ by end of month. Loading up on calls.', contentZh: 'AAPL在190美元上方显示出强劲势头。关键阻力位在195美元。如果突破，月底可能看到200美元以上。正在加仓看涨期权。', url: 'https://x.com/zaborsky/status/1', publishedAt: '2026-06-03T08:00:00Z', crawledAt: '2026-06-03T09:00:00Z', status: 'processed' },
  { id: 2, influencerId: 5, tweetId: 'seed_2', content: 'AI revolution is just getting started. NVDA remains our top conviction pick. We are adding to our position aggressively. The TAM for AI chips is massively underestimated.', contentZh: 'AI革命才刚刚开始。NVDA仍然是我们最有信心的选择。我们正在积极加仓。AI芯片的市场规模被严重低估了。', url: 'https://x.com/CathieDWood/status/2', publishedAt: '2026-06-03T07:30:00Z', crawledAt: '2026-06-03T09:00:00Z', status: 'processed' },
  { id: 3, influencerId: 6, tweetId: 'seed_3', content: 'I like AAPL here. The services business is underappreciated. Buy AAPL and hold it for 5 years. You will thank me later.', contentZh: '我看好AAPL。服务业务被低估了。买入AAPL并持有5年，你会感谢我的。', url: 'https://x.com/jimcramer/status/3', publishedAt: '2026-06-03T06:00:00Z', crawledAt: '2026-06-03T09:00:00Z', status: 'processed' },
  { id: 4, influencerId: 9, tweetId: 'seed_4', content: 'Unusual options activity detected: TSLA $250 calls expiring next week, volume 3x average. Someone knows something. 🐋', contentZh: '检测到异常期权活动：TSLA 250美元看涨期权下周到期，成交量是平均的3倍。有人知道些什么。🐋', url: 'https://x.com/unusual_whales/status/4', publishedAt: '2026-06-03T05:00:00Z', crawledAt: '2026-06-03T09:00:00Z', status: 'processed' },
  { id: 5, influencerId: 8, tweetId: 'seed_5', content: 'The market is overvalued by every metric. Cash is a position. Waiting for better entry points. Patience is key.', contentZh: '从各个指标来看，市场都被高估了。持有现金也是一种策略。等待更好的入场点。耐心是关键。', url: 'https://x.com/MichaelBurryScion/status/5', publishedAt: '2026-06-02T22:00:00Z', crawledAt: '2026-06-03T09:00:00Z', status: 'processed' },
  { id: 6, influencerId: 2, tweetId: 'seed_6', content: 'BREAKING: Fed holds rates steady. Dot plot suggests 2 cuts this year. Market rallying on the news.', contentZh: '突发：美联储维持利率不变。点阵图暗示今年降息2次。市场因消息上涨。', url: 'https://x.com/DeItaone/status/6', publishedAt: '2026-06-02T20:00:00Z', crawledAt: '2026-06-03T09:00:00Z', status: 'processed' },
  { id: 7, influencerId: 12, tweetId: 'seed_7', content: 'NVDA breaking out of a bull flag pattern. Target $150. RSI not overbought yet. This is a strong buy signal. 📈', contentZh: 'NVDA突破牛旗形态。目标价150美元。RSI尚未超买。这是一个强烈的买入信号。📈', url: 'https://x.com/traderstewie/status/7', publishedAt: '2026-06-02T18:00:00Z', crawledAt: '2026-06-03T09:00:00Z', status: 'processed' },
  { id: 8, influencerId: 15, tweetId: 'seed_8', content: 'QQQ inflows hit record $15B this month. Institutional investors are loading up on tech. The trend is your friend.', contentZh: 'QQQ本月资金流入创纪录达150亿美元。机构投资者正在大量买入科技股。趋势是你的朋友。', url: 'https://x.com/EricBalchunas/status/8', publishedAt: '2026-06-02T16:00:00Z', crawledAt: '2026-06-03T09:00:00Z', status: 'processed' },
  { id: 9, influencerId: 7, tweetId: 'seed_9', content: 'TSLA valuation makes no sense. $800B market cap for a car company? Short thesis intact. Adding to my short position.', contentZh: 'TSLA的估值没有意义。一家汽车公司8000亿美元市值？做空逻辑不变。正在加仓做空。', url: 'https://x.com/ChanosKynikos/status/9', publishedAt: '2026-06-02T14:00:00Z', crawledAt: '2026-06-03T09:00:00Z', status: 'processed' },
  { id: 10, influencerId: 18, tweetId: 'seed_10', content: 'ARK is buying more PLTR. AI and data analytics will be the next mega trend. Our research shows 10x potential in 5 years.', contentZh: 'ARK正在买入更多PLTR。AI和数据分析将是下一个超级趋势。我们的研究显示5年内有10倍潜力。', url: 'https://x.com/TashaARK/status/10', publishedAt: '2026-06-02T12:00:00Z', crawledAt: '2026-06-03T09:00:00Z', status: 'processed' },
  { id: 11, influencerId: 19, tweetId: 'seed_11', content: 'Semiconductor supply chain is tightening. TSMC capacity fully booked through 2027. Bullish on ASML, TSM, AVGO.', contentZh: '半导体供应链正在收紧。台积电产能到2027年已全部预订。看好ASML、TSM、AVGO。', url: 'https://x.com/Jukanlosreve/status/11', publishedAt: '2026-06-02T10:00:00Z', crawledAt: '2026-06-03T09:00:00Z', status: 'processed' },
  { id: 12, influencerId: 14, tweetId: 'seed_12', content: 'S&P 500 hits new all-time high. Breadth is improving. More stocks participating in the rally. Bullish signal.', contentZh: '标普500创历史新高。市场广度正在改善。更多股票参与上涨。看涨信号。', url: 'https://x.com/markets/status/12', publishedAt: '2026-06-02T08:00:00Z', crawledAt: '2026-06-03T09:00:00Z', status: 'processed' },
  { id: 13, influencerId: 17, tweetId: 'seed_13', content: 'June historically is a weak month for stocks. But this year could be different with Fed rate cuts coming. Stay invested.', contentZh: '历史上6月是股市的弱势月份。但今年可能不同，美联储即将降息。继续持有。', url: 'https://x.com/RyanDetrick/status/13', publishedAt: '2026-06-01T20:00:00Z', crawledAt: '2026-06-03T09:00:00Z', status: 'processed' },
  { id: 14, influencerId: 3, tweetId: 'seed_14', content: 'US CPI comes in at 2.8%, below expectations of 3.0%. Inflation cooling faster than expected. Rate cuts more likely.', contentZh: '美国CPI为2.8%，低于预期的3.0%。通胀降温速度快于预期。降息可能性增加。', url: 'https://x.com/FirstSquawk/status/14', publishedAt: '2026-06-01T18:00:00Z', crawledAt: '2026-06-03T09:00:00Z', status: 'processed' },
  { id: 15, influencerId: 10, tweetId: 'seed_15', content: 'AMZN options flow is extremely bullish. Massive call buying in the $200 strike for July expiration. Smart money is betting big.', contentZh: 'AMZN期权流向极度看涨。7月到期的200美元行权价有大量看涨期权买入。聪明钱在大举押注。', url: 'https://x.com/optionslam/status/15', publishedAt: '2026-06-01T16:00:00Z', crawledAt: '2026-06-03T09:00:00Z', status: 'processed' },
  { id: 16, influencerId: 20, tweetId: 'seed_16', content: 'MSFT Azure revenue growing 30% YoY. AI services driving massive cloud growth. Price target raised to $500.', contentZh: 'MSFT Azure收入同比增长30%。AI服务推动云业务大幅增长。目标价上调至500美元。', url: 'https://x.com/SamirTabar/status/16', publishedAt: '2026-06-01T14:00:00Z', crawledAt: '2026-06-03T09:00:00Z', status: 'processed' },
  { id: 17, influencerId: 16, tweetId: 'seed_17', content: 'Global diversification is key. International stocks are cheap relative to US. Consider adding VXUS to your portfolio.', contentZh: '全球多元化是关键。国际股票相对于美国股票很便宜。考虑在投资组合中加入VXUS。', url: 'https://x.com/MebFaber/status/17', publishedAt: '2026-06-01T12:00:00Z', crawledAt: '2026-06-03T09:00:00Z', status: 'processed' },
  { id: 18, influencerId: 4, tweetId: 'seed_18', content: 'Yield curve is un-inverting. Historically, this signals recession within 12 months. Defensive positioning recommended.', contentZh: '收益率曲线正在正常化。历史上，这预示着12个月内可能出现衰退。建议防御性配置。', url: 'https://x.com/SoberLook/status/18', publishedAt: '2026-06-01T10:00:00Z', crawledAt: '2026-06-03T09:00:00Z', status: 'processed' },
  { id: 19, influencerId: 11, tweetId: 'seed_19', content: 'SEC filing: NVDA CEO Jensen Huang sold $50M in stock this week. Insider selling accelerating. Worth watching.', contentZh: 'SEC文件：NVDA CEO黄仁勋本周出售了5000万美元股票。内部人士出售加速。值得关注。', url: 'https://x.com/tier10k/status/19', publishedAt: '2026-05-31T22:00:00Z', crawledAt: '2026-06-03T09:00:00Z', status: 'processed' },
  { id: 20, influencerId: 13, tweetId: 'seed_20', content: 'SPY forming a double bottom on the daily chart. If support holds at $520, expect a bounce to $540. Watch the volume.', contentZh: 'SPY日线图形成双底形态。如果520美元支撑位守住，预计反弹至540美元。关注成交量。', url: 'https://x.com/ChartMonkey/status/20', publishedAt: '2026-05-31T20:00:00Z', crawledAt: '2026-06-03T09:00:00Z', status: 'processed' }
]

// Seed analysis
const seedAnalysis = [
  { id: 1, tweetId: 1, influencerId: 1, summary: 'AAPL突破190，目标200美元', sentiment: 'bullish', sentimentScore: 0.85, mentionedStocks: [{ ticker: 'AAPL', name: 'Apple Inc.', action: 'buy', targetPrice: 200, confidence: 0.7 }], keyInsights: ['关键阻力位195', '加仓看涨期权'], riskLevel: 'medium', timeHorizon: 'short', processedAt: '2026-06-03T09:00:00Z' },
  { id: 2, tweetId: 2, influencerId: 5, summary: 'AI革命刚开始，NVDA是最强信心票', sentiment: 'bullish', sentimentScore: 0.95, mentionedStocks: [{ ticker: 'NVDA', name: 'NVIDIA Corp', action: 'buy', targetPrice: 150, confidence: 0.9 }], keyInsights: ['AI芯片市场被严重低估', '积极加仓'], riskLevel: 'medium', timeHorizon: 'long', processedAt: '2026-06-03T09:00:00Z' },
  { id: 3, tweetId: 3, influencerId: 6, summary: '看好AAPL服务业务，建议持有5年', sentiment: 'bullish', sentimentScore: 0.8, mentionedStocks: [{ ticker: 'AAPL', name: 'Apple Inc.', action: 'buy', targetPrice: null, confidence: 0.75 }], keyInsights: ['服务业务被低估', '长期持有策略'], riskLevel: 'low', timeHorizon: 'long', processedAt: '2026-06-03T09:00:00Z' },
  { id: 4, tweetId: 4, influencerId: 9, summary: 'TSLA异常期权活动，大量看涨期权买入', sentiment: 'bullish', sentimentScore: 0.7, mentionedStocks: [{ ticker: 'TSLA', name: 'Tesla Inc.', action: 'watch', targetPrice: 250, confidence: 0.6 }], keyInsights: ['成交量是平均的3倍', '有人知道内幕'], riskLevel: 'high', timeHorizon: 'short', processedAt: '2026-06-03T09:00:00Z' },
  { id: 5, tweetId: 5, influencerId: 8, summary: '市场被高估，持有现金等待机会', sentiment: 'bearish', sentimentScore: 0.2, mentionedStocks: [], keyInsights: ['市场被高估', '耐心等待入场点'], riskLevel: 'high', timeHorizon: 'medium', processedAt: '2026-06-03T09:00:00Z' },
  { id: 6, tweetId: 6, influencerId: 2, summary: '美联储维持利率，暗示今年降息2次', sentiment: 'bullish', sentimentScore: 0.75, mentionedStocks: [], keyInsights: ['利率不变', '点阵图暗示降息'], riskLevel: 'low', timeHorizon: 'medium', processedAt: '2026-06-03T09:00:00Z' },
  { id: 7, tweetId: 7, influencerId: 12, summary: 'NVDA突破牛旗形态，强烈买入信号', sentiment: 'bullish', sentimentScore: 0.9, mentionedStocks: [{ ticker: 'NVDA', name: 'NVIDIA Corp', action: 'buy', targetPrice: 150, confidence: 0.8 }], keyInsights: ['牛旗突破', 'RSI未超买'], riskLevel: 'medium', timeHorizon: 'short', processedAt: '2026-06-03T09:00:00Z' },
  { id: 8, tweetId: 8, influencerId: 15, summary: 'QQQ资金流入创纪录，机构看好科技股', sentiment: 'bullish', sentimentScore: 0.8, mentionedStocks: [{ ticker: 'QQQ', name: 'Invesco QQQ Trust', action: 'buy', targetPrice: null, confidence: 0.7 }], keyInsights: ['流入150亿美元', '机构大量买入'], riskLevel: 'low', timeHorizon: 'medium', processedAt: '2026-06-03T09:00:00Z' },
  { id: 9, tweetId: 9, influencerId: 7, summary: 'TSLA估值不合理，继续做空', sentiment: 'bearish', sentimentScore: 0.15, mentionedStocks: [{ ticker: 'TSLA', name: 'Tesla Inc.', action: 'sell', targetPrice: null, confidence: 0.8 }], keyInsights: ['8000亿市值过高', '加仓做空'], riskLevel: 'high', timeHorizon: 'medium', processedAt: '2026-06-03T09:00:00Z' },
  { id: 10, tweetId: 10, influencerId: 18, summary: 'ARK买入PLTR，AI数据分析是下一个超级趋势', sentiment: 'bullish', sentimentScore: 0.85, mentionedStocks: [{ ticker: 'PLTR', name: 'Palantir Technologies', action: 'buy', targetPrice: null, confidence: 0.75 }], keyInsights: ['AI数据分析趋势', '5年10倍潜力'], riskLevel: 'high', timeHorizon: 'long', processedAt: '2026-06-03T09:00:00Z' },
  { id: 11, tweetId: 11, influencerId: 19, summary: '半导体供应链收紧，看好ASML/TSM/AVGO', sentiment: 'bullish', sentimentScore: 0.8, mentionedStocks: [{ ticker: 'ASML', name: 'ASML Holding', action: 'buy', targetPrice: null, confidence: 0.7 }, { ticker: 'TSM', name: 'Taiwan Semiconductor', action: 'buy', targetPrice: null, confidence: 0.7 }, { ticker: 'AVGO', name: 'Broadcom Inc.', action: 'buy', targetPrice: null, confidence: 0.7 }], keyInsights: ['台积电产能预订到2027', '供应链紧张'], riskLevel: 'medium', timeHorizon: 'long', processedAt: '2026-06-03T09:00:00Z' },
  { id: 12, tweetId: 12, influencerId: 14, summary: '标普500创新高，市场广度改善', sentiment: 'bullish', sentimentScore: 0.8, mentionedStocks: [{ ticker: 'SPY', name: 'SPDR S&P 500 ETF', action: 'buy', targetPrice: null, confidence: 0.7 }], keyInsights: ['历史新高', '更多股票参与上涨'], riskLevel: 'low', timeHorizon: 'medium', processedAt: '2026-06-03T09:00:00Z' },
  { id: 13, tweetId: 13, influencerId: 17, summary: '6月通常是弱势月，但今年降息或有不同', sentiment: 'neutral', sentimentScore: 0.55, mentionedStocks: [], keyInsights: ['历史弱势月份', '降息可能改变走势'], riskLevel: 'medium', timeHorizon: 'medium', processedAt: '2026-06-03T09:00:00Z' },
  { id: 14, tweetId: 14, influencerId: 3, summary: 'CPI低于预期，通胀降温，降息可能性增加', sentiment: 'bullish', sentimentScore: 0.75, mentionedStocks: [], keyInsights: ['CPI 2.8%低于预期', '降息可能性增加'], riskLevel: 'low', timeHorizon: 'medium', processedAt: '2026-06-03T09:00:00Z' },
  { id: 15, tweetId: 15, influencerId: 10, summary: 'AMZN期权极度看涨，大量看涨期权买入', sentiment: 'bullish', sentimentScore: 0.85, mentionedStocks: [{ ticker: 'AMZN', name: 'Amazon.com Inc.', action: 'buy', targetPrice: 200, confidence: 0.75 }], keyInsights: ['200美元行权价', '聪明钱大举押注'], riskLevel: 'medium', timeHorizon: 'short', processedAt: '2026-06-03T09:00:00Z' },
  { id: 16, tweetId: 16, influencerId: 20, summary: 'MSFT Azure增长30%，AI驱动云业务增长', sentiment: 'bullish', sentimentScore: 0.9, mentionedStocks: [{ ticker: 'MSFT', name: 'Microsoft Corp', action: 'buy', targetPrice: 500, confidence: 0.85 }], keyInsights: ['Azure增长30%', 'AI服务驱动增长'], riskLevel: 'low', timeHorizon: 'long', processedAt: '2026-06-03T09:00:00Z' },
  { id: 17, tweetId: 17, influencerId: 16, summary: '国际股票相对便宜，建议配置VXUS', sentiment: 'neutral', sentimentScore: 0.6, mentionedStocks: [{ ticker: 'VXUS', name: 'Vanguard Total International Stock ETF', action: 'buy', targetPrice: null, confidence: 0.65 }], keyInsights: ['全球多元化', '国际股票便宜'], riskLevel: 'low', timeHorizon: 'long', processedAt: '2026-06-03T09:00:00Z' },
  { id: 18, tweetId: 18, influencerId: 4, summary: '收益率曲线正常化，12个月内可能衰退', sentiment: 'bearish', sentimentScore: 0.25, mentionedStocks: [], keyInsights: ['收益率曲线正常化', '建议防御性配置'], riskLevel: 'high', timeHorizon: 'medium', processedAt: '2026-06-03T09:00:00Z' },
  { id: 19, tweetId: 19, influencerId: 11, summary: 'NVDA CEO出售5000万美元股票，内部人士出售加速', sentiment: 'bearish', sentimentScore: 0.3, mentionedStocks: [{ ticker: 'NVDA', name: 'NVIDIA Corp', action: 'watch', targetPrice: null, confidence: 0.6 }], keyInsights: ['CEO出售5000万', '内部人士出售加速'], riskLevel: 'medium', timeHorizon: 'short', processedAt: '2026-06-03T09:00:00Z' },
  { id: 20, tweetId: 20, influencerId: 13, summary: 'SPY形成双底形态，关注520支撑', sentiment: 'bullish', sentimentScore: 0.65, mentionedStocks: [{ ticker: 'SPY', name: 'SPDR S&P 500 ETF', action: 'watch', targetPrice: 540, confidence: 0.6 }], keyInsights: ['双底形态', '520支撑位'], riskLevel: 'medium', timeHorizon: 'short', processedAt: '2026-06-03T09:00:00Z' }
]

// Seed stocks
const seedStocks = [
  { id: 1, ticker: 'AAPL', name: 'Apple Inc.', mentionCount: 2, sentimentBullish: 2, sentimentBearish: 0, sentimentNeutral: 0, avgTargetPrice: 200, lastUpdated: '2026-06-03T09:00:00Z' },
  { id: 2, ticker: 'NVDA', name: 'NVIDIA Corp', mentionCount: 3, sentimentBullish: 2, sentimentBearish: 0, sentimentNeutral: 0, avgTargetPrice: 150, lastUpdated: '2026-06-03T09:00:00Z' },
  { id: 3, ticker: 'TSLA', name: 'Tesla Inc.', mentionCount: 2, sentimentBullish: 1, sentimentBearish: 1, sentimentNeutral: 0, avgTargetPrice: 250, lastUpdated: '2026-06-03T09:00:00Z' },
  { id: 4, ticker: 'MSFT', name: 'Microsoft Corp', mentionCount: 1, sentimentBullish: 1, sentimentBearish: 0, sentimentNeutral: 0, avgTargetPrice: 500, lastUpdated: '2026-06-03T09:00:00Z' },
  { id: 5, ticker: 'AMZN', name: 'Amazon.com Inc.', mentionCount: 1, sentimentBullish: 1, sentimentBearish: 0, sentimentNeutral: 0, avgTargetPrice: 200, lastUpdated: '2026-06-03T09:00:00Z' },
  { id: 6, ticker: 'PLTR', name: 'Palantir Technologies', mentionCount: 1, sentimentBullish: 1, sentimentBearish: 0, sentimentNeutral: 0, avgTargetPrice: null, lastUpdated: '2026-06-03T09:00:00Z' },
  { id: 7, ticker: 'QQQ', name: 'Invesco QQQ Trust', mentionCount: 1, sentimentBullish: 1, sentimentBearish: 0, sentimentNeutral: 0, avgTargetPrice: null, lastUpdated: '2026-06-03T09:00:00Z' },
  { id: 8, ticker: 'SPY', name: 'SPDR S&P 500 ETF', mentionCount: 2, sentimentBullish: 2, sentimentBearish: 0, sentimentNeutral: 0, avgTargetPrice: 540, lastUpdated: '2026-06-03T09:00:00Z' },
  { id: 9, ticker: 'ASML', name: 'ASML Holding', mentionCount: 1, sentimentBullish: 1, sentimentBearish: 0, sentimentNeutral: 0, avgTargetPrice: null, lastUpdated: '2026-06-03T09:00:00Z' },
  { id: 10, ticker: 'TSM', name: 'Taiwan Semiconductor', mentionCount: 1, sentimentBullish: 1, sentimentBearish: 0, sentimentNeutral: 0, avgTargetPrice: null, lastUpdated: '2026-06-03T09:00:00Z' },
  { id: 11, ticker: 'AVGO', name: 'Broadcom Inc.', mentionCount: 1, sentimentBullish: 1, sentimentBearish: 0, sentimentNeutral: 0, avgTargetPrice: null, lastUpdated: '2026-06-03T09:00:00Z' },
  { id: 12, ticker: 'VXUS', name: 'Vanguard Total International Stock ETF', mentionCount: 1, sentimentBullish: 0, sentimentBearish: 0, sentimentNeutral: 1, avgTargetPrice: null, lastUpdated: '2026-06-03T09:00:00Z' }
]

// Load or init DB
function loadDB() {
  if (existsSync(DB_FILE)) {
    const data = JSON.parse(readFileSync(DB_FILE, 'utf-8'))
    // If DB exists but is empty, seed it
    if (data.influencers.length === 0) {
      return { influencers: seedInfluencers, tweets: seedTweets, analysis: seedAnalysis, stocks: seedStocks }
    }
    return data
  }
  // Fresh start with seed data
  return { influencers: seedInfluencers, tweets: seedTweets, analysis: seedAnalysis, stocks: seedStocks }
}

function saveDB(data) {
  writeFileSync(DB_FILE, JSON.stringify(data, null, 2))
}

let db = loadDB()
saveDB(db)
console.log(`DB loaded: ${db.influencers.length} influencers, ${db.tweets.length} tweets, ${db.analysis.length} analysis, ${db.stocks.length} stocks`)

// Helper
function getInfluencer(id) {
  return db.influencers.find(i => i.id === id)
}

function getTweetWithDetails(tweet) {
  const inf = getInfluencer(tweet.influencerId)
  const analyses = db.analysis.filter(a => a.tweetId === tweet.id)
  return {
    ...tweet,
    influencer: inf ? { handle: inf.handle, displayName: inf.displayName, avatar: inf.avatar } : null,
    analysis: analyses[0] || null
  }
}

// API Routes
app.get('/api/dashboard', (req, res) => {
  const latestTweets = db.tweets.slice(-10).reverse().map(getTweetWithDetails)
  const hotStocks = db.stocks.sort((a, b) => b.mentionCount - a.mentionCount).slice(0, 10).map(s => ({
    ...s,
    sentimentDistribution: { bullish: s.sentimentBullish, bearish: s.sentimentBearish, neutral: s.sentimentNeutral }
  }))

  const oneDayAgo = new Date(Date.now() - 86400000).toISOString()
  const recentAnalysis = db.analysis.filter(a => a.processedAt >= oneDayAgo)
  const sentiment = {
    bullish: recentAnalysis.filter(a => a.sentiment === 'bullish').length,
    bearish: recentAnalysis.filter(a => a.sentiment === 'bearish').length,
    neutral: recentAnalysis.filter(a => a.sentiment === 'neutral').length
  }

  res.json({ latestTweets, hotStocks, sentiment })
})

app.get('/api/feed', (req, res) => {
  const { page = 1, pageSize = 20, sentiment, category } = req.query
  const offset = (page - 1) * pageSize

  let tweets = [...db.tweets].reverse()

  if (sentiment || category) {
    tweets = tweets.filter(t => {
      const inf = getInfluencer(t.influencerId)
      const analysis = db.analysis.find(a => a.tweetId === t.id)
      if (sentiment && (!analysis || analysis.sentiment !== sentiment)) return false
      if (category && (!inf || inf.category !== category)) return false
      return true
    })
  }

  const paged = tweets.slice(offset, offset + Number(pageSize)).map(getTweetWithDetails)
  res.json(paged)
})

app.get('/api/influencers', (req, res) => {
  res.json(db.influencers.filter(i => i.isActive).sort((a, b) => b.followers - a.followers))
})

app.get('/api/influencers/:id', (req, res) => {
  const inf = db.influencers.find(i => i.id === Number(req.params.id))
  if (!inf) return res.status(404).json({ error: 'Not found' })

  const tweets = db.tweets.filter(t => t.influencerId === inf.id).reverse()
  const analyses = db.analysis.filter(a => a.influencerId === inf.id)

  const stockCounts = {}
  for (const a of analyses) {
    for (const s of (a.mentionedStocks || [])) {
      stockCounts[s.ticker] = (stockCounts[s.ticker] || 0) + 1
    }
  }
  const topStocks = Object.entries(stockCounts)
    .map(([ticker, count]) => ({ ticker, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  res.json({ ...inf, tweets, topStocks, totalTweets: tweets.length })
})

app.get('/api/stocks', (req, res) => {
  const stocks = db.stocks.sort((a, b) => b.mentionCount - a.mentionCount).map(s => ({
    ...s,
    sentimentDistribution: { bullish: s.sentimentBullish, bearish: s.sentimentBearish, neutral: s.sentimentNeutral }
  }))
  res.json(stocks)
})

app.get('/api/stocks/:ticker', (req, res) => {
  const stock = db.stocks.find(s => s.ticker === req.params.ticker)
  if (!stock) return res.status(404).json({ error: 'Not found' })

  const relatedAnalysis = db.analysis.filter(a =>
    (a.mentionedStocks || []).some(s => s.ticker === req.params.ticker)
  )

  const tweets = relatedAnalysis.map(a => {
    const tweet = db.tweets.find(t => t.id === a.tweetId)
    return tweet ? getTweetWithDetails(tweet) : null
  }).filter(Boolean)

  res.json({
    ...stock,
    sentimentDistribution: { bullish: stock.sentimentBullish, bearish: stock.sentimentBearish, neutral: stock.sentimentNeutral },
    tweets
  })
})

app.get('/api/insights', (req, res) => {
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()
  const recentAnalysis = db.analysis.filter(a => a.processedAt >= weekAgo)

  const sentiment = {
    bullish: recentAnalysis.filter(a => a.sentiment === 'bullish').length,
    bearish: recentAnalysis.filter(a => a.sentiment === 'bearish').length,
    neutral: recentAnalysis.filter(a => a.sentiment === 'neutral').length
  }

  const stockCounts = {}
  for (const a of recentAnalysis) {
    for (const s of (a.mentionedStocks || [])) {
      if (!stockCounts[s.ticker]) stockCounts[s.ticker] = { count: 0, bullish: 0, bearish: 0, neutral: 0 }
      stockCounts[s.ticker].count++
      stockCounts[s.ticker][a.sentiment]++
    }
  }
  const hotStocks = Object.entries(stockCounts)
    .map(([ticker, info]) => ({ ticker, ...info }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  const nodes = []
  const links = []
  const nodeSet = new Set()

  for (const a of recentAnalysis) {
    const inf = getInfluencer(a.influencerId)
    const name = inf?.displayName || `V${a.influencerId}`
    if (!nodeSet.has(name)) {
      nodeSet.add(name)
      nodes.push({ id: name, type: 'influencer' })
    }
    for (const s of (a.mentionedStocks || [])) {
      if (!nodeSet.has(s.ticker)) {
        nodeSet.add(s.ticker)
        nodes.push({ id: s.ticker, type: 'stock' })
      }
      links.push({ source: name, target: s.ticker })
    }
  }

  res.json({ sentiment, hotStocks, network: { nodes, links }, totalAnalysis: recentAnalysis.length })
})

// Crawl endpoint
app.post('/api/crawl', async (req, res) => {
  const { batch = 0, batchSize = 3 } = req.body
  const allInf = db.influencers.filter(i => i.isActive)
  const start = batch * batchSize
  const batchInf = allInf.slice(start, start + batchSize)

  if (batchInf.length === 0) return res.json({ message: 'All done', done: true })

  let totalNew = 0
  for (const inf of batchInf) {
    try {
      const response = await axios.post(`${MIMO_API_URL}/chat/completions`, {
        model: 'mimo-v2.5-pro',
        messages: [
          { role: 'system', content: '你是一个数据采集助手。请严格按照要求的JSON格式返回数据。' },
          { role: 'user', content: `请使用网页搜索功能，查找 Twitter/X 用户 @${inf.handle} 最近发布的推文内容。返回 JSON 数组，每条包含 content(推文完整原文)、publishedAt(时间)、url(链接)。找不到返回 []。最多返回 2 条。` }
        ],
        temperature: 0.1
      }, {
        headers: { 'Authorization': `Bearer ${MIMO_API_KEY}` },
        timeout: 60000
      })

      const content = response.data.choices[0].message.content
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      const tweets = JSON.parse(jsonMatch ? jsonMatch[0] : '[]')

      for (const t of tweets) {
        const existing = db.tweets.find(tw => tw.influencerId === inf.id && tw.content === t.content)
        if (!existing) {
          db.tweets.push({
            id: db.tweets.length + 1,
            influencerId: inf.id,
            tweetId: `web_${Date.now()}`,
            content: t.content,
            contentZh: '',
            url: t.url || '',
            publishedAt: t.publishedAt || new Date().toISOString(),
            crawledAt: new Date().toISOString(),
            status: 'pending'
          })
          totalNew++
        }
      }
    } catch (err) {
      console.error(`Crawl @${inf.handle} failed:`, err.message)
    }
  }

  saveDB(db)
  const done = start + batchSize >= allInf.length
  res.json({ totalNew, batch, done, nextBatch: done ? null : batch + 1 })
})

// Analyze endpoint
app.post('/api/analyze', async (req, res) => {
  const pending = db.tweets.filter(t => t.status === 'pending').slice(0, 10)
  if (pending.length === 0) return res.json({ message: 'No pending tweets', processed: 0 })

  let processed = 0
  for (const tweet of pending) {
    try {
      const response = await axios.post(`${MIMO_API_URL}/chat/completions`, {
        model: 'mimo-v2.5-pro',
        messages: [
          { role: 'system', content: '你是一个专业的金融分析师助手。请严格按照要求的JSON格式返回分析结果。' },
          { role: 'user', content: `分析以下推文，返回 JSON：
{"summary":"一句话中文摘要","contentZh":"中文翻译","sentiment":"bullish/bearish/neutral","sentimentScore":0-1,"mentionedStocks":[{"ticker":"代码","name":"公司","action":"buy/sell/hold/watch","targetPrice":数字或null,"confidence":0-1}],"keyInsights":["观点"],"riskLevel":"low/medium/high","timeHorizon":"short/medium/long"}

推文：${tweet.content}` }
        ],
        temperature: 0.2
      }, {
        headers: { 'Authorization': `Bearer ${MIMO_API_KEY}` },
        timeout: 60000
      })

      const result = response.data.choices[0].message.content
      const jsonMatch = result.match(/\{[\s\S]*\}/)
      const analysis = JSON.parse(jsonMatch ? jsonMatch[0] : '{}')

      db.analysis.push({
        id: db.analysis.length + 1,
        tweetId: tweet.id,
        influencerId: tweet.influencerId,
        summary: analysis.summary,
        sentiment: analysis.sentiment,
        sentimentScore: analysis.sentimentScore,
        mentionedStocks: analysis.mentionedStocks || [],
        keyInsights: analysis.keyInsights || [],
        riskLevel: analysis.riskLevel,
        timeHorizon: analysis.timeHorizon,
        processedAt: new Date().toISOString()
      })

      tweet.status = 'processed'
      tweet.contentZh = analysis.contentZh

      // Update stock aggregation
      for (const s of (analysis.mentionedStocks || [])) {
        let stock = db.stocks.find(st => st.ticker === s.ticker)
        const stockAnalysis = db.analysis.filter(a =>
          (a.mentionedStocks || []).some(ms => ms.ticker === s.ticker)
        )

        if (stock) {
          stock.name = s.name
          stock.mentionCount = stockAnalysis.length
          stock.sentimentBullish = stockAnalysis.filter(a => a.sentiment === 'bullish').length
          stock.sentimentBearish = stockAnalysis.filter(a => a.sentiment === 'bearish').length
          stock.sentimentNeutral = stockAnalysis.filter(a => a.sentiment === 'neutral').length
        } else {
          db.stocks.push({
            id: db.stocks.length + 1,
            ticker: s.ticker,
            name: s.name,
            mentionCount: 1,
            sentimentBullish: analysis.sentiment === 'bullish' ? 1 : 0,
            sentimentBearish: analysis.sentiment === 'bearish' ? 1 : 0,
            sentimentNeutral: analysis.sentiment === 'neutral' ? 1 : 0,
            lastUpdated: new Date().toISOString()
          })
        }
      }

      processed++
    } catch (err) {
      console.error(`Analyze tweet ${tweet.id} failed:`, err.message)
      tweet.status = 'error'
    }
  }

  saveDB(db)
  res.json({ processed })
})

const PORT = 3001
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
