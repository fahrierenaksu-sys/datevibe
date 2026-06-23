# DateVibe Product Readiness Audit

Audit date: June 23, 2026
Branch audited: `codex/motion-v1-female-room-avatar`
Audited HEAD before report: `e4f7acc89f67d5c274606d6ccf2f51529365ed31`

## 1. Executive Summary

DateVibe is a credible internal product demo with a differentiated avatar-first identity, a visually coherent room, a functioning wardrobe/shop loop, and a demonstrable discovery-to-match-to-room story. It is not yet a real consumer beta and is not close to a safe public App Store launch.

The strongest product work is concentrated in MyRoom, Wardrobe, Shop, and the female Motion v1 avatar stack. These surfaces are visually distinctive and have received real native QA. The weakest areas are the product foundations that real users depend on: authentication, server-backed identity, profile persistence, actual matching, durable chat, notifications, moderation, privacy/legal, account deletion, production configuration, analytics, crash reporting, and automated testing.

The central launch risk is not missing visual polish. It is that the default app starts in demo mode and presents local or in-memory behavior as if it were a connected dating product:

- `apps/mobile/package.json` starts Expo with `EXPO_PUBLIC_DATEVIBE_MEDIA_MODE=demo`.
- `apps/mobile/src/features/demo/demoStore.ts` generates matches and chat threads in memory.
- `apps/mobile/src/features/session/sessionApi.ts` creates demo tokens and identities.
- `apps/mobile/src/features/safety/blockStore.ts` queues reports only in memory.
- `apps/mobile/src/features/inventory/inventoryStore.ts` implements a local coin economy with starter currency.
- no backend application exists in this repository; only contracts, domain rules, and a client boundary exist.

**Product verdict:** keep the current branch focused on avatar/room/wardrobe delivery. Do not add growth features, outfit sets, more catalog content, or a 3/4 avatar rig before the P0 trust, backend, identity, and release foundations are built.

## 2. Current Product Status

### Product Surface Map

| Surface | What exists | Reality level | Main risk |
| --- | --- | --- | --- |
| Welcome | Four-step animated value proposition | Demo-ready | No legal/consent/age decision before entry |
| Session bootstrap | Name, optional age, vibe selection | Demo-only identity | Demo token or unauthenticated bootstrap; age is optional |
| Discover | Swipeable cards, filters, live-lobby path, match modal | Split demo/real architecture | Default mode is dummy profiles; disconnected state appears during demo |
| Profile preview | Avatar, cues, tags, prompts, like action | Mostly presentation | Candidate depth is generated from limited data; overflow menu is inert |
| Profile edit | Name and age fields | Broken persistence boundary | Mutates the current session object directly; no server update |
| Matching | Demo mutual-like rules and realtime event contracts | Placeholder/demo | No production matching service in repo |
| Inbox | Thread list, unread indicators, empty/loading states | Client shell | In demo without a match, it can remain on “Loading conversations…” indefinitely |
| Chat thread | Optimistic send, server event reducers, room invite card | Client shell | In-memory cache, no retry/delivery/read semantics, demo room tokens |
| MiniRoom | Avatar room, LiveKit client boundary, reactions, in-room chat, report entry | Advanced prototype | Partner fallback avatar, demo invalid LiveKit URL, no production moderation |
| MyRoom | Responsive room, movement, poses, collision, furniture, avatar motion | Strong demo / MVP-local | Local-only room state; small avatar limits outfit legibility |
| Wardrobe | Layered avatar preview, categories, ownership gating, motion preview | Strong demo / MVP-local | Local catalog/inventory; accessibility incomplete outside recently labeled controls |
| Shop | Wearables, room items, local coin prices, preview, unlock/equip | Strong demo / simulated economy | Currency and ownership are client-authoritative; status items are preview-only |
| Room editor | Placement, validation, rotation, removal, ownership filtering, persistence | Strong prototype | Large complex screen; only local persistence; no sync/conflict model |
| Settings | Blocked users, version, legal rows | Partial | Legal rows have no action; no account deletion, privacy controls, support, or consent |
| Notifications | No product implementation found | Missing | No push permission, token registration, or notification routing |
| Analytics | No product implementation found | Missing | No funnel, retention, safety, purchase, or crash observability |
| Crash reporting | Error boundary only | Missing | Errors print to console; no production reporting |

