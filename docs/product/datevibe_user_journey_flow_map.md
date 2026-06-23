# DateVibe User Journey Flow Map

Status: PR #3 product-flow baseline and PR #4-#6 roadmap contract
Last updated: June 23, 2026

## Product Story

DateVibe is a dating world, not a form funnel. A new user creates an account,
builds a dating identity, chooses how their avatar appears, prepares a starter
room, and only then enters discovery. Avatar and room state remain live product
identity across profile, discovery, matches, wardrobe, MyRoom, and future
shared match rooms.

The rollout is intentionally staged:

- PR #3 owns account, session, setup status, routing guards, and the guided
  register-first path.
- PR #4 owns match result and shared room conversation foundations.
- PR #5 owns identity consistency across discovery, profile, avatar, and room.
- PR #6 owns safety, legal, privacy, age assurance, and deletion readiness.

No local experience should imply that production authentication, durable
chat, moderation, or age verification already exists.

## Core Session Concepts

| Concept | Responsibility |
| --- | --- |
| `AccountId` | Stable owner identifier for profile, avatar, room, and future social data |
| `SessionId` | Identifier for one authenticated or explicit demo session |
| `SessionMode` | Distinguishes `production` from `demo`; production never falls back to demo |
| `CurrentSession` | Session credentials, account identity, mode, expiry, and setup status |
| `OnboardingStatus` | Aggregate setup state used by navigation guards |
| `ProfileSetupStatus` | Whether the required dating identity step is complete |
| `AvatarSetupStatus` | Whether the starter avatar/outfit step is complete |
| `RoomSetupStatus` | Whether the starter room step is complete |

## Navigation State Machine

| Current state | Required route | Exit condition |
| --- | --- | --- |
| App hydrating | Splash | Stored intro and session state have been checked |
| No session, intro unseen | `Welcome` | User completes or skips the product introduction |
| No session, intro seen | `AuthEntry` | User chooses registration or explicit demo |
| Production registration requested | `Register` | Backend returns a production session or an error remains visible |
| Demo requested | Main app | Explicit demo session is created with completed setup status |
| Session, profile incomplete | `ProfileSetup` | Required profile fields are persisted |
| Session, profile complete, avatar incomplete | `AvatarSetup` | Starter look is confirmed and persisted |
| Session, avatar complete, room incomplete | `RoomSetup` | Starter room is confirmed and persisted |
| Session, all setup complete | Main app / `Lobby` | Logout or session invalidation |
| Logout | `AuthEntry` | Session is cleared; intro does not replay automatically |
| Invalid or expired session | `AuthEntry` | User registers, signs in later, or chooses demo |
| Match created | Future `MatchResult` | User chooses room, message, profile, or dismiss |
| Shared room entered | Future `SharedMatchRoom` | User leaves, blocks/reports, or room ends |
| Outfit changes after match | No route change | Shared room resolves latest equipped avatar state on entry/render |
| Room changes after match | No route change | Shared room resolves latest room state on entry/render |

## Connected User Journey

### 1. Fresh Install

- **Entry point:** App launch with no stored session and no intro completion.
- **User goal:** Understand DateVibe and begin building a personal dating world.
- **Sequence:** Splash -> Welcome -> Auth Entry.
- **State changes:** Intro completion is persisted separately from account state.
- **Navigation result:** Registration and explicit demo choices become available.
- **Empty/loading/error:** Splash is bounded by storage hydration; storage failure
  fails closed to Auth Entry rather than silently creating a user.
- **Visual character:** Brand mark, warm product cards, avatar/room storytelling,
  soft progress.
- **PR ownership:** PR #3.
- **Tests:** Fresh storage selects Welcome; completing intro selects Auth Entry.

### 2. Returning User

- **Entry point:** App launch with a valid stored session.
- **User goal:** Resume without repeating completed setup.
- **Sequence:** Splash -> next missing setup step or Main App.
- **State changes:** None unless legacy session normalization is required.
- **Navigation result:** Completed users enter Discover; incomplete users resume.
- **Empty/loading/error:** Expired or malformed sessions are cleared and route to
  Auth Entry.
- **Visual character:** Short branded splash, no repeated marketing carousel.
- **PR ownership:** PR #3.
- **Tests:** Completed session routes Main; each incomplete status routes correctly.

### 3. Logged-Out User

- **Entry point:** Launch after logout or session expiry.
- **User goal:** Create/sign into an account later or enter explicit demo.
- **Sequence:** Splash -> Auth Entry.
- **State changes:** Session is absent; intro completion remains.
- **Navigation result:** Register or Demo.
- **Empty/loading/error:** Production service availability is shown honestly.
- **Visual character:** Large DateVibe identity preview and two clear choices.
- **PR ownership:** PR #3.
- **Tests:** Logout clears session and routes Auth Entry without clearing avatar/room.

