import { useState, useEffect } from 'react'
import TweetCard from '../components/TweetCard'
import { getFeed } from '../utils/api'
import './Feed.css'

const filters = [
  { key: 'all', label: '全部' },
  { key: 'bullish', label: '看多' },
  { key: 'bearish', label: '看空' },
  { key: 'macro', label: '宏观' },
  { key: 'techstock', label: '科技股' }
]

export default function Feed() {
  const [tweets, setTweets] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    setPage(1)
    setTweets([])
    loadFeed(1)
  }, [activeFilter])

  const loadFeed = async (p) => {
    setLoading(true)
    try {
      const params = { page: p, pageSize: 20 }
      if (activeFilter === 'bullish' || activeFilter === 'bearish') params.sentiment = activeFilter
      if (activeFilter === 'macro' || activeFilter === 'techstock') params.category = activeFilter
      const data = await getFeed(params)
      setTweets(p === 1 ? data : [...tweets, ...data])
      setHasMore(data.length >= 20)
    } finally {
      setLoading(false)
    }
  }

  const loadMore = () => {
    const next = page + 1
    setPage(next)
    loadFeed(next)
  }

  return (
    <div className="feed">
      <div className="filter-bar">
        {filters.map(f => (
          <button
            key={f.key}
            className={`filter-item ${activeFilter === f.key ? 'active' : ''}`}
            onClick={() => setActiveFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="feed-list">
        {tweets.map(t => <TweetCard key={t._id} tweet={t} />)}
        {loading && <div className="loading">加载中...</div>}
        {!loading && tweets.length === 0 && <div className="empty">暂无数据</div>}
        {!loading && hasMore && tweets.length > 0 && (
          <button className="btn btn-primary load-more" onClick={loadMore}>加载更多</button>
        )}
      </div>
    </div>
  )
}
