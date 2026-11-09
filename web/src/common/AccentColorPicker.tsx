import React from 'react';
import { ACCENT_PRESETS, useTheme, AccentPreset } from './ThemeContext';
import { Palette, Check } from 'lucide-react';

interface AccentColorPickerProps {
  compact?: boolean;
}

export const AccentColorPicker: React.FC<AccentColorPickerProps> = ({ compact = false }) => {
  const { accent, setAccent } = useTheme();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
      {!compact && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          <Palette size={14} />
          <span>Culoare temă (Accent)</span>
        </div>
      )}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        flexWrap: 'wrap',
      }}>
        {ACCENT_PRESETS.map((preset) => {
          const isSelected = accent === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => setAccent(preset.id)}
              title={preset.name}
              style={{
                width: compact ? '24px' : '28px',
                height: compact ? '24px' : '28px',
                borderRadius: '50%',
                backgroundColor: preset.preview,
                border: isSelected ? '2px solid var(--text-main)' : '2px solid transparent',
                outline: isSelected ? `2px solid ${preset.preview}` : 'none',
                outlineOffset: '2px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                transition: 'transform 0.15s ease, outline 0.15s ease',
                transform: isSelected ? 'scale(1.1)' : 'scale(1)',
              }}
            >
              {isSelected && <Check size={compact ? 12 : 14} color="#ffffff" strokeWidth={3} />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

