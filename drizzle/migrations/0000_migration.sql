
create type public.app_role as enum ('admin','order_manager','accounts_manager','viewer');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text, email text, phone text,
  created_at timestamptz not null default now()
);
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null, unique(user_id, role)
);
grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;
grant select, insert, update, delete on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.user_roles where user_id=_user_id and role=_role) $$;
create or replace function public.is_member(_u uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.user_roles where user_id=_u) $$;
create or replace function public.can_orders(_u uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.user_roles where user_id=_u and role in ('admin','order_manager')) $$;
create or replace function public.can_payments(_u uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.user_roles where user_id=_u and role in ('admin','accounts_manager')) $$;

create policy "members read profiles" on public.profiles for select to authenticated using (public.is_member(auth.uid()) or id=auth.uid());
create policy "own profile update" on public.profiles for update to authenticated using (id=auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "read own roles or admin" on public.user_roles for select to authenticated using (user_id=auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "admin manage roles" on public.user_roles for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, full_name, email) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'), new.email);
  if not exists (select 1 from public.user_roles) then
    insert into public.user_roles(user_id, role) values (new.id, 'admin');
  else
    insert into public.user_roles(user_id, role) values (new.id, 'viewer');
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.touch_updated() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

-- Buyers
create table public.buyers (
  id uuid primary key default gen_random_uuid(),
  name text not null, department text, org_type text, contact_person text,
  mobile text, email text, billing_address text, delivery_address text,
  city text, district text, state text, pin_code text, other_contacts text, remarks text,
  is_sample boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create trigger t_buyers before update on public.buyers for each row execute function public.touch_updated();

-- Orders
create sequence public.crm_order_seq start 1001;
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  crm_id text not null unique default ('IND-' || nextval('public.crm_order_seq')),
  gem_order_number text not null unique,
  contract_ref text,
  order_date date not null,
  dispatch_deadline date not null,
  buyer_id uuid references public.buyers(id),
  assigned_to uuid references public.profiles(id),
  official_value numeric(14,2) not null default 0,
  additional_charges numeric(14,2) not null default 0,
  cancelled boolean not null default false,
  remarks text,
  is_sample boolean not null default false,
  created_by uuid,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index on public.orders(dispatch_deadline);
create index on public.orders(buyer_id);
create trigger t_orders before update on public.orders for each row execute function public.touch_updated();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_name text not null, sku text, description text,
  quantity numeric(14,3) not null default 1, uom text default 'Nos',
  unit_price numeric(14,2) not null default 0, tax_pct numeric(5,2) not null default 0,
  amount numeric(14,2) generated always as (round(quantity*unit_price*(1+tax_pct/100),2)) stored,
  created_at timestamptz not null default now()
);
create index on public.order_items(order_id);

create table public.dispatches (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  dispatch_date date not null,
  transporter text, transport_mode text, docket_number text, lr_number text,
  vehicle_number text, eway_bill text, invoice_number text, invoice_date date,
  invoice_amount numeric(14,2), expected_delivery date, actual_delivery date, buyer_received_date date,
  delivery_status text not null default 'In Transit',
  remarks text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index on public.dispatches(order_id);
create trigger t_disp before update on public.dispatches for each row execute function public.touch_updated();

create table public.dispatch_items (
  id uuid primary key default gen_random_uuid(),
  dispatch_id uuid not null references public.dispatches(id) on delete cascade,
  order_item_id uuid not null references public.order_items(id) on delete cascade,
  quantity numeric(14,3) not null check (quantity > 0)
);

create table public.crac_records (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  dispatch_id uuid references public.dispatches(id) on delete set null,
  invoice_number text,
  status text not null default 'Delivered — CRAC Pending',
  crac_number text, crac_date date, crac_amount numeric(14,2),
  follow_up_date date, remarks text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index on public.crac_records(order_id);
create trigger t_crac before update on public.crac_records for each row execute function public.touch_updated();

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  invoice_ref text, crac_ref text,
  transaction_ref text not null unique,
  payment_date date not null,
  amount numeric(14,2) not null check (amount > 0),
  method text not null default 'NEFT',
  bank_ref text, remarks text,
  reversed boolean not null default false, reversed_reason text,
  created_by uuid,
  created_at timestamptz not null default now()
);
create index on public.payments(order_id);

create table public.adjustments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  kind text not null, amount numeric(14,2) not null, adj_date date not null default current_date,
  remarks text, created_at timestamptz not null default now()
);

create table public.sms_notifications (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  kind text not null, scheduled_date date not null, recipient text, message text,
  status text not null default 'scheduled', provider_response text, error text,
  sent_at timestamptz, created_at timestamptz not null default now(),
  unique(order_id, kind, scheduled_date)
);

create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  category text not null default 'Other', file_path text not null, file_name text not null,
  uploaded_by uuid, created_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  table_name text not null, record_id uuid, action text not null,
  old_data jsonb, new_data jsonb, user_id uuid, created_at timestamptz not null default now()
);

create table public.sync_logs (
  id uuid primary key default gen_random_uuid(),
  entity text not null, record_id uuid, status text not null, error text,
  attempts int not null default 0, created_at timestamptz not null default now()
);

create table public.app_settings (
  key text primary key, value jsonb not null, updated_at timestamptz not null default now()
);
insert into public.app_settings(key, value) values
 ('reminder', '{"days_before":5,"send_time":"10:00","weekend_policy":"previous_working_day","overdue_repeat_days":1}'),
 ('sms_template', '"INDOSATI ALERT: GeM Order {GeM_Order_Number} for {Buyer_Name} must be dispatched by {Dispatch_Deadline}. Only {Days_Left} days remain. Product: {Product_Name}. Please arrange dispatch in time."');

