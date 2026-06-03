import { sentimentText, sentimentClass, timeAgo } from '../utils/format'

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

      {analysis?.mentionedStocks?.length > 0 && (
        <div className="tweet-tags">
          {analysis.mentionedStocks.map(s => (
            <a key={s.ticker} href={`/stocks/${s.ticker}`} className="stock-tag">
              {s.ticker}
            </a>
          ))}
        </div>
      )}

      {tweet.url && (
        <div className="tweet-footer">
          <a href={tweet.url} target="_blank" rel="noopener noreferrer">查看原文 →</a>
        </div>
      )}
    </div>
  )
}
