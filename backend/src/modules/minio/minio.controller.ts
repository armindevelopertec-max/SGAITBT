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

@ApiTags('Uploads')
@Controller('uploads')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class MinioController {
  constructor(private readonly minioService: MinioService) {}

  @Post('photo')
  @RequirePermission(PERMISSIONS.FILES_UPLOAD)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
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
    return { url: result.url };
  }

  @Post('voucher')
  @RequirePermission(PERMISSIONS.FILES_UPLOAD)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
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
    return { url: result.url };
  }

  @Post('logo')
  @RequirePermission(PERMISSIONS.FILES_UPLOAD, PERMISSIONS.INSTITUTION_UPDATE)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
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
    return { url: result.url };
  }

  @Post('document')
  @RequirePermission(PERMISSIONS.FILES_UPLOAD)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
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
    return { url: result.url };
  }
}