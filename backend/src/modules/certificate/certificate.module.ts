import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Certificate } from './entities/certificate.entity';
import { CertificateService } from './certificate.service';
import { CertificateController } from './certificate.controller';
import { Student } from '@modules/student/entities/student.entity';
import { Enrollment } from '@modules/enrollment/entities/enrollment.entity';
import { User } from '@modules/user/entities/user.entity';
import { StudentModule } from '@modules/student/student.module';
import { EnrollmentModule } from '@modules/enrollment/enrollment.module';
import { UserModule } from '@modules/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Certificate, Student, Enrollment, User]),
    StudentModule,
    EnrollmentModule,
    UserModule,
  ],
  controllers: [CertificateController],
  providers: [CertificateService],
  exports: [CertificateService],
})
export class CertificateModule {}
