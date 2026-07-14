create table if not exists public.partner_updates (
  id text primary key,
  title text not null check (char_length(btrim(title)) between 1 and 160),
  summary text not null check (char_length(btrim(summary)) between 1 and 400),
  body text not null check (char_length(btrim(body)) between 1 and 20000),
  category text not null check (category in (
    'product_update',
    'sales_resource',
    'operational_notice'
  )),
  status text not null check (status in ('draft', 'published', 'archived')),
  resource_label text check (
    resource_label is null or char_length(btrim(resource_label)) between 1 and 120
  ),
  resource_url text check (
    resource_url is null or (
      char_length(resource_url) <= 2048 and
      resource_url ~* '^https?://'
    )
  ),
  is_pinned boolean not null default false,
  created_by_name text not null check (char_length(btrim(created_by_name)) between 1 and 160),
  created_by_email text not null check (char_length(btrim(created_by_email)) between 3 and 254),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  published_at timestamptz,
  archived_at timestamptz,
  check (status <> 'published' or published_at is not null),
  check (status <> 'archived' or archived_at is not null),
  check (status <> 'archived' or not is_pinned)
);

create index if not exists partner_updates_status_published_idx
  on public.partner_updates (status, published_at desc);

create index if not exists partner_updates_updated_idx
  on public.partner_updates (updated_at desc);

create unique index if not exists partner_updates_single_pinned_published_idx
  on public.partner_updates ((is_pinned))
  where status = 'published' and is_pinned = true;

create or replace function public.unpin_other_published_partner_updates()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'published' and new.is_pinned then
    update public.partner_updates
    set is_pinned = false,
        updated_at = greatest(updated_at, new.updated_at)
    where id <> new.id
      and status = 'published'
      and is_pinned = true;
  end if;

  return new;
end;
$$;

drop trigger if exists unpin_other_published_partner_updates on public.partner_updates;
create trigger unpin_other_published_partner_updates
before insert or update of status, is_pinned on public.partner_updates
for each row execute function public.unpin_other_published_partner_updates();

alter table public.partner_updates enable row level security;

comment on table public.partner_updates is
  'Admin-authored announcements. Only published records are serialized for vendor portal access.';
