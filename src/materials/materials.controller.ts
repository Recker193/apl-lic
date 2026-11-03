import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { IsOptional, IsString, IsUrl, ValidateIf } from 'class-validator';
import type { Response } from 'express';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { FileValidationPipe } from '../common/pipes/file-validation.pipe';
import type { UploadedBufferFile } from '../common/pipes/file-validation.pipe';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { MaterialsService } from './materials.service';

const MAX_UPLOAD_BYTES = Number(
  process.env.MAX_UPLOAD_BYTES ?? 10 * 1024 * 1024,
);
const uploadRateLimit = process.env.NODE_ENV === 'test' ? 1000 : 20;

function contentDisposition(title: string, fileKey?: string | null): string {
  const ext = fileKey?.includes('.') ? fileKey.split('.').pop() : undefined;
  const base =
    title
      .normalize('NFKD')
      .replace(/[^\w .-]+/g, '_')
      .trim()
      .slice(0, 80) || 'material';
  const asciiName = ext ? `${base}.${ext}` : base;
  const utf8Name = encodeURIComponent(
    ext ? `${title.slice(0, 80)}.${ext}` : title,
  );
  return `attachment; filename="${asciiName}"; filename*=UTF-8''${utf8Name}`;
}

class CreateMaterialDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @ValidateIf(
    (_, value: unknown) => typeof value === 'string' && value.length > 0,
  )
  @IsUrl()
  url?: string;
}

@Controller()
export class MaterialsController {
  constructor(private readonly service: MaterialsService) {}

  @Get('groups/:id/materials')
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.list(user, id);
  }

  @Post('groups/:id/materials')
  @Throttle({ default: { limit: uploadRateLimit, ttl: 60000 } })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
    }),
  )
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateMaterialDto,
    @UploadedFile(new FileValidationPipe()) file?: UploadedBufferFile,
  ) {
    if (dto.url) {
      return this.service.createLink(user, id, {
        title: dto.title,
        description: dto.description,
        url: dto.url,
      });
    }
    return this.service.createFile(
      user,
      id,
      { title: dto.title, description: dto.description },
      file,
    );
  }

  @Get('materials/:id')
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.get(user, id);
  }

  @Get('materials/:id/file')
  async download(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const file = await this.service.download(user, id);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader(
      'Content-Disposition',
      contentDisposition(file.title, file.fileKey),
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
    res.send(file.buffer);
  }

  @Delete('materials/:id')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.remove(user, id);
  }
}
