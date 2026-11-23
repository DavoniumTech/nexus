-- Davonium Nexus: consent-aware analytics and double-entry finance foundation.

create table if not exists public.finance_accounts (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 account_code text not null, name text not null,
 account_type text not null check(account_type in('asset','liability','equity','revenue','expense')),
 normal_balance text not null check(normal_balance in('debit','credit')),
 currency_code text not null default 'NGN' check(currency_code ~ '^[A-Z]{3}$'),
 description text, is_system boolean not null default false, is_active boolean not null default true,
 created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(organization_id,account_code)
);

create table if not exists public.finance_journal_entries (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 entry_date date not null, reference text, description text not null,
 currency_code text not null default 'NGN' check(currency_code ~ '^[A-Z]{3}$'),
 source text not null default 'manual' check(source in('manual','system','import')),
 status text not null default 'draft' check(status in('draft','posted','void')),
 created_by uuid not null references auth.users(id),
 posted_by uuid references auth.users(id), posted_at timestamptz,
 voided_by uuid references auth.users(id), voided_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(length(btrim(description)) between 2 and 2000),
 check(reference is null or length(reference)<=120)
);

create table if not exists public.finance_journal_lines (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 journal_entry_id uuid not null references public.finance_journal_entries(id) on delete restrict,
 account_id uuid not null references public.finance_accounts(id) on delete restrict,
 line_number integer not null check(line_number between 1 and 50),
 memo text, debit numeric(20,2) not null default 0 check(debit>=0),
 credit numeric(20,2) not null default 0 check(credit>=0),
 created_at timestamptz not null default now(),
 unique(journal_entry_id,line_number),
 check((debit>0 and credit=0) or (credit>0 and debit=0)),
 check(memo is null or length(memo)<=500)
);

create table if not exists public.finance_budgets (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 account_id uuid references public.finance_accounts(id) on delete set null,
 name text not null, period_start date not null, period_end date not null,
 amount numeric(20,2) not null check(amount>0),
 currency_code text not null default 'NGN' check(currency_code ~ '^[A-Z]{3}$'),
 status text not null default 'active' check(status in('active','paused','archived')),
 notes text, created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(period_end>=period_start), check(length(btrim(name)) between 2 and 120)
);

create table if not exists public.analytics_events (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 client_event_id uuid not null, actor_user_id uuid not null references auth.users(id) on delete cascade,
 event_key text not null check(event_key in('page_view','command_used','pwa_installed','offline_session')),
 page_key text, occurred_at timestamptz not null default now(), created_at timestamptz not null default now(),
 unique(organization_id,client_event_id),
 check(page_key is null or page_key ~ '^[a-z][a-z0-9_-]{0,50}$')
);

create index if not exists finance_accounts_org_type_idx on public.finance_accounts(organization_id,account_type,is_active);
create index if not exists finance_entries_org_date_idx on public.finance_journal_entries(organization_id,entry_date desc,status);
create index if not exists finance_entries_org_created_idx on public.finance_journal_entries(organization_id,created_at desc);
create index if not exists finance_lines_org_account_idx on public.finance_journal_lines(organization_id,account_id,journal_entry_id);
create index if not exists finance_budgets_org_period_idx on public.finance_budgets(organization_id,period_start,period_end,status);
create index if not exists analytics_events_org_time_idx on public.analytics_events(organization_id,occurred_at desc);
create index if not exists analytics_events_org_actor_time_idx on public.analytics_events(organization_id,actor_user_id,occurred_at desc);

insert into public.permissions(permission_key,section,label,description)
values
 ('analytics.view','analytics','View company analytics','View organisation-wide aggregate Nexus usage analytics.'),
 ('analytics.manage','analytics','Manage analytics privacy','Configure privacy and analytics collection settings.'),
 ('finance.view','finance','View finance','View finance accounts, posted ledger entries and budgets.'),
 ('finance.manage','finance','Manage finance','Manage finance operations.'),
 ('finance.accounts.manage','finance','Manage finance accounts','Create and maintain the chart of accounts.'),
 ('finance.entries.manage','finance','Manage finance entries','Prepare and post balanced finance entries.'),
 ('finance.budgets.manage','finance','Manage finance budgets','Create, update and archive finance budgets.'),
 ('finance.reports.view','finance','View finance reports','View finance reports derived from posted balanced entries.')
