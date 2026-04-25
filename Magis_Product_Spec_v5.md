# MAGIS
## Product Feature Specification & Build Plan
**AI-Powered Personal Training Platform | v5 | March 2026**

**CONFIDENTIAL**

---

## Vision

Magis is a mobile-first personal training platform built on a simple truth: the best fitness outcomes happen when human expertise and AI efficiency work together. Coaches are burdened by administrative work. Clients are blocked by friction. Magis eliminates both.

Coaches use Claude AI to generate full training programs in seconds — eliminating the manual programming hours that platforms like Everfit and TrueCoach require. Clients log workouts in real time, get instant AI-assisted answers without waiting for their coach, and share progress on a social feed built for weight training — Strava for the gym.

The result is a flywheel: coaches scale their client load without burning out, solo users get a smarter AI plan with a community, and over time solo users convert into coached clients through the platform's matching layer.

---

## User Tiers

Magis serves three distinct user types. Each has a clear value proposition and a defined path to the next tier. The tiers are designed so that each one feeds the next — creating organic growth without paid acquisition.

| | 🤖 Solo / AI User | 🏋️ Coached Client | 👤 Coach |
|---|---|---|---|
| **Who** | Someone who wants a smart AI workout plan and a community — no coach | Existing coaching client brought onto the platform by their coach | Independent online coach managing clients |
| **Core need** | Low friction, smart programming, motivation from community | Seamless logging, coach visibility, progress tracking | Scale client load without more admin hours |
| **Pays for** | Magis AI subscription (monthly or annual) | Coach fee (handled outside or via Magis Payments — Phase 4) | Magis coach SaaS plan |
| **Path to next tier** | Discovers coaching via feed and matching feature → becomes coached client | Becomes a loyal long-term client; may eventually coach others | Brings clients → clients recruit friends → community grows |

**Key principle:** the Solo / AI tier is a genuinely excellent standalone product — not a degraded trial. These users are your future coached clients. If the AI-only experience is mediocre, the conversion never happens.

---

## Who Uses This App

| 👤 Coach | 🏋️ Solo User / Coached Client |
|---|---|
| Generate full training programs with AI in seconds | Get an AI-generated program or view coach-assigned workouts |
| Review, edit and publish programs to clients | Log workouts in real time with minimal friction |
| Monitor all client progress from one dashboard | Get instant AI answers — swap exercises, shorten sessions (Phase 2) |
| Manage client profiles, PAR-Q data, notes and history | Track personal records, volume trends and streaks |
| Request intake forms from clients | Post workouts to the social feed and build community |
| Scale to more clients without more admin hours | Connect with a coach via in-app matching (Phase 3) |

---

## Competitive Positioning

Magis occupies a gap no current product fills. Solo users need a community. Coached clients need less friction. Coaches need to scale. No single platform serves all three.

| | Magis | Fitbod | Everfit / TrueCoach | Strava |
|---|---|---|---|---|
| Human Coaching | ✅ | ❌ | ✅ | ❌ |
| AI Program Generation | ✅ | ✅ | ❌ | ❌ |
| AI Solo Tier (no coach needed) | ✅ | ✅ | ❌ | ❌ |
| Client AI Agent (self-serve) | ✅ (Phase 2) | Partial | ❌ | ❌ |
| Social / Community Layer | ✅ | ❌ | ❌ | ✅ |
| Coach-Client Matching | ✅ (Phase 3) | ❌ | ❌ | ❌ |

---

## Attracting the Solo / AI User

These users are drawn to Fitbod-style experiences: low friction, no commitment, a smart workout without having to think too hard. To win them, Magis must offer a genuinely excellent AI-only tier — not a gated preview of the coached product.

### What Differentiates Magis From Fitbod

Fitbod's algorithm is competent but the experience is solitary. Magis wins on two dimensions Fitbod cannot match:

- **Better programming quality** — Claude generates programs with context and reasoning, not just algorithmic substitution. Users can ask why an exercise is in their plan and get a real answer.
- **Community and accountability** — the social feed turns solo training into a shared experience. Seeing peers celebrate PRs is a retention driver no algorithm can replicate.

### The Conversion Flywheel

The solo tier is not just a product — it is a top-of-funnel for coached conversions. A solo user who has been on Magis for three months, seen their friends' coaches celebrate PRs on the feed, and received a nudge like 'want a coach to take this further?' is a warm lead that required zero paid acquisition. The matching feature (Phase 3) closes that loop.

### Solo Tier Feature Set

