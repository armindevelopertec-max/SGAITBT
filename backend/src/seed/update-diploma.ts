import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: '../../.env', override: true });

async function updateDiplomaNumbers() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5433'),
    username: process.env.DB_USER || 'sga_admin',
    password: process.env.DB_PASSWORD || 'sga_secret_2026',
    database: process.env.DB_NAME || 'sga_itbt',
    logging: true,
  });

  await dataSource.initialize();
  console.log('✅ Conexión a base de datos establecida');

  const result = await dataSource.query(`
    UPDATE students 
    SET diploma_number = 'DIPL-' || ci 
    WHERE diploma_number IS NULL 
    RETURNING id, student_code, ci, diploma_number as "diplomaNumber"
  `);

  console.log(`📊 Estudiantes actualizados: ${result.length}`);
  for (const row of result) {
    console.log(`   ✅ ${row.student_code} - CI:${row.ci} → ${row.diplomaNumber}`);
  }

  const verify = await dataSource.query(`SELECT student_code, ci, diploma_number FROM students WHERE diploma_number IS NOT NULL LIMIT 5`);
  console.log('\n📋 Verificación (primeros 5):');
  for (const v of verify) {
    console.log(`   ${v.student_code} - CI:${v.ci} → ${v.diploma_number}`);
  }

  console.log(`\n✅ Total actualizados: ${result.length}`);
  await dataSource.destroy();
}

updateDiplomaNumbers().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