### What Is Real

- React Native/Expo application launches on web and iOS Simulator.
- AvatarV2 ownership/equip state and RoomV2 decor persist locally.
- MyRoom movement, pose controls, collision, and fitted Motion v1 assets work.
- Wardrobe and Shop render real integrated avatar assets.
- Realtime contracts and a WebSocket client boundary exist.
- LiveKit integration code exists for native media mode.
- Blocked users persist locally.
- TypeScript typecheck passes across all workspaces.

### What Is Mocked Or Demo-Only

- Default session identity and token.
- Discover profiles, mutual-like decisions, match creation, initial chat messages, and MiniRoom invite messages.
- Partner avatar fallback in MiniRoom.
- Coins, ownership, shop unlocks, room decor, and daily rewards are client-authoritative.
- Reports are not submitted to a server.
- Status-style products are explicitly preview-only.

### What Is Missing

- Real account creation/login/session refresh.
- Production user/profile API and durable profile editing.
- Production discovery/matching service in this repository.
- Production chat storage and delivery semantics.
- Push notifications.
- Server-backed blocking/reporting/moderation.
- Privacy controls, policy destinations, terms, community guidelines, account deletion.
- Analytics, crash reporting, release pipelines, EAS configuration, CI.
- Meaningful automated unit/integration/e2e coverage.

## 3. Launch Readiness Verdict

### A. Internal Demo Readiness: READY

The product can be shown to stakeholders as a controlled demo. The avatar-first proposition is understandable, visual quality is differentiated, and the demo path can communicate discovery, matching, chat, room, wardrobe, and shop.

Conditions:

- Present it explicitly as a product prototype.
- Use demo mode intentionally.
- Do not claim that reports, purchases, messages, matches, or accounts are production-backed.
- Avoid a live-network demo unless the realtime edge and LiveKit environment are running.

### B. MVP Beta Readiness: NOT READY

The app should not be distributed to an external limited test group as a dating beta yet.

Beta blockers:

1. No trustworthy production auth/session lifecycle.
2. No server-backed profile persistence.
3. Default discovery and matching are demo data.
4. Chat is not durable and has no production delivery guarantees.
5. Reports are not delivered to moderators.
6. Blocking is local-only and cannot protect users across devices or server events.
7. No working legal/privacy/account-deletion paths.
8. No push notifications or reliable return loop.
9. No analytics or crash reporting.
10. No automated critical-flow regression suite.

### C. Public Launch Readiness: NOT READY

Public launch would be unsafe and operationally unmanageable. The application has dating/social product semantics but lacks the identity, privacy, moderation, account lifecycle, observability, and release controls expected for real users.

Do not submit to the App Store until all P0 items and the P1 release-quality foundation are complete.

## 4. Feature Readiness Scorecard

Scale: `0 missing`, `1 placeholder/demo`, `2 works but rough`, `3 MVP usable`, `4 polished`, `5 launch-quality`.

