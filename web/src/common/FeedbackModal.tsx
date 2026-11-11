import React, { useState } from 'react';
import { X, Send, Star, MessageSquareHeart } from 'lucide-react';
import { apiClient } from '../api/client';
import { useAuth } from '../auth/AuthContext';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [category, setCategory] = useState<string>('Sugestie îmbunătățire');
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [feedbackState, setFeedbackState] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const categories = [
    'Sugestie îmbunătățire',
    'Raportare problemă (Bug)',
    'Design & Experiență utilizator',
    'Catalog & Note',
    'Altceva',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    setFeedbackState(null);

    try {
      await apiClient('/api/v1/feedback', {
        method: 'POST',
        body: JSON.stringify({
          rating,
          category,
          message,
          senderName: user ? `${user.firstName} ${user.lastName}` : undefined,
          senderEmail: user?.email,
        }),
      });

      setFeedbackState({
        type: 'success',
        text: 'Îți mulțumim pentru feedback! Mesajul tău a fost expediat către oktapod.support@gmail.com.',
      });
      setMessage('');
      setTimeout(() => {
        onClose();
        setFeedbackState(null);
      }, 2500);
    } catch (err: any) {
      setFeedbackState({
        type: 'error',
        text: err.message || 'Eroare la transmiterea feedback-ului. Te rugăm să reîncerci.',
      });
    } finally {
      setLoading(false);
    }
  };

  const activeRating = hoverRating !== null ? hoverRating : rating;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1300,
        padding: '1rem',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '480px',
          padding: '1.75rem',
          backgroundColor: 'var(--bg-card, #ffffff)',
          color: 'var(--text-main, #1e293b)',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
          border: '1px solid var(--border-color, #e2e8f0)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'rgba(234, 179, 8, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ca8a04',
              }}
            >
              <MessageSquareHeart size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Trimite Feedback</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Ajută-ne să facem Oktapod mai bun
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '4px',
              borderRadius: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {feedbackState && (
          <div
            style={{
              padding: '0.75rem',
              borderRadius: '8px',
              marginBottom: '1rem',
              fontSize: '0.85rem',
              backgroundColor: feedbackState.type === 'success' ? '#dcfce7' : '#fee2e2',
              color: feedbackState.type === 'success' ? '#166534' : '#991b1b',
              border: `1px solid ${feedbackState.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            }}
          >
            {feedbackState.text}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Rating cu steluțe */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Cum evaluezi experiența ta cu aplicația?
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '2px',
                    transition: 'transform 0.15s ease',
                  }}
                  title={`${star} din 5 stele`}
                >
                  <Star
                    size={26}
                    fill={star <= activeRating ? '#eab308' : 'none'}
                    color={star <= activeRating ? '#eab308' : '#94a3b8'}
                  />
                </button>
              ))}
              <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#ca8a04' }}>
                {activeRating} / 5 stele
              </span>
            </div>
          </div>

          {/* Categorie */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Tip feedback / Categorie
            </label>
            <select
              className="input-field"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Sugestie / Mesaj */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Sugestia sau comentariul tău
            </label>
            <textarea
              className="input-field"
              rows={4}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ce ți-a plăcut? Ce am putea îmbunătăți sau ce nu funcționează optim?"
              style={{ resize: 'vertical' }}
            />
            <p style={{ margin: '0.35rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Feedback-ul va fi trimis echipei noastre la <strong>oktapod.support@gmail.com</strong>.
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn btn-outline" disabled={loading}>
              Închide
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading || !message.trim()}>
              <Send size={15} />
              {loading ? 'Se transmite...' : 'Trimite feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

