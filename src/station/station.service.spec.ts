import { Test, TestingModule } from '@nestjs/testing';
import { StationService } from './station.service';
import { Station } from './models/station.model';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs');
jest.mock('uuid', () => ({
  v4: jest.fn(),
}));

describe('StationService', () => {
  let service: StationService;
  const mockStationId = 'mock-station-id';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StationService],
    }).compile();

    service = module.get<StationService>(StationService);

    // Mock implementations
    (uuidv4 as jest.Mock).mockReturnValue(mockStationId);
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    (fs.mkdirSync as jest.Mock).mockImplementation();
    (fs.readdirSync as jest.Mock).mockReturnValue([]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createStation', () => {
    it('should create a new station and return its ID', () => {
      const id = service.createStation();
      expect(id).toBe(mockStationId);
      expect(fs.mkdirSync).toHaveBeenCalledWith(path.join(__dirname, '..', '..', 'uploads', mockStationId));
    });

    it('should initialize the station queue', () => {
      const initializeStationQueueSpy = jest.spyOn(service as any, 'initializeStationQueue');
      service.createStation();
      expect(initializeStationQueueSpy).toHaveBeenCalledWith(mockStationId);
    });
  });

  describe('uploadMusic', () => {
    it('should upload a music file to a station', () => {
      const mockFile = {
        originalname: 'test.mp3',
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      const mockWriteStream = {
        write: jest.fn().mockImplementation((buffer, cb) => cb && cb()),
        end: jest.fn(),
        on: jest.fn(),
      };

      (fs.createWriteStream as jest.Mock).mockReturnValue(mockWriteStream);
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      service.createStation();
      const filePath = service.uploadMusic(mockStationId, mockFile);
      expect(filePath).toBe(path.join(__dirname, '..', '..', 'uploads', mockStationId, mockFile.originalname));
      expect(mockWriteStream.write).toHaveBeenCalledWith(mockFile.buffer, expect.any(Function));
      expect(mockWriteStream.end).toHaveBeenCalled();
    });

    it('should throw an error if the station does not exist', () => {
      const mockFile = {
        originalname: 'test.mp3',
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      expect(() => service.uploadMusic('non-existent-id', mockFile)).toThrowError('Station not found');
    });
  });

  describe('getCurrentFile', () => {
    it('should return the current file being played in a station', () => {
      service.createStation();
      const station = service['stations'][mockStationId];
      station.currentFile = 'test.mp3';
      const currentFile = service.getCurrentFile(mockStationId);
      expect(currentFile).toBe('test.mp3');
    });

    it('should return null if no file is being played in a station', () => {
      service.createStation();
      const currentFile = service.getCurrentFile(mockStationId);
      expect(currentFile).toBeNull();
    });
  });

  describe('getCurrentFileSize', () => {
    it('should return the size of the current file being played in a station', () => {
      service.createStation();
      const station = service['stations'][mockStationId];
      station.currentFileSize = 12345;
      const fileSize = service.getCurrentFileSize(mockStationId);
      expect(fileSize).toBe(12345);
    });

    it('should return 0 if no file is being played in a station', () => {
      service.createStation();
      const fileSize = service.getCurrentFileSize(mockStationId);
      expect(fileSize).toBe(0);
    });
  });

  describe('getCurrentFilePosition', () => {
    it('should return the current playback position of the file being played in a station', () => {
      service.createStation();
      const station = service['stations'][mockStationId];
      station.currentStartTime = Date.now() - 5000;
      station.isPlaying = true;
      const position = service.getCurrentFilePosition(mockStationId);
      expect(position).toBeCloseTo(5, 1);
    });

    it('should return 0 if no file is being played in a station', () => {
      service.createStation();
      const position = service.getCurrentFilePosition(mockStationId);
      expect(position).toBe(0);
    });
  });
});
