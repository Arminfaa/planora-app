import { BaseRepository } from './base.repository';

export class WorkingCalendarRepository extends BaseRepository {
  async getNonWorkingWeekdays(projectId: string): Promise<number[]> {
    const project = await this.db.project.findUnique({
      where: { id: projectId },
      select: { nonWorkingWeekdays: true },
    });
    return project?.nonWorkingWeekdays ?? [5];
  }

  async updateNonWorkingWeekdays(projectId: string, weekdays: number[]) {
    return this.db.project.update({
      where: { id: projectId },
      data: { nonWorkingWeekdays: weekdays },
      select: { id: true, nonWorkingWeekdays: true },
    });
  }

  async listHolidays(projectId: string, from?: Date, to?: Date) {
    return this.db.projectHoliday.findMany({
      where: {
        projectId,
        ...(from || to
          ? {
              date: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {}),
              },
            }
          : {}),
      },
      orderBy: { date: 'asc' },
    });
  }

  async createHoliday(projectId: string, date: Date, title?: string) {
    return this.db.projectHoliday.create({
      data: {
        projectId,
        date,
        title: title ?? null,
      },
    });
  }

  async findHolidayById(holidayId: string) {
    return this.db.projectHoliday.findUnique({ where: { id: holidayId } });
  }

  async deleteHoliday(holidayId: string) {
    return this.db.projectHoliday.delete({ where: { id: holidayId } });
  }

  async listLeaves(
    projectId: string,
    options?: { userId?: string; from?: Date; to?: Date },
  ) {
    const from = options?.from;
    const to = options?.to;

    return this.db.memberLeave.findMany({
      where: {
        projectId,
        ...(options?.userId ? { userId: options.userId } : {}),
        ...(from || to
          ? {
              AND: [
                ...(to ? [{ startDate: { lte: to } }] : []),
                ...(from ? [{ endDate: { gte: from } }] : []),
              ],
            }
          : {}),
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async createLeave(data: {
    projectId: string;
    userId: string;
    startDate: Date;
    endDate: Date;
    note?: string;
    createdById: string;
  }) {
    return this.db.memberLeave.create({
      data: {
        projectId: data.projectId,
        userId: data.userId,
        startDate: data.startDate,
        endDate: data.endDate,
        note: data.note ?? null,
        createdById: data.createdById,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });
  }

  async findLeaveById(leaveId: string) {
    return this.db.memberLeave.findUnique({ where: { id: leaveId } });
  }

  async deleteLeave(leaveId: string) {
    return this.db.memberLeave.delete({ where: { id: leaveId } });
  }

  async listCompletedTasksForAssignee(params: {
    projectId: string;
    userId: string;
    from: Date;
    toEndExclusive: Date;
  }) {
    return this.db.task.findMany({
      where: {
        column: { board: { projectId: params.projectId } },
        isCompleted: true,
        completeDate: {
          gte: params.from,
          lt: params.toEndExclusive,
        },
        assigneeIds: { has: params.userId },
      },
      select: {
        id: true,
        completeDate: true,
      },
    });
  }

  async findUserBasic(userId: string) {
    return this.db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, avatar: true },
    });
  }
}

export const workingCalendarRepository = new WorkingCalendarRepository();
