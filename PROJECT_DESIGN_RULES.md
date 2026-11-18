# CONNECT — Design rules

## Product direction
CONNECT is a social connection product for discovery, conversations and communities. The interface should feel welcoming, clear, contemporary and trustworthy; social interactions remain the visual priority.

## Design-system source of truth
- The application-wide visual foundation is `app/styles/connect-mobile-app.css`, loaded after `app/globals.css` by the root layout.
- Reuse the `--cx-*` tokens before introducing new colors, shadows or radii.
- Use Outfit for display hierarchy and DM Sans for interface text, as already established by the application.
- Keep the desktop shell, mobile bottom navigation and dark theme consistent across modules.
- Images must retain intrinsic proportions or use an explicit aspect ratio and `object-fit`; never stretch avatars or cover imagery.

## Interaction rules
- Every visible action must retain its existing handler and business behavior.
- Preserve keyboard focus, accessible names, semantic buttons, loading/error feedback and reduced-motion support.
- Respect mobile safe-area insets.
- Avoid duplicate controls, repeated profile information and nested interactive elements.

## Refactoring rules
- Extract shared types, constants, pure utilities and presentational components from page-level orchestration.
- Keep Supabase queries and business rules unchanged unless a separately tested defect requires a fix.
- Do not move secret credentials to client code or alter database schemas in a visual refactor.
- Delete old implementations only after replacement imports and references are verified.
