export const PERMISSIONS = [
  'project.view',
  'project.edit',
  'project.delete',
  'board.view',
  'board.create',
  'board.edit',
  'board.delete',
  'board.reorder',
  'board.change_background',
  'column.create',
  'column.edit',
  'column.delete',
  'column.reorder',
  'task.view',
  'task.create',
  'task.edit',
  'task.delete',
  'task.move',
  'team.view',
  'team.invite',
  'team.change_role',
  'team.remove',
  'team.manage_invites',
  'label.create',
  'label.edit',
  'label.delete',
  'label.assign',
  'comment.create',
  'comment.edit_any',
  'comment.delete_any',
  'attachment.upload',
  'attachment.delete',
  'group.view',
  'group.send',
  'group.upload',
  'group.delete_any',
  'role.manage',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const PERMISSION_SET = new Set<string>(PERMISSIONS);

export function isValidPermission(value: string): value is Permission {
  return PERMISSION_SET.has(value);
}

export const PERMISSION_GROUPS: {
  key: string;
  label: string;
  permissions: { key: Permission; label: string }[];
}[] = [
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
      { key: 'board.view', label: 'View boards' },
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
      { key: 'task.view', label: 'View tasks' },
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
    key: 'group',
    label: 'Project group',
    permissions: [
      { key: 'group.view', label: 'View project group' },
      { key: 'group.send', label: 'Send messages' },
      { key: 'group.upload', label: 'Upload files in group' },
      { key: 'group.delete_any', label: 'Delete any group message' },
    ],
  },
  {
    key: 'role',
    label: 'Roles',
    permissions: [{ key: 'role.manage', label: 'Manage custom roles' }],
  },
];

export const ALL_PERMISSIONS: Permission[] = [...PERMISSIONS];
