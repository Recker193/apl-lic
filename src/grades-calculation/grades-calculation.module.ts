import { Module } from '@nestjs/common';
import { GradesCalculationService } from './grades-calculation.service';

@Module({
  providers: [GradesCalculationService],
  exports: [GradesCalculationService],
})
export class GradesCalculationModule {}
