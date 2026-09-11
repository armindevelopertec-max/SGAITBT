import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: '../.env', override: true });

interface PlanSubject {
  code: string;
  name: string;
  semester: number;
  weeklyHours: number;
  prerequisites?: string[];
}

interface PlanCareer {
  name: string;
  code: string;
  area: string;
  description: string;
  title: string;
  studyPlan: {
    loadHours: number;
    weeklyHours: number;
    monthlyHours: number;
    semesterHours: number;
    area: string;
  };
  subjects: PlanSubject[];
}

const WEEKS_PER_SEMESTER = 20;

const PERIODS_TEMPLATE = [
  { year: '2025', sequence: 1, periodName: 'I/2025', startDate: '2025-02-03', endDate: '2025-07-04', status: 'CLOSED' },
  { year: '2025', sequence: 2, periodName: 'II/2025', startDate: '2025-08-04', endDate: '2025-12-19', status: 'CLOSED' },
  { year: '2026', sequence: 1, periodName: 'I/2026', startDate: '2026-02-02', endDate: '2026-07-03', status: 'OPEN' },
  { year: '2026', sequence: 2, periodName: 'II/2026', startDate: '2026-08-03', endDate: '2026-12-18', status: 'OPEN' },
];

const CAREERS: PlanCareer[] = [
  {
    name: 'Autotrónica',
    code: 'AUT',
    area: 'Electrónica y Electricidad',
    description:
      'Forma profesionales especializados en el diagnóstico, mantenimiento y reparación de sistemas mecánicos, eléctricos y electrónicos de vehículos automotores.',
    title: 'Técnico Superior en Autotrónica',
    studyPlan: { loadHours: 3600, weeklyHours: 30, monthlyHours: 120, semesterHours: 600, area: 'Electrónica y Electricidad' },
    subjects: [
      { code: 'SOM-100', name: 'Seguridad Ocupacional y Medio Ambiente', semester: 1, weeklyHours: 4 },
      { code: 'MAA-100', name: 'Matemática Aplicada', semester: 1, weeklyHours: 4 },
      { code: 'EMC-100', name: 'Electricidad del Motor y Carrocería I', semester: 1, weeklyHours: 4 },
      { code: 'MEA-100', name: 'Metrología Automotriz', semester: 1, weeklyHours: 6 },
      { code: 'MGD-100', name: 'Motores a Gasolina y Diésel I', semester: 1, weeklyHours: 6 },
      { code: 'TRA-100', name: 'Transmisiones', semester: 1, weeklyHours: 6 },
      { code: 'INT-200', name: 'Inglés Técnico', semester: 2, weeklyHours: 4 },
      { code: 'FIS-200', name: 'Física Aplicada', semester: 2, weeklyHours: 4, prerequisites: ['MAA-100'] },
      { code: 'EMC-200', name: 'Electricidad del Motor y Carrocería II', semester: 2, weeklyHours: 4, prerequisites: ['EMC-100'] },
      { code: 'CIF-200', name: 'Circuitos de Fluidos', semester: 2, weeklyHours: 6 },
      { code: 'MGD-200', name: 'Motores a Gasolina y Diésel II', semester: 2, weeklyHours: 6, prerequisites: ['MGD-100'] },
      { code: 'DIT-200', name: 'Dibujo Técnico', semester: 2, weeklyHours: 2 },
      { code: 'SIA-200', name: 'Sistema de Iluminación Automotriz', semester: 2, weeklyHours: 4 },
      { code: 'SIM-300', name: 'Sistema del Motor', semester: 3, weeklyHours: 6, prerequisites: ['MGD-200'] },
      { code: 'VHE-300', name: 'Vehículos Híbridos y Eléctricos', semester: 3, weeklyHours: 6 },
      { code: 'PRO-300', name: 'Programación', semester: 3, weeklyHours: 4 },
      { code: 'CAC-300', name: 'Circuitos de Arranque y Carga', semester: 3, weeklyHours: 6, prerequisites: ['SIA-200'] },
      { code: 'IGA-300', name: 'Inyección a Gasolina', semester: 3, weeklyHours: 4, prerequisites: ['MGD-200'] },
      { code: 'AUT-300', name: 'Autotrónica I', semester: 3, weeklyHours: 4 },
      { code: 'EDA-400', name: 'Electrónica Digital del Automóvil', semester: 4, weeklyHours: 6 },
      { code: 'MAN-400', name: 'Mantenimiento del Automóvil', semester: 4, weeklyHours: 4 },
      { code: 'EAA-400', name: 'Electrónica Analógica del Automóvil', semester: 4, weeklyHours: 6 },
      { code: 'MIC-400', name: 'Microcontroladores', semester: 4, weeklyHours: 6, prerequisites: ['PRO-300'] },
      { code: 'RMD-400', name: 'Reparación de Motores a Diésel', semester: 4, weeklyHours: 4 },
      { code: 'AUT-400', name: 'Autotrónica II', semester: 4, weeklyHours: 4, prerequisites: ['AUT-300'] },
      { code: 'IEG-500', name: 'Inyección Electrónica a Gasolina', semester: 5, weeklyHours: 4 },
      { code: 'ATM-500', name: 'Automatización', semester: 5, weeklyHours: 4 },
      { code: 'RMP-500', name: 'Redes Multiplexadas y Protocolos', semester: 5, weeklyHours: 6, prerequisites: ['MIC-400'] },
      { code: 'RSA-500', name: 'Reparación de Caja Automática', semester: 5, weeklyHours: 4, prerequisites: ['MAN-400'] },
      { code: 'LAU-500', name: 'Laboratorio Autotrónica I', semester: 5, weeklyHours: 4, prerequisites: ['AUT-400'] },
      { code: 'EMP-500', name: 'Emprendimiento Productivo', semester: 5, weeklyHours: 4 },
      { code: 'TMG-500', name: 'Taller de Modalidad de Graduación I', semester: 5, weeklyHours: 4 },
      { code: 'PMI-600', name: 'Potenciamiento del Motor a Inyección Electrónica', semester: 6, weeklyHours: 4 },
      { code: 'SCO-600', name: 'Seguridad y Confort', semester: 6, weeklyHours: 6 },
      { code: 'IED-600', name: 'Inyección Electrónica a Diésel', semester: 6, weeklyHours: 6 },
      { code: 'SHI-600', name: 'Sistemas Híbridos', semester: 6, weeklyHours: 4 },
      { code: 'LAU-600', name: 'Laboratorio Autotrónica II', semester: 6, weeklyHours: 4, prerequisites: ['LAU-500'] },
      { code: 'ENE-600', name: 'Electroneumática', semester: 6, weeklyHours: 2 },
      { code: 'TMG-600', name: 'Taller de Modalidad de Graduación II', semester: 6, weeklyHours: 4, prerequisites: ['TMG-500'] },
    ],
  },
  {
    name: 'Mecánica Automotriz',
    code: 'MEC',
    area: 'Mecánica',
    description:
      'Forma profesionales especializados en el mantenimiento, diagnóstico y reparación de sistemas mecánicos y automotrices de vehículos.',
    title: 'Técnico Superior en Mecánica Automotriz',
    studyPlan: { loadHours: 3600, weeklyHours: 30, monthlyHours: 120, semesterHours: 600, area: 'Mecánica' },
    subjects: [
      { code: 'SOM-100', name: 'Seguridad Ocupacional y Medio Ambiente', semester: 1, weeklyHours: 4 },
      { code: 'MOG-100', name: 'Motores a Gasolina I', semester: 1, weeklyHours: 6 },
      { code: 'ELA-100', name: 'Electricidad Automotriz I', semester: 1, weeklyHours: 6 },
      { code: 'MAA-100', name: 'Matemática Automotriz', semester: 1, weeklyHours: 4 },
      { code: 'MEA-100', name: 'Metrología Automotriz', semester: 1, weeklyHours: 4 },
      { code: 'DTA-100', name: 'Dibujo Técnico Automotriz I', semester: 1, weeklyHours: 2 },
      { code: 'QUA-100', name: 'Química Automotriz', semester: 1, weeklyHours: 4 },
      { code: 'INT-200', name: 'Inglés Técnico', semester: 2, weeklyHours: 4 },
      { code: 'MOG-200', name: 'Motores a Gasolina II', semester: 2, weeklyHours: 6, prerequisites: ['MOG-100'] },
      { code: 'ELA-200', name: 'Electricidad Automotriz II', semester: 2, weeklyHours: 6, prerequisites: ['ELA-100'] },
      { code: 'CHS-200', name: 'Chapería y Soldadura', semester: 2, weeklyHours: 6 },
      { code: 'FIS-200', name: 'Física Automotriz', semester: 2, weeklyHours: 4 },
      { code: 'DTA-200', name: 'Dibujo Técnico Automotriz II', semester: 2, weeklyHours: 4, prerequisites: ['DTA-100'] },
      { code: 'MOG-300', name: 'Motores a Gasolina III', semester: 3, weeklyHours: 6, prerequisites: ['MOG-200'] },
      { code: 'ELA-300', name: 'Electricidad Automotriz III', semester: 3, weeklyHours: 4, prerequisites: ['ELA-200'] },
      { code: 'MOD-300', name: 'Motores Diésel I', semester: 3, weeklyHours: 4 },
      { code: 'ETA-300', name: 'Electrónica Automotriz I', semester: 3, weeklyHours: 6 },
      { code: 'TER-300', name: 'Termodinámica', semester: 3, weeklyHours: 2 },
      { code: 'TRA-300', name: 'Transmisiones I', semester: 3, weeklyHours: 8 },
      { code: 'MOG-400', name: 'Motores a Gasolina IV', semester: 4, weeklyHours: 6, prerequisites: ['MOG-300'] },
      { code: 'IAG-400', name: 'Inyección a Gasolina I', semester: 4, weeklyHours: 6 },
      { code: 'MOD-400', name: 'Motores Diésel II', semester: 4, weeklyHours: 4, prerequisites: ['MOD-300'] },
      { code: 'ETA-400', name: 'Electrónica Automotriz II', semester: 4, weeklyHours: 6, prerequisites: ['ETA-300'] },
      { code: 'TRA-400', name: 'Transmisiones II', semester: 4, weeklyHours: 4, prerequisites: ['TRA-300'] },
      { code: 'EMP-400', name: 'Emprendimiento Productivo', semester: 4, weeklyHours: 4 },
      { code: 'IED-500', name: 'Inyección Electrónica Diésel I', semester: 5, weeklyHours: 4 },
      { code: 'IAG-500', name: 'Inyección a Gasolina II', semester: 5, weeklyHours: 6, prerequisites: ['IAG-400'] },
      { code: 'LAD-500', name: 'Laboratorio Diésel I', semester: 5, weeklyHours: 4 },
      { code: 'ETA-500', name: 'Electrónica Automotriz III', semester: 5, weeklyHours: 6, prerequisites: ['ETA-400'] },
      { code: 'NEU-500', name: 'Neumática', semester: 5, weeklyHours: 2 },
      { code: 'TRA-500', name: 'Transmisiones III', semester: 5, weeklyHours: 4, prerequisites: ['TRA-400'] },
      { code: 'TMG-500', name: 'Taller de Modalidad de Graduación I', semester: 5, weeklyHours: 4 },
      { code: 'IED-600', name: 'Inyección Electrónica Diésel II', semester: 6, weeklyHours: 4, prerequisites: ['IED-500'] },
      { code: 'DAU-600', name: 'Diagnóstico del Automóvil', semester: 6, weeklyHours: 4, prerequisites: ['IAG-500'] },
      { code: 'LAD-600', name: 'Laboratorio Diésel II', semester: 6, weeklyHours: 4, prerequisites: ['LAD-500'] },
      { code: 'HID-600', name: 'Hidráulica', semester: 6, weeklyHours: 2 },
      { code: 'MAP-600', name: 'Maquinaria Agrícola y Pesada', semester: 6, weeklyHours: 4 },
      { code: 'IAG-600', name: 'Inyección a Gasolina III', semester: 6, weeklyHours: 4, prerequisites: ['IAG-500'] },
      { code: 'TRA-600', name: 'Transmisiones IV', semester: 6, weeklyHours: 4, prerequisites: ['TRA-500'] },
      { code: 'TMG-600', name: 'Taller de Modalidad de Graduación II', semester: 6, weeklyHours: 4, prerequisites: ['TMG-500'] },
    ],
  },
];

