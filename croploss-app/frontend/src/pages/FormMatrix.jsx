import React from 'react';
import { CROPS, DISCIPLINES, getColsByDiscipline } from '../utils/constants';

export default function FormMatrix() {
  return (
    <div style={{ padding: '24px' }}>
      <h2 style={{ marginBottom: '20px', fontSize: '22px', fontWeight: 700 }}>
        Form Matrix – Crop &amp; Discipline Column Check
      </h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
        <thead>
          <tr style={{ background: '#1b5e20', color: '#fff' }}>
            <th style={{ padding: '10px 16px', textAlign: 'left', border: '1px solid #ccc' }}>Crop</th>
            <th style={{ padding: '10px 16px', textAlign: 'left', border: '1px solid #ccc' }}>Discipline</th>
            <th style={{ padding: '10px 16px', textAlign: 'center', border: '1px solid #ccc' }}>Disease Columns</th>
            <th style={{ padding: '10px 16px', textAlign: 'center', border: '1px solid #ccc' }}>Insect Columns</th>
            <th style={{ padding: '10px 16px', textAlign: 'left', border: '1px solid #ccc' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {CROPS.map((crop, ci) =>
            DISCIPLINES.map((discipline, di) => {
              const cols = getColsByDiscipline(crop, discipline);
              const ok =
                (discipline === 'Pathology'   && cols.disease.length > 0 && cols.insect.length === 0) ||
                (discipline === 'Entomology'  && cols.insect.length  > 0 && cols.disease.length === 0) ||
                (discipline === 'Both'        && cols.disease.length > 0 && cols.insect.length  > 0);
              const bg = (ci * DISCIPLINES.length + di) % 2 === 0 ? '#fff' : '#f9fafb';
              return (
                <tr key={`${crop}-${discipline}`} style={{ background: bg }}>
                  <td style={{ padding: '8px 16px', border: '1px solid #e0e0e0', textTransform: 'capitalize', fontWeight: 600 }}>{crop}</td>
                  <td style={{ padding: '8px 16px', border: '1px solid #e0e0e0' }}>{discipline}</td>
                  <td style={{ padding: '8px 16px', border: '1px solid #e0e0e0', textAlign: 'center' }}>{cols.disease.length}</td>
                  <td style={{ padding: '8px 16px', border: '1px solid #e0e0e0', textAlign: 'center' }}>{cols.insect.length}</td>
                  <td style={{ padding: '8px 16px', border: '1px solid #e0e0e0' }}>
                    {ok
                      ? <span style={{ color: '#16a34a', fontWeight: 600 }}>✅ OK</span>
                      : <span style={{ color: '#dc2626', fontWeight: 600 }}>❌ Missing columns</span>
                    }
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