| Feature | Description | Priority |
|---|---|---|
| AI Program Generator | Complete the signup onboarding wizard (profile, body metrics, health disclaimer, PAR-Q, goals, equipment and focus preferences, review) — Claude generates a personalised 4-week program instantly with explanation of the approach | Must Have |
| Live Set Logging | Log weight and reps for each set with minimal taps | Must Have |
| Rest Timer | Auto-starts between sets | Must Have |
| Exercise Demo | Text instructions and form cues for every exercise; muscle diagrams and media planned for Phase 2 | Must Have |
| Pre-Generated Exercise Alternates | One alternate per exercise generated at program creation — swap with a single tap, no API call, works offline | Must Have |
| AI Concierge | In-workout agent: swap exercise, shorten session, explain why — instant Claude response. Deferred — pre-generated alternates and existing swap/skip UI cover the core use cases today. Revisit when real user demand signals justify the complexity. | Nice to Have |
| Personal Records | Auto-detected PRs with history chart and celebration moment | Must Have |
| Volume Charts | Weekly and monthly volume by muscle group | Must Have |
| Body Measurements | Log and track weight, body fat %, and custom measurements | Must Have |
| Workout Streaks | Consecutive week tracker with milestone badges | Must Have |
| Social Feed Access | Post workouts, react and comment — full community participation | Must Have |
| Coach Discovery | Browse and match with coaches from the feed (Phase 3) | Nice to Have |

---

## Attracting Coaches: Leverage, Not Replacement

The fear among coaches is real: if AI can generate programs, what is the coach for? Magis must address this directly — not through marketing spin, but through genuine product decisions that make coaches more powerful, not redundant.

### The Core Reframe

The AI does the work coaches hate, so coaches can do more of the work clients pay for. Manual programming is the administrative tax. Relationships, accountability, nuanced feedback, and motivation — that is what clients are actually paying for, and what no AI can replicate.

A coach managing 20 clients today spends roughly 10 hours a week on programming. Magis reduces that to under 2 hours. That same coach can now manage 40 clients without working more — doubling revenue without hiring or burning out. That is the pitch.

### Product Decisions That Reinforce Coach Trust

- The AI always surfaces the coach's name and brand, never Magis's — clients feel coached by their person, not an algorithm
- Coach guidelines control what the AI does during program generation — intensity, periodization style, exercises to include or avoid
- The agent activity log shows every AI substitution and change — coaches stay informed, never bypassed
- All client data belongs to the coach — if they leave Magis, they take their client contact list with them
- The draft/publish workflow means no AI-generated program reaches a client without coach review and approval

### Coach Tier Feature Set

| Feature | Description | Priority |
|---|---|---|
| Claude AI Generator | Generate a full 4-week program (configurable length) from a client's intake data — instant, with AI explanation | Must Have |
| AI Regeneration Feedback Loop | After initial generation, provide text feedback and request a revised program. AI uses previous program and feedback as context. | Must Have |
| In-App Program Editor | Edit exercises, sets, reps, rest periods and notes after AI generation before publishing | Must Have |
| Program Draft/Publish Workflow | Programs start in draft. Coaches review and edit before publishing. Published programs become active for the client. | Must Have |
| One-Click Assign | Assign any program to a client with a start date | Must Have |
| Coach Guidelines Config | Set per-client intensity, periodization style, program length, exercises to include/avoid, and free-text instructions — the AI follows these during generation | Must Have |
| Agent Guardrail Config | Per-client rules for what the client-side AI concierge can and cannot change autonomously. Deferred until concierge is built. | Nice to Have |
| Agent Activity Log | See every AI substitution or session change made on behalf of each client | Must Have |
| Client List Dashboard | All clients with status, current program, last active date and streak | Must Have |
| Client Profile | Individual view with intake data, PAR-Q flags, body metrics, progress charts and coaching notes | Must Have |
| Add / Invite Client | Invite new clients via email link to create their account and complete intake | Must Have |
| Coach-Initiated Intake Request | Request a client to complete or update their intake form directly from the client profile | Must Have |
| Coach Notes | Full CRUD notes on client profiles — post-session notes, timestamped, coach-only visibility | Must Have |
| Deload Week Support | Mark specific weeks in a program as deload weeks for proper periodization | Must Have |
| PAR-Q Visibility | Client PAR-Q flags surfaced on coach dashboard — heart condition, chest pain, joint issues, blood pressure meds, etc. | Must Have |
| Multi-Role Support | Coaches can enroll as their own client to test programs. Role switcher in navigation. Active role stored in profiles.role. | Must Have |
| Auto-Progression Logic | Agent auto-adjusts load and reps week-over-week based on logged performance | Should Have |
| Check-In Drafts | AI-drafted weekly check-in messages based on each client's activity data | Should Have |
| Progress Overview | See all clients' PRs, volume trends and streak data at a glance | Should Have |
| Program Library / Templates | Save programs as reusable templates across similar clients. Deferred — programs are currently client-specific. | Should Have |
| Custom Exercises | Add your own exercises with coaching notes and video links | Should Have |
| Coach Branding | Your logo and colours on the client-facing experience | Nice to Have |

