# PWA Couple – MVP Skeleton

MVP installable sur iPhone (PWA), prêt à faire évoluer sans fichiers monstrueux.

> **Stack**: Next.js (App Router) + TypeScript + Tailwind + Supabase (Auth/DB/Realtime/Storage) + PWA (SW + manifest)  
> **Cibles**: Web installable (A2HS), offline-first, synchro temps réel, push plus tard.

---

## 0) Pré-requis & Setup

```bash
# Créer projet
npx create-next-app@latest nous2 --typescript --eslint --tailwind --app
cd nous-deux

# Dépendances
npm i @supabase/supabase-js localforage date-fns clsx
npm i -D workbox-build

# (Optionnel UI) shadcn/ui
# npx shadcn@latest init && npx shadcn@latest add button card input textarea dialog calendar
```

**.env.local (template)**
```ini
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
# Pour web-push plus tard
# NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
# VAPID_PRIVATE_KEY=...
```

---

## 1) Structure des dossiers (modulaire)

```
/ (repo root)
├─ app/
│  ├─ (features)/
│  │  ├─ home/
│  │  │  └─ page.tsx
│  │  ├─ notes/
│  │  │  └─ page.tsx
│  │  ├─ bucket/
│  │  │  └─ page.tsx
│  │  ├─ calendar/
│  │  │  └─ page.tsx
│  │  └─ onboarding/
│  │     └─ page.tsx
│  ├─ api/
│  │  ├─ ping/route.ts           # bouton “je pense à toi” (MVP: log + realtime)
│  │  └─ push/
│  │     └─ subscribe/route.ts   # (stub pour + tard)
│  ├─ layout.tsx
│  ├─ page.tsx                   # redirect vers /(features)/home
│  └─ sw-client.ts               # enregistrement du SW
├─ components/
│  ├─ ui/                        # petits composants réutilisables
│  │  ├─ button.tsx
│  │  ├─ card.tsx
│  │  └─ skeleton.tsx
│  ├─ love-counter.tsx
│  ├─ ping-button.tsx
│  ├─ notes/
│  │  ├─ note-item.tsx
│  │  └─ notes-list.tsx
│  ├─ bucket/
│  │  ├─ bucket-item.tsx
│  │  └─ bucket-list.tsx
│  └─ calendar/
│     └─ calendar-view.tsx
├─ lib/
│  ├─ supabase/client.ts
│  ├─ supabase/server.ts
│  ├─ types.ts
│  ├─ utils.ts
│  └─ store.ts                   # cache local (localforage), hooks
├─ public/
│  ├─ icons/icon-192.png
│  ├─ icons/icon-512.png
│  ├─ manifest.webmanifest
│  └─ sw.js
├─ scripts/
│  └─ workbox-build.mjs          # build SW avancé (optionnel)
├─ styles/
│  └─ globals.css
└─ supabase/
   ├─ schema.sql
   └─ policies.sql
```

> Chaque **feature** a son dossier (page + composants). Les **primitives** (ui) sont partagées. Les accès DB sont centralisés dans `/lib/supabase/*`.

---

## 2) Schéma Supabase (MVP) – `supabase/schema.sql`

```sql
-- Identité / couple
create table users (
  id uuid primary key default uuid_generate_v4(),
  display_name text,
  avatar_url text,
  created_at timestamptz default now()
);

create table couples (
  id uuid primary key default uuid_generate_v4(),
  join_code text unique not null,
  started_at date not null,
  created_at timestamptz default now()
);

create table couple_members (
  user_id uuid references users(id) on delete cascade,
  couple_id uuid references couples(id) on delete cascade,
  role text default 'partner',
  primary key(user_id, couple_id)
);

-- Contenu
create table love_notes (
  id uuid primary key default uuid_generate_v4(),
  couple_id uuid references couples(id) on delete cascade,
  author_id uuid references users(id) on delete set null,
  content text not null,
  photo_url text,
  created_at timestamptz default now()
);

create table bucket_items (
  id uuid primary key default uuid_generate_v4(),
  couple_id uuid references couples(id) on delete cascade,
  title text not null,
  note text,
  photo_url text,
  is_done boolean default false,
  done_at timestamptz,
  created_at timestamptz default now()
);

create table events (
  id uuid primary key default uuid_generate_v4(),
  couple_id uuid references couples(id) on delete cascade,
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  created_at timestamptz default now()
);

create table pings (
  id uuid primary key default uuid_generate_v4(),
  couple_id uuid references couples(id) on delete cascade,
  sender_id uuid references users(id) on delete set null,
  created_at timestamptz default now()
);
```

