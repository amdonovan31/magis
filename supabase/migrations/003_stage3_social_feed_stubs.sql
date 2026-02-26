-- ============================================================
-- Migration 003: Stage 3 — Social Feed Stub Tables
-- Three-tier feed architecture: Friends, Groups, Global.
-- Per-post visibility (not profile-level).
-- Designed per spec data ownership rules: posts are platform
-- content, retained unless user requests deletion.
-- ============================================================

-- -------------------------------------------------------
-- 1. feed_groups
--    Coach client groups (auto-created on first invite) and
--    user-created challenge groups.
-- -------------------------------------------------------
create table public.feed_groups (
  id              uuid primary key default gen_random_uuid(),
  created_by      uuid not null references public.profiles(id) on delete cascade,
  name            text not null,
  description     text,
  group_type      text not null check (group_type in ('coach_clients', 'challenge')),
  -- Challenge group fields (null for coach_clients)
  goal_metric     text,                      -- 'weekly_volume', 'streak', 'total_sessions', etc.
  starts_at       timestamptz,
  ends_at         timestamptz,
  invite_code     text unique,               -- shareable invite link code
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

create index feed_groups_created_by on public.feed_groups (created_by);

-- -------------------------------------------------------
-- 2. feed_group_members
--    A user can belong to multiple groups simultaneously.
-- -------------------------------------------------------
create table public.feed_group_members (
  id              uuid primary key default gen_random_uuid(),
  group_id        uuid not null references public.feed_groups(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  role            text not null default 'member' check (role in ('owner', 'admin', 'member')),
  joined_at       timestamptz not null default now(),
  unique (group_id, user_id)
);

create index feed_group_members_user on public.feed_group_members (user_id);

-- -------------------------------------------------------
-- 3. feed_posts
--    Per-post visibility: friends, group, or global.
--    Auto-summary cards generated from session data.
--    Posts are platform content per data ownership rules.
-- -------------------------------------------------------
create table public.feed_posts (
  id              uuid primary key default gen_random_uuid(),
  author_id       uuid not null references public.profiles(id) on delete cascade,
  -- Visibility: per-post, not profile-level
  visibility      text not null default 'friends'
                    check (visibility in ('friends', 'group', 'global')),
  group_id        uuid references public.feed_groups(id) on delete cascade,
  -- Content
  session_id      uuid references public.workout_sessions(id) on delete set null,
  body            text,                      -- optional user-written caption
  media_urls      text[],                    -- photo/video URLs from Supabase Storage
  -- Auto-generated summary card data (stored as JSON for flexibility)
  summary_card    jsonb,                     -- { exercises, topSets, prs, duration, totalVolume }
  is_pr_celebration boolean not null default false,
  -- Moderation / lifecycle
  is_deleted      boolean not null default false,  -- soft delete; hard delete on account deletion
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index feed_posts_author on public.feed_posts (author_id, created_at desc);
create index feed_posts_visibility on public.feed_posts (visibility, created_at desc)
  where is_deleted = false;
create index feed_posts_group on public.feed_posts (group_id, created_at desc)
  where group_id is not null and is_deleted = false;

-- -------------------------------------------------------
-- 4. feed_reactions
--    Emoji reactions: fire, strong, 100, clap, etc.
-- -------------------------------------------------------
create table public.feed_reactions (
  id              uuid primary key default gen_random_uuid(),
  post_id         uuid not null references public.feed_posts(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  reaction_type   text not null,             -- 'fire', 'strong', '100', 'clap', 'like'
  created_at      timestamptz not null default now(),
  unique (post_id, user_id, reaction_type)   -- one reaction type per user per post
);

create index feed_reactions_post on public.feed_reactions (post_id);

-- -------------------------------------------------------
-- 5. feed_comments
--    Comments on posts. Platform content per data ownership.
-- -------------------------------------------------------
create table public.feed_comments (
  id              uuid primary key default gen_random_uuid(),
  post_id         uuid not null references public.feed_posts(id) on delete cascade,
  author_id       uuid not null references public.profiles(id) on delete cascade,
  body            text not null,
  is_deleted      boolean not null default false,
  created_at      timestamptz not null default now()
);

create index feed_comments_post on public.feed_comments (post_id, created_at asc);

-- -------------------------------------------------------
-- 6. user_follows (for Friends feed — mutual connections)
-- -------------------------------------------------------
create table public.user_follows (
  id              uuid primary key default gen_random_uuid(),
  follower_id     uuid not null references public.profiles(id) on delete cascade,
  following_id    uuid not null references public.profiles(id) on delete cascade,
  created_at      timestamptz not null default now(),
  unique (follower_id, following_id),
  check (follower_id != following_id)
);

create index user_follows_follower on public.user_follows (follower_id);
create index user_follows_following on public.user_follows (following_id);

-- -------------------------------------------------------
-- Triggers
-- -------------------------------------------------------

create trigger feed_posts_updated_at
  before update on public.feed_posts
  for each row execute function public.set_updated_at();

-- -------------------------------------------------------
-- RLS for all social tables
-- -------------------------------------------------------

alter table public.feed_groups enable row level security;
alter table public.feed_group_members enable row level security;
alter table public.feed_posts enable row level security;
alter table public.feed_reactions enable row level security;
alter table public.feed_comments enable row level security;
alter table public.user_follows enable row level security;

-- feed_groups
create policy "Group members can view their groups"
  on public.feed_groups for select
  using (
    created_by = auth.uid()
    or exists (
      select 1 from public.feed_group_members
      where group_id = feed_groups.id and user_id = auth.uid()
    )
  );

create policy "Users can create groups"
  on public.feed_groups for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "Group owners can update their groups"
  on public.feed_groups for update
  using (created_by = auth.uid());

-- feed_group_members
create policy "Members can view group membership"
  on public.feed_group_members for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.feed_group_members m2
      where m2.group_id = feed_group_members.group_id and m2.user_id = auth.uid()
    )
  );

create policy "Group owners can manage members"
  on public.feed_group_members for all
  using (
    exists (
      select 1 from public.feed_groups
      where id = feed_group_members.group_id and created_by = auth.uid()
    )
  );

create policy "Users can join groups"
  on public.feed_group_members for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can leave groups"
  on public.feed_group_members for delete
  using (user_id = auth.uid());

-- feed_posts: three-tier visibility
create policy "Authors can manage their own posts"
  on public.feed_posts for all
  using (author_id = auth.uid());

create policy "Users can view global posts"
  on public.feed_posts for select
  using (visibility = 'global' and is_deleted = false);

create policy "Users can view friends posts (mutual follows)"
  on public.feed_posts for select
  using (
    visibility = 'friends'
    and is_deleted = false
    and exists (
      select 1 from public.user_follows f1
      join public.user_follows f2
        on f1.follower_id = f2.following_id and f1.following_id = f2.follower_id
      where f1.follower_id = auth.uid() and f1.following_id = feed_posts.author_id
    )
  );

create policy "Group members can view group posts"
  on public.feed_posts for select
  using (
    visibility = 'group'
    and is_deleted = false
    and exists (
      select 1 from public.feed_group_members
      where group_id = feed_posts.group_id and user_id = auth.uid()
    )
  );

-- feed_reactions
create policy "Anyone can view reactions on visible posts"
  on public.feed_reactions for select
  to authenticated
  using (true);

create policy "Users can manage their own reactions"
  on public.feed_reactions for all
  using (user_id = auth.uid());

-- feed_comments
create policy "Anyone can view comments on visible posts"
  on public.feed_comments for select
  to authenticated
  using (is_deleted = false);

create policy "Users can create comments"
  on public.feed_comments for insert
  to authenticated
  with check (author_id = auth.uid());

create policy "Users can manage their own comments"
  on public.feed_comments for update
  using (author_id = auth.uid());

-- user_follows
create policy "Users can view follows"
  on public.user_follows for select
  to authenticated
  using (follower_id = auth.uid() or following_id = auth.uid());

create policy "Users can manage their own follows"
  on public.user_follows for all
  using (follower_id = auth.uid());
