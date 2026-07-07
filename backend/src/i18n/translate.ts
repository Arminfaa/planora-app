import { getRequestLocale } from './context';
import { faMessages, faPatterns } from './fa';
import type { Locale } from './types';

function interpolate(
  template: string,
  vars: Record<string, string | number | undefined>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = vars[key];
    return value === undefined || value === null ? '' : String(value);
  });
}

export function translateMessage(
  message: string,
  locale: Locale = getRequestLocale(),
  vars?: Record<string, string | number | undefined>,
): string {
  let output = message;

  if (locale === 'fa') {
    if (faMessages[message]) {
      output = faMessages[message];
    } else {
      for (const { pattern, replace } of faPatterns) {
        const match = message.match(pattern);
        if (match) {
          output = replace(match);
          break;
        }
      }
    }
  }

  if (vars) {
    output = interpolate(output, vars);
  }

  return output;
}

export function translateMessages(
  messages: string[],
  locale: Locale = getRequestLocale(),
): string[] {
  return messages.map((message) => translateMessage(message, locale));
}

export function t(
  key: string,
  vars?: Record<string, string | number | undefined>,
  locale: Locale = getRequestLocale(),
): string {
  const template =
    locale === 'fa'
      ? (faMessages[key] ?? key)
      : key.replace(/^notification\./, '');
  if (locale === 'en' && key.startsWith('notification.')) {
    return interpolate(getEnglishNotificationTemplate(key), vars ?? {});
  }
  return interpolate(template, vars ?? {});
}

const englishNotificationTemplates: Record<string, string> = {
  'notification.task.created.title': 'New task on {boardName}',
  'notification.task.created.body': '{actorName} created {taskTitle}',
  'notification.task.updated.title': 'Task updated on {boardName}',
  'notification.task.updated.body': '{actorName} updated {taskTitle}',
  'notification.task.moved.title': 'Task moved on {boardName}',
  'notification.task.moved.body': '{actorName} moved {taskTitle}',
  'notification.task.moved.fromTo.body':
    '{actorName} moved {taskTitle} from "{fromColumnName}" to "{toColumnName}"',
  'notification.task.moved.to.body':
    '{actorName} moved {taskTitle} to "{toColumnName}"',
  'notification.task.deleted.title': 'Task deleted on {boardName}',
  'notification.task.deleted.body': '{actorName} deleted {taskTitle}',
  'notification.task.default.title': 'Task update on {boardName}',
  'notification.task.default.body': '{actorName} changed {taskTitle}',
  'notification.group.created.title': 'New group message · {projectName}',
  'notification.group.created.body': '{authorName}: {preview}',
  'notification.group.updated.title': 'Group message updated · {projectName}',
  'notification.group.updated.body': '{authorName} edited a group message',
  'notification.group.deleted.title': 'Group message deleted · {projectName}',
  'notification.group.deleted.body': '{authorName} deleted a group message',
  'notification.fallback.someone': 'Someone',
  'notification.fallback.task': 'a task',
  'notification.fallback.message': 'Sent a message',
  'notification.fallback.column': 'Column',
};

function getEnglishNotificationTemplate(key: string): string {
  return englishNotificationTemplates[key] ?? key;
}

export function translateNotification(
  key: string,
  locale: Locale,
  vars?: Record<string, string | number | undefined>,
): string {
  if (locale === 'fa') {
    const template = faMessages[key];
    if (template) {
      return interpolate(template, vars ?? {});
    }
  }

  return interpolate(getEnglishNotificationTemplate(key), vars ?? {});
}
