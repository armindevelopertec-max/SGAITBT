import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

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
  if (!existingInstitution) {
    await institutionRepo.save({
      name: 'Instituto Tecnológico Boliviana de Tecnología',
      slug: 'itbt',
      code: 'ITBT-2026',
      description: 'Institución de formación tecnológica superior',
      address: 'Av. Boliviana de Tecnología N° 1000, La Paz - Bolivia',
      phone: '+591 2 222 3344',
      email: 'info@itbt.edu.bo',
      rectorName: 'Lic. Juan Pérez Rector',
    });
    console.log('✅ Institución creada');
  } else {
    console.log('⏭️  Institución ya existía');
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

  const careers = [
    {
      name: 'Sistemas Informáticos',
      code: 'SI-2026',
      description: 'Desarrollo de software y sistemas informáticos',
      durationYears: 3,
      numberOfLevels: 6,
      state: 'ACTIVE',
    },
    {
      name: 'Administración de Empresas',
      code: 'AE-2026',
      description: 'Gestión empresarial y administración',
      durationYears: 3,
      numberOfLevels: 6,
      state: 'ACTIVE',
    },
  ];

  for (const careerData of careers) {
    const existingCareer = await careerRepo.findOne({
      where: { code: careerData.code },
    });
    if (existingCareer) {
      console.log(`⏭️  Carrera ${careerData.code} ya existía`);
      continue;
    }
    await careerRepo.save(careerData);
    console.log(`✅ Carrera creada: ${careerData.name}`);
  }

  const siCareer = await careerRepo.findOne({ where: { code: 'SI-2026' } });
  if (siCareer) {
    const existingPeriod = await periodRepo.findOne({
      where: { year: '2026', semester: 1, careerId: siCareer.id },
    });
    if (!existingPeriod) {
      await periodRepo.save({
        year: '2026',
        periodName: '1er Semestre 2026',
        semester: 1,
        startDate: '2026-02-02',
        endDate: '2026-06-27',
        status: 'OPEN',
        careerId: siCareer.id,
      });
      console.log('✅ Gestión 2026-1 creada para Sistemas Informáticos');
    }

    const subjects = [
      { code: 'SI-101', name: 'Matemática Básica', semester: 1, weeklyHours: 4, totalHours: 68 },
      { code: 'SI-102', name: 'Introducción a la Programación', semester: 1, weeklyHours: 5, totalHours: 85 },
      { code: 'SI-103', name: 'Fundamentos de Base de Datos', semester: 1, weeklyHours: 4, totalHours: 68 },
      { code: 'SI-104', name: 'Comunicación y Redacción', semester: 1, weeklyHours: 3, totalHours: 51 },
    ];

    for (const subjectData of subjects) {
      const existingSubject = await subjectRepo.findOne({
        where: { code: subjectData.code },
      });
      if (existingSubject) {
        console.log(`⏭️  Materia ${subjectData.code} ya existía`);
        continue;
      }
      await subjectRepo.save({ ...subjectData, careerId: siCareer.id });
      console.log(`✅ Materia creada: ${subjectData.name}`);
    }
  }

  await dataSource.destroy();
  console.log('✅ Seed completado');
  console.log('\n🔑 Credenciales:');
  console.log('  Admin:  admin / admin2026');
}

if (require.main === module) {
  runSeed()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Error en el seed:', error);
      process.exit(1);
    });
}