import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEnrollmentTypeAndHistoryUnique1730000004000 implements MigrationInterface {
  name = 'AddEnrollmentTypeAndHistoryUnique1730000004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "enrollments"
      ADD COLUMN IF NOT EXISTS "enrollment_type" VARCHAR(50) NOT NULL DEFAULT 'REGULAR'
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'UQ_academic_history_student_subject_period'
        ) THEN
          ALTER TABLE "academic_history"
          ADD CONSTRAINT "UQ_academic_history_student_subject_period"
          UNIQUE ("student_id", "academic_period_id", "subject_id");
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "enrollments" DROP COLUMN IF EXISTS "enrollment_type"`);
    await queryRunner.query(`ALTER TABLE "academic_history" DROP CONSTRAINT IF EXISTS "UQ_academic_history_student_subject_period"`);
  }
}