---

## The Two-Sided AI Agent

The AI agent is the core differentiator of Magis. It operates differently depending on who is using it — solving fundamentally different problems for coaches and clients.

### Coach-Side Agent: The Programming Assistant

Coaches provide a client brief — goals, fitness level, available equipment, days per week, any injuries or PAR-Q flags — and Claude generates a complete multi-week program instantly. The coach remains in control: they review, edit, and approve before anything reaches the client.

**Key capabilities (current):**
- Generate a full training block from a client's intake form and coach guidelines
- Iterative regeneration — accept coach feedback on the first generation and produce an improved version with full context
- Pre-generate alternate exercises for every prescribed movement at creation time
- Draft check-in messages and progress summaries from logged data (Phase 2)
- Identify patterns across clients — e.g. high exercise swap rate signals poor programming fit (Phase 2)
- Auto-progress workouts week-over-week based on logged client performance (Phase 2)

### Client-Side Agent: The Workout Concierge (Deferred)

Originally planned for Phase 2, the client-side concierge has been deferred. The core friction points it was designed to solve — exercise swaps, session shortening, and injury routing — are already addressed by existing features:

- **Exercise swaps:** Pre-generated alternates provide one-tap swaps with no API call and full offline support. The full exercise search modal covers any remaining cases.
- **Session shortening:** Clients can skip exercises and complete workouts early. Most users naturally drop the last exercise or two when short on time.
- **Injury routing:** Pre-generated alternates often use different equipment and movement patterns. For anything beyond minor soreness, users should consult a professional — not an AI.

The concierge remains a potential future addition if real user feedback signals demand for conversational in-workout AI. It would use Claude API (Haiku) for low-latency responses within coach-defined guardrails. Building it before validating demand with paying users is premature.

### Pre-Generated Exercise Alternates

During program generation, the AI selects one alternate exercise for each prescribed movement — matching muscle group and movement pattern, preferring different equipment. Alternates are stored in `workout_template_exercises.alternate_exercise_ids` and generated at creation time.

Clients can swap to an alternate during a workout with one tap. No API call. No wait time. Works offline. This covers the majority of swap use cases (equipment unavailability) at zero marginal cost.

### AI Model Usage

| Layer | Technology | Why |
|---|---|---|
| Program Generation — Coach | Claude API (Sonnet) | Generates full training programs from intake data and coach guidelines. Sonnet's reasoning quality produces meaningfully better programs than faster models. |
| Program Generation — Solo | Claude API (Sonnet) | Same model for parity. Both user types deserve the same programming quality. |
| Client Concierge (Deferred) | Claude API (Haiku) | Low-latency, cost-efficient model for real-time in-workout interactions. Deferred — pre-generated alternates and existing UI cover the core use cases. |

### The Feedback Loop

Every client agent action is logged and surfaced in the coach dashboard. This creates a continuous feedback loop: the coach sees patterns across all clients, refines future programming accordingly, and the system gets smarter over time. Neither the coach nor the AI is operating in the dark.

---

## Client Features (Coached & Solo)

### Workout Experience

| Feature | Description | Priority |
|---|---|---|
| Today's Workout | See assigned or AI-generated workout for today on the home screen with one-tap start | Must Have |
| Live Set Logging | Log weight and reps for each set as they complete it — minimal taps | Must Have |
| Rest Timer | Built-in rest timer that starts automatically between sets | Must Have |
| Exercise Demo | Text instructions and form cues for each exercise. Muscle diagrams and media planned for Phase 2. | Must Have |
| Pre-Generated Alternates | Swap any exercise with a pre-generated alternate — one tap, no wait, works offline | Must Have |
| AI Concierge Agent | In-workout chat: swap exercise, shorten session, flag injury — instant AI response. Deferred — existing swap/skip features cover the core use cases. | Nice to Have |
| Add Notes | Leave a note on any set or session for the coach to see | Should Have |
| Session Summary | End-of-workout recap showing volume, PRs hit, duration and option to share to feed | Must Have |

### Progress Tracking

