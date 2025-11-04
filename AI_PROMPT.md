# 🧠 AI PROMPT — Refactor & Stabilize "Nous2" (Next.js PWA)

## Context
Framework : Next.js (App Router) + TypeScript + Tailwind + Supabase + PWA (Workbox) + shadcn-like UI.

**Goal :** livrer une V1 stable, propre et uniforme pour pouvoir ensuite ajouter les features V2 sans rien casser.

---

## 🔒 Non-négociables
- Le projet doit **toujours builder** (`pnpm build`) et passer les tests (`pnpm test`, `pnpm typecheck`).
- Pas de JSX dans `src/lib/*`.
- Logique PWA uniquement dans `src/lib/pwa/*`.
- Pas de styles bruts dans les pages : tout passe par `components/ui/*`.
- Respect strict de la structure ci-dessous.
- Les RLS Supabase doivent rester correctes (aucune régression de sécurité).

---

## 🌳 Structure finale du projet
src/
app/
(auth)/{login,register}/page.tsx
(app)/
layout.tsx
{home,bucket,calendar,notes,profile,onboarding,waiting}/page.tsx
api/{ping,profile/delete,push/{notify,subscribe,unsubscribe}}/route.ts
providers.tsx
components/
ui/*
layout/{AppShell,MainNav,UserAvatar,InstallBanner}.tsx
common/{PageLayout,PageHeader,Section,EmptyState}.tsx
features/
auth/components/AuthForm.tsx
home/components/{ActivityWidget,LoveCounter,PingButton}.tsx
calendar/components/{EventCard,EventForm}.tsx
notes/components/NotesCarousel.tsx
profile/components/{AvatarUploader,Preferences,Security}.tsx
lib/
pwa/{push.ts,outbox.ts,badging.ts,sw-client.ts}
supabase/{client.ts,server.ts}
hooks/{useCouple.ts}
{store.ts,types.ts,utils.ts}
styles/globals.css
public/{manifest.json,sw.js,icons/,favicon.ico}
supabase/{migrations/,functions/*,schema.sql,policies.sql,functions.sql}

pgsql
Copier le code

---

## 🧭 TypeScript Path Aliases
```json
{
  "compilerOptions": {
    "baseUrl": ".",
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
  }
}
🧩 Étapes à suivre
Étape 1 – Auth workflow (TWO-6)
Nettoyer (auth)/login, (auth)/register, AuthForm.

Flux complet : register → onboarding → home.

Rediriger user non-onboardé vers /onboarding, et sans couple vers /waiting.

Centraliser la logique Supabase.

Étape 2 – RGPD & sécurité (TWO-5)
Vérifier RLS, cascades, /api/profile/delete.

Ajouter suppression de compte dans UI.

Mention légale dans le footer.

Étape 3 – Feature encapsulation
Déplacer les composants dans features/*.

Supprimer les dossiers morts.

Étape 4 – Design system & uniformité
Fixer tailwind.config.ts + globals.css.

Créer AppShell, AuthLayout, PageLayout, PageHeader, EmptyState.

Aucune page avec <button> brut.

Étape 5 – UX /home & /notes
Refonte visuelle, cohérence UI/UX, CTA clairs.

Étape 6 – Notifications PWA
Vérifier sw-client.ts, /api/push/*, permissions, unsubscribe.

Étape 7 – Emails & polish final
Templates Supabase, accessibilité, loading states, cohérence visuelle.

🧪 CI Checks obligatoires
pnpm lint

pnpm typecheck

pnpm test

pnpm build

Tout doit passer avant merge.

💡 Règles d’édition
Petits commits propres.

1 étape par PR.

Si fichier vide : remplir ou supprimer.

Documenter les changements de routes.