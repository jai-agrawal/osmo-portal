import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: process.env.PORT,
  environment: process.env.NODE_ENV || 'development',
}));
