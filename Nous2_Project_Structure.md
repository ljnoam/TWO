# 📁 Structure du projet --- PWA "Nous2"

Ce document décrit la **structure complète** et la **logique
d'organisation** du projet PWA "Nous2", afin d'assurer une cohérence
durable dans le code, le design, et la logique produit.

------------------------------------------------------------------------

## 🧩 Objectif global

L'objectif est d'avoir une base **propre, modulaire, et stable** :\
- **V1** → tout est clean, design system figé, logique centralisée.\
- **V2+** → on ajoute des features sans casser l'existant.

------------------------------------------------------------------------

## 🌳 Arborescence principale

``` txt
nous2/
├─ public/
│  ├─ manifest.json
│  ├─ sw.js
│  └─ icons/
├─ supabase/
│  ├─ migrations/
│  ├─ policies.sql
│  └─ functions/
├─ src/
│  ├─ app/
│  │  ├─ (auth)/
│  │  │  ├─ login/
│  │  │  └─ register/
│  │  ├─ (app)/
│  │  │  ├─ layout.tsx
│  │  │  ├─ home/
│  │  │  ├─ bucket/
│  │  │  ├─ calendar/
│  │  │  ├─ notes/
│  │  │  ├─ profile/
│  │  │  ├─ onboarding/
│  │  │  └─ waiting/
│  │  ├─ api/
│  │  │  ├─ ping/
│  │  │  ├─ profile/delete/
│  │  │  └─ push/{notify,subscribe,unsubscribe}/
│  │  └─ providers.tsx
│  │
│  ├─ components/
│  │  ├─ ui/           # Design system générique (shadcn-like)
│  │  ├─ layout/       # Nav, AppShell, UserAvatar, InstallBanner
│  │  └─ common/       # PageLayout, Section, EmptyState, PageHeader
│  │
│  ├─ features/        # Modules métiers (auth, notes, calendar, etc.)
│  │  ├─ auth/
│  │  ├─ home/
│  │  ├─ calendar/
│  │  ├─ notes/
│  │  └─ profile/
│  │
│  ├─ lib/
│  │  ├─ pwa/          # Logique PWA : push, outbox, badging
│  │  ├─ supabase/     # Clients supabase (client & server)
│  │  ├─ hooks/        # Hooks génériques (useCouple, etc.)
│  │  ├─ store.ts      # Zustand / Jotai store global
│  │  ├─ types.ts
│  │  └─ utils.ts
│  │
│  └─ styles/
│     └─ globals.css
```

------------------------------------------------------------------------

## ⚙️ Logique des dossiers

### `src/app`

➡ Contient toutes les **routes Next.js** (App Router).

-   `(auth)` → pages publiques (`/login`, `/register`).
-   `(app)` → pages connectées avec layout global (`AppShell`).
-   `api` → routes serverless (notifications, profil, ping).
-   `providers.tsx` → contexte global (theme, Supabase, Query
    client...).

### `src/components/ui`

➡ **Design System générique** --- tous les composants réutilisables :\
`Button`, `Card`, `Dialog`, `Input`, `Textarea`, `Calendar`, `Carousel`,
`DarkModeToggle`.

Aucune logique métier ici. Tout est purement visuel et configurable via
props.

### `src/components/layout`

➡ **Structure globale** de l'app :\
- `AppShell.tsx` → wrapper principal des pages connectées.\
- `MainNav.tsx` → navigation principale.\
- `UserAvatar.tsx` → menu utilisateur.\
- `InstallBanner.tsx` → bannière d'installation PWA.

### `src/components/common`

➡ Composants d'UI **semi-génériques**, utilisés sur plusieurs features
: - `PageLayout` → gère largeur max, marges, padding.\
- `PageHeader` → titres cohérents.\
- `Section` → blocs de contenu uniformes.\
- `EmptyState` → affichage état vide générique.

### `src/features`

➡ Chaque feature (domaine métier) a sa propre structure interne :

    features/<feature>/
    ├─ components/
    ├─ hooks/
    └─ api/

Exemples : - `features/calendar` → EventCard, EventForm -
`features/notes` → NotesCarousel - `features/profile` → AvatarUploader,
Preferences, Security - `features/home` → ActivityWidget, LoveCounter,
PingButton - `features/auth` → AuthForm

Règle : tout ce qui dépend de la logique "couple", "profil", "notes"
etc. va ici.

### `src/lib`

➡ Logique **pure** sans JSX.

-   `lib/pwa/*` → gestion des push, outbox, badging.
-   `lib/supabase/*` → clients et helpers Supabase.
-   `lib/hooks/*` → hooks transverses (useCouple).
-   `lib/store.ts` → Zustand store global.
-   `lib/utils.ts` / `lib/types.ts` → helpers génériques.

### `supabase`

➡ Côté base de données et sécurité. - `migrations` → scripts
versionnés. - `functions` → edge functions (event-reminders). -
`policies.sql` → RLS. - `schema.sql` → schéma complet.

### `public`

➡ Tout ce qui est servi statiquement (PWA + assets).

------------------------------------------------------------------------

## 🎨 Design System & UI Rules

-   Palette figée dans `tailwind.config.ts`.
-   Variantes de boutons standardisées :\
    `variant="primary" | "outline" | "ghost" | "destructive"`\
    `size="sm" | "md" | "lg"`
-   Toutes les pages utilisent `PageLayout` (padding + centrage
    uniforme).
-   Pas de couleur ou de spacing hardcodé directement dans les pages.
-   Pas de CSS inline : tout via Tailwind ou UI components.

------------------------------------------------------------------------

## 🧠 Architecture logique

### Flux utilisateur

1.  `register` → onboarding → `home`\
2.  Si user sans couple → `waiting`\
3.  Si connecté → `(app)` avec layout AppShell

### Gestion données

-   Accès DB via Supabase (client & server séparés).
-   RLS activé sur toutes les tables (sécurité par utilisateur/couple).
-   Supression profil → cascade sur toutes les données liées.

### PWA / Notifications

-   Service worker : `public/sw.js`
-   Client logic : `lib/pwa/push.ts` + API `/api/push/*`
-   Bannière d'installation : `components/layout/InstallBanner.tsx`

------------------------------------------------------------------------

## 🔧 Aliases TypeScript

``` json
"paths": {
  "@app/*": ["src/app/*"],
  "@ui/*": ["src/components/ui/*"],
  "@layout/*": ["src/components/layout/*"],
  "@common/*": ["src/components/common/*"],
  "@features/*": ["src/features/*"],
  "@lib/*": ["src/lib/*"],
  "@pwa/*": ["src/lib/pwa/*"],
  "@styles/*": ["src/styles/*"]
}
```

Permet de garder des imports courts et propres.

------------------------------------------------------------------------

## ✅ Règles à respecter

-   Aucun JSX dans `lib/`\
-   Les pages ne font que **composer** les composants de features.\
-   Les composants UI ne contiennent pas de logique métier.\
-   Chaque feature a son dossier dédié (jamais de composants feature
    dans `components/`).\
-   Tous les écrans utilisent `PageLayout`.\
-   Les couleurs, radius, typographie, spacing viennent
    **exclusivement** du design system.

------------------------------------------------------------------------

## 🚀 But final (V1 stable)

-   Codebase modulaire, prête pour la V2.\
-   Uniformité totale de design et d'UX.\
-   PWA 100% fonctionnelle (installable, notifications, offline OK).\
-   Sécurité RGPD et RLS en place.\
-   Features ajoutables sans refactor global.
