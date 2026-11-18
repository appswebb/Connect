# CONNECT — frontend engineering rules

## Current stack
- Next.js 15 App Router, React 19, TypeScript 5.9.
- Supabase JS 2 for auth, database, storage, realtime and Edge Functions.
- LiveKit client for live rooms.
- Lucide React for interface icons.
- Capacitor 7 for Android packaging.

## Component boundaries
- `app/page.tsx` remains the application orchestrator for now; continue reducing its responsibilities in small verified steps.
- Shared domain types: `app/types/connect.ts`.
- Static domain labels and notification categories: `app/lib/connect-data.ts`.
- Pure formatting helpers: `app/lib/connect-utils.ts`.
- Navigation metadata: `app/lib/connect-navigation.ts`.
- Shared presentational UI: `app/components/`.
- Feature data/state orchestration: `app/hooks/` (for example feed, regional rooms, live lifecycle and notifications). Keep hooks focused on one domain and preserve their existing Supabase contracts.
- Keep payment, LiveKit and Supabase service contracts stable during UI refactors.

## React quality
- Keep hooks unconditional and preserve hook ordering.
- Avoid defining reusable components inside large page components.
- Parallelize independent async work with `Promise.all`.
- Use stable keys and clean up subscriptions, media tracks, timers and event listeners.
- Prefer semantic controls and explicit button types.
- Avoid new dependencies unless the current stack cannot meet the requirement.
