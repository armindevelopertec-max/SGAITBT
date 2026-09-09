import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import {
  CreateUserDto,
  UpdateUserDto,
  ResetPasswordDto,
  UserQueryDto,
} from './dto/user.dto';
import { UserRole, UserStatus } from '@common/enums';
import { Student } from '@modules/student/entities/student.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
  ) {}

  async create(createDto: CreateUserDto): Promise<User> {
    const existingUsername = await this.userRepository.findOne({
      where: { username: createDto.username },
    });
    if (existingUsername) {
      throw new ConflictException('El nombre de usuario ya está en uso');
    }

    const existingEmail = await this.userRepository.findOne({
      where: { email: createDto.email },
    });
    if (existingEmail) {
      throw new ConflictException('El correo electrónico ya está en uso');
    }

    if (createDto.studentId) {
      const student = await this.studentRepository.findOne({
        where: { id: createDto.studentId },
      });
      if (!student) {
        throw new NotFoundException('Estudiante no encontrado');
      }
      const existingStudentUser = await this.userRepository.findOne({
        where: { studentId: createDto.studentId },
      });
      if (existingStudentUser) {
        throw new ConflictException('El estudiante ya tiene un usuario creado');
      }
    }

    const passwordHash = await bcrypt.hash(createDto.password, 10);

    const user = this.userRepository.create({
      username: createDto.username,
      email: createDto.email,
      fullName: createDto.fullName,
      passwordHash,
      role: createDto.role,
      status: UserStatus.ACTIVE,
      studentId: createDto.studentId,
    });

    return this.userRepository.save(user);
  }

  async createStudentUser(studentId: string): Promise<User> {
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
    });
    if (!student) {
      throw new NotFoundException('Estudiante no encontrado');
    }

    const existing = await this.userRepository.findOne({
      where: { studentId },
    });
    if (existing) {
      throw new ConflictException('El estudiante ya tiene un usuario');
    }

    const defaultPassword = student.ci;
    const username = this.buildUsername(student.firstName, student.lastName);

    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const user = this.userRepository.create({
      username,
      email: student.email,
      fullName: `${student.firstName} ${student.lastName}`,
      passwordHash,
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      studentId: student.id,
      photoUrl: student.photoUrl,
    });

    return this.userRepository.save(user);
  }

  private buildUsername(firstName: string, lastName: string): string {
    const base = `${firstName.toLowerCase().split(' ')[0]}.${lastName.toLowerCase().split(' ')[0]}`;
    const cleaned = base.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const unique = Math.random().toString(36).slice(2, 6);
    return `${cleaned}.${unique}`;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { username },
      relations: ['student'],
    });
  }

  async findByIdentifier(identifier: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.student', 'student')
      .where('user.username = :identifier OR user.email = :identifier', { identifier })
      .orWhere('student.ci = :ci', { ci: identifier })
      .getOne();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['student'],
    });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user;
  }

  async findAll(query?: UserQueryDto): Promise<User[]> {
    const { role, status, search } = query || {};
    const qb = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.student', 'student')
      .orderBy('user.createdAt', 'DESC');

    if (role) qb.andWhere('user.role = :role', { role });
    if (status) qb.andWhere('user.status = :status', { status });
    if (search) {
      qb.andWhere(
        '(LOWER(user.fullName) LIKE LOWER(:search) OR user.username LIKE :search OR user.email LIKE :search)',
        { search: `%${search}%` },
      );
    }

    return qb.getMany();
  }

  async findByRole(role: UserRole): Promise<User[]> {
    return this.userRepository.find({ where: { role, status: UserStatus.ACTIVE } });
  }

  async update(id: string, updateDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, updateDto);
    return this.userRepository.save(user);
  }

  async updatePassword(id: string, newPassword: string): Promise<void> {
    const user = await this.findOne(id);
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.mustChangePassword = false;
    user.failedAttempts = 0;
    await this.userRepository.save(user);
  }

  async resetPassword(id: string, dto: ResetPasswordDto): Promise<void> {
    await this.updatePassword(id, dto.newPassword);
  }

  async recordLogin(id: string): Promise<void> {
    await this.userRepository.update(id, { lastLogin: new Date(), failedAttempts: 0 });
  }

  async recordFailedAttempt(id: string): Promise<void> {
    const user = await this.findOne(id);
    user.failedAttempts += 1;
    if (user.failedAttempts >= 5) {
      user.status = UserStatus.BLOCKED;
    }
    await this.userRepository.save(user);
  }

  async validatePassword(user: User, plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, user.passwordHash);
  }

  async countByRole(): Promise<Record<string, number>> {
    const result = await this.userRepository
      .createQueryBuilder('user')
      .select('user.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .where('user.isActive = true')
      .groupBy('user.role')
      .getRawMany();

    const counts: Record<string, number> = {};
    for (const row of result) {
      counts[row.role] = parseInt(row.count, 10);
    }
    return counts;
  }
}