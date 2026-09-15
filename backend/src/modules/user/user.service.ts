import {
  Injectable,
  ConflictException,
  NotFoundException,
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
import {
  LEGACY_ROLE_MAP,
  NEW_ROLE_TO_LEGACY,
  DEFAULT_ROLE_KEYS,
  RbacService,
} from '@modules/rbac/rbac.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    private readonly rbacService: RbacService,
  ) {}

  private legacyRoleToKey(role?: UserRole | string): string | undefined {
    if (!role) return undefined;
    return LEGACY_ROLE_MAP[role] ?? role;
  }

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

    const legacyRole =
      createDto.role ?? NEW_ROLE_TO_LEGACY[createDto.roleKeys?.[0] ?? ''];

    const user = this.userRepository.create({
      username: createDto.username,
      email: createDto.email,
      fullName: createDto.fullName,
      passwordHash,
      role: (legacyRole ?? 'STUDENT') as UserRole,
      status: UserStatus.ACTIVE,
      studentId: createDto.studentId,
    });

    const saved = await this.userRepository.save(user);
    if (createDto.roleKeys && createDto.roleKeys.length > 0) {
      await this.rbacService.replaceRoles(saved.id, createDto.roleKeys);
    } else {
      await this.assignLegacyRole(saved.id, legacyRole);
    }
    return saved;
  }

  private async assignLegacyRole(
    userId: string,
    role?: UserRole | string,
  ): Promise<void> {
    const roleKey = this.legacyRoleToKey(role);
    if (!roleKey) return;
    await this.rbacService.assignRole(userId, roleKey);
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
    const username = student.ci;

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

    const saved = await this.userRepository.save(user);
    await this.rbacService.assignRole(saved.id, DEFAULT_ROLE_KEYS.ESTUDIANTE);
    return saved;
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
      .leftJoinAndSelect('user.userRoles', 'userRoles')
      .leftJoinAndSelect('userRoles.role', 'assignedRole')
      .orderBy('user.createdAt', 'DESC');

    if (role) {
      const roleKey = this.legacyRoleToKey(role);
      qb.andWhere('assignedRole.name = :roleKey', { roleKey });
    }
    if (status) qb.andWhere('user.status = :status', { status });
    if (search) {
      qb.andWhere(
        '(LOWER(user.fullName) LIKE LOWER(:search) OR user.username LIKE :search OR user.email LIKE :search)',
        { search: `%${search}%` },
      );
    }

    const users = await qb.getMany();
    return users.map((u) => ({
      ...u,
      roles: u.userRoles?.map((ur) => ur.role.name) ?? [],
    }) as User);
  }

  async findByRole(role: UserRole): Promise<User[]> {
    return this.userRepository.find({ where: { role, status: UserStatus.ACTIVE } });
  }

  async update(id: string, updateDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    const { roleKeys, role, ...rest } = updateDto;

    Object.assign(user, rest);

    if (role) {
      user.role = role;
    }

    await this.userRepository.save(user);

    if (roleKeys && roleKeys.length > 0) {
      await this.rbacService.replaceRoles(id, roleKeys);
    } else if (role) {
      await this.assignLegacyRole(id, role);
    }

    return this.findOne(id);
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
      .innerJoin('user.userRoles', 'userRole')
      .innerJoin('userRole.role', 'role')
      .select('role.name', 'role')
      .addSelect('COUNT(DISTINCT user.id)', 'count')
      .where('user.isActive = true')
      .groupBy('role.name')
      .getRawMany();

    const counts: Record<string, number> = {};
    for (const row of result) {
      counts[row.role] = parseInt(row.count, 10);
    }
    return counts;
  }

  async updateUserRoles(id: string, roleKeys: string[]): Promise<User> {
    await this.rbacService.replaceRoles(id, roleKeys);
    return this.findOne(id);
  }
}