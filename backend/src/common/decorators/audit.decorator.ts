import { SetMetadata, applyDecorators, UseInterceptors } from '@nestjs/common';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';

export const AUDIT_METADATA_KEY = 'audit_metadata';

export interface AuditMetadata {
  module: string;
  action: string;
  entityType?: string;
  /** Selector del id de entidad desde req.body o req.params */
  entityIdFrom?: 'params' | 'body';
  entityIdKey?: string;
  description?: string;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function Audit(metadata: AuditMetadata) {
  return applyDecorators(
    SetMetadata(AUDIT_METADATA_KEY, metadata),
    UseInterceptors(AuditInterceptor),
  );
}