| Feature | Description | Priority |
|---|---|---|
| Personal Records | Auto-detected PRs for every exercise with history chart and celebration moment | Must Have |
| Volume Over Time | Weekly and monthly charts of total volume per muscle group | Must Have |
| Body Measurements | Log and track weight, body fat %, and custom measurements. Schema complete; UI planned. | Must Have |
| Workout Streaks | Consecutive week tracker with streak milestones and badges. Schema complete; UI planned. | Must Have |
| Program History | View all completed programs and compare training blocks over time | Should Have |
| 1RM Calculator | Estimated 1-rep max based on logged sets | Nice to Have |

---

## Social Feed

The social layer is what makes Magis sticky and defensible — and the bridge between solo users and coached clients. No coaching platform has it. No AI workout app has it. It is Magis's moat.

| Feature | Description | Priority |
|---|---|---|
| Post Workout | Share a completed session to the feed — one tap from the summary screen | Must Have |
| Auto-Summary Card | Posts automatically show exercises, top sets and PRs — no manual input | Must Have |
| Photo / Video | Attach a photo or short clip from the session | Must Have |
| Reactions | Like and emoji-react to posts — fire, strong, 100, clap etc. | Must Have |
| Comments | Leave comments on any post in the feed | Must Have |
| PR Celebration Card | Automatic highlight card when a client breaks a personal record | Must Have |
| Feed Filter | Filter feed by your coach's clients only, or all app users | Should Have |
| Coach Discovery | Uncoached users can browse and match with coaches from the feed (Phase 3) | Nice to Have |
| Leaderboards | Optional weekly volume or streak leaderboard across a coach's client group | Nice to Have |

---

## Onboarding Flows

The onboarding experience is tailored for each user type from the first screen. Messaging, screens, and calls to action diverge immediately. Getting this right is critical — a solo user who hits a 'find a coach' wall on sign-up will churn immediately, and a coach who sees a consumer-facing flow will doubt the platform's seriousness.

**Core principle:** Solo users and coaches never see the same onboarding. The app detects or asks user type at the very first screen and diverges immediately.

### Signup Onboarding (Solo + Coached Client)

**Goal:** From download to first logged set in under 5 minutes.

Both solo users and coached clients complete the same onboarding wizard at `/onboarding` (`OnboardingForm.tsx`). The wizard has 6 visible steps plus a health disclaimer interstitial:

1. **Profile** — full name (+ password fields for invited clients only; self-signup clients already set theirs during registration)
2. **Body metrics** — birthdate, gender, height, weight, training experience
3. *Health disclaimer interstitial* — user acknowledges Magis provides fitness suggestions, not medical advice (not counted as a step in the progress indicator)
4. **PAR-Q health screening** — 7 yes/no questions with optional notes
5. **Training goals** — primary goal, secondary goal, injuries/limitations
6. **Preferences** — days per week, session duration, training focus, equipment
7. **Review** — summary of all answers before submission

After submission, solo users receive an AI-generated program immediately. Coached clients are redirected to their home screen to await a coach-assigned program.

| Step | 🏋️ Solo / AI User | 👤 Coach |
|---|---|---|
| 1 | Sign up: 'Get a smarter workout. No coach needed.' — email or Apple/Google sign-in | Sign up: 'Grow your coaching business with AI.' — separate CTA from solo user flow |
| 2 | Complete signup onboarding wizard (see above) | Name, email, password — straight to dashboard. No mandatory wizard. |
| 3 | Claude generates a personalised 4-week program instantly — shown with explanation of the approach | Coach profile (speciality, style, photo) available via settings at any time |
| 4 | Result card with program title, day count and AI explanation — 'Start Training' button | Invite first client via email link or shareable coach code from dashboard |
| 5 | Home screen: Today's Workout visible — one tap to start | First program generation — enter client brief and watch Claude build a full program |
| 6 | Post-session: celebrate first completed workout, prompt to share to the social feed | Client accepts invite, completes intake, logs first workout — coach sees data in real time |
| 7 | Day 3 nudge: 'You hit a PR on bench press. 3 friends reacted.' — social hook lands naturally | Week 1 summary: coach sees client activity, PRs, and agent substitutions in the activity log |

### Coached Client Onboarding

Coached clients join via email invite (magic link) or self-signup with a coach code. They complete the same signup onboarding wizard as solo users, ensuring coaches receive accurate, first-party health and preference data directly from the client.

