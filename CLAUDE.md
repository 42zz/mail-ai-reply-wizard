# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

- **Development**: `npm run dev` - Starts Vite dev server on port 8080
- **Build**: `npm run build` - Production build 
- **Build (dev mode)**: `npm run build:dev` - Development build with dev mode
- **Lint**: `npm run lint` - Run ESLint for code quality checks
- **Preview**: `npm run preview` - Preview production build locally

## High-Level Architecture

This is a React-based email reply assistant web application that uses AI to generate professional Japanese business email responses.

### Core Application Flow
1. **Entry Point**: `src/main.tsx` → `src/App.tsx` - Sets up React Router, providers, and global UI components
2. **Main Page**: `src/pages/Index.tsx` - Primary interface with form/result columns
3. **Settings Management**: Global state via `src/contexts/SettingsContext.tsx` with localStorage persistence
4. **Email Generation**: `src/hooks/useEmailGeneration.ts` → `src/lib/emailGeneration.ts` - AI API integration

### Key Components Structure
- **Form Input**: `EmailReplyForm` - Collects date, sender, message, signature, and response outline
- **Result Display**: `EmailReplyResult` - Shows generated subject/content with history functionality
- **Settings**: `SettingsSheet` - Manages API keys, models, system prompts, signature templates, and style examples
- **UI Library**: shadcn/ui components in `src/components/ui/` with Tailwind CSS styling

### Data Flow & State Management
- **Settings Context**: Centralized state for API keys, model selection, system prompts, signature templates, and style examples
- **Local Storage**: Persists all settings, email generation history (max 5 items), and user preferences
- **AI Integration**: OpenAI API calls with XML-formatted prompts and JSON responses
- **History System**: Auto-saves all generation attempts with request/response pairs

### Key Technical Details
- **AI Provider**: Currently OpenAI API only (Claude API commented out due to CORS)
- **Internationalization**: Primarily Japanese UI with business email focus
- **Error Handling**: Comprehensive error states for API failures, missing keys, rate limits
- **Form Validation**: React Hook Form with Zod schemas
- **Styling**: Tailwind CSS with shadcn/ui design system
- **Build Tool**: Vite with React SWC plugin and TypeScript

### File Path Aliases
- `@/` maps to `src/` directory for clean imports

## 🔨 最重要ルール - 新しいルールの追加プロセス

ユーザーから今回限りではなく常に対応が必要だと思われる指示を受けた場合：

1. 「これを標準のルールにしますか？」と質問する
2. YESの回答を得た場合、CLAUDE.mdに追加ルールとして記載する
3. 以降は標準ルールとして常に適用する

このプロセスにより、プロジェクトのルールを継続的に改善していきます。
```

その後、チャット中に指示をした時に「常に◯◯して」とか「これをルールに記載して」と頼めばどんどんあなた専用にカスタマイズされていくので超はかどります