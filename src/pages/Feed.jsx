import { useState, useEffect } from 'react'
import TweetCard from '../components/TweetCard'
import { getFeed } from '../utils/api'
import './Feed.css'

const filters = [
  { key: 'all', label: '全部', emoji: '📋' },
  { key: 'bullish', label: '看多', emoji: '📈' },
  { key: 'bearish', label: '看空', emoji: '📉' },
  { key: 'macro', label: '宏观', emoji: '🌍' },
  { key: 'stock', label: '选股', emoji: '🎯' },
  { key: 'quant', label: '量化', emoji: '🔢' },
  { key: 'tech', label: '技术', emoji: '📊' },
  { key: 'fund', label: '基金', emoji: '💰' },
  { key: 'techstock', label: '科技股', emoji: '💻' }
]

export default function Feed() {
  const [tweets, setTweets] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTweet, setNewTweet] = useState({ handle: '', content: '', url: '' })
  const [adding, setAdding] = useState(false)

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
      else if (activeFilter !== 'all') params.category = activeFilter
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

  const handleAddTweet = async () => {
    if (!newTweet.content.trim()) return
    setAdding(true)
    try {
      const res = await fetch('/api/tweets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTweet)
      })
      const data = await res.json()
      if (data.success) {
        setNewTweet({ handle: '', content: '', url: '' })
        setShowAddForm(false)
        loadFeed(1)
      }
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="feed">
      <div className="feed-header">
        <div className="feed-header-top">
          <div>
            <h2>信息流</h2>
            <p>浏览所有投资大V的最新观点</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? '取消' : '+ 添加推文'}
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="add-tweet-form card">
          <h3>手动添加推文</h3>
          <p className="form-desc">粘贴推文内容，AI 会自动分析翻译</p>
          <div className="form-group">
            <label>大V Handle（可选）</label>
            <input
              type="text"
              placeholder="例如: jimcramer"
              value={newTweet.handle}
              onChange={e => setNewTweet({ ...newTweet, handle: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>推文内容 *</label>
            <textarea
              placeholder="粘贴推文原文..."
              value={newTweet.content}
              onChange={e => setNewTweet({ ...newTweet, content: e.target.value })}
              rows={4}
            />
          </div>
          <div className="form-group">
            <label>推文链接（可选）</label>
            <input
              type="text"
              placeholder="https://x.com/..."
              value={newTweet.url}
              onChange={e => setNewTweet({ ...newTweet, url: e.target.value })}
            />
          </div>
          <button className="btn btn-primary" onClick={handleAddTweet} disabled={adding || !newTweet.content.trim()}>
            {adding ? '添加中...' : '添加并分析'}
          </button>
        </div>
      )}

      <div className="filter-bar">
        {filters.map(f => (
          <button
            key={f.key}
            className={`filter-item ${activeFilter === f.key ? 'active' : ''}`}
            onClick={() => setActiveFilter(f.key)}
          >
            <span className="filter-emoji">{f.emoji}</span>
            {f.label}
          </button>
        ))}
      </div>

      <div className="feed-list">
        {tweets.map(t => <TweetCard key={t.id} tweet={t} />)}
        {loading && <div className="loading">加载中...</div>}
        {!loading && tweets.length === 0 && <div className="empty">暂无数据</div>}
        {!loading && hasMore && tweets.length > 0 && (
          <button className="btn btn-primary load-more" onClick={loadMore}>加载更多</button>
        )}
      </div>
    </div>
  )
}