| # | Area | Score | Evidence | Blocker | Missing / recommended fix | Priority |
| --- | --- | ---: | --- | --- | --- | --- |
| 1 | Onboarding / first session | 2 | `WelcomeScreen`, `SessionBootstrapScreen` are complete visual flows | Yes | Require age, consent, legal acceptance, auth path, recovery, and production session bootstrap | P0 |
| 2 | Profile creation | 1 | Name, optional age, vibe only; demo session can be generated locally | Yes | Server-backed account/profile creation, required eligibility fields, validation, error recovery | P0 |
| 3 | Profile editing | 1 | `RootNavigator` directly mutates `sessionActor.profile` | Yes | Immutable update, persistence, server API, optimistic/error state | P0 |
| 4 | Discover / swipe / browse | 2 | Strong demo card and filters; real lobby client exists | Yes | Replace default dummy deck with production candidate API/realtime source; define ranking and exhausted state | P0 |
| 5 | Matching logic | 1 | `shouldTriggerMatch` reads hardcoded `hasLikedMe`; server contracts only | Yes | Server-authoritative decisions, dedupe, abuse controls, unmatch, audit trail | P0 |
| 6 | Chat / messaging | 2 | Inbox/thread UI and WebSocket events exist; cache is memory-only | Yes | Durable server storage, retries, send failures, pagination, delivery/read state, reconnect reconciliation | P0 |
| 7 | Notifications | 0 | No Expo notifications dependency or routing | Yes for usable beta | Push token lifecycle, consent, match/message notifications, preferences, deep links | P1 |
| 8 | Safety / report / block | 1 | UI exists; block persists locally; reports stay in memory | Yes | Server enforcement, moderation queue, evidence/context, appeals, unmatch propagation | P0 |
| 9 | Privacy controls | 0 | No visibility, discovery, distance, message, or data controls | Yes | Privacy center, location/distance choices, discoverability, data/export/delete controls | P0 |
| 10 | MyRoom | 3 | Native QA passed; movement, poses, collision, room projection work | No | Sync ownership/decor server-side; improve outfit legibility and performance telemetry | P2 |
| 11 | Wardrobe | 3 | Real item previews, equip states, motion readiness, native QA | No | Server inventory, favorites/outfits later, wider accessibility coverage | P2 |
| 12 | Shop | 2 | Local catalog, prices, unlock/equip flow | Yes if monetized | Server-authoritative balance/receipts; remove preview-only clutter from launch catalog | P1 |
| 13 | Avatar customization | 3 | Layer system and female Motion v1 catalog are substantial | No | Gender/body coverage parity, asset governance, performance budget | P2 |
| 14 | Room customization | 3 | Placement, rotation, collision validation, save/reset work locally | No | Server sync, conflict resolution, clearer edit tutorial | P2 |
| 15 | Economy / coins / unlocks | 1 | Two local coin stores and local starter balance | Yes | One server-authoritative ledger; idempotent rewards/unlocks; fraud prevention | P0 |
| 16 | Empty states | 2 | Several designed empty states exist | No | Fix indefinite Chat loading; add actionable offline/permission/no-results states | P1 |
| 17 | Error states | 2 | Error boundary and some banners exist | Yes | Request-level retries, actionable failures, support IDs, server error mapping | P1 |
| 18 | Offline / loading states | 1 | Best-effort local persistence; reconnect banner | Yes | Explicit offline mode, cached content policy, bounded loaders, reconnect reconciliation | P1 |
| 19 | Accessibility | 1 | Recent testIDs/labels cover wardrobe/shop; most screens lack labels | Yes for public launch | VoiceOver/TalkBack pass, roles, labels, focus order, dynamic type, contrast, reduced motion | P1 |
| 20 | Performance | 2 | Works in simulator; heavy image use and large screen components | No for demo; risk for beta | Startup/memory/frame profiling, asset optimization, list virtualization, split large components | P1 |
| 21 | App Store readiness | 1 | Native projects and icon exist | Yes | Real bundle IDs, policies, age rating, account deletion, screenshots, signing/release pipeline | P0 |
| 22 | Analytics / event tracking | 0 | No analytics SDK or event schema | Yes for managed beta | Define funnel/retention/safety events, consent, dashboards, experiment guardrails | P1 |
| 23 | Crash reporting | 0 | Error boundary logs to console | Yes for external beta | Add native crash/error reporting, release tags, privacy scrub, alerts | P1 |
| 24 | Security / backend readiness | 1 | Contracts and clients exist; no backend app in repo | Yes | Auth, authorization, rate limits, server validation, secure token storage, abuse controls, production deployment | P0 |

## 5. Tinder / Bumble / Snapchat Benchmark

### Tinder-Level Discovery Expectations

Strengths:

- DateVibe has a clear card decision loop and immediate avatar personality.
- Match feedback and chat handoff are represented in the demo.
- The room concept gives mutual interest a differentiated destination.

Gaps:

- Candidate supply, ranking, eligibility, distance, identity, and matching are not production-backed.
- The card has attractive presentation but limited verified profile depth.
- “Who liked you” is hardcoded in demo mode.
- Premium value is catalog-led rather than tied to meaningful dating outcomes.

### Bumble-Level Trust Expectations

Strengths:

- Warm tone, non-photo-first identity, report/block entry in chat and MiniRoom.
- Profile prompts/cues have a respectful interaction direction.

Gaps:

- Safety UI currently over-promises: “Report submitted” is shown even though the report never leaves memory.
- Age is optional during bootstrap.
- No server block enforcement, verification, consent history, privacy center, legal destinations, or account deletion.
- No user-facing explanation of who can discover/contact them.

