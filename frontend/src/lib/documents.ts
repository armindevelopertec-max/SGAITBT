import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { Student, AcademicHistoryRecord, Subject, Institution, SubjectAssignment } from '@/lib/types';
import { fullSurname, paternalOf, maternalOf, ciText, formatDate, loadImageDataUrl } from '@/lib/utils';
import { COLORS, INSTITUTION_SUFFIX } from '@/lib/constants';

export type CertificateDocType = 'NOTES' | 'STUDIES' | 'REGULAR' | 'ENROLLMENT' | 'HISTORY' | 'ASIGNACION';

export interface CertificateData {
  docType: CertificateDocType;
  student: Student;
  history: AcademicHistoryRecord[];
  subjects: Subject[];
  institution?: Institution;
  assignments?: SubjectAssignment[];
  credentials?: { username: string; password: string };
  verificationCode?: string;
  documentNumber?: string;
}

const { NAVY } = COLORS;
const MARGIN_X = 15;
const INSTITUTION_LINE = 'SISTEMA DE GESTIÓN ACADÉMICA INSTITUCIONAL \u2013 SIGAI';

function pageW(doc: jsPDF): number {
  return doc.internal.pageSize.getWidth();
}

function pageH(doc: jsPDF): number {
  return doc.internal.pageSize.getHeight();
}

function roman(n: number): string {
  const map: Array<[number, string]> = [
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ];
  let result = '';
  let value = n;
  for (const [num, sym] of map) {
    while (value >= num) {
      result += sym;
      value -= num;
    }
  }
  return result || String(n);
}

function entryLabelFor(student: Student, history: AcademicHistoryRecord[]): string {
  const sortedByYear = [...history].sort((a, b) =>
    Number(b.academicPeriod?.year) - Number(a.academicPeriod?.year));
  const currentYear = sortedByYear[0]?.academicPeriod?.year
    ? Number(sortedByYear[0].academicPeriod.year)
    : new Date().getFullYear();
  const entryYear = currentYear - Math.floor(((student.currentLevel ?? 1) - 1) / 2);
  const seqs = history
    .filter((hh) => Number(hh.academicPeriod?.year) === entryYear)
    .map((hh) => hh.academicPeriod?.sequence ?? 1);
  const seq = seqs.length > 0 ? Math.min(...seqs) : 1;
  return `${roman(seq)}/${entryYear}`;
}

function boletaPeriodLabel(history: AcademicHistoryRecord[]): string {
  const sortedByYear = [...history].sort((a, b) =>
    Number(b.academicPeriod?.year) - Number(a.academicPeriod?.year));
  const latest = sortedByYear[0]?.academicPeriod;
  return latest?.year ? `${roman(Number(latest.sequence))}/${latest.year}` : '____';
}

function truncate(doc: jsPDF, text: string, width: number): string {
  const s = String(text ?? '');
  if (!s) return '—';
  if (doc.getTextWidth(s) <= width) return s;
  const lines = doc.splitTextToSize(s, width);
  return lines.length > 1 ? `${lines.slice(0, 1).join(' ')}…` : s;
}

function addLogo(doc: jsPDF, logoUrl: string | null, x: number, y: number, size: number): void {
  if (!logoUrl) return;
  try {
    doc.addImage(logoUrl, 'JPEG', x, y, size, size);
  } catch {
    try {
      doc.addImage(logoUrl, 'PNG', x, y, size, size);
    } catch {
      /* sin logo */
    }
  }
}

interface PageFlow {
  W: number;
  H: number;
  getY: () => number;
  down: (h: number) => void;
  ensure: (h: number) => void;
  setY: (v: number) => void;
}

function createFlow(
  doc: jsPDF,
  logoUrl: string | null,
  instName: string,
  title: string,
  subtitle?: string,
): PageFlow {
  const W = pageW(doc);
  const H = pageH(doc);
  let y = drawMembrete(doc, logoUrl, instName, title, subtitle);
  const continuationName = (instName || 'INSTITUTO TECNOLÓGICO «BOLIVIANA DE TECNOLOGÍA»').toUpperCase();

  return {
    W,
    H,
    getY: () => y,
    setY: (v) => {
      y = v;
    },
    down: (h) => {
      y += h;
    },
    ensure: (h) => {
      if (y + h > H - 14) {
        doc.addPage();
        // membrete reducido en páginas de continuación
        if (logoUrl) addLogo(doc, logoUrl, MARGIN_X, 8, 12);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(...NAVY);
        doc.text(truncate(doc, continuationName, W - 30), W / 2, 13, { align: 'center' });
        doc.setDrawColor(...NAVY);
        doc.setLineWidth(0.8);
        doc.line(MARGIN_X, 16, W - MARGIN_X, 16);
        doc.setLineWidth(0.3);
        doc.line(MARGIN_X, 17, W - MARGIN_X, 17);
        y = 24;
      }
    },
  };
}

