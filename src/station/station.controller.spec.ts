import { Test, TestingModule } from '@nestjs/testing';
import { StationController } from './station.controller';

describe('MusicController', () => {
  let controller: StationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StationController],
    }).compile();

    controller = module.get<StationController>(StationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
