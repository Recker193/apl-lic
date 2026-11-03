import { Injectable } from '@nestjs/common';
import { createWriteStream, mkdirSync } from 'fs';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { randomUUID } from 'crypto';
import { loadEnv } from '../config/env';

const MIME_TO_EXT: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'text/plain': 'txt',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    'docx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation':
    'pptx',
  'application/zip': 'zip',
};

const FILE_KEY_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(pdf|png|jpg|txt|docx|pptx|zip)$/i;

@Injectable()
export class StorageService {
  allowedMimeTypes(): string[] {
    return Object.keys(MIME_TO_EXT);
  }

  isAllowedMime(mime: string): boolean {
    return mime in MIME_TO_EXT;
  }

  async save(buffer: Buffer, mimeType: string): Promise<string> {
    const ext = MIME_TO_EXT[mimeType];
    if (!ext) {
      throw new Error('Unsupported mime type');
    }
    const env = loadEnv();
    mkdirSync(env.storageDir, { recursive: true });
    const fileKey = `${randomUUID()}.${ext}`;
    const path = join(env.storageDir, fileKey);
    // 0o640: fără drepturi de execuție pentru fișierele încărcate.
    await pipeline(
      Readable.from(buffer),
      createWriteStream(path, { mode: 0o640 }),
    );
    return fileKey;
  }

  async read(fileKey: string): Promise<Buffer> {
    if (!FILE_KEY_PATTERN.test(fileKey)) {
      throw new Error('Invalid file key');
    }
    const env = loadEnv();
    return readFile(join(env.storageDir, fileKey));
  }
}
