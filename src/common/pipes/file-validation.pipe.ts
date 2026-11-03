import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import {
  ALLOWED_UPLOAD_MIME_TYPES,
  detectMimeFromSignature,
} from './file-signature';

export type UploadedBufferFile = {
  buffer: Buffer;
  mimetype: string;
  size: number;
};

/**
 * Verifică fișierul încărcat pe baza magic bytes. Un fișier absent trece
 * neschimbat (materialele pot fi și linkuri). Tipul declarat de client trebuie
 * să coincidă cu cel detectat; în caz contrar fișierul este respins.
 */
@Injectable()
export class FileValidationPipe implements PipeTransform<
  UploadedBufferFile | undefined
> {
  transform(file: UploadedBufferFile | undefined) {
    if (!file) {
      return file;
    }
    const detected = detectMimeFromSignature(file.buffer);
    if (!detected || !ALLOWED_UPLOAD_MIME_TYPES.includes(detected)) {
      throw new BadRequestException('File type not allowed');
    }
    if (file.mimetype !== detected) {
      throw new BadRequestException('File content does not match its type');
    }
    return { ...file, mimetype: detected };
  }
}
