import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Lock, Mail, ArrowRight, AlertCircle, Shield } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      await login(identifier, password);
      toast.success('Authentication confirmed! Welcome to ICONIC ESPORTS.');
      navigate('/');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Invalid email/username or password.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const fillQuickAccount = (ident: string, pass: string) => {
    setIdentifier(ident);
    setPassword(pass);
    toast.info(`Filled credentials for ${ident}`);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        
        {/* Logo & Headline */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 items-center justify-center text-black font-display font-black text-2xl shadow-gold-sm">
            IE
          </div>
          <h1 className="text-3xl font-black font-display text-white uppercase tracking-wider">
            Sign In to Arena
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            ACCESS MATCH ROOMS, SQUAD ROSTERS & LEADERBOARDS
          </p>
        </div>

        {/* Card Form */}
        <Card className="p-6 sm:p-8 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-950/40 border border-red-500/40 rounded text-xs text-red-400 flex items-center space-x-2 font-mono">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase mb-1 font-bold">
                Email or Username
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="admin@iconicesports.in"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-bgmi-surface border border-bgmi-border rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase mb-1 font-bold">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-bgmi-surface border border-bgmi-border rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              loading={loading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to Account
            </Button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="pt-4 border-t border-bgmi-border/60 space-y-2">
            <p className="text-[11px] font-mono text-slate-400 uppercase text-center font-bold">
              Quick Test Accounts (Click to Fill):
            </p>
            <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
              <button
                type="button"
                onClick={() => fillQuickAccount('admin@iconicesports.in', 'admin123')}
                className="p-1.5 bg-bgmi-surface hover:bg-amber-500/20 border border-bgmi-border rounded text-amber-400 font-bold transition-colors cursor-pointer"
              >
                Admin User
              </button>
              <button
                type="button"
                onClick={() => fillQuickAccount('organizer@iconicesports.in', 'password123')}
                className="p-1.5 bg-bgmi-surface hover:bg-amber-500/20 border border-bgmi-border rounded text-amber-400 font-bold transition-colors cursor-pointer"
              >
                Organizer
              </button>
              <button
                type="button"
                onClick={() => fillQuickAccount('manya@soul.esports', 'password123')}
                className="p-1.5 bg-bgmi-surface hover:bg-amber-500/20 border border-bgmi-border rounded text-amber-400 font-bold transition-colors cursor-pointer"
              >
                Team Captain
              </button>
            </div>
          </div>

          <div className="text-center text-xs text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-amber-400 font-bold hover:underline">
              Register Roster Now
            </Link>
          </div>
        </Card>

      </div>
    </div>
  );
};
