import React from 'react';

interface Absence {
  id: string;
  date: string;
  subject?: string;
  status: 'UNEXCUSED' | 'EXCUSED';
  excuseReason?: string;
}

interface AbsencesListProps {
  absences: Absence[];
  onExcuse?: (absenceId: string) => void;
}

export const AbsencesList: React.FC<AbsencesListProps> = ({
  absences,
  onExcuse,
}) => {
  const unexcusedCount = absences.filter((a) => a.status === 'UNEXCUSED').length;
  const excusedCount = absences.filter((a) => a.status === 'EXCUSED').length;

  return (
    <div className="absences-list">
      <div className="absences-summary">
        <span>Total: {absences.length}</span>
        <span>Nemotivate: {unexcusedCount}</span>
        <span>Motivate: {excusedCount}</span>
      </div>

      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Materie</th>
            <th>Stare</th>
            <th>Motiv</th>
            <th>Acțiuni</th>
          </tr>
        </thead>
        <tbody>
          {absences.map((absence) => (
            <tr key={absence.id}>
              <td>{new Date(absence.date).toLocaleDateString('ro-RO')}</td>
              <td>{absence.subject || '-'}</td>
              <td>
                {absence.status === 'UNEXCUSED' ? 'Nemotivată' : 'Motivată'}
              </td>
              <td>{absence.excuseReason || '-'}</td>
              <td>
                {absence.status === 'UNEXCUSED' && onExcuse && (
                  <button onClick={() => onExcuse(absence.id)}>Motivează</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
