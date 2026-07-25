# База даних і безпечна авторизація (Supabase)

Цей файл описує повну схему бази для реєстру: справи, матеріали, історію дій
і — найважливіше — **безпечну** систему кодів доступу. Якщо на проєкті вже є
Supabase-проєкт із таблицею `cases` (наприклад, підключений до
kpvru05.netlify.app), виконуй розділи нижче на **тому самому** проєкті —
нічого не видаляй, усі команди адитивні (`create table if not exists`,
`alter table ... add column if not exists`), існуючі 10+ справ не постраждають.

## 0. Чому це взагалі потрібно — знайдена вразливість

У поточній production-версії коди доступу (`JUDGE-2026`, `PROSECUTOR-2026`,
`GOV-2026`, `ADMIN-2026`) лежать відкритим текстом прямо в `app.js`, який
віддається браузеру. Будь-хто через «Переглянути код сторінки» бачить усі
коди, включно з адмінським, і перевірка ролі відбувається лише в браузері —
на рівні бази даних немає жодного реального обмеження. Це означає, що будь-
який гравець може або прочитати коди, або взагалі викликати `login('ADMIN-2026')`
вручну в консолі не знаючи коду, або писати напряму в Supabase в обхід «входу».

Нижче — схема, яка перевіряє код **на сервері** (в базі даних), ніколи не
показує коди чи їх хеші клієнту, і реально обмежує запис у базу через Row
Level Security (RLS), а не лише ховає кнопки в інтерфейсі.

## 1. Розширення `cases`

```sql
create table if not exists public.cases (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  author text not null,
  suspect text not null,
  article text not null,
  short_description text not null default '',
  full_description text,
  evidence text,
  notes text,
  responsible text,
  status text not null default 'new'
    check (status in ('new','review','opened','court','closed','rejected')),
  decision text,
  closed_by text,
  closed_at timestamptz
);

-- якщо таблиця вже існувала зі старою схемою (author/suspect/article/evidence/summary/status) —
-- підтягуємо нові колонки й переносимо summary -> short_description без втрати даних:
alter table public.cases add column if not exists updated_at timestamptz not null default now();
alter table public.cases add column if not exists full_description text;
alter table public.cases add column if not exists notes text;
alter table public.cases add column if not exists responsible text;
alter table public.cases add column if not exists decision text;
alter table public.cases add column if not exists closed_by text;
alter table public.cases add column if not exists closed_at timestamptz;
do $$ begin
  if exists (select 1 from information_schema.columns where table_name='cases' and column_name='summary') then
    alter table public.cases add column if not exists short_description text;
    update public.cases set short_description = summary where short_description is null;
  end if;
end $$;
alter table public.cases drop constraint if exists cases_status_check;
alter table public.cases add constraint cases_status_check
  check (status in ('new','review','opened','court','closed','rejected'));
```

Статус `review` («На перевірці») — новий проміжний етап між «Нове» і
«Відкрито». Існуючі рядки з `new`/`opened`/`court`/`closed`/`rejected`
лишаються валідними, нічого не ламається.

## 2. Матеріали справи (вкладка «Матеріали»)

```sql
create table if not exists public.case_materials (
  id bigint generated always as identity primary key,
  case_id bigint not null references public.cases(id) on delete cascade,
  title text not null,
  kind text not null default 'link' check (kind in ('screenshot','video','document','link','other')),
  url text not null,
  added_by text not null,
  created_at timestamptz not null default now()
);
```

## 2.1. Коментарі до справи

```sql
create table if not exists public.case_comments (
  id bigint generated always as identity primary key,
  case_id bigint not null references public.cases(id) on delete cascade,
  author text not null,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.case_comments enable row level security;
create policy "anyone reads comments" on public.case_comments for select using (true);
create policy "logged-in staff comments" on public.case_comments
  for insert with check (exists (select 1 from public.user_roles where user_id = auth.uid()));
```

## 3. Історія дій — тепер по-справжньому в базі, не в пам'яті вкладки

```sql
create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  case_id bigint references public.cases(id) on delete cascade,
  actor text not null,
  action text not null,
  from_status text,
  to_status text,
  detail text,
  created_at timestamptz not null default now()
);
```

Записи сюди пише **тільки тригер** (розділ 5), ніколи напряму клієнт — інакше
будь-хто міг би підробити журнал дій.

## 4. Коди доступу та ролі — серверна перевірка

```sql
-- Supabase зазвичай ставить pgcrypto у схему `extensions`, не `public` —
-- тому нижче в redeem_access_code() search_path включає обидві схеми.
create extension if not exists pgcrypto;

create table if not exists public.access_codes (
  id bigint generated always as identity primary key,
  code_hash text not null,
  role text not null check (role in ('investigator','prosecutor','judge','admin')),
  display_name text not null,
  permissions text[] not null
);

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null,
  display_name text not null,
  permissions text[] not null,
  assigned_at timestamptz not null default now()
);

-- ніхто, включно з anon/authenticated, не читає ці таблиці напряму
alter table public.access_codes enable row level security;
alter table public.user_roles enable row level security;

create policy "no direct read of codes" on public.access_codes for select using (false);
create policy "read own role" on public.user_roles for select using (auth.uid() = user_id);

create or replace function public.redeem_access_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  match_row public.access_codes%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  select * into match_row from public.access_codes
    where code_hash = crypt(p_code, code_hash)
    limit 1;

  if match_row.id is null then
    raise exception 'invalid_code';
  end if;

  insert into public.user_roles (user_id, role, display_name, permissions)
  values (auth.uid(), match_row.role, match_row.display_name, match_row.permissions)
  on conflict (user_id) do update
    set role = excluded.role, display_name = excluded.display_name,
        permissions = excluded.permissions, assigned_at = now();

  return jsonb_build_object('role', match_row.role, 'displayName', match_row.display_name, 'permissions', match_row.permissions);
end;
$$;

grant execute on function public.redeem_access_code(text) to anon, authenticated;
```

