# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server on port 8080
npm run build        # Production build (vite build)
npm run build:dev    # Development build
npm run lint         # ESLint with auto-fix
npm run preview      # Preview production build
npm run supabase     # Deploy Supabase edge functions
```

## Architecture

**Calculadora Inteligente de Trade Binario** - A binary options trade calculator with Martingale strategy, built with React + TypeScript + Vite + Supabase.

### Tech Stack
- **Frontend**: React 18, TypeScript, Vite (SWC), Tailwind CSS, shadcn/ui (Radix primitives)
- **Backend**: Supabase (auth, Postgres, edge functions)
- **Payments**: Stripe (checkout sessions + webhooks via Supabase edge functions)
- **State**: React Context + localStorage persistence via `useLocalStorageState` hook

### Path Alias
`@/` maps to `./src/` (configured in vite.config.ts and tsconfig.json)

### Key Contexts (provider hierarchy in App.tsx)
1. `AuthProvider` - Supabase auth session management
2. `SubscriptionProvider` - Stripe subscription status (active/trialing)
3. `ConfigProvider` - User trade config fetched from `user_configs` table

### Core Business Logic (`src/pages/Index.tsx`)
The main trade calculator lives in the `TradeSession` component. It manages:
- **Martingale calculation**: on loss, next entry = (currentEntry + desiredProfit) / (payout/100)
- **Conservative loss**: resets entry to initial value instead of Martingale
- **Daily goal / Stop loss**: auto-saves session and updates bankroll when limits hit
- **Dual mode**: "real" vs "training" sessions, isolated by localStorage keys (`session:real:*` / `session:training:*`)
- **Session persistence**: operations saved to localStorage, synced to Supabase on session end

### Supabase Tables
- `user_configs` - payout, initial_bankroll, entry, daily_goal, stop_loss (JSONB for ConfigValue types)
- `historico_operacoes` - daily session history (with RLS per user)
- `operacoes_individuais` - individual trade operations linked to sessions via `historico_id`
- `transacoes_banca` - deposit/withdrawal transactions
- `subscriptions` - Stripe subscription status

### Edge Functions (Deno)
- `create-checkout-session` - Creates Stripe checkout session
- `stripe-webhook` - Handles Stripe webhook events

### Routes
- `/` - Landing page (public)
- `/auth` - Login/register
- `/app` - Main calculator (protected)
- `/settings` - User settings (protected)
- `/historico` - Daily session history (protected)
- `/historico-banca` - Bank transaction history (protected)

### Environment Variables
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` - Supabase client config

### Language
The application UI and code comments are in Brazilian Portuguese. Keep this convention.
