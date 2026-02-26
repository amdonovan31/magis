# MAGIS
## Product Feature Specification & Build Plan
**AI-Powered Personal Training Platform | v4 | February 2026**

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
| **Pays for** | Magis AI subscription (monthly or annual) | Coach fee (handled outside or via Magis Payments — Phase 3) | Magis coach SaaS plan |
| **Path to next tier** | Discovers coaching via feed and matching feature → becomes coached client | Becomes a loyal long-term client; may eventually coach others | Brings clients → clients recruit friends → community grows |

**Key principle:** the Solo / AI tier is a genuinely excellent standalone product — not a degraded trial. These users are your future coached clients. If the AI-only experience is mediocre, the conversion never happens.

---

## Who Uses This App

### 👤 Coach
- Generate full training programs with AI in seconds
- Review, edit and assign programs to clients
- Monitor all client progress from one dashboard
- Manage client profiles, notes and history
- Scale to more clients without more admin hours

### 🏋️ Solo User / Coached Client
- Get an AI-generated program or view coach-assigned workouts
- Log workouts in real time with minimal friction
- Get instant AI answers — swap exercises, shorten sessions
- Track personal records, volume trends and streaks
- Post workouts to the social feed and build community
- Connect with a coach via in-app matching (Phase 3)

---

## Competitive Positioning

Magis occupies a gap no current product fills. Solo users need a community. Coached clients need less friction. Coaches need to scale. No single platform serves all three.

| | Magis | Fitbod | Everfit / TrueCoach | Strava |
|---|---|---|---|---|
| Human Coaching | ✅ | ❌ | ✅ | ❌ |
| AI Program Generation | ✅ | ✅ | ❌ | ❌ |
| AI Solo Tier (no coach needed) | ✅ | ✅ | ❌ | ❌ |
| Client AI Agent (self-serve) | ✅ | Partial | ❌ | ❌ |
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
| AI Program Generator | Enter goals, equipment, days/week, fitness level — Claude generates a personalised multi-week program instantly | Must Have |
| Live Set Logging | Log weight and reps for each set with minimal taps | Must Have |
| Rest Timer | Auto-starts between sets | Must Have |
| Exercise Demo | Instructions, muscle diagrams and form cues for every exercise | Must Have |
| AI Concierge | In-workout agent: swap exercise, shorten session, explain why — instant Claude response | Must Have |
| Personal Records | Auto-detected PRs with history chart and celebration moment | Must Have |
| Volume Charts | Weekly and monthly volume by muscle group | Must Have |
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
- The client agent operates visibly within guardrails the coach configures — coaches control what the AI can and cannot change on their behalf
- The agent activity log shows every substitution and session change the AI made — coaches stay informed, never bypassed
- All client data belongs to the coach — if they leave Magis, they take it with them

### Coach Tier Feature Set

| Feature | Description | Priority |
|---|---|---|
| Claude AI Generator | Generate a full 4-8 week program from a short client intake form in seconds | Must Have |
| In-App Program Editor | Edit exercises, sets, reps, rest periods and notes after AI generation before assigning | Must Have |
| Program Library | Save programs as reusable templates across similar clients | Must Have |
| One-Click Assign | Assign any saved program to a client with a start date | Must Have |
| Agent Guardrail Config | Set per-client rules for what the AI can and cannot change autonomously | Must Have |
| Agent Activity Log | See every AI substitution or session change made on behalf of each client | Must Have |
| Client List Dashboard | All clients with status, current program, last active date and streak | Must Have |
| Client Profile | Individual view with history, measurements, progress charts and coaching notes | Must Have |
| Add / Invite Client | Invite new clients via email link to create their account | Must Have |
| Auto-Progression Logic | Agent auto-adjusts load and reps week-over-week based on logged performance | Should Have |
| Check-In Drafts | AI-drafted weekly check-in messages based on each client's activity data | Should Have |
| Progress Overview | See all clients' PRs, volume trends and streak data at a glance | Should Have |
| Custom Exercises | Add your own exercises with coaching notes and video links | Should Have |
| Coach Branding | Your logo and colours on the client-facing experience | Nice to Have |

---

## The Two-Sided AI Agent

The AI agent is the core differentiator of Magis. It operates differently depending on who is using it — solving fundamentally different problems for coaches and clients.

### Coach-Side Agent: The Programming Assistant

Coaches provide a client brief — goals, fitness level, available equipment, days per week, any injuries — and Claude generates a complete multi-week program instantly. The coach remains in control: they review, edit, and approve before anything reaches the client.

