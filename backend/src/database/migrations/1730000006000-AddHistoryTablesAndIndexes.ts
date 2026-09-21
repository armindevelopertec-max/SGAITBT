import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHistoryTablesAndIndexes1730000006000 implements MigrationInterface {
  name = 'AddHistoryTablesAndIndexes1730000006000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "grade_history" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "is_active" boolean NOT NULL DEFAULT true,
        "created_by" character varying,
        "updated_by" character varying,
        "grade_id" uuid NOT NULL,
        "previous_first_partial" numeric(5,2),
        "previous_second_partial" numeric(5,2),
        "previous_practices" numeric(5,2),
        "previous_final_exam" numeric(5,2),
        "previous_final_grade" numeric(5,2),
        "previous_status" character varying(20),
        "new_first_partial" numeric(5,2),
        "new_second_partial" numeric(5,2),
        "new_practices" numeric(5,2),
        "new_final_exam" numeric(5,2),
        "new_final_grade" numeric(5,2),
        "new_status" character varying(20),
        "changed_by" uuid,
        "change_reason" text,
        "client_ip" character varying(50),
        CONSTRAINT "PK_grade_history" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_grade_history_grade_id" ON "grade_history" ("grade_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_grade_history_changed_by" ON "grade_history" ("changed_by")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_grade_history_created_at" ON "grade_history" ("created_at")
    `);

    await queryRunner.query(`
      ALTER TABLE "grade_history"
      ADD CONSTRAINT "FK_grade_history_grade" FOREIGN KEY ("grade_id")
      REFERENCES "grades"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "grade_history"
      ADD CONSTRAINT "FK_grade_history_changed_by" FOREIGN KEY ("changed_by")
      REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE "student_status_history" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "is_active" boolean NOT NULL DEFAULT true,
        "created_by" character varying,
        "updated_by" character varying,
        "student_id" uuid NOT NULL,
        "previous_status" character varying(30),
        "new_status" character varying(30),
        "previous_career_id" uuid,
        "new_career_id" uuid,
        "previous_level" integer,
        "new_level" integer,
        "academic_period_id" uuid,
        "changed_by" uuid,
        "change_reason" text,
        "client_ip" character varying(50),
        CONSTRAINT "PK_student_status_history" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_student_status_history_student" ON "student_status_history" ("student_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_student_status_history_period" ON "student_status_history" ("academic_period_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_student_status_history_changed_by" ON "student_status_history" ("changed_by")
    `);

    await queryRunner.query(`
      ALTER TABLE "student_status_history"
      ADD CONSTRAINT "FK_student_status_history_student" FOREIGN KEY ("student_id")
      REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "student_status_history"
      ADD CONSTRAINT "FK_student_status_history_previous_career" FOREIGN KEY ("previous_career_id")
      REFERENCES "careers"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "student_status_history"
      ADD CONSTRAINT "FK_student_status_history_new_career" FOREIGN KEY ("new_career_id")
      REFERENCES "careers"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "student_status_history"
      ADD CONSTRAINT "FK_student_status_history_period" FOREIGN KEY ("academic_period_id")
      REFERENCES "academic_periods"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "student_status_history"
      ADD CONSTRAINT "FK_student_status_history_changed_by" FOREIGN KEY ("changed_by")
      REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE "person_history" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "is_active" boolean NOT NULL DEFAULT true,
        "created_by" character varying,
        "updated_by" character varying,
        "person_id" uuid NOT NULL,
        "field_changed" character varying(50) NOT NULL,
        "previous_value" text,
        "new_value" text,
        "changed_by" uuid,
        "client_ip" character varying(50),
        CONSTRAINT "PK_person_history" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_person_history_person" ON "person_history" ("person_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_person_history_field" ON "person_history" ("field_changed")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_person_history_changed_by" ON "person_history" ("changed_by")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_person_history_created_at" ON "person_history" ("created_at")
    `);

    await queryRunner.query(`
      ALTER TABLE "person_history"
      ADD CONSTRAINT "FK_person_history_person" FOREIGN KEY ("person_id")
      REFERENCES "persons"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "person_history"
      ADD CONSTRAINT "FK_person_history_changed_by" FOREIGN KEY ("changed_by")
      REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "audit_logs"
      ADD COLUMN IF NOT EXISTS "previous_value" jsonb
    `);
    await queryRunner.query(`
      ALTER TABLE "audit_logs"
      ADD COLUMN IF NOT EXISTS "client_ip" character varying(50)
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_grade_assignment_period" ON "grades" ("assignment_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_enrollment_active" ON "enrollments" ("student_id", "status") WHERE "status" = 'ACTIVE'
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_official_gestion" ON "institutional_official_history" ("start_gestion", "end_gestion")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_official_gestion"`);
    await queryRunner.query(`DROP INDEX "IDX_enrollment_active"`);
    await queryRunner.query(`DROP INDEX "IDX_grade_assignment_period"`);

    await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN IF EXISTS "client_ip"`);
    await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN IF EXISTS "previous_value"`);

    await queryRunner.query(`ALTER TABLE "person_history" DROP CONSTRAINT "FK_person_history_changed_by"`);
    await queryRunner.query(`ALTER TABLE "person_history" DROP CONSTRAINT "FK_person_history_person"`);
    await queryRunner.query(`DROP INDEX "IDX_person_history_created_at"`);
    await queryRunner.query(`DROP INDEX "IDX_person_history_changed_by"`);
    await queryRunner.query(`DROP INDEX "IDX_person_history_field"`);
    await queryRunner.query(`DROP INDEX "IDX_person_history_person"`);
    await queryRunner.query(`DROP TABLE "person_history"`);

    await queryRunner.query(`ALTER TABLE "student_status_history" DROP CONSTRAINT "FK_student_status_history_changed_by"`);
    await queryRunner.query(`ALTER TABLE "student_status_history" DROP CONSTRAINT "FK_student_status_history_period"`);
    await queryRunner.query(`ALTER TABLE "student_status_history" DROP CONSTRAINT "FK_student_status_history_new_career"`);
    await queryRunner.query(`ALTER TABLE "student_status_history" DROP CONSTRAINT "FK_student_status_history_previous_career"`);
    await queryRunner.query(`ALTER TABLE "student_status_history" DROP CONSTRAINT "FK_student_status_history_student"`);
    await queryRunner.query(`DROP INDEX "IDX_student_status_history_changed_by"`);
    await queryRunner.query(`DROP INDEX "IDX_student_status_history_period"`);
    await queryRunner.query(`DROP INDEX "IDX_student_status_history_student"`);
    await queryRunner.query(`DROP TABLE "student_status_history"`);

    await queryRunner.query(`ALTER TABLE "grade_history" DROP CONSTRAINT "FK_grade_history_changed_by"`);
    await queryRunner.query(`ALTER TABLE "grade_history" DROP CONSTRAINT "FK_grade_history_grade"`);
    await queryRunner.query(`DROP INDEX "IDX_grade_history_created_at"`);
    await queryRunner.query(`DROP INDEX "IDX_grade_history_changed_by"`);
    await queryRunner.query(`DROP INDEX "IDX_grade_history_grade_id"`);
    await queryRunner.query(`DROP TABLE "grade_history"`);
  }
}
