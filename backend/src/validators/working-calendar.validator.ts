import { z } from 'zod';
import { objectIdSchema } from '../utils/pagination';
import { projectParamsSchema } from './project.validator';
import { sanitizeString } from '../utils/sanitize';

const apiDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');

export const workingCalendarParamsSchema = projectParamsSchema;

export const holidayParamsSchema = projectParamsSchema.extend({
  holidayId: objectIdSchema,
});

export const leaveParamsSchema = projectParamsSchema.extend({
  leaveId: objectIdSchema,
});

export const updateWorkingWeekdaysSchema = z.object({
  nonWorkingWeekdays: z
    .array(z.number().int().min(0).max(6))
    .max(7)
    .refine(
      (days) => new Set(days).size === days.length,
      'Weekday values must be unique',
    ),
});

export const createHolidaySchema = z.object({
  date: apiDateSchema,
  title: z
    .string()
    .max(120)
    .optional()
    .transform((v) => (v ? sanitizeString(v) : undefined)),
});

export const createLeaveSchema = z
  .object({
    userId: objectIdSchema,
    startDate: apiDateSchema,
    endDate: apiDateSchema,
    note: z
      .string()
      .max(300)
      .optional()
      .transform((v) => (v ? sanitizeString(v) : undefined)),
  })
  .superRefine((data, ctx) => {
    if (data.endDate < data.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'endDate must be on or after startDate',
        path: ['endDate'],
      });
    }
  });

export const completionsQuerySchema = z.object({
  userId: objectIdSchema,
  from: apiDateSchema,
  to: apiDateSchema,
});

export type UpdateWorkingWeekdaysInput = z.infer<
  typeof updateWorkingWeekdaysSchema
>;
export type CreateHolidayInput = z.infer<typeof createHolidaySchema>;
export type CreateLeaveInput = z.infer<typeof createLeaveSchema>;
export type CompletionsQuery = z.infer<typeof completionsQuerySchema>;
