import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getStocks } from '../utils/api'
import './Stocks.css'

export default function Stocks() {
  const [stocks, setStocks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getStocks().then(setStocks).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading">加载中...</div>

  return (
    <div className="stocks">
      <div className="stock-list">
        {stocks.length === 0 ? (
          <div className="empty">暂无股票数据</div>
        ) : (
          stocks.map(s => (
            <Link key={s.ticker} to={`/stocks/${s.ticker}`} className="stock-card">
              <div className="stock-left">
                <div className="stock-ticker">{s.ticker}</div>
                <div className="stock-name">{s.name}</div>
              </div>
              <div className="stock-right">
                <div className="stock-mentions">{s.mentionCount}次提及</div>
                <span className={`badge ${s.sentimentDistribution?.bullish > s.sentimentDistribution?.bearish ? 'badge-bullish' : 'badge-bearish'}`}>
                  {s.sentimentDistribution?.bullish > s.sentimentDistribution?.bearish ? '看多' : '看空'}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
