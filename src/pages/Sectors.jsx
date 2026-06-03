import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ReactECharts from 'echarts-for-react'
import { getInsights, getStocks } from '../utils/api'
import './Sectors.css'

const sectorMap = {
  '科技': ['AAPL', 'MSFT', 'NVDA', 'PLTR', 'AMZN', 'META', 'GOOGL'],
  '半导体': ['NVDA', 'TSM', 'ASML', 'AVGO', 'AMD', 'INTC'],
  '电动车/新能源': ['TSLA', 'NIO', 'XPEV', 'LI'],
  '金融': ['JPM', 'BAC', 'GS', 'MS', 'V', 'MA'],
  'ETF/指数': ['SPY', 'QQQ', 'VXUS', 'IWM', 'DIA'],
  '消费': ['AMZN', 'COST', 'WMT', 'TGT', 'HD'],
  '医疗': ['JNJ', 'UNH', 'PFE', 'ABBV', 'MRK'],
  'AI/云计算': ['MSFT', 'GOOGL', 'AMZN', 'CRM', 'SNOW']
}

export default function Sectors() {
  const [data, setData] = useState(null)
  const [stocks, setStocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeSector, setActiveSector] = useState('科技')

  useEffect(() => {
    Promise.all([getInsights(), getStocks()])
      .then(([insights, stockData]) => {
        setData(insights)
        setStocks(stockData)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading">加载中...</div>
  if (!data) return <div className="empty">暂无数据</div>

  // Calculate sector stats
  const sectorStats = Object.entries(sectorMap).map(([sector, tickers]) => {
    const sectorStocks = stocks.filter(s => tickers.includes(s.ticker))
    const totalMentions = sectorStocks.reduce((sum, s) => sum + s.mentionCount, 0)
    const totalBullish = sectorStocks.reduce((sum, s) => sum + s.sentimentBullish, 0)
    const totalBearish = sectorStocks.reduce((sum, s) => sum + s.sentimentBearish, 0)
    const totalNeutral = sectorStocks.reduce((sum, s) => sum + s.sentimentNeutral, 0)
    const sentimentScore = totalMentions > 0 ? (totalBullish - totalBearish) / totalMentions : 0

    return {
      sector,
      tickers,
      stocks: sectorStocks,
      totalMentions,
      totalBullish,
      totalBearish,
      totalNeutral,
      sentimentScore
    }
  }).sort((a, b) => b.totalMentions - a.totalMentions)

  const activeSectorData = sectorStats.find(s => s.sector === activeSector)

  // Chart options
  const sectorChartOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: sectorStats.map(s => s.sector), axisLabel: { rotate: 30 } },
    yAxis: { type: 'value', name: '提及次数' },
    series: [
      {
        name: '看多',
        type: 'bar',
        stack: 'total',
        data: sectorStats.map(s => s.totalBullish),
        itemStyle: { color: '#4caf50' }
      },
      {
        name: '看空',
        type: 'bar',
        stack: 'total',
        data: sectorStats.map(s => s.totalBearish),
        itemStyle: { color: '#f44336' }
      },
      {
        name: '中性',
        type: 'bar',
        stack: 'total',
        data: sectorStats.map(s => s.totalNeutral),
        itemStyle: { color: '#ff9800' }
      }
    ]
  }

  const sentimentGaugeOption = {
    series: [{
      type: 'gauge',
      startAngle: 180,
      endAngle: 0,
      min: -1,
      max: 1,
      splitNumber: 8,
      axisLine: {
        lineStyle: {
          width: 30,
          color: [
            [0.3, '#f44336'],
            [0.7, '#ff9800'],
            [1, '#4caf50']
          ]
        }
      },
      pointer: { itemStyle: { color: 'auto' } },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      detail: {
        valueAnimation: true,
        formatter: function (value) {
          if (value > 0.3) return '看多'
          if (value < -0.3) return '看空'
          return '中性'
        },
        color: '#333',
        fontSize: 20,
        offsetCenter: [0, '70%']
      },
      data: [{ value: activeSectorData?.sentimentScore || 0 }]
    }]
  }

  return (
    <div className="sectors">
      <div className="sectors-header">
        <h2>板块分析</h2>
        <p>按行业板块分析投资情绪和热度</p>
      </div>

      <div className="sectors-grid">
        <div className="card">
          <div className="section-title">板块情绪分布</div>
          <ReactECharts option={sectorChartOption} style={{ height: 300 }} />
        </div>

        <div className="card">
          <div className="section-title">板块选择</div>
          <div className="sector-tabs">
            {sectorStats.map(s => (
              <button
                key={s.sector}
                className={`sector-tab ${activeSector === s.sector ? 'active' : ''}`}
                onClick={() => setActiveSector(s.sector)}
              >
                {s.sector}
                <span className="sector-count">{s.totalMentions}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeSectorData && (
        <div className="sectors-detail">
          <div className="sectors-detail-grid">
            <div className="card">
              <div className="section-title">{activeSector} - 情绪指标</div>
              <ReactECharts option={sentimentGaugeOption} style={{ height: 200 }} />
              <div className="sentiment-stats">
                <div className="sentiment-stat bullish">
                  <div className="stat-num">{activeSectorData.totalBullish}</div>
                  <div className="stat-label">看多</div>
                </div>
                <div className="sentiment-stat bearish">
                  <div className="stat-num">{activeSectorData.totalBearish}</div>
                  <div className="stat-label">看空</div>
                </div>
                <div className="sentiment-stat neutral">
                  <div className="stat-num">{activeSectorData.totalNeutral}</div>
                  <div className="stat-label">中性</div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="section-title">{activeSector} - 相关股票</div>
              <div className="sector-stocks">
                {activeSectorData.stocks.length > 0 ? (
                  activeSectorData.stocks.map(s => (
                    <Link key={s.ticker} to={`/stocks/${s.ticker}`} className="sector-stock-item">
                      <div className="stock-info">
                        <div className="stock-ticker">{s.ticker}</div>
                        <div className="stock-name">{s.name}</div>
                      </div>
                      <div className="stock-stats">
                        <div className="stock-mentions">{s.mentionCount}次</div>
                        <div className={`stock-sentiment ${s.sentimentBullish > s.sentimentBearish ? 'bullish' : 'bearish'}`}>
                          {s.sentimentBullish > s.sentimentBearish ? '看多' : '看空'}
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="empty">该板块暂无相关股票数据</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
