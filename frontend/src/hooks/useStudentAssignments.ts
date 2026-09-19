import { useMemo } from 'react';
import type { SubjectAssignment, AcademicHistoryRecord } from '@/lib/types';

export interface StudentAssignmentsResult {
  approvedIds: Set<string>;
  filteredAssignments: SubjectAssignment[];
}

export function useStudentAssignments(
  assignments: SubjectAssignment[],
  studentId: string,
  periodId: string,
  history: AcademicHistoryRecord[],
): StudentAssignmentsResult {
  return useMemo(() => {
    if (!studentId || !periodId) {
      return { approvedIds: new Set<string>(), filteredAssignments: [] };
    }

    const approvedIds = new Set(
      history.filter((h) => h.status === 'APPROVED').map((h) => h.subjectId),
    );

    const filteredAssignments = assignments
      .filter(
        (a) =>
          a.enrollments?.some(
            (e) => e.studentId === studentId && e.academicPeriodId === periodId,
          ),
      )
      .filter((a) => !approvedIds.has(a.subjectId))
      .filter(
        (a, idx, self) => idx === self.findIndex((t) => t.subjectId === a.subjectId),
      );

    return { approvedIds, filteredAssignments };
  }, [assignments, studentId, periodId, history]);
}
