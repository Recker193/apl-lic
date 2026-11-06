import React from 'react';

interface Grade {
  id: string;
  subject: string;
  type: string;
  value: number;
  gradedAt: string;
  comment?: string;
}

interface StudentGradesViewProps {
  grades: Grade[];
  studentName: string;
}

export const StudentGradesView: React.FC<StudentGradesViewProps> = ({
  grades,
  studentName,
}) => {
  const average =
    grades.length > 0
      ? (grades.reduce((sum, g) => sum + g.value, 0) / grades.length).toFixed(2)
      : '-';

  return (
    <div className="student-grades-view">
      <h2>Situația școlară - {studentName}</h2>

      <div className="average-display">
        <strong>Medie: {average}</strong>
      </div>

      <table>
        <thead>
          <tr>
            <th>Materie</th>
            <th>Tip</th>
            <th>Notă</th>
            <th>Data</th>
            <th>Comentariu</th>
          </tr>
        </thead>
        <tbody>
          {grades.map((grade) => (
            <tr key={grade.id}>
              <td>{grade.subject}</td>
              <td>{grade.type}</td>
              <td>{grade.value}</td>
              <td>{new Date(grade.gradedAt).toLocaleDateString('ro-RO')}</td>
              <td>{grade.comment || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
