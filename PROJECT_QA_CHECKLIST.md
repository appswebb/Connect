# CONNECT — QA checklist

## Static checks
- [ ] Install from the committed lockfile (if present).
- [ ] Run `npx tsc --noEmit`.
- [ ] Run `npm run build`.
- [ ] Review GitHub Actions results.

## Refactored module map
- [ ] `useConnectFeed`: feed, likes, comments and post upload.
- [ ] `useConnectRooms`: regional room loading, replies and message deletion.
- [ ] `useConnectLives`: LiveKit readiness and live session lifecycle.
- [ ] `useConnectNotifications`: notification read state, navigation and browser permissions.
- [ ] UI modules: landing, authentication gate, rooms, lives and avatar.

## Functional regression matrix
- [ ] Public landing, signup, signin, password recovery and demo entry.
- [ ] Authenticated shell, desktop navigation, mobile navigation and theme.
- [ ] Feed, media upload, likes and comments.
- [ ] People search, profiles, follow/block/report.
- [ ] Random connection queue, match acceptance and chat.
- [ ] Direct message requests, attachments, voice recording and archive.
- [ ] State rooms, replies and message deletion.
- [ ] Live list, create/join/end, camera, microphone and screen sharing.
- [ ] Plans, subscription gifts, Pix checkout, card checkout and webhook status.
- [ ] Notifications, browser permission and deep navigation.
- [ ] Profile editing, location, privacy, password reset and account deletion.
- [ ] PWA install, service-worker update and Android packaging.

## Viewports
- [ ] 320 px  [ ] 375 px  [ ] 768 px  [ ] 1024 px  [ ] 1440 px

## Regression guardrails
- [ ] No schema, RLS, API contract or secret changes in a visual refactor.
- [ ] No fake data replacing Supabase-backed data.
- [ ] No visible action without a real handler.
- [ ] Check console, network failures, focus, reduced motion and dark theme.

## Skills discovered and applied
- Vercel React Best Practices: component boundaries, hook ordering, waterfall avoidance and render performance.
- Supabase skill: preserve auth/RLS/API security boundaries; no database changes in this refactor.
- Vercel Verification: require evidence across browser → API → data → UI before declaring a flow working.

## Environment limitations
Build, browser and live integration tests require a repository checkout and configured environment variables. Never report unrun checks as passing.