1. Coach sends email invite or shares their coach code (format: `XXXXX-YYY`)
2. Client clicks invite link or enters coach code during self-signup — creates account
3. Client completes signup onboarding wizard (6 steps + disclaimer — see above)
4. Intake data saved with coach ID — visible on coach dashboard immediately
5. Client sees their assigned program waiting — coach's name visible throughout
6. Client taps to start today's workout — lands directly in the live logging screen
7. Post-session: session summary shown, prompt to share to the social feed

The coached client experience is deliberate: the client does their own intake so the coach receives accurate, first-party health data. The program is already there. The coach has done the work. The client's only job is to show up and log.

### Re-Intake Flow

When a coach enrolls as their own client (via `EnrollAsClientButton`) or requests an intake refresh, a shorter 4-step re-intake wizard is shown at `/onboarding/intake` (`IntakeForm.tsx`). Profile and body metrics are pulled from the existing `profiles` row, so the wizard skips straight to:

1. **PAR-Q health screening**
2. **Training goals**
3. **Preferences**
4. **Review**

### Onboarding Messaging by User Type

| Moment | Solo User Message | Coach Message |
|---|---|---|
| App store listing | A smarter workout. Built for you by AI. Join the community. | Scale your coaching. AI programs in seconds. More clients, less admin. |
| Sign-up headline | Get a personalised workout plan — no coach needed. | Grow your coaching business with AI-powered programming. |
| After program generation | Your program is ready. Here's why we built it this way. | Program generated. Review and publish — or keep editing. |
| First PR | You just hit a new personal record. Share it with the community. | Your client just hit a new PR. They've been notified — go celebrate with them. |
| Upgrade prompt (solo user) | Want a coach to take this further? Find your match on Magis. | — (not applicable) |
| Retention nudge (Day 7) | 3 of your friends trained this week. Your streak is at 7 days. | 2 clients haven't logged this week. Send them a check-in? |

---

## Pricing Model

Magis operates a two-sided pricing model: coaches pay a tiered SaaS subscription based on client volume, and solo users pay a flat monthly or annual subscription. Coach pricing is structured so that the per-client cost decreases at each tier — rewarding loyalty, incentivising growth, and making Magis increasingly valuable as a coach's business scales on the platform.

### Coach Pricing — Tiered by Client Volume

| Tier | Active Clients | Monthly Price | Per Client | Best For |
|---|---|---|---|---|
| Starter | Up to 10 | $49/month | $4.90 | New online coaches |
| Growth | Up to 25 | $99/month | $3.96 | Established coaches |
| Pro | Up to 50 | $179/month | $3.58 | Full-time coaches |
| Elite | Up to 100 | $299/month | $2.99 | High-volume coaches |
| Enterprise | 100+ | Custom | Custom | Gym chains / studios |

All coach tiers include a 14-day free trial — no credit card required. Coaches who invite 5+ clients within their first 30 days get month one free. This incentivises coaches to migrate their full client roster immediately rather than hedging with a few test clients.

### Solo / AI User Pricing

| Plan | Price | Billed | Notes |
|---|---|---|---|
| Monthly | $9.99/month | Monthly — cancel anytime | |
| Annual | $79.99/year (~$6.67/month) | Annually — 33% saving vs monthly | Best value |

Solo users who match with a coach through the in-app discovery layer (Phase 3) transition to the coached client experience. Their solo subscription lapses and they are covered under the coach's active client count.

### Revenue Stream Summary

| Revenue Stream | Source | Active From |
|---|---|---|
| Coach SaaS subscriptions | Tiered monthly/annual fees from coaches | Phase 1 — primary revenue at launch |
| Solo user subscriptions | Monthly/annual fees from AI-only users | Phase 2 — opens with the social layer |
| Coach-client matching fee | % commission on first month of a matched coaching relationship | Phase 3 — matching feature launch |
| Enterprise / gym contracts | Custom pricing for studios and multi-coach operations | Phase 4 — at scale |

---

## Data Ownership & Portability

Magis owns platform data. This is the deliberate commercial decision — it keeps coaches and clients on the platform, prevents easy export to competitors, and allows Magis to build proprietary aggregate insights over time. One legal constraint applies regardless of Terms of Service: GDPR.

**GDPR compliance:** EU users have a statutory right to data portability under Article 20 of the GDPR regardless of Terms of Service. Magis must be technically able to export a user's personal workout history on request. Build this export capability into the data model from day one — but do not surface it prominently in the product UI.

### Data Ownership Rules

