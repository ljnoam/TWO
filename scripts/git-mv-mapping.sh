#!/usr/bin/env bash
set -euo pipefail

# Run from repo root

git mv src/components/nav/MainNav.tsx src/components/layout/MainNav.tsx 2>/dev/null || true
git mv src/components/UserAvatar.tsx src/components/layout/UserAvatar.tsx 2>/dev/null || true
git mv src/components/pwa/InstallBanner.tsx src/components/layout/InstallBanner.tsx 2>/dev/null || true

mkdir -p src/features/auth/components
git mv src/components/auth/AuthForm.tsx src/features/auth/components/AuthForm.tsx 2>/dev/null || true

mkdir -p src/features/home/components
git mv src/components/home/ActivityWidget.tsx src/features/home/components/ActivityWidget.tsx 2>/dev/null || true
git mv src/components/home/love-counter.tsx src/features/home/components/LoveCounter.tsx 2>/dev/null || true
git mv src/components/home/ping-button.tsx src/features/home/components/PingButton.tsx 2>/dev/null || true

mkdir -p src/features/calendar/components
git mv src/components/calendar/EventCard.tsx src/features/calendar/components/EventCard.tsx 2>/dev/null || true
git mv src/components/calendar/EventForm.tsx src/features/calendar/components/EventForm.tsx 2>/dev/null || true

mkdir -p src/features/notes/components
git mv src/components/notes/NotesCarousel.tsx src/features/notes/components/NotesCarousel.tsx 2>/dev/null || true

mkdir -p src/features/profile/components
git mv src/components/profile/AvatarUploader.tsx src/features/profile/components/AvatarUploader.tsx 2>/dev/null || true
git mv src/components/profile/Preferences.tsx src/features/profile/components/Preferences.tsx 2>/dev/null || true
git mv src/components/profile/Security.tsx src/features/profile/components/Security.tsx 2>/dev/null || true

mkdir -p src/lib/pwa
git mv src/lib/push.ts src/lib/pwa/push.ts 2>/dev/null || true
git mv src/lib/outbox.ts src/lib/pwa/outbox.ts 2>/dev/null || true
git mv src/lib/badging.ts src/lib/pwa/badging.ts 2>/dev/null || true
git mv src/app/sw-client.ts src/lib/pwa/sw-client.ts 2>/dev/null || true

# favicon move if present
if [ -f "src/app/(app)/favicon.ico" ]; then
  mkdir -p public
  git mv "src/app/(app)/favicon.ico" public/favicon.ico
fi

echo "✅ Moves done. Fix imports (use TS aliases), then run 'pnpm build'."
