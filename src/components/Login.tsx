import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import Logo from './Logo';
import { supabase } from '../lib/supabase';

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#070608] to-[#1a0f0f]">
      <div className="text-center max-w-md p-8">
        <Logo className="mx-auto w-32 h-32 mb-8" />
        <h1 className="text-4xl font-bold text-white mb-8">Lumina Studio</h1>
        <div className="bg-white/10 backdrop-blur p-8 rounded-2xl">
          <Auth
            supabaseClient={supabase}
            providers={['google']}
            appearance={{ theme: ThemeSupa }}
            localization={{ variables: { sign_in: { email_label: 'Email' } } }}
          />
        </div>
      </div>
    </div>
  );
}

