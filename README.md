Voici une version propre et lisible en **Markdown** pour ton README GitHub 👇

---

# 🚀 Roadmap V1 — App Couple (TWO)

## Étape 1 — Workflow de connexion & création de compte (TWO-6)

**🎯 Objectif :** le flux auth doit être béton, sinon tout le reste est inutile.

### À faire

* Vérifier / nettoyer `(auth)/login` & `(auth)/register` + `AuthForm`.
* Clarifier le flux :

  ```
  user → register → onboarding → home
  user non onboardé → /onboarding
  user sans couple → /waiting
  ```
* Centraliser la logique auth dans `lib/supabase/*` (+ éventuellement `features/auth`).

### ✅ Sortie

Tu peux te log / sign up, être redirigé où il faut, sans edge cases chelous.

---

## Étape 2 — RGPD, RLS & sécurité données (TWO-5 + base backend propre)

**🎯 Objectif :** consolider la couche data.

### À faire

* Revoir `supabase/schema.sql`, `policies.sql`, `migrations/*` :

  * Vérifier que chaque table app est protégée par des **RLS** claires.
  * Vérifier les cascades sur suppression de profil (`/api/profile/delete`).
* Ajouter chiffrement si besoin (client-side ou via les politiques Supabase).
* Mettre en place les **basics RGPD** :

  * Route/UI pour supprimer le compte et les données.
  * Mentions légales / privacy dans le footer (même minimalistes).

### ✅ Résultat

Base propre, données sécurisées, aucune fuite entre couples. Tu ne touches plus à cette partie en V2.

---

## Étape 3 — Refonte de l’arborescence & nettoyage des features

**🎯 Objectif :** gros ménage structurel.

### À faire

* Introduire `features/` et déplacer :

  ```
  components/calendar/* → features/calendar/components/*
  components/notes/* → features/notes/components/*
  components/home/* → features/home/components/*
  components/profile/* → features/profile/components/*
  ```
* Standardiser les pages :

  ```
  app/(app)/home/page.tsx → features/home/components/*
  app/(app)/notes/page.tsx → features/notes/*
  ```
* Ranger la logique PWA :

  ```
  lib/pwa/{push.ts,outbox.ts,badging.ts}
  components/pwa/InstallBanner.tsx
  ```
* Supprimer les dossiers vides inutilisés (`components/bucket`, `components/common`, etc.)

### ✅ Résultat

Chaque feature est isolée.
En V2, tu peux juste ajouter `features/someNewThing` + `app/(app)/some-new-route/page.tsx`.

---

## Étape 4 — Design system & uniformité globale (TWO-3)

**🎯 Objectif :** fixer le design system et harmoniser toute l’UI.

### À faire

* Mettre à jour `tailwind.config.ts` + `globals.css` :

  * couleurs, font, radius, spacing, etc.
* Passer sur tous les composants `ui/*` :

  * vérifier les props / variantes,
  * supprimer les styles custom random.
* Créer les layouts globaux :

  ```
  components/layout/AppShell → utilisé dans app/(app)/layout.tsx
  components/layout/AuthLayout → utilisé pour (auth)
  ```
* Refactor rapide des pages pour utiliser :

  * `PageLayout` / `AppShell`
  * `Button`, `Card`, `Input`, `Textarea`, etc. (plus de `<button>` brut).

### ✅ Résultat

Cohérence visuelle sur **toutes les pages**, base solide avant la refonte UX.

---

## Étape 5 — Refonte de la homepage et de /notes (TWO-8 & TWO-9)

**🎯 Objectif :** passer à la couche UX/produit.

### Homepage `/home`

* S’appuyer sur le design system.
* Clarifier ce que voit un couple :

  * compteur de jours,
  * prochains events du calendrier,
  * dernières notes / mots doux,
  * CTA principaux (ajouter une date, écrire une note…).

### Page `/notes`

* Revoir `NotesCarousel` :

  * meilleure navigation (filtre auteur, type…),
  * transitions clean, states “vide”, etc.
* Utiliser les composants UI (`Card`, `Button`, `Dialog`, etc.), pas de custom sauvage.

### ✅ Résultat

C’est **l’étape la plus visible** pour l’utilisateur final, mais sur une base stable. Rien ne casse.

---

## Étape 6 — Notifications PWA & expérience offline (TWO-4)

**🎯 Objectif :** finaliser la partie PWA.

### À faire

* Vérifier le flow complet :

  ```
  InstallBanner → install PWA
  Permissions de notifications → lib/pwa/push.ts + /api/push/subscribe
  ```
* Gérer les cas :

  * user refuse → ne pas spammer.
  * resubscribe / unsubscribe (`/api/push/unsubscribe`).
* Valider que les notifs partent (edge function, event-reminders, `/api/push/notify`).
* Optionnel : mini “centre de notifs” dans l’app (historique simple).

---

## Étape 7 — Templates d’emails Supabase + polish (TWO-7)

**🎯 Objectif :** boucler la V1 proprement.

### À faire

* Configurer les **templates d’emails Supabase** :

  * confirmation, reset password, etc.
  * branding du site (couleurs, ton, logo).
* Passer un tour de **polish global** :

  * états de chargement / empty states,
  * messages d’erreur cohérents,
  * accessibilité basique (labels, aria, contrastes),
  * favicon / icônes alignés au thème.

### ✅ Résultat

Une **V1 stable, clean et cohérente**, prête à shipper.

---

💡 *TWO-V1 = Base solide + UX clean + fondations prêtes pour la V2.*
