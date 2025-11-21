import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';

export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array(),
    });
  };
};

export const isValidUsername = (username: string): boolean => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidVibrationPattern = (pattern: any): boolean => {
  if (!pattern || typeof pattern !== 'object') {
    return false;
  }

  const { intervals, intensities } = pattern;

  if (!Array.isArray(intervals) || !Array.isArray(intensities)) {
    return false;
  }

  if (intervals.length === 0 || intervals.length !== intensities.length) {
    return false;
  }

  // Check that all intervals are positive numbers
  if (!intervals.every((val: any) => typeof val === 'number' && val > 0)) {
    return false;
  }

  // Check that all intensities are between 0 and 1
  if (!intensities.every((val: any) => typeof val === 'number' && val >= 0 && val <= 1)) {
    return false;
  }

  // Maximum 20 intervals for performance
  if (intervals.length > 20) {
    return false;
  }

  return true;
};