### RLS minimal – `supabase/policies.sql`

```sql
alter table users enable row level security;
alter table couples enable row level security;
alter table couple_members enable row level security;
alter table love_notes enable row level security;
alter table bucket_items enable row level security;
alter table events enable row level security;
alter table pings enable row level security;

-- Helper: l'utilisateur doit appartenir au couple
create policy "read own couples" on couples
  for select using (exists (
    select 1 from couple_members cm where cm.couple_id = id and cm.user_id = auth.uid()
  ));

create policy "members manage membership" on couple_members
  for select using (user_id = auth.uid());

-- Contenu: read/write si membre du couple
create policy "notes rw by couple" on love_notes
  for select using (exists (select 1 from couple_members cm where cm.couple_id = love_notes.couple_id and cm.user_id = auth.uid()));
create policy "notes insert" on love_notes
  for insert with check (exists (select 1 from couple_members cm where cm.couple_id = love_notes.couple_id and cm.user_id = auth.uid()));

create policy "bucket rw by couple" on bucket_items
  for select using (exists (select 1 from couple_members cm where cm.couple_id = bucket_items.couple_id and cm.user_id = auth.uid()));
create policy "bucket insert" on bucket_items
  for insert with check (exists (select 1 from couple_members cm where cm.couple_id = bucket_items.couple_id and cm.user_id = auth.uid()));

create policy "events rw by couple" on events
  for select using (exists (select 1 from couple_members cm where cm.couple_id = events.couple_id and cm.user_id = auth.uid()));
create policy "events insert" on events
  for insert with check (exists (select 1 from couple_members cm where cm.couple_id = events.couple_id and cm.user_id = auth.uid()));

create policy "pings rw by couple" on pings
  for select using (exists (select 1 from couple_members cm where cm.couple_id = pings.couple_id and cm.user_id = auth.uid()));
create policy "pings insert" on pings
  for insert with check (exists (select 1 from couple_members cm where cm.couple_id = pings.couple_id and cm.user_id = auth.uid()));
```

> Tu peux activer le Realtime Supabase sur `love_notes`, `bucket_items`, `events`, `pings`.

---

## 3) Libs Supabase & utilitaires (`/lib`)

**`/lib/supabase/client.ts`**
```ts
'use client';
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

**`/lib/supabase/server.ts`** (si besoin d’actions côté serveur)
```ts
import { createClient } from '@supabase/supabase-js';
export function supabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**`/lib/types.ts`** (types partagés)
```ts
export type Couple = { id: string; join_code: string; started_at: string };
export type LoveNote = { id: string; content: string; photo_url?: string; created_at: string; author_id: string };
export type BucketItem = { id: string; title: string; is_done: boolean; photo_url?: string; done_at?: string };
export type Event = { id: string; title: string; starts_at: string; ends_at?: string; location?: string };
```

**`/lib/utils.ts`**
```ts
export const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');
export const plural = (n: number, s: string, p: string) => (n > 1 ? p : s);
```

---

## 4) PWA: manifest + service worker

**`/public/manifest.webmanifest`**
```json
{
  "name": "Nous Deux",
  "short_name": "NousDeux",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#ff3b81",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable any" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable any" }
  ]
}
```

**`/public/sw.js` (MVP très simple)**
```js
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open('nd-v1').then((c) => c.addAll(['/', '/offline'])));
});
self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
});
```

**`/app/sw-client.ts`**
```ts
'use client';
export function registerSW() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'));
  }
}
```

