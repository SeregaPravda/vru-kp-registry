# Підключення спільної бази даних (Supabase)

Зараз сайт працює в локальному демо-режимі: 10 фіксованих справ, які видно
лише в цій вкладці браузера. Щоб усі співробітники (детективи, прокурори,
судді) бачили одні й ті самі КП з будь-якого комп'ютера — підключи безкоштовну
базу Supabase. Це займе ~10 хвилин, серверу тримати не потрібно.

## 1. Створи проєкт

1. Зайди на https://supabase.com і зареєструйся (можна через GitHub/Google).
2. Створи новий проєкт (New project), обери будь-яку назву та регіон (Frankfurt
   найближче до України), задай пароль бази даних (збережи його окремо).
3. Зачекай ~2 хвилини, поки проєкт підніметься.

## 2. Створи таблицю `cases`

Відкрий вкладку **SQL Editor** → New query, встав і виконай:

```sql
create table public.cases (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  author text not null,
  suspect text not null,
  article text not null,
  evidence text,
  summary text not null,
  status text not null default 'new' check (status in ('new','opened','court','closed','rejected'))
);

alter table public.cases enable row level security;

create policy "public read" on public.cases
  for select using (true);

create policy "public insert" on public.cases
  for insert with check (true);

create policy "public update" on public.cases
  for update using (true);
```

> ⚠️ Ці policy дозволяють читати й писати будь-кому, хто знає посилання на
> сайт (без логіну) — так само як зараз працює звичайний статичний сайт.
> Це нормально для внутрішнього інструменту команди сервера, але лінк на
> сайт краще не публікувати публічно. Якщо згодом знадобиться розмежування
> ролей (наприклад, тільки суддя може закривати справу) — це вже окрема
> задача з Supabase Auth, скажи, коли буде треба, і ми це докрутимо.

## 3. Увімкни Realtime (щоб оновлення бачили всі одразу)

Table Editor → `cases` → іконка налаштувань таблиці → увімкни **Realtime**.

## 4. Візьми ключі проєкту

Project Settings → **API**:
- `Project URL` (виглядає як `https://xxxxx.supabase.co`)
- `anon public` key (довгий рядок)

## 5. Встав їх у `app.js`

Відкрий [app.js](app.js) і заміни перші два рядки конфігурації:

```js
const SUPABASE_URL = 'https://xxxxx.supabase.co';
const SUPABASE_ANON_KEY = 'вставте-сюди-ваш-anon-key';
```

Збережи файл і онови сторінку — сайт сам визначить, що конфіг заповнено,
підʼєднається до бази, підтягне всі КП з таблиці `cases` і почне писати туди
нові записи та зміни статусів. Локальні демо-дані (10 фіксованих справ) більше
не використовуються — вони показувались лише поки Supabase не був підключений.

## Що вже вміє сайт після підключення

- Форма на сторінці «Реєстр» реально створює запис у базі.
- Кнопки на картках справ («Відкрити провадження», «Передати до суду»,
  «Закрити справу», «Відхилити») змінюють статус у базі.
- Усі відкриті вкладки (в будь-кого) оновлюються самі, без перезавантаження —
  завдяки Supabase Realtime.
- Кнопка «Копіювати ID» копіює номер справи в буфer обміну.
