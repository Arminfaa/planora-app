import { ApiError } from '../utils/ApiError';
import {
  addUtcDays,
  dayCountInclusive,
  eachUtcDayInclusive,
  formatApiDate,
  parseApiDate,
  toUtcDayStart,
  utcWeekday,
} from '../utils/api-dates';
import { projectMemberRepository } from '../repositories/project-member.repository';
import { workingCalendarRepository } from '../repositories/working-calendar.repository';
import { projectMemberService } from './project-member.service';
import { permissionService } from './permission.service';
import type {
  CompletionsQuery,
  CreateHolidayInput,
  CreateLeaveInput,
  UpdateWorkingWeekdaysInput,
} from '../validators/working-calendar.validator';

function serializeHoliday(holiday: {
  id: string;
  date: Date;
  title: string | null;
  createdAt: Date;
}) {
  return {
    id: holiday.id,
    date: formatApiDate(holiday.date),
    title: holiday.title,
    createdAt: holiday.createdAt.toISOString(),
  };
}

function serializeLeave(leave: {
  id: string;
  userId: string;
  startDate: Date;
  endDate: Date;
  note: string | null;
  createdAt: Date;
  user?: { id: string; name: string; avatar: string | null };
}) {
  return {
    id: leave.id,
    userId: leave.userId,
    startDate: formatApiDate(leave.startDate),
    endDate: formatApiDate(leave.endDate),
    note: leave.note,
    createdAt: leave.createdAt.toISOString(),
    user: leave.user
      ? {
          id: leave.user.id,
          name: leave.user.name,
          avatar: leave.user.avatar,
        }
      : undefined,
  };
}

export class WorkingCalendarService {
  async getCalendar(userId: string, projectIdOrSlug: string) {
    const projectId =
      await projectMemberService.resolveProjectId(projectIdOrSlug);
    await permissionService.ensurePermission(userId, projectId, 'board.view');

    const [nonWorkingWeekdays, holidays, leaves] = await Promise.all([
      workingCalendarRepository.getNonWorkingWeekdays(projectId),
      workingCalendarRepository.listHolidays(projectId),
      workingCalendarRepository.listLeaves(projectId),
    ]);

    return {
      nonWorkingWeekdays,
      holidays: holidays.map(serializeHoliday),
      leaves: leaves.map(serializeLeave),
    };
  }

  async updateWeekdays(
    userId: string,
    projectIdOrSlug: string,
    input: UpdateWorkingWeekdaysInput,
  ) {
    const projectId =
      await projectMemberService.resolveProjectId(projectIdOrSlug);
    await permissionService.ensurePermission(userId, projectId, 'project.edit');

    const updated = await workingCalendarRepository.updateNonWorkingWeekdays(
      projectId,
      input.nonWorkingWeekdays,
    );

    return { nonWorkingWeekdays: updated.nonWorkingWeekdays };
  }

  async createHoliday(
    userId: string,
    projectIdOrSlug: string,
    input: CreateHolidayInput,
  ) {
    const projectId =
      await projectMemberService.resolveProjectId(projectIdOrSlug);
    await permissionService.ensurePermission(userId, projectId, 'project.edit');

    const date = parseApiDate(input.date);

    try {
      const holiday = await workingCalendarRepository.createHoliday(
        projectId,
        date,
        input.title,
      );
      return serializeHoliday(holiday);
    } catch {
      throw new ApiError(409, 'A holiday already exists on this date');
    }
  }

  async deleteHoliday(
    userId: string,
    projectIdOrSlug: string,
    holidayId: string,
  ) {
    const projectId =
      await projectMemberService.resolveProjectId(projectIdOrSlug);
    await permissionService.ensurePermission(userId, projectId, 'project.edit');

    const holiday = await workingCalendarRepository.findHolidayById(holidayId);
    if (!holiday || holiday.projectId !== projectId) {
      throw new ApiError(404, 'Holiday not found');
    }

    await workingCalendarRepository.deleteHoliday(holidayId);
  }

  async createLeave(
    actorId: string,
    projectIdOrSlug: string,
    input: CreateLeaveInput,
  ) {
    const projectId =
      await projectMemberService.resolveProjectId(projectIdOrSlug);
    await permissionService.ensurePermission(
      actorId,
      projectId,
      'project.edit',
    );

    const membership = await projectMemberRepository.findByProjectAndUser(
      projectId,
      input.userId,
    );
    if (!membership) {
      throw new ApiError(400, 'User is not a member of this project');
    }

    const startDate = parseApiDate(input.startDate);
    const endDate = parseApiDate(input.endDate);

    const leave = await workingCalendarRepository.createLeave({
      projectId,
      userId: input.userId,
      startDate,
      endDate,
      note: input.note,
      createdById: actorId,
    });

    return serializeLeave(leave);
  }

