alter table public.deal_registrations
  add column if not exists community_address text,
  add column if not exists city text,
  add column if not exists state text;

with parsed as (
  select
    id,
    nullif(split_part(split_part(notes, E'\n', 1), '"communityAddress":"', 2), '') as raw_community_address,
    nullif(split_part(split_part(notes, E'\n', 1), '"city":"', 2), '') as raw_city,
    nullif(split_part(split_part(notes, E'\n', 1), '"state":"', 2), '') as raw_state
  from public.deal_registrations
  where notes like '__goaccess_deal_meta__:%'
)
update public.deal_registrations as deals
set
  community_address = coalesce(
    deals.community_address,
    split_part(parsed.raw_community_address, '"', 1)
  ),
  city = coalesce(
    deals.city,
    split_part(parsed.raw_city, '"', 1)
  ),
  state = coalesce(
    deals.state,
    split_part(parsed.raw_state, '"', 1)
  )
from parsed
where deals.id = parsed.id;

