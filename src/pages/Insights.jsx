import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ReactECharts from 'echarts-for-react'
import { getInsights } from '../utils/api'
import './Insights.css'

export default function Insights() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getInsights().then(setData).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading">加载中...</div>
  if (!data) return <div className="empty">暂无数据</div>

  const { sentiment, hotStocks, network, totalAnalysis } = data
  const total = sentiment.bullish + sentiment.bearish + sentiment.neutral
  const pct = (v) => total > 0 ? Math.round(v / total * 100) : 0

  const networkOption = {
    tooltip: {},
    series: [{
      type: 'graph',
      layout: 'force',
      roam: true,
      label: { show: true },
      categories: [
        { name: '大V' },
        { name: '股票' }
      ],
      data: network.nodes.map(n => ({
        name: n.id,
        category: n.type === 'influencer' ? 0 : 1,
        symbolSize: n.type === 'influencer' ? 30 : 20
      })),
      links: network.links.map(l => ({
        source: l.source,
        target: l.target
      })),
      force: { repulsion: 100 }
    }]
  }

  return (
    <div className="insights">
      <div className="card">
        <div className="section-title">本周市场总结</div>
        <p className="summary-text">
          本周共分析 {totalAnalysis} 条推文。市场情绪整体{pct(sentiment.bullish) > pct(sentiment.bearish) ? '偏多' : '偏空'}，
          看多占比 {pct(sentiment.bullish)}%，看空占比 {pct(sentiment.bearish)}%。
          {hotStocks.length > 0 && ` 热门关注股票为 ${hotStocks[0].ticker}，被提及 ${hotStocks[0].count} 次。`}
        </p>
      </div>

      <div className="card">
        <div className="section-title">关注信号</div>
        <div className="signal-list">
          {hotStocks.filter(s => s.count >= 3).map(s => (
            <Link key={s.ticker} to={`/stocks/${s.ticker}`} className="signal-item">
              <div className="signal-left">
                <div className="signal-ticker">{s.ticker}</div>
                <div className="signal-count">{s.count}位大V提及</div>
              </div>
              <span className={`badge ${s.bullish > s.bearish ? 'badge-bullish' : 'badge-bearish'}`}>
                {s.bullish > s.bearish ? '看多共识' : '看空共识'}
              </span>
            </Link>
          ))}
          {hotStocks.filter(s => s.count >= 3).length === 0 && <div className="empty">暂无关注信号</div>}
        </div>
      </div>

      <div className="insights-grid">
        <div className="card">
          <div className="section-title">热门股票排行</div>
          <div className="ranking-list">
            {hotStocks.map((s, i) => (
              <Link key={s.ticker} to={`/stocks/${s.ticker}`} className="ranking-item">
                <div className="rank-num">{i + 1}</div>
                <div className="rank-ticker">{s.ticker}</div>
                <div className="rank-bar">
                  <div className="bar-fill" style={{ width: `${s.count / hotStocks[0].count * 100}%` }} />
                </div>
                <div className="rank-count">{s.count}次</div>
              </Link>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="section-title">关系网络</div>
          {network.nodes.length > 0 ? (
            <ReactECharts option={networkOption} style={{ height: 300 }} />
          ) : (
            <div className="empty">暂无数据</div>
          )}
        </div>
      </div>
    </div>
  )
}
