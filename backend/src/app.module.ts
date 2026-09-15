import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './config/typeorm.config';
import { AppConfigService } from './config/config.service';
import { InstitutionModule } from './modules/institution/institution.module';
import { CareerModule } from './modules/career/career.module';
import { AcademicPeriodModule } from './modules/academic-period/academic-period.module';
import { SubjectModule } from './modules/subject/subject.module';
import { StudentModule } from './modules/student/student.module';
import { DepositModule } from './modules/deposit/deposit.module';
import { EnrollmentModule } from './modules/enrollment/enrollment.module';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { SubjectAssignmentModule } from './modules/subject-assignment/subject-assignment.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { GradeModule } from './modules/grade/grade.module';
import { AcademicHistoryModule } from './modules/academic-history/academic-history.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { MinioModule } from './modules/minio/minio.module';
import { PersonModule } from './modules/person/person.module';
import { EmployeeModule } from './modules/employee/employee.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { AuditModule } from './modules/audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),
    TypeOrmModule.forRoot(typeOrmConfig),
    PersonModule,
    EmployeeModule,
    RbacModule,
    AuditModule,
    InstitutionModule,
    CareerModule,
    AcademicPeriodModule,
    SubjectModule,
    StudentModule,
    DepositModule,
    EnrollmentModule,
    UserModule,
    AuthModule,
    SubjectAssignmentModule,
    AttendanceModule,
    GradeModule,
    AcademicHistoryModule,
    DashboardModule,
    MinioModule,
  ],
  providers: [AppConfigService],
})
export class AppModule {}