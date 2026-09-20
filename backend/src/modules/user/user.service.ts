import {
  BadRequestException,
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
import { UserStatus } from '@common/enums';
import { Student } from '@modules/student/entities/student.entity';
import { Employee } from '@modules/employee/entities/employee.entity';
import { DEFAULT_ROLE_KEYS, LEGACY_ROLE_MAP, RbacService } from '@modules/rbac/rbac.service';
import { generateRandomPassword } from '@common/utils/password.util';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    private readonly rbacService: RbacService,
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
      passwordHash,
      status: UserStatus.ACTIVE,
      studentId: createDto.studentId,
    });

    const saved = await this.userRepository.save(user);
    if (createDto.roleKeys && createDto.roleKeys.length > 0) {
      await this.rbacService.replaceRoles(saved.id, createDto.roleKeys);
    }
    return saved;
  }

  async createStudentUser(studentId: string): Promise<{ user: User; password: string }> {
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

    const plainPassword = generateRandomPassword();
    const username = `AUT${student.person?.ci}`;
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    const user = this.userRepository.create({
      username,
      email: student.person?.email,
      passwordHash,
      status: UserStatus.ACTIVE,
      studentId: student.id,
      photoUrl: student.person?.photoUrl,
    });

    const saved = await this.userRepository.save(user);
    await this.rbacService.assignRole(saved.id, DEFAULT_ROLE_KEYS.ESTUDIANTE);
    return { user: saved, password: plainPassword };
  }

  async createEmployeeUser(employeeId: string, roleKey: string = 'DOCENTE'): Promise<{ user: User; password: string }> {
    const employee = await this.employeeRepository.findOne({
      where: { id: employeeId },
      relations: ['person'],
    });
    if (!employee) {
      throw new NotFoundException('Empleado no encontrado');
    }

    const existing = await this.userRepository.findOne({
      where: { employeeId },
    });
    if (existing) {
      throw new ConflictException('El empleado ya tiene un usuario');
    }

    const plainPassword = generateRandomPassword();
    const ciPart = employee.person?.ci?.substring(0, 6) || 'EMP';
    const username = `EMP${ciPart}`;
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    const user = this.userRepository.create({
      username,
      email: employee.person?.email,
      passwordHash,
      status: UserStatus.ACTIVE,
      employeeId: employee.id,
      photoUrl: employee.person?.photoUrl,
    });

    const saved = await this.userRepository.save(user);
    await this.rbacService.assignRole(saved.id, roleKey);
    return { user: saved, password: plainPassword };
  }

  async resetEmployeePassword(employeeId: string): Promise<{ username: string; password: string }> {
    const user = await this.userRepository.findOne({
      where: { employeeId },
    });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado para este empleado');
    }

    const plainPassword = generateRandomPassword();
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    user.passwordHash = passwordHash;
    user.mustChangePassword = true;
    await this.userRepository.save(user);

    return { username: user.username, password: plainPassword };
  }

  async resetStudentPassword(studentId: string): Promise<{ username: string; password: string }> {
    const user = await this.userRepository.findOne({
      where: { studentId },
    });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado para este estudiante');
    }

    const plainPassword = generateRandomPassword();
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    user.passwordHash = passwordHash;
    user.mustChangePassword = true;
    await this.userRepository.save(user);

    return { username: user.username, password: plainPassword };
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { username },
      relations: ['student', 'person'],
    });
  }

  async findByIdentifier(identifier: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.student', 'student')
      .leftJoinAndSelect('student.person', 'person')
      .where('user.username = :identifier OR user.email = :identifier', { identifier })
      .orWhere('person.ci = :ci', { ci: identifier })
      .getOne();
  }

  async findByStudentId(studentId: string): Promise<{ username: string } | null> {
    const user = await this.userRepository.findOne({
      where: { studentId },
      select: ['username'],
    });
    return user ? { username: user.username } : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['student', 'person'],
    });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user;
  }

  async findAll(query?: UserQueryDto): Promise<User[]> {
    const { status, search } = query || {};
    const qb = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.student', 'student')
      .leftJoinAndSelect('user.person', 'person')
      .leftJoinAndSelect('user.userRoles', 'userRoles')
      .leftJoinAndSelect('userRoles.role', 'assignedRole')
      .orderBy('user.createdAt', 'DESC');

    if (status) qb.andWhere('user.status = :status', { status });
    if (search) {
      qb.andWhere(
        '(LOWER(student.person.firstName) LIKE LOWER(:search) OR LOWER(student.person.lastName) LIKE LOWER(:search) OR LOWER(person.firstName) LIKE LOWER(:search) OR LOWER(person.lastName) LIKE LOWER(:search) OR user.username LIKE :search OR user.email LIKE :search)',
        { search: `%${search}%` },
      );
    }

    const users = await qb.getMany();
    return users.map((u) => {
      const { userRoles, ...rest } = u;
      return {
        ...rest,
        roles: userRoles?.map((ur) => ur.role.name) ?? [],
      };
    }) as unknown as User[];
  }

  async findByRole(role: string): Promise<User[]> {
    const mappedKey = LEGACY_ROLE_MAP[role] ?? role;
    return this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.userRoles', 'userRole')
      .innerJoin('userRole.role', 'assignedRole')
      .where('assignedRole.name = :mappedKey', { mappedKey })
      .andWhere('user.status = :status', { status: UserStatus.ACTIVE })
      .getMany();
  }

  async update(id: string, updateDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    const { roleKeys, ...rest } = updateDto;

    Object.assign(user, rest);

    await this.userRepository.save(user);

    if (roleKeys && roleKeys.length > 0) {
      await this.updateUserRoles(id, roleKeys);
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
    const user = await this.findOne(id);
    // Las cuentas vinculadas a un estudiante conservan el rol Estudiante.
    if (
      user.studentId &&
      (roleKeys.length !== 1 || roleKeys[0] !== DEFAULT_ROLE_KEYS.ESTUDIANTE)
    ) {
      throw new BadRequestException(
        'La cuenta está vinculada a un estudiante y debe mantener el rol Estudiante',
      );
    }
    // El rol Estudiante solo aplica a cuentas vinculadas a un estudiante.
    if (
      !user.studentId &&
      roleKeys.length === 1 &&
      roleKeys[0] === DEFAULT_ROLE_KEYS.ESTUDIANTE
    ) {
      throw new BadRequestException(
        'El rol Estudiante solo puede asignarse a una cuenta vinculada a un estudiante',
      );
    }
    await this.rbacService.replaceRoles(id, roleKeys);
    return this.findOne(id);
  }
}