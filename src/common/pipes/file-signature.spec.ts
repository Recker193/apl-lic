import { BadRequestException } from '@nestjs/common';
import { detectMimeFromSignature } from './file-signature';
import { FileValidationPipe } from './file-validation.pipe';

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]);
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10]);
const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const PPTX_MIME =
  'application/vnd.openxmlformats-officedocument.presentationml.presentation';

function zip(entryName?: string): Buffer {
  return Buffer.concat([
    Buffer.from([0x50, 0x4b, 0x03, 0x04]),
    Buffer.from(entryName ?? 'other.bin'),
  ]);
}

describe('detectMimeFromSignature', () => {
  it('detects pdf, png and jpeg', () => {
    expect(detectMimeFromSignature(Buffer.from('%PDF-1.7 x'))).toBe(
      'application/pdf',
    );
    expect(detectMimeFromSignature(PNG)).toBe('image/png');
    expect(detectMimeFromSignature(JPEG)).toBe('image/jpeg');
  });

  it('distinguishes docx, pptx and generic zip', () => {
    expect(detectMimeFromSignature(zip('word/document.xml'))).toBe(DOCX_MIME);
    expect(detectMimeFromSignature(zip('ppt/presentation.xml'))).toBe(
      PPTX_MIME,
    );
    expect(detectMimeFromSignature(zip())).toBe('application/zip');
  });

  it('accepts valid utf-8 text', () => {
    expect(detectMimeFromSignature(Buffer.from('Salut, lume ăâî'))).toBe(
      'text/plain',
    );
  });

  it('rejects executables, binary data and empty files', () => {
    expect(
      detectMimeFromSignature(Buffer.from('MZ\x90\x00\x03\x00')),
    ).toBeNull();
    expect(
      detectMimeFromSignature(Buffer.from([0x7f, 0x45, 0x4c, 0x46, 0])),
    ).toBeNull();
    expect(detectMimeFromSignature(Buffer.from([0xc3, 0x28]))).toBeNull();
    expect(detectMimeFromSignature(Buffer.alloc(0))).toBeNull();
  });
});

describe('FileValidationPipe', () => {
  const pipe = new FileValidationPipe();

  it('passes through a missing file', () => {
    expect(pipe.transform(undefined)).toBeUndefined();
  });

  it('accepts a file whose declared type matches its content', () => {
    const buffer = Buffer.from('%PDF-1.4 ok');
    const result = pipe.transform({
      buffer,
      mimetype: 'application/pdf',
      size: buffer.length,
    });
    expect(result?.mimetype).toBe('application/pdf');
  });

  it('rejects a file whose declared type differs from its content', () => {
    expect(() =>
      pipe.transform({ buffer: PNG, mimetype: 'application/pdf', size: 9 }),
    ).toThrow(BadRequestException);
  });

  it('rejects content with an unknown signature', () => {
    expect(() =>
      pipe.transform({
        buffer: Buffer.from('MZ\x90\x00'),
        mimetype: 'application/pdf',
        size: 4,
      }),
    ).toThrow(BadRequestException);
  });
});