### Snapchat-Level Playfulness Expectations

Strengths:

- Avatar, outfit, room, reactions, movement, and status concepts create a playful identity layer.
- MyRoom and Wardrobe are the strongest emotional hooks in the product.

Gaps:

- There is no reliable social presence loop or notification loop.
- Daily rewards exist locally but are disconnected from meaningful social progress.
- Rooms are primarily self-customization; room visits and social return reasons are not yet a system.
- Status styles are visible as preview-only products, which makes the Shop feel partially unfinished.

### Missing Core Loop

The desired loop is:

`Create identity -> discover credible people -> mutual match -> safe conversation -> shared room moment -> reason to return`

Today only the identity/room presentation is strong. Discovery, match, conversation, safety, and return behavior are mostly demo or client shells.

## 6. Main Product Gaps

### Top 10 Launch Blockers

1. **Production identity is missing.** Demo sessions are locally created and real bootstrap has no repository-owned backend.
2. **Age/eligibility is not enforced.** Age is optional even though the product is dating-oriented and supports underage reports.
3. **Discovery/matching is demo-first.** Dummy profiles and hardcoded mutual likes are the default launch path.
4. **Chat is not durable.** Threads/messages live in memory and lack reliable send/reconnect semantics.
5. **Safety actions are not real.** Reports show success but are never sent to a moderation service.
6. **Blocking is only local.** It cannot stop server delivery, multi-device visibility, or future contact.
7. **The economy is client-authoritative.** Coins, rewards, prices, and unlocks are locally mutable.
8. **Legal/account controls are missing.** Settings rows are inert; there is no account deletion.
9. **No production observability.** There is no analytics or crash reporting.
10. **No release/test system.** No CI, EAS config, e2e suite, or meaningful automated coverage.

### Top 10 Consumer Polish Gaps

1. Demo Discover shows a permanent “Reconnecting to the room…” state.
2. Chats can remain on “Loading conversations…” indefinitely when no realtime list arrives.
3. Profile Edit does not reliably update or persist the displayed identity.
4. Profile and settings access is buried through MyRoom rather than obvious account navigation.
5. Settings legal rows look tappable but do nothing.
6. Discover mixes Turkish and English copy within one primary card.
7. MyRoom’s avatar is readable but too small to sell detailed outfits at a glance.
8. Shop includes preview-only status products beside functional products, weakening trust.
9. Wardrobe catalog navigation is horizontally dense and requires hidden scrolling.
10. Accessibility semantics are missing across most discovery, onboarding, chat, profile, and room controls.

## 7. Technical Gaps And Risks

### Top 10 Technical Risks

| Risk | Severity | Evidence | Required action | Priority |
| --- | --- | --- | --- | --- |
| No backend implementation in repo | Critical | Only mobile, contracts, domain, realtime-client packages | Establish production service ownership and deployment contract | P0 |
| Demo mode is the default runtime | Critical | Mobile `start` script hardcodes demo mode | Separate demo and release entry/config; production must fail closed | P0 |
| Session token in AsyncStorage | High | `sessionStorage.ts` stores full session actor | Use platform secure storage and refresh/revocation lifecycle | P0 |
| Client-authoritative economy | Critical | Local coins and unlocks in AsyncStorage | Move ledger/rewards/unlocks to server with idempotency | P0 |
| Reports never leave memory | Critical | `reportQueue` in `blockStore.ts` | Send authenticated reports to moderation backend; retry safely | P0 |
| Profile update mutates state object | High | `RootNavigator.tsx` directly assigns profile fields | Immutable state transition and durable API | P0 |
| Minimal automated tests | High | One helper test; no configured test command/CI | Add unit/integration/e2e harness and critical flow coverage | P1 |
| Large high-coupling files | High | Six screens exceed 1,000 lines | Split by domain after behavior tests exist | P1 |
| Asset/bundle pressure | Medium | Source image groups exceed 20 MB; 245 app images found | Measure release bundle/memory, compress, dedupe legacy assets | P1 |
| Dependency drift/audit findings | Medium | Expo expected versions differ; npm audit reports 16 moderate findings | Controlled dependency alignment PR; do not force-upgrade blindly | P1 |

Additional risks:

