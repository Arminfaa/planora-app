'use client';

import { useState } from 'react';
import { Checkbox } from 'antd';
import {
  PERMISSION_GROUPS,
  type Permission,
} from '@/features/permissions/registry';
import type { CustomRoleInput } from '@/features/projects/types';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';

interface CustomRolesBuilderProps {
  roles: CustomRoleInput[];
  onChange: (roles: CustomRoleInput[]) => void;
}

function emptyRole(): CustomRoleInput {
  return { name: '', permissions: [] };
}

export function CustomRolesBuilder({
  roles,
  onChange,
}: CustomRolesBuilderProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(
    roles.length > 0 ? 0 : null,
  );

  const updateRole = (index: number, patch: Partial<CustomRoleInput>) => {
    onChange(
      roles.map((role, i) => (i === index ? { ...role, ...patch } : role)),
    );
  };

  const togglePermission = (index: number, permission: string) => {
    const role = roles[index];
    const permissions = role.permissions.includes(permission)
      ? role.permissions.filter((p) => p !== permission)
      : [...role.permissions, permission];
    updateRole(index, { permissions });
  };

  const toggleGroup = (index: number, groupKey: string, checked: boolean) => {
    const group = PERMISSION_GROUPS.find((g) => g.key === groupKey);
    if (!group) return;

    const groupKeys = group.permissions.map((p) => p.key);
    const role = roles[index];
    const permissions = checked
      ? [...new Set([...role.permissions, ...groupKeys])]
      : role.permissions.filter((p) => !groupKeys.includes(p as Permission));
    updateRole(index, { permissions });
  };

  const addRole = () => {
    onChange([...roles, emptyRole()]);
    setExpandedIndex(roles.length);
  };

  const removeRole = (index: number) => {
    onChange(roles.filter((_, i) => i !== index));
    setExpandedIndex((prev) => {
      if (prev === null) return null;
      if (prev === index) return null;
      if (prev > index) return prev - 1;
      return prev;
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-900">Custom roles</p>
        <Button type="button" variant="secondary" onClick={addRole}>
          Add role
        </Button>
      </div>

      {roles.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500">
          Add at least one role with permissions.
        </p>
      ) : (
        roles.map((role, index) => {
          const isExpanded = expandedIndex === index;
          const roleKey = role.id ?? `new-${index}`;

          return (
            <div
              key={roleKey}
              className="rounded-lg border border-gray-200 bg-gray-50/50"
            >
              <button
                type="button"
                onClick={() => setExpandedIndex(isExpanded ? null : index)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {role.name.trim() || `Role ${index + 1}`}
                  </p>
                  <p className="text-xs text-gray-500">
                    {role.permissions.length} permission
                    {role.permissions.length === 1 ? '' : 's'}
                  </p>
                </div>
                <span className="text-gray-400">{isExpanded ? '−' : '+'}</span>
              </button>

              {isExpanded && (
                <div className="space-y-4 border-t border-gray-200 px-4 py-4">
                  <Input
                    label="Role name"
                    value={role.name}
                    onChange={(event) =>
                      updateRole(index, { name: event.target.value })
                    }
                    placeholder="e.g. Project Manager"
                  />

                  <div className="space-y-3">
                    {PERMISSION_GROUPS.map((group) => {
                      const groupKeys = group.permissions.map((p) => p.key);
                      const selectedCount = groupKeys.filter((key) =>
                        role.permissions.includes(key),
                      ).length;
                      const allSelected = selectedCount === groupKeys.length;
                      const someSelected = selectedCount > 0 && !allSelected;

                      return (
                        <div
                          key={group.key}
                          className="rounded-lg border border-gray-200 bg-white p-3"
                        >
                          <Checkbox
                            indeterminate={someSelected}
                            checked={allSelected}
                            onChange={(event) =>
                              toggleGroup(
                                index,
                                group.key,
                                event.target.checked,
                              )
                            }
                            className="text-sm font-medium text-gray-800"
                          >
                            {group.label}
                          </Checkbox>
                          <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                            {group.permissions.map((permission) => (
                              <Checkbox
                                key={permission.key}
                                checked={role.permissions.includes(
                                  permission.key,
                                )}
                                onChange={() =>
                                  togglePermission(index, permission.key)
                                }
                                className="text-sm text-gray-600"
                              >
                                {permission.label}
                              </Checkbox>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {roles.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => removeRole(index)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      Remove role
                    </Button>
                  )}
                  {roles.length === 1 && !role.id && (
                    <p className="text-xs text-gray-500">
                      At least one role is required.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