function drawMembrete(
  doc: jsPDF,
  logoUrl: string | null,
  instName: string,
  title: string,
  subtitle?: string,
): number {
  const W = pageW(doc);
  const name = (instName || 'Instituto Tecnológico \u201CBoliviana de Tecnología\u201D').toUpperCase();

  if (logoUrl) addLogo(doc, logoUrl, MARGIN_X, 8, 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(...NAVY);
  const nameLines = doc.splitTextToSize(name, W - 40);
  let y = 16;
  for (const line of nameLines) {
    doc.text(line, W / 2, y, { align: 'center' });
    y += 5.5;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(90, 90, 90);
  doc.text(INSTITUTION_LINE, W / 2, y + 1, { align: 'center' });
  y += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(130, 130, 130);
  doc.text(INSTITUTION_SUFFIX, W / 2, y + 1.5, { align: 'center' });
  y += 4.5;

  doc.setDrawColor(...NAVY);
  doc.setLineWidth(1);
  doc.line(MARGIN_X, y, W - MARGIN_X, y);
  doc.setLineWidth(0.35);
  doc.line(MARGIN_X, y + 1, W - MARGIN_X, y + 1);
  y += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13.5);
  doc.setTextColor(10, 10, 10);
  doc.text(title, W / 2, y, { align: 'center' });
  y += 6.5;

  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(80, 80, 80);
    doc.text(subtitle, W / 2, y, { align: 'center' });
    y += 5.5;
  }

  return y + 2;
}

interface DataRow {
  label: string;
  value: string;
}

function drawDataGrid(doc: jsPDF, pg: PageFlow, rows: DataRow[], y0: number): void {
  const W = pg.W;
  const colW = (W - MARGIN_X * 2) / 2;
  const labelW = 40;
  const rowH = 7;
  let y = y0;
  doc.setTextColor(90, 90, 90);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  // labels sin salto de página; asumimos grilla corta
  for (let i = 0; i < rows.length; i += 2) {
    pg.ensure(rowH);
    y = pg.getY();
    const left = rows[i];
    const right = rows[i + 1];
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(90, 90, 90);
    doc.text(left.label, MARGIN_X, y);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(20, 20, 20);
    doc.text(truncate(doc, left.value, colW - labelW - 4), MARGIN_X + labelW, y);
    if (right) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(90, 90, 90);
      doc.text(right.label, MARGIN_X + colW, y);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(20, 20, 20);
      doc.text(truncate(doc, right.value, colW - labelW - 4), MARGIN_X + colW + labelW, y);
    }
    pg.down(rowH);
  }
}

function sectionTitle(doc: jsPDF, pg: PageFlow, text: string): void {
  pg.ensure(16);
  const y = pg.getY() + 3;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...NAVY);
  doc.text(text, MARGIN_X, y);
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.25);
  doc.line(MARGIN_X, y + 1.5, pageW(doc) - MARGIN_X, y + 1.5);
  pg.setY(y + 5);
}

function tableHeader(
  doc: jsPDF,
  pg: PageFlow,
  cells: Array<{ text: string; w: number; align?: 'left' | 'center' | 'right' }>,
): void {
  const y = pg.getY() + 1;
  doc.setFillColor(240, 242, 246);
  doc.rect(MARGIN_X, y - 4, pageW(doc) - MARGIN_X * 2, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...NAVY);
  let x = MARGIN_X;
  for (const cell of cells) {
    doc.text(cell.text, x + (cell.align === 'center' ? cell.w / 2 : cell.align === 'right' ? cell.w : 1), y, {
      align: cell.align === 'center' ? 'center' : cell.align === 'right' ? 'right' : 'left',
    });
    x += cell.w;
  }
  doc.setDrawColor(160, 160, 160);
  doc.setLineWidth(0.3);
  doc.line(MARGIN_X, y + 2.5, pageW(doc) - MARGIN_X, y + 2.5);
  pg.setY(y + 4);
}

