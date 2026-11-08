import { Module } from '@nestjs/common';
import { GradesCalculationModule } from '../grades-calculation/grades-calculation.module';
import { GradesController } from './grades.controller';
import { GradesService } from './grades.service';

@Module({
  imports: [GradesCalculationModule],
  controllers: [GradesController],
  providers: [GradesService],
  exports: [GradesService],
})
export class GradesModule {}
