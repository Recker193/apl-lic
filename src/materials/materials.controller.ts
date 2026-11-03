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
import { IsOptional, IsString, IsUrl, ValidateIf } from 'class-validator';
import type { Response } from 'express';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { MaterialsService } from './materials.service';

class CreateMaterialDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @ValidateIf((_, value: unknown) => typeof value === 'string' && value.length > 0)
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
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateMaterialDto,
    @UploadedFile() file?: { buffer: Buffer; mimetype: string; size: number },
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
