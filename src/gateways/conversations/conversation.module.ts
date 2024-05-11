import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from 'domains/auth/auth.module';
import { MessageModule } from 'domains/message/message.module';
import { UserModule } from 'domains/user/user.module';
import { ConversationGateway } from './conversation.gateway';
import { ConversationService } from './conversation.service';
import { Conversation, ConversationSchema } from './schema/conversation.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Conversation.name, schema: ConversationSchema }]),
    JwtModule.register({}),
    AuthModule,
    MessageModule,
    UserModule,
  ],
  providers: [ConversationService, ConversationGateway],
  exports: [ConversationService, ConversationGateway],
})
export class ConversationModule {}
