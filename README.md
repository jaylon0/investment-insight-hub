# Investment Insight Hub

投资信息聚合平台 — 打破信息差，汇聚大V投资观点

## 功能特性

- **仪表盘** — 市场情绪图表、热门股票、最新动态
- **信息流** — 卡片式内容展示，支持筛选（看多/看空/宏观/科技股）
- **大V列表** — 20位投资大V，分类浏览
- **股票详情** — 情绪分布饼图、相关推文
- **AI洞察** — 市场总结、关注信号、关系网络图

## 技术栈

- **前端**: React + Vite + ECharts
- **后端**: Express + SQLite
- **AI**: MiMo API (OpenAI 兼容格式)

## 快速开始

```bash
# 安装依赖
npm install

# 启动后端服务器
npm run server

# 启动前端开发服务器
npm run dev
```

访问 http://localhost:3000

## 数据获取

点击页面上的「抓取推文」按钮，AI 会自动搜索指定大V的最新推文内容。

## 项目结构

```
├── src/
│   ├── components/     # 公共组件
│   ├── pages/          # 页面组件
│   ├── utils/          # 工具函数
│   ├── App.jsx         # 主应用
│   └── main.jsx        # 入口
├── server/
│   └── index.js        # Express 后端
└── package.json
```

## 注意事项

- 平台仅用于信息搜集和展示，不做任何投资建议
- 所有内容标注信息来源，用户自行判断
- AI 分析结果仅供参考，不构成投资依据
