import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Shield, Crosshair, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-bgmi-surface border-t border-bgmi-border mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Column */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 flex items-center justify-center bg-amber-500 rounded-lg text-black font-display font-black text-xl">
                IE
              </div>
              <span className="font-display text-xl font-bold text-white tracking-wider">
                ICONIC <span className="text-amber-500">ESPORTS</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              India's premier competitive Battlegrounds Mobile India tournament ecosystem. Built for professional athletes, emerging clans, and esports organizers.
            </p>
            <div className="flex items-center space-x-2 text-xs font-mono text-amber-400/80 bg-amber-500/10 px-3 py-1.5 rounded border border-amber-500/20 inline-block">
              <span>OFFICIAL 10-PT SYSTEM VERIFIED</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-200 mb-4 font-display">
              Tournaments
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link to="/tournaments" className="hover:text-amber-400 transition-colors">
                  All Tournaments
                </Link>
              </li>
              <li>
                <Link to="/tournaments?status=ONGOING" className="hover:text-amber-400 transition-colors">
                  Live Tournaments
                </Link>
              </li>
              <li>
                <Link to="/tournaments?status=REGISTRATION_OPEN" className="hover:text-amber-400 transition-colors">
                  Open Registrations
                </Link>
              </li>
              <li>
                <Link to="/standings" className="hover:text-amber-400 transition-colors">
                  Official Point Tables
                </Link>
              </li>
            </ul>
          </div>

          {/* Ecosystem Links */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-200 mb-4 font-display">
              Community & Teams
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link to="/teams" className="hover:text-amber-400 transition-colors">
                  Verified BGMI Teams
                </Link>
              </li>
              <li>
                <Link to="/players" className="hover:text-amber-400 transition-colors">
                  Player Leaderboards & MVPs
                </Link>
              </li>
              <li>
                <Link to="/announcements" className="hover:text-amber-400 transition-colors">
                  Rulebooks & Notices
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-amber-400 transition-colors">
                  Register Your Clan Roster
                </Link>
              </li>
            </ul>
          </div>

          {/* Regulations & Anti-Cheat */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-200 mb-4 font-display">
              Platform Integrity
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Strict anti-ringer, verified BGMI Character UID matching, emulator bans, and scheduled room distribution ensure uncompromising competitive fair play.
            </p>
            <div className="p-3 bg-bgmi-dark rounded-md border border-bgmi-border text-xs text-slate-300">
              <span className="text-amber-400 font-bold block mb-1">Standard BGMI 10-Pt WWCD:</span>
              1st: 10 pts • 2nd: 6 pts • 3rd: 5 pts • 4th: 4 pts • 1 pt per finish.
            </div>
          </div>
        </div>

        <div className="border-t border-bgmi-border/60 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500">
          <p>© 2026 ICONIC ESPORTS. Dedicated exclusively to Battlegrounds Mobile India.</p>
          <p className="mt-2 md:mt-0 font-mono">BATTLEGROUNDS MOBILE INDIA is a registered trademark of KRAFTON, Inc.</p>
        </div>
      </div>
    </footer>
  );
};
