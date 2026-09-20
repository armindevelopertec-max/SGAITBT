import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveUserFullNameColumn1730000002000 implements MigrationInterface {
  name = 'RemoveUserFullNameColumn1730000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "fullName"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "fullName" character varying(150) NOT NULL`);
  }
}
