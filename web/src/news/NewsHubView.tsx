import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { SocialFeedPost, SocialIntegrationConfig, SocialChannel, Club } from '../api/types';
import { SocialFeedService } from '../common/SocialFeedService';
import { apiClient } from '../api/client';
import { 
  MessageSquare, 
  Send, 
  Settings2, 
  RefreshCw, 
  Trash2, 
  ExternalLink, 
  CheckCircle2, 
  Plus, 
  Radio, 
  ShieldCheck, 
  Sparkles,
  Layers,
  Compass
} from 'lucide-react';

export const NewsHubView: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<SocialFeedPost[]>([]);
  const [configs, setConfigs] = useState<SocialIntegrationConfig[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [activeTab, setActiveTab] = useState<'feed' | 'publish' | 'connect'>('feed');
  const [filterChannel, setFilterChannel] = useState<'ALL' | SocialChannel>('ALL');

  // Manual / Fast Broadcast Form
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [channel, setChannel] = useState<SocialChannel>('DISCORD');
  const [clubName, setClubName] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [authorName, setAuthorName] = useState(
    user ? `${user.firstName} ${user.lastName}` : ''
  );
  const [successMsg, setSuccessMsg] = useState('');
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const canManage = user?.role === 'ADMIN' || user?.role === 'TEACHER';

  useEffect(() => {
    setPosts(SocialFeedService.getPosts());
    setConfigs(SocialFeedService.getConfigs());

    // Încarcă lista de cluburi pentru coordonatori
    apiClient<Club[]>('/api/v1/clubs')
      .then((data) => setClubs(data))
      .catch(() => {});
  }, []);

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    const newPost = SocialFeedService.addPost({
      channel,
      title,
      content,
      authorName: authorName || (user ? `${user.firstName} ${user.lastName}` : 'Oktapod Admin'),
      sourceUrl,
      imageUrl,
      clubName: clubName || 'Anunț General',
    });

    setPosts([newPost, ...posts]);
    setTitle('');
    setContent('');
    setSourceUrl('');
    setImageUrl('');
    setSuccessMsg('Știrea a fost publicată cu succes și este vizibilă pe toate platformele!');
    setTimeout(() => {
      setSuccessMsg('');
      setActiveTab('feed');
    }, 1500);
  };

  const handleDeletePost = (id: string) => {
    SocialFeedService.deletePost(id);
    setPosts(posts.filter((p) => p.id !== id));
  };

  const handleToggleConfig = (id: string, current: boolean) => {
    const updated = SocialFeedService.updateConfig(id, { enabled: !current });
    setConfigs(updated);
  };

  const handleSyncChannel = (id: string) => {
    setSyncingId(id);
    setTimeout(() => {
      const generated = SocialFeedService.triggerSync(id);
      if (generated) {
        setPosts(SocialFeedService.getPosts());
      }
      setConfigs(SocialFeedService.getConfigs());
      setSyncingId(null);
    }, 800);
  };

  const filteredPosts = posts.filter((p) => {
    if (filterChannel === 'ALL') return true;
    return p.channel === filterChannel;
  });

  const getChannelBadge = (ch: SocialChannel) => {
    switch (ch) {
      case 'DISCORD':
        return { label: 'Discord', bg: '#5865f2', color: '#fff', icon: '💬' };
      case 'WHATSAPP':
        return { label: 'WhatsApp', bg: '#25d366', color: '#fff', icon: '📱' };
      case 'INSTAGRAM':
        return { label: 'Instagram', bg: '#e1306c', color: '#fff', icon: '📸' };
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            backgroundColor: 'var(--mobile-school-color-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--mobile-school-color)',
          }}>
            <MessageSquare size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
              Noutăți & Social Media Hub
            </h1>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Știri sincronizate automat din Discord, WhatsApp și Instagram pentru cluburi și liceu
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: '0.35rem', backgroundColor: 'var(--bg-subtle)', padding: '4px', borderRadius: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('feed')}
            className="btn"
            style={{
              padding: '0.4rem 0.85rem',
              fontSize: '0.8rem',
              backgroundColor: activeTab === 'feed' ? 'var(--bg-card)' : 'transparent',
              color: activeTab === 'feed' ? 'var(--primary)' : 'var(--text-muted)',
              boxShadow: activeTab === 'feed' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
              fontWeight: activeTab === 'feed' ? 600 : 500,
            }}
          >
            Flux Noutăți ({posts.length})
          </button>
          {canManage && (
            <button
              onClick={() => setActiveTab('publish')}
              className="btn"
              style={{
                padding: '0.4rem 0.85rem',
                fontSize: '0.8rem',
                backgroundColor: activeTab === 'publish' ? 'var(--bg-card)' : 'transparent',
                color: activeTab === 'publish' ? 'var(--primary)' : 'var(--text-muted)',
                boxShadow: activeTab === 'publish' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                fontWeight: activeTab === 'publish' ? 600 : 500,
              }}
            >
              <Send size={14} /> Transmite Știre
            </button>
          )}
          {canManage && (
            <button
              onClick={() => setActiveTab('connect')}
              className="btn"
              style={{
                padding: '0.4rem 0.85rem',
                fontSize: '0.8rem',
                backgroundColor: activeTab === 'connect' ? 'var(--bg-card)' : 'transparent',
                color: activeTab === 'connect' ? 'var(--primary)' : 'var(--text-muted)',
                boxShadow: activeTab === 'connect' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                fontWeight: activeTab === 'connect' ? 600 : 500,
              }}
            >
              <Settings2 size={14} /> Canale & Webhooks
            </button>
          )}
        </div>
      </div>

      {/* ── TAB 1: FLUX NOUTĂȚI ── */}
      {activeTab === 'feed' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Filtrează:</span>
            {(['ALL', 'DISCORD', 'WHATSAPP', 'INSTAGRAM'] as const).map((ch) => (
              <button
                key={ch}
                onClick={() => setFilterChannel(ch)}
                className="btn"
                style={{
                  padding: '0.3rem 0.75rem',
                  fontSize: '0.78rem',
                  borderRadius: '9999px',
                  backgroundColor: filterChannel === ch ? 'var(--primary)' : 'var(--bg-subtle)',
                  color: filterChannel === ch ? '#ffffff' : 'var(--text-muted)',
                  fontWeight: filterChannel === ch ? 600 : 500,
                }}
              >
                {ch === 'ALL' ? 'Toate platformele' : ch}
              </button>
            ))}
          </div>

          {filteredPosts.length === 0 ? (
            <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Nu există noutăți pentru platforma selectată.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {filteredPosts.map((post) => {
                const badge = getChannelBadge(post.channel);
                return (
                  <article key={post.id} className="card card-interactive animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', padding: '1.25rem', position: 'relative' }}>
                    {/* Header post: Channel badge + Data */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{
                          backgroundColor: badge.bg,
                          color: badge.color,
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}>
                          <span>{badge.icon}</span>
                          <span>{badge.label}</span>
                        </span>
                        {post.clubName && (
                          <span className="badge" style={{ fontSize: '0.7rem' }}>
                            {post.clubName}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {new Date(post.createdAt).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })}
                        </span>
                        {canManage && (
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            title="Șterge știrea"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', opacity: 0.6 }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Imagine opțională */}
                    {post.imageUrl && (
                      <div style={{ width: '100%', height: '160px', borderRadius: '0.5rem', overflow: 'hidden', backgroundColor: 'var(--bg-subtle)' }}>
                        <img src={post.imageUrl} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}

                    {/* Titlu & Conținut */}
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.4rem', color: 'var(--text-main)', lineHeight: 1.3 }}>
                        {post.title}
                      </h3>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                        {post.content}
                      </p>
                    </div>

                    {/* Footer post: Autor & Sursă externă */}
                    <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                        {post.authorName || 'Echipa Oktapod'}
                      </span>
                      {post.sourceUrl && (
                        <a
                          href={post.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: '0.75rem', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}
                        >
                          Deschide în {badge.label} <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: TRANSMITE ȘTIRE (Pentru administratori/responsabili) ── */}
      {activeTab === 'publish' && canManage && (
        <div className="card" style={{ maxWidth: '650px', margin: '0 auto', width: '100%', padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
            <Send size={22} color="var(--primary)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
              Transmite o știre sau un anunț
            </h2>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Publică instant un anunț care va fi marcat ca provenit din Discord, WhatsApp sau Instagram.
          </p>

          {successMsg && (
            <div className="bg-success-subtle" style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={16} /> {successMsg}
            </div>
          )}

          <form onSubmit={handleCreatePost} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            <div>
              <label className="label">Canal / Sursă de transmitere</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                {(['DISCORD', 'WHATSAPP', 'INSTAGRAM'] as const).map((ch) => {
                  const b = getChannelBadge(ch);
                  const isSel = channel === ch;
                  return (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setChannel(ch)}
                      className="btn"
                      style={{
                        padding: '0.65rem 0.5rem',
                        border: isSel ? `2px solid ${b.bg}` : '1px solid var(--border)',
                        backgroundColor: isSel ? 'var(--bg-hover)' : 'var(--bg-card)',
                        color: 'var(--text-main)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem',
                      }}
                    >
                      <span style={{ fontSize: '1.25rem' }}>{b.icon}</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: isSel ? 700 : 500 }}>{b.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="label">Titlul anunțului</label>
              <input
                type="text"
                className="input"
                required
                placeholder="ex: Victorie importantă la turneu / Ședință amânată"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Conținut / Detalii știre</label>
              <textarea
                className="input"
                rows={4}
                required
                placeholder="Introduceți textul complet al mesajului..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="label">Club sau departament emitent</label>
                <input
                  type="text"
                  className="input"
                  placeholder="ex: Clubul de Dezbateri / Consiliu"
                  value={clubName}
                  onChange={(e) => setClubName(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Nume / Handle autor</label>
                <input
                  type="text"
                  className="input"
                  placeholder="ex: @consiliu / Mihai (Admin)"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="label">Link postare originală (opțional)</label>
                <input
                  type="url"
                  className="input"
                  placeholder="https://..."
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                />
              </div>
              <div>
                <label className="label">URL imagine (opțional)</label>
                <input
                  type="url"
                  className="input"
                  placeholder="https://images..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem', marginTop: '0.5rem' }}>
              <Send size={16} /> Publică în Fluxul Oktapod
            </button>
          </form>
        </div>
      )}

      {/* ── TAB 3: CONFIGURARE CANALE & WEBHOOKS AUTOMATE ── */}
      {activeTab === 'connect' && canManage && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.25rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Radio size={20} color="var(--primary)" /> Canale Sincronizate & Webhook-uri
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              Fiecare responsabil de știri poate asocia canalele oficiale. Când se publică o postare sau un mesaj pe aceste platforme, acesta intră automat în aplicație.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {configs.map((cfg) => {
              const b = getChannelBadge(cfg.channel);
              const isSyncing = syncingId === cfg.id;

              return (
                <div key={cfg.id} className="card card-interactive" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>{b.icon}</span>
                      <div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>{cfg.channelName}</h3>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {cfg.accountHandle || 'Neconfigurat'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleConfig(cfg.id, cfg.enabled)}
                      className={`badge ${cfg.enabled ? 'badge-student' : 'badge-admin'}`}
                      style={{ cursor: 'pointer', border: 'none', padding: '4px 10px' }}
                    >
                      {cfg.enabled ? 'Activ • Auto-sync' : 'Dezactivat'}
                    </button>
                  </div>

                  <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div>
                      <strong style={{ color: 'var(--text-main)' }}>Webhook Endpoint:</strong>
                      <div style={{ color: 'var(--text-muted)', fontFamily: 'monospace', wordBreak: 'break-all', marginTop: '2px' }}>
                        {cfg.webhookUrl || 'Implicit'}
                      </div>
                    </div>
                    {cfg.lastSyncAt && (
                      <div style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Ultima sincronizare: {new Date(cfg.lastSyncAt).toLocaleTimeString('ro-RO')}
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleSyncChannel(cfg.id)}
                      disabled={isSyncing}
                      className="btn btn-outline"
                      style={{ flex: 1, fontSize: '0.8rem' }}
                    >
                      <RefreshCw size={14} className={isSyncing ? 'mhome-spinner' : ''} />
                      <span>{isSyncing ? 'Se sincronizează...' : 'Sincronizează acum'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

