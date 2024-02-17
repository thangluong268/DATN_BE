import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class AuthJwtRTGuard extends AuthGuard('jwt-refresh') {}
