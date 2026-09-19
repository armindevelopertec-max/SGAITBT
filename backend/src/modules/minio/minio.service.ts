import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { randomUUID } from 'crypto';
import { extname } from 'path';

export enum BucketName {
  PHOTOS = 'student-photos',
  VOUCHERS = 'deposit-vouchers',
  DOCUMENTS = 'documents',
  LOGOS = 'logos',
}

/** Política de solo lectura anónima para un bucket (GET público de objetos). */
function publicReadPolicy(bucket: string): Record<string, unknown> {
  return {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: { AWS: ['*'] },
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${bucket}/*`],
      },
    ],
  };
}

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private client: Minio.Client;

  constructor(private readonly configService: ConfigService) {
    this.client = new Minio.Client({
      endPoint: this.configService.get('MINIO_ENDPOINT', 'minio'),
      port: parseInt(this.configService.get('MINIO_PORT', '9000'), 10),
      useSSL: this.configService.get('MINIO_USE_SSL', 'false') === 'true',
      accessKey: this.configService.get('MINIO_ACCESS_KEY', 'minioadmin'),
      secretKey: this.configService.get('MINIO_SECRET_KEY', 'minio_secret_2026'),
    });
  }

  async onModuleInit() {
    try {
      await this.ensureBuckets(Object.values(BucketName));
      this.logger.log('Buckets de MinIO verificados y creados');
    } catch (error) {
      this.logger.error('Error inicializando MinIO', error);
    }
  }

  async ensureBuckets(buckets: string[]): Promise<void> {
    for (const bucket of buckets) {
      const exists = await this.client.bucketExists(bucket);
      if (!exists) {
        await this.client.makeBucket(bucket, 'us-east-1');
        this.logger.log(`Bucket creado: ${bucket}`);
      }
      // Lectura pública: el frontend muestra las imágenes por URL directa.
      await this.client.setBucketPolicy(bucket, JSON.stringify(publicReadPolicy(bucket)));
    }
  }

  async uploadFile(
    bucket: BucketName,
    fileBuffer: Buffer,
    originalName: string,
    mimeType?: string,
  ): Promise<{ url: string; objectName: string }> {
    const extension = extname(originalName);
    const objectName = `${new Date().toISOString().slice(0, 10)}/${randomUUID()}${extension}`;

    const metaData: Record<string, string> = {};
    if (mimeType) {
      metaData['Content-Type'] = mimeType;
    }

    await this.client.putObject(bucket, objectName, fileBuffer, fileBuffer.length, metaData);

    const url = await this.getPublicUrl(bucket, objectName);
    return { url, objectName };
  }

  async getFileUrl(bucket: BucketName, objectName: string): Promise<string> {
    const exists = await this.client.statObject(bucket, objectName);
    if (!exists) {
      throw new Error('Objeto no encontrado');
    }
    return this.getPublicUrl(bucket, objectName);
  }

  private getPublicUrl(bucket: BucketName, objectName: string): string {
    const endpoint = this.configService.get('MINIO_PUBLIC_ENDPOINT', 'http://localhost:9000');
    return `${endpoint}/${bucket}/${objectName}`;
  }

  async removeFile(bucket: BucketName, objectName: string): Promise<void> {
    try {
      await this.client.removeObject(bucket, objectName);
    } catch (error) {
      this.logger.error(`Error eliminando objeto ${objectName}`, error);
      throw error;
    }
  }
}