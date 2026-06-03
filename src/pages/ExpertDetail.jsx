import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import TweetCard from '../components/TweetCard'
import { getInfluencerDetail } from '../utils/api'
import './ExpertDetail.css'

export default function ExpertDetail() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getInfluencerDetail(id).then(setData).finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="loading">加载中...</div>
  if (!data) return <div className="empty">未找到</div>

  return (
    <div className="expert-detail">
      <div className="profile-card">
        <div className="profile-avatar">{data.displayName[0]}</div>
        <div className="profile-name">{data.displayName}</div>
        <div className="profile-handle">@{data.handle}</div>
        <div className="profile-bio">{data.bio}</div>
        <div className="profile-stats">
          <div className="stat-item">
            <div className="stat-value">{data.totalTweets || 0}</div>
            <div className="stat-label">推文</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{data.followers || 0}</div>
            <div className="stat-label">粉丝</div>
          </div>
        </div>
      </div>

      {data.topStocks?.length > 0 && (
        <div className="card">
          <div className="section-title">常提及股票</div>
          <div className="stock-tags">
            {data.topStocks.map(s => (
              <a key={s.ticker} href={`/stocks/${s.ticker}`} className="stock-tag-item">
                <span className="tag-ticker">{s.ticker}</span>
                <span className="tag-count">{s.count}次</span>
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="section-title">历史推文</div>
        {data.tweets?.length === 0 ? (
          <div className="empty">暂无推文</div>
        ) : (
          data.tweets?.map(t => <TweetCard key={t._id} tweet={{ ...t, influencer: data }} />)
        )}
      </div>
    </div>
  )
}
