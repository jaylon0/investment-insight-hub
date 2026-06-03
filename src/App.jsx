import { Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Feed from './pages/Feed'
import Experts from './pages/Experts'
import Stocks from './pages/Stocks'
import Insights from './pages/Insights'
import './App.css'

function App() {
  return (
    <div className="app">
      <header className="header">
        <div className="container header-inner">
          <h1 className="logo">Investment Insight Hub</h1>
          <nav className="nav">
            <NavLink to="/" end>仪表盘</NavLink>
            <NavLink to="/feed">信息流</NavLink>
            <NavLink to="/experts">大V</NavLink>
            <NavLink to="/stocks">股票</NavLink>
            <NavLink to="/insights">AI洞察</NavLink>
          </nav>
        </div>
      </header>
      <main className="main">
        <div className="container">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/experts" element={<Experts />} />
            <Route path="/stocks" element={<Stocks />} />
            <Route path="/insights" element={<Insights />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

export default App
