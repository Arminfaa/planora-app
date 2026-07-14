import type { Response } from 'express';
import type { AuthenticatedRequest } from '../types';
import { workingCalendarService } from '../services/working-calendar.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { getParam } from '../utils/params';
import type {
  CompletionsQuery,
  CreateHolidayInput,
  CreateLeaveInput,
  UpdateWorkingWeekdaysInput,
} from '../validators/working-calendar.validator';

export const getWorkingCalendar = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const calendar = await workingCalendarService.getCalendar(
      req.user!.userId,
      getParam(req.params, 'id'),
    );
    ApiResponse.success(res, calendar, 'Working calendar retrieved');
  },
);

export const updateWorkingWeekdays = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const result = await workingCalendarService.updateWeekdays(
      req.user!.userId,
      getParam(req.params, 'id'),
      req.body as UpdateWorkingWeekdaysInput,
    );
    ApiResponse.success(res, result, 'Working weekdays updated');
  },
);

export const createHoliday = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const holiday = await workingCalendarService.createHoliday(
      req.user!.userId,
      getParam(req.params, 'id'),
      req.body as CreateHolidayInput,
    );
    ApiResponse.success(res, holiday, 'Holiday created', 201);
  },
);

export const deleteHoliday = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    await workingCalendarService.deleteHoliday(
      req.user!.userId,
      getParam(req.params, 'id'),
      getParam(req.params, 'holidayId'),
    );
    ApiResponse.success(res, null, 'Holiday deleted');
  },
);

export const createLeave = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const leave = await workingCalendarService.createLeave(
      req.user!.userId,
      getParam(req.params, 'id'),
      req.body as CreateLeaveInput,
    );
    ApiResponse.success(res, leave, 'Leave created', 201);
  },
);

export const deleteLeave = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    await workingCalendarService.deleteLeave(
      req.user!.userId,
      getParam(req.params, 'id'),
      getParam(req.params, 'leaveId'),
    );
    ApiResponse.success(res, null, 'Leave deleted');
  },
);

export const getPersonCompletions = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const result = await workingCalendarService.getCompletions(
      req.user!.userId,
      getParam(req.params, 'id'),
      req.query as unknown as CompletionsQuery,
    );
    ApiResponse.success(res, result, 'Person completions retrieved');
  },
);