### 4. Demo Mode

- **Entry point:** User taps the explicit demo action.
- **User goal:** Explore the product without believing an account was created.
- **Sequence:** Auth Entry -> Demo Session -> Main App.
- **State changes:** A session with `mode: demo` is created; setup statuses are
  complete; identity is clearly disposable.
- **Navigation result:** Discover opens with demo data.
- **Empty/loading/error:** Demo starts locally and should not open production
  realtime connections.
- **Visual character:** A small "Demo world" label and playful preview copy.
- **PR ownership:** PR #3.
- **Tests:** Demo session mode is explicit; production identity never falls back to demo.

### 5. Register

- **Entry point:** Auth Entry primary CTA.
- **User goal:** Request one real DateVibe account with a verified phone number.
- **Sequence:** Auth Entry -> Register -> Profile Setup.
- **State changes:** A valid phone and SMS-code response creates a production
  session with all setup statuses incomplete.
- **Navigation result:** Profile Setup only after a valid backend response.
- **Empty/loading/error:** Network and server errors stay on Register with retry;
  no local account token is invented.
- **Visual character:** Focused phone verification card, short trust copy, clear progress.
- **PR ownership:** PR #3.
- **Tests:** Phone/SMS request shape, valid response, invalid response, backend failure.

### 6. First Profile Setup

- **Entry point:** Production session with incomplete profile status.
- **User goal:** Create the identity people meet first.
- **Sequence:** Profile Setup -> Avatar Setup.
- **State changes:** Display name, adult age confirmation, and initial vibe persist;
  profile status becomes complete.
- **Navigation result:** Avatar Setup.
- **Empty/loading/error:** Invalid age/name blocks progress; persistence errors remain
  actionable.
- **Visual character:** Identity card with live name/vibe preview, short human copy.
- **PR ownership:** PR #3.
- **Tests:** Validation, immutable profile update, status completion, resume after restart.

### 7. Avatar Setup

- **Entry point:** Profile complete, avatar incomplete.
- **User goal:** Confirm a recognizable starter avatar.
- **Sequence:** Avatar Setup -> Room Setup.
- **State changes:** Existing AvatarV2 provider remains the equipped-item source;
  avatar status becomes complete.
- **Navigation result:** Room Setup.
- **Empty/loading/error:** Missing catalog items resolve to built-in defaults.
- **Visual character:** Large front-rig avatar preview, compact starter choices,
  "Pick the vibe people will meet first."
- **PR ownership:** PR #3.
- **Tests:** Latest equipped state remains selected; completion routes Room Setup.

### 8. Starter Outfit

- **Entry point:** Inside Avatar Setup.
- **User goal:** Pick starter hair/top/bottom/shoes without entering the full shop.
- **Sequence:** Avatar preview -> starter category choices -> confirm.
- **State changes:** Equipped AvatarV2 item IDs update through the existing provider.
- **Navigation result:** Remains in Avatar Setup until confirmed.
- **Empty/loading/error:** Only owned/default starter items are selectable.
- **Visual character:** Visual-first choice chips/cards and immediate avatar feedback.
- **PR ownership:** PR #3.
- **Tests:** Same-category replacement, ownership guard, persisted equipped state.

### 9. Starter Room Setup

- **Entry point:** Avatar complete, room incomplete.
- **User goal:** Confirm the room that forms their first impression.
- **Sequence:** Room Setup -> Final Ready state -> Main App.
- **State changes:** Existing RoomV2 decor remains the room source; room status and
  aggregate onboarding become complete.
- **Navigation result:** Discover.
- **Empty/loading/error:** Invalid stored decor resolves safely to the default starter room.
- **Visual character:** Large room preview, "Your room is part of your first impression."
- **PR ownership:** PR #3.
- **Tests:** Current room preview renders; completion unlocks Main App.

### 10. Discovery

- **Entry point:** Completed onboarding and active session.
- **User goal:** Meet credible people quickly.
- **Sequence:** Discover deck -> Profile Preview or Like/Pass.
- **State changes:** Demo decisions remain local; future production decisions use a
  backend boundary.
- **Navigation result:** Next candidate, Profile Preview, or Match Result.
- **Empty/loading/error:** Explicit no-results, offline, reconnect, and retry states.
- **Visual character:** Avatar-first cards, concise compatibility cues, clear actions.
- **PR ownership:** PR #5.
- **Tests:** Mode-specific source, deck exhaustion, profile navigation, retry.

### 11. Like / Pass

- **Entry point:** Discover candidate card.
- **User goal:** Make a quick, clear decision.
- **Sequence:** Candidate -> Like/Pass -> next card or Match Result.
- **State changes:** Decision recorded once; match state created only by the correct source.
- **Navigation result:** Continue discovery or match celebration.
- **Empty/loading/error:** Failed production decisions expose retry and do not advance.
- **Visual character:** Responsive motion and restrained celebratory feedback.
- **PR ownership:** PR #5.
- **Tests:** Idempotent decision boundary, matched/unmatched branches, failure rollback.

