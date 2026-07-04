export const PERMISSION_GROUPS = [
  {
    key: 'project',
    label: 'Project',
    permissions: [
      { key: 'project.view', label: 'View project' },
      { key: 'project.edit', label: 'Edit project' },
      { key: 'project.delete', label: 'Delete project' },
    ],
  },
  {
    key: 'board',
    label: 'Board',
    permissions: [
      { key: 'board.create', label: 'Create board' },
      { key: 'board.edit', label: 'Edit board' },
      { key: 'board.delete', label: 'Delete board' },
      { key: 'board.reorder', label: 'Reorder boards' },
      { key: 'board.change_background', label: 'Change board background' },
    ],
  },
  {
    key: 'column',
    label: 'Column',
    permissions: [
      { key: 'column.create', label: 'Create column' },
      { key: 'column.edit', label: 'Edit column' },
      { key: 'column.delete', label: 'Delete column' },
      { key: 'column.reorder', label: 'Reorder columns' },
    ],
  },
  {
    key: 'task',
    label: 'Task',
    permissions: [
      { key: 'task.create', label: 'Create task' },
      { key: 'task.edit', label: 'Edit task' },
      { key: 'task.delete', label: 'Delete task' },
      { key: 'task.move', label: 'Move / reorder tasks' },
    ],
  },
  {
    key: 'team',
    label: 'Team',
    permissions: [
      { key: 'team.view', label: 'View team' },
      { key: 'team.invite', label: 'Invite members' },
      { key: 'team.change_role', label: 'Change member roles' },
      { key: 'team.remove', label: 'Remove members' },
      { key: 'team.manage_invites', label: 'Manage pending invites' },
    ],
  },
  {
    key: 'label',
    label: 'Labels',
    permissions: [
      { key: 'label.create', label: 'Create labels' },
      { key: 'label.edit', label: 'Edit labels' },
      { key: 'label.delete', label: 'Delete labels' },
      { key: 'label.assign', label: 'Assign labels to tasks' },
    ],
  },
  {
    key: 'comment',
    label: 'Comments',
    permissions: [
      { key: 'comment.create', label: 'Create comments' },
      { key: 'comment.edit_any', label: 'Edit any comment' },
      { key: 'comment.delete_any', label: 'Delete any comment' },
    ],
  },
  {
    key: 'attachment',
    label: 'Attachments',
    permissions: [
      { key: 'attachment.upload', label: 'Upload attachments' },
      { key: 'attachment.delete', label: 'Delete attachments' },
    ],
  },
  {
    key: 'role',
    label: 'Roles',
    permissions: [{ key: 'role.manage', label: 'Manage custom roles' }],
  },
] as const;

export type Permission =
  (typeof PERMISSION_GROUPS)[number]['permissions'][number]['key'];

export type PermissionGroup = (typeof PERMISSION_GROUPS)[number];

export function hasPermission(
  permissions: string[] | undefined,
  permission: Permission,
): boolean {
  return permissions?.includes(permission) ?? false;
}
