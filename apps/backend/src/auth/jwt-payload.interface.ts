import { Role } from '@kafe/shared-types';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  fullName: string;
  branchId?: string | null;
  type: 'access' | 'refresh';
  jti?: string;
}
