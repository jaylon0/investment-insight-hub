import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000
})

export const getDashboard = () => api.get('/dashboard').then(r => r.data)
export const getFeed = (params) => api.get('/feed', { params }).then(r => r.data)
export const getInfluencers = () => api.get('/influencers').then(r => r.data)
export const getInfluencerDetail = (id) => api.get(`/influencers/${id}`).then(r => r.data)
export const getStocks = () => api.get('/stocks').then(r => r.data)
export const getStockDetail = (ticker) => api.get(`/stocks/${ticker}`).then(r => r.data)
export const getInsights = () => api.get('/insights').then(r => r.data)
export const crawlTweets = (batch) => api.post('/crawl', { batch }).then(r => r.data)
export const analyzeTweets = () => api.post('/analyze').then(r => r.data)

export default api
