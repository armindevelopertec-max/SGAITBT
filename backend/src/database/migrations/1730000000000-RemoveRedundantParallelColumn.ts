import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveRedundantParallelColumn1730000000000 implements MigrationInterface {
  name = 'RemoveRedundantParallelColumn1730000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "subject_assignments" DROP COLUMN IF EXISTS "parallel"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "subject_assignments" ADD COLUMN "parallel" character varying(20) NOT NULL DEFAULT 'A'`);
  }
}
