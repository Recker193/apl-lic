import { Module } from '@nestjs/common';
import { SchoolsController } from './schools.controller';
import { SeedService } from './seed.service';

@Module({
  controllers: [SchoolsController],
  providers: [SeedService],
  exports: [SeedService],
})
export class SchoolsModule {}
