import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHistoricalTablesAndCertificates1730000005000 implements MigrationInterface {
  name = 'AddHistoricalTablesAndCertificates1730000005000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."institutional_official_history_official_type_enum" AS ENUM(
        'RECTOR', 'VICE_RECTOR', 'SECRETARY', 'ACCOUNTANT',
        'CAREER_DIRECTOR', 'VOCATIONAL_DIRECTOR', 'ACADEMIC_DIRECTOR'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "institutional_official_history" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "is_active" boolean NOT NULL DEFAULT true,
        "created_by" character varying,
        "updated_by" character varying,
        "official_type" "public"."institutional_official_history_official_type_enum" NOT NULL,
        "person_id" uuid,
        "employee_id" uuid,
        "career_id" uuid,
        "full_name" character varying(200) NOT NULL,
        "start_date" date NOT NULL,
        "end_date" date,
        "start_gestion" character varying(4) NOT NULL,
        "end_gestion" character varying(4),
        "observations" text,
        "is_vacant" boolean NOT NULL DEFAULT false,
        CONSTRAINT "PK_institutional_official_history" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_official_type_period" ON "institutional_official_history" ("official_type", "start_date")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_official_career" ON "institutional_official_history" ("career_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_official_gestion" ON "institutional_official_history" ("start_gestion", "end_gestion")
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION check_no_overlapping_officials()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.is_vacant = false AND NEW.end_date IS NULL THEN
          IF EXISTS (
            SELECT 1 FROM institutional_official_history
            WHERE official_type = NEW.official_type
              AND career_id IS NOT DISTINCT FROM NEW.career_id
              AND is_vacant = false
              AND end_date IS NULL
              AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
          ) THEN
            RAISE EXCEPTION 'Ya existe un oficial activo de este tipo para este cargo';
          END IF;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);

    await queryRunner.query(`
      CREATE TRIGGER trg_no_overlapping_officials
      BEFORE INSERT OR UPDATE ON institutional_official_history
      FOR EACH ROW EXECUTE FUNCTION check_no_overlapping_officials()
    `);

    await queryRunner.query(`
      CREATE TABLE "employee_history" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "is_active" boolean NOT NULL DEFAULT true,
        "created_by" character varying,
        "updated_by" character varying,
        "employee_id" uuid NOT NULL,
        "career_id" uuid,
        "academic_period_id" uuid NOT NULL,
        "employee_type" "public"."employees_employee_type_enum" NOT NULL,
        "position" character varying(150),
        "subjects_taught" integer NOT NULL DEFAULT 0,
        "parallels_taught" integer NOT NULL DEFAULT 0,
        "total_hours" integer NOT NULL DEFAULT 0,
        "observations" text,
        CONSTRAINT "PK_employee_history" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_employee_history_employee" ON "employee_history" ("employee_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_employee_history_period" ON "employee_history" ("academic_period_id")
    `);

    await queryRunner.query(`
      ALTER TABLE "institutional_official_history"
      ADD CONSTRAINT "FK_official_person" FOREIGN KEY ("person_id") REFERENCES "persons"("id") ON DELETE SET NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "institutional_official_history"
      ADD CONSTRAINT "FK_official_employee" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "institutional_official_history"
      ADD CONSTRAINT "FK_official_career" FOREIGN KEY ("career_id") REFERENCES "careers"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "employee_history"
      ADD CONSTRAINT "FK_history_employee" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "employee_history"
      ADD CONSTRAINT "FK_history_career" FOREIGN KEY ("career_id") REFERENCES "careers"("id") ON DELETE SET NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "employee_history"
      ADD CONSTRAINT "FK_history_period" FOREIGN KEY ("academic_period_id") REFERENCES "academic_periods"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "enrollments"
      ADD COLUMN IF NOT EXISTS "student_status" "public"."students_academic_status_enum"
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."certificates_certificate_type_enum" AS ENUM(
        'NOTES', 'STUDIES', 'REGULAR', 'ENROLLMENT', 'HISTORY', 'DIPLOMA'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."certificates_status_enum" AS ENUM(
        'ACTIVE', 'REVOKED', 'EXPIRED'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "certificates" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "is_active" boolean NOT NULL DEFAULT true,
        "created_by" character varying,
        "updated_by" character varying,
        "certificate_type" "public"."certificates_certificate_type_enum" NOT NULL,
        "student_id" uuid NOT NULL,
        "enrollment_id" uuid,
        "verification_code" character varying(32) NOT NULL,
        "document_number" character varying(50) NOT NULL,
        "issued_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "issued_by" uuid NOT NULL,
        "valid_until" date,
        "status" "public"."certificates_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "revoked_at" TIMESTAMP WITH TIME ZONE,
        "revoked_reason" text,
        "revoked_by" uuid,
        "pdf_url" text,
        "metadata" jsonb,
        "content_hash" character varying(64),
        CONSTRAINT "PK_certificates" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_certificate_verification" ON "certificates" ("verification_code")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_certificate_student" ON "certificates" ("student_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_certificate_type_status" ON "certificates" ("certificate_type", "status")
    `);

    await queryRunner.query(`
      ALTER TABLE "certificates"
      ADD CONSTRAINT "FK_certificate_student" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "certificates"
      ADD CONSTRAINT "FK_certificate_enrollment" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE SET NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "certificates"
      ADD CONSTRAINT "FK_certificate_issuer" FOREIGN KEY ("issued_by") REFERENCES "users"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "certificates" DROP CONSTRAINT "FK_certificate_issuer"`);
    await queryRunner.query(`ALTER TABLE "certificates" DROP CONSTRAINT "FK_certificate_enrollment"`);
    await queryRunner.query(`ALTER TABLE "certificates" DROP CONSTRAINT "FK_certificate_student"`);
    await queryRunner.query(`DROP INDEX "IDX_certificate_type_status"`);
    await queryRunner.query(`DROP INDEX "IDX_certificate_student"`);
    await queryRunner.query(`DROP INDEX "IDX_certificate_verification"`);
    await queryRunner.query(`DROP TABLE "certificates"`);
    await queryRunner.query(`DROP TYPE "public"."certificates_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."certificates_certificate_type_enum"`);

    await queryRunner.query(`ALTER TABLE "enrollments" DROP COLUMN IF EXISTS "student_status"`);

    await queryRunner.query(`ALTER TABLE "employee_history" DROP CONSTRAINT "FK_history_period"`);
    await queryRunner.query(`ALTER TABLE "employee_history" DROP CONSTRAINT "FK_history_career"`);
    await queryRunner.query(`ALTER TABLE "employee_history" DROP CONSTRAINT "FK_history_employee"`);
    await queryRunner.query(`DROP INDEX "IDX_employee_history_period"`);
    await queryRunner.query(`DROP INDEX "IDX_employee_history_employee"`);
    await queryRunner.query(`DROP TABLE "employee_history"`);

    await queryRunner.query(`ALTER TABLE "institutional_official_history" DROP CONSTRAINT "FK_official_career"`);
    await queryRunner.query(`ALTER TABLE "institutional_official_history" DROP CONSTRAINT "FK_official_employee"`);
    await queryRunner.query(`ALTER TABLE "institutional_official_history" DROP CONSTRAINT "FK_official_person"`);
    await queryRunner.query(`DROP INDEX "IDX_official_career"`);
    await queryRunner.query(`DROP INDEX "IDX_official_type_period"`);
    await queryRunner.query(`DROP TABLE "institutional_official_history"`);
    await queryRunner.query(`DROP TYPE "public"."institutional_official_history_official_type_enum"`);
  }
}
