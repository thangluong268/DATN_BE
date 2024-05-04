import { BadRequestException } from '@nestjs/common';
import * as dayjs from 'dayjs';
import { PromotionCreateREQ } from '../request/promotion-create.request';

export const promotionCreateValidate = (body: PromotionCreateREQ) => {
  if (dayjs(body.startTime).isAfter(dayjs(body.endTime))) {
    throw new BadRequestException('Start time must be before end time');
  }
};