| Data Type | Ownership & Storage | What Happens If They Leave |
|---|---|---|
| Workout logs, sets, reps, PRs | Magis — stored in Supabase, linked to user account | Account deactivated. Data retained 90 days then purged. GDPR export available on request. |
| Coach-created programs & templates | Magis — built using Magis editor and infrastructure | Programs remain on platform. Coach loses access when subscription lapses. |
| Client-coach relationship & session notes | Magis — the connection, history and notes are platform data | Relationship archived. Coach retains anonymised aggregate stats. Client retains own logs. |
| Social feed posts | Magis — posts are platform content | Posts remain visible unless user requests deletion. Account deletion removes all posts. |
| Body measurements & health data (incl. PAR-Q) | Magis — with GDPR portability obligation | Available for GDPR export on request. Deleted on account deletion. |
| Coach's client contact list (names, emails) | Coach — this is their business data, not platform data | Coach can export their client list at any time. This is the one deliberate exception. |

The exception for coach client contact lists is intentional. Restricting coaches from accessing their own client names and emails would create legitimate bad faith and is an unreasonable platform lock-in. What stays on Magis is the workout data, program history, and platform activity — the proprietary value Magis has created.

---

## Social Feed Architecture

The social feed operates across three tiers of visibility. Users choose where each post appears at the time of posting — not via a profile-level setting. This per-post control gives users granularity, encourages Global posts for milestone moments, and produces a healthier mix of content across all three feeds.

Database schema for the social feed is complete (feed_posts, feed_groups, user_follows tables). UI implementation is Stage 3.

| Feed | Who Sees It | Who Can Post | Primary Purpose |
|---|---|---|---|
| 🤝 Friends | Mutual connections — users must follow each other to see posts | Any user. Default setting for new users. | Low-stakes, high-trust sharing with people you know. Accountability without performance pressure. |
| 👥 Groups | Members of a specific group only — coach client rosters or challenge groups | Group members. Coaches create groups; users can create challenge groups. | Community within a coaching relationship or shared challenge. Home of coach-run leaderboards and challenges. |
| 🌐 Global | All Magis users. Opt-in — selected per post, not at profile level. | Any user who chooses Global when posting. No blanket opt-in required. | Platform-wide community and discovery. The public face of Magis. Where big PRs, streaks and transformations live. |

### Why Per-Post (Not Profile-Level) Global Sharing

A profile-level Global toggle — on or off — means most users will leave it off, starving the Global feed of content. Per-post selection means users naturally share their best moments globally (a big PR, a streak milestone) while keeping routine sessions within Friends. The result is a Global feed full of high-quality, high-engagement content rather than every workout from every user who forgot to toggle a setting.

### Groups — Structure & Rules

- Groups are created by coaches (for their client roster) or any Magis user (for challenges)
- A coach client group is created automatically when a coach invites their first client — all future clients are added to it by default
- Challenge groups are created by any user: they set a name, duration, goal metric (e.g. total weekly volume, consecutive streak), and invite members via link
- A user can belong to multiple groups simultaneously — a client may be in their coach's group and a friend's challenge group at the same time
- Each group has its own feed, optional leaderboard, and independent notification settings
- Phase 4: coaches can run paid challenges open to non-clients via the Global feed — a growth and monetisation tool for coaches

### Feed Feature Table

| Feature | Description | Priority |
|---|---|---|
| Friends Feed | Posts from mutual connections — default view for new users | Must Have |
| Groups Feed | Posts visible to group members only — coach client groups auto-created on first invite | Must Have |
| Global Feed | All Magis users — opt-in per post at time of sharing | Must Have |
| Per-Post Visibility Selector | Choose Friends / Group / Global each time you post — not a profile toggle | Must Have |
| Group Creation | Coach or user creates a group with name, goal and invite link | Must Have |
| Auto Client Group | Coach's client group created automatically when first client is invited | Must Have |
| Group Leaderboard | Optional weekly ranking within a group by volume, PRs or streak | Should Have |
| Challenge Groups | Time-boxed groups with a shared goal metric, leaderboard and end date | Should Have |
| Global Feed Explore Tab | Trending posts, top coaches and PR celebrations from the Global feed | Nice to Have |
| Paid Coach Challenges | Coaches run paid challenges open to non-clients via Global feed discovery | Nice to Have |

---

## Offline & Connectivity

Gyms frequently have poor wifi and patchy cell signal. Magis uses a local-first architecture — all workout data is written to device storage immediately and synced to Supabase when connectivity is restored. From the client's perspective, the app never fails to save a set.

Database schema includes `sync_status` fields (pending/synced/conflict) on `workout_sessions` and `set_logs`. IndexedDB storage, service worker, and offline queue implementation are planned for Phase 2.

### What Works Offline

