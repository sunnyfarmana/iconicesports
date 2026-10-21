import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Announcement } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Bell, Pin, ShieldAlert, FileText } from 'lucide-react';

export const AnnouncementsPage: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoading(true);
      try {
        const params: any = {};
        if (selectedCategory !== 'ALL') params.category = selectedCategory;

        const res = await api.get('/announcements', { params });
        setAnnouncements(res.data.announcements);
      } catch (err) {
        console.error('Failed to load announcements:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, [selectedCategory]);

  const categories = ['ALL', 'RULE_CHANGE', 'NOTICE', 'TOURNAMENT', 'SCRIM', 'GENERAL'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
          <Bell className="w-4 h-4" />
          <span>Official Communications</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black font-display text-white uppercase tracking-wider mt-1">
          Bulletins & Rulebook Notices
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl mt-1 leading-relaxed">
          Official platform updates, rule amendments, slot list confirmations, room credential security alerts, and tournament schedules.
        </p>
      </div>

      {/* Category Filter */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'primary' : 'secondary'}
              size="xs"
              onClick={() => setSelectedCategory(cat)}
            >
              {cat.replace('_', ' ')}
            </Button>
          ))}
        </div>
      </Card>

      {/* Announcements List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-bgmi-card rounded-xl animate-pulse border border-bgmi-border" />
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <Card className="p-12 text-center text-slate-400 font-mono text-sm">
          No notices available for this category.
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((item) => (
            <Card
              key={item.id}
              className={`p-6 transition-all ${
                item.isPinned
                  ? 'border-amber-500/50 bg-gradient-to-r from-bgmi-card to-amber-950/10 shadow-gold-sm'
                  : ''
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center space-x-2.5">
                  {item.isPinned && (
                    <Badge variant="gold" size="sm">
                      <Pin className="w-3 h-3 inline mr-1" />
                      PINNED
                    </Badge>
                  )}
                  <Badge variant="slate" size="sm">
                    {item.category.replace('_', ' ')}
                  </Badge>
                </div>

                <div className="text-xs text-slate-400 font-mono flex items-center space-x-2">
                  <span>Posted by: <strong className="text-slate-200">{item.author.username}</strong> ({item.author.role})</span>
                  <span>•</span>
                  <span>{new Date(item.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>

              <h3 className="font-display font-bold text-lg text-white mb-2 leading-snug">
                {item.title}
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line font-sans">
                {item.content}
              </p>
            </Card>
          ))}
        </div>
      )}

    </div>
  );
};
