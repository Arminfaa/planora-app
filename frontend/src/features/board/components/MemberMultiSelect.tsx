'use client';

import { Select } from 'antd';
import { useMemo } from 'react';
import type { ProjectMember } from '@/features/projects/types';
import { cn } from '@/lib/utils';

interface MemberMultiSelectProps {
  members: ProjectMember[];
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function MemberMultiSelect({
  members,
  value,
  onChange,
  disabled = false,
  placeholder = 'Select assignees...',
  className,
}: MemberMultiSelectProps) {
  const memberById = useMemo(
    () => new Map(members.map((member) => [member.id, member])),
    [members],
  );

  const options = useMemo(
    () =>
      members.map((member) => ({
        value: member.id,
        label: member.name,
      })),
    [members],
  );

  return (
    <Select
      mode="multiple"
      allowClear
      showSearch
      disabled={disabled}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      options={options}
      optionFilterProp="label"
      filterOption={(input, option) => {
        const member = memberById.get(String(option?.value));
        if (!member) return false;

        const query = input.trim().toLowerCase();
        return (
          member.name.toLowerCase().includes(query) ||
          member.email.toLowerCase().includes(query)
        );
      }}
      optionRender={(option) => {
        const member = memberById.get(String(option.value));
        if (!member) return option.label;

        return (
          <div className="py-0.5">
            <div className="font-medium text-gray-900">{member.name}</div>
            <div className="text-xs text-gray-500">{member.email}</div>
          </div>
        );
      }}
      maxTagCount="responsive"
      className={cn('w-full', className)}
      getPopupContainer={() => document.body}
    />
  );
}
