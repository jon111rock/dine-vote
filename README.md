# DineVote

DineVote 是一個幫助群組決定用餐地點的投票應用程式。使用 Vue 3 + Vite 開發，提供直覺的使用者介面和即時投票功能。

## 功能特點

- 🍽️ 創建投票房間
- 👥 即時多人投票
- 📍 地點搜尋與定位
- 🔒 匿名投票選項
- ⏰ 自訂投票截止時間
- 📱 響應式設計，支援各種裝置

## 技術棧

- Vue 3 - 使用 Composition API 和 `<script setup>`
- Vite - 快速開發和建置
- Tailwind CSS - 現代化 UI 設計
- Firebase - 即時資料庫和身份驗證
- Vue Router - 路由管理
- Pinia - 狀態管理

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

## 開發規範

- 使用 Vue 3 Composition API 和 `<script setup>`
- 元件命名採用 PascalCase
- 使用 Tailwind CSS 進行樣式設計
- 遵循 Git Flow 工作流程
- 提交訊息格式：`type(scope): message`

## 環境變數

建立 `.env` 檔案並設定以下變數：

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## 授權

MIT License
