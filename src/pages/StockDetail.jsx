import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import ReactECharts from 'echarts-for-react'
import TweetCard from '../components/TweetCard'
import { getStockDetail } from '../utils/api'
import './StockDetail.css'

export default function StockDetail() {
  const { ticker } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getStockDetail(ticker).then(setData).finally(() => setLoading(false))
  }, [ticker])

  if (loading) return <div className="loading">加载中...</div>
  if (!data) return <div className="empty">未找到</div>

  const { sentimentDistribution } = data
  const chartOption = {
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      data: [
        { value: sentimentDistribution.bullish, name: '看多', itemStyle: { color: '#4caf50' } },
        { value: sentimentDistribution.bearish, name: '看空', itemStyle: { color: '#f44336' } },
        { value: sentimentDistribution.neutral, name: '中性', itemStyle: { color: '#ff9800' } }
      ],
      label: { formatter: '{b}: {c}次' }
    }]
  }

  return (
    <div className="stock-detail">
      <div className="stock-header">
        <div className="stock-ticker">{data.ticker}</div>
        <div className="stock-name">{data.name}</div>
        <div className="stock-stats">
          <div className="stat">
            <div className="stat-value">{data.mentionCount}</div>
            <div className="stat-label">提及次数</div>
          </div>
          {data.avgTargetPrice && (
            <div className="stat">
              <div className="stat-value">${data.avgTargetPrice}</div>
              <div className="stat-label">平均目标价</div>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="section-title">大V观点分布</div>
        <div className="sentiment-summary">
          <div className="sentiment-item"><span className="dot bullish" /> 看多 {sentimentDistribution.bullish}次</div>
          <div className="sentiment-item"><span className="dot bearish" /> 看空 {sentimentDistribution.bearish}次</div>
          <div className="sentiment-item"><span className="dot neutral" /> 中性 {sentimentDistribution.neutral}次</div>
        </div>
        <ReactECharts option={chartOption} style={{ height: 250 }} />
      </div>

      <div className="card">
        <div className="section-title">相关推文</div>
        {data.tweets?.length === 0 ? (
          <div className="empty">暂无相关推文</div>
        ) : (
          data.tweets?.map(t => <TweetCard key={t._id} tweet={t} />)
        )}
      </div>
    </div>
  )
}
