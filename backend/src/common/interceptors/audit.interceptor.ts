import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AUDIT_METADATA_KEY, AuditMetadata } from '@common/decorators/audit.decorator';
import { AuditService } from '@modules/audit/audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const metadata = this.reflector.getAllAndOverride<AuditMetadata | undefined>(
      AUDIT_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!metadata) return next.handle();

    const req = context.switchToHttp().getRequest<Record<string, any>>();
    const user = req.user ?? {};

    let entityId: string | undefined;
    if (metadata.entityIdFrom === 'params') {
      const key = metadata.entityIdKey ?? 'id';
      entityId = req.params?.[key];
    } else if (metadata.entityIdFrom === 'body') {
      const key = metadata.entityIdKey ?? 'id';
      entityId = req.body?.[key];
    }

    const newValue = metadata.entityIdFrom !== 'params' ? (req.body ?? undefined) : undefined;

    return next.handle().pipe(
      tap({
        error: () => {
          // No se registra auditoría para respuestas con error
        },
        complete: () => {
          this.auditService
            .record({
              userId: user.id,
              username: user.username ?? user.email,
              action: metadata.action,
              module: metadata.module,
              entityType: metadata.entityType,
              entityId,
              newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : undefined,
              ip: req.ip,
              description: metadata.description,
            })
            .catch(() => {
              // La auditoría no debe romper el flujo principal
            });
        },
      }),
    );
  }
}