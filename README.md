
## 💕 Page “Couple” (statut + compteur de jours)

### ✅ ce qui marche

* le compteur est lisible, bon contraste.
* le message de bienvenue donne une touche humaine.

### 💡 améliorations

* **hiérarchie visuelle** : centre le bloc compteur, augmente la taille du chiffre (`text-5xl font-bold`) et place “jours” en dessous en plus petit (`text-base opacity-70`).
* **motion subtile** : fais un petit fade-in ou un compteur animé quand la page s’ouvre.
* **ajoute une photo de couple** (ou fond dégradé doux) au-dessus du compteur, ça ancre l’émotion.
* **gap bas** : laisse toujours un `pb-[calc(env(safe-area-inset-bottom)+var(--nav-h)+16px)]` pour respirer au-dessus de la navbar.

---

## 💌 Page “Notes d’amour”

### ✅ ce qui marche

* scroll vertical avec effet stack : élégant et original.
* composer clair et accessible.

### 💡 améliorations

* **ombre + dégradé sur les cartes** : léger `shadow-lg` et `from-pink-500/10 to-transparent` sur le fond pour la chaleur visuelle.
* **scroll smooth + inertie mobile** (Lenis déjà présent) → garde-le.
* **transition sur suppression/envoi** : petit fade-out des cartes quand supprimées.
* **composer sticky** : ajouter un léger flou derrière (`backdrop-blur-xl bg-white/70 dark:bg-neutral-900/70`).
* **responsive** : sur iPad, agrandir un peu les cartes (ex: `h-96`) pour occuper l’espace.

---

## ✅ Page “Bucket list”

### ✅ ce qui marche

* structure claire, CTA “Ajouter” visible.
* dark/light bien géré.

### 💡 améliorations

* **cartes bucket arrondies uniformes** (`rounded-2xl p-4`) avec ombre douce.
* **couleur visuelle d’état** :

  * items non faits → bordure `border-pink-200/20`,
  * items faits → fond légèrement grisé (`bg-white/40 dark:bg-neutral-800/40`).
* **ajoute un micro-feedback** sur le toggle (petit scale-down/scale-up rapide de l’icône ✅).
* **placeholder dynamique** : si vide, affiche un cœur brisé “Rien à faire à deux ? 😢 Ajoutez une idée !”.
* **scroll interne fluide** déjà bien, juste ajoute `scroll-snap-type: y mandatory` pour un “feel mobile natif”.

---

## 📅 Page “Événements”

### ✅ ce qui marche

* lisible, bien séparé entre le formulaire et les events.

### 💡 améliorations

* **fixer le formulaire** : mets le bloc “Ajouter un événement” sticky top, avec ombre subtile quand on scroll.
* **espacement** : ajoute un `gap-y-3` entre les events.
* **carte event** :

  * haut = date en `text-xs uppercase opacity-70`
  * titre = `font-semibold text-lg`
  * temps = icône d’horloge 🕒 avant les heures (lucide-react `Clock3`)
  * note = `italic text-sm opacity-60` si renseignée.
* **feedback vide** : un petit message type “Aucun événement prévu 🗓️”.

---

## 👤 Page “Profil”

### ✅ ce qui marche

* layout cohérent, sections bien séparées.

### 💡 améliorations

* **photo de profil plus mise en avant** : cercle avec ombre et anneau (`ring-2 ring-pink-400/50`).
* **titre + emoji dynamique** → par ex. “Salut Noam 👋” ou “💞 Profil amoureux”.
* **cards actions uniformes** : arrondis constants (`rounded-2xl`), espacement fixe (`p-3 sm:p-4`).
* **transitions sur hover** → `hover:scale-[1.02] transition-transform`.
* **toggle thème clair/sombre** : mets un vrai bouton pill arrondi avec icône 🌙☀️, pas juste un texte.
* **section “stats”** : montre nombre de notes, d’événements, etc. en mini-cards alignées.

---

## 🎨 Cohérence globale

* **unités de bordure** : toujours `rounded-2xl`, jamais mixé.
* **espacement universel** : `gap-3` entre sections, `p-4` minimum dans les cartes.
* **ombre standard** : `shadow-[0_0_10px_rgba(0,0,0,0.2)]` (pas trop fort, garde la sobriété).
* **typo** : passe tout en `font-sans tracking-tight`, titres `font-semibold`.
* **feedback tactile** : tous les boutons → `active:scale-[0.97]`.
* **safe-area partout** : haut/bas dans chaque page (`pt-[env(safe-area-inset-top)]`, `pb-[calc(env(safe-area-inset-bottom)+var(--nav-h))]`).

---

## 💫 Bonus UX pour “prod-ready”

* **animations globales** avec [Framer Motion](https://www.framer.com/motion/):

  * fade + slide sur les pages (entrée/sortie).
  * `whileTap={{ scale: 0.95 }}` sur les boutons.
* **indicateur de chargement** (spinner ou skeleton) avant affichage des données.
* **microfeedback push** : toaster quand une note/bucket est ajoutée.
* **icônes cohérentes** : Lucide `Heart`, `Calendar`, `ListTodo`, `User` → tous avec la même épaisseur.
* **palette harmonisée** : base sur un **accent rose/orange doux**, dégradé `from-pink-500 to-orange-400`.

---

si tu veux, je peux te faire une **UI Preview Figma-style** (ou directement les classes Tailwind à injecter page par page) avec ces principes appliqués : tu veux que je te fasse ça pour une page (ex : *profil* ou *bucket list*) pour commencer ?
