import express from 'express'
import cors from 'cors'
import axios from 'axios'
import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const db = new Database(join(__dirname, 'data.db'))
const app = express()
app.use(cors())
app.use(express.json())

// MiMo API
const MIMO_API_URL = 'https://token-plan-ams.xiaomimimo.com/v1'
const MIMO_API_KEY = 'tp-e88i2id2qrm7jw6khlccdqq2j1232sdlq5dkcnaa9s4b2315'

// Init DB
db.exec(`
  CREATE TABLE IF NOT EXISTS influencers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    handle TEXT UNIQUE,
    displayName TEXT,
    avatar TEXT DEFAULT '',
    bio TEXT,
    category TEXT,
    followers INTEGER DEFAULT 0,
    isActive INTEGER DEFAULT 1,
    createdAt TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS tweets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    influencerId INTEGER,
    tweetId TEXT,
    content TEXT,
    contentZh TEXT DEFAULT '',
    url TEXT DEFAULT '',
    publishedAt TEXT,
    crawledAt TEXT DEFAULT (datetime('now')),
    status TEXT DEFAULT 'pending',
    FOREIGN KEY (influencerId) REFERENCES influencers(id)
  );
  CREATE TABLE IF NOT EXISTS analysis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tweetId INTEGER,
    influencerId INTEGER,
    summary TEXT,
    sentiment TEXT,
    sentimentScore REAL,
    mentionedStocks TEXT DEFAULT '[]',
    keyInsights TEXT DEFAULT '[]',
    riskLevel TEXT,
    timeHorizon TEXT,
    processedAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (tweetId) REFERENCES tweets(id),
    FOREIGN KEY (influencerId) REFERENCES influencers(id)
  );
  CREATE TABLE IF NOT EXISTS stocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker TEXT UNIQUE,
    name TEXT,
    mentionCount INTEGER DEFAULT 0,
    sentimentBullish INTEGER DEFAULT 0,
    sentimentBearish INTEGER DEFAULT 0,
    sentimentNeutral INTEGER DEFAULT 0,
    avgTargetPrice REAL,
    lastUpdated TEXT DEFAULT (datetime('now'))
  );
`)

// Seed data
const influencers = [
  { handle: 'zaborsky', displayName: 'Serenity', bio: '美股购买预测和建议', category: 'macro', followers: 50000 },
  { handle: 'DeItaone', displayName: 'DeItaone', bio: '金融快讯第一手来源', category: 'macro', followers: 800000 },
  { handle: 'FirstSquawk', displayName: 'First Squawk', bio: '市场快讯', category: 'macro', followers: 600000 },
  { handle: 'SoberLook', displayName: 'Sober Look', bio: '宏观数据分析', category: 'macro', followers: 200000 },
  { handle: 'CathieDWood', displayName: 'Cathie Wood', bio: 'ARK Invest CEO', category: 'stock', followers: 1500000 },
  { handle: 'jimcramer', displayName: 'Jim Cramer', bio: 'CNBC Mad Money 主持人', category: 'stock', followers: 2000000 },
  { handle: 'ChanosKynikos', displayName: 'Jim Chanos', bio: '著名空头', category: 'stock', followers: 300000 },
  { handle: 'MichaelBurryScion', displayName: 'Michael Burry', bio: '大空头', category: 'stock', followers: 400000 },
  { handle: 'unusual_whales', displayName: 'Unusual Whales', bio: '异常期权活动追踪', category: 'quant', followers: 900000 },
  { handle: 'optionslam', displayName: 'OptionSlam', bio: '期权数据分析', category: 'quant', followers: 150000 },
  { handle: 'tier10k', displayName: 'Tier10k', bio: 'SEC 文件速报', category: 'quant', followers: 250000 },
  { handle: 'traderstewie', displayName: 'Trader Stewie', bio: '技术分析图表', category: 'tech', followers: 180000 },
  { handle: 'ChartMonkey', displayName: 'Chart Monkey', bio: 'K线形态分析', category: 'tech', followers: 120000 },
  { handle: 'markets', displayName: 'Bloomberg Markets', bio: 'Bloomberg 官方', category: 'tech', followers: 3000000 },
  { handle: 'EricBalchunas', displayName: 'Eric Balchunas', bio: 'Bloomberg ETF 分析师', category: 'fund', followers: 200000 },
  { handle: 'MebFaber', displayName: 'Meb Faber', bio: 'Cambria Investment 联合创始人', category: 'fund', followers: 250000 },
  { handle: 'RyanDetrick', displayName: 'Ryan Detrick', bio: 'LPL Financial 首席策略师', category: 'fund', followers: 180000 },
  { handle: 'TashaARK', displayName: 'Tasha ARK', bio: 'ARK 分析师', category: 'techstock', followers: 100000 },
  { handle: 'Jukanlosreve', displayName: 'Jukanlosreve', bio: '半导体行业分析', category: 'techstock', followers: 80000 },
  { handle: 'SamirTabar', displayName: 'Samir Tabar', bio: 'AI/科技股投资观点', category: 'techstock', followers: 60000 }
]