**Key capabilities:**
- Generate a full 4-8 week training block from a short client intake form
- Auto-progress workouts week-over-week based on logged client performance
- Suggest session adjustments when a client misses a day, reports fatigue, or flags an injury
- Draft check-in messages and progress summaries from logged data
- Identify patterns across clients — e.g. high exercise swap rate signals poor programming fit

### Client-Side Agent: The Workout Concierge

Clients hit friction constantly — wrong equipment, short on time, something hurts. Without an agent they skip the workout or message their coach and wait. With Magis they get an instant answer, within the parameters the coach has set.

**Key capabilities:**
- "Swap this exercise" — substitutes an appropriate alternative based on equipment and muscle group
- "I only have 30 minutes" — condenses the session intelligently, preserving training stimulus
- "My shoulder is bothering me" — routes around the issue within coach-defined guardrails
- Explains why an exercise is in the program — building trust and adherence

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
| Exercise Demo | Instructions and muscle diagrams for each exercise | Must Have |
| AI Concierge Agent | In-workout chat: swap exercise, shorten session, flag injury — instant AI response | Must Have |
| Add Notes | Leave a note on any set or session for the coach to see | Should Have |
| Session Summary | End-of-workout recap showing volume, PRs hit, duration and option to share to feed | Must Have |

### Progress Tracking

| Feature | Description | Priority |
|---|---|---|
| Personal Records | Auto-detected PRs for every exercise with history chart and celebration moment | Must Have |
| Volume Over Time | Weekly and monthly charts of total volume per muscle group | Must Have |
| Body Measurements | Log and track weight, body fat %, and custom measurements | Must Have |
| Workout Streaks | Consecutive week tracker with streak milestones and badges | Must Have |
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

The onboarding experience is different for each user type. Messaging, screens, and calls to action are tailored from the first moment. Getting this right is critical — a solo user who hits a 'find a coach' wall on sign-up will churn immediately, and a coach who sees a consumer-facing flow will doubt the platform's seriousness.

**Core principle:** Solo users and coaches never see the same onboarding. The app detects or asks user type at the very first screen and diverges immediately.

### Solo / AI User Onboarding

**Goal:** From download to first logged set in under 5 minutes.

| Step | 🏋️ Solo / AI User | 👤 Coach |
|---|---|---|
| 1 | Sign up screen: 'Get a smarter workout. No coach needed.' — email or Apple/Google sign-in | Sign up screen: 'Grow your coaching business with AI.' — separate CTA from solo user flow |
| 2 | 3-question intake: What are your goals? What equipment do you have? How many days per week? | Coach profile setup: name, speciality, coaching style, photo — this is their public brand on Magis |
| 3 | AI generates a personalised 4-week program instantly — shown on screen with explanation of why | Connect or invite first client via email link — no value until first client is on the platform |
| 4 | Preview first workout — see exercises, sets, reps and rest periods before committing | First program generation — enter a sample client brief and watch Claude build a full program |
| 5 | Prompt to start today's workout — lands directly in the live logging screen | Assign program to client with a start date — coaches see the full coach dashboard for the first time |
| 6 | Post-session: celebrate first completed workout, prompt to share to the social feed | Client accepts invite and logs first workout — coach sees data appear in their dashboard in real time |
| 7 | Day 3 nudge: 'You hit a PR on bench press. 3 friends reacted.' — social hook lands naturally | Week 1 summary: coach sees client activity, PRs, and any AI agent substitutions in the activity log |

### Coached Client Onboarding

Coached clients do not sign up independently — they are invited by their coach. This simplifies their onboarding considerably.

1. Coach sends email invite from the dashboard — client receives a personalised link branded with the coach's name
2. Client clicks link, creates an account in two taps — name, email, password. No intake form (coach has already done this on their behalf)
3. Client sees their assigned program waiting — coach's name and photo visible throughout
4. Client taps to start today's workout — lands directly in the live logging screen
5. Post-session: session summary shown, prompt to share to the social feed

The coached client experience is deliberately minimal at sign-up. The program is already there. The coach has done the work. The client's only job is to show up and log.

### Onboarding Messaging by User Type

| Moment | Solo User Message | Coach Message |
|---|---|---|
| App store listing | A smarter workout. Built for you by AI. Join the community. | Scale your coaching. AI programs in seconds. More clients, less admin. |
| Sign-up headline | Get a personalised workout plan — no coach needed. | Grow your coaching business with AI-powered programming. |
| After program generation | Your program is ready. Here's why we built it this way. | Program generated. Review and assign — or save it as a template. |
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
| Body measurements & health data | Magis — with GDPR portability obligation | Available for GDPR export on request. Deleted on account deletion. |
| Coach's client contact list (names, emails) | Coach — this is their business data, not platform data | Coach can export their client list at any time. This is the one deliberate exception. |

