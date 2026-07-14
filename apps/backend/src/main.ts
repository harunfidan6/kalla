import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import helmet from 'helmet';
import type { Request, Response, NextFunction } from 'express';
import { getAllowedOrigins } from './common/allowed-origins';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Render (and most PaaS hosts) sit behind a reverse proxy — without this, req.ip would
  // report the proxy's internal address instead of the real client IP (used for refresh
  // token audit logging and rate limiting).
  app.set('trust proxy', 1);

  // Secure HTTP Headers using Helmet (CSP disabled for local dev compatibility).
  // crossOriginResourcePolicy is relaxed to 'cross-origin' because /public assets (product
  // images, logos) are meant to be embedded by the customer-app and staff-app, which run on
  // different ports/origins — Helmet's default 'same-origin' policy blocks that.
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // Handle Chrome Private Network Access (PNA) preflight requests
  // Browsers block localhost:port → localhost:port requests unless this header is present
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
    
    // Tarayıcının PNA kontrolü için gönderdiği OPTIONS isteğini anında 200 ile cevapla
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Access-Control-Allow-Private-Network');
      return res.sendStatus(200);
    }
    
    next();
  });

  // Configure CORS with credentials and explicit headers
  const allowedOrigins = getAllowedOrigins();

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      if (
        process.env.NODE_ENV !== 'production' ||
        allowedOrigins.includes(origin)
      ) {
        return callback(null, true);
      }
      return callback(new Error(`CORS: Origin ${origin} not allowed`), false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
      'Access-Control-Allow-Private-Network',
    ],
    exposedHeaders: ['Access-Control-Allow-Private-Network'],
  });

  // Serve static assets (logos, product images).
  // Compiled output lives at dist/src/main.js, so the public folder (at the backend project
  // root, a sibling of src/) is two levels up from __dirname, not one.
  app.useStaticAssets(join(__dirname, '..', '..', 'public'), {
    prefix: '/public/',
  });

  // Use global validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Use global logging interceptor for request redaction safety net
  const { LoggingInterceptor } = require('./common/interceptors/logging.interceptor');
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Use global exception filter to redact raw error traces in production
  const { ProductionExceptionFilter } = require('./common/filters/production-exception.filter');
  app.useGlobalFilters(new ProductionExceptionFilter());

  // Configure Swagger Document Builder
  const config = new DocumentBuilder()
    .setTitle('Kafe Yönetim Uygulaması API')
    .setDescription('Müşteri ve Personel uygulamaları için ortak backend REST API dökümantasyonu')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Get port from config or environment
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;

  await app.listen(port);
  console.log(`\n🚀 Kafe Yönetim Backend başarıyla başlatıldı!`);
  console.log(`👉 Swagger API Dökümantasyonu: http://localhost:${port}/api`);
}
bootstrap();