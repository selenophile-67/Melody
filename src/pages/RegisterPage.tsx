import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await register(username, email, password, confirmPassword);
      navigate('/');
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
          <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
          <p className="text-xs text-zinc-500 mt-1">Save playlists, liked songs, and listening stats.</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-500">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="reg-username" className="text-xs font-medium text-zinc-500">
              Username
            </label>
            <input
              id="reg-username"
              type="text"
              required
              minLength={2}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your display name"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3B5C]/40"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="reg-email" className="text-xs font-medium text-zinc-500">
              Email address
            </label>
            <input
              id="reg-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3B5C]/40"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="reg-password" className="text-xs font-medium text-zinc-500">
              Password
            </label>
            <input
              id="reg-password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3B5C]/40"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="reg-confirm" className="text-xs font-medium text-zinc-500">
              Confirm password
            </label>
            <input
              id="reg-confirm"
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat password"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3B5C]/40"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-xl bg-[#FF3B5C] hover:bg-[#FF5270] text-white text-sm font-semibold disabled:opacity-50"
          >
            {submitting ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-xs text-zinc-500">
          Already have an account?{' '}
          <Link to="/login" className="text-[#FF3B5C] font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
