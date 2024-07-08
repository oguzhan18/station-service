import { Controller, Get, Post, UploadedFile, UseInterceptors, Res, Param, Logger, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StationService } from './station.service';
import { ApiConsumes, ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { Express } from 'express';

@ApiTags('music')
@Controller('music')
export class StationController {
  private readonly logger = new Logger(StationController.name);

  constructor(private readonly musicService: StationService) {}

  @Post('create')
  @ApiResponse({ status: 201, description: 'Station created successfully.' })
  createStation(): { id: string } {
    const id = this.musicService.createStation();
    this.logger.log(`Created station with ID: ${id}`);
    return { id };
  }

  @Post(':stationId/upload')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'The file has been uploaded.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  uploadMusic(@Param('stationId') stationId: string, @UploadedFile() file: Express.Multer.File): string {
    this.logger.log(`Upload request received for station ${stationId}`);
    if (!file) {
      this.logger.error('File is undefined');
      throw new BadRequestException('File is undefined');
    }
    this.logger.log(`Received file: ${JSON.stringify(file)}`);
    if (!file.buffer) {
      this.logger.error('File buffer is undefined');
      throw new BadRequestException('File buffer is undefined');
    }

    const result = this.musicService.uploadMusic(stationId, file);
    this.logger.log(`Upload result for station ${stationId}: ${result}`);
    return result;
  }

  @Get(':stationId/stream')
  @ApiResponse({ status: 200, description: 'Streaming the next music file.' })
  @ApiResponse({ status: 404, description: 'No music in the queue.' })
  async streamMusic(@Param('stationId') stationId: string, @Res() res: Response): Promise<void> {
    const musicStream = this.musicService.getCurrentMusicStream(stationId);
    if (musicStream) {
      this.logger.log(`Streaming music for station ${stationId}`);
      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'inline',
      });
      musicStream.pipe(res).on('close', () => {
        this.logger.log(`Stream closed by client for station ${stationId}`);
      });
    } else {
      this.logger.warn(`No music in the queue for station ${stationId}`);
      res.status(404).send('No music in the queue');
    }
  }

  @Get(':stationId/status')
  @ApiResponse({ status: 200, description: 'Get current music status.' })
  getStatus(@Param('stationId') stationId: string, @Res() res: Response): void {
    const currentFile = this.musicService.getCurrentFile(stationId);
    const currentFileSize = this.musicService.getCurrentFileSize(stationId);
    const currentFilePosition = this.musicService.getCurrentFilePosition(stationId);

    if (currentFile) {
      this.logger.log(`Current status for station ${stationId} - File: ${currentFile}, Size: ${currentFileSize}, Position: ${currentFilePosition}`);
      res.json({
        currentFile,
        currentFileSize,
        currentFilePosition,
      });
    } else {
      this.logger.warn(`No music playing for station ${stationId}`);
      res.status(404).send('No music playing');
    }
  }
}
