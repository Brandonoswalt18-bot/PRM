create or replace function public.prevent_closed_rmr_statement_changes()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    if old.status = 'closed' then
      raise exception 'Closed RMR statements are immutable';
    end if;
    return old;
  end if;

  if old.status = 'closed' and new is distinct from old then
    raise exception 'Closed RMR statements are immutable';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_closed_rmr_statement_changes on public.rmr_statements;
create trigger prevent_closed_rmr_statement_changes
before update or delete on public.rmr_statements
for each row execute function public.prevent_closed_rmr_statement_changes();