function drawSignatures(
  doc: jsPDF,
  pg: PageFlow,
  left: string,
  right: string,
  recto?: string,
): void {
  const W = pg.W;
  const yTop = pg.getY() + 8;
  const yLine = pg.H - 40;
  const yLabel = pg.H - 33;

  if (recto) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(40, 40, 40);
    doc.text(recto, MARGIN_X, yTop);
  }

  const cx1 = W / 4;
  const cx2 = (W * 3) / 4;
  const lineW = 52;
  doc.setDrawColor(60, 60, 60);
  doc.setLineWidth(0.4);
  doc.line(cx1 - lineW / 2, yLine, cx1 + lineW / 2, yLine);
  doc.line(cx2 - lineW / 2, yLine, cx2 + lineW / 2, yLine);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  doc.text(left, cx1, yLabel, { align: 'center' });
  doc.text(right, cx2, yLabel, { align: 'center' });
}

function drawSignaturesWithRector(
  doc: jsPDF,
  pg: PageFlow,
  left: string,
  center: string,
  right: string,
  recto?: string,
): void {
  const W = pg.W;
  const yTop = pg.getY() + 8;
  const yLine = pg.H - 40;
  const yLabel = pg.H - 33;

  if (recto) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(40, 40, 40);
    doc.text(recto, MARGIN_X, yTop);
  }

  const cx1 = W / 5;
  const cx2 = W / 2;
  const cx3 = (W * 4) / 5;
  const lineW = 45;
  doc.setDrawColor(60, 60, 60);
  doc.setLineWidth(0.4);
  doc.line(cx1 - lineW / 2, yLine, cx1 + lineW / 2, yLine);
  doc.line(cx2 - lineW / 2, yLine, cx2 + lineW / 2, yLine);
  doc.line(cx3 - lineW / 2, yLine, cx3 + lineW / 2, yLine);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  doc.text(left, cx1, yLabel, { align: 'center' });
  doc.text(center, cx2, yLabel, { align: 'center' });
  doc.text(right, cx3, yLabel, { align: 'center' });
}

function buildQrDataUrl(student: Student, verificationCode?: string): Promise<string | null> {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://sga-itbt.edu.bo';
  const verifyUrl = verificationCode
    ? `${baseUrl}/api/certificates/verify/${verificationCode}`
    : null;

  const payload = verifyUrl || [
    'INSTITUTO TECNOLÓGICO \u201CBOLIVIANA DE TECNOLOGÍA\u201D',
    `Estudiante: ${student.person?.firstName || ''} ${fullSurname(student.person)}`,
    `CI: ${student.person?.ci || ''}`,
    `Código: ${student.studentCode || ''}`,
    `Carrera: ${student.career?.name || ''}`,
  ].filter((line) => line.trim()).join('\n');

  return QRCode.toDataURL(payload, { errorCorrectionLevel: 'M', margin: 1, width: 300 }).catch(
    () => null,
  );
}

export async function generateInstitutionalDocument(data: CertificateData): Promise<void> {
  const { docType, student, history, subjects, institution, assignments, credentials, verificationCode, documentNumber } = data;
  const instName = institution?.name || 'Instituto Tecnológico \u201CBoliviana de Tecnología\u201D';
  const address = institution?.address || 'El Alto, Av. de los Héroes, Z. Ferropetrol N.º 11';
  const phone = institution?.phone || institution?.phoneSecondary || '75252479';

  const titleMap: Record<CertificateDocType, string> = {
    NOTES: 'CERTIFICADO DE NOTAS',
    STUDIES: 'CERTIFICADO DE ESTUDIOS',
    REGULAR: 'CERTIFICADO DE ESTUDIANTE REGULAR',
    ENROLLMENT: 'CONSTANCIA DE MATRÍCULA',
    HISTORY: 'HISTORIAL ACADÉMICO',
    ASIGNACION: `BOLETA DE ASIGNACIÓN ${boletaPeriodLabel(history)}`,
  };

  const logoUrl = await loadImageDataUrl(institution?.logoUrl ?? '/logo.png');
  const qrUrl = docType === 'ASIGNACION' ? await buildQrDataUrl(student, verificationCode) : null;

  const orientation = docType === 'HISTORY' ? 'landscape' : 'portrait';
  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
  const subtitle = docType === 'ASIGNACION' ? 'ORIGINAL PARA ESTUDIANTE' : undefined;
  const pg = createFlow(doc, logoUrl, instName, titleMap[docType], subtitle);

  const fullName = `${student.person?.firstName || ''} ${fullSurname(student.person)}`;
  const docNumber = documentNumber || `DOC-${String(Math.floor(Math.random() * 9000) + 1000)}-SGA`;

  if (docType === 'ASIGNACION') {
    const latestPeriod = [...history].sort((a, b) =>
      Number(b.academicPeriod?.year) - Number(a.academicPeriod?.year))[0]?.academicPeriod;
    drawBoleta(doc, pg, {
      student,
      history,
      assignments,
      address,
      phone,
      instName,
      year: latestPeriod?.year || String(new Date().getFullYear()),
      entryLabel: entryLabelFor(student, history),
      qrUrl,
      credentials,
    });
  } else if (docType === 'HISTORY') {
    drawHistorial(doc, pg, { student, history, subjects, docNumber, verificationCode, institution });
  } else {
    await drawCertificado(doc, pg, {
      docType,
      student,
      history,
      fullName,
      docNumber,
      instName,
      verificationCode,
      institution,
    });
  }

  const fileNameMap: Record<CertificateDocType, string> = {
    NOTES: `Certificado-de-Notas-${student.studentCode}`,
    STUDIES: `Certificado-de-Estudios-${student.studentCode}`,
    REGULAR: `Certificado-Regular-${student.studentCode}`,
    ENROLLMENT: `Constancia-de-Matricula-${student.studentCode}`,
    HISTORY: `Historial-Academico-${student.studentCode}`,
    ASIGNACION: `Boleta-de-Asignacion-${student.studentCode}`,
  };
  doc.save(fileNameMap[docType]);
}

