import { Controller } from '@nestjs/common';
import { FeedbackShipperService } from './feedback-shipper.service';

@Controller()
export class FeedbackShipperController {
  constructor(private readonly feedbackShipperService: FeedbackShipperService) {}
}
