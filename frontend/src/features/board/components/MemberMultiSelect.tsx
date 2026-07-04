'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ProjectMember } from '@/features/projects/types';

interface MemberMultiSelectProps {
  members: ProjectMember[];
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MemberMultiSelect({
  members,
  value,
  onChange,
  disabled = false,
  placeholder = 'Select assignees...',
}: MemberMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedMembers = useMemo(
    () => members.filter((member) => value.includes(member.id)),
    [members, value],
  );

  const filteredMembers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return members;

    return members.filter(
      (member) =>
        member.name.toLowerCase().includes(normalized) ||
        member.email.toLowerCase().includes(normalized),
    );
  }, [members, query]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  const toggleMember = (memberId: string) => {
    if (disabled) return;

    if (value.includes(memberId)) {
      onChange(value.filter((id) => id !== memberId));
      return;
    }

    onChange([...value, memberId]);
  };

  const removeMember = (memberId: string) => {
    if (disabled) return;
    onChange(value.filter((id) => id !== memberId));
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setOpen((current) => !current);
          if (open) setQuery('');
        }}
        className={`flex min-h-[42px] w-full items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-left text-sm shadow-sm transition focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 ${
          disabled
            ? 'cursor-not-allowed bg-gray-50 opacity-70'
            : 'hover:border-gray-400'
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex min-w-0 flex-1 flex-wrap gap-1">
          {selectedMembers.length === 0 ? (
            <span className="text-gray-400">{placeholder}</span>
          ) : (
            selectedMembers.map((member) => (
              <span
                key={member.id}
                className="inline-flex max-w-full items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-800"
              >
                <span className="truncate">{member.name}</span>
                {!disabled && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(event) => {
                      event.stopPropagation();
                      removeMember(member.id);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        event.stopPropagation();
                        removeMember(member.id);
                      }
                    }}
                    className="rounded-full text-primary-500 hover:text-primary-700"
                    aria-label={`Remove ${member.name}`}
                  >
                    ×
                  </span>
                )}
              </span>
            ))
          )}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 text-gray-400 transition ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && !disabled && (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-100 p-2">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search members..."
              autoFocus
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <ul
            role="listbox"
            aria-multiselectable
            className="max-h-48 overflow-y-auto py-1"
          >
            {filteredMembers.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-500">
                No members found
              </li>
            ) : (
              filteredMembers.map((member) => {
                const selected = value.includes(member.id);
                return (
                  <li key={member.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => toggleMember(member.id)}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition ${
                        selected
                          ? 'bg-primary-50 text-primary-800'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                          selected
                            ? 'border-primary-600 bg-primary-600 text-white'
                            : 'border-gray-300 bg-white'
                        }`}
                        aria-hidden
                      >
                        {selected ? '✓' : ''}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium">
                          {member.name}
                        </span>
                        <span className="block truncate text-xs text-gray-500">
                          {member.email}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
