import { Body, Controller, Post } from '@nestjs/common';
import { ShipperService } from './shipper.service';
import { ShipperCreateREQ } from './request/shipper-create.request';

@Controller('shippers')
export class ShipperController {
  constructor(private readonly shipperService: ShipperService) {}

  @Post()
  create(@Body() body: ShipperCreateREQ) {
    return this.shipperService.create(body);
  }
}