// ---------------------------------------------------------------------------
// Boleta de asignación
// ---------------------------------------------------------------------------
function drawBoleta(
  doc: jsPDF,
  pg: PageFlow,
  data: {
    student: Student;
    history: AcademicHistoryRecord[];
    assignments?: SubjectAssignment[];
    address: string;
    phone: string;
    instName: string;
    year: string;
    entryLabel: string;
    qrUrl: string | null;
    credentials?: { username: string; password: string };
  },
): void {
  const { student, history, assignments, address, phone, instName, year, entryLabel, qrUrl, credentials } = data;

  sectionTitle(doc, pg, 'DATOS DEL ESTUDIANTE');
  drawDataGrid(doc, pg, [
    { label: 'C.I.:', value: ciText(student.person) },
    { label: 'FILIAL:', value: 'Central El Alto' },
    { label: 'APELLIDO PATERNO:', value: paternalOf(student.person) },
    { label: 'APELLIDO MATERNO:', value: maternalOf(student.person) },
    { label: 'NOMBRES:', value: student.person?.firstName || '—' },
    { label: 'NRO. FOLDER:', value: student.studentCode || '—' },
    { label: 'CARRERA:', value: student.career?.name || '—' },
    { label: 'GESTIÓN DE INGRESO:', value: entryLabel },
    { label: 'NRO. TIT. BACHILLER:', value: student.diplomaNumber || '—' },
    { label: 'PLAN:', value: student.career?.code || '—' },
  ], pg.getY());

  sectionTitle(doc, pg, 'DATOS DE ACCESO POR SISTEMA');
  const accountLabel = credentials?.username || `AUT${student.person?.ci || '—'}`;
  const passwordLabel = credentials?.password || 'Consultar en secretaría';
  drawDataGrid(doc, pg, [
    { label: 'CUENTA:', value: accountLabel },
    { label: 'CONTRASEÑA:', value: passwordLabel },
    {
      label: 'FECHA DE INSCRIPCIÓN:',
      value: new Date().toLocaleString('es-BO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    },
  ], pg.getY());
  pg.ensure(10);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(110, 110, 110);
  doc.text(
    'La contraseña es personal e intransferible. Cámbiela en su primer ingreso al sistema.',
    MARGIN_X,
    pg.getY(),
  );
  pg.down(6);

  sectionTitle(doc, pg, 'MATERIAS INSCRITAS');
  
  // Use assignments if provided, otherwise fall back to history filtering
  let currentAssignments: Array<{ subject?: Subject; semester: number; parallel?: string; parallelEntity?: { shift?: string }; employee?: { person?: { firstName?: string; paternalSurname?: string } } }> = [];

  if (assignments && assignments.length > 0) {
    currentAssignments = assignments.map((a) => ({
      subject: a.subject,
      semester: a.semester,
      parallel: a.parallelEntity?.code,
      parallelEntity: a.parallelEntity,
      employee: a.employee,
    }));
  } else {
    // Fallback: filter history by most recent period
    const sortedHistory = [...history].sort((a, b) =>
      Number(b.academicPeriod?.year) - Number(a.academicPeriod?.year) ||
      Number(b.academicPeriod?.sequence) - Number(a.academicPeriod?.sequence));
    const cp = sortedHistory[0]?.academicPeriod;
    currentAssignments = history
      .filter(
        (h) =>
          h.academicPeriod &&
          Number(h.academicPeriod.year) === Number(cp?.year) &&
          h.academicPeriod.sequence === cp?.sequence,
      )
      .map((h) => ({
        subject: h.subject,
        semester: h.semester,
        parallel: 'A',
        parallelEntity: undefined,
        employee: undefined,
      }))
      .sort(
        (a, b) =>
          a.semester - b.semester ||
          (a.subject?.code ?? '').localeCompare(b.subject?.code ?? ''),
      );
  }

  const W = pg.W;
  const cols = [
    { text: 'N.º', w: 12, align: 'center' as const },
    { text: 'CÓDIGO', w: 26, align: 'left' as const },
    { text: 'MATERIA', w: W - MARGIN_X * 2 - 12 - 26 - 22 - 18 - 18, align: 'left' as const },
    { text: 'SEM', w: 22, align: 'center' as const },
    { text: 'PAR', w: 18, align: 'center' as const },
    { text: 'TUR', w: 18, align: 'center' as const },
  ];
  tableHeader(doc, pg, cols);

  if (currentAssignments.length === 0) {
    pg.ensure(8);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 100, 100);
    doc.text('Sin materias asignadas para la gestión.', MARGIN_X, pg.getY());
    pg.down(8);
  } else {
    currentAssignments.forEach((h, i) => {
      const rowH = 7;
      pg.ensure(rowH);
      const y = pg.getY();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(20, 20, 20);
      let x = MARGIN_X;
      doc.text(String(i + 1), x + cols[0].w / 2, y, { align: 'center' });
      x += cols[0].w;
      doc.setFont('helvetica', 'bold');
      doc.text(h.subject?.code ?? '—', x + 1, y);
      x += cols[1].w;
      doc.setFont('helvetica', 'normal');
      doc.text(truncate(doc, h.subject?.name ?? '—', cols[2].w - 3), x + 1, y);
      x += cols[2].w;
      doc.text(String(h.semester), x + cols[3].w / 2, y, { align: 'center' });
      x += cols[3].w;
      doc.text(h.parallel ?? 'A', x + cols[4].w / 2, y, { align: 'center' });
      x += cols[4].w;
      const shiftLabel = h.parallelEntity?.shift === 'MANANA' ? 'M' : h.parallelEntity?.shift === 'TARDE' ? 'T' : h.parallelEntity?.shift === 'NOCHE' ? 'N' : '—';
      doc.text(shiftLabel, x + cols[5].w / 2, y, { align: 'center' });
      pg.down(rowH);
    });
  }

  pg.ensure(6);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(110, 110, 110);
  doc.text('PAR: Paralelo · TUR: Turno', MARGIN_X, pg.getY());
  pg.down(5);
  doc.text(
    'El interesado debe verificar que todos los datos sean correctos antes de firmar. La institución no se hará responsable por datos incorrectos para trámites posteriores.',
    MARGIN_X,
    pg.getY(),
    { maxWidth: W - MARGIN_X * 2 },
  );
  pg.down(11);

  sectionTitle(doc, pg, 'DATOS INSTITUCIONALES');
  pg.ensure(30);
  let y = pg.getY();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(20, 20, 20);
  doc.text(instName, MARGIN_X, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(70, 70, 70);
  const instLines = doc.splitTextToSize(`${INSTITUTION_SUFFIX} · Dirección: ${address} · Teléfono: ${phone}`, W - MARGIN_X * 2 - (qrUrl ? 22 : 0));
  for (const line of instLines) {
    doc.text(line, MARGIN_X, y);
    y += 4.5;
  }
  if (qrUrl) {
    try {
      doc.addImage(qrUrl, 'PNG', W - MARGIN_X - 18, pg.getY() + 1, 18, 18);
    } catch {
      /* sin QR */
    }
  }
  pg.setY(y + 2);

  pg.ensure(24);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  doc.text(`Lugar y fecha: El Alto, ____ de ____________ de ${year}.`, MARGIN_X, pg.getY());
  pg.down(12);

  drawSignatures(doc, pg, 'Firma del estudiante', 'Sello de la institución');
}

// ---------------------------------------------------------------------------
// Historial académico
// ---------------------------------------------------------------------------
function drawHistorial(
  doc: jsPDF,
  pg: PageFlow,
  data: {
    student: Student;
    history: AcademicHistoryRecord[];
    subjects: Subject[];
    docNumber: string;
    verificationCode?: string;
    institution?: Institution;
  },
): void {
  const { student, history, subjects, docNumber, verificationCode, institution } = data;

  sectionTitle(doc, pg, 'DATOS DEL ESTUDIANTE');
  drawDataGrid(doc, pg, [
    { label: 'Nombre:', value: `${student.person?.firstName || ''} ${fullSurname(student.person)}` },
    { label: 'C.I.:', value: ciText(student.person) },
    { label: 'Celular:', value: student.person?.phone || '—' },
    { label: 'Ingreso:', value: entryLabelFor(student, history) },
    { label: 'Matrícula:', value: student.studentCode || '—' },
    { label: 'Plan:', value: student.career?.code || '—' },
    {
      label: 'Fecha de impresión:',
      value: formatDate(String(new Date())),
    },
    { label: 'Documento:', value: docNumber },
  ], pg.getY());

  sectionTitle(doc, pg, 'ESTRUCTURA DEL HISTORIAL');

  const sortedSubjects = [...subjects].sort(
    (a, b) => a.semester - b.semester || a.code.localeCompare(b.code),
  );
  const maxSemester = subjects.length > 0 ? Math.max(...subjects.map((s) => s.semester)) : 4;
  const numYears = Math.max(1, Math.ceil(maxSemester / 2));
  const sortedHistory = [...history].sort((a, b) =>
    Number(b.academicPeriod?.year) - Number(a.academicPeriod?.year));
  const currentYear = sortedHistory[0]?.academicPeriod?.year
    ? Number(sortedHistory[0].academicPeriod.year)
    : new Date().getFullYear();
  const entryYear = currentYear - Math.floor(((student.currentLevel ?? 1) - 1) / 2);
  const years = Array.from({ length: numYears }, (_, i) => entryYear + i);

  const cellMap = new Map<string, AcademicHistoryRecord>();
  history.forEach((h) => {
    if (h.subject?.code && h.academicPeriod) {
      cellMap.set(`${h.academicPeriod.year}|${h.academicPeriod.sequence}|${h.subject.code}`, h);
    }
  });
  const gradeCell = (y: number, seq: number, code: string) =>
    cellMap.get(`${y}|${seq}|${code}`)?.finalGrade ?? '—';

  const W = pg.W;
  const total = W - MARGIN_X * 2;
  const numW = 9;
  const codW = 18;
  const arhW = 9;
  const yrW = 13;
  let preW = 30;
  let matW = total - numW - codW - preW - years.length * 2 * yrW - arhW * 3;
  if (matW < 60) {
    preW = 24;
    matW = total - numW - codW - preW - years.length * 2 * yrW - arhW * 3;
  }
  if (matW < 55) matW = 55;

  const headCells = [
    { text: 'N.º', w: numW, align: 'center' as const },
    { text: 'Código', w: codW, align: 'left' as const },
    { text: 'Materia', w: matW, align: 'left' as const },
    { text: 'Pre-Requisito', w: preW, align: 'left' as const },
    ...years.flatMap(() => [
      { text: '', w: yrW, align: 'center' as const },
      { text: '', w: yrW, align: 'center' as const },
    ]),
    { text: 'A', w: arhW, align: 'center' as const },
    { text: 'R', w: arhW, align: 'center' as const },
    { text: 'H', w: arhW, align: 'center' as const },
  ];
  const hdrY = pg.getY() + 1;
  tableHeader(doc, pg, headCells);

  // años centrados sobre sus dos periodos y sub-encabezado 1.º / 2.º
  let hx = MARGIN_X + numW + codW + matW + preW;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...NAVY);
  years.forEach((yv) => {
    doc.text(String(yv), hx + yrW, hdrY, { align: 'center' });
    hx += yrW * 2;
  });
  const headSubY = pg.getY() + 1.5;
  doc.setFontSize(6);
  doc.setTextColor(90, 90, 90);
  let sx = MARGIN_X + numW + codW + matW + preW;
  years.forEach(() => {
    doc.text('1.º', sx + yrW / 2, headSubY, { align: 'center' });
    sx += yrW;
    doc.text('2.º', sx + yrW / 2, headSubY, { align: 'center' });
    sx += yrW;
  });
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.2);
  doc.line(MARGIN_X, headSubY + 2, pageW(doc) - MARGIN_X, headSubY + 2);
  pg.setY(headSubY + 1);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(80, 80, 80);
  const subY = pg.getY() + 1;
  doc.text(`Documento: ${docNumber} · Página: 1`, MARGIN_X, subY);
  pg.setY(subY + 2);

  if (sortedSubjects.length === 0) {
    pg.ensure(8);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 100, 100);
    doc.text('Sin plan de estudios cargado.', MARGIN_X, pg.getY());
    pg.down(8);
  } else {
    sortedSubjects.forEach((s, i) => {
      const rowH = 6.5;
      pg.ensure(rowH);
      const y = pg.getY();
      if (i > 0 && i % 2 === 1) {
        doc.setFillColor(248, 249, 251);
        doc.rect(MARGIN_X, y - 4, total, rowH, 'F');
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(20, 20, 20);
      let x = MARGIN_X;
      doc.text(String(i + 1), x + numW / 2, y, { align: 'center' });
      x += numW;
      doc.setFont('helvetica', 'bold');
      doc.text(s.code, x + 1, y);
      x += codW;
      doc.setFont('helvetica', 'normal');
      doc.text(truncate(doc, s.name, matW - 3), x + 1, y);
      x += matW;
      doc.text(truncate(doc, s.prerequisites && s.prerequisites.length > 0 ? s.prerequisites.join(', ') : '—', preW - 3), x + 1, y);
      x += preW;
      for (const yv of years) {
        for (let seq = 1; seq <= 2; seq++) {
          const v = String(gradeCell(yv, seq, s.code));
          doc.text(v, x + yrW / 2, y, { align: 'center' });
          x += yrW;
        }
      }
      const records = history.filter((h) => h.subject?.code === s.code);
      const passed = records.some((r) => r.status === 'APPROVED');
      const taken = records.length > 0;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 127, 55);
      doc.text(passed ? 'A' : '', x + arhW / 2, y, { align: 'center' });
      x += arhW;
      doc.setTextColor(198, 40, 40);
      doc.text(taken && !passed ? 'R' : '', x + arhW / 2, y, { align: 'center' });
      x += arhW;
      doc.setTextColor(21, 101, 192);
      doc.text(passed ? 'H' : '', x + arhW / 2, y, { align: 'center' });
      doc.setTextColor(20, 20, 20);
      pg.down(rowH);
    });
  }

  pg.ensure(14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  const note = doc.splitTextToSize(
    'En cada año se manejan dos periodos/semestres (1.º y 2.º). Las notas corresponden al periodo donde se cursó la materia. A: Aprobada · R: Reprobada · H: Habilitado/a para cursar las materias del próximo semestre.',
    W - MARGIN_X * 2,
  );
  for (const line of note) {
    doc.text(line, MARGIN_X, pg.getY());
    pg.down(4.5);
  }

  drawSignatures(doc, pg, 'Secretaría Académica', 'Dirección Académica', `Lugar y fecha: El Alto, ${formatDate(String(new Date()))} de ${String(entryYear + numYears)}.`);
}

