import { ProjectRole } from '@prisma/client';
import { ALL_PERMISSIONS, type Permission } from './registry';

const ADMIN_PERMISSIONS: Permission[] = ALL_PERMISSIONS.filter(
  (p) => p !== 'project.edit' && p !== 'project.delete',
);

const MEMBER_PERMISSIONS: Permission[] = [
  'project.view',
  'board.view',
  'board.change_background',
  'column.create',
  'column.edit',
  'column.reorder',
  'task.view',
  'task.create',
  'task.edit',
  'task.delete',
  'task.move',
  'team.view',
  'label.assign',
  'comment.create',
  'attachment.upload',
  'attachment.delete',
];

export const DEFAULT_ROLE_PERMISSIONS: Record<ProjectRole, Permission[]> = {
  [ProjectRole.OWNER]: ALL_PERMISSIONS,
  [ProjectRole.ADMIN]: ADMIN_PERMISSIONS,
  [ProjectRole.MEMBER]: MEMBER_PERMISSIONS,
};

export function getDefaultRolePermissions(role: ProjectRole): Permission[] {
  return DEFAULT_ROLE_PERMISSIONS[role];
}
