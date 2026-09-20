import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveStudentCurrentPeriod1730000001000 implements MigrationInterface {
  name = 'RemoveStudentCurrentPeriod1730000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "students" DROP COLUMN IF EXISTS "current_period_id"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "students" ADD COLUMN "current_period_id" uuid`);
    await queryRunner.query(`ALTER TABLE "students" ADD CONSTRAINT "FK_2bd3ac050695dc9b808de95ca26" FOREIGN KEY ("current_period_id") REFERENCES "academic_periods"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
  }
}