The exception for coach client contact lists is intentional. Restricting coaches from accessing their own client names and emails would create legitimate bad faith and is an unreasonable platform lock-in. What stays on Magis is the workout data, program history, and platform activity — the proprietary value Magis has created.

---

## Social Feed Architecture

The social feed operates across three tiers of visibility. Users choose where each post appears at the time of posting — not via a profile-level setting. This per-post control gives users granularity, encourages Global posts for milestone moments, and produces a healthier mix of content across all three feeds.

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

### What Works Offline

| Feature | Description | Priority |
|---|---|---|
| View today's workout | Workout data is cached to device on last sync — always available offline | Must Have |
| Log sets, reps and weight | Written immediately to local storage — synced to Supabase on reconnect | Must Have |
| Rest timer | Runs entirely on device — no connection required | Must Have |
| View exercise demos | Cached on first load — available offline after first visit | Must Have |
| Session summary | Generated from local data — displayed immediately after session ends | Must Have |
| AI concierge agent | Requires connection. Fails gracefully: 'You're offline. Your request will send when you reconnect.' | Must Have |
| Social feed posting | Post queued locally and sent on reconnect — user sees: 'Your post will go live when you're back online.' | Should Have |

### Sync & Conflict Resolution

When connection is restored, local data syncs to Supabase silently in the background. The conflict resolution rule is last-write-wins by timestamp — the most recent entry for any given set takes precedence. This is the simplest rule and appropriate for workout logging, where genuine simultaneous conflicts across two devices are extremely rare.

| Scenario | System Behaviour | User Experience |
|---|---|---|
| Connection lost mid-workout | Sets continue writing to local storage uninterrupted | No interruption — app behaves normally |
| Connection restored mid-workout | Local data syncs silently in background | User sees nothing — sync is invisible |
| App closed before sync completes | Local data persists on device — syncs on next app open | No data lost under any circumstances |
| Same session logged on two devices | Last-write-wins by timestamp | Most recent entry kept — edge case in practice |
| AI concierge requested offline | Request queued locally — sent on reconnect | 'You're offline' message shown in concierge UI |

---

## Go-To-Market Strategy

Magis launches coach-first. This is the most capital-efficient path to growth and the approach most likely to produce a durable network.

### Phase 1: Coach Beachhead

Target independent online coaches who are already paying for tools like Everfit or TrueCoach. These coaches feel the administrative pain most acutely and are easiest to convert. The pitch is simple: generate programs in seconds, not hours — and your clients never have to wait on you for a workout swap.

**Validation milestone before building:** secure 10 coach letters of intent or paid early-access deposits. If coaches will pay before the product exists, the problem is real.

### Phase 2: Solo / AI Tier Opens + Social Layer

Once the coaching product is proven, open the AI solo tier and social feed to non-coached users. Clients invite friends. Friends join the feed, see the community, and encounter Magis organically. The solo tier and social layer are self-funding growth — no paid acquisition required.

### Phase 3: Coach-Client Matching

Once both sides have density — coaches with track records on the platform and solo users engaged in the community — launch the matching feature. Solo users who have been active for 60+ days are warm leads. The conversion from solo user to coached client is the business model at scale.

This mirrors how the best marketplace businesses are built: solve one side excellently, let the network grow organically, then monetise the connection between the two sides.

---

## Build Plan

Four focused stages. Get real feedback from coaches and clients before building the more complex pieces.

### Stage 1: Foundation (2-3 weeks)
- User type selection at sign-up — coach vs. solo / AI user — diverging flows from first screen
- Coach: accounts, client management dashboard, exercise library, manual program builder, assign to clients
- Solo user: accounts, 3-question AI intake form, Claude generates first program, live set logging
- Rest timer and session summary screen for both user types

### Stage 2: AI & Progress (2-3 weeks)
- Claude AI program generator for coaches — client intake form to full program
- In-app program editor after AI generation
- Client-side AI concierge agent — exercise swap, session shortening, injury routing with coach guardrails
- Agent activity log in coach dashboard
- Personal records detection and history chart
- Volume over time charts (weekly and monthly)
- Body measurements logging and workout streaks

