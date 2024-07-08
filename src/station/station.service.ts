import { Injectable, Logger } from '@nestjs/common';
import { createReadStream, createWriteStream, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { PassThrough, Readable } from 'stream';
import { Express } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Station } from './models/station.model';



@Injectable()
export class StationService {
  private readonly logger = new Logger(StationService.name);
  private stations: Record<string, Station> = {};
  private readonly uploadPath = join(__dirname, '..', '..', 'uploads');

  constructor() {
    this.ensureUploadPathExists();
  }

  /**
   * Ensures the upload directory exists.
   */
  private ensureUploadPathExists(): void {
    if (!existsSync(this.uploadPath)) {
      mkdirSync(this.uploadPath);
    }
  }

  /**
   * Creates a new radio station.
   * @returns The ID of the created station.
   */
  createStation(): string {
    const id = uuidv4();
    const stationPath = join(this.uploadPath, id);
    
    if (!existsSync(stationPath)) {
      mkdirSync(stationPath);
    }
    
    this.stations[id] = {
      id,
      musicQueue: [],
      currentFile: null,
      currentStream: null,
      currentStartTime: 0,
      currentFileSize: 0,
      activeClients: [],
      isPlaying: false,
      buffer: [],
    };
    
    this.initializeStationQueue(id);
    this.logger.log(`Created new station with ID: ${id}`);
    
    return id;
  }

  /**
   * Initializes the music queue for a given station.
   * @param stationId - The ID of the station.
   */
  private initializeStationQueue(stationId: string): void {
    const station = this.stations[stationId];
    const stationPath = join(this.uploadPath, stationId);
    const files = readdirSync(stationPath).filter(file => file.endsWith('.mp3'));
    
    station.musicQueue.push(...files.map(file => join(stationPath, file)));
    
    if (station.musicQueue.length > 0 && !station.isPlaying) {
      this.playNextMusic(stationId);
    }
  }

  /**
   * Uploads a music file to a station.
   * @param stationId - The ID of the station.
   * @param file - The music file to upload.
   * @returns The path of the uploaded file.
   */
  uploadMusic(stationId: string, file: Express.Multer.File): string {
    const station = this.stations[stationId];
    if (!station) {
      throw new Error('Station not found');
    }

    const filePath = join(this.uploadPath, stationId, file.originalname);
    const writeStream = createWriteStream(filePath);
    
    writeStream.on('error', (err) => {
      this.logger.error(`Error writing file: ${err.message}`);
    });
    
    writeStream.write(file.buffer, (err) => {
      if (err) {
        this.logger.error(`Error writing buffer to file: ${err.message}`);
      } else {
        station.musicQueue.push(filePath);
        
        if (!station.isPlaying) {
          this.playNextMusic(stationId);
        }
      }
    });
    
    writeStream.end();
    return filePath;
  }

  /**
   * Plays the next music file in the station's queue.
   * @param stationId - The ID of the station.
   */
  private playNextMusic(stationId: string): void {
    const station = this.stations[stationId];
    
    if (station.musicQueue.length > 0) {
      if (station.currentFile) {
        station.musicQueue.push(station.currentFile);
      }
      
      station.currentFile = station.musicQueue.shift()!;
      station.currentFileSize = statSync(station.currentFile).size;
      station.currentStartTime = Date.now();
      station.isPlaying = true;
      
      this.streamCurrentMusic(stationId);
    } else {
      station.isPlaying = false;
      station.currentFile = null;
    }
  }

  /**
   * Streams the current music file to clients.
   * @param stationId - The ID of the station.
   */
  private streamCurrentMusic(stationId: string): void {
    const station = this.stations[stationId];
    
    if (station.currentFile) {
      const options = { start: 0, end: station.currentFileSize - 1 };
      station.currentStream = new PassThrough();
      const stream = createReadStream(station.currentFile, options);
      
      stream.on('data', (chunk: any) => {
        station.buffer.push(chunk);
        station.currentStream.write(chunk);
        station.activeClients.forEach(client => client.write(chunk));
      });

      stream.on('end', () => {
        station.currentStream.end();
        station.activeClients.forEach(client => client.end());
        station.activeClients = [];
        this.playNextMusic(stationId);
      });

      stream.on('error', (error) => {
        this.logger.error(`Error streaming file for station ${stationId}: ${error.message}`);
      });

      stream.pipe(station.currentStream);
    } else {
      this.logger.error(`No current file to stream for station ${stationId}`);
    }
  }

  /**
   * Gets the current music stream for a station.
   * @param stationId - The ID of the station.
   * @returns The current music stream.
   */
  getCurrentMusicStream(stationId: string): Readable {
    const station = this.stations[stationId];
    
    if (station && station.isPlaying) {
      const elapsedTime = (Date.now() - station.currentStartTime) / 1000;
      const startByte = Math.floor((elapsedTime % station.currentFileSize) * station.currentFileSize);
      
      const newClientStream = new PassThrough();
      const stream = createReadStream(station.currentFile, { start: startByte });

      stream.on('data', (chunk: any) => {
        newClientStream.write(chunk);
      });

      stream.on('end', () => {
        this.playNextMusic(stationId);
      });

      stream.pipe(newClientStream);
      station.activeClients.push(newClientStream);
      
      return newClientStream;
    }

    this.logger.log(`No current stream to return for station ${stationId}`);
    return null;
  }

  /**
   * Gets the current file being played in a station.
   * @param stationId - The ID of the station.
   * @returns The path of the current file or null if no file is playing.
   */
  getCurrentFile(stationId: string): string | null {
    return this.stations[stationId]?.currentFile || null;
  }

  /**
   * Gets the size of the current file being played in a station.
   * @param stationId - The ID of the station.
   * @returns The size of the current file in bytes.
   */
  getCurrentFileSize(stationId: string): number {
    return this.stations[stationId]?.currentFileSize || 0;
  }

  /**
   * Gets the current playback position of the file being played in a station.
   * @param stationId - The ID of the station.
   * @returns The current playback position in seconds.
   */
  getCurrentFilePosition(stationId: string): number {
    const station = this.stations[stationId];
    return station?.isPlaying ? (Date.now() - station.currentStartTime) / 1000 : 0;
  }
}
