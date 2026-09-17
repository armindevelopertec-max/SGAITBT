import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../auth.service';
import { UserService } from '@modules/user/user.service';
import { RbacService } from '@modules/rbac/rbac.service';
import { UserStatus } from '@common/enums';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly userService: UserService,
    private readonly rbacService: RbacService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error(
        'JWT_SECRET is required. Configure it in the environment or .env before starting the backend.',
      );
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.userService.findOne(payload.sub);
    if (!user || !user.isActive || user.status !== UserStatus.ACTIVE) {
      return null;
    }
    const [roles, permissions] = await Promise.all([
      this.rbacService.getUserRoles(user.id),
      this.rbacService.getUserPermissions(user.id),
    ]);
    return {
      ...user,
      roles: roles.map((r) => r.key),
      permissions,
    };
  }
}