import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MessageModule } from '../message/message.module';
import { UserModule } from '../user/user.module';
import { ConversationService } from './conversation.service';
import { Conversation, ConversationSchema } from './schema/conversation.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Conversation.name, schema: ConversationSchema }]), MessageModule, UserModule],
  controllers: [],
  providers: [ConversationService],
})
export class ConversationModule {}
