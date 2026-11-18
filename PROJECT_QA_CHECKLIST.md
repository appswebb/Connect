# CONNECT — QA checklist

## Static checks
- [x] Install from the committed lockfile with `npm ci` in GitHub Actions.
- [x] Run `npm run build`; Next.js production build and TypeScript validation pass.
- [x] Run static export verification; `out/index.html` and bundled JavaScript are present.
- [ ] Run a separate `npx tsc --noEmit` command (the production build already validates the app's TypeScript).
- [x] Review GitHub Actions results: production build, dependency audit and static export passed on the verified branch commit.
- [x] Run Chromium smoke tests for landing, sign-in, sign-up, demo entry and download hub.
- [x] Check WCAG 2.2 AA contrast and touch-target rules on public/authentication/download screens.
- [x] Check horizontal overflow at 320, 360, 375, 390, 430, 768, 1024, 1280, 1440 and 1920 px.
- [ ] Run authenticated E2E with a dedicated test account and isolated test data.
- [ ] Validate Mercado Pago and LiveKit against their sandbox credentials.

## Refactored module map
- [x] `useConnectFeed`: feed, likes, comments and post upload.
- [x] `useConnectRooms`: regional room loading, replies and message deletion.
- [x] `useConnectLives`: LiveKit readiness and live session lifecycle.
- [x] `useConnectNotifications`: notification read state, navigation and browser permissions.
- [x] UI modules: landing, authentication gate, rooms, lives, avatar, feed, people, profile, chat, settings, navigation and random-connection queue.

## Functional regression matrix
The components and production build are present; these end-to-end flows still require authenticated test accounts and provider sandbox credentials.
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
- [x] 320 px  [x] 360 px  [x] 375 px  [x] 390 px  [x] 430 px
- [x] 768 px  [x] 1024 px  [x] 1280 px  [x] 1440 px  [x] 1920 px

## Browser smoke test
- Script: `scripts/smoke-e2e.mjs`.
- CI builds the static export, installs Chromium and tests the public routes locally.
- Coverage includes landing, sign-in, sign-up, demo entry, download hub, WCAG 2.2 AA accessibility and horizontal overflow across the listed viewport widths.
- The test does not claim authenticated CRUD, payment-provider or LiveKit integration coverage.

## Regression guardrails
- [x] No database tables, columns or API contracts were removed or renamed.
- [x] No secrets were added to frontend code or committed files.
- [x] No fake data was introduced to replace Supabase-backed data.
- [ ] Re-run authenticated CRUD and RLS tests with two isolated accounts.
- [ ] Check console, network failures, focus, reduced motion and dark theme in authenticated modules.

## Security boundary
- Three RLS/function migrations were applied and versioned separately to correct live-battle host authorization and consolidate policies.
- No table/schema shape or external API contract was changed.
- See `PROJECT_SECURITY_AUDIT.md` and `PROJECT_MIGRATION_AUDIT.md` for verified database findings and the remaining migration-history reconciliation work.

## Environment limitations
Build, browser and live integration tests require a repository checkout and configured environment variables. Never report unrun checks as passing.
