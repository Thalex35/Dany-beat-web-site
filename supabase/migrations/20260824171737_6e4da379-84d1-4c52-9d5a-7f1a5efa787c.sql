create type public.app_role as enum ('admin','user');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant select on public.profiles to anon;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles are viewable by everyone" on public.profiles for select using (true);
create policy "users update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "users insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "users read own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));

create or replace function public.update_updated_at_column()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)), new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.beats (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  genre text,
  mood text,
  bpm integer check (bpm is null or (bpm between 20 and 400)),
  song_key text,
  price numeric(10,2) not null default 0 check (price >= 0),
  licenses jsonb not null default '[]'::jsonb,
  tags text[] not null default '{}',
  cover_path text,
  preview_path text,
  master_path text,
  status text not null default 'draft' check (status in ('draft','published')),
  featured boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);
create index beats_status_idx on public.beats(status, published_at desc);
create index beats_genre_idx on public.beats(genre);
grant select on public.beats to anon, authenticated;
grant insert, update, delete on public.beats to authenticated;
grant all on public.beats to service_role;
alter table public.beats enable row level security;
create policy "published beats are public" on public.beats for select using (status = 'published' or public.has_role(auth.uid(),'admin'));
create policy "admins insert beats" on public.beats for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "admins update beats" on public.beats for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "admins delete beats" on public.beats for delete to authenticated using (public.has_role(auth.uid(),'admin'));
create trigger beats_updated_at before update on public.beats for each row execute function public.update_updated_at_column();