// Seed if empty
const count = db.prepare('SELECT COUNT(*) as c FROM influencers').get()
if (count.c === 0) {
  const stmt = db.prepare('INSERT INTO influencers (handle, displayName, bio, category, followers) VALUES (?, ?, ?, ?, ?)')
  for (const inf of influencers) {
    stmt.run(inf.handle, inf.displayName, inf.bio, inf.category, inf.followers)
  }
  console.log('Seeded 20 influencers')
}

// API Routes
app.get('/api/dashboard', (req, res) => {
  const latestTweets = db.prepare(`
    SELECT t.*, i.handle, i.displayName, i.avatar,
           a.summary, a.sentiment, a.sentimentScore, a.mentionedStocks
    FROM tweets t
    JOIN influencers i ON t.influencerId = i.id
    LEFT JOIN analysis a ON a.tweetId = t.id
    ORDER BY t.crawledAt DESC LIMIT 10
  `).all()

  const hotStocks = db.prepare('SELECT * FROM stocks ORDER BY mentionCount DESC LIMIT 10').all()
  const sentiment = db.prepare(`
    SELECT
      SUM(CASE WHEN sentiment='bullish' THEN 1 ELSE 0 END) as bullish,
      SUM(CASE WHEN sentiment='bearish' THEN 1 ELSE 0 END) as bearish,
      SUM(CASE WHEN sentiment='neutral' THEN 1 ELSE 0 END) as neutral
    FROM analysis WHERE processedAt >= datetime('now', '-1 day')
  `).get() || { bullish: 0, bearish: 0, neutral: 0 }

  const parseTweets = latestTweets.map(t => ({
    ...t,
    influencer: { handle: t.handle, displayName: t.displayName, avatar: t.avatar },
    analysis: t.summary ? { summary: t.summary, sentiment: t.sentiment, sentimentScore: t.sentimentScore, mentionedStocks: JSON.parse(t.mentionedStocks || '[]') } : null
  }))

  const parseStocks = hotStocks.map(s => ({
    ...s,
    sentimentDistribution: { bullish: s.sentimentBullish, bearish: s.sentimentBearish, neutral: s.sentimentNeutral }
  }))

  res.json({ latestTweets: parseTweets, hotStocks: parseStocks, sentiment })
})

app.get('/api/feed', (req, res) => {
  const { page = 1, pageSize = 20, sentiment, category } = req.query
  const offset = (page - 1) * pageSize

  let sql = `
    SELECT t.*, i.handle, i.displayName, i.avatar,
           a.summary, a.sentiment, a.sentimentScore, a.mentionedStocks
    FROM tweets t
    JOIN influencers i ON t.influencerId = i.id
    LEFT JOIN analysis a ON a.tweetId = t.id
  `
  const conditions = []
  const params = []

  if (sentiment) {
    conditions.push('a.sentiment = ?')
    params.push(sentiment)
  }
  if (category) {
    conditions.push('i.category = ?')
    params.push(category)
  }

  if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ')
  sql += ' ORDER BY t.crawledAt DESC LIMIT ? OFFSET ?'
  params.push(Number(pageSize), offset)

  const rows = db.prepare(sql).all(...params)
  const tweets = rows.map(t => ({
    ...t,
    influencer: { handle: t.handle, displayName: t.displayName, avatar: t.avatar },
    analysis: t.summary ? { summary: t.summary, sentiment: t.sentiment, sentimentScore: t.sentimentScore, mentionedStocks: JSON.parse(t.mentionedStocks || '[]') } : null
  }))

  res.json(tweets)
})

app.get('/api/influencers', (req, res) => {
  const rows = db.prepare('SELECT * FROM influencers WHERE isActive = 1 ORDER BY followers DESC').all()
  res.json(rows)
})

