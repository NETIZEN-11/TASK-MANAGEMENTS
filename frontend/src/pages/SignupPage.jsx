import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SignupForm from '../components/auth/SignupForm';

export default function SignupPage() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/" replace />;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-sky-600 px-4 animate-gradient">

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-72 w-72 animate-blob rounded-full bg-emerald-400 opacity-30 mix-blend-screen blur-3xl" />
        <div className="absolute -right-16 top-1/4 h-80 w-80 animate-blob-delayed rounded-full bg-sky-400 opacity-30 mix-blend-screen blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 animate-blob rounded-full bg-lime-400 opacity-25 mix-blend-screen blur-3xl" />
        <div className="absolute top-1/2 right-1/4 h-56 w-56 animate-blob-delayed rounded-full bg-orange-400 opacity-25 mix-blend-screen blur-2xl" />
      </div>

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 h-2 w-2 animate-sparkle rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" style={{animationDelay: '0s'}} />
        <div className="absolute top-1/3 right-1/3 h-1.5 w-1.5 animate-sparkle rounded-full bg-emerald-200 shadow-[0_0_10px_rgba(167,243,208,0.8)]" style={{animationDelay: '1s'}} />
        <div className="absolute bottom-1/4 left-1/2 h-1.5 w-1.5 animate-sparkle rounded-full bg-sky-200 shadow-[0_0_10px_rgba(186,230,253,0.8)]" style={{animationDelay: '0.5s'}} />
        <div className="absolute top-2/3 left-2/3 h-2 w-2 animate-sparkle rounded-full bg-lime-200 shadow-[0_0_10px_rgba(217,249,157,0.8)]" style={{animationDelay: '1.5s'}} />
        <div className="absolute bottom-1/3 right-1/2 h-1.5 w-1.5 animate-sparkle rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" style={{animationDelay: '0.7s'}} />
      </div>

      <div className="pointer-events-none absolute left-8 top-1/4 hidden animate-float xl:block">
        <div className="w-44 rounded-xl border border-white/20 bg-white/10 p-3 shadow-2xl backdrop-blur-md glass-reflection">
          <div className="mb-2 h-2 w-3/4 rounded-full bg-white/40 shimmer" />
          <div className="h-2 w-1/2 rounded-full bg-white/20" />
          <div className="mt-3 flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-emerald-400 pulse-glow" />
            <div className="h-2 w-12 rounded-full bg-white/30" />
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute right-8 top-1/3 hidden animate-float-delayed xl:block">
        <div className="w-44 rounded-xl border border-white/20 bg-white/10 p-3 shadow-2xl backdrop-blur-md glass-reflection">
          <div className="mb-2 h-2 w-2/3 rounded-full bg-white/40 shimmer" />
          <div className="h-2 w-3/4 rounded-full bg-white/20" />
          <div className="mt-3 flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-orange-400 pulse-glow" />
            <div className="h-2 w-16 rounded-full bg-white/30" />
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2">
        <div className="h-full w-full animate-rotate-slow rounded-full border-2 border-white/10 border-t-emerald-300/50 border-r-sky-300/40" />
      </div>
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[640px] w-[640px] -translate-x-1/2 -translate-y-1/2">
        <div className="h-full w-full animate-rotate-slow rounded-full border-2 border-white/10 border-b-lime-300/50 border-l-orange-300/40 opacity-60" style={{animationDirection: 'reverse'}} />
      </div>

      <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-gradient-to-tr from-emerald-400/20 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-gradient-to-bl from-sky-400/20 to-transparent blur-3xl" />

      <div className="animate-slide-up relative z-10 w-full max-w-md">
        <div className="mb-6 flex justify-center animate-bounce-in">
          <div className="group relative flex items-center gap-3 rounded-2xl border border-white/30 bg-white/15 px-6 py-3 shadow-2xl backdrop-blur-md hover-up glass-reflection">
            <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-lime-300 via-emerald-400 to-teal-500 text-2xl shadow-lg shadow-emerald-500/40 transition-transform duration-500 group-hover:-rotate-12 group-hover:scale-110">
              <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]">✨</span>
              <span className="absolute -inset-1 -z-10 rounded-2xl bg-gradient-to-br from-lime-300 via-emerald-400 to-teal-500 opacity-50 blur-md" />
            </span>
            <div className="flex flex-col leading-tight">
              <span className="text-xl font-extrabold tracking-tight text-white">
                Join <span className="bg-gradient-to-r from-lime-200 via-emerald-200 to-sky-200 bg-clip-text text-transparent">TaskFlow</span>
              </span>
              <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/60">
                Free · Forever · Yours
              </span>
            </div>
          </div>
        </div>

        <SignupForm />

      </div>
    </div>
  );
}
