import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixPersonLastnameNullable1730000009000 implements MigrationInterface {
  name = 'FixPersonLastnameNullable1730000009000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "persons" ALTER COLUMN "last_name" DROP NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "persons" ALTER COLUMN "last_name" SET NOT NULL`);
  }
}
