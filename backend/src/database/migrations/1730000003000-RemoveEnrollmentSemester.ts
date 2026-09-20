import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveEnrollmentSemester1730000003000 implements MigrationInterface {
  name = 'RemoveEnrollmentSemester1730000003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "enrollments" DROP COLUMN IF EXISTS "semester"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "enrollments" ADD COLUMN "semester" integer NOT NULL DEFAULT 1`);
  }
}
