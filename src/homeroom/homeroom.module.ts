import { Module } from '@nestjs/common';
import { HomeroomController } from './homeroom.controller';
import { HomeroomService } from './homeroom.service';

@Module({
  controllers: [HomeroomController],
  providers: [HomeroomService],
  exports: [HomeroomService],
})
export class HomeroomModule {}
