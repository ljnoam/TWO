import MainNav from '@/components/nav/MainNav';

export default function FeaturesLayout({ children }: { children: React.ReactNode }) {
  return (
    // fond lisible en light ET dark, et texte adapté
    <div className="min-h-[100svh] bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50">
      {/* contenu, on évite que la nav recouvre le bas */}
      <div className="px-3 sm:px-4 pb-[84px] sm:pb-[96px] max-w-3xl mx-auto">
        {children}
      </div>

      {/* bottom nav flottante */}
      <MainNav />
    </div>
  );
}
