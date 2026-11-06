import { Injectable } from '@nestjs/common';
import { GradeStatus, GradeType } from '@prisma/client';

export interface GradeForCalculation {
  value: number;
  type: GradeType;
  status: GradeStatus;
}

export interface AverageResult {
  average: number;
  gradeCount: number;
  thesis?: number;
}

@Injectable()
export class GradesCalculationService {
  /**
   * Calculate the average of grades (excluding voided ones)
   * Returns null if there are no valid grades
   */
  calculateSimpleAverage(grades: GradeForCalculation[]): number | null {
    const validGrades = grades.filter((g) => g.status === GradeStatus.ACTIVE);

    if (validGrades.length === 0) {
      return null;
    }

    const sum = validGrades.reduce((acc, g) => acc + g.value, 0);
    const average = sum / validGrades.length;

    // Round to 2 decimal places
    return Math.round(average * 100) / 100;
  }

  /**
   * Calculate semester average with optional thesis
   * Formula: (3 * average_grades + thesis) / 4, rounded to integer
   * If no thesis, returns simple average rounded to 2 decimal places
   */
  calculateSemesterAverage(
    grades: GradeForCalculation[],
    thesis?: number,
  ): AverageResult {
    const validGrades = grades.filter((g) => g.status === GradeStatus.ACTIVE);

    if (validGrades.length === 0) {
      return {
        average: 0,
        gradeCount: 0,
        thesis,
      };
    }

    const simpleAverage = this.calculateSimpleAverage(validGrades)!;

    if (thesis !== undefined) {
      // Formula: (3 * average + thesis) / 4
      const weightedAverage = (3 * simpleAverage + thesis) / 4;
      // Round to integer according to school regulations
      const roundedAverage = Math.round(weightedAverage);

      return {
        average: roundedAverage,
        gradeCount: validGrades.length,
        thesis,
      };
    }

    return {
      average: simpleAverage,
      gradeCount: validGrades.length,
    };
  }

  /**
   * Calculate annual average from two semester averages
   * Returns null if either semester has no grades
   */
  calculateAnnualAverage(
    semester1Average: number | null,
    semester2Average: number | null,
  ): number | null {
    if (semester1Average === null || semester2Average === null) {
      return null;
    }

    const annualAverage = (semester1Average + semester2Average) / 2;
    return Math.round(annualAverage * 100) / 100;
  }

  /**
   * Determine if a student needs to retake a subject (corigență)
   * Average below 5 means corigență
   */
  needsRetake(average: number): boolean {
    return average < 5;
  }

  /**
   * Determine if a student needs to repeat the year (repetent)
   * This is a simplified check - actual logic may be more complex
   */
  needsToRepeatYear(
    subjectAverages: number[],
    conductGrades: number[],
  ): boolean {
    // If more than 2 subjects have average below 5
    const failedSubjects = subjectAverages.filter((a) => a < 5).length;

    // Or if conduct grade is below 5
    const lowConduct = conductGrades.some((c) => c < 5);

    return failedSubjects > 2 || lowConduct;
  }
}
