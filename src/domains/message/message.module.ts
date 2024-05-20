import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Store, StoreSchema } from 'domains/store/schema/store.schema';
import { Conversation, ConversationSchema } from 'gateways/conversations/schema/conversation.schema';
import { UserModule } from '../user/user.module';
import { MessageService } from './message.service';
import { Message, MessageSchema } from './schema/message.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
      { name: Conversation.name, schema: ConversationSchema },
      { name: Store.name, schema: StoreSchema },
    ]),
    UserModule,
  ],
  controllers: [],
  providers: [MessageService],
  exports: [MessageService, MongooseModule],
})
export class MessageModule {}
