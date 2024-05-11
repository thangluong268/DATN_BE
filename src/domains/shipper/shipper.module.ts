import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'domains/user/schema/user.schema';
import { MailModule } from 'services/mail/mail.module';
import { ShipperController } from './shipper.controller';
import { ShipperService } from './shipper.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]), MailModule],
  controllers: [ShipperController],
  providers: [ShipperService],
  exports: [ShipperService, MongooseModule],
})
export class ShipperModule {}
