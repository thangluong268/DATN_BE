import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserToken, UserTokenSchema } from './schema/user-token.schema';
import { UserTokenController } from './user-token.controller';
import { UserTokenService } from './user-token.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserToken.name, schema: UserTokenSchema },
    ]),
  ],
  controllers: [UserTokenController],
  providers: [UserTokenService],
  exports: [UserTokenService],
})
export class UserTokenModule {}
