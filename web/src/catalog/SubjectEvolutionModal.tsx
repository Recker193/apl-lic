import React, { useState } from 'react';
import { GradeEntry } from '../api/types';
import { TrendingUp, Calculator, X, Award, CheckCircle } from 'lucide-react';

interface SubjectEvolutionModalProps {
  subjectName: string;
  teacherName: string;
  grades: GradeEntry[];
  onClose: () => void;
}

export const SubjectEvolutionModal: React.FC<SubjectEvolutionModalProps> = ({
  subjectName,
  teacherName,
  grades,
  onClose,
}) => {
  // Sortare cronologică a notelor
  const sortedGrades = [...grades].sort(
    (a, b) => new Date(a.gradedAt).getTime() - new Date(b.gradedAt).getTime()
  );

  const values = sortedGrades.map((g) => g.value);
  const currentSum = values.reduce((acc, curr) => acc + curr, 0);
  const currentCount = values.length;
  const currentAvg = currentCount > 0 ? (currentSum / currentCount) : null;
  const currentRounded = currentAvg !== null ? Math.round(currentAvg) : null;

  // Calculator de medii dorite
  const [targetAverage, setTargetAverage] = useState<number>(() => {
    if (currentRounded !== null) return Math.min(10, currentRounded + 1);
    return 10;
  });

  // Calculează necesarul de note pentru fiecare valoare posibilă (10, 9, 8, etc.)
  // Pentru ca media rotunjită să fie T, media ne-rotunjită trebuie să fie >= (T - 0.5)
  const calculateNeededGrades = (desiredGrade: number, targetAvg: number) => {
    if (desiredGrade < targetAvg) {
      return { count: 0, impossible: true };
    }
    const minAverageNeeded = targetAvg - 0.5;

    if (currentCount === 0) {
      return { count: desiredGrade >= minAverageNeeded ? 1 : 0, impossible: desiredGrade < minAverageNeeded };
    }

    if (currentAvg !== null && currentAvg >= minAverageNeeded) {
      return { count: 0, impossible: false, alreadyReached: true };
    }

    if (desiredGrade <= minAverageNeeded) {
      return { count: 0, impossible: true };
    }

    // (currentSum + n * desiredGrade) / (currentCount + n) >= minAverageNeeded
    // currentSum + n * desiredGrade >= minAverageNeeded * currentCount + n * minAverageNeeded
    // n * (desiredGrade - minAverageNeeded) >= minAverageNeeded * currentCount - currentSum
    const numerator = minAverageNeeded * currentCount - currentSum;
    const denominator = desiredGrade - minAverageNeeded;

    if (numerator <= 0) {
      return { count: 0, impossible: false, alreadyReached: true };
    }

    const n = Math.ceil(numerator / denominator);
    return { count: Math.max(1, n), impossible: false };
  };

  // Coordonate SVG pentru graficul de evoluție
  const width = 500;
  const height = 180;
  const paddingX = 45;
  const paddingY = 30;

  const points = values.map((val, idx) => {
    const x = values.length === 1 
      ? width / 2 
      : paddingX + (idx / (values.length - 1)) * (width - 2 * paddingX);
    // Nota 10 e sus (paddingY), nota 1 e jos (height - paddingY)
    const y = (height - paddingY) - ((val - 1) / 9) * (height - 2 * paddingY);
    return { x, y, val, date: new Date(sortedGrades[idx].gradedAt).toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit' }) };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '640px', padding: '1.75rem', width: '92%' }}
      >
        {/* Header Modal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={22} color="var(--primary)" />
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                {subjectName}
              </h2>
            </div>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Cadru didactic: <strong>{teacherName}</strong>
            </p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="btn btn-outline" 
            style={{ padding: '0.35rem', borderRadius: '50%', border: 'none' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Indicatori sumari */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Număr note</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)' }}>{currentCount}</div>
          </div>
          <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Media exactă</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)' }}>
              {currentAvg !== null ? currentAvg.toFixed(2) : '-'}
            </div>
          </div>
          <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Media rotunjită</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#10b981' }}>
              {currentRounded !== null ? currentRounded : '-'}
            </div>
          </div>
        </div>

        {/* Grafic de evoluție a notelor (SVG) */}
        <div style={{ marginBottom: '1.75rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <TrendingUp size={16} color="var(--primary)" /> Evoluție Cronologică a Notelor
            </span>
          </div>

          {values.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Nu există note înregistrate pentru a genera graficul de evoluție.
            </div>
          ) : (
            <div style={{ width: '100%', overflowX: 'auto' }}>
              <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', minWidth: '380px' }}>
                {/* Linii orizontale de ghidaj (notele 4, 7, 10) */}
                {[10, 8, 5].map((grade) => {
                  const y = (height - paddingY) - ((grade - 1) / 9) * (height - 2 * paddingY);
                  return (
                    <g key={grade}>
                      <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="var(--border)" strokeDasharray="3 3" />
                      <text x={paddingX - 10} y={y + 4} fontSize="10" fill="var(--text-muted)" textAnchor="end">
                        {grade}
                      </text>
                    </g>
                  );
                })}

                {/* Linia graficului */}
                {values.length > 1 && (
                  <polyline
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={polylinePoints}
                  />
                )}

                {/* Punctele de pe grafic */}
                {points.map((p, i) => (
                  <g key={i}>
                    <circle cx={p.x} cy={p.y} r="6" fill="var(--bg-main)" stroke="var(--primary)" strokeWidth="3" />
                    {/* Valoare notă */}
                    <text x={p.x} y={p.y - 10} fontSize="11" fontWeight="800" fill="var(--text-main)" textAnchor="middle">
                      {p.val}
                    </text>
                    {/* Dată */}
                    <text x={p.x} y={height - 8} fontSize="9" fill="var(--text-muted)" textAnchor="middle">
                      {p.date}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          )}
        </div>

        {/* Calculator de Medii Dorite */}
        <div style={{ backgroundColor: 'var(--bg-subtle)', borderRadius: '0.75rem', padding: '1rem', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Calculator size={18} color="var(--primary)" /> Calculator de Medii Dorite
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Media dorită (rotunjită):</label>
              <select
                className="input-field"
                style={{ width: '70px', padding: '0.2rem 0.5rem', fontWeight: 800 }}
                value={targetAverage}
                onChange={(e) => setTargetAverage(Number(e.target.value))}
              >
                {[10, 9, 8, 7, 6, 5].map((avg) => (
                  <option key={avg} value={avg}>{avg}</option>
                ))}
              </select>
            </div>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 0.85rem' }}>
            Pentru a obține media rotunjită de <strong>{targetAverage}</strong> (minim {(targetAverage - 0.5).toFixed(1)} ne-rotunjit), ai nevoie de:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem' }}>
            {[10, 9, 8].map((g) => {
              const res = calculateNeededGrades(g, targetAverage);
              return (
                <div
                  key={g}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    padding: '0.65rem 0.8rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border)',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    Note de {g}
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: res.impossible ? '#ef4444' : 'var(--primary)', marginTop: '0.2rem' }}>
                    {res.alreadyReached ? (
                      <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem' }}>
                        <CheckCircle size={14} /> Atinsă!
                      </span>
                    ) : res.impossible ? (
                      <span style={{ fontSize: '0.75rem' }}>Imposibil</span>
                    ) : (
                      `${res.count} ${res.count === 1 ? 'notă' : 'note'}`
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Buton Închide */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
          <button type="button" onClick={onClose} className="btn btn-primary" style={{ minWidth: '100px' }}>
            Închide
          </button>
        </div>
      </div>
    </div>
  );
};

