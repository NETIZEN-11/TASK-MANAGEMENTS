import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-gradient-to-r from-brand-700/90 via-indigo-600/90 to-purple-600/90 shadow-lg shadow-indigo-500/20 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="group flex items-center gap-2.5">
          <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 via-pink-400 to-fuchsia-500 text-xl shadow-lg shadow-fuchsia-500/40 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110">
            <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]">🚀</span>
            <span className="absolute -inset-1 -z-10 rounded-2xl bg-gradient-to-br from-amber-300 via-pink-400 to-fuchsia-500 opacity-50 blur-md transition-opacity duration-300 group-hover:opacity-80" />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-white">
            Task<span className="bg-gradient-to-r from-amber-200 via-pink-200 to-fuchsia-200 bg-clip-text text-transparent">Flow</span>
          </span>
        </Link>

        <nav className="flex items-center gap-2 text-sm">
          {user ? (
            <>
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `relative rounded-lg px-3 py-1.5 transition-colors duration-200 ${
                    isActive
                      ? 'text-white'
                      : 'text-white/70 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="relative z-10">Dashboard</span>
                    {isActive && (
                      <span className="absolute inset-x-1 -bottom-0.5 h-0.5 rounded-full bg-gradient-to-r from-amber-300 to-fuchsia-300" />
                    )}
                  </>
                )}
              </NavLink>
              <span className="hidden items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs text-white/90 sm:inline-flex">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                Hi, {user.name}
              </span>
              <button
                onClick={handleLogout}
                className="group relative overflow-hidden rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-all duration-200 hover:border-white/40 hover:bg-white/20 active:scale-95"
              >
                <span className="relative z-10">Logout</span>
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-rose-500 to-orange-400 transition-transform duration-300 group-hover:translate-x-0" />
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className="rounded-lg bg-gradient-to-r from-amber-300 via-pink-400 to-fuchsia-500 px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-fuchsia-500/30 transition-transform duration-200 hover:scale-105 active:scale-95"
              >
                Login
              </NavLink>
              <NavLink
                to="/signup"
                className="rounded-lg bg-gradient-to-r from-amber-300 via-pink-400 to-fuchsia-500 px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-fuchsia-500/30 transition-transform duration-200 hover:scale-105 active:scale-95"
              >
                Sign up
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