### Заведи свої власні коди (встав СВОЇ значення замість прикладів нижче)

Виконай окремо, підставивши реальні коди — **нікому, включно зі мною, не
потрібно бачити їх у чаті чи в файлах проєкту**:

```sql
insert into public.access_codes (code_hash, role, display_name, permissions) values
  (crypt('ТВІЙ_КОД_СЛІДЧОГО', gen_salt('bf')), 'investigator', 'Слідчий', array['register','edit']),
  (crypt('ТВІЙ_КОД_ПРОКУРОРА', gen_salt('bf')), 'prosecutor', 'Прокурор', array['review','assign','edit']),
  (crypt('ТВІЙ_КОД_СУДДІ', gen_salt('bf')), 'judge', 'Суддя', array['court','decide','assign','edit']),
  (crypt('ТВІЙ_КОД_АДМІНА', gen_salt('bf')), 'admin', 'Адміністратор', array['register','review','court','decide','assign','edit','delete','archive_restore']);
```

## 5. Тригери: updated_at і журнал дій

Два окремі тригери, бо в них різний час спрацювання: `updated_at`
виставляється ДО запису рядка (BEFORE), а журнал дій пишеться ПІСЛЯ
(AFTER) — інакше `audit_log.case_id` посилається на рядок `cases`,
якого фізично ще не існує, і foreign key падає з помилкою.

```sql
create or replace function public.set_case_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_set_case_updated_at on public.cases;
create trigger trg_set_case_updated_at
  before insert or update on public.cases
  for each row execute function public.set_case_updated_at();

create or replace function public.log_case_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_log (case_id, actor, action, to_status, detail)
    values (new.id, coalesce(new.author,'Система'), 'case_created', new.status, 'КП зареєстровано');
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
    insert into public.audit_log (case_id, actor, action, from_status, to_status, detail)
    values (new.id, coalesce(new.responsible, 'Система'), 'status_change', old.status, new.status, null);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_log_case_change on public.cases;
create trigger trg_log_case_change
  after insert or update on public.cases
  for each row execute function public.log_case_change();
```

## 6. RLS на самі справи, матеріали й журнал

```sql
alter table public.cases enable row level security;
alter table public.case_materials enable row level security;
alter table public.audit_log enable row level security;

drop policy if exists "public read" on public.cases;
drop policy if exists "public insert" on public.cases;
drop policy if exists "public update" on public.cases;

create policy "anyone reads cases" on public.cases for select using (true);
create policy "anyone reads materials" on public.case_materials for select using (true);
create policy "anyone reads audit" on public.audit_log for select using (true);

create or replace function public.has_permission(p text)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and p = any(permissions)
  );
$$;

create policy "staff creates cases" on public.cases
  for insert with check (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role <> 'judge')
  );

create policy "staff updates cases" on public.cases
  for update using (
    public.has_permission('review') or public.has_permission('court')
    or public.has_permission('decide') or public.has_permission('assign')
    or public.has_permission('edit')
  );

create policy "admin deletes cases" on public.cases
  for delete using (public.has_permission('delete'));

create policy "staff adds materials" on public.case_materials
  for insert with check (public.has_permission('register') or public.has_permission('edit'));
```

> Обмеження чесно варто озвучити: RLS тут перевіряє «чи має роль якесь право
> редагувати взагалі», а не «чи саме цей конкретний перехід статусу дозволений
> саме цій ролі» — той рівень деталізації інтерфейс контролює на клієнті
> (кнопки з'являються лише для дозволених дій). Для фан-проєкту команди сервера
> це розумний баланс; якщо колись знадобиться сувора пофункційна перевірка —
> це нарощується окремою SQL-функцією для кожного переходу.

## 7. Увімкни анонімну авторизацію

Authentication → Providers → **Anonymous Sign-Ins** → Enable.
Це дає кожному відвідувачу власний `auth.uid()` без пароля/пошти — потрібно,
щоб `redeem_access_code` міг прив'язати роль до конкретної сесії браузера.

## 8. Realtime

Table Editor → `cases`, `case_materials`, `audit_log`, `case_comments` → увімкни
**Realtime** для кожної.

## 9. Ключі проєкту в `app.js`

Project Settings → API → `Project URL` і `anon public` key — встав у
[app.js](app.js) замість заглушок `SUPABASE_URL` / `SUPABASE_ANON_KEY`.
Anon-ключ призначений бути публічним (він і зараз відкрито віддається в
живому `app.js`) — безпеку дає RLS вище, а не приховування самого ключа.
