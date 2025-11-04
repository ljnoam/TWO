# Comment utiliser Codex avec le projet Nous2

## 1️⃣ Ajouter le contexte
- Place `AI_PROMPT.md` à la racine.
- Colle tout son contenu dans ton interface **Codex** comme “Contexte principal”.

## 2️⃣ Configurer la CI
- Place `.github/workflows/ci.yml` dans le repo.
- Elle s’exécute à chaque push/PR et empêche tout merge cassé.

## 3️⃣ Réorganiser le code
- Lance :
  ```bash
  bash scripts/git-mv-mapping.sh
Puis :

pnpm build