create table public.likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  beat_id uuid not null references public.beats(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, beat_id)
);
create index likes_beat_idx on public.likes(beat_id);
grant select on public.likes to anon, authenticated;
grant insert, delete on public.likes to authenticated;
grant all on public.likes to service_role;
alter table public.likes enable row level security;
create policy "likes are public" on public.likes for select using (true);
create policy "users create own likes" on public.likes for insert to authenticated with check (auth.uid() = user_id);
create policy "users delete own likes" on public.likes for delete to authenticated using (auth.uid() = user_id);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  beat_id uuid not null references public.beats(id) on delete cascade,
  content text not null check (char_length(btrim(content)) between 1 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index comments_beat_idx on public.comments(beat_id, created_at desc);
grant select on public.comments to anon, authenticated;
grant insert, update, delete on public.comments to authenticated;
grant all on public.comments to service_role;
alter table public.comments enable row level security;
create policy "comments are public" on public.comments for select using (true);
create policy "users create own comments" on public.comments for insert to authenticated with check (auth.uid() = user_id);
create policy "users update own comments" on public.comments for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users or admins delete comments" on public.comments for delete to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));
create trigger comments_updated_at before update on public.comments for each row execute function public.update_updated_at_column();

create table public.analytics_events (
  id bigserial primary key,
  event_type text not null check (event_type in ('beat_view','beat_play','beat_like','beat_unlike','beat_comment','whatsapp_click','user_signup','user_login')),
  user_id uuid references auth.users(id) on delete set null,
  beat_id uuid references public.beats(id) on delete cascade,
  session_id text,
  created_at timestamptz not null default now()
);
create index analytics_beat_type_idx on public.analytics_events(beat_id, event_type);
create index analytics_created_idx on public.analytics_events(created_at desc);
grant insert on public.analytics_events to anon, authenticated;
grant usage, select on sequence public.analytics_events_id_seq to anon, authenticated;
grant select on public.analytics_events to authenticated;
grant all on public.analytics_events to service_role;
alter table public.analytics_events enable row level security;
create policy "anyone can record events" on public.analytics_events for insert to anon, authenticated with check (user_id is null or auth.uid() = user_id);
create policy "admins read events" on public.analytics_events for select to authenticated using (public.has_role(auth.uid(),'admin'));

create table public.site_settings (
  id boolean primary key default true check (id),
  producer_name text not null default 'DANY BEATS',
  producer_bio text not null default '',
  whatsapp_number text not null default '',
  contact_email text not null default '',
  instagram_url text,
  youtube_url text,
  tiktok_url text,
  updated_at timestamptz not null default now()
);
grant select on public.site_settings to anon, authenticated;
grant insert, update on public.site_settings to authenticated;
grant all on public.site_settings to service_role;
alter table public.site_settings enable row level security;
create policy "settings are public" on public.site_settings for select using (true);
create policy "admins write settings" on public.site_settings for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "admins update settings" on public.site_settings for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
insert into public.site_settings (id) values (true);

create or replace function public.beat_public_stats()
returns table (beat_id uuid, likes bigint, comments bigint, plays bigint, views bigint)
language sql stable security definer set search_path = public as $$
  select b.id,
    (select count(*) from public.likes l where l.beat_id = b.id),
    (select count(*) from public.comments c where c.beat_id = b.id),
    (select count(*) from public.analytics_events e where e.beat_id = b.id and e.event_type = 'beat_play'),
    (select count(*) from public.analytics_events e where e.beat_id = b.id and e.event_type = 'beat_view')
  from public.beats b where b.status = 'published'
$$;
grant execute on function public.beat_public_stats() to anon, authenticated;

create or replace function public.admin_overview()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare result jsonb;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'forbidden'; end if;
  select jsonb_build_object(
    'users', (select count(*) from public.profiles),
    'active_users', (select count(distinct user_id) from public.analytics_events where user_id is not null and created_at > now() - interval '30 days'),
    'published_beats', (select count(*) from public.beats where status = 'published'),
    'draft_beats', (select count(*) from public.beats where status = 'draft'),
    'views', (select count(*) from public.analytics_events where event_type = 'beat_view'),
    'plays', (select count(*) from public.analytics_events where event_type = 'beat_play'),
    'likes', (select count(*) from public.likes),
    'comments', (select count(*) from public.comments),
    'whatsapp', (select count(*) from public.analytics_events where event_type = 'whatsapp_click')
  ) into result;
  return result;
end; $$;
grant execute on function public.admin_overview() to authenticated;

create or replace function public.admin_beat_stats(_beat_id uuid default null)
returns table (beat_id uuid, title text, views bigint, plays bigint, likes bigint, comments bigint, whatsapp bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'forbidden'; end if;
  return query
  select b.id, b.title,
    (select count(*) from public.analytics_events e where e.beat_id=b.id and e.event_type='beat_view'),
    (select count(*) from public.analytics_events e where e.beat_id=b.id and e.event_type='beat_play'),
    (select count(*) from public.likes l where l.beat_id=b.id),
    (select count(*) from public.comments c where c.beat_id=b.id),
    (select count(*) from public.analytics_events e where e.beat_id=b.id and e.event_type='whatsapp_click')
  from public.beats b
  where _beat_id is null or b.id = _beat_id;
end; $$;
grant execute on function public.admin_beat_stats(uuid) to authenticated;

create or replace function public.admin_events_daily(_days integer default 30, _beat_id uuid default null)
returns table (day date, event_type text, count bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'forbidden'; end if;
  return query
  select (e.created_at at time zone 'utc')::date, e.event_type, count(*)
  from public.analytics_events e
  where e.created_at > now() - make_interval(days => greatest(_days,1))
    and (_beat_id is null or e.beat_id = _beat_id)
  group by 1,2 order by 1;
end; $$;
grant execute on function public.admin_events_daily(integer, uuid) to authenticated;

create or replace function public.admin_users_overview()
returns table (id uuid, display_name text, email text, created_at timestamptz, likes bigint, comments bigint, last_seen timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'forbidden'; end if;
  return query
  select p.id, p.display_name, u.email::text, p.created_at,
    (select count(*) from public.likes l where l.user_id=p.id),
    (select count(*) from public.comments c where c.user_id=p.id),
    (select max(e.created_at) from public.analytics_events e where e.user_id=p.id)
  from public.profiles p join auth.users u on u.id = p.id
  order by p.created_at desc;
end; $$;
grant execute on function public.admin_users_overview() to authenticated;

create policy "public read covers" on storage.objects for select to anon, authenticated using (bucket_id = 'covers');
create policy "public read previews" on storage.objects for select to anon, authenticated using (bucket_id = 'previews');
create policy "admins manage covers" on storage.objects for all to authenticated using (bucket_id='covers' and public.has_role(auth.uid(),'admin')) with check (bucket_id='covers' and public.has_role(auth.uid(),'admin'));
create policy "admins manage previews" on storage.objects for all to authenticated using (bucket_id='previews' and public.has_role(auth.uid(),'admin')) with check (bucket_id='previews' and public.has_role(auth.uid(),'admin'));
create policy "admins manage masters" on storage.objects for all to authenticated using (bucket_id='masters' and public.has_role(auth.uid(),'admin')) with check (bucket_id='masters' and public.has_role(auth.uid(),'admin'));