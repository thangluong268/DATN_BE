import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as bodyParser from 'body-parser';
import * as chalk from 'chalk';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import { cleanEnv, port, str } from 'envalid';
import helmet from 'helmet';
import { LoggingInterceptor } from 'interceptors/logging.interceptor';
import { APP_SECRET, CREDENTIALS, HOST, NODE_ENV, ORIGIN, PORT } from './app.config';
import { AppModule } from './app.module';
import { SocketIoAdapter } from './domains/conversations/conversation.adapter';
import { HttpExceptionMiddleware } from './middlewares/http-exception.middlewave';
import { ValidationCustomPipe } from './pipes/validation-custom.pipe';

async function bootstrap() {
  try {
    validateEnv();
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'verbose', 'debug'],
      cors: {
        origin: ORIGIN,
        credentials: CREDENTIALS,
      },
    });
    Logger.log(HOST, PORT);
    Logger.log(`🚀 Environment: ${chalk.hex('#33d32e').bold(`${NODE_ENV}`)}`);

    app.use(helmet());
    app.use(cookieParser(APP_SECRET));
    app.use(compression());
    app.use(bodyParser.json({ limit: '50mb' }));
    app.use(
      bodyParser.urlencoded({
        limit: '50mb',
        extended: true,
        parameterLimit: 50000,
      }),
    );
    app.useGlobalInterceptors(new LoggingInterceptor());
    app.useGlobalPipes(ValidationCustomPipe.compactVersion());
    app.useGlobalFilters(new HttpExceptionMiddleware());
    app.setGlobalPrefix('api');

    app.useWebSocketAdapter(new SocketIoAdapter(app));

    await app.listen(PORT || 5000);

    NODE_ENV !== 'production'
      ? Logger.log(`🪭  Server ready at http://${chalk.hex('#e5ff00').bold(`${HOST}`)}`)
      : Logger.log(`🪽 Server is listening on port ${chalk.hex('#87e8de').bold(`${PORT}`)}`);
  } catch (error) {
    Logger.error(`❌  Error starting server, ${error}`);
    process.exit();
  }
}

function validateEnv() {
  cleanEnv(process.env, {
    DATABASE_URL: str(),
    PORT: port(),
  });
}

bootstrap().catch((e) => {
  Logger.error(`❌  Error starting server, ${e}`);
  throw e;
});