on conflict(permission_key) do update
set section=excluded.section,label=excluded.label,description=excluded.description;

insert into public.role_permissions(role,permission_key,is_allowed)
select r.role,p.permission_key,true
from (values ('owner'::public.workspace_role),('admin'::public.workspace_role)) r(role)
cross join (values
 ('analytics.view'),('analytics.manage'),('finance.view'),('finance.manage'),
 ('finance.accounts.manage'),('finance.entries.manage'),('finance.budgets.manage'),('finance.reports.view')
) p(permission_key)
on conflict(role,permission_key) do update
set is_allowed=excluded.is_allowed,updated_at=now();

alter table public.finance_accounts enable row level security;
alter table public.finance_journal_entries enable row level security;
alter table public.finance_journal_lines enable row level security;
alter table public.finance_budgets enable row level security;
alter table public.analytics_events enable row level security;

drop policy if exists finance_accounts_read on public.finance_accounts;
create policy finance_accounts_read on public.finance_accounts for select to authenticated
using((select private.has_permission(organization_id,'finance.view')));
drop policy if exists finance_accounts_insert on public.finance_accounts;
create policy finance_accounts_insert on public.finance_accounts for insert to authenticated
with check(created_by=(select auth.uid()) and (select private.has_permission(organization_id,'finance.accounts.manage')));
drop policy if exists finance_accounts_update on public.finance_accounts;
create policy finance_accounts_update on public.finance_accounts for update to authenticated
using((select private.has_permission(organization_id,'finance.accounts.manage')))
with check((select private.has_permission(organization_id,'finance.accounts.manage')));

drop policy if exists finance_entries_read on public.finance_journal_entries;
create policy finance_entries_read on public.finance_journal_entries for select to authenticated
using((select private.has_permission(organization_id,'finance.view')));
drop policy if exists finance_entries_insert on public.finance_journal_entries;
create policy finance_entries_insert on public.finance_journal_entries for insert to authenticated
with check(created_by=(select auth.uid()) and status='draft' and (select private.has_permission(organization_id,'finance.entries.manage')));
drop policy if exists finance_entries_update on public.finance_journal_entries;
create policy finance_entries_update on public.finance_journal_entries for update to authenticated
using((select private.has_permission(organization_id,'finance.entries.manage')))
with check((select private.has_permission(organization_id,'finance.entries.manage')));

drop policy if exists finance_lines_read on public.finance_journal_lines;
create policy finance_lines_read on public.finance_journal_lines for select to authenticated
using((select private.has_permission(organization_id,'finance.view')));
drop policy if exists finance_lines_insert on public.finance_journal_lines;
create policy finance_lines_insert on public.finance_journal_lines for insert to authenticated
with check(
 (select private.has_permission(organization_id,'finance.entries.manage'))
 and exists(select 1 from public.finance_journal_entries e where e.id=journal_entry_id and e.organization_id=finance_journal_lines.organization_id and e.status='draft' and e.created_by=(select auth.uid()))
 and exists(select 1 from public.finance_accounts a where a.id=account_id and a.organization_id=finance_journal_lines.organization_id and a.currency_code=(select e.currency_code from public.finance_journal_entries e where e.id=journal_entry_id) and a.is_active)
);

drop policy if exists finance_budgets_read on public.finance_budgets;
create policy finance_budgets_read on public.finance_budgets for select to authenticated
using((select private.has_permission(organization_id,'finance.view')));
drop policy if exists finance_budgets_insert on public.finance_budgets;
create policy finance_budgets_insert on public.finance_budgets for insert to authenticated
with check(created_by=(select auth.uid()) and (select private.has_permission(organization_id,'finance.budgets.manage'))
 and (account_id is null or exists(select 1 from public.finance_accounts a where a.id=account_id and a.organization_id=finance_budgets.organization_id)));
drop policy if exists finance_budgets_update on public.finance_budgets;
create policy finance_budgets_update on public.finance_budgets for update to authenticated
using((select private.has_permission(organization_id,'finance.budgets.manage')))
with check((select private.has_permission(organization_id,'finance.budgets.manage')));

