-- Keep journal posting behind one validated atomic operation.
-- The SECURITY DEFINER implementation is private and called only through an invoker RPC wrapper.

create or replace function private.nexus_finance_create_entry(
 p_organization_id uuid,p_entry_date date,p_description text,p_reference text,p_currency_code text,p_lines jsonb
)
returns jsonb language plpgsql security definer set search_path to ''
as $function$
declare
 v_uid uuid := (select auth.uid());
 v_entry_id uuid;
 v_currency text := upper(coalesce(p_currency_code,'NGN'));
 v_line jsonb;
 v_account_id uuid;
 v_debit numeric(20,2);
 v_credit numeric(20,2);
 v_count integer := 0;
 v_total_debit numeric(20,2) := 0;
 v_total_credit numeric(20,2) := 0;
 v_line_number integer := 0;
begin
 if v_uid is null then raise exception 'AUTHENTICATION_REQUIRED' using errcode='42501'; end if;
 if not private.has_permission(p_organization_id,'finance.entries.manage') then
   raise exception 'FINANCE_MANAGE_PERMISSION_REQUIRED' using errcode='42501';
 end if;
 if p_entry_date is null or p_description is null or length(btrim(p_description)) not between 2 and 2000 then
   raise exception 'INVALID_FINANCE_ENTRY' using errcode='22023';
 end if;
 if v_currency !~ '^[A-Z]{3}$' then raise exception 'INVALID_CURRENCY' using errcode='22023'; end if;
 if p_reference is not null and length(p_reference)>120 then raise exception 'INVALID_REFERENCE' using errcode='22023'; end if;
 if jsonb_typeof(p_lines)<>'array' or jsonb_array_length(p_lines)<2 or jsonb_array_length(p_lines)>50 then
   raise exception 'INVALID_FINANCE_LINES' using errcode='22023';
 end if;
 insert into public.finance_journal_entries(organization_id,entry_date,description,reference,currency_code,status,created_by)
 values(p_organization_id,p_entry_date,btrim(p_description),nullif(btrim(coalesce(p_reference,'')),''),v_currency,'draft',v_uid)
 returning id into v_entry_id;
 for v_line in select value from jsonb_array_elements(p_lines) loop
   v_count:=v_count+1; v_line_number:=v_line_number+1;
   v_account_id:=nullif(v_line->>'account_id','')::uuid;
   v_debit:=coalesce(nullif(v_line->>'debit','')::numeric,0);
   v_credit:=coalesce(nullif(v_line->>'credit','')::numeric,0);
   if v_account_id is null or v_debit<0 or v_credit<0 or not((v_debit>0 and v_credit=0) or (v_credit>0 and v_debit=0)) then
     raise exception 'INVALID_FINANCE_LINE' using errcode='22023';
   end if;
   if not exists(select 1 from public.finance_accounts a where a.id=v_account_id and a.organization_id=p_organization_id and a.currency_code=v_currency and a.is_active) then
     raise exception 'FINANCE_ACCOUNT_NOT_AVAILABLE' using errcode='42501';
   end if;
   v_total_debit:=v_total_debit+v_debit; v_total_credit:=v_total_credit+v_credit;
   insert into public.finance_journal_lines(organization_id,journal_entry_id,account_id,line_number,memo,debit,credit)
   values(p_organization_id,v_entry_id,v_account_id,v_line_number,left(nullif(coalesce(v_line->>'memo',''),''),500),v_debit,v_credit);
 end loop;
 if v_count<2 or v_total_debit<=0 or v_total_debit<>v_total_credit then
   raise exception 'FINANCE_ENTRY_NOT_BALANCED' using errcode='23514';
 end if;
 update public.finance_journal_entries
 set status='posted',posted_by=v_uid,posted_at=now(),updated_at=now()
 where id=v_entry_id and organization_id=p_organization_id;
 return jsonb_build_object('success',true,'entry_id',v_entry_id,'line_count',v_count,'debit_total',v_total_debit,'credit_total',v_total_credit,'status','posted');
end;
$function$;
revoke all on function private.nexus_finance_create_entry(uuid,date,text,text,text,jsonb) from public,anon;
grant execute on function private.nexus_finance_create_entry(uuid,date,text,text,text,jsonb) to authenticated;

create or replace function public.nexus_finance_create_entry(
 p_organization_id uuid,p_entry_date date,p_description text,p_reference text,p_currency_code text,p_lines jsonb
)
returns jsonb language plpgsql security invoker set search_path to ''
as $function$
begin
 return private.nexus_finance_create_entry(p_organization_id,p_entry_date,p_description,p_reference,p_currency_code,p_lines);
end;
$function$;
revoke all on function public.nexus_finance_create_entry(uuid,date,text,text,text,jsonb) from public,anon;
grant execute on function public.nexus_finance_create_entry(uuid,date,text,text,text,jsonb) to authenticated;

drop policy if exists finance_accounts_insert on public.finance_accounts;
create policy finance_accounts_insert on public.finance_accounts for insert to authenticated
with check(created_by=(select auth.uid()) and is_system=false and (select private.has_permission(organization_id,'finance.accounts.manage')));

drop policy if exists finance_accounts_update on public.finance_accounts;
create policy finance_accounts_update on public.finance_accounts for update to authenticated
using(is_system=false and (select private.has_permission(organization_id,'finance.accounts.manage')))
with check(is_system=false and (select private.has_permission(organization_id,'finance.accounts.manage')));

drop policy if exists finance_entries_insert on public.finance_journal_entries;
drop policy if exists finance_entries_update on public.finance_journal_entries;
drop policy if exists finance_lines_insert on public.finance_journal_lines;

revoke all on table public.finance_accounts,public.finance_journal_entries,public.finance_journal_lines,public.finance_budgets,public.analytics_events from public,anon;
revoke insert,update,delete,truncate,references,trigger on public.finance_journal_entries from authenticated;
revoke insert,update,delete,truncate,references,trigger on public.finance_journal_lines from authenticated;
grant select,insert,update on public.finance_accounts to authenticated;
grant select on public.finance_journal_entries to authenticated;
grant select on public.finance_journal_lines to authenticated;
grant select,insert,update on public.finance_budgets to authenticated;
grant select,insert on public.analytics_events to authenticated;

comment on function private.nexus_finance_create_entry(uuid,date,text,text,text,jsonb)
is 'Internal SECURITY DEFINER finance posting routine. Requires authenticated finance.entries.manage and validates organisation, currency and balanced journal lines.';
comment on function public.nexus_finance_create_entry(uuid,date,text,text,text,jsonb)
is 'Authenticated invoker RPC wrapper for atomic, permission-checked balanced journal posting.';
