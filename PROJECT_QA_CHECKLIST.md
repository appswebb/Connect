# CONNECT — QA checklist

## Static checks
- [ ] Install from the committed lockfile (if present).
- [ ] Run `npx tsc --noEmit`.
- [ ] Run `npm run build`.
- [x] Review GitHub Actions results: build, TypeScript and static export passed on the verified branch commit.\n- [x] Run Chromium smoke test for landing, sign-in and demo entry at 320, 360, 375, 390, 430, 768, 1024, 1280, 1440 and 1920 px.\n- [x] Confirm no horizontal overflow in the tested public/authentication views.\n- [ ] Run authenticated E2E with a dedicated test account and isolated test data.\n- [ ] Validate Mercado Pago and LiveKit against their sandbox credentials.

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
- [x] 320 px  [x] 360 px  [x] 375 px  [x] 390 px  [x] 430 px  [x] 768 px  [x] 1024 px  [x] 1280 px  [x] 1440 px  [x] 1920 px

## Browser smoke test\n- Script: `scripts/smoke-e2e.mjs`.\n- CI installs Chromium and runs the static export locally before merge.\n- The test covers public landing, sign-in, demo entry, hero asset loading and horizontal overflow; it does not claim authenticated CRUD or provider integration coverage.\n\n## Regression guardrails
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
