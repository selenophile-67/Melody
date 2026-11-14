import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (cfg: { client_id: string; callback: (resp: { credential?: string }) => void }) => void;
          renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void;
        };
      };
    };
  }
}

export function LoginPage() {
  const { login, loginDemo, loginWithGoogleCredential } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Forgot password flow
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotVerified, setForgotVerified] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const googleBtnRef = useRef<HTMLDivElement | null>(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

  useEffect(() => {
    if (!googleClientId || !googleBtnRef.current) return;
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => {
      if (window.google && googleBtnRef.current) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (resp) => {
            if (resp.credential) {
              try {
                await loginWithGoogleCredential(resp.credential);
                navigate('/');
              } catch (err) {
                setError((err as Error).message);
              }
            }
          },
        });
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'filled_black',
          size: 'large',
          width: 340,
        });
      }
    };
    document.body.appendChild(script);
    return () => {
      script.remove();
    };
  }, [googleClientId, loginWithGoogleCredential, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (!forgotVerified) {
        await api.post('/api/auth/forgot-password', { email });
        setForgotVerified(true);
        showToast('Account found. Set a new password below.', 'info');
      } else {
        await api.post('/api/auth/forgot-password', { email, newPassword });
        showToast('Password updated. You can sign in now.', 'success');
        setForgotMode(false);
        setForgotVerified(false);
        setNewPassword('');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-50 dark:bg-[#09090B]">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#131317] border border-zinc-200 dark:border-white/[0.08] p-7 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Melody</span>
          </Link>
          <span className="font-display font-bold text-lg text-[#FF3B5C]">Melody</span>
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {forgotMode ? 'Reset Password' : 'Sign in to Melody'}
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Every Mood Has a Melody.</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-500">
            {error}
          </div>
        )}

        {!forgotMode ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="text-xs font-medium text-zinc-500">
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3B5C]/40"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="text-xs font-medium text-zinc-500">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotMode(true);
                    setError('');
                  }}
                  className="text-xs text-[#FF3B5C] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3B5C]/40"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-[#FF3B5C] hover:bg-[#FF5270] text-white text-sm font-semibold disabled:opacity-50"
            >
              {submitting ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="forgot-email" className="text-xs font-medium text-zinc-500">
                Registered email
              </label>
              <input
                id="forgot-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm"
              />
            </div>
            {forgotVerified && (
              <div className="space-y-1.5">
                <label htmlFor="reset-pw" className="text-xs font-medium text-zinc-500">
                  New password (min 6 characters)
                </label>
                <input
                  id="reset-pw"
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm"
                />
              </div>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-[#FF3B5C] text-white text-sm font-semibold"
            >
              {forgotVerified ? 'Update Password' : 'Verify Email'}
            </button>
            <button
              type="button"
              onClick={() => {
                setForgotMode(false);
                setForgotVerified(false);
              }}
              className="w-full text-xs text-zinc-500 hover:underline"
            >
              Back to Sign In
            </button>
          </form>
        )}

        <div className="space-y-2.5 pt-2 border-t border-zinc-200 dark:border-zinc-800">
          {googleClientId ? (
            <div ref={googleBtnRef} className="flex justify-center" />
          ) : (
            <button
              type="button"
              onClick={() =>
                showToast(
                  'Configure VITE_GOOGLE_CLIENT_ID in .env to enable Google Sign-In',
                  'info'
                )
              }
              className="w-full py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Continue with Google
            </button>
          )}

          <button
            type="button"
            onClick={async () => {
              await loginDemo();
              navigate('/');
            }}
            className="w-full py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 text-xs font-semibold"
          >
            Explore in Demo Mode
          </button>
        </div>

        <p className="text-center text-xs text-zinc-500">
          New to Melody?{' '}
          <Link to="/register" className="text-[#FF3B5C] font-medium hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