interface DemoEntry {
  year: string;
  seq: number;
  level: number;
}

interface DemoStudent {
  firstName: string;
  paternalSurname: string;
  maternalSurname: string;
  ci: string;
  ciExtension: string;
  sex: 'MALE' | 'FEMALE';
  birthYear: number;
  phone: string;
  email: string;
  address: string;
  entry: DemoEntry;
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STUDENTS_BY_CAREER: Record<'AUT' | 'MEC', DemoStudent[]> = {
  AUT: [
    { firstName: 'Juan', paternalSurname: 'Chura', maternalSurname: 'Aguilar', ci: '15938731', ciExtension: 'LP', sex: 'MALE', birthYear: 2003, phone: '76835582', email: 'juan.chura@itbt.edu.bo', address: 'El Alto, Z. Ferropetrol', entry: { year: '2025', seq: 1, level: 1 } },
    { firstName: 'María', paternalSurname: 'Ticona', maternalSurname: 'Quispe', ci: '9876543', ciExtension: 'LP', sex: 'FEMALE', birthYear: 2004, phone: '71569847', email: 'maria.ticona@itbt.edu.bo', address: 'El Alto, Z. 16 de Julio', entry: { year: '2025', seq: 2, level: 1 } },
    { firstName: 'Carlos', paternalSurname: 'Mamani', maternalSurname: 'Flores', ci: '8765432', ciExtension: 'CB', sex: 'MALE', birthYear: 2005, phone: '70336618', email: 'carlos.mamani@itbt.edu.bo', address: 'Cochabamba, Z. Norte', entry: { year: '2026', seq: 1, level: 1 } },
    { firstName: 'Andrea', paternalSurname: 'Callisaya', maternalSurname: 'Choque', ci: '7654321', ciExtension: 'SC', sex: 'FEMALE', birthYear: 2005, phone: '79004512', email: 'andrea.callisaya@itbt.edu.bo', address: 'Santa Cruz, Centro', entry: { year: '2026', seq: 1, level: 1 } },
    { firstName: 'Luis', paternalSurname: 'Machaca', maternalSurname: 'Rodríguez', ci: '6543210', ciExtension: 'LP', sex: 'MALE', birthYear: 2004, phone: '76223344', email: 'luis.machaca@itbt.edu.bo', address: 'El Alto, Z. Ciudad Satélite', entry: { year: '2025', seq: 2, level: 1 } },
    { firstName: 'Gabriela', paternalSurname: 'Vino', maternalSurname: 'Nina', ci: '12345678', ciExtension: 'LP', sex: 'FEMALE', birthYear: 2006, phone: '71223335', email: 'gabriela.vino@itbt.edu.bo', address: 'El Alto, Z. Senkata', entry: { year: '2026', seq: 1, level: 1 } },
  ],
  MEC: [
    { firstName: 'Pedro', paternalSurname: 'Ramos', maternalSurname: 'Condori', ci: '5432109', ciExtension: 'CB', sex: 'MALE', birthYear: 2002, phone: '77112233', email: 'pedro.ramos@itbt.edu.bo', address: 'Cochabamba, Quillacollo', entry: { year: '2025', seq: 1, level: 1 } },
    { firstName: 'Rosa', paternalSurname: 'Apaza', maternalSurname: 'Limachi', ci: '4321098', ciExtension: 'SC', sex: 'FEMALE', birthYear: 2003, phone: '77998811', email: 'rosa.apaza@itbt.edu.bo', address: 'Santa Cruz, Plan 3000', entry: { year: '2025', seq: 1, level: 1 } },
    { firstName: 'Marco', paternalSurname: 'Nina', maternalSurname: 'Zárate', ci: '3210987', ciExtension: 'LP', sex: 'MALE', birthYear: 2004, phone: '74555678', email: 'marco.nina@itbt.edu.bo', address: 'El Alto, Z. Villa Adela', entry: { year: '2025', seq: 2, level: 1 } },
    { firstName: 'Lucía', paternalSurname: 'García', maternalSurname: 'Soto', ci: '2109876', ciExtension: 'PT', sex: 'FEMALE', birthYear: 2005, phone: '79334456', email: 'lucia.garcia@itbt.edu.bo', address: 'Potosí, Centro', entry: { year: '2026', seq: 1, level: 1 } },
    { firstName: 'Daniel', paternalSurname: 'Paredes', maternalSurname: 'Mamani', ci: '1098765', ciExtension: 'LP', sex: 'MALE', birthYear: 2005, phone: '73556677', email: 'daniel.paredes@itbt.edu.bo', address: 'El Alto, Z. Los Andes', entry: { year: '2026', seq: 1, level: 1 } },
    { firstName: 'Carmen', paternalSurname: 'Huanca', maternalSurname: 'Vargas', ci: '19876543', ciExtension: 'LP', sex: 'FEMALE', birthYear: 2004, phone: '71889900', email: 'carmen.huanca@itbt.edu.bo', address: 'El Alto, Z. Villa Tunari', entry: { year: '2025', seq: 2, level: 1 } },
  ],
};

const TEACHERS: Array<{ username: string; fullName: string; email: string }> = [
  { username: 'jquispe', fullName: 'Prof. Juan Quispe Condori', email: 'jquispe@itbt.edu.bo' },
  { username: 'mchoque', fullName: 'Prof. María Choque Mamani', email: 'mchoque@itbt.edu.bo' },
  { username: 'carana', fullName: 'Prof. Carlos Arana Lara', email: 'carana@itbt.edu.bo' },
  { username: 'lflores', fullName: 'Prof. Lucía Flores Nina', email: 'lflores@itbt.edu.bo' },
];

async function seedDemoData(dataSource: DataSource, passHash: string) {
  const userRepo = dataSource.getRepository('User');
  const careerRepo = dataSource.getRepository('Career');
  const subjectRepo = dataSource.getRepository('Subject');
  const periodRepo = dataSource.getRepository('AcademicPeriod');
  const studentRepo = dataSource.getRepository('Student');
  const enrollmentRepo = dataSource.getRepository('Enrollment');
  const depositRepo = dataSource.getRepository('Deposit');
  const assignmentRepo = dataSource.getRepository('SubjectAssignment');
  const subjectEnrollmentRepo = dataSource.getRepository('SubjectEnrollment');
  const gradeRepo = dataSource.getRepository('Grade');
  const historyRepo = dataSource.getRepository('AcademicHistory');
  const attendanceRepo = dataSource.getRepository('Attendance');

  const ensureUser = async (data: {
    username: string;
    email: string;
    fullName: string;
    role: string;
    studentId?: string;
  }) => {
    const existing = await userRepo.findOne({ where: { username: data.username } });
    if (existing) return existing;
    return userRepo.save({
      username: data.username,
      email: data.email,
      fullName: data.fullName,
      passwordHash: passHash,
      role: data.role,
      status: 'ACTIVE',
      mustChangePassword: false,
      studentId: data.studentId,
    });
  };

  const secretary = await ensureUser({
    username: 'secretaria',
    email: 'secretaria@itbt.edu.bo',
    fullName: 'Secretaría Académica',
    role: 'SECRETARY',
  });
  console.log('✅ Usuario secretaría: secretaria / demo2026');

  const teacherUsers: Array<Record<string, unknown>> = [];
  for (const t of TEACHERS) {
    const u = await ensureUser({ username: t.username, email: t.email, fullName: t.fullName, role: 'TEACHER' });
    teacherUsers.push(u);
    console.log(`✅ Docente ${t.username} / demo2026`);
  }

  const careerRepos: Record<'AUT' | 'MEC', any> = {} as any;
  for (const [code, students] of Object.entries(STUDENTS_BY_CAREER)) {
    const career = await careerRepo.findOne({ where: { code } });
    if (!career) continue;

    const periods = await periodRepo.find({
      where: { careerId: career.id },
      order: { year: 'ASC', sequence: 'ASC' },
    });
    const periodByKey = new Map(periods.map((p) => [`${p.year}|${p.sequence}`, p]));
    const byYearSeq = (year: string, seq: number) => periodByKey.get(`${year}|${seq}`);

    const openPeriod = byYearSeq('2026', 1);
    const subjects = await subjectRepo.find({ where: { careerId: career.id } });

    careerRepos[code as 'AUT' | 'MEC'] = {
      career,
      students,
      periods,
      openPeriod,
      subjects,
    };
  }

  let studentCounter = await studentRepo
    .createQueryBuilder('student')
    .select('MAX(student.studentCode)::text', 'max')
    .getRawOne()
    .then((r) => {
      if (!r?.max) return 0;
      const m = r.max.match(/EST-\d+-(\d+)/);
      return m ? parseInt(m[1], 10) : 0;
    });

  let depCounter: Record<string, number> = {};
  const depositCounters = async (year: string) => {
    if (!(year in depCounter)) {
      const r = await depositRepo
        .createQueryBuilder('deposit')
        .select('MAX(deposit.depositNumber)::text', 'max')
        .where('deposit.depositNumber LIKE :prefix', { prefix: `DEP-${year}-%` })
        .getRawOne();
      depCounter[year] = r?.max ? parseInt(r.max.replace(`DEP-${year}-`, ''), 10) + 1 : 1;
    }
    const n = depCounter[year];
    depCounter[year] += 1;
    return n;
  };

  let enrolledCounter: Record<string, number> = {};
  const nextEnrollmentNumber = async (year: string) => {
    if (!(year in enrolledCounter)) {
      const r = await enrollmentRepo
        .createQueryBuilder('enrollment')
        .select('MAX(enrollment.enrollmentNumber)::text', 'max')
        .where('enrollment.enrollmentNumber LIKE :prefix', { prefix: `MAT-${year}-%` })
        .getRawOne();
      enrolledCounter[year] = r?.max ? parseInt(r.max.replace(`MAT-${year}-`, ''), 10) + 1 : 1;
    }
    const n = enrolledCounter[year];
    enrolledCounter[year] += 1;
    return n;
  };

  for (const [code, repo] of Object.entries(careerRepos) as Array<[string, any]>) {
    const { career, students, periods, openPeriod, subjects } = repo;
    const studentList = students as DemoStudent[];

    for (const demo of studentList) {
      const currentLevel = demo.entry.level + (2026 - Number(demo.entry.year)) * 2 + (1 - demo.entry.seq);

      const existingStudent = await studentRepo.findOne({ where: { ci: demo.ci } });
      if (existingStudent) {
        await studentRepo.update(existingStudent.id, {
          status: 'ACTIVE',
          currentLevel,
          currentPeriodId: openPeriod.id,
        });
        continue;
      }

      studentCounter += 1;
      const studentCode = `EST-2026-${String(studentCounter).padStart(4, '0')}`;
      const birthDate = `${demo.birthYear}-${String((hashStr(demo.ci) % 12) + 1).padStart(2, '0')}-${String((hashStr(demo.email) % 27) + 1).padStart(2, '0')}`;

      const student = await studentRepo.save({
        firstName: demo.firstName,
        paternalSurname: demo.paternalSurname,
        maternalSurname: demo.maternalSurname,
        lastName: `${demo.paternalSurname} ${demo.maternalSurname}`,
        ci: demo.ci,
        ciExtension: demo.ciExtension,
        birthDate,
        sex: demo.sex,
        phone: demo.phone,
        address: demo.address,
        email: demo.email,
        studentCode,
        status: 'ACTIVE',
        currentLevel,
        careerId: career.id,
        currentPeriodId: openPeriod.id,
      });

      for (const period of periods) {
        const periodY = Number(period.year);
        const entryY = Number(demo.entry.year);
        const isAfterEntry = periodY > entryY || (periodY === entryY && period.sequence >= demo.entry.seq);
        const isBeforeOrCurrent = periodY < 2026 || (periodY === 2026 && period.sequence <= 1);
        if (!isAfterEntry || !isBeforeOrCurrent) continue;

        const elapsed = (periodY - entryY) * 2 + (period.sequence - demo.entry.seq);
        const level = demo.entry.level + elapsed;

        const depositNumber = `DEP-${period.year}-${String(await depositCounters(period.year)).padStart(4, '0')}`;
        const existingDep = await depositRepo.findOne({ where: { depositNumber } });
        if (!existingDep) {
          await depositRepo.save({
            depositNumber,
            depositDate: period.startDate,
            amount: 850,
            concept: `Matrícula ${period.periodName}`,
            status: 'APPROVED',
            verificationComment: 'Verificado por Secretaría Académica',
            verificationDate: period.startDate,
            verifiedBy: secretary.fullName,
            studentId: student.id,
          });
        }

        const enrollmentNumber = `MAT-${period.year}-${String(await nextEnrollmentNumber(period.year)).padStart(5, '0')}`;
        const existingEnr = await enrollmentRepo.findOne({
          where: { studentId: student.id, academicPeriodId: period.id },
        });
        if (!existingEnr) {
          await enrollmentRepo.save({
            enrollmentNumber,
            enrollmentDate: period.startDate,
            status: 'ACTIVE',
            semester: level,
            totalAmount: 850,
            observations: 'Matrícula generada por seed',
            studentId: student.id,
            careerId: career.id,
            academicPeriodId: period.id,
          });
        }

        const semesterSubjects: any[] = (subjects as any[]).filter((s: any) => s.semester === level);
        for (const subject of semesterSubjects) {
          let assignment = await assignmentRepo.findOne({
            where: { subjectId: subject.id, academicPeriodId: period.id, parallel: 'A' },
          });

          if (!assignment) {
            assignment = await assignmentRepo.save({
              parallel: 'A',
              classroom: 'Lab. ' + ['A', 'B', 'C'][hashStr(subject.code + period.year) % 3],
              schedule: { day: 'LUN', start: '18:00', end: '21:00' },
              subjectId: subject.id,
              teacherId: teacherUsers[hashStr(subject.code) % teacherUsers.length].id,
              academicPeriodId: period.id,
              semester: subject.semester,
            });
          }

          const existingSe = await subjectEnrollmentRepo.findOne({
            where: { studentId: student.id, assignmentId: assignment.id },
          });
          if (!existingSe) {
            await subjectEnrollmentRepo.save({ studentId: student.id, assignmentId: assignment.id });
          }

          const existingGrade = await gradeRepo.findOne({
            where: { studentId: student.id, assignmentId: assignment.id },
          });
          if (!existingGrade) {
            const rng = mulberry32(hashStr(`${student.studentCode}|${subject.code}|${period.year}`));
            const likelyFail = rng() < 0.12;
            const comp = () => Math.round((likelyFail ? 20 + rng() * 30 : 40 + rng() * 58) * 100) / 100;
            const firstPartial = comp();
            const secondPartial = comp();
            const practices = comp();
            const finalExam = comp();
            const finalGrade = Math.round((firstPartial * 0.25 + secondPartial * 0.25 + practices * 0.2 + finalExam * 0.3) * 100) / 100;
            const status = finalGrade >= 51 ? 'APPROVED' : 'FAILED';
            await gradeRepo.save({
              studentId: student.id,
              assignmentId: assignment.id,
              firstPartial,
              secondPartial,
              practices,
              finalExam,
              finalGrade,
              status,
            });
          }

          const existingHist = await historyRepo.findOne({
            where: { studentId: student.id, subjectId: subject.id, academicPeriodId: period.id },
          });
          if (!existingHist) {
            const gradeForHist = await gradeRepo.findOne({
              where: { studentId: student.id, assignmentId: assignment.id },
            });
            await historyRepo.save({
              studentId: student.id,
              careerId: career.id,
              academicPeriodId: period.id,
              subjectId: subject.id,
              semester: subject.semester,
              finalGrade: gradeForHist?.finalGrade ?? null,
              status: gradeForHist?.status ?? 'PENDING',
              isReevaluation: false,
            });
          }
        }
      }

      console.log(
        `✅ Estudiante creado: ${studentCode} — ${demo.firstName} ${demo.paternalSurname} ${demo.maternalSurname} | Nivel ${currentLevel}`,
      );
    }
  }

  const studentUsers = [1, 3, 7, 9];
  console.log('  Usuarios de estudiantes (demo): <carnet> / demo2026');
  for (const [code, repo] of Object.entries(careerRepos) as Array<[string, any]>) {
    const students = await studentRepo.find({
      where: { careerId: repo.career.id },
      take: 8,
      order: { createdAt: 'ASC' },
    });
    for (const [idx, s] of students.entries()) {
      if (!studentUsers.includes(idx)) continue;
      await ensureUser({
        username: s.ci,
        email: s.email,
        fullName: `${s.firstName} ${s.lastName}`,
        role: 'STUDENT',
        studentId: s.id,
      });
      console.log(`✅ Usuario estudiante: ${s.ci} / demo2026 (${s.studentCode})`);
    }
  }

  const attendanceDates = [10, 24];
  for (const [code, repo] of Object.entries(careerRepos) as Array<[string, any]>) {
    for (const s of await studentRepo.find({ where: { careerId: repo.career.id } })) {
      const seEnrollments = await subjectEnrollmentRepo.find({
        where: { studentId: s.id },
        relations: ['assignment'],
      });
      const current = seEnrollments.filter((se) => se.assignment?.academicPeriodId === repo.openPeriod.id);
      const baseDate = repo.openPeriod.startDate;
      for (const dateOffset of attendanceDates) {
        const rng = mulberry32(hashStr(`${s.studentCode}-att-${dateOffset}`));
        for (const se of current) {
          const date = new Date(baseDate);
          date.setDate(date.getDate() + dateOffset);
          const existingAtt = await attendanceRepo.findOne({
            where: { studentId: s.id, assignmentId: se.assignmentId, attendanceDate: date },
          });
          if (existingAtt) continue;
          const roll = rng();
          const status = roll < 0.8 ? 'PRESENT' : roll < 0.9 ? 'ABSENT' : 'LATE';
          await attendanceRepo.save({
            studentId: s.id,
            assignmentId: se.assignmentId,
            attendanceDate: date,
            status,
            observations: status === 'PRESENT' ? undefined : 'Registrado por seed',
          });
        }
      }
    }
  }
  console.log('✅ Asistencias generadas para la gestión vigente');

  console.log('\n🔑 Credenciales (demo):');
  console.log('  Secretaría:  secretaria / demo2026');
  console.log('  Docentes:    jquispe, mchoque, carana, lflores / demo2026');
  console.log('  Estudiantes: <carnet del estudiante> / demo2026');
}

export async function runSeed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'sga_admin',
    password: process.env.DB_PASSWORD || 'sga_secret_2026',
    database: process.env.DB_NAME || 'sga_itbt',
    entities: [__dirname + '/../modules/**/entities/*.entity.{ts,js}'],
    synchronize: true,
  });

  await dataSource.initialize();
  console.log('➡️  Conectado a la base de datos');

  const institutionRepo = dataSource.getRepository('Institution');
  const careerRepo = dataSource.getRepository('Career');
  const periodRepo = dataSource.getRepository('AcademicPeriod');
  const userRepo = dataSource.getRepository('User');
  const subjectRepo = dataSource.getRepository('Subject');

  const existingInstitution = await institutionRepo.findOne({
    where: { slug: 'itbt' },
  });
  let institution = existingInstitution;
  if (!institution) {
    institution = await institutionRepo.save({
      name: 'Instituto Tecnológico "Boliviana de Tecnología"',
      slug: 'itbt',
      code: 'ITBT-2026',
      description: 'Institución de formación tecnológica superior',
      address: 'El Alto, Av. de los Héroes, Z. Ferropetrol N.º 11',
      phone: '75252479',
      email: 'info@itbt.edu.bo',
      rectorName: 'Lic. Juan Pérez Rector',
      academicRegulation: 'R.M. 1049/2023',
    });
    console.log('✅ Institución creada');
  } else {
    await institutionRepo.update(institution.id, {
      address: 'El Alto, Av. de los Héroes, Z. Ferropetrol N.º 11',
      phone: '75252479',
      academicRegulation: 'R.M. 1049/2023',
    });
    console.log('⏭️  Institución ya existía (datos de contacto actualizados)');
  }

  const adminExists = await userRepo.findOne({ where: { username: 'admin' } });
  if (!adminExists) {
    const passwordHash = await bcrypt.hash('admin2026', 10);
    await userRepo.save({
      username: 'admin',
      email: 'admin@itbt.edu.bo',
      fullName: 'Administrador del Sistema',
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      mustChangePassword: true,
    });
    console.log('✅ Usuario admin creado (admin / admin2026)');
  } else {
    console.log('⏭️  Usuario admin ya existía');
  }

  for (const careerData of CAREERS) {
    const existingCareer = await careerRepo.findOne({
      where: { code: careerData.code },
    });

    let career = existingCareer;
    if (!career) {
      career = await careerRepo.save({
        name: careerData.name,
        code: careerData.code,
        description: careerData.description,
        durationYears: 3,
        numberOfLevels: 6,
        state: 'ACTIVE',
        studyPlan: {
          ...careerData.studyPlan,
          title: careerData.title,
          regime: 'Semestral',
        },
        institution,
      });
      console.log(`✅ Carrera creada: ${careerData.name}`);
    } else {
      console.log(`⏭️  Carrera ${careerData.code} ya existía`);
    }

    if (career) {
      for (const template of PERIODS_TEMPLATE) {
        const existingPeriod = await periodRepo.findOne({
          where: { year: template.year, sequence: template.sequence, careerId: career.id },
        });
        if (!existingPeriod) {
          await periodRepo.save({
            year: template.year,
            periodName: template.periodName,
            sequence: template.sequence,
            startDate: template.startDate,
            endDate: template.endDate,
            status: template.status,
            careerId: career.id,
          });
          console.log(`✅ Gestión ${template.periodName} creada para ${careerData.name}`);
        } else {
          await periodRepo.update(existingPeriod.id, {
            periodName: template.periodName,
            startDate: template.startDate,
            endDate: template.endDate,
            status: template.status,
          });
        }
      }

      for (const subjectData of careerData.subjects) {
        const existingSubject = await subjectRepo.findOne({
          where: { code: subjectData.code, careerId: career.id },
        });
        if (existingSubject) {
          continue;
        }
        await subjectRepo.save({
          code: subjectData.code,
          name: subjectData.name,
          semester: subjectData.semester,
          weeklyHours: subjectData.weeklyHours,
          totalHours: subjectData.weeklyHours * WEEKS_PER_SEMESTER,
          prerequisites: subjectData.prerequisites || null,
          isElective: false,
          careerId: career.id,
        });
      }
      console.log(`✅ Materias cargadas para ${careerData.name}: ${careerData.subjects.length}`);
    }
  }

  const demoPassHash = await bcrypt.hash('demo2026', 10);
  await seedDemoData(dataSource, demoPassHash);

  await dataSource.destroy();
  console.log('✅ Seed completado');
  console.log('\n🔑 Credenciales:');
  console.log('  Admin:       admin / admin2026');
  console.log('  Secretaría:  secretaria / demo2026');
  console.log('  Docentes:    jquispe, mchoque, carana, lflores / demo2026');
  console.log('  Estudiantes: <carnet del estudiante> / demo2026');
}

if (require.main === module) {
  runSeed()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Error en el seed:', error);
      process.exit(1);
    });
}