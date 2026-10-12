import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { ArrowRight, Film, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export default function Login() {
  const navigate = useNavigate();

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#08090c] px-5 py-12 text-[#f2f0eb]">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[460px] w-[680px] -translate-x-1/2 rounded-full bg-[#f4b84a]/[0.055] blur-[120px]" />
      <div className="relative w-full max-w-[420px]">
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#f4b84a]/25 bg-[#f4b84a]/[0.08] text-[#f4c66f]"><Film size={21}/></div>
          <div><div className="text-sm font-bold tracking-[0.22em]">LUMINA</div><div className="mt-1 text-[9px] tracking-[0.2em] text-[#777982]">CREATIVE STUDIO</div></div>
        </div>
        <section className="rounded-2xl border border-white/[0.09] bg-[#0e0f13]/95 p-6 shadow-2xl shadow-black/30 sm:p-8">
          <div className="mb-7 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-white/[0.08] bg-[#15161b]"><Logo className="h-14 w-14"/></div>
            <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.22em] text-[#f4c66f]">Your creative workspace</p>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Welcome to LUMINA</h1>
            <p className="mx-auto mt-2 max-w-[290px] text-xs leading-5 text-[#8e9099]">A focused studio for editing, color, and AI-assisted video workflows.</p>
          </div>
          {isSupabaseConfigured ? (
            <div className="rounded-xl border border-white/[0.07] bg-[#090a0d] p-4">
              <Auth
                supabaseClient={supabase}
                providers={['google']}
                appearance={{ theme: ThemeSupa, variables: { default: { colors: { brand: '#f4b84a', brandAccent: '#ffd078', inputBackground: '#111217', inputBorder: '#30313a', inputText: '#f2f0eb', defaultButtonBackground: '#17181e', defaultButtonText: '#f2f0eb' } } } }}
                localization={{ variables: { sign_in: { email_label: 'Email address' } } }}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-3 rounded-xl border border-[#f4b84a]/15 bg-[#f4b84a]/[0.045] p-3.5">
                <ShieldCheck size={17} className="mt-0.5 shrink-0 text-[#f4c66f]"/>
                <div><p className="text-xs font-medium text-[#e9e4d8]">Preview workspace</p><p className="mt-1 text-[11px] leading-5 text-[#8e9099]">Authentication is not configured on this preview. You can enter the editor and work locally without an account.</p></div>
              </div>
              <button onClick={() => navigate('/editor', { replace: true })} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#f4b84a] px-4 py-3 text-xs font-bold text-[#17120a] transition hover:bg-[#ffd078]">Enter Studio <ArrowRight size={15}/></button>
            </div>
          )}
          <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-[#62646d]"><ShieldCheck size={12}/> Your creative work, your control</div>
        </section>
        <p className="mt-5 text-center text-[9px] tracking-[0.12em] text-[#555760]">LUMINA STUDIO · BROWSER PREVIEW</p>
      </div>
    </main>
  );
}