drop policy if exists analytics_events_insert_own on public.analytics_events;
create policy analytics_events_insert_own on public.analytics_events for insert to authenticated
with check(actor_user_id=(select auth.uid()) and (select private.has_permission(organization_id,'workspace.view')));
drop policy if exists analytics_events_read on public.analytics_events;
create policy analytics_events_read on public.analytics_events for select to authenticated
using((select private.has_permission(organization_id,'analytics.view')));

grant select,insert,update on public.finance_accounts to authenticated;
grant select,insert,update on public.finance_journal_entries to authenticated;
grant select,insert on public.finance_journal_lines to authenticated;
grant select,insert,update on public.finance_budgets to authenticated;
grant select,insert on public.analytics_events to authenticated;

create or replace function private.finance_assert_balanced_entry()
returns trigger language plpgsql security definer set search_path to ''
as $function$
declare v_count integer; v_debit numeric(20,2); v_credit numeric(20,2);
begin
 if new.status<>'posted' then return null; end if;
 select count(*),coalesce(sum(l.debit),0),coalesce(sum(l.credit),0)
 into v_count,v_debit,v_credit
 from public.finance_journal_lines l where l.journal_entry_id=new.id;
 if v_count<2 or v_debit<>v_credit or v_debit<=0 then
   raise exception 'FINANCE_ENTRY_NOT_BALANCED' using errcode='23514';
 end if;
 if exists(
   select 1 from public.finance_journal_lines l
   left join public.finance_accounts a on a.id=l.account_id
   where l.journal_entry_id=new.id and
     (l.organization_id<>new.organization_id or a.id is null or a.organization_id<>new.organization_id or a.currency_code<>new.currency_code)
 ) then raise exception 'FINANCE_ENTRY_ACCOUNT_MISMATCH' using errcode='23514'; end if;
 return null;
end;
$function$;
revoke all on function private.finance_assert_balanced_entry() from public,anon,authenticated;
drop trigger if exists finance_entries_must_balance on public.finance_journal_entries;
create constraint trigger finance_entries_must_balance
after insert or update on public.finance_journal_entries
deferrable initially deferred for each row execute function private.finance_assert_balanced_entry();

create or replace function public.nexus_finance_create_entry(
 p_organization_id uuid,p_entry_date date,p_description text,p_reference text,p_currency_code text,p_lines jsonb
) returns jsonb language plpgsql security invoker set search_path to ''
as $function$
declare
 v_uid uuid:=(select auth.uid()); v_entry_id uuid; v_currency text:=upper(coalesce(p_currency_code,'NGN'));
 v_line jsonb; v_account_id uuid; v_debit numeric(20,2); v_credit numeric(20,2);
 v_count integer:=0; v_total_debit numeric(20,2):=0; v_total_credit numeric(20,2):=0; v_line_number integer:=0;
begin
 if v_uid is null then raise exception 'AUTHENTICATION_REQUIRED' using errcode='42501'; end if;
 if not private.has_permission(p_organization_id,'finance.entries.manage') then raise exception 'FINANCE_MANAGE_PERMISSION_REQUIRED' using errcode='42501'; end if;
 if p_entry_date is null or p_description is null or length(btrim(p_description)) not between 2 and 2000 then raise exception 'INVALID_FINANCE_ENTRY' using errcode='22023'; end if;
 if v_currency !~ '^[A-Z]{3}$' then raise exception 'INVALID_CURRENCY' using errcode='22023'; end if;
 if p_reference is not null and length(p_reference)>120 then raise exception 'INVALID_REFERENCE' using errcode='22023'; end if;
 if jsonb_typeof(p_lines)<>'array' or jsonb_array_length(p_lines)<2 or jsonb_array_length(p_lines)>50 then raise exception 'INVALID_FINANCE_LINES' using errcode='22023'; end if;
 insert into public.finance_journal_entries(organization_id,entry_date,description,reference,currency_code,status,created_by)
 values(p_organization_id,p_entry_date,btrim(p_description),nullif(btrim(coalesce(p_reference,'')),''),v_currency,'draft',v_uid) returning id into v_entry_id;
 for v_line in select value from jsonb_array_elements(p_lines) loop
   v_count:=v_count+1; v_line_number:=v_line_number+1;
   v_account_id:=nullif(v_line->>'account_id','')::uuid;
   v_debit:=coalesce(nullif(v_line->>'debit','')::numeric,0);
   v_credit:=coalesce(nullif(v_line->>'credit','')::numeric,0);
   if v_account_id is null or v_debit<0 or v_credit<0 or not((v_debit>0 and v_credit=0) or (v_credit>0 and v_debit=0)) then raise exception 'INVALID_FINANCE_LINE' using errcode='22023'; end if;
   if not exists(select 1 from public.finance_accounts a where a.id=v_account_id and a.organization_id=p_organization_id and a.currency_code=v_currency and a.is_active) then raise exception 'FINANCE_ACCOUNT_NOT_AVAILABLE' using errcode='42501'; end if;
   v_total_debit:=v_total_debit+v_debit; v_total_credit:=v_total_credit+v_credit;
   insert into public.finance_journal_lines(organization_id,journal_entry_id,account_id,line_number,memo,debit,credit)
   values(p_organization_id,v_entry_id,v_account_id,v_line_number,left(nullif(coalesce(v_line->>'memo',''),''),500),v_debit,v_credit);
 end loop;
 if v_count<2 or v_total_debit<=0 or v_total_debit<>v_total_credit then raise exception 'FINANCE_ENTRY_NOT_BALANCED' using errcode='23514'; end if;
 update public.finance_journal_entries set status='posted',posted_by=v_uid,posted_at=now(),updated_at=now() where id=v_entry_id and organization_id=p_organization_id;
 return jsonb_build_object('success',true,'entry_id',v_entry_id,'line_count',v_count,'debit_total',v_total_debit,'credit_total',v_total_credit,'status','posted');
