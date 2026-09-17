import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { MinioService, BucketName } from './minio.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@common/guards/permissions.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';
import { PERMISSIONS } from '@common/permissions';

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const DOCUMENT_MIME_TYPES = [...IMAGE_MIME_TYPES, 'application/pdf'];
const PHOTO_MAX_SIZE = 5 * 1024 * 1024;
const DOCUMENT_MAX_SIZE = 10 * 1024 * 1024;

function fileUploadOptions(
  allowedMimeTypes: string[],
  maxSizeBytes: number,
) {
  return {
    limits: { fileSize: maxSizeBytes, files: 1 },
    fileFilter: (
      _req: Express.Request,
      file: Express.Multer.File,
      cb: (error: Error | null, acceptFile: boolean) => void,
    ) => {
      if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(
          new BadRequestException(
            `Tipo de archivo no permitido: ${file.mimetype}. Permitidos: ${allowedMimeTypes.join(', ')}`,
          ),
          false,
        );
      }
    },
  };
}

@ApiTags('Uploads')
@Controller('uploads')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class MinioController {
  constructor(private readonly minioService: MinioService) {}

  @Post('photo')
  @RequirePermission(PERMISSIONS.FILES_UPLOAD)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', fileUploadOptions(IMAGE_MIME_TYPES, PHOTO_MAX_SIZE)))
  async uploadPhoto(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Archivo no proporcionado');
    }
    const result = await this.minioService.uploadFile(
      BucketName.PHOTOS,
      file.buffer,
      file.originalname,
      file.mimetype,
    );
    return { url: result.url, objectName: result.objectName };
  }

  @Post('voucher')
  @RequirePermission(PERMISSIONS.FILES_UPLOAD)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', fileUploadOptions(DOCUMENT_MIME_TYPES, DOCUMENT_MAX_SIZE)))
  async uploadVoucher(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Archivo no proporcionado');
    }
    const result = await this.minioService.uploadFile(
      BucketName.VOUCHERS,
      file.buffer,
      file.originalname,
      file.mimetype,
    );
    return { url: result.url, objectName: result.objectName };
  }

  @Post('logo')
  @RequirePermission(PERMISSIONS.FILES_UPLOAD, PERMISSIONS.INSTITUTION_UPDATE)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', fileUploadOptions(IMAGE_MIME_TYPES, PHOTO_MAX_SIZE)))
  async uploadLogo(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Archivo no proporcionado');
    }
    const result = await this.minioService.uploadFile(
      BucketName.LOGOS,
      file.buffer,
      file.originalname,
      file.mimetype,
    );
    return { url: result.url, objectName: result.objectName };
  }

  @Post('document')
  @RequirePermission(PERMISSIONS.FILES_UPLOAD)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', fileUploadOptions(DOCUMENT_MIME_TYPES, DOCUMENT_MAX_SIZE)))
  async uploadDocument(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Archivo no proporcionado');
    }
    const result = await this.minioService.uploadFile(
      BucketName.DOCUMENTS,
      file.buffer,
      file.originalname,
      file.mimetype,
    );
    return { url: result.url, objectName: result.objectName };
  }
}