- WebSocket authentication is passed in the query string.
- Realtime sends silently drop when disconnected.
- Chat optimistic messages have no explicit failed state.
- Local persistence frequently catches and suppresses errors without user feedback.
- No environment template documents required production URLs.
- Root README describes WorkAdventure, not DateVibe.
- Android requests broad/legacy storage and overlay permissions not justified by the current product.
- Native bundle identifiers remain `com.anonymous.*`.

## 8. Safety And Privacy Gaps

P0:

- Real server-side block/report enforcement.
- Moderator review queue and incident status.
- Required 18+ gate and server validation.
- Privacy Policy, Terms, Community Guidelines destinations.
- Account deletion and data deletion request.
- Authentication, token revocation, secure token storage.
- Rate limiting and abuse prevention for discovery, invites, chat, reactions, and reporting.

P1:

- Discovery visibility and contact preferences.
- Distance/location disclosure policy.
- Unmatch flow with conversation handling.
- Evidence/context attachment for reports.
- Safety center and support escalation.
- Consent records and policy versioning.

Do not describe the current report action as production-safe. The UI confirmation is stronger than the implementation.

## 9. App Store Readiness Checklist

| Requirement | Status | Evidence / gap |
| --- | --- | --- |
| App icon | Done | iOS 1024x1024 icon exists |
| Splash screen | Partial | Native splash exists; brand/release QA not documented |
| Bundle identifier | Missing | Uses `com.anonymous.datevibe-mobile` / `com.anonymous.datevibemobile` |
| Version/build number | Partial | `1.0.0` / build `1`; no release strategy |
| Privacy policy | Missing | Inert Settings row; no URL/document |
| Terms of service | Missing | Inert Settings row; no URL/document |
| Community guidelines | Missing | Inert Settings row; no URL/document |
| Age rating | Missing | No release metadata; age optional |
| Camera permission copy | Partial | Generic iOS copy; no contextual explanation |
| Microphone permission copy | Partial | Generic iOS copy; no contextual explanation |
| Push permission copy | Missing | No push implementation |
| Photo/media permission copy | Unknown | No upload flow; Android includes legacy storage permissions |
| Account deletion | Missing | No UI or backend |
| Support email/contact | Missing | No support destination found |
| Crash reporting | Missing | Console-only error boundary |
| Analytics consent | Missing | No analytics implementation or consent policy |
| Reporting/moderation | Partial | UI/local queue only |
| Blocking | Partial | Local-only |
| App Store screenshots | Partial | Product QA screenshots exist, not release screenshots |
| TestFlight readiness | Missing | No EAS/release workflow or documented signing process |
| Production API config | Missing | Localhost defaults; no environment template |
| Environment separation | Partial | Demo/native media flag exists; no release fail-closed config |
| Privacy manifest | Partial | Required API reasons exist; collected-data declarations are empty |
| CI/release checks | Missing | No GitHub workflows found |

## 10. Roadmap

### P0 — Launch Blockers

| Task | Why | Affected areas | Effort | Risk | Dependency | Suggested PR | Acceptance criteria |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Production auth/session boundary | Every user action needs a trustworthy actor | session, navigation, secure storage | XL | High | Backend identity decision | `feat: add production account and session lifecycle` | Login/create/refresh/revoke work; tokens use secure storage; invalid sessions fail closed |
| Backend service foundation | Realtime contracts have no owned service here | session, lobby, match, chat, safety | XL | High | Hosting/data model | `feat: establish DateVibe production service foundation` | Staging API/WS deployed; authz, validation, logs, health checks documented |
| Server-backed profile + age gate | Current profile is optional/demo and edit is local | onboarding, profile, settings | L | High | Auth/backend | `feat: add verified profile lifecycle and eligibility gate` | Age required and server validated; profile create/edit persists across devices |
| Real discovery/matching | Demo deck cannot be beta-tested as dating behavior | Discover, match modal, saved connections | XL | High | Profile/backend/safety | `feat: add server-authoritative discovery and matching` | Candidates come from backend; decisions idempotent; mutual match is authoritative |
| Durable chat | Messaging must survive reconnect/restart | Inbox, ChatThread, realtime | XL | High | Backend/auth | `feat: add durable chat delivery and reconciliation` | Pagination, retry/failure, reconnect, unread state and retention are tested |
| Server safety enforcement | Local report/block is unsafe | ReportModal, Settings, realtime | L | High | Backend/auth/moderation ops | `feat: add server-backed block and reporting` | Block affects discovery/chat/invites; report reaches review queue; UI reflects server result |
| Privacy/legal/account lifecycle | Mandatory for dating/social launch | Settings, onboarding, backend | L | High | Legal decisions | `feat: add privacy legal and account controls` | Working policies, consent, deletion, support, visibility controls |
| Server-authoritative economy | Local currency is exploitable | Shop, inventory, rewards | L | High | Backend/auth | `feat: move avatar economy to server ledger` | Balance/unlocks/rewards are server-owned and idempotent; client cannot mint coins |
| Production configuration gate | Release must never default to demo/localhost | env, builds, startup | M | Medium | Staging endpoints | `chore: add fail-closed production environment config` | Release build fails without HTTPS/WSS endpoints; demo code excluded or explicitly gated |
| Release observability minimum | External beta cannot be operated blind | app bootstrap, errors, key funnels | M | Medium | Vendor/privacy choice | `feat: add privacy-safe analytics and crash reporting` | Crash alerts, release tags, core funnel and safety events visible in staging |