### Stage 3: Social Feed (2 weeks)
- Post-workout share to feed — one tap from summary screen
- Auto-generated workout summary cards with PRs and top sets
- Photo and video upload
- Reactions and comments
- PR celebration cards with coach and peer notifications
- Push notifications for reactions, comments and PR celebrations
- Feed filter — coach's clients vs. all users

### Stage 4: Polish & Scale (Ongoing)
- Auto-progression logic in the coach-side agent
- Coach-client matching and discovery layer
- Onboarding A/B testing — optimise time-to-first-logged-set for solo users
- Leaderboards and challenges
- Custom coach branding (logo and colours)
- Magis Payments — coach invoicing and subscription management through the platform
- Analytics dashboard for coaches — retention, volume trends, churn signals

---

## Recommended Tech Stack

Well-supported by Claude Code, cheap to run at beta scale, grows comfortably from 8 to 800+ clients without rebuilding.

| Layer | Technology | Why |
|---|---|---|
| Frontend | Next.js | Mobile-optimised web app — single codebase for coach, coached client and solo user views with role-based routing |
| Database & Auth | Supabase | Free tier handles authentication and real-time updates for the social feed; row-level security for multi-tenant coach data |
| Hosting | Vercel | Free tier, automatic deployments, fast globally — zero DevOps overhead at launch |
| AI — Coach Agent | Claude API (Sonnet) | Generates training programs from intake data; drafts check-in messages; surfaces client patterns |
| AI — Client Agent | Claude API (Haiku) | Low-latency, cost-efficient model for real-time in-workout substitutions and concierge responses |
| Media Storage | Supabase Storage | Photo and video uploads for the social feed, integrated with the same project |
| Push Notifications | Expo (Phase 3) | Native app wrapper for true push notifications when the product is proven |

---

## App Store & Legal Compliance

Because Magis generates personalised workout programs using AI — and accepts health data like injuries and fitness level during onboarding — it faces heightened scrutiny from both the Apple App Store and Google Play. This is not a barrier, but it requires deliberate attention from the start rather than retrofitting before submission.

### Why AI Fitness Apps Face Extra Review

Both stores apply closer review to apps that could be considered medical or health tools. An AI that generates training programs based on a user's injuries, fitness level, and goals occupies an ambiguous space between fitness tool and health recommendation. Apple and Google are acutely aware that their platforms facilitate these interactions, and they've become more cautious as AI-generated health content has proliferated.

The FDA also has guidance on AI-powered health software in the US, and the EU has its own Medical Device Regulation (MDR). While a fitness programming app is unlikely to be classified as a medical device, the intake questions Magis asks — especially around injuries and health conditions — can make reviewers look more closely.

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
| Health Disclaimer Screen | Shown once during onboarding — users explicitly acknowledge that Magis provides fitness suggestions, not medical advice, and should consult a professional for health concerns. Requires a tap to confirm. | Must Have |
| AI Response Disclaimer | A short, non-intrusive line appended to any AI concierge response that touches injuries or health: 'This is a fitness suggestion, not medical advice. If you have concerns, consult a healthcare professional.' | Must Have |
| Injury Routing Caveat | When the client agent routes around an injury, the response must include a prompt to seek professional assessment for anything beyond minor muscle soreness. | Must Have |
| Program Disclaimer Footer | Every AI-generated program includes a one-line footer: 'Generated by AI based on the information you provided. Always train within your limits and consult a professional if unsure.' | Must Have |
| Privacy Disclosure for Health Data | Fitness level, injury history, and body measurements are sensitive health data under GDPR and Apple's privacy nutrition labels. These must be declared in your privacy policy and App Store privacy disclosures. | Must Have |
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
| Claude API — Coach (Sonnet) | ~$3-6/month | ~$25-45/month | Per program generation |
| Claude API — Client (Haiku) | ~$1-2/month | ~$10-20/month | Per agent interaction |
| Domain name | $12/year | $12/year | One-time annual |
| **Total** | **~$0-8/month** | **~$60-100/month** | |

---

## Next Steps

1. **Validate with coaches before building.** Reach out to 10 independent online coaches and ask if they'd pay for early access. If yes, you have product-market fit before writing a line of code.
2. **Set up your environment.** Install Claude Code (claude.ai/code), create a free Supabase project, and connect a Vercel account. Under 30 minutes total.
3. **Begin Stage 1 with Claude Code.** Use this document as your brief. Start with the user-type branching logic on sign-up — it is the foundation everything else is built on.
4. **Get one real coach and their clients logging workouts before building Stage 2.** Real feedback beats assumed requirements every time.

---

*Built for Magis | v4 | February 2026 | Confidential*
