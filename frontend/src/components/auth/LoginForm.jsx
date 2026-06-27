import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { validateEmail } from '../../utils';
import SubmitButton from './SubmitButton';

const inputClass =
  'w-full rounded-xl border border-white/20 bg-white/10 py-3.5 text-sm text-white placeholder:text-white/40 outline-none transition-all focus:border-white/40 focus:ring-2 focus:ring-white/25 focus:bg-white/15 backdrop-blur-sm hover:border-white/30';

const iconClass =
  'pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50 transition-colors group-focus-within:text-white/80';

export default function LoginForm() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Redirect when authentication succeeds
  useEffect(() => {
    if (isAuthenticated && submitting) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, submitting, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!validateEmail(email)) {
      setError('Please enter a valid email');
      return;
    }
    setSubmitting(true);
    try {
      await login({ email, password });
      // Navigation happens via useEffect once isAuthenticated updates.
    } catch (err) {
      // FIX: surface the field-level server detail when present
      // (e.g. for validation errors that somehow reach the server).
      // For 401 "Invalid email or password", the server's top-level message
      // is already a clean, user-safe string.
      const detail = err?.details?.[0]?.message;
      setError(detail || err?.message || 'Login failed');
    } finally {
      // FIX BUG-H09: always clear submitting — covers success, error, and back-nav.
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="animate-slide-up rounded-2xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-xl glass-reflection hover-up"
      style={{ animationDelay: '0.1s' }}
    >
      <div className="mb-7">
        <h1 className="text-3xl font-bold text-white">
          Welcome back{' '}
          <span className="inline-block animate-bounce-in" style={{ animationDelay: '0.5s' }}>
            👋
          </span>
        </h1>
        <p className="mt-2 text-sm text-white/70">Log in to manage your tasks</p>
      </div>

      <div className="mb-5">
        <label className="mb-2 block text-xs font-medium text-white/80" htmlFor="login-email">
          Email address
        </label>
        <div className="relative group">
          <span className={iconClass}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M0 4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H0zm2-.5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V4.5a1 1 0 0 0-1-1z" />
              <path d="M0 4l9 6.343L18 4V3L9 9.243 0 3z" />
            </svg>
          </span>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={`${inputClass} pl-11 pr-4`}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>
      </div>

      <div className="mb-7">
        <label className="mb-2 block text-xs font-medium text-white/80" htmlFor="login-password">
          Password
        </label>
        <div className="relative group">
          <span className={iconClass}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 1a2 2 0 0 1 2 2v2H6V3a2 2 0 0 1 2-2zm3 4V3a3 3 0 0 0-6 0v2H3v.9m0-.9a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1H3z" />
            </svg>
          </span>
          <input
            id="login-password"
            type={showPass ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className={`${inputClass} pl-11 pr-11`}
            placeholder="••••••••"
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPass((p) => !p)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/50 transition-all hover:text-white hover:scale-110 active:scale-95"
            aria-label={showPass ? 'Hide password' : 'Show password'}
          >
            {showPass ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-7-5.5S9 10.5 0 12s3 5.5 7 5.5 3.817-1.791 5.359-3.262zM12 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM8 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                <path d="m10.79 12.912-.835-1-.894-.706-.269.284c-.183.198-.382.384-.596.553a1.014 1.014 0 0 1-.704-.054 5.061 5.061 0 0 1-.882-.77 4.792 4.792 0 0 1-1.159-1.883l1.41-1.97A.944.944 0 0 0 6.5 7C3.462 7 1 9.346 1 12c0 0 5.333 4 9.667 4zm.5-3.5L8 6c1 0 2 1 2 2Z" />
                <path d="M13.44 1.731 1.794 13.82a.5.5 0 0 0 .708 .708L14.139 2.44a.5.5 0 0 0-.708-.708Z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-5 animate-slide-up rounded-xl border border-red-400/40 bg-red-500/25 px-4 py-3 text-sm text-red-100 backdrop-blur-sm"
        >
          <span className="mr-2 text-base">⚠️</span>
          {error}
        </div>
      )}

      <SubmitButton
        submitting={submitting}
        loadingText="Logging in..."
        idleText="Log in"
        icon="🔐"
        gradient="from-amber-300 via-pink-400 to-fuchsia-500"
        textColor="text-fuchsia-950"
        shadow="shadow-fuchsia-500/30"
        hoverShadow="hover:shadow-[0_10px_30px_rgba(217,70,239,0.45)]"
      />

      <p className="mt-6 text-center text-sm text-white/60">
        Don&apos;t have an account?{' '}
        <Link
          to="/signup"
          className="font-semibold text-white underline-offset-4 transition-all hover:underline hover:text-amber-200"
        >
          Create account
        </Link>
      </p>
    </form>
  );
}