  async deleteLeave(userId: string, projectIdOrSlug: string, leaveId: string) {
    const projectId =
      await projectMemberService.resolveProjectId(projectIdOrSlug);
    await permissionService.ensurePermission(userId, projectId, 'project.edit');

    const leave = await workingCalendarRepository.findLeaveById(leaveId);
    if (!leave || leave.projectId !== projectId) {
      throw new ApiError(404, 'Leave not found');
    }

    await workingCalendarRepository.deleteLeave(leaveId);
  }

  async getCompletions(
    actorId: string,
    projectIdOrSlug: string,
    query: CompletionsQuery,
  ) {
    const projectId =
      await projectMemberService.resolveProjectId(projectIdOrSlug);
    await permissionService.ensurePermission(actorId, projectId, 'board.view');

    const from = parseApiDate(query.from);
    const to = parseApiDate(query.to);
    if (to.getTime() < from.getTime()) {
      throw new ApiError(400, 'to must be on or after from');
    }

    const span = dayCountInclusive(from, to);
    if (span > 366) {
      throw new ApiError(400, 'Date range cannot exceed 366 days');
    }

    const membership = await projectMemberRepository.findByProjectAndUser(
      projectId,
      query.userId,
    );
    if (!membership) {
      throw new ApiError(400, 'User is not a member of this project');
    }

    const toEndExclusive = addUtcDays(to, 1);

    const [nonWorkingWeekdays, holidays, leaves, tasks, user] =
      await Promise.all([
        workingCalendarRepository.getNonWorkingWeekdays(projectId),
        workingCalendarRepository.listHolidays(projectId, from, to),
        workingCalendarRepository.listLeaves(projectId, {
          userId: query.userId,
          from,
          to,
        }),
        workingCalendarRepository.listCompletedTasksForAssignee({
          projectId,
          userId: query.userId,
          from,
          toEndExclusive,
        }),
        workingCalendarRepository.findUserBasic(query.userId),
      ]);

    const holidayByDay = new Map<string, { title: string | null }>();
    for (const holiday of holidays) {
      holidayByDay.set(formatApiDate(holiday.date), { title: holiday.title });
    }

    const leaveDays = new Set<string>();
    const leaveNoteByDay = new Map<string, string | null>();
    for (const leave of leaves) {
      for (const day of eachUtcDayInclusive(leave.startDate, leave.endDate)) {
        const key = formatApiDate(day);
        if (key < query.from || key > query.to) continue;
        leaveDays.add(key);
        if (!leaveNoteByDay.has(key)) {
          leaveNoteByDay.set(key, leave.note);
        }
      }
    }

    const counts = new Map<string, number>();
    for (const task of tasks) {
      if (!task.completeDate) continue;
      const key = formatApiDate(toUtcDayStart(task.completeDate));
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    const weekendSet = new Set(nonWorkingWeekdays);
    const days = eachUtcDayInclusive(from, to).map((day) => {
      const date = formatApiDate(day);
      const weekday = utcWeekday(day);
      const holiday = holidayByDay.get(date);
      const onLeave = leaveDays.has(date);

      let nonWorkingReason: 'weekend' | 'holiday' | 'leave' | null = null;
      if (holiday) nonWorkingReason = 'holiday';
      else if (onLeave) nonWorkingReason = 'leave';
      else if (weekendSet.has(weekday)) nonWorkingReason = 'weekend';

      return {
        date,
        weekday,
        completedCount: counts.get(date) ?? 0,
        isNonWorking: nonWorkingReason !== null,
        nonWorkingReason,
        holidayTitle: holiday?.title ?? null,
        leaveNote: onLeave ? (leaveNoteByDay.get(date) ?? null) : null,
      };
    });

    const workingDays = days.filter((day) => !day.isNonWorking);
    const completedOnWorkingDays = workingDays.reduce(
      (sum, day) => sum + day.completedCount,
      0,
    );
    const completedTotal = days.reduce(
      (sum, day) => sum + day.completedCount,
      0,
    );

    return {
      userId: query.userId,
      userName: user?.name ?? null,
      from: query.from,
      to: query.to,
      nonWorkingWeekdays,
      days,
      totals: {
        completedTotal,
        completedOnWorkingDays,
        workingDays: workingDays.length,
        nonWorkingDays: days.length - workingDays.length,
        averagePerWorkingDay:
          workingDays.length > 0
            ? Math.round((completedOnWorkingDays / workingDays.length) * 10) /
              10
            : 0,
      },
    };
  }
}

export const workingCalendarService = new WorkingCalendarService();
