import React, { useState } from 'react';
import { X, Send, UserCheck, MessageSquare } from 'lucide-react';
import { apiClient } from '../api/client';
import { useAuth } from '../auth/AuthContext';

interface SendMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRecipientName?: string;
  defaultRecipientEmail?: string;
  contextTitle?: string;
}

export const SendMessageModal: React.FC<SendMessageModalProps> = ({
  isOpen,
  onClose,
  defaultRecipientName = 'Cadru didactic',
  defaultRecipientEmail,
  contextTitle = 'Mesaj școlar',
}) => {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [recipient, setRecipient] = useState(defaultRecipientName);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const senderFullName = user ? `${user.firstName} ${user.lastName}` : 'Elev';
  const senderClassName = user?.class?.name ? `Clasa a ${user.class.name}` : 'Nespecificată';
  const senderRole = user?.role === 'STUDENT' ? 'Elev' : user?.role === 'TEACHER' ? 'Profesor' : 'Administrator';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSending(true);
    setFeedback(null);

    try {
      // Trimite mesajul incluzând identitatea completă a elevului (non-anonim)
      await apiClient('/api/v1/feedback', {
        method: 'POST',
        body: JSON.stringify({
          rating: 5,
          category: `Mesaj către: ${recipient}`,
          senderName: `${senderFullName} [${senderRole} - ${senderClassName}]`,
          senderEmail: user?.email,
          message: `CĂTRE: ${recipient}${defaultRecipientEmail ? ` (${defaultRecipientEmail})` : ''}\nSUBIECT: ${subject || 'Fără subiect'}\n\nEXPEDITOR CONFIRMAT:\n- Nume: ${senderFullName}\n- Rol: ${senderRole}\n- Clasă: ${senderClassName}\n- Email: ${user?.email || 'Nespecificat'}\n\nCONȚINUT MESAJ:\n${message}`,
        }),
      });

      setFeedback({
        type: 'success',
        text: `Mesajul a fost transmis către ${recipient} cu identitatea ta (${senderFullName}).`,
      });
      setMessage('');
      setSubject('');
      setTimeout(() => {
        onClose();
        setFeedback(null);
      }, 2200);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.message || 'Eroare la trimiterea mesajului. Te rugăm să reîncerci.',
      });
    } finally {
      setSending(false);
    }
  };

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
        zIndex: 1200,
        padding: '1rem',
        backdropFilter: 'blur(3px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '520px',
          padding: '1.75rem',
          backgroundColor: 'var(--bg-card, #ffffff)',
          color: 'var(--text-main, #1e293b)',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          border: '1px solid var(--border-color, #e2e8f0)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(59, 130, 246, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563eb',
              }}
            >
              <MessageSquare size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>{contextTitle}</h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Destinatar: <strong>{recipient}</strong>
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

        {/* Notificare de identitate asumată: mesajul NU este anonim */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.6rem',
            padding: '0.75rem 0.9rem',
            backgroundColor: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            borderRadius: '10px',
            fontSize: '0.82rem',
            marginBottom: '1rem',
          }}
        >
          <UserCheck size={18} color="#2563eb" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Mesaj identificat:</strong> Mesajul va fi expediat cu numele tău{' '}
            <span style={{ color: 'var(--primary, #6366f1)', fontWeight: 600 }}>
              {senderFullName} ({senderClassName})
            </span>
            . Nu este anonim.
          </div>
        </div>

        {feedback && (
          <div
            style={{
              padding: '0.75rem',
              borderRadius: '8px',
              marginBottom: '1rem',
              fontSize: '0.85rem',
              backgroundColor: feedback.type === 'success' ? '#dcfce7' : '#fee2e2',
              color: feedback.type === 'success' ? '#166534' : '#991b1b',
              border: `1px solid ${feedback.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            }}
          >
            {feedback.text}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem' }}>
              Destinatar (Profesor / Cadru)
            </label>
            <input
              type="text"
              className="input-field"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Ex: Prof. Popescu Ion"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem' }}>
              Subiect / Motiv
            </label>
            <input
              type="text"
              className="input-field"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex: Întrebare referitoare la tema la fizică"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem' }}>
              Mesajul tău
            </label>
            <textarea
              className="input-field"
              rows={4}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Scrie mesajul tău detaliat..."
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn btn-outline" disabled={sending}>
              Anulează
            </button>
            <button type="submit" className="btn btn-primary" disabled={sending || !message.trim()}>
              <Send size={15} />
              {sending ? 'Se trimite...' : 'Trimite mesajul'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

