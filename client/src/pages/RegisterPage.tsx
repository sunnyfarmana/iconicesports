import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Lock, Mail, User, Shield, ArrowRight, AlertCircle, Crosshair } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [ign, setIgn] = useState('');
  const [bgmiUid, setBgmiUid] = useState('');
  const [role, setRole] = useState('PLAYER');
  const [primaryRole, setPrimaryRole] = useState('ASSAULTER');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      await register({
        email,
        username,
        password,
        role,
        ign: ign || username,
        bgmiUid: bgmiUid || '0000000000',
        primaryRole
      });
      toast.success('Official athlete profile created! Welcome to ICONIC ESPORTS.');
      navigate('/');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Registration failed.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 items-center justify-center text-black font-display font-black text-2xl shadow-gold-sm">
            IE
          </div>
          <h1 className="text-3xl font-black font-display text-white uppercase tracking-wider">
            Register Athlete Profile
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            CREATE YOUR OFFICIAL BGMI ESPORTS CREDENTIALS
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1 font-bold">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="player@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-bgmi-surface border border-bgmi-border rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1 font-bold">
                  Username *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="IconicGamer"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-bgmi-surface border border-bgmi-border rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase mb-1 font-bold">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-bgmi-surface border border-bgmi-border rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="p-4 bg-bgmi-surface rounded-xl border border-bgmi-border space-y-3">
              <div className="flex items-center space-x-2 text-xs font-mono text-amber-400 font-bold uppercase">
                <Crosshair className="w-4 h-4" />
                <span>Verified In-Game BGMI Details</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                    In-Game Name (IGN) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GODL JONATHAN"
                    value={ign}
                    onChange={(e) => setIgn(e.target.value)}
                    className="w-full px-3 py-1.5 bg-bgmi-card border border-bgmi-border rounded text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                    BGMI Character UID (10 Digits) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="5123984019"
                    value={bgmiUid}
                    onChange={(e) => setBgmiUid(e.target.value)}
                    className="w-full px-3 py-1.5 bg-bgmi-card border border-bgmi-border rounded text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1 font-bold">
                  Account Purpose
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 bg-bgmi-surface border border-bgmi-border rounded-lg text-sm text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="PLAYER">Competitive Athlete (Player)</option>
                  <option value="TEAM_CAPTAIN">Squad Captain / Clan Leader</option>
                  <option value="ORGANIZER">Tournament Organizer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1 font-bold">
                  Tactical Role
                </label>
                <select
                  value={primaryRole}
                  onChange={(e) => setPrimaryRole(e.target.value)}
                  className="w-full px-3 py-2 bg-bgmi-surface border border-bgmi-border rounded-lg text-sm text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="IGL">IGL (In-Game Leader)</option>
                  <option value="ASSAULTER">Assaulter</option>
                  <option value="ENTRY">Entry Fragger</option>
                  <option value="SUPPORT">Support</option>
                  <option value="SNIPER">Sniper</option>
                </select>
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
              Complete Athlete Registration
            </Button>
          </form>

          <div className="text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-amber-400 font-bold hover:underline">
              Sign In Instead
            </Link>
          </div>
        </Card>

      </div>
    </div>
  );
};
