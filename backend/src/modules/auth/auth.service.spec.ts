import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UserService } from '@modules/user/user.service';
import { RbacService } from '@modules/rbac/rbac.service';
import { UserRole, UserStatus } from '@common/enums';

const activeUser = {
  id: 'u-1',
  username: 'admin',
  email: 'admin@itbt.edu.bo',
  fullName: 'Administrador del Sistema',
  role: UserRole.ADMIN,
  status: UserStatus.ACTIVE,
  mustChangePassword: true,
  studentId: null,
  student: null,
};

const inactiveUser = {
  ...activeUser,
  status: UserStatus.INACTIVE,
};

function createMocks(overrides: Record<string, unknown> = {}) {
  const mocks = {
    userService: {
      findByUsername: jest.fn(),
      findByEmail: jest.fn(),
      validatePassword: jest.fn(),
      recordFailedAttempt: jest.fn(),
      recordLogin: jest.fn(),
    },
    jwtService: {
      signAsync: jest.fn(),
    },
    rbacService: {
      getUserRoles: jest.fn().mockResolvedValue([
        { key: 'ADMIN', inherited: false },
      ]),
      getUserPermissions: jest.fn().mockResolvedValue(['*']),
    },
    ...overrides,
  };
  return mocks;
}

describe('AuthService', () => {
  let service: AuthService;
  let mocks: ReturnType<typeof createMocks>;

  beforeEach(async () => {
    mocks = createMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mocks.userService },
        { provide: JwtService, useValue: mocks.jwtService },
        { provide: RbacService, useValue: mocks.rbacService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('emite un token y devuelve el usuario con roles/permisos', async () => {
      mocks.userService.findByUsername.mockResolvedValue(activeUser);
      mocks.userService.validatePassword.mockResolvedValue(true);
      mocks.jwtService.signAsync.mockResolvedValue('token.jwt');

      const result = await service.login({ username: 'admin', password: 'admin2026' });

      expect(mocks.userService.recordLogin).toHaveBeenCalledWith('u-1');
      expect(mocks.rbacService.getUserPermissions).toHaveBeenCalledWith('u-1');
      expect(result.accessToken).toBe('token.jwt');
      expect(result.user.username).toBe('admin');
      expect(result.user.roles).toEqual(['ADMIN']);
      expect(result.user.permissions).toEqual(['*']);
    });

    it('rechaza credenciales inválidas y registra el intento fallido', async () => {
      mocks.userService.findByUsername.mockResolvedValue(activeUser);
      mocks.userService.validatePassword.mockResolvedValue(false);

      await expect(
        service.login({ username: 'admin', password: 'incorrecta' }),
      ).rejects.toThrow(UnauthorizedException);
      expect(mocks.userService.recordFailedAttempt).toHaveBeenCalledWith('u-1');
    });

    it('rechaza un usuario inactivo o bloqueado', async () => {
      mocks.userService.findByUsername.mockResolvedValue(inactiveUser);

      await expect(
        service.login({ username: 'admin', password: 'admin2026' }),
      ).rejects.toThrow('Usuario bloqueado o inactivo');
      expect(mocks.jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('acepta iniciar sesión con email', async () => {
      mocks.userService.findByUsername.mockResolvedValue(null);
      mocks.userService.findByEmail.mockResolvedValue(activeUser);
      mocks.userService.validatePassword.mockResolvedValue(true);
      mocks.jwtService.signAsync.mockResolvedValue('token.jwt');

      const result = await service.login({
        username: 'admin@itbt.edu.bo',
        password: 'admin2026',
      });

      expect(result.user.email).toBe('admin@itbt.edu.bo');
    });
  });
});