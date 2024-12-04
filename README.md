# YouTube字幕自動生成アプリ

YouTubeの動画に自動で字幕を付けるWebアプリケーションです。OpenAI Whisperを使用して音声認識を行い、FFmpegで字幕を動画に埋め込みます。

## 機能

- YouTubeの動画URLから自動で字幕を生成
- 複数の言語に対応（自動言語検出）
- 英語への翻訳機能（OpenAI Whisperの内蔵翻訳機能を使用）
- 字幕付き動画のダウンロード

## 翻訳について

現在の翻訳機能は以下の仕様となっています：
- 入力：任意の言語（日本語、中国語、韓国語など - 自動検出）
- 出力：英語のみ
- 使用技術：OpenAI Whisperの内蔵翻訳機能

できること：
- 日本語の動画 → 英語字幕
- 中国語の動画 → 英語字幕
- フランス語の動画 → 英語字幕
など

できないこと：
- 英語の動画 → 日本語字幕
- 英語の動画 → 中国語字幕
- 日本語の動画 → 中国語字幕
など

※他の言語への翻訳機能（例：英語→日本語、日本語→中国語など）の追加は今後の課題となっています。

## 必要条件

- Python 3.8以上
- FFmpeg
- Node.js 16以上（フロントエンド用）

## インストール

### バックエンド

```bash
cd backend
pip install -r requirements.txt
```

### フロントエンド

```bash
cd frontend
npm install
```

## 使い方

### バックエンドの起動

```bash
cd backend
python run.py
```

### フロントエンドの起動

```bash
cd frontend
npm run dev
```

その後、ブラウザで http://localhost:3000 にアクセスしてください。

## プロジェクト構成

### バックエンド (backend/)

```
backend/
├── app/
│   ├── main.py           # FastAPIアプリケーションのメインファイル
│   ├── video_service.py  # 動画処理サービス（ダウンロード、字幕付与）
│   ├── whisper_service.py # 音声認識サービス
│   └── exceptions.py     # カスタム例外クラス
├── requirements.txt      # Pythonパッケージの依存関係
└── run.py               # アプリケーション起動スクリプト
```

### フロントエンド (src/)

```
src/
├── app/
│   ├── globals.css      # グローバルスタイル
│   └── page.tsx         # メインページコンポーネント
├── components/
│   ├── ui/             # 基本UIコンポーネント
│   ├── ProcessingStatus.tsx  # 処理状態表示
│   ├── TranscriptionResult.tsx # 文字起こし結果表示
│   └── ErrorMessage.tsx      # エラーメッセージ表示
└── lib/
    ├── api.ts          # バックエンドAPI通信
    ├── utils.ts        # ユーティリィ関数
    └── youtube.ts      # YouTube関連の処理
```

## コンポーネントの詳細

### バックエンドコンポーネント

#### main.py
- FastAPIアプリケーションのエントリーポイント
- APIエンドポイントの定義
- WebSocket接続の管理
- CORSの設定
- エラーハンドリング

#### video_service.py
- YouTube動画のダウンロード処理
- FFmpegを使用した字幕の埋め込み
- 一時ファイルの管理
- SRTフォーマットの字幕生成

#### whisper_service.py
- OpenAI Whisperモデルの管理
- 音声認識処理
- 言語の自動検出
- 英語への翻訳機能（Whisper内蔵）
- 進捗状況の通知

### フロントエンドコンポーネント

#### page.tsx
- メインページのレイアウト
- フォーム処理
- 状態管理
- エラーハンドリング

#### ProcessingStatus.tsx
- WebSocket接続による進捗表示
- 処理段階の表示
- プログレスバーの制御

#### TranscriptionResult.tsx
- 文字起こし結果の表示
- 字幕のプレビュー
- ダウンロードボタンの制御

## 設定ファイル

### バックエンド設定

#### requirements.txt
```
fastapi==0.104.1      # WebフレームワークとAPI
uvicorn==0.24.0       # ASGIサーバー
yt-dlp==2023.11.16    # YouTube動画ダウンロード
openai-whisper==20231117  # 音声認識
ffmpeg-python==0.2.0  # 動画処理
```

#### pyrightconfig.json
- Python言語サーバーの設定
- 型チェックの設定
- 仮想環境の指定

### フロントエンド設定

#### package.json
- 依存パッケージの管理
- スクリプトコマンドの定義
- プロジェクト設定

#### tsconfig.json
- TypeScriptのコンパイル設定
- パスエイリアスの設定
- 型チェックの設定

## デプロイメント手順

### バックエンドのデプロイ

1. サーバー要件
```
- Python 3.8以上
- FFmpeg
- 2GB以上のRAM（Whisperモデル用）
```

2. プロダクション用の設定
```bash
# 環境変数の設定
export PYTHONPATH=/path/to/app
export PORT=8000

# Gunicornでの起動
pip install gunicorn
gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app
```

3. システムサービスの設定（Ubuntu/Debian）
```ini
# /etc/systemd/system/movietran.service
[Unit]
Description=MovieTran Backend
After=network.target

[Service]
User=www-data
WorkingDirectory=/path/to/backend
Environment="PATH=/path/to/venv/bin"
ExecStart=/path/to/venv/bin/gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app

[Install]
WantedBy=multi-user.target
```

### フロントエンドのデプロイ

1. ビルド
```bash
npm run build
```

2. Vercelへのデプロイ
```bash
# Vercel CLIのインストール
npm i -g vercel

# デプロイ
vercel
```

3. 環境変数の設定
```
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

### Nginx設定例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 主な使用技術

### バックエンド
- FastAPI
- OpenAI Whisper
- yt-dlp
- FFmpeg

### フロントエンド
- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui

## 注意事項

- 著作権に配慮して使用してください
- 長時間の動画は処理に時間がかかる場合があります
- 音声認識の精度は音質や話者の発音によって変わる場合があります

## ライセンス

MITライセンス