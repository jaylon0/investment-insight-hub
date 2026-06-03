import { sentimentText, sentimentClass, timeAgo } from '../utils/format'
import './TweetCard.css'

export default function TweetCard({ tweet }) {
  const { influencer, analysis } = tweet

  return (
    <div className="tweet-card">
      <div className="tweet-header">
        <div className="avatar">{influencer?.displayName?.[0] || '?'}</div>
        <div className="user-info">
          <div className="display-name">{influencer?.displayName || 'Unknown'}</div>
          <div className="handle">@{influencer?.handle} · {timeAgo(tweet.crawledAt)}</div>
        </div>
        {analysis && (
          <span className={`badge ${sentimentClass(analysis.sentiment)}`}>
            {sentimentText(analysis.sentiment)}
          </span>
        )}
      </div>

      {analysis?.summary && (
        <div className="tweet-summary">{analysis.summary}</div>
      )}

      <div className="tweet-content">
        {tweet.contentZh || tweet.content}
      </div>

      {analysis?.keyInsights?.length > 0 && (
        <div className="tweet-insights">
          {analysis.keyInsights.map((insight, i) => (
            <span key={i} className="insight-tag">💡 {insight}</span>
          ))}
        </div>
      )}

      {analysis?.mentionedStocks?.length > 0 && (
        <div className="tweet-tags">
          {analysis.mentionedStocks.map(s => (
            <a key={s.ticker} href={`/stocks/${s.ticker}`} className="stock-tag">
              {s.ticker}
              {s.action && <span className="stock-action">{s.action === 'buy' ? '↑' : s.action === 'sell' ? '↓' : '→'}</span>}
              {s.targetPrice && <span className="stock-target">${s.targetPrice}</span>}
            </a>
          ))}
        </div>
      )}

      <div className="tweet-footer">
        {analysis?.riskLevel && (
          <span className={`risk-tag risk-${analysis.riskLevel}`}>
            风险: {analysis.riskLevel === 'low' ? '低' : analysis.riskLevel === 'medium' ? '中' : '高'}
          </span>
        )}
        {analysis?.timeHorizon && (
          <span className="horizon-tag">
            周期: {analysis.timeHorizon === 'short' ? '短期' : analysis.timeHorizon === 'medium' ? '中期' : '长期'}
          </span>
        )}
        {tweet.url && (
          <a href={tweet.url} target="_blank" rel="noopener noreferrer" className="source-link">
            查看原文 →
          </a>
        )}
      </div>
    </div>
  )
}
