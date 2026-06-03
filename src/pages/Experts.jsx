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

const categoryEmoji = {
  macro: '🌍',
  stock: '📈',
  quant: '🔢',
  tech: '📊',
  fund: '💰',
  techstock: '💻'
}

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
      <div className="experts-header">
        <h2>投资大V</h2>
        <p>跟踪 {influencers.length} 位专业投资人的观点</p>
      </div>

      <div className="filter-bar">
        {categories.map(c => (
          <button
            key={c.key}
            className={`filter-item ${activeCategory === c.key ? 'active' : ''}`}
            onClick={() => setActiveCategory(c.key)}
          >
            {c.key !== 'all' && <span className="filter-emoji">{categoryEmoji[c.key]}</span>}
            {c.label}
          </button>
        ))}
      </div>

      <div className="expert-grid">
        {filtered.map(i => (
          <Link key={i.id} to={`/experts/${i.id}`} className="expert-card">
            <div className="expert-avatar">
              <span>{i.displayName[0]}</span>
            </div>
            <div className="expert-info">
              <div className="expert-name">{i.displayName}</div>
              <div className="expert-handle">@{i.handle}</div>
              <div className="expert-bio">{i.bio}</div>
              <div className="expert-meta">
                <span className="expert-followers">{(i.followers / 1000).toFixed(0)}K 粉丝</span>
                <span className="expert-category">{categoryEmoji[i.category]} {categories.find(c => c.key === i.category)?.label}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
