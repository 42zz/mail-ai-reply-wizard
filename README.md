# Mail AI Reply Wizard

AI を活用してメールの返信作成を支援するウェブアプリケーションです。shadcn/ui と Tailwind CSS を使用したモダンなインターフェースを備えています。

## 技術スタック

このプロジェクトは以下の技術を使用して構築されています:

-   Vite
-   React
-   TypeScript
-   shadcn/ui
-   Tailwind CSS
-   ESLint

## セットアップと実行

### 前提条件

-   Node.js (推奨: [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) を使用)
-   npm または bun

### 手順

1.  **リポジトリをクローン:**
    ```bash
    git clone <YOUR_GIT_URL>
    cd mail-ai-reply-wizard
    ```

2.  **依存関係をインストール:**
    ```bash
    npm install
    # または bun install
    ```

3.  **開発サーバーを起動:**
    ```bash
    npm run dev
    # または bun run dev
    ```
    これにより、開発サーバーが起動し、ブラウザでアプリケーションが表示されます（通常は `http://localhost:5173`）。ファイルの変更は自動的に反映されます。

## 利用可能なスクリプト

-   `npm run dev`: 開発モードで Vite サーバーを起動します。
-   `npm run build`: プロダクション用にアプリケーションをビルドします。
-   `npm run lint`: ESLint を使用してコードの静的解析を実行します。
-   `npm run preview`: ビルドされたプロダクションコードをローカルでプレビューします。
