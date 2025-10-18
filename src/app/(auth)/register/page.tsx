'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/home');
    });
  }, [router]);

  return (
    <main className="space-y-4 max-w-sm mx-auto">
      <h1 className="text-2xl font-semibold">Connexion</h1>

      <form className="space-y-3" onSubmit={async (e) => {
        e.preventDefault();
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          // si compte non existant → signUp
          const { error: e2 } = await supabase.auth.signUp({ email, password });
          if (e2) alert(e2.message);
        }
        router.replace('/onboarding');
      }}>
        <input className="w-full border rounded px-3 py-2" placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="w-full border rounded px-3 py-2" placeholder="mot de passe" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button className="w-full border rounded px-3 py-2">Entrer</button>
      </form>
    </main>
  );
}
