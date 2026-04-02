import { randomBytes } from 'crypto';

export function getResetPasswordToken() {
  return randomBytes(32).toString('hex');
}

export function getVerifyToken() {
  return randomBytes(32).toString('hex');
}