end;
$function$;
revoke all on function public.nexus_finance_create_entry(uuid,date,text,text,text,jsonb) from public,anon;
grant execute on function public.nexus_finance_create_entry(uuid,date,text,text,text,jsonb) to authenticated;

create or replace view public.nexus_finance_account_balances with(security_invoker=true) as
select a.id,a.organization_id,a.account_code,a.name,a.account_type,a.normal_balance,a.currency_code,a.is_system,a.is_active,
 coalesce(sum(case when e.status='posted' then l.debit else 0 end),0)::numeric(20,2) total_debits,
 coalesce(sum(case when e.status='posted' then l.credit else 0 end),0)::numeric(20,2) total_credits,
 case when a.normal_balance='debit'
  then (coalesce(sum(case when e.status='posted' then l.debit else 0 end),0)-coalesce(sum(case when e.status='posted' then l.credit else 0 end),0))::numeric(20,2)
  else (coalesce(sum(case when e.status='posted' then l.credit else 0 end),0)-coalesce(sum(case when e.status='posted' then l.debit else 0 end),0))::numeric(20,2)
 end current_balance
from public.finance_accounts a
left join public.finance_journal_lines l on l.account_id=a.id and l.organization_id=a.organization_id
left join public.finance_journal_entries e on e.id=l.journal_entry_id and e.organization_id=a.organization_id and e.status='posted'
group by a.id;
grant select on public.nexus_finance_account_balances to authenticated;

insert into public.finance_accounts(organization_id,account_code,name,account_type,normal_balance,currency_code,description,is_system)
select o.id,x.account_code,x.name,x.account_type,x.normal_balance,'NGN',x.description,true
from public.organizations o cross join(values
 ('1000','Cash on hand','asset','debit','Cash held by the company'),
 ('1010','Bank account','asset','debit','Company bank balances'),
 ('1100','Accounts receivable','asset','debit','Amounts customers owe the company'),
 ('2000','Accounts payable','liability','credit','Amounts the company owes suppliers'),
 ('3000','Owner equity','equity','credit','Owner capital and retained equity'),
 ('4000','Operating revenue','revenue','credit','Income earned from company activities'),
 ('5000','Operating expenses','expense','debit','Costs incurred to operate the company')
) x(account_code,name,account_type,normal_balance,description)
on conflict(organization_id,account_code) do nothing;

comment on table public.finance_journal_entries is 'Double-entry finance ledger. Posted entries must have equal debit and credit totals.';
comment on table public.analytics_events is 'Consent-gated, privacy-minimised Nexus usage events. No free-form payload or personal event properties are collected.';
comment on view public.nexus_finance_account_balances is 'RLS-aware account balance projection over posted double-entry journal lines.';