---

## 5) Layout & Navigation

**`/app/layout.tsx`**
```tsx
import './globals.css';
import Link from 'next/link';
import { registerSW } from './sw-client';
import { ReactNode, useEffect } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  useEffect(() => { registerSW(); }, []);
  return (
    <html lang="fr">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="max-w-screen-sm mx-auto p-4">
        <nav className="flex gap-3 text-sm mb-4">
          <Link href="/">Home</Link>
          <Link href="/notes">Mots doux</Link>
          <Link href="/bucket">Bucket</Link>
          <Link href="/calendar">Calendrier</Link>
        </nav>
        {children}
      </body>
    </html>
  );
}
```

**`/app/page.tsx`** (redirige vers la Home feature)
```tsx
import { redirect } from 'next/navigation';
export default function Index() { redirect('/(features)/home'); }
```

---

## 6) Home + Love Counter + Ping

**`/components/love-counter.tsx`**
```tsx
'use client';
import { useEffect, useState } from 'react';
import { differenceInDays, differenceInMonths } from 'date-fns';

export default function LoveCounter({ startedAt }: { startedAt: string }) {
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 60_000); return () => clearInterval(t); }, []);
  const start = new Date(startedAt);
  const days = differenceInDays(now, start);
  const months = differenceInMonths(now, start);
  return (
    <div className="p-4 rounded-2xl border">
      <div className="text-5xl font-bold">{days}<span className="text-xl ml-2">jours</span></div>
      <div className="opacity-70 text-sm">~ {months} mois ensemble 💞</div>
    </div>
  );
}
```

**`/components/ping-button.tsx`**
```tsx
'use client';
import { useState } from 'react';

export default function PingButton({ coupleId }: { coupleId: string }) {
  const [sending, setSending] = useState(false);
  return (
    <button
      className="fixed right-4 bottom-4 rounded-full px-5 py-3 border shadow"
      onClick={async () => {
        setSending(true);
        await fetch('/api/ping', { method: 'POST', body: JSON.stringify({ coupleId }) });
        setSending(false);
      }}
      aria-label="Je pense à toi"
    >{sending ? '...' : 'Je pense à toi ❤️'}</button>
  );
}
```

**`/app/(features)/home/page.tsx`** (MVP – on suppose un couple existant mocké)
```tsx
import LoveCounter from '@/components/love-counter';
import PingButton from '@/components/ping-button';

const MOCK_COUPLE = { id: 'demo', started_at: '2024-02-14' };
export default function HomePage() {
  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-semibold">Nous Deux</h1>
      <LoveCounter startedAt={MOCK_COUPLE.started_at} />
      <div className="text-sm opacity-70">Prochain “moisversary”: notifs à venir (cron côté serveur).</div>
      <PingButton coupleId={MOCK_COUPLE.id} />
    </main>
  );
}
```

**`/app/api/ping/route.ts`** (MVP stub: enregistre un ping en DB quand tu brancheras Supabase)
```ts
import { NextResponse } from 'next/server';
export async function POST(req: Request) {
  const { coupleId } = await req.json();
  // TODO: insérer pings dans Supabase + broadcast Realtime / push
  console.log('PING', coupleId, new Date().toISOString());
  return NextResponse.json({ ok: true });
}
```

---

## 7) Mots doux (notes)

**`/components/notes/note-item.tsx`**
```tsx
import { format } from 'date-fns';
export default function NoteItem({ content, date, photoUrl }: { content: string; date: string; photoUrl?: string }) {
  return (
    <div className="border rounded-xl p-3 space-y-2">
      {photoUrl && <img src={photoUrl} alt="" className="rounded-lg" />}
      <p>{content}</p>
      <div className="text-xs opacity-60">{format(new Date(date), 'dd/MM/yyyy HH:mm')}</div>
    </div>
  );
}
```