| Feature | Description | Priority |
|---|---|---|
| View today's workout | Workout data is cached to device on last sync — always available offline | Must Have |
| Log sets, reps and weight | Written immediately to local storage — synced to Supabase on reconnect | Must Have |
| Rest timer | Runs entirely on device — no connection required | Must Have |
| View exercise demos | Cached on first load — available offline after first visit | Must Have |
| Session summary | Generated from local data — displayed immediately after session ends | Must Have |
| Pre-generated exercise alternates | Stored locally at program download — swap works fully offline | Must Have |
| AI concierge agent | Deferred. Would require connection. If built, fails gracefully: 'You're offline. Your request will send when you reconnect.' | Nice to Have |
| Social feed posting | Post queued locally and sent on reconnect — user sees: 'Your post will go live when you're back online.' | Should Have |

### Sync & Conflict Resolution

When connection is restored, local data syncs to Supabase silently in the background. The conflict resolution rule is last-write-wins by timestamp — the most recent entry for any given set takes precedence. This is the simplest rule and appropriate for workout logging, where genuine simultaneous conflicts across two devices are extremely rare.

---

## Build Plan

Four focused stages. Get real feedback from coaches and clients before building the more complex pieces.

### Stage 1: Foundation — Complete

User type branching, coach dashboard, client management, 6-step intake wizard with PAR-Q, AI program generation with Sonnet, regeneration feedback loop, program draft/publish workflow, pre-generated alternates, live set logging, rest timer, session summary, coach notes, intake request flow, multi-role support, deload week support.

### Stage 2: Progress & Offline — In Progress

- ~~Personal records history chart~~ ✅ Complete
- ~~Volume over time charts (weekly + monthly by muscle group)~~ ✅ Complete
- ~~Workout streaks UI and milestone badges~~ ✅ Complete
- ~~Body measurements UI~~ ✅ Complete
- ~~Free workout with cardio support~~ ✅ Complete
- ~~Client program overview~~ ✅ Complete
- Offline-first architecture (IndexedDB, service worker, sync queue)
- Exercise muscle diagrams and media
- Auto-progression logic (agent adjusts load week-over-week)
- Check-in draft generation for coaches

### Stage 3: Social Feed — Planned

- Post-workout share to feed (one tap from summary screen)
- Auto-generated workout summary cards with PRs and top sets
- Photo and video upload
- Reactions and comments
- PR celebration cards with coach and peer notifications
- Push notifications for reactions, comments and PR celebrations
- Feed filter — coach's clients vs. all users
- Group creation and auto client group on first invite

### Stage 4: Polish & Scale — Planned

- Client-side AI concierge agent (exercise swap, session shortening, injury routing via Haiku) — deferred from Stage 2, build only if real user demand signals justify it
- Agent guardrail configuration for coaches — depends on concierge
- Coach-client matching and discovery layer
- Program Library and template reuse
- Onboarding A/B testing — optimise time-to-first-logged-set for solo users
- Group leaderboards and challenge groups
- Custom coach branding (logo and colours)
- Magis Payments — coach invoicing and subscription management through the platform
- Analytics dashboard for coaches — retention, volume trends, churn signals
- Paid coach challenges via Global feed

---

## Recommended Tech Stack

Well-supported by Claude Code, cheap to run at beta scale, grows comfortably from 8 to 800+ clients without rebuilding.

| Layer | Technology | Why |
|---|---|---|
| Frontend | Next.js | Mobile-optimised web app — single codebase for coach, coached client and solo user views with role-based routing |
| Database & Auth | Supabase | Free tier handles authentication and real-time updates for the social feed; row-level security for multi-tenant coach data |
| Hosting | Vercel | Free tier, automatic deployments, fast globally — zero DevOps overhead at launch |
| AI — Program Generation | Claude API (Sonnet) | Generates training programs from intake data and coach guidelines. Used for both coach and solo flows. |
| AI — Client Concierge (Deferred) | Claude API (Haiku) | Low-latency, cost-efficient model for real-time in-workout substitutions and concierge responses. Deferred — not needed at launch. |
| Media Storage | Supabase Storage | Photo and video uploads for the social feed, integrated with the same project |
| Push Notifications | Expo (Phase 3) | Native app wrapper for true push notifications when the product is proven |

---

## App Store & Legal Compliance

Because Magis generates personalised workout programs using AI — and accepts health data including PAR-Q screening, injuries, and fitness level during onboarding — it faces heightened scrutiny from both the Apple App Store and Google Play. The PAR-Q implementation strengthens the compliance posture by aligning with industry-standard fitness screening rather than ad-hoc health questions.

