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

// Default data
const defaultData = {
  influencers: [],
  tweets: [],
  analysis: [],
  stocks: []
}

// Load or init DB
function loadDB() {
  if (existsSync(DB_FILE)) {
    return JSON.parse(readFileSync(DB_FILE, 'utf-8'))
  }
  return { ...defaultData }
}

function saveDB(data) {
  writeFileSync(DB_FILE, JSON.stringify(data, null, 2))
}

let db = loadDB()

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

if (db.influencers.length === 0) {
  db.influencers = seedInfluencers
  saveDB(db)
  console.log('Seeded 20 influencers')
}

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
