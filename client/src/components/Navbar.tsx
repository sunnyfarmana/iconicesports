import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from './ui/Button';
import {
  Trophy,
  Users,
  Shield,
  Radio,
  FileText,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  Crosshair,
  Settings,
  Sun,
  Moon,
  Award
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navLinks = [
    { label: 'Home', path: '/', icon: Crosshair },
    { label: 'Tournaments', path: '/tournaments', icon: Trophy },
    { label: 'Teams', path: '/teams', icon: Shield },
    { label: 'Leaderboard', path: '/players', icon: Users },
    { label: 'Standings', path: '/standings', icon: Trophy },
    { label: 'Notices', path: '/announcements', icon: FileText }
  ];

  const handleLogout = async () => {
    await logout();
    setUserDropdownOpen(false);
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-bgmi-dark/95 backdrop-blur-md border-b border-bgmi-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-black font-display font-black text-xl shadow-gold-sm group-hover:scale-105 transition-transform">
              IE
            </div>
            <div className="flex flex-col">
              <span className="font-display font-black text-xl tracking-wider text-white uppercase leading-none">
                ICONIC <span className="text-amber-500">ESPORTS</span>
              </span>
              <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase mt-0.5">
                BGMI ARENA INDIA
              </span>
            </div>
          </Link>

          {/* Desktop Nav Items */}
          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs uppercase font-display font-bold tracking-wider transition-all duration-150 ${
                    active
                      ? 'text-amber-400 bg-amber-500/10 border-b-2 border-amber-500'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${active ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right Action Controls */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Live Indicator */}
            <Link
              to="/tournaments/bmps-2026-grand-finals"
              className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-red-950/40 border border-red-500/30 hover:border-red-500 text-xs font-semibold text-red-400 transition-colors"
            >
              <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
              <span>BMPS 2026 FINALS</span>
            </Link>

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle display theme"
              className="p-2 rounded-lg bg-bgmi-surface border border-bgmi-border text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-3 px-3 py-1.5 rounded-lg bg-bgmi-card border border-bgmi-border hover:border-amber-500/50 transition-all text-left"
                >
                  <div className="w-8 h-8 rounded-md bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-sm">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.username || 'User'} className="w-full h-full rounded-md object-cover" />
                    ) : (
                      (user.username || user.email || 'IE').slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                      <span>{user.playerProfile?.ign || user.username}</span>
                      <span className="text-[10px] px-1 bg-amber-500/20 text-amber-400 rounded">
                        {user.role}
                      </span>
                    </div>
                    {user.playerProfile?.bgmiUid && (
                      <div className="text-[10px] text-slate-400 font-mono">
                        UID: {user.playerProfile.bgmiUid}
                      </div>
                    )}
                  </div>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-lg bg-bgmi-surface border border-bgmi-border shadow-tactical py-1.5 z-50">
                    <div className="px-4 py-2 border-b border-bgmi-border/60">
                      <p className="text-xs text-slate-400">Signed in as</p>
                      <p className="text-sm font-semibold text-white truncate">{user.email}</p>
                    </div>

                    {user.role === 'ADMIN' && (
                      <Link
                        to="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center space-x-2.5 px-4 py-2.5 text-sm text-amber-400 hover:bg-amber-500/10 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Admin Dashboard</span>
                      </Link>
                    )}

                    {(user.role === 'ORGANIZER' || user.role === 'ADMIN' || user.organizerStatus === 'APPROVED') && (
                      <Link
                        to="/organizer"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center space-x-2.5 px-4 py-2.5 text-sm text-amber-400 hover:bg-amber-500/10 transition-colors"
                      >
                        <Award className="w-4 h-4" />
                        <span>Organizer Panel</span>
                      </Link>
                    )}

                    <Link
                      to="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center space-x-2.5 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-800 transition-colors"
                    >
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      <span>Player Profile</span>
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-950/20 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button
                  to="/login"
                  variant="ghost"
                  size="sm"
                >
                  Sign In
                </Button>
                <Button
                  to="/register"
                  variant="primary"
                  size="sm"
                >
                  Join Arena
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-lg bg-bgmi-surface border border-bgmi-border text-slate-400"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-bgmi-card border border-bgmi-border text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-bgmi-border bg-bgmi-surface/95 backdrop-blur-xl px-4 pt-3 pb-6 space-y-3">
          <div className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider font-display ${
                    active ? 'bg-amber-500/10 text-amber-400' : 'text-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-bgmi-border/60">
            {user ? (
              <div className="space-y-2">
                <div className="px-3 py-2 bg-bgmi-card rounded-lg border border-bgmi-border text-xs">
                  <p className="font-bold text-white">{user.playerProfile?.ign || user.username || 'User'}</p>
                  <p className="text-slate-400 font-mono text-[11px]">{user.email}</p>
                </div>
                {user.role === 'ADMIN' && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-sm font-bold text-amber-400 hover:bg-amber-500/10 rounded"
                  >
                    Admin Dashboard
                  </Link>
                )}
                {(user.role === 'ORGANIZER' || user.role === 'ADMIN' || user.organizerStatus === 'APPROVED') && (
                  <Link
                    to="/organizer"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-sm font-bold text-amber-400 hover:bg-amber-500/10 rounded"
                  >
                    Organizer Panel
                  </Link>
                )}
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded"
                >
                  Profile Settings
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-950/20 rounded"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button
                  to="/login"
                  variant="secondary"
                  size="sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Button>
                <Button
                  to="/register"
                  variant="primary"
                  size="sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Register
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
