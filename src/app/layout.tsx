import '../styles/globals.css';
import { ThemeProvider } from 'next-themes';
import Providers from './providers';

export const metadata = {
  title: 'Nous2',
  description: 'App de couple ❤️',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="min-h-[100svh] bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}