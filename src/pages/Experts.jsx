import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getInfluencers } from '../utils/api'
import './Experts.css'

const categories = [
  { key: 'all', label: '全部' },
  { key: 'macro', label: '宏观' },
  { key: 'stock', label: '选股' },
  { key: 'quant', label: '量化' },
  { key: 'tech', label: '技术' },
  { key: 'fund', label: '基金' },
  { key: 'techstock', label: '科技股' }
]

export default function Experts() {
  const [influencers, setInfluencers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')

  useEffect(() => {
    getInfluencers().then(setInfluencers).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading">加载中...</div>

  const filtered = activeCategory === 'all' ? influencers : influencers.filter(i => i.category === activeCategory)

  return (
    <div className="experts">
      <div className="filter-bar">
        {categories.map(c => (
          <button
            key={c.key}
            className={`filter-item ${activeCategory === c.key ? 'active' : ''}`}
            onClick={() => setActiveCategory(c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="expert-list">
        {filtered.map(i => (
          <Link key={i._id} to={`/experts/${i._id}`} className="expert-card">
            <div className="expert-avatar">{i.displayName[0]}</div>
            <div className="expert-info">
              <div className="expert-name">{i.displayName}</div>
              <div className="expert-handle">@{i.handle}</div>
              <div className="expert-bio">{i.bio}</div>
            </div>
            <div className="expert-arrow">→</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
