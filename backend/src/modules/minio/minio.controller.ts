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
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/enums';

@ApiTags('Uploads')
@Controller('uploads')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MinioController {
  constructor(private readonly minioService: MinioService) {}

  @Post('photo')
  @Roles(UserRole.ADMIN, UserRole.SECRETARY, UserRole.TEACHER)
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
  @Roles(UserRole.ADMIN, UserRole.SECRETARY)
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
  @Roles(UserRole.ADMIN)
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
  @Roles(UserRole.ADMIN, UserRole.SECRETARY, UserRole.TEACHER)
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