app.get('/api/influencers/:id', (req, res) => {
  const inf = db.prepare('SELECT * FROM influencers WHERE id = ?').get(req.params.id)
  if (!inf) return res.status(404).json({ error: 'Not found' })

  const tweets = db.prepare(`
    SELECT t.*, a.summary, a.sentiment, a.mentionedStocks
    FROM tweets t LEFT JOIN analysis a ON a.tweetId = t.id
    WHERE t.influencerId = ? ORDER BY t.crawledAt DESC LIMIT 50
  `).all(req.params.id)

  const stocks = db.prepare(`
    SELECT json_extract(value, '$.ticker') as ticker, json_extract(value, '$.name') as name, COUNT(*) as count
    FROM analysis, json_each(analysis.mentionedStocks)
    WHERE influencerId = ?
    GROUP BY ticker ORDER BY count DESC LIMIT 10
  `).all(req.params.id)

  res.json({ ...inf, tweets, topStocks: stocks, totalTweets: tweets.length })
})

app.get('/api/stocks', (req, res) => {
  const rows = db.prepare('SELECT * FROM stocks ORDER BY mentionCount DESC').all()
  const stocks = rows.map(s => ({
    ...s,
    sentimentDistribution: { bullish: s.sentimentBullish, bearish: s.sentimentBearish, neutral: s.sentimentNeutral }
  }))
  res.json(stocks)
})

app.get('/api/stocks/:ticker', (req, res) => {
  const stock = db.prepare('SELECT * FROM stocks WHERE ticker = ?').get(req.params.ticker)
  if (!stock) return res.status(404).json({ error: 'Not found' })

  const tweets = db.prepare(`
    SELECT t.*, i.handle, i.displayName, a.summary, a.sentiment, a.mentionedStocks
    FROM analysis a
    JOIN tweets t ON a.tweetId = t.id
    JOIN influencers i ON a.influencerId = i.id
    WHERE a.mentionedStocks LIKE ?
    ORDER BY a.processedAt DESC LIMIT 20
  `).all(`%${req.params.ticker}%`)

  const parseTweets = tweets.map(t => ({
    ...t,
    influencer: { handle: t.handle, displayName: t.displayName },
    analysis: { summary: t.summary, sentiment: t.sentiment, mentionedStocks: JSON.parse(t.mentionedStocks || '[]') }
  }))

  res.json({
    ...stock,
    sentimentDistribution: { bullish: stock.sentimentBullish, bearish: stock.sentimentBearish, neutral: stock.sentimentNeutral },
    tweets: parseTweets
  })
})

app.get('/api/insights', (req, res) => {
  const sentiment = db.prepare(`
    SELECT
      SUM(CASE WHEN sentiment='bullish' THEN 1 ELSE 0 END) as bullish,
      SUM(CASE WHEN sentiment='bearish' THEN 1 ELSE 0 END) as bearish,
      SUM(CASE WHEN sentiment='neutral' THEN 1 ELSE 0 END) as neutral
    FROM analysis WHERE processedAt >= datetime('now', '-7 days')
  `).get() || { bullish: 0, bearish: 0, neutral: 0 }

  const hotStocks = db.prepare(`
    SELECT json_extract(value, '$.ticker') as ticker,
           SUM(CASE WHEN a.sentiment='bullish' THEN 1 ELSE 0 END) as bullish,
           SUM(CASE WHEN a.sentiment='bearish' THEN 1 ELSE 0 END) as bearish,
           SUM(CASE WHEN a.sentiment='neutral' THEN 1 ELSE 0 END) as neutral,
           COUNT(*) as count
    FROM analysis a, json_each(a.mentionedStocks)
    WHERE a.processedAt >= datetime('now', '-7 days')
    GROUP BY ticker ORDER BY count DESC LIMIT 10
  `).all()

  const totalAnalysis = db.prepare("SELECT COUNT(*) as c FROM analysis WHERE processedAt >= datetime('now', '-7 days')").get().c

  const nodes = []
  const links = []
  const nodeSet = new Set()

  const allAnalysis = db.prepare("SELECT influencerId, mentionedStocks FROM analysis WHERE processedAt >= datetime('now', '-7 days')").all()
  for (const a of allAnalysis) {
    if (!nodeSet.has(`inf_${a.influencerId}`)) {
      nodeSet.add(`inf_${a.influencerId}`)
      const inf = db.prepare('SELECT displayName FROM influencers WHERE id = ?').get(a.influencerId)
      nodes.push({ id: inf?.displayName || `V${a.influencerId}`, type: 'influencer' })
    }
    const stocks = JSON.parse(a.mentionedStocks || '[]')
    for (const s of stocks) {
      if (!nodeSet.has(`stock_${s.ticker}`)) {
        nodeSet.add(`stock_${s.ticker}`)
        nodes.push({ id: s.ticker, type: 'stock' })
      }
      const inf = db.prepare('SELECT displayName FROM influencers WHERE id = ?').get(a.influencerId)
      links.push({ source: inf?.displayName || `V${a.influencerId}`, target: s.ticker })
    }
  }

  res.json({ sentiment, hotStocks, network: { nodes, links }, totalAnalysis })
})

