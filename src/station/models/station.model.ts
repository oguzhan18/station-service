import { PassThrough } from 'stream';

/**
 * Represents a radio station.
 */

export interface Station {
    id: string;
    musicQueue: string[];
    currentFile: string | null;
    currentStream: PassThrough | null;
    currentStartTime: number;
    currentFileSize: number;
    activeClients: PassThrough[];
    isPlaying: boolean;
    buffer: Buffer[];
  }