-- grants
grant select, insert, update, delete on public.buyers, public.orders, public.order_items, public.dispatches, public.dispatch_items, public.crac_records, public.payments, public.adjustments, public.sms_notifications, public.attachments, public.sync_logs, public.app_settings to authenticated;
grant select on public.audit_logs to authenticated;
grant all on public.buyers, public.orders, public.order_items, public.dispatches, public.dispatch_items, public.crac_records, public.payments, public.adjustments, public.sms_notifications, public.attachments, public.audit_logs, public.sync_logs, public.app_settings to service_role;
grant usage on sequence public.crm_order_seq to authenticated, service_role;

alter table public.buyers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.dispatches enable row level security;
alter table public.dispatch_items enable row level security;
alter table public.crac_records enable row level security;
alter table public.payments enable row level security;
alter table public.adjustments enable row level security;
alter table public.sms_notifications enable row level security;
alter table public.attachments enable row level security;
alter table public.audit_logs enable row level security;
alter table public.sync_logs enable row level security;
alter table public.app_settings enable row level security;

do $$ declare t text; begin
  foreach t in array array['buyers','orders','order_items','dispatches','dispatch_items','crac_records','attachments'] loop
    execute format('create policy "members read" on public.%I for select to authenticated using (public.is_member(auth.uid()))', t);
    execute format('create policy "order mgrs write" on public.%I for insert to authenticated with check (public.can_orders(auth.uid()))', t);
    execute format('create policy "order mgrs update" on public.%I for update to authenticated using (public.can_orders(auth.uid()))', t);
    execute format('create policy "admin delete" on public.%I for delete to authenticated using (public.has_role(auth.uid(),''admin''))', t);
  end loop;
  foreach t in array array['payments','adjustments'] loop
    execute format('create policy "members read" on public.%I for select to authenticated using (public.is_member(auth.uid()))', t);
    execute format('create policy "accounts write" on public.%I for insert to authenticated with check (public.can_payments(auth.uid()))', t);
    execute format('create policy "accounts update" on public.%I for update to authenticated using (public.can_payments(auth.uid()))', t);
  end loop;
  foreach t in array array['sms_notifications','sync_logs','app_settings'] loop
    execute format('create policy "members read" on public.%I for select to authenticated using (public.is_member(auth.uid()))', t);
    execute format('create policy "admin write" on public.%I for all to authenticated using (public.has_role(auth.uid(),''admin'')) with check (public.has_role(auth.uid(),''admin''))', t);
  end loop;
end $$;
create policy "admin read audit" on public.audit_logs for select to authenticated using (public.has_role(auth.uid(),'admin'));

-- audit trigger
create or replace function public.audit_row() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_logs(table_name, record_id, action, old_data, new_data, user_id)
  values (tg_table_name, coalesce((case when tg_op='DELETE' then old.id else new.id end)), tg_op,
    case when tg_op<>'INSERT' then to_jsonb(old) end, case when tg_op<>'DELETE' then to_jsonb(new) end, auth.uid());
  return coalesce(new, old);
end $$;
do $$ declare t text; begin
  foreach t in array array['orders','order_items','dispatches','crac_records','payments','adjustments','buyers'] loop
    execute format('create trigger audit_%s after insert or update or delete on public.%I for each row execute function public.audit_row()', t, t);
  end loop;
end $$;

-- payments cannot be edited except to reverse
create or replace function public.guard_payment_update() returns trigger language plpgsql set search_path = public as $$
begin
  if new.amount <> old.amount or new.order_id <> old.order_id or new.transaction_ref <> old.transaction_ref then
    raise exception 'Payments cannot be changed. Reverse it and record a new one.';
  end if;
  return new;
end $$;
create trigger t_guard_pay before update on public.payments for each row execute function public.guard_payment_update();

-- summary view
create or replace view public.order_summary with (security_invoker = true) as
select o.*,
  b.name as buyer_name, b.state as buyer_state, b.mobile as buyer_mobile,
  coalesce((select sum(amount) from public.order_items i where i.order_id=o.id),0) + o.additional_charges as items_value,
  coalesce((select sum(quantity) from public.order_items i where i.order_id=o.id),0) as total_qty,
  coalesce((select sum(di.quantity) from public.dispatch_items di join public.dispatches d on d.id=di.dispatch_id where d.order_id=o.id),0) as dispatched_qty,
  (select count(*) from public.dispatches d where d.order_id=o.id) as dispatch_count,
  (select max(dispatch_date) from public.dispatches d where d.order_id=o.id) as last_dispatch_date,
  (select count(*) from public.dispatches d where d.order_id=o.id and d.buyer_received_date is not null) as delivered_count,
  coalesce((select sum(invoice_amount) from public.dispatches d where d.order_id=o.id),0) as dispatched_value,
  (select count(*) from public.crac_records c where c.order_id=o.id and c.status='CRAC Generated') as crac_generated_count,
  coalesce((select sum(amount) from public.payments p where p.order_id=o.id and not p.reversed),0) as amount_received,
  coalesce((select sum(amount) from public.adjustments a where a.order_id=o.id),0) as adjustments_total,
  (o.dispatch_deadline - 5) as reminder_date,
  (select string_agg(product_name, ', ') from public.order_items i where i.order_id=o.id) as products
from public.orders o left join public.buyers b on b.id=o.buyer_id;
grant select on public.order_summary to authenticated;
