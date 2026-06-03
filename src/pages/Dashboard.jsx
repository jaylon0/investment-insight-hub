import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ReactECharts from 'echarts-for-react'
import TweetCard from '../components/TweetCard'
import { getDashboard } from '../utils/api'
import './Dashboard.css'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboard().then(setData).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading">加载中...</div>
  if (!data) return <div className="empty">暂无数据</div>

  const { sentiment, hotStocks, latestTweets } = data
  const total = sentiment.bullish + sentiment.bearish + sentiment.neutral
  const pct = (v) => total > 0 ? Math.round(v / total * 100) : 0

  const sentimentOption = {
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      data: [
        { value: sentiment.bullish, name: '看多', itemStyle: { color: '#4caf50' } },
        { value: sentiment.bearish, name: '看空', itemStyle: { color: '#f44336' } },
        { value: sentiment.neutral, name: '中性', itemStyle: { color: '#ff9800' } }
      ],
      label: { formatter: '{b}: {d}%' }
    }]
  }

  return (
    <div className="dashboard">
      <div className="dashboard-grid">
        <div className="card">
          <div className="section-title">今日市场情绪</div>
          <div className="sentiment-bar">
            <div className="sentiment-item">
              <div className="sentiment-value bullish">{pct(sentiment.bullish)}%</div>
              <div className="sentiment-label">看多</div>
            </div>
            <div className="sentiment-item">
              <div className="sentiment-value neutral">{pct(sentiment.neutral)}%</div>
              <div className="sentiment-label">中性</div>
            </div>
            <div className="sentiment-item">
              <div className="sentiment-value bearish">{pct(sentiment.bearish)}%</div>
              <div className="sentiment-label">看空</div>
            </div>
          </div>
          <div className="sentiment-visual">
            <div className="bar-bullish" style={{ width: `${pct(sentiment.bullish)}%` }} />
            <div className="bar-neutral" style={{ width: `${pct(sentiment.neutral)}%` }} />
            <div className="bar-bearish" style={{ width: `${pct(sentiment.bearish)}%` }} />
          </div>
          {total > 0 && <ReactECharts option={sentimentOption} style={{ height: 200 }} />}
        </div>

        <div className="card">
          <div className="section-title">热门提及股票</div>
          {hotStocks.length === 0 ? (
            <div className="empty">暂无数据</div>
          ) : (
            <div className="stock-list">
              {hotStocks.map(s => (
                <Link key={s.ticker} to={`/stocks/${s.ticker}`} className="stock-item">
                  <div className="stock-ticker">{s.ticker}</div>
                  <div className="stock-info">
                    <span className="stock-mentions">{s.mentionCount}次提及</span>
                    <span className={`badge ${s.sentimentDistribution?.bullish > s.sentimentDistribution?.bearish ? 'badge-bullish' : 'badge-bearish'}`}>
                      {s.sentimentDistribution?.bullish > s.sentimentDistribution?.bearish ? '看多' : '看空'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="section-title">最新动态</div>
        {latestTweets.length === 0 ? (
          <div className="empty">暂无推文数据</div>
        ) : (
          latestTweets.map(t => <TweetCard key={t._id} tweet={t} />)
        )}
      </div>
    </div>
  )
}
