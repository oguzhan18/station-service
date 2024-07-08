import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express'; 

import multer, { memoryStorage } from 'multer';
import { StationController } from './station/station.controller';
import { StationService } from './station/station.service';

@Module({
  imports: [
    MulterModule.register({
      storage: memoryStorage(),
    }),
  ],
  controllers: [StationController],
  providers: [StationService],
  exports: [StationService],
})
export class AppModule {}