### P1 — MVP Quality

| Task | Why | Affected areas | Effort | Risk | Dependency | Suggested PR | Acceptance criteria |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Push notifications | Matches/messages need a return path | app lifecycle, chat, match | L | Medium | Backend/auth | `feat: add match and message notifications` | Permission flow, token lifecycle, preferences and deep links work |
| Critical-flow automated tests | Current regressions depend on manual QA | onboarding, discover, chat, room, shop | L | Low | Stable staging fixtures | `test: add consumer critical flow regression suite` | CI runs unit/integration/e2e smoke tests on every PR |
| Accessibility baseline | Core flows are not screen-reader ready | all primary screens | L | Medium | Stable UI | `fix: add core mobile accessibility semantics` | VoiceOver/TalkBack primary journeys complete; dynamic type and contrast checked |
| Offline/reconnect contract | Current loaders and sends can stall or drop | Discover, Inbox, Chat, MiniRoom | M | Medium | Durable backend | `fix: add bounded loading and reconnect states` | Every network state has timeout, retry, offline copy and reconciliation |
| Profile depth and completeness | Current identity is too shallow for trust | onboarding, You, ProfilePreview | M | Medium | Profile backend | `feat: add profile prompts interests and completeness` | Users can create/edit meaningful identity; missing data is clearly prompted |
| Unmatch and conversation safety | Dating users need reversible boundaries | Saved, Chat, Settings | M | High | Safety backend | `feat: add unmatch and conversation controls` | Unmatch is server-enforced and removes future contact correctly |
| Catalog cleanup | Preview-only products reduce shop credibility | Shop | S | Low | Product merchandising decision | `fix: separate future shop concepts from purchasable catalog` | Functional and preview-only sections cannot be confused |
| Dependency alignment | Expo warns about incompatible versions | package lock/native builds | M | Medium | Regression suite | `chore: align Expo React Native dependencies` | Expo doctor clean; iOS/Android/web smoke pass |
| Release docs and CI | Current README is unrelated | root docs, GitHub Actions | M | Low | Build commands | `docs: add DateVibe development and release runbook` | Correct setup, environments, QA, signing and CI checks documented |

### P2 — Consumer Polish

| Task | Why | Affected areas | Effort | Risk | Dependency | Suggested PR | Acceptance criteria |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Discovery identity depth | Cards need more reasons to choose a person | Discover, ProfilePreview | M | Medium | Profile backend | `feat: strengthen discovery identity cards` | Prompts/interests/trust cues are visible without crowding |
| Chat quality states | Consumer messaging needs confidence | Inbox, ChatThread | M | Medium | Durable chat | `feat: add message delivery and conversation polish` | Sending/failed/delivered/read states and pagination are understandable |
| MyRoom outfit visibility | Avatar identity should sell wardrobe value | MyRoom | S | Low | Current front rig | `fix: tune myroom avatar outfit legibility` | Outfit recognizable without blocking furniture or breaking framing |
| Wardrobe collections/favorites | Catalog growth needs organization | Wardrobe | M | Low | Server inventory | `feat: add wardrobe favorites and saved looks` | Users can save/reapply looks; no new runtime dress layer required |
| Shop item detail | Purchase decision needs context | Shop | M | Low | Server economy | `feat: add wearable detail and collection sheets` | Preview, compatibility, ownership and price are clear |
| Room visit hook | Rooms need social relevance | Profile, match, room | L | Medium | Safety/privacy/backend | `feat: add consented room visit previews` | Users control visibility; visitors see current saved room safely |
| Motion transition polish | Stand/walk/sit should feel continuous | Avatar renderer | M | Medium | Existing front rig | `fix: smooth avatar motion state transitions` | No blur/pose flash/anchor jump on representative outfits |
| Language consistency | Mixed Turkish/English weakens product coherence | all copy | M | Low | Market decision | `chore: establish localization and copy system` | One launch locale is complete; strings are externalized |

