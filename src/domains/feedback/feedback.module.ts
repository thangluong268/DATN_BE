import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';
import { FeedbackSchema } from './schema/feedback.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Feedback', schema: FeedbackSchema }])],
  controllers: [FeedbackController],
  providers: [FeedbackService],
  exports: [FeedbackService],
})
export class FeedbackModule {}
