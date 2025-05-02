# DineVote

**Demo**: [https://dine-vote.firebaseapp.com/](https://dine-vote.firebaseapp.com/)

**簡介**：一款協助群組決定用餐地點的多人連線投票應用程式，提供直覺的使用者介面與即時同步投票功能，提升決策效率與互動體驗。

DineVote 是一個幫助群組決定用餐地點的投票應用程式。使用 Vue 3 + Vite 開發，提供直覺的使用者介面和即時投票功能。

## 功能特點

- 🍽️ 創建投票房間
- 👥 即時多人投票
- 📍 地點搜尋與定位
- 🔒 匿名投票選項
- ⏰ 自訂投票截止時間
- 📱 響應式設計，支援各種裝置

## 技術棧

- 前端：Vue 3 + Vite
- 後端：Node.js + Express.js
- 資料庫：Firebase Realtime Database
- AI 整合：Google Gemini API
- 樣式：Tailwind CSS
- 路由：Vue Router
- 狀態管理：Pinia

## 開發環境設定

1. 安裝依賴：

```bash
npm install
```

2. 啟動開發伺服器：

```bash
npm run dev
```

3. 建置生產版本：

```bash
npm run build
```

## 專案結構

```
src/
├── components/     # 可重用元件
├── views/         # 頁面元件
├── composables/   # 組合式函數
├── router/        # 路由設定
├── stores/        # Pinia 狀態管理
└── assets/        # 靜態資源
```