### 12. Match Success

- **Entry point:** Authoritative match event or explicit demo match.
- **User goal:** Understand the connection and choose a next action.
- **Sequence:** Match Result -> Go to Room / Say Hi / View Profile / dismiss.
- **State changes:** Match identity stores participant IDs and room/thread intent.
- **Navigation result:** Shared Match Room, Chat, Profile, or Discover.
- **Empty/loading/error:** Room/thread preparation can retry without losing the match.
- **Visual character:** Two current avatars, names, soft celebration, DateVibe room cue.
- **PR ownership:** PR #4.
- **Tests:** Latest avatar snapshots, CTA routes, duplicate match suppression.

### 13. Shared Match Room

- **Entry point:** Match Result or room invite.
- **User goal:** Share a playful visual conversation space.
- **Sequence:** Room load -> two avatars -> bubble conversation -> leave/debrief.
- **State changes:** Room session references participants and current room owner; it
  resolves current avatar/room state rather than storing stale screenshots.
- **Navigation result:** Chat, debrief, profile peek, or previous screen.
- **Empty/loading/error:** Partner fallback, reconnect, room-ended, and safety states.
- **Visual character:** Cozy room, two avatars, name labels, speech bubbles, reactions.
- **PR ownership:** PR #4.
- **Tests:** Two-avatar composition, latest state resolution, leave/report/reconnect.

### 14. Bubble Chat

- **Entry point:** Shared Match Room.
- **User goal:** Send short expressive messages without leaving the room.
- **Sequence:** Input/reaction -> local bubble -> server confirmation later.
- **State changes:** PR #4 local/demo message model; future durable adapter owns delivery.
- **Navigation result:** Remains in room.
- **Empty/loading/error:** Sending, failed, retry, muted, and no-message states.
- **Visual character:** Short bubbles near avatars, heart/wave/sparkle/coffee reactions.
- **PR ownership:** PR #4.
- **Tests:** Bubble ownership, ordering, failed send, quick reactions, accessibility.

### 15. Profile Edit

- **Entry point:** You screen.
- **User goal:** Update identity without losing account ownership.
- **Sequence:** You -> Edit Profile -> save -> You.
- **State changes:** Immutable profile update through session service; production adapter
  eventually persists server-side.
- **Navigation result:** Updated profile preview.
- **Empty/loading/error:** Saving disables duplicate submission and surfaces failure.
- **Visual character:** Live identity preview with concise fields.
- **PR ownership:** PR #5.
- **Tests:** Persistence, immutable update, error state, unchanged submission.

### 16. Wardrobe Update

- **Entry point:** Wardrobe from MyRoom/You.
- **User goal:** Change visual identity.
- **Sequence:** Category -> item -> equip -> preview -> leave.
- **State changes:** AvatarV2 provider updates one source of truth.
- **Navigation result:** MyRoom/profile/future match room use the latest state.
- **Empty/loading/error:** Locked item state and missing-asset fallback remain explicit.
- **Visual character:** Large try-on preview and obvious Wearing state.
- **PR ownership:** PR #5.
- **Tests:** Equip persistence and latest-state use across all consumers.

### 17. Room Update

- **Entry point:** MyRoom editor.
- **User goal:** Shape the space other people will associate with them.
- **Sequence:** Edit -> place/move/remove -> save -> MyRoom.
- **State changes:** RoomV2 provider updates one source of truth.
- **Navigation result:** MyRoom and future shared room resolve the latest decor.
- **Empty/loading/error:** Invalid placement, unsaved edits, missing ownership, reset.
- **Visual character:** Full room canvas with direct manipulation.
- **PR ownership:** PR #5.
- **Tests:** Save/cancel, ownership, placement validation, latest-state use.

### 18. Logout

- **Entry point:** You screen.
- **User goal:** End the current account session safely.
- **Sequence:** Sign out -> Auth Entry.
- **State changes:** Session credentials and account identity clear; local cosmetic/room
  data remain device-local until account-scoped storage is introduced.
- **Navigation result:** Main tabs are inaccessible.
- **Empty/loading/error:** Clear failure keeps the user in a safe signed-in state.
- **Visual character:** Simple confirmation in a future safety/account PR.
- **PR ownership:** PR #3 for lifecycle; PR #6 adds account-safety confirmation.
- **Tests:** Session removal, route guard, no demo fallback in production.

### 19. Incomplete Onboarding Recovery

