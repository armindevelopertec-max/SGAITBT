'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { apiGet, apiPost, extractError } from '@/lib/api';
import { TeacherAssignment, SubjectAssignment, SubjectEnrollment, Student, AttendanceStatus, GradeRecord } from '@/lib/types';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingState, ErrorState } from '@/components/ui/state';

type Tab = 'matters' | 'attendance' | 'grades';

export default function TeacherPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('matters');
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<TeacherAssignment | null>(null);
  const [students, setStudents] = useState<(SubjectEnrollment & { student?: Student })[]>([]);
  const [saving, setSaving] = useState(false);

  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceStatus>>({});

  const [gradePartial, setGradePartial] = useState<'FIRST' | 'SECOND' | 'FINAL'>('FIRST');
  const [gradeRecords, setGradeRecords] = useState<Record<string, number | undefined>>({});

  useEffect(() => {
    loadAssignments();
  }, []);

  async function loadAssignments() {
    setLoading(true);
    try {
      const data = await apiGet<TeacherAssignment[]>('/subject-assignments/teacher/me');
      setAssignments(data);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }

  async function loadStudents(assignmentId: string) {
    try {
      const data = await apiGet<(SubjectEnrollment & { student?: Student })[]>(`/subject-assignments/${assignmentId}/students`);
      setStudents(data);

      const attRecords: Record<string, AttendanceStatus> = {};
      const grdRecords: Record<string, number | undefined> = {};
      data.forEach((enrollment) => {
        attRecords[enrollment.studentId] = 'PRESENT';
        grdRecords[enrollment.studentId] = undefined;
      });
      setAttendanceRecords(attRecords);
      setGradeRecords(grdRecords);
    } catch (err) {
      setError(extractError(err));
    }
  }

  function selectAssignment(assignment: TeacherAssignment) {
    setSelectedAssignment(assignment);
    loadStudents(assignment.id);
  }

  async function saveAttendance() {
    if (!selectedAssignment) return;
    setSaving(true);
    try {
      const records = Object.entries(attendanceRecords).map(([studentId, status]) => ({
        studentId,
        status,
      }));
      await apiPost('/attendance', {
        assignmentId: selectedAssignment.id,
        attendanceDate,
        records,
      });
      alert('Asistencia guardada correctamente');
    } catch (err) {
      setError(extractError(err));
    } finally {
      setSaving(false);
    }
  }

  async function saveGrades() {
    if (!selectedAssignment) return;
    setSaving(true);
    try {
      const records: GradeRecord[] = Object.entries(gradeRecords).map(([studentId, value]) => ({
        studentId,
        [gradePartial === 'FIRST' ? 'firstPartial' : gradePartial === 'SECOND' ? 'secondPartial' : 'finalExam']: value,
      }));
      await apiPost('/grades/bulk', {
        assignmentId: selectedAssignment.id,
        records,
      });
      alert('Calificaciones guardadas correctamente');
    } catch (err) {
      setError(extractError(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState />;

  return (
    <div>
      <PageHeader
        title="Panel del Docente"
        subtitle={`Bienvenido, ${user?.fullName || 'Docente'}`}
      />

      {error && <ErrorState message={error} />}

      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid var(--border)', paddingBottom: 0 }}>
        <button
          onClick={() => setActiveTab('matters')}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderBottom: activeTab === 'matters' ? '2px solid var(--primary)' : '2px solid transparent',
            background: 'none',
            cursor: 'pointer',
            fontWeight: activeTab === 'matters' ? 600 : 400,
            color: activeTab === 'matters' ? 'var(--primary)' : 'var(--text-muted)',
          }}
        >
          Mis Materias
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderBottom: activeTab === 'attendance' ? '2px solid var(--primary)' : '2px solid transparent',
            background: 'none',
            cursor: 'pointer',
            fontWeight: activeTab === 'attendance' ? 600 : 400,
            color: activeTab === 'attendance' ? 'var(--primary)' : 'var(--text-muted)',
          }}
        >
          Asistencia
        </button>
        <button
          onClick={() => setActiveTab('grades')}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderBottom: activeTab === 'grades' ? '2px solid var(--primary)' : '2px solid transparent',
            background: 'none',
            cursor: 'pointer',
            fontWeight: activeTab === 'grades' ? 600 : 400,
            color: activeTab === 'grades' ? 'var(--primary)' : 'var(--text-muted)',
          }}
        >
          Calificaciones
        </button>
      </div>

      {activeTab === 'matters' && (
        <div>
          {assignments.length === 0 ? (
            <div className="card card-pad" style={{ textAlign: 'center', padding: 40 }}>
              <p style={{ color: 'var(--text-muted)' }}>No tienes materias asignadas actualmente.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
              {assignments.map((assignment) => (
                <div key={assignment.id} className="card card-pad">
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
                    {assignment.subject?.name || 'Sin nombre'}
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
                    {assignment.parallelEntity?.code || 'Sin paralelo'} · {assignment.subject?.semester}° Semestre
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                    {assignment.studentsCount || 0} estudiantes · {assignment.academicPeriod?.periodName || 'Sin período'}
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => { selectAssignment(assignment); setActiveTab('attendance'); }}
                    >
                      Tomar Asistencia
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => { selectAssignment(assignment); setActiveTab('grades'); }}
                    >
                      Poner Notas
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'attendance' && (
        <div>
          {!selectedAssignment ? (
            <div className="card card-pad" style={{ textAlign: 'center', padding: 40 }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>Selecciona una materia para pasar lista.</p>
              <button className="btn btn-outline" onClick={() => setActiveTab('matters')}>
                Ver Mis Materias
              </button>
            </div>
          ) : (
            <div className="card card-pad">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
                    {selectedAssignment.subject?.name}
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {selectedAssignment.parallelEntity?.code || 'Sin paralelo'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <label style={{ fontSize: 13 }}>Fecha:</label>
                  <input
                    type="date"
                    className="form-control"
                    style={{ width: 160 }}
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                  />
                </div>
              </div>

              {students.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No hay estudiantes matriculados.</p>
              ) : (
                <>
                  <table className="table">
                    <thead>
                      <tr>
                        <th style={{ width: 40 }}>#</th>
                        <th>Estudiante</th>
                        <th>CI</th>
                        <th style={{ width: 120 }}>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((enrollment, index) => (
                        <tr key={enrollment.id}>
                          <td>{index + 1}</td>
                          <td>{enrollment.student?.person?.firstName} {enrollment.student?.person?.lastName}</td>
                          <td>{enrollment.student?.person?.ci || '—'}</td>
                          <td>
                            <select
                              className="select"
                              style={{ width: '100%' }}
                              value={attendanceRecords[enrollment.studentId] || 'PRESENT'}
                              onChange={(e) => setAttendanceRecords({
                                ...attendanceRecords,
                                [enrollment.studentId]: e.target.value as AttendanceStatus,
                              })}
                            >
                              <option value="PRESENT">Presente</option>
                              <option value="ABSENT">Ausente</option>
                              <option value="LATE">Tardanza</option>
                              <option value="JUSTIFIED">Justificado</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      className="btn btn-primary"
                      onClick={saveAttendance}
                      disabled={saving}
                    >
                      {saving ? 'Guardando...' : 'Guardar Asistencia'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'grades' && (
        <div>
          {!selectedAssignment ? (
            <div className="card card-pad" style={{ textAlign: 'center', padding: 40 }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>Selecciona una materia para ingresar calificaciones.</p>
              <button className="btn btn-outline" onClick={() => setActiveTab('matters')}>
                Ver Mis Materias
              </button>
            </div>
          ) : (
            <div className="card card-pad">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
                    {selectedAssignment.subject?.name}
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {selectedAssignment.parallelEntity?.code || 'Sin paralelo'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <label style={{ fontSize: 13 }}>Parcial:</label>
                  <select
                    className="select"
                    style={{ width: 120 }}
                    value={gradePartial}
                    onChange={(e) => setGradePartial(e.target.value as typeof gradePartial)}
                  >
                    <option value="FIRST">1° Parcial</option>
                    <option value="SECOND">2° Parcial</option>
                    <option value="FINAL">Examen Final</option>
                  </select>
                </div>
              </div>

              {students.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No hay estudiantes matriculados.</p>
              ) : (
                <>
                  <table className="table">
                    <thead>
                      <tr>
                        <th style={{ width: 40 }}>#</th>
                        <th>Estudiante</th>
                        <th>CI</th>
                        <th style={{ width: 100 }}>Nota</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((enrollment, index) => (
                        <tr key={enrollment.id}>
                          <td>{index + 1}</td>
                          <td>{enrollment.student?.person?.firstName} {enrollment.student?.person?.lastName}</td>
                          <td>{enrollment.student?.person?.ci || '—'}</td>
                          <td>
                            <input
                              type="number"
                              className="form-control"
                              style={{ width: 80 }}
                              min={0}
                              max={100}
                              placeholder="0-100"
                              value={gradeRecords[enrollment.studentId] ?? ''}
                              onChange={(e) => setGradeRecords({
                                ...gradeRecords,
                                [enrollment.studentId]: e.target.value ? Number(e.target.value) : undefined,
                              })}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      className="btn btn-primary"
                      onClick={saveGrades}
                      disabled={saving}
                    >
                      {saving ? 'Guardando...' : 'Guardar Calificaciones'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