### Language Rules for App Store Listings

| ❌ Avoid These Words | ✅ Use These Instead |
|---|---|
| Treatment, rehabilitation, therapeutic | Training, programming, fitness |
| Medical advice, health guidance | Workout suggestions, fitness recommendations |
| Heals, repairs, corrects (injuries) | Works around, adapts to, accommodates |
| Diagnose, assess (health conditions) | Personalise, tailor, customise |
| AI doctor, AI trainer (overstated) | AI-powered fitness programming |

### Required Disclaimers — Build These In From Day One

| Feature | Description | Priority |
|---|---|---|
| Health Disclaimer Screen | Shown once during onboarding — users explicitly acknowledge that Magis provides fitness suggestions, not medical advice. Requires a tap to confirm. | Must Have |
| AI Response Disclaimer | A short, non-intrusive line appended to any AI concierge response that touches injuries or health: 'This is a fitness suggestion, not medical advice. If you have concerns, consult a healthcare professional.' Required if concierge is built. | Nice to Have |
| Injury Routing Caveat | When the client agent routes around an injury, the response must include a prompt to seek professional assessment for anything beyond minor muscle soreness. Required if concierge is built. | Nice to Have |
| Program Disclaimer Footer | Every AI-generated program includes a one-line footer: 'Generated by AI based on the information you provided. Always train within your limits and consult a professional if unsure.' | Must Have |
| PAR-Q Acknowledgement | Users confirm PAR-Q responses are accurate and understand that flagged conditions should be reviewed with a healthcare professional before beginning a training program. | Must Have |
| Privacy Disclosure for Health Data | Fitness level, PAR-Q responses, injury history, and body measurements are sensitive health data under GDPR and Apple's privacy nutrition labels. These must be declared in your privacy policy and App Store privacy disclosures. | Must Have |
| Coach Liability Separation | The app should make clear that coach-assigned programs are the responsibility of the coach, and AI-generated programs are fitness suggestions. This separation matters legally and in App Store review. | Should Have |

### Practical Submission Tips

- Submit to TestFlight (Apple) and Google Play internal testing well before your intended launch date — reviewer queues can take 1-7 days, and rejection requires resubmission
- Review Fitbod, Future, and Ladder's App Store listings before writing yours — they have successfully navigated this and their language is a useful benchmark
- Include a reviewer note in your App Store submission explaining that Magis is a fitness programming tool, not a medical device, and pointing to your disclaimer screens — this pre-empts the most common flags
- Do not request access to HealthKit (Apple Health) or Google Fit unless you genuinely need it — it adds another layer of review and is not required for Magis's core features
- If a submission is rejected, read the specific guideline cited carefully before resubmitting — most AI fitness app rejections come down to language in the listing or a missing disclaimer, both of which are quick fixes

---

## Estimated Running Costs

Free to run while testing. Scales proportionally and stays minimal even at 100+ clients.

| Service | Beta (8 clients) | 100+ Clients | Notes |
|---|---|---|---|
| Vercel (hosting) | Free | ~$20/month | Pro plan at scale |
| Supabase (database + auth + storage) | Free | ~$25/month | Pro plan at scale |
| Claude API — Coach (Sonnet) | ~$3–6/month | ~$25–45/month | Per program generation + regeneration |
| Claude API — Client (Haiku, Deferred) | ~$0/month | ~$10–20/month | Per concierge interaction if built |
| Domain name | $12/year | $12/year | One-time annual |
| **Total** | **~$0–8/month** | **~$60–100/month** | |

---

## Next Steps

1. **Complete Stage 2 with Claude Code.** Progress charts, volume, streaks, body measurements, free workout cardio, and client program overview are done. Remaining priority order:
   - Offline-first architecture — IndexedDB, service worker, sync queue. The `sync_status` infrastructure in the schema is ready; build the client-side layer.
   - Exercise media — muscle diagrams and GIFs for each exercise. Source or create assets, attach to exercise records.
   - Auto-progression logic — agent adjusts load/reps week-over-week based on logged performance.
   - Check-in draft generation — AI-drafted weekly summaries for coaches based on client activity data.

2. **Get one real coach and their clients logging workouts before building Stage 3.** Real feedback beats assumed requirements every time.

3. **Begin Stage 3 (Social Feed) once Stage 2 is validated.** The database schema is already in place — the work is UI and notification infrastructure.

4. **Validate pricing with coaches before building Magis Payments.** Confirm willingness to pay at the proposed tiers before building billing infrastructure.

---

*Built for Magis | v5 | March 2026 | Confidential*
