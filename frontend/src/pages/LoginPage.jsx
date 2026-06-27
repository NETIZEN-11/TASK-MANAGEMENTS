import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginForm from '../components/auth/LoginForm';

export default function LoginPage() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/" replace />;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-fuchsia-700 via-indigo-600 to-cyan-500 px-4 animate-gradient">

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-72 w-72 animate-blob rounded-full bg-fuchsia-500 opacity-30 mix-blend-screen blur-3xl" />
        <div className="absolute -right-16 top-1/4 h-80 w-80 animate-blob-delayed rounded-full bg-cyan-400 opacity-30 mix-blend-screen blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 animate-blob rounded-full bg-amber-400 opacity-25 mix-blend-screen blur-3xl" />
        <div className="absolute top-1/2 right-1/4 h-56 w-56 animate-blob-delayed rounded-full bg-rose-400 opacity-25 mix-blend-screen blur-2xl" />
      </div>

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 h-2 w-2 animate-sparkle rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" style={{animationDelay: '0s'}} />
        <div className="absolute top-1/3 right-1/3 h-1.5 w-1.5 animate-sparkle rounded-full bg-amber-200 shadow-[0_0_10px_rgba(252,211,77,0.8)]" style={{animationDelay: '1s'}} />
        <div className="absolute bottom-1/4 left-1/2 h-1.5 w-1.5 animate-sparkle rounded-full bg-cyan-200 shadow-[0_0_10px_rgba(165,243,252,0.8)]" style={{animationDelay: '0.5s'}} />
        <div className="absolute top-2/3 left-2/3 h-2 w-2 animate-sparkle rounded-full bg-pink-200 shadow-[0_0_10px_rgba(249,168,212,0.8)]" style={{animationDelay: '1.5s'}} />
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
            <div className="h-3 w-3 rounded-full bg-amber-400 pulse-glow" />
            <div className="h-2 w-16 rounded-full bg-white/30" />
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2">
        <div className="h-full w-full animate-rotate-slow rounded-full border-2 border-white/10 border-t-amber-300/50 border-r-fuchsia-300/40" />
      </div>
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[640px] w-[640px] -translate-x-1/2 -translate-y-1/2">
        <div className="h-full w-full animate-rotate-slow rounded-full border-2 border-white/10 border-b-cyan-300/50 border-l-pink-300/40 opacity-60" style={{animationDirection: 'reverse'}} />
      </div>

      <div className="animate-slide-up relative z-10 w-full max-w-md">
        <div className="mb-6 flex justify-center animate-bounce-in">
          <div className="group relative flex items-center gap-3 rounded-2xl border border-white/30 bg-white/15 px-6 py-3 shadow-2xl backdrop-blur-md hover-up glass-reflection">
            <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 via-pink-400 to-fuchsia-500 text-2xl shadow-lg shadow-fuchsia-500/40 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
              <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]">🚀</span>
              <span className="absolute -inset-1 -z-10 rounded-2xl bg-gradient-to-br from-amber-300 via-pink-400 to-fuchsia-500 opacity-50 blur-md" />
            </span>
            <div className="flex flex-col leading-tight">
              <span className="text-xl font-extrabold tracking-tight text-white">
                Task<span className="bg-gradient-to-r from-amber-200 via-pink-200 to-fuchsia-200 bg-clip-text text-transparent">Flow</span>
              </span>
              <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/60">
                Organize · Focus · Ship
              </span>
            </div>
          </div>
        </div>

        <LoginForm />

      </div>
    </div>
  );
}
