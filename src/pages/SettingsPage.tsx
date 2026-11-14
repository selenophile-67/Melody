import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Moon, Sun, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { EQUALIZER_PRESETS, usePlayer } from '../context/PlayerContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';

export function SettingsPage() {
  const { user, updatePreferences, logout, loginDemo } = useAuth();
  const { theme, setTheme } = useTheme();
  const {
    autoplay,
    setAutoplay,
    crossfadeSeconds,
    setCrossfadeSeconds,
    eqPreset,
    eqBands,
    applyEqPreset,
    setEqBand,
    clearOfflineCache,
    downloadedTracks,
  } = usePlayer();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleThemeChange = (next: 'dark' | 'light') => {
    setTheme(next);
    updatePreferences({ theme: next }).catch(() => {});
  };

  const handleQualityChange = (audioQuality: 'standard' | 'high' | 'lossless') => {
    updatePreferences({ audioQuality }).catch(() => {});
    showToast(`Audio quality set to ${audioQuality}`, 'success');
  };

  const handleClearHistory = async () => {
    if (!user) return;
    await api.delete('/api/history');
    showToast('Listening history cleared', 'info');
  };

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Configure appearance, audio fidelity, equalizer, privacy, and account preferences.
        </p>
      </div>

      {/* Account */}
      <section className="p-6 rounded-2xl bg-white dark:bg-[#131317] border border-zinc-200/80 dark:border-white/[0.07] space-y-4">
        <h2 className="text-lg font-semibold">Account</h2>
        {user ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium">{user.username}</div>
              <div className="text-xs text-zinc-500">{user.email}</div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/profile"
                className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Edit Profile
              </Link>
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-rose-500 hover:bg-rose-500/10"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log out</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link to="/login" className="px-4 py-2 rounded-xl bg-[#FF3B5C] text-white text-xs font-semibold">
              Sign In
            </Link>
            <button
              type="button"
              onClick={loginDemo}
              className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-medium"
            >
              Use Demo Account
            </button>
          </div>
        )}
      </section>

      {/* Appearance */}
      <section className="p-6 rounded-2xl bg-white dark:bg-[#131317] border border-zinc-200/80 dark:border-white/[0.07] space-y-4">
        <h2 className="text-lg font-semibold">Appearance</h2>
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-medium">Theme</div>
            <div className="text-xs text-zinc-500">Switch between Dark studio mode and Light mode</div>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900">
            <button
              type="button"
              onClick={() => handleThemeChange('dark')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                theme === 'dark' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Dark</span>
            </button>
            <button
              type="button"
              onClick={() => handleThemeChange('light')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                theme === 'light' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Light</span>
            </button>
          </div>
        </div>
      </section>

      {/* Playback & Audio Quality */}
      <section className="p-6 rounded-2xl bg-white dark:bg-[#131317] border border-zinc-200/80 dark:border-white/[0.07] space-y-5">
        <h2 className="text-lg font-semibold">Playback & Audio Quality</h2>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium">Streaming Quality</div>
            <div className="text-xs text-zinc-500">Select preferred audio fidelity</div>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 self-start">
            {(['standard', 'high', 'lossless'] as const).map((q) => {
              const active = (user?.preferences.audioQuality || 'high') === q;
              return (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleQualityChange(q)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize ${
                    active ? 'bg-[#FF3B5C] text-white' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  {q}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-medium">Autoplay Smart Radio</div>
            <div className="text-xs text-zinc-500">Continue playing similar songs when your queue ends</div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={autoplay}
            onClick={() => setAutoplay(!autoplay)}
            className={`w-11 h-6 rounded-full transition-colors p-0.5 ${autoplay ? 'bg-[#FF3B5C]' : 'bg-zinc-300 dark:bg-zinc-700'}`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                autoplay ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Crossfade</div>
              <div className="text-xs text-zinc-500">Smooth volume transition between consecutive tracks</div>
            </div>
            <span className="text-xs font-mono-tabular text-[#FF3B5C]">{crossfadeSeconds}s</span>
          </div>
          <input
            type="range"
            min={0}
            max={10}
            step={1}
            value={crossfadeSeconds}
            onChange={(e) => setCrossfadeSeconds(Number(e.target.value))}
            aria-label="Crossfade seconds"
            className="w-full accent-[#FF3B5C]"
          />
        </div>

        {/* Equalizer */}
        <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Audio Equalizer</div>
            <span className="text-xs text-[#FF3B5C] font-medium">{eqPreset}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Object.keys(EQUALIZER_PRESETS).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => applyEqPreset(preset)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                  eqPreset === preset
                    ? 'bg-[#FF3B5C] text-white border-[#FF3B5C]'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-5 gap-3 pt-2">
            {['60 Hz', '230 Hz', '910 Hz', '3.6 kHz', '14 kHz'].map((band, idx) => (
              <div key={band} className="space-y-1 text-center">
                <input
                  type="range"
                  min={-12}
                  max={12}
                  step={1}
                  value={eqBands[idx] || 0}
                  onChange={(e) => setEqBand(idx, Number(e.target.value))}
                  aria-label={`${band} gain`}
                  className="w-full accent-[#FF3B5C]"
                />
                <div className="text-[11px] font-mono-tabular text-zinc-500">
                  {eqBands[idx] > 0 ? `+${eqBands[idx]}` : eqBands[idx]} dB
                </div>
                <div className="text-[11px] text-zinc-400">{band}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy, Notifications & Cache */}
      <section className="p-6 rounded-2xl bg-white dark:bg-[#131317] border border-zinc-200/80 dark:border-white/[0.07] space-y-5">
        <h2 className="text-lg font-semibold">Privacy & Storage</h2>

        {user && (
          <>
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-medium">Release Notifications</div>
                <div className="text-xs text-zinc-500">Receive alerts when followed artists drop new albums</div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={user.preferences.notificationsEnabled}
                onClick={() =>
                  updatePreferences({ notificationsEnabled: !user.preferences.notificationsEnabled })
                }
                className={`w-11 h-6 rounded-full transition-colors p-0.5 ${
                  user.preferences.notificationsEnabled ? 'bg-[#FF3B5C]' : 'bg-zinc-300 dark:bg-zinc-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    user.preferences.notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-medium">Private Listening Session</div>
                <div className="text-xs text-zinc-500">Pause recording tracks to your listening history</div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={user.preferences.privateSession}
                onClick={() => updatePreferences({ privateSession: !user.preferences.privateSession })}
                className={`w-11 h-6 rounded-full transition-colors p-0.5 ${
                  user.preferences.privateSession ? 'bg-[#FF3B5C]' : 'bg-zinc-300 dark:bg-zinc-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    user.preferences.privateSession ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </>
        )}

        <div className="pt-2 flex flex-wrap gap-3">
          {user && (
            <button
              type="button"
              onClick={handleClearHistory}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Listening History</span>
            </button>
          )}
          <button
            type="button"
            onClick={clearOfflineCache}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Offline Cache ({downloadedTracks.length} cached)</span>
          </button>
        </div>
      </section>
    </div>
  );
}
