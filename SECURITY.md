# Security model

Diet Log is designed as a local-only personal PWA.

## Data boundary

- Health, meal, and workout records are stored only in the browser's IndexedDB.
- There is no account, backend API, cloud sync, analytics, telemetry, ad SDK, or remote font/CDN dependency.
- The application does not request camera, microphone, geolocation, contacts, Bluetooth, USB, or similar device permissions.
- On supported browsers the app requests persistent storage to reduce browser eviction risk under storage pressure.
- Clearing browser/site storage still deletes records. Device loss can also result in data loss because backup is intentionally not implemented.

## Network restrictions

Production builds use multiple layers:

1. CSP contains `connect-src 'none'`, blocking page-initiated fetch/XHR/WebSocket/EventSource/beacon connections.
2. `src/lib/networkLockdown.ts` disables the same JavaScript network primitives at runtime in production.
3. `npm run security:scan` fails if runtime source contains an external HTTP(S) URL or a network primitive outside the dedicated lockdown module.
4. Runtime dependencies use no remote CDN/font/analytics resources.

The host should also serve the headers in `public/_headers` where supported. The CSP meta tag remains as a fallback on hosts that cannot configure response headers.

The browser still needs to download static application files when the app is first installed or updated, and the browser may check the Service Worker for updates. After PWA assets are cached, records can be created and viewed offline.

## Dependency / supply-chain controls

- Direct dependency versions in `package.json` are exact, not ranges.
- Commit the generated `package-lock.json` immediately after the first successful `npm install`.
- Use `npm ci` in CI and for reproducible later installs.
- GitHub CI runs typecheck, lint, unit tests, runtime network scanning, production build and Playwright E2E.

## Threat model and limits

This design greatly reduces accidental data egress, but it is not encryption at rest. A compromised browser, compromised operating system, malicious browser extension with sufficient access, physical access to an unlocked device, or a compromised build dependency is outside the app's security boundary.

For a stricter future boundary, the same React UI can be packaged as a native Android app (for example with Capacitor) and shipped without Internet permission. That is the appropriate next step if even browser/Service Worker update traffic is undesirable.
