import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from 'domains/auth/strategies/auth-jwt-at.strategy';

@Injectable()
export class JwtHelper {
  constructor(private readonly jwtService: JwtService) {}

  decode(auth: string): JwtPayload {
    const jwt = auth.replace('Bearer ', '');
    return this.jwtService.decode(jwt, { json: true }) as JwtPayload;
  }
  verifyJwtPayload(payload?: string): object {
    const jwtPayload = this.jwtService.verify(payload ?? '');
    return jwtPayload;
  }
}
