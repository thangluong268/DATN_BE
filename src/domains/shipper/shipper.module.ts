import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ShipperController } from './shipper.controller';
import { ShipperService } from './shipper.service';
import { Shipper, ShipperSchema } from './schema/shipper.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Shipper.name, schema: ShipperSchema }])],
  controllers: [ShipperController],
  providers: [ShipperService],
  exports: [ShipperService, MongooseModule],
})
export class ShipperModule {}
