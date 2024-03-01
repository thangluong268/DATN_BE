import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { MessageModule } from '../message/message.module';
import { UserModule } from '../user/user.module';
import { ConversationGateway } from './conversation.gateway';
import { ConversationService } from './conversation.service';
import { Conversation, ConversationSchema } from './schema/conversation.schema';

@Module({
  imports: [
    JwtModule.register({}),
    MongooseModule.forFeature([{ name: Conversation.name, schema: ConversationSchema }]),
    MessageModule,
    AuthModule,
    UserModule,
  ],
  controllers: [],
  providers: [ConversationService, ConversationGateway],
})
export class ConversationModule {}
