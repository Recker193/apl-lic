import { SocialFeedPost, SocialIntegrationConfig } from '../api/types';

const POSTS_KEY = 'oktapod_social_feed_posts';
const CONFIGS_KEY = 'oktapod_social_integration_configs';

const DEFAULT_POSTS: SocialFeedPost[] = [
  {
    id: 'post-ig-1',
    channel: 'INSTAGRAM',
    title: 'Turneul de Șah Interliceal 2026',
    content: '🏆 Felicitări tuturor participanților! Clubul de Șah a obținut locul 1 pe municipiu la etapa regională. Urmează faza națională în decembrie!',
    authorName: '@oktapod.sah',
    sourceUrl: 'https://instagram.com/oktapod',
    imageUrl: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=800&q=80',
    clubName: 'Clubul de Șah',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'post-dc-1',
    channel: 'DISCORD',
    title: 'Sesiune deschisă de pregătire Robotică',
    content: '🤖 Ne vedem vineri la ora 16:30 în laboratorul de informatică pentru asamblarea senzorilor și testarea noilor algoritmi de navigație. Canal #anunturi-robotica activ!',
    authorName: 'Alex (Coordonator)',
    sourceUrl: 'https://discord.gg/oktapod',
    clubName: 'Clubul de Robotică',
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    id: 'post-wa-1',
    channel: 'WHATSAPP',
    title: 'Înscrieri deschise: Școala de Debate',
    content: '📢 Pe grupul oficial de WhatsApp al Clubului de Debate au început înscrierile pentru noua serie de meciuri demonstrative Karl Popper. Toți bobocii sunt bineveniți!',
    authorName: 'Grup WhatsApp Consiliu',
    sourceUrl: 'https://chat.whatsapp.com/invite/oktapod',
    clubName: 'Debate & Public Speaking',
    createdAt: new Date(Date.now() - 3600000 * 36).toISOString(),
  },
];

const DEFAULT_CONFIGS: SocialIntegrationConfig[] = [
  {
    id: 'cfg-discord',
    channel: 'DISCORD',
    channelName: 'Discord Server (Canal #noutati)',
    enabled: true,
    webhookUrl: 'https://discord.com/api/webhooks/oktapod/news-stream',
    channelId: '#anunturi-oficiale',
    accountHandle: 'OktapodNewsBot',
    autoSync: true,
    lastSyncAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: 'cfg-whatsapp',
    channel: 'WHATSAPP',
    channelName: 'WhatsApp Comunitate / Grupuri',
    enabled: true,
    webhookUrl: 'https://api.whatsapp.com/v1/messages/webhook',
    channelId: 'Grup Coordonatori Cluburi',
    accountHandle: '+40 7xx xxx xxx',
    autoSync: true,
    lastSyncAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: 'cfg-instagram',
    channel: 'INSTAGRAM',
    channelName: 'Instagram (@oktapod_liceu)',
    enabled: true,
    webhookUrl: 'https://graph.facebook.com/v18.0/instagram_webhooks',
    accountHandle: '@oktapod_liceu',
    autoSync: true,
    lastSyncAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
];

export const SocialFeedService = {
  getPosts(): SocialFeedPost[] {
    const raw = localStorage.getItem(POSTS_KEY);
    if (!raw) {
      localStorage.setItem(POSTS_KEY, JSON.stringify(DEFAULT_POSTS));
      return DEFAULT_POSTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_POSTS;
    }
  },

  addPost(post: Omit<SocialFeedPost, 'id' | 'createdAt'>): SocialFeedPost {
    const posts = this.getPosts();
    const newPost: SocialFeedPost = {
      ...post,
      id: `post-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newPost, ...posts];
    localStorage.setItem(POSTS_KEY, JSON.stringify(updated));
    return newPost;
  },

  deletePost(id: string): void {
    const posts = this.getPosts().filter((p) => p.id !== id);
    localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
  },

  getConfigs(): SocialIntegrationConfig[] {
    const raw = localStorage.getItem(CONFIGS_KEY);
    if (!raw) {
      localStorage.setItem(CONFIGS_KEY, JSON.stringify(DEFAULT_CONFIGS));
      return DEFAULT_CONFIGS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_CONFIGS;
    }
  },

  saveConfigs(configs: SocialIntegrationConfig[]): void {
    localStorage.setItem(CONFIGS_KEY, JSON.stringify(configs));
  },

  updateConfig(id: string, partial: Partial<SocialIntegrationConfig>): SocialIntegrationConfig[] {
    const configs = this.getConfigs().map((c) => (c.id === id ? { ...c, ...partial } : c));
    this.saveConfigs(configs);
    return configs;
  },

  // Simulare sync automat sau test webhook
  triggerSync(channelId: string): SocialFeedPost | null {
    const configs = this.getConfigs();
    const cfg = configs.find((c) => c.id === channelId);
    if (!cfg) return null;

    cfg.lastSyncAt = new Date().toISOString();
    this.saveConfigs(configs);

    // Generează o noutate sincronizată dacă testăm canalul
    const sampleTitles: Record<string, { title: string; content: string; club: string }> = {
      'cfg-discord': {
        title: 'Anunț sincronizat automat din Discord #anunțuri',
        content: '🎉 Programul activităților de weekend a fost actualizat pe serverul de Discord. Verifică orarul și pregătește-te pentru meciurile de dezbateri!',
        club: 'Consiliul Elevilor',
      },
      'cfg-whatsapp': {
        title: 'Mesaj nou din Comunitatea WhatsApp',
        content: '📌 Înscrierile la atelierele practice de științe s-au deschis pe grupul dedicat. Locuri limitate!',
        club: 'Clubul de Științe',
      },
      'cfg-instagram': {
        title: 'Postare nouă pe contul oficial de Instagram',
        content: '📸 Imagini proaspete din cadrul festivității de toamnă și activitățile cluburilor sportive. Urmărește-ne pentru mai multe detalii!',
        club: 'Clubul Media & Foto',
      },
    };

    const sample = sampleTitles[channelId];
    if (sample) {
      return this.addPost({
        channel: cfg.channel,
        title: sample.title,
        content: sample.content,
        authorName: cfg.accountHandle || 'Sync Bot',
        sourceUrl: cfg.channel === 'DISCORD' ? 'https://discord.gg/oktapod' : cfg.channel === 'INSTAGRAM' ? 'https://instagram.com/oktapod' : 'https://chat.whatsapp.com/oktapod',
        clubName: sample.club,
      });
    }

    return null;
  },
};
