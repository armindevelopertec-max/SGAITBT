import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import {
  CreateCertificateDto,
  RevokeCertificateDto,
  CertificateQueryDto,
} from './dto/certificate.dto';
import { CertificateService } from './certificate.service';

@Controller('certificates')
export class CertificateController {
  constructor(private readonly service: CertificateService) {}

  @Post()
  create(@Body() dto: CreateCertificateDto, @Request() req: any) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('Usuario no autenticado');
    }
    return this.service.create(dto, userId);
  }

  @Get()
  findAll(@Query() query: CertificateQueryDto) {
    return this.service.findAll(query);
  }

  @Get('student/:studentId')
  findByStudent(@Param('studentId', ParseUUIDPipe) studentId: string) {
    return this.service.findByStudent(studentId);
  }

  @Get('verify/:code')
  verify(@Param('code') code: string) {
    return this.service.verify(code);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id/revoke')
  revoke(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RevokeCertificateDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('Usuario no autenticado');
    }
    return this.service.revoke(id, dto, userId);
  }

  @Patch(':id/pdf')
  updatePdfUrl(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('pdfUrl') pdfUrl: string,
  ) {
    return this.service.updatePdfUrl(id, pdfUrl);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
