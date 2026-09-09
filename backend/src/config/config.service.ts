import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService implements OnModuleInit {
  private readonly logger = new Logger(AppConfigService.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.logger.log(`Environment: ${this.configService.get('NODE_ENV', 'development')}`);
    this.logger.log(`API listening on port: ${this.configService.get('PORT', 3001)}`);
  }
}