### P3 — Growth, Retention, Monetization

- Daily social prompt tied to profile/room presence, not only local coin rewards.
- Seasonal wardrobe and room drops after catalog operations exist.
- Server-backed streak/reward system with anti-abuse controls.
- Profile boost only after ranking fairness and safety instrumentation exist.
- Outfit sets after single-item inventory/equip sync is stable.
- Room visit notifications and reactions with privacy controls.
- Bundles/collections after economy conversion and refund handling are defined.
- Experiments only after analytics, consent, and guardrails are production-ready.

## 11. Suggested Feature Set

### Build Next

- Required 18+ account/profile bootstrap.
- Real profile persistence and profile completeness.
- Server discovery/match decisions.
- Durable chat with push notifications.
- Server report/block/unmatch.
- Privacy/legal/account deletion.
- Production environment, analytics, crash reporting, CI.

### Build After The Core Loop Is Proven

- Compatibility prompts and filters.
- Conversation starters.
- Saved outfits and favorites.
- Shop collections and item detail.
- Room visit previews and room mood/status.
- Daily social prompt and new-drop notification.

### Do Not Build Yet

- 3/4 avatar rig.
- More generated wardrobe volume.
- Large outfit/set architecture.
- Paid boosts.
- Status card economy.
- Broad room multiplayer expansion.

These would increase surface area before the real social, safety, and retention loop is proven.

## 12. Suggested PR Sequence

1. `fix: stabilize demo and local identity state`
2. `docs: add DateVibe development and release runbook`
3. `feat: add production account and session lifecycle`
4. `feat: add verified profile lifecycle and eligibility gate`
5. `feat: establish DateVibe production service foundation`
6. `feat: add server-authoritative discovery and matching`
7. `feat: add durable chat delivery and reconciliation`
8. `feat: add server-backed block and reporting`
9. `feat: add privacy legal and account controls`
10. `feat: move avatar economy to server ledger`
11. `feat: add privacy-safe analytics and crash reporting`
12. `test: add consumer critical flow regression suite`
13. `feat: add match and message notifications`
14. `fix: add core mobile accessibility semantics`
15. `chore: prepare TestFlight release candidate`

PR #1 should stay focused on product-reference wardrobe, MyRoom visibility, and the consumer UI work already present. None of the roadmap epics belong in that PR.

## 13. Safe Fix Selection

| Candidate Fix | Priority | Effort | Risk | Safe to implement now? | Reason |
| --- | --- | --- | --- | --- | --- |
| Stop demo mode from opening a dead realtime socket and mark the demo inbox loaded | P1 | S | Low | Yes | Removes false error/loading states without changing production/native mode |
| Replace direct Profile Edit mutation with immutable persisted session update | P0/P1 | M | Low | Yes | Fixes a real local data bug and follows the existing session storage contract |
| Require age in the local onboarding form | P0 | S | Medium | No | Client-only age input could falsely imply real age assurance without server enforcement |
| Wire Privacy/Terms rows | P0 | S | High | No | No approved policy URLs or legal text exist |
| Add account deletion | P0 | L | High | No | Requires backend identity and data deletion orchestration |
| Add broad accessibility coverage | P1 | L | Medium | No | Important, but should be a focused audited PR rather than an opportunistic partial pass |
| Split 1,000-line screens | P1 | L | Medium | No | Refactor requires regression tests first |

## 14. Final Recommendation

Treat DateVibe as a strong, differentiated prototype and stop expanding the visual catalog. The next product phase must establish trustworthy identity, real social data, durable messaging, server-enforced safety, legal/account controls, and operational observability before any beta claim.
