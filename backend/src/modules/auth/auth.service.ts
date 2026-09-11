import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '@modules/user/user.service';
import { User } from '@modules/user/entities/user.entity';
import { LoginDto } from './dto/auth.dto';
import { UserStatus } from '@common/enums';

export interface JwtPayload {
  sub: string;
  username: string;
  email: string;
  role: string;
  fullName: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<User> {
    const user = await this.userService.findByUsername(username);
    if (!user) {
      const byEmail = await this.userService.findByEmail(username);
      if (byEmail) {
        return this.authenticateByEmail(byEmail, password);
      }
      throw new UnauthorizedException('Credenciales inválidas');
    }
    return this.authenticateStored(user, password);
  }

  private async authenticateByEmail(user: User, password: string): Promise<User> {
    return this.authenticateStored(user, password);
  }

  private async authenticateStored(user: User, password: string): Promise<User> {
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Usuario bloqueado o inactivo');
    }

    const isValid = await this.userService.validatePassword(user, password);
    if (!isValid) {
      await this.userService.recordFailedAttempt(user.id);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return user;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.username, loginDto.password);

    await this.userService.recordLogin(user.id);

    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        studentId: user.studentId,
        photoUrl: user.student?.photoUrl ?? null,
        mustChangePassword: user.mustChangePassword,
      },
    };
  }
}