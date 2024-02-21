import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { MessageModule } from '../message/message.module';
import { ConversationGateway } from './conversation.gateway';
import { Conversation, ConversationSchema } from './schema/conversation.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
    ]),
    MessageModule,
    AuthModule,
  ],
  controllers: [],
  providers: [ConversationGateway],
})
export class ConversationModule {}
