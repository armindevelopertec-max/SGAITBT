import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AppModule (smoke e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('SGA ITBT API').addBearerAuth().build(),
    );
    SwaggerModule.setup('api/docs', app, document);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('la aplicación compila y arranca', async () => {
    expect(app).toBeDefined();
    expect(app.getHttpServer()).toBeDefined();
  });

  it('expone la documentación Swagger en /api/docs', async () => {
    const response = await request(app.getHttpServer()).get('/api/docs').expect(200);
    expect(response.headers['content-type']).toContain('text/html');
  });

  it('responde 404 para rutas desconocidas con prefijo api', async () => {
    await request(app.getHttpServer()).get('/api/ruta-inexistente').expect(404);
  });
});