**`/components/notes/notes-list.tsx`** (MVP local state)
```tsx
'use client';
import { useState } from 'react';
import NoteItem from './note-item';

export default function NotesList() {
  const [notes, setNotes] = useState<{content: string; created_at: string}[]>([]);
  const [text, setText] = useState('');
  return (
    <div className="space-y-3">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          setNotes([{ content: text, created_at: new Date().toISOString() }, ...notes]);
          setText('');
        }}
      >
        <input className="flex-1 border rounded-xl px-3 py-2" value={text} onChange={(e)=>setText(e.target.value)} placeholder="Écrire un mot doux..." />
        <button className="px-4 py-2 border rounded-xl">Envoyer</button>
      </form>
      {notes.map((n, i) => <NoteItem key={i} content={n.content} date={n.created_at} />)}
    </div>
  );
}
```

**`/app/(features)/notes/page.tsx`**
```tsx
import NotesList from '@/components/notes/notes-list';
export default function NotesPage() {
  return (
    <main className="space-y-4">
      <h1 className="text-xl font-semibold">Mots doux</h1>
      <NotesList />
    </main>
  );
}
```

---

## 8) Bucket list

**`/components/bucket/bucket-item.tsx`**
```tsx
'use client';
export default function BucketItem({ title, done, onToggle }: { title: string; done: boolean; onToggle: () => void }) {
  return (
    <label className="flex items-center gap-3 border rounded-xl p-3">
      <input type="checkbox" checked={done} onChange={onToggle} />
      <span className={done ? 'line-through opacity-60' : ''}>{title}</span>
    </label>
  );
}
```

**`/components/bucket/bucket-list.tsx`**
```tsx
'use client';
import { useState } from 'react';
import BucketItem from './bucket-item';

export default function BucketList() {
  const [items, setItems] = useState<{title: string; done: boolean}[]>([]);
  const [title, setTitle] = useState('');
  return (
    <div className="space-y-3">
      <form className="flex gap-2" onSubmit={(e)=>{e.preventDefault(); if(!title.trim())return; setItems([{title, done:false}, ...items]); setTitle('');}}>
        <input className="flex-1 border rounded-xl px-3 py-2" value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Ajouter une activité..." />
        <button className="px-4 py-2 border rounded-xl">Ajouter</button>
      </form>
      <div className="space-y-2">
        {items.map((it, idx)=> (
          <BucketItem key={idx} title={it.title} done={it.done} onToggle={()=>{
            setItems(items.map((v,i)=> i===idx ? {...v, done: !v.done} : v));
          }} />))}
      </div>
    </div>
  );
}
```

**`/app/(features)/bucket/page.tsx`**
```tsx
import BucketList from '@/components/bucket/bucket-list';
export default function BucketPage(){
  return (
    <main className="space-y-4">
      <h1 className="text-xl font-semibold">Bucket list</h1>
      <BucketList />
    </main>
  );
}
```

---

## 9) Calendrier (MVP visuel simple)

**`/components/calendar/calendar-view.tsx`** (grille minimaliste)
```tsx
'use client';
import { startOfMonth, endOfMonth, eachDayOfInterval, format } from 'date-fns';
import { useState } from 'react';

export default function CalendarView(){
  const [current, setCurrent] = useState(new Date());
  const days = eachDayOfInterval({ start: startOfMonth(current), end: endOfMonth(current) });
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <button className="border rounded px-2" onClick={()=>setCurrent(new Date(current.getFullYear(), current.getMonth()-1, 1))}>◀</button>
        <div className="font-medium">{format(current, 'LLLL yyyy')}</div>
        <button className="border rounded px-2" onClick={()=>setCurrent(new Date(current.getFullYear(), current.getMonth()+1, 1))}>▶</button>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {days.map(d=> (
          <div key={d.toISOString()} className="border rounded-lg p-2 min-h-[64px]">
            <div className="text-xs opacity-60">{format(d, 'd')}</div>
            {/* TODO: afficher événements du jour */}
          </div>
        ))}
      </div>
    </div>
  );
}
```

**`/app/(features)/calendar/page.tsx`**
```tsx
import CalendarView from '@/components/calendar/calendar-view';
export default function CalendarPage(){
  return (
    <main className="space-y-4">
      <h1 className="text-xl font-semibold">Calendrier</h1>
      <CalendarView />
    </main>
  );
}
```

---

## 10) Onboarding (MVP)

**`/app/(features)/onboarding/page.tsx`** (juste les champs de base; le wiring Supabase viendra ensuite)
```tsx
'use client';
import { useState } from 'react';

export default function OnboardingPage(){
  const [mode, setMode] = useState<'create'|'join'>('create');
  const [started, setStarted] = useState('2024-02-14');
  const [joinCode, setJoinCode] = useState('');
  return (
    <main className="space-y-4">
      <h1 className="text-xl font-semibold">Onboarding</h1>
      <div className="flex gap-2">
        <button className={`border px-3 py-1 rounded ${mode==='create'?'bg-black text-white':''}`} onClick={()=>setMode('create')}>Créer</button>
        <button className={`border px-3 py-1 rounded ${mode==='join'?'bg-black text-white':''}`} onClick={()=>setMode('join')}>Rejoindre</button>
      </div>
      {mode==='create' ? (
        <form className="space-y-2" onSubmit={(e)=>{e.preventDefault(); alert('Créer couple ' + started);}}>
          <label className="block">Date de rencontre
            <input type="date" value={started} onChange={(e)=>setStarted(e.target.value)} className="border rounded px-2 py-1 ml-2"/>
          </label>
          <button className="border rounded px-3 py-2">Créer le couple</button>
        </form>
      ) : (
        <form className="space-y-2" onSubmit={(e)=>{e.preventDefault(); alert('Rejoindre: ' + joinCode);}}>
          <label className="block">Code couple
            <input value={joinCode} onChange={(e)=>setJoinCode(e.target.value)} className="border rounded px-2 py-1 ml-2"/>
          </label>
          <button className="border rounded px-3 py-2">Rejoindre</button>
        </form>
      )}
    </main>
  );
}
```

---

## 11) Styles (`/styles/globals.css`)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body { height: 100%; }
body { background: #fff; }
```

---

## 12) Roadmap d’intégration (étapes propres)

1. **Brancher Supabase Auth + Onboarding**  
   - Sign-in par lien magique, création/adhésion au couple (insert `couples`, `couple_members`).
   - Hook `useSession` local pour l’UI.

2. **Brancher DB pour Notes / Bucket / Events**  
   - Remplacer les états locaux par des fetch/insert Supabase avec **RLS**.  
   - Activer **Realtime** pour live update.

3. **Storage pour photos**  
   - Bucket `photos`, upload côté client, compression avant upload.

4. **“Je pense à toi”**  
   - Insert `pings` + Realtime toast.  
   - (Plus tard) Push via Edge Function.

5. **Love Counter – notifs mensuelles**  
   - Edge Function `monthversary` + Scheduler quotidien.

6. **PWA améliorée**  
   - Workbox (runtime caching), page `/offline`, A2HS prompt.

7. **Polish UI**  
   - shadcn/ui + animations (Framer Motion), haptics.

> À chaque étape, on garde **pages courtes**, **composants par feature**, **lib centralisée**. Si un fichier dépasse ~200 lignes, on factorise.

---

## 13) Où brancher Supabase concrètement (pistes rapides)

- Remplacer les mocks par :
```ts
const { data } = await supabase.from('love_notes').select('*').eq('couple_id', coupleId).order('created_at', { ascending: false });
```
- Realtime:
```ts
supabase.channel('love_notes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'love_notes', filter: `couple_id=eq.${coupleId}` }, () => refetch())
  .subscribe();
```

---

## 14) Tests rapides iPhone

- Ouvre Safari → URL locale via `npm run dev` + tunnel (ex: `ngrok`) si besoin.  
- **Partager → Ajouter à l’écran d’accueil**.  
- Vérifie plein écran, icône, offline basique.

---

### ✅ Résultat
MVP structuré, pages claires, composants par feature, lib centralisée. Prêt à brancher la DB et à itérer sans fichiers géants.

