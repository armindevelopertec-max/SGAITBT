import jsPDF from 'jspdf';
import { Institution, Student, SubjectAssignment, AcademicPeriod } from './types';

export interface BoletaData {
  institution: Institution;
  student: Student;
  assignments: SubjectAssignment[];
  period: AcademicPeriod;
  credentials?: { username: string; password?: string };
}

const MARGIN = 20;
const PAGE_WIDTH = 216;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const PHOTO_SIZE = 35;

export function generateBoletaPdf(data: BoletaData): void {
  const { institution, student, assignments, period, credentials } = data;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  });

  const y = MARGIN;

  if (institution.logoUrl) {
    try {
      pdf.addImage(institution.logoUrl, 'JPEG', PAGE_WIDTH - MARGIN - 18, y, 18, 18);
    } catch {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.text('ITBT', PAGE_WIDTH - MARGIN - 9, y + 10, { align: 'center' });
    }
  } else {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('ITBT', PAGE_WIDTH - MARGIN - 9, y + 10, { align: 'center' });
  }

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(15);
  pdf.text(`BOLETA DE ASIGNACIÓN ${period.periodName}`, PAGE_WIDTH / 2, y + 7, { align: 'center' });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(80);
  pdf.text('SISTEMA DE GESTIÓN ACADÉMICA INSTITUCIONAL – SIGAI', PAGE_WIDTH / 2, y + 13, { align: 'center' });
  pdf.text('ORIGINAL PARA ESTUDIANTE', PAGE_WIDTH / 2, y + 18, { align: 'center' });
  pdf.setTextColor(0);

  let yPos = y + 22;
  pdf.setDrawColor(100);
  pdf.setLineWidth(0.5);
  pdf.line(MARGIN, yPos, PAGE_WIDTH - MARGIN, yPos);

  const photoX = MARGIN;
  const dataStartX = MARGIN + PHOTO_SIZE + 8;
  const dataWidth = CONTENT_WIDTH - PHOTO_SIZE - 8;

  pdf.setDrawColor(180);
  pdf.setLineWidth(0.3);

  yPos += 8;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text('DATOS DEL ESTUDIANTE', dataStartX, yPos);

  yPos += 6;
  const rowHeight = 7;
  const col1Width = dataWidth * 0.35;
  const col2Width = dataWidth * 0.25;
  const col3Width = dataWidth * 0.40;

  function drawDataRow(
    label1: string, val1: string,
    label2: string, val2: string,
    yP: number
  ): void {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(0);
    pdf.text(`${label1}:`, dataStartX, yP);
    pdf.setFont('helvetica', 'normal');
    pdf.text(val1 || '—', dataStartX + col1Width - 10, yP);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${label2}:`, dataStartX + col1Width + col2Width - 10, yP);
    pdf.setFont('helvetica', 'normal');
    pdf.text(val2 || '—', dataStartX + col1Width + col2Width + col3Width - 35, yP);
    pdf.line(dataStartX, yP + 2, dataStartX + dataWidth, yP + 2);
  }

  drawDataRow('CI', `${student.ci || ''}${student.ciExtension ? ` ${student.ciExtension}` : ''}`, 'FILIAL', 'Central El Alto', yPos);
  yPos += rowHeight;
  drawDataRow('AP. PATERNO', student.paternalSurname || '', 'CARRERA', student.career?.name || 'Autotrónica', yPos);
  yPos += rowHeight;
  drawDataRow('AP. MATERNO', student.maternalSurname || '', 'NRO. FOLDER', student.studentCode || '', yPos);
  yPos += rowHeight;
  drawDataRow('NOMBRES', student.firstName || '', 'GESTIÓN INGRESO', student.entryYear || '—', yPos);
  yPos += rowHeight;
  drawDataRow('NRO. TIT. BACHILLER', student.diplomaNumber || '', 'PLAN', 'R.M. 1049/2023', yPos);

  const photoY = yPos - rowHeight * 5;
  pdf.setDrawColor(150);
  pdf.setLineWidth(0.4);
  pdf.rect(photoX, photoY - 45, PHOTO_SIZE, PHOTO_SIZE);

  if (student.photoUrl) {
    try {
      pdf.addImage(student.photoUrl, 'JPEG', photoX + 0.5, photoY - 44.5, PHOTO_SIZE - 1, PHOTO_SIZE - 1);
    } catch {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      pdf.setTextColor(150);
      pdf.text('FOTO', photoX + PHOTO_SIZE / 2, photoY - 15, { align: 'center' });
    }
  } else {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.setTextColor(150);
    pdf.text('FOTO', photoX + PHOTO_SIZE / 2, photoY - 15, { align: 'center' });
  }

  yPos += 12;
  const today = new Date();
  const fechaFormateada = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

  const boxWidth = (CONTENT_WIDTH - 4) / 3;
  const boxHeight = 14;
  const boxGap = 2;

  pdf.setFillColor(248, 248, 248);
  pdf.setDrawColor(180);
  pdf.setLineWidth(0.3);

  pdf.rect(MARGIN, yPos, boxWidth, boxHeight);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(5.5);
  pdf.setTextColor(80);
  pdf.text('CUENTA', MARGIN + 2, yPos + 4);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(0);
  pdf.text(credentials?.username || `AUT${student.ci || ''}`, MARGIN + 2, yPos + 10);

  const box2X = MARGIN + boxWidth + boxGap;
  pdf.rect(box2X, yPos, boxWidth, boxHeight);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(5.5);
  pdf.setTextColor(80);
  pdf.text('CONTRASEÑA', box2X + 2, yPos + 4);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(0);
  pdf.text(credentials?.password || 'N/A', box2X + 2, yPos + 10);

  const box3X = box2X + boxWidth + boxGap;
  pdf.rect(box3X, yPos, boxWidth, boxHeight);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(5.5);
  pdf.setTextColor(80);
  pdf.text('FECHA INSCRIPCIÓN', box3X + 2, yPos + 4);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(0);
  pdf.text(fechaFormateada, box3X + 2, yPos + 10);

  yPos += boxHeight + 12;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('MATERIAS INSCRITAS', MARGIN, yPos);
  yPos += 5;

  const colNro = MARGIN;
  const colCodigo = MARGIN + 12;
  const colMateria = MARGIN + 35;
  const colSem = MARGIN + 110;
  const colPar = MARGIN + 120;
  const colTur = MARGIN + 130;

  pdf.setFillColor(232, 232, 232);
  pdf.rect(MARGIN, yPos - 3, CONTENT_WIDTH, 6, 'F');
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(20, 33, 61);
  pdf.text('N.°', colNro, yPos);
  pdf.text('CÓDIGO', colCodigo, yPos);
  pdf.text('MATERIA', colMateria, yPos);
  pdf.text('SEM', colSem, yPos);
  pdf.text('PAR', colPar, yPos);
  pdf.text('TUR', colTur, yPos);
  yPos += 4;
  pdf.setDrawColor(150);
  pdf.line(MARGIN, yPos, PAGE_WIDTH - MARGIN, yPos);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(0);

  assignments.forEach((a, i) => {
    const shiftLabel =
      a.parallelEntity?.shift === 'MANANA'
        ? 'M'
        : a.parallelEntity?.shift === 'TARDE'
          ? 'T'
          : a.parallelEntity?.shift === 'NOCHE'
            ? 'N'
            : '—';
    yPos += 5;
    pdf.text((i + 1).toString(), colNro, yPos);
    pdf.text(a.subject?.code || '—', colCodigo, yPos);
    pdf.text((a.subject?.name || '—').substring(0, 38), colMateria, yPos);
    pdf.text((a.semester || a.subject?.semester || '—').toString(), colSem, yPos);
    pdf.text(a.parallel || 'A', colPar, yPos);
    pdf.text(shiftLabel, colTur, yPos);

    pdf.setDrawColor(200);
    pdf.line(MARGIN, yPos + 2, PAGE_WIDTH - MARGIN, yPos + 2);
  });

  yPos += 6;
  pdf.setFontSize(7);
  pdf.setTextColor(100);
  pdf.text('PAR: Paralelo  |  TUR: Turno', MARGIN, yPos);

  yPos += 12;
  pdf.setDrawColor(150);
  pdf.line(MARGIN, yPos, PAGE_WIDTH - MARGIN, yPos);

  yPos += 5;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(80);
  pdf.text(`${institution.name || 'Instituto Tecnológico "Boliviana de Tecnología"'} · R.M. 1049/2023`, PAGE_WIDTH / 2, yPos, { align: 'center' });
  yPos += 4;
  pdf.setFont('helvetica', 'normal');
  const addr = institution.address || 'El Alto, Av. de los Héroes, Z. Ferropetrol N.° 11';
  const tel = institution.phone || '75252479';
  pdf.text(`${addr} · Tfno: ${tel}`, PAGE_WIDTH / 2, yPos, { align: 'center' });

  pdf.save(`Boleta-Asignacion-${student.studentCode}.pdf`);
}
