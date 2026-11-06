import { Test, TestingModule } from '@nestjs/testing';
import { GradesCalculationService } from './grades-calculation.service';
import { GradeStatus, GradeType } from '@prisma/client';

describe('GradesCalculationService', () => {
  let service: GradesCalculationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GradesCalculationService],
    }).compile();

    service = module.get<GradesCalculationService>(GradesCalculationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateSimpleAverage', () => {
    it('should calculate average of valid grades', () => {
      const grades = [
        { value: 8, type: GradeType.TEST, status: GradeStatus.ACTIVE },
        { value: 9, type: GradeType.ORAL, status: GradeStatus.ACTIVE },
        { value: 7, type: GradeType.HOMEWORK, status: GradeStatus.ACTIVE },
      ];

      const result = service.calculateSimpleAverage(grades);
      expect(result).toBe(8.0);
    });

    it('should exclude voided grades', () => {
      const grades = [
        { value: 8, type: GradeType.TEST, status: GradeStatus.ACTIVE },
        { value: 9, type: GradeType.ORAL, status: GradeStatus.VOIDED },
        { value: 7, type: GradeType.HOMEWORK, status: GradeStatus.ACTIVE },
      ];

      const result = service.calculateSimpleAverage(grades);
      expect(result).toBe(7.5);
    });

    it('should return null for no grades', () => {
      const grades: any[] = [];
      const result = service.calculateSimpleAverage(grades);
      expect(result).toBeNull();
    });

    it('should return null when all grades are voided', () => {
      const grades = [
        { value: 8, type: GradeType.TEST, status: GradeStatus.VOIDED },
        { value: 9, type: GradeType.ORAL, status: GradeStatus.VOIDED },
      ];

      const result = service.calculateSimpleAverage(grades);
      expect(result).toBeNull();
    });

    it('should round to 2 decimal places', () => {
      const grades = [
        { value: 8, type: GradeType.TEST, status: GradeStatus.ACTIVE },
        { value: 9, type: GradeType.ORAL, status: GradeStatus.ACTIVE },
      ];

      const result = service.calculateSimpleAverage(grades);
      expect(result).toBe(8.5);
    });
  });

  describe('calculateSemesterAverage', () => {
    it('should calculate simple average without thesis', () => {
      const grades = [
        { value: 8, type: GradeType.TEST, status: GradeStatus.ACTIVE },
        { value: 9, type: GradeType.ORAL, status: GradeStatus.ACTIVE },
      ];

      const result = service.calculateSemesterAverage(grades);
      expect(result.average).toBe(8.5);
      expect(result.gradeCount).toBe(2);
      expect(result.thesis).toBeUndefined();
    });

    it('should calculate weighted average with thesis', () => {
      const grades = [
        { value: 8, type: GradeType.TEST, status: GradeStatus.ACTIVE },
        { value: 9, type: GradeType.ORAL, status: GradeStatus.ACTIVE },
      ];

      const result = service.calculateSemesterAverage(grades, 10);
      expect(result.average).toBe(9); // (3 * 8.5 + 10) / 4 = 8.875 -> 9
      expect(result.gradeCount).toBe(2);
      expect(result.thesis).toBe(10);
    });

    it('should return 0 average for no grades', () => {
      const grades: any[] = [];
      const result = service.calculateSemesterAverage(grades);
      expect(result.average).toBe(0);
      expect(result.gradeCount).toBe(0);
    });

    it('should round thesis calculation to integer', () => {
      const grades = [
        { value: 7, type: GradeType.TEST, status: GradeStatus.ACTIVE },
        { value: 8, type: GradeType.ORAL, status: GradeStatus.ACTIVE },
      ];

      const result = service.calculateSemesterAverage(grades, 9);
      expect(result.average).toBe(8); // (3 * 7.5 + 9) / 4 = 7.875 -> 8
    });
  });

  describe('calculateAnnualAverage', () => {
    it('should calculate annual average from two semesters', () => {
      const result = service.calculateAnnualAverage(8.5, 9.0);
      expect(result).toBe(8.75);
    });

    it('should return null if one semester is null', () => {
      const result = service.calculateAnnualAverage(8.5, null);
      expect(result).toBeNull();
    });

    it('should return null if both semesters are null', () => {
      const result = service.calculateAnnualAverage(null, null);
      expect(result).toBeNull();
    });
  });

  describe('needsRetake', () => {
    it('should return true for average below 5', () => {
      expect(service.needsRetake(4.5)).toBe(true);
      expect(service.needsRetake(4.99)).toBe(true);
    });

    it('should return false for average 5 or above', () => {
      expect(service.needsRetake(5)).toBe(false);
      expect(service.needsRetake(6)).toBe(false);
      expect(service.needsRetake(10)).toBe(false);
    });
  });

  describe('needsToRepeatYear', () => {
    it('should return true if more than 2 subjects failed', () => {
      const subjectAverages = [4, 4, 4, 8];
      const conductGrades = [7];
      expect(service.needsToRepeatYear(subjectAverages, conductGrades)).toBe(true);
    });

    it('should return false if 2 or fewer subjects failed', () => {
      const subjectAverages = [4, 4, 8, 9];
      const conductGrades = [7];
      expect(service.needsToRepeatYear(subjectAverages, conductGrades)).toBe(false);
    });

    it('should return true if conduct grade is below 5', () => {
      const subjectAverages = [8, 9, 10];
      const conductGrades = [4];
      expect(service.needsToRepeatYear(subjectAverages, conductGrades)).toBe(true);
    });

    it('should return false if all conditions are met', () => {
      const subjectAverages = [8, 9, 10];
      const conductGrades = [7];
      expect(service.needsToRepeatYear(subjectAverages, conductGrades)).toBe(false);
    });
  });
});