// ---------------------------------------------------------------------------
// Certificados / constancias
// ---------------------------------------------------------------------------
async function drawCertificado(
  doc: jsPDF,
  pg: PageFlow,
  data: {
    docType: CertificateDocType;
    student: Student;
    history: AcademicHistoryRecord[];
    fullName: string;
    docNumber: string;
    instName: string;
    verificationCode?: string;
    institution?: Institution;
  },
): Promise<void> {
  const { docType, student, history, fullName, docNumber, instName, verificationCode, institution } = data;
  const avg =
    history.length > 0
      ? (history.reduce((acc, h) => acc + (h.finalGrade ?? 0), 0) / history.length).toFixed(2)
      : '—';
  const approved = history.filter((h) => h.status === 'APPROVED').length;
  const failed = history.filter((h) => h.status === 'FAILED').length;

  const sortedHistory = [...history].sort((a, b) =>
    Number(b.academicPeriod?.year) - Number(a.academicPeriod?.year) ||
    Number(b.academicPeriod?.sequence) - Number(a.academicPeriod?.sequence));
  const currentPeriodName = sortedHistory[0]?.academicPeriod?.periodName || '2026';

  drawDataGrid(doc, pg, [
    { label: 'Nº de documento:', value: docNumber },
    { label: 'Estudiante:', value: fullName },
    { label: 'CI:', value: ciText(student.person) },
    { label: 'Código de estudiante:', value: student.studentCode || '—' },
    { label: 'Carrera:', value: student.career?.name || '—' },
    { label: 'Nivel actual:', value: `${student.currentLevel}º semestre` },
    { label: 'Estado académico:', value: student.status },
    ...(docType === 'ENROLLMENT' || docType === 'REGULAR'
      ? [{ label: 'Gestión:', value: currentPeriodName }]
      : []),
  ], pg.getY());

  pg.ensure(30);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(20, 20, 20);
  const y = pg.getY() + 4;

  if (docType === 'NOTES') {
    doc.text('Se certifica que el (la) estudiante ha cursado las siguientes materias:', MARGIN_X, y);
    pg.setY(y + 10);
    const W = pg.W;
    const cols = [
      { text: 'Gestión', w: 40, align: 'left' as const },
      { text: 'Semestre', w: 30, align: 'center' as const },
      { text: 'Materia', w: W - MARGIN_X * 2 - 40 - 30 - 28 - 32, align: 'left' as const },
      { text: 'Nota final', w: 28, align: 'center' as const },
      { text: 'Estado', w: 32, align: 'left' as const },
    ];
    tableHeader(doc, pg, cols);
    if (history.length === 0) {
      pg.ensure(8);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 100, 100);
      doc.text('Sin materias cursadas.', MARGIN_X, pg.getY());
      pg.down(8);
    } else {
      history.forEach((h, i) => {
        const rowH = 7;
        pg.ensure(rowH);
        const ry = pg.getY();
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(20, 20, 20);
        let x = MARGIN_X;
        doc.text(h.academicPeriod?.periodName ?? '—', x + 1, ry);
        x += cols[0].w;
        doc.text(`${h.semester}º`, x + cols[1].w / 2, ry, { align: 'center' });
        x += cols[1].w;
        doc.text(truncate(doc, h.subject?.name ?? '—', cols[2].w - 3), x + 1, ry);
        x += cols[2].w;
        doc.text(String(h.finalGrade ?? '-'), x + cols[3].w / 2, ry, { align: 'center' });
        x += cols[3].w;
        doc.text(h.status === 'APPROVED' ? 'Aprobado' : 'Reprobado', x + 1, ry);
        if (i % 2 === 1) {
          doc.setFillColor(248, 249, 251);
          doc.rect(MARGIN_X, ry - 4, W - MARGIN_X * 2, rowH, 'F');
        }
        pg.down(rowH);
      });
    }
    pg.ensure(10);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(20, 20, 20);
    doc.text(`Promedio: ${avg} · Aprobadas: ${approved} · Reprobadas: ${failed}`, MARGIN_X, pg.getY() + 5);
    pg.down(10);
  } else if (docType === 'STUDIES') {
    const lines = doc.splitTextToSize(
      `Se certifica que el (la) estudiante ${fullName}, con CI ${student.person?.ci || ''}, es estudiante regular de la carrera de ${student.career?.name ?? '—'} en el nivel ${student.currentLevel}º semestre, habiendo aprobado ${approved} materias y reprobado ${failed} de un total de ${history.length} materias cursadas, con un promedio general de ${avg} sobre 100.`,
      pageW(doc) - MARGIN_X * 2,
    );
    for (const line of lines) {
      pg.ensure(5);
      doc.text(line, MARGIN_X, pg.getY());
      pg.down(5);
    }
  } else {
    const cuerpo =
      docType === 'REGULAR'
        ? `Se certifica que el (la) estudiante ${fullName}, portador(a) del CI ${student.person?.ci || ''}, código ${student.studentCode}, cursa la carrera de ${student.career?.name ?? '—'} durante la gestión ${currentPeriodName}, encontrándose en situación regular.`
        : `Se hace constar que el (la) estudiante ${fullName}, CI ${student.person?.ci || ''}, código ${student.studentCode}, está matriculado(a) en la carrera de ${student.career?.name ?? '—'}, en el ${student.currentLevel}º semestre, correspondiente a la gestión académica ${currentPeriodName}, en la modalidad vigente de la institución.`;
    const lines = doc.splitTextToSize(cuerpo, pageW(doc) - MARGIN_X * 2);
    for (const line of lines) {
      pg.ensure(5);
      doc.text(line, MARGIN_X, pg.getY());
      pg.down(5);
    }
  }

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(90, 90, 90);
  pg.ensure(14);
  doc.text(`${instName} — ${INSTITUTION_SUFFIX}`, MARGIN_X, pg.getY() + 6);
  pg.down(8);

  const secretaryLabel = institution?.rectorName ? 'Secretaría Académica' : 'Secretaría Académica';
  const directorLabel = 'Dirección Académica';
  const rectorLabel = institution?.rectorName || undefined;

  if (verificationCode) {
    const qrUrl = await buildQrDataUrl(student, verificationCode);
    if (qrUrl) {
      const qrSize = 25;
      const qrX = pg.W - MARGIN_X - qrSize;
      const qrY = 15;
      try {
        doc.addImage(qrUrl, 'PNG', qrX, qrY, qrSize, qrSize);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(6);
        doc.setTextColor(100, 100, 100);
        doc.text('Verificar', qrX + qrSize / 2, qrY + qrSize + 3, { align: 'center' });
      } catch {
        /* QR no disponible */
      }
    }
  }

  if (rectorLabel) {
    drawSignaturesWithRector(
      doc,
      pg,
      secretaryLabel,
      directorLabel,
      rectorLabel,
      `Lugar y fecha: El Alto, ${formatDate(String(new Date()))}.`,
    );
  } else {
    drawSignatures(
      doc,
      pg,
      secretaryLabel,
      directorLabel,
      `Lugar y fecha: El Alto, ${formatDate(String(new Date()))}.`,
    );
  }
}