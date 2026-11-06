import React from 'react';

interface Grade {
  id: string;
  studentId: string;
  studentName: string;
  type: string;
  value: number;
  gradedAt: string;
  comment?: string;
}

interface CatalogTableProps {
  grades: Grade[];
  onAddGrade?: (studentId: string) => void;
  onEditGrade?: (gradeId: string) => void;
}

export const CatalogTable: React.FC<CatalogTableProps> = ({
  grades,
  onAddGrade,
  onEditGrade,
}) => {
  return (
    <div className="catalog-table">
      <table>
        <thead>
          <tr>
            <th>Elev</th>
            <th>Tip</th>
            <th>Notă</th>
            <th>Data</th>
            <th>Comentariu</th>
            <th>Acțiuni</th>
          </tr>
        </thead>
        <tbody>
          {grades.map((grade) => (
            <tr key={grade.id}>
              <td>{grade.studentName}</td>
              <td>{grade.type}</td>
              <td>{grade.value}</td>
              <td>{new Date(grade.gradedAt).toLocaleDateString('ro-RO')}</td>
              <td>{grade.comment || '-'}</td>
              <td>
                {onEditGrade && (
                  <button onClick={() => onEditGrade(grade.id)}>Modifică</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