- **Entry point:** App launch with a valid incomplete session.
- **User goal:** Continue exactly where setup stopped.
- **Sequence:** Splash -> first incomplete setup screen.
- **State changes:** Completed steps are preserved; no earlier step is repeated.
- **Navigation result:** Next setup step or Main App.
- **Empty/loading/error:** Corrupt status normalizes to the earliest safe required step.
- **Visual character:** Progress communicates continuity, not failure.
- **PR ownership:** PR #3.
- **Tests:** Every status combination and legacy session normalization.

### 20. Error, Loading, and Empty States

- **Entry point:** Any asynchronous boundary.
- **User goal:** Understand what happened and recover.
- **Sequence:** Loading -> success, bounded empty state, or actionable error.
- **State changes:** Failed operations do not silently advance setup.
- **Navigation result:** Retry, back, or safe authenticated route.
- **Empty/loading/error:** Branded splash; register retry; no-results discovery; quiet
  inbox; unavailable room; invalid session logout.
- **Visual character:** Warm concise copy, small illustrations/previews from real assets,
  one primary recovery action.
- **PR ownership:** PR #3 establishes lifecycle states; later PRs extend their domains.
- **Tests:** Timeouts, malformed storage, failed persistence, failed registration.

## Creative UX Decisions

- Setup uses one emotionally meaningful task per screen.
- Progress is compact and visual: Profile -> Avatar -> Room -> Ready.
- Avatar and room previews carry more weight than explanatory text.
- Microcopy stays short: "Let's build your DateVibe world", "Pick the vibe
  people will meet first", and "You're almost ready to meet someone."
- Existing DateVibe tokens, rounded surfaces, warm shadows, and real avatar/room
  assets are reused. No new art or generic placeholder UI is introduced.
- Demo entry is visible and honest. It is not disguised as registration.

## Quality Benchmark Notes

- **Bumble-level clarity:** one next action, visible progress, adult eligibility
  validation, and trustworthy error handling.
- **Snapchat-level identity:** fast visual avatar feedback and expressive future
  room reactions.
- **Sanalika/Habbo-like presence:** the room and avatar are current state, not
  detached decorative screenshots.
- **DateVibe differentiation:** matching leads toward a shared visual room rather
  than only a conventional message list.

## PR Slicing

### PR #3 - `feat: add production account and onboarding lifecycle`

Modules:

- `features/session`: account/session/onboarding model, API adapter, storage,
  route selector, tests.
- `screens`: Auth Entry, Register, Profile Setup, Avatar Setup, Room Setup.
- `navigation`: setup guards and main-tab lock.
- `docs/product`: this connected flow architecture.

Acceptance:

- Fresh, returning, incomplete, logged-out, and explicit demo routes are deterministic.
- Production registration never creates a demo session.
- Native credentials use SecureStore; production web credentials remain
  memory-only until cookie-based authentication exists.
- Demo discovery and realtime behavior follow `CurrentSession.mode`.
- Existing AvatarV2 and RoomV2 providers remain their respective state owners.
- Logout removes session access.

### PR #4 - `feat: add match result and shared room conversation foundation`

Required modules:

- `features/matches/matchSession.ts`
- `features/matches/matchSessionStore.ts`
- `features/sharedRoom/sharedRoomConversation.ts`
- `screens/MatchResultScreen.tsx`
- `screens/SharedMatchRoomScreen.tsx`

Dependencies:

- CurrentSession account identity from PR #3.
- AvatarV2 current equipped state.
- RoomV2 current decor state.
- Existing demoStore/realtime event adapters.

Acceptance:

- Two current avatars render in a current room.
- Match CTAs lead somewhere useful.
- Local/demo bubbles and reactions are clearly non-production.
- Backend chat can replace the adapter without replacing UI state.

Tests:

- Match state creation/dedupe.
- Current avatar and room resolution.
- Bubble ordering, reactions, leave, and reconnect states.

### PR #5 - `feat: connect discovery profile avatar and room identity`

Modules:

- Discovery candidate adapter and selectors.
- Profile identity projection.
- Shared avatar/room snapshot contracts.

Acceptance:

- Latest profile/avatar/room state appears consistently.
- No duplicated equipped-item or room-decor ownership.

Tests:

- Identity projection and stale-state prevention.

### PR #6 - `feat: add safety and account readiness flows`

Modules:

- Safety service adapter.
- Privacy/legal/account screens.
- Eligibility and consent records.
- Deletion request boundary.

Acceptance:

- No safety action claims success without a backend result.
- Policies and deletion have real destinations.
- Age/consent requirements are explicit.

Tests:

- Report/block request states, consent versioning, deletion request, and privacy routing.

## Intentionally Deferred

- Production backend delivery and cookie-based web authentication.
- Real login, refresh, revocation, and server-side session invalidation.
- Durable match/chat/moderation services.
- Push, analytics, crash reporting, and App Store operations.
- Shared match room and bubble-chat UI until PR #4.
- More avatar assets, 3/4 rig work, and outfit-set architecture.
