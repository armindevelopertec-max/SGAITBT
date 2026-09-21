import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeStudentFieldsNotNull1730000007000 implements MigrationInterface {
  name = 'MakeStudentFieldsNotNull1730000007000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "students"
      ALTER COLUMN "person_id" SET NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "students"
      ALTER COLUMN "career_id" SET NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "students"
      ALTER COLUMN "person_id" DROP NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "students"
      ALTER COLUMN "career_id" DROP NOT NULL
    `);
  }
}