// Crawl endpoint
app.post('/api/crawl', async (req, res) => {
  const { batch = 0, batchSize = 3 } = req.body
  const allInf = db.prepare('SELECT * FROM influencers WHERE isActive = 1').all()
  const start = batch * batchSize
  const batch_inf = allInf.slice(start, start + batchSize)

  if (batch_inf.length === 0) return res.json({ message: 'All done', done: true })

  let totalNew = 0
  for (const inf of batch_inf) {
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
        timeout: 30000
      })

      const content = response.data.choices[0].message.content
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      const tweets = JSON.parse(jsonMatch ? jsonMatch[0] : '[]')

      for (const t of tweets) {
        const existing = db.prepare('SELECT id FROM tweets WHERE influencerId = ? AND content = ?').get(inf.id, t.content)
        if (!existing) {
          db.prepare('INSERT INTO tweets (influencerId, tweetId, content, url, publishedAt, status) VALUES (?, ?, ?, ?, ?, ?)').run(inf.id, `web_${Date.now()}`, t.content, t.url || '', t.publishedAt || new Date().toISOString(), 'pending')
          totalNew++
        }
      }
    } catch (err) {
      console.error(`Crawl @${inf.handle} failed:`, err.message)
    }
  }

  const done = start + batchSize >= allInf.length
  res.json({ totalNew, batch, done, nextBatch: done ? null : batch + 1 })
})

// Analyze endpoint
app.post('/api/analyze', async (req, res) => {
  const pending = db.prepare("SELECT * FROM tweets WHERE status = 'pending' LIMIT 10").all()
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
        timeout: 30000
      })

      const result = response.data.choices[0].message.content
      const jsonMatch = result.match(/\{[\s\S]*\}/)
      const analysis = JSON.parse(jsonMatch ? jsonMatch[0] : '{}')

      db.prepare('INSERT INTO analysis (tweetId, influencerId, summary, sentiment, sentimentScore, mentionedStocks, keyInsights, riskLevel, timeHorizon) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
        tweet.id, tweet.influencerId, analysis.summary, analysis.sentiment, analysis.sentimentScore,
        JSON.stringify(analysis.mentionedStocks || []), JSON.stringify(analysis.keyInsights || []),
        analysis.riskLevel, analysis.timeHorizon
      )

      db.prepare("UPDATE tweets SET status = 'processed', contentZh = ? WHERE id = ?").run(analysis.contentZh, tweet.id)

      // Update stock aggregation
      for (const s of (analysis.mentionedStocks || [])) {
        const existing = db.prepare('SELECT id FROM stocks WHERE ticker = ?').get(s.ticker)
        const agg = db.prepare(`
          SELECT
            SUM(CASE WHEN sentiment='bullish' THEN 1 ELSE 0 END) as bullish,
            SUM(CASE WHEN sentiment='bearish' THEN 1 ELSE 0 END) as bearish,
            SUM(CASE WHEN sentiment='neutral' THEN 1 ELSE 0 END) as neutral,
            COUNT(*) as total
          FROM analysis WHERE mentionedStocks LIKE ?
        `).get(`%${s.ticker}%`)

        if (existing) {
          db.prepare('UPDATE stocks SET name=?, mentionCount=?, sentimentBullish=?, sentimentBearish=?, sentimentNeutral=? WHERE id=?').run(
            s.name, agg.total, agg.bullish, agg.bearish, agg.neutral, existing.id
          )
        } else {
          db.prepare('INSERT INTO stocks (ticker, name, mentionCount, sentimentBullish, sentimentBearish, sentimentNeutral) VALUES (?, ?, ?, ?, ?, ?)').run(
            s.ticker, s.name, agg.total, agg.bullish, agg.bearish, agg.neutral
          )
        }
      }

      processed++
    } catch (err) {
      console.error(`Analyze tweet ${tweet.id} failed:`, err.message)
      db.prepare("UPDATE tweets SET status = 'error' WHERE id = ?").run(tweet.id)
    }
  }

  res.json({ processed })
})

const PORT = 3001
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
