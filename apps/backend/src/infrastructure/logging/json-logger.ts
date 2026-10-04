export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export interface LogFields {
  requestId?: string;
  correlationId?: string;
  executionId?: string;
  command?: string;
  code?: string;
  durationMs?: number;
}
const levels: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };
const ids = new Set(['requestId', 'correlationId', 'executionId']);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
export function createLogger(
  minimum: LogLevel,
  write: (line: string) => void = (line) => {
    process.stdout.write(line + '\n');
  },
) {
  return (
    level: LogLevel,
    event:
      | 'host.started'
      | 'host.stopped'
      | 'host.error'
      | 'database.unavailable'
      | 'command.completed'
      | 'command.failed',
    fields: LogFields = {},
  ): void => {
    if (levels[level] < levels[minimum]) return;
    const record: Record<string, string | number> = {
      timestamp: new Date().toISOString(),
      level,
      event,
    };
    for (const [key, value] of Object.entries(fields)) {
      if (ids.has(key) && typeof value === 'string' && uuid.test(value)) record[key] = value;
      else if (
        (key === 'command' || key === 'code') &&
        typeof value === 'string' &&
        /^[A-Za-z0-9_.-]{1,128}$/.test(value)
      )
        record[key] = value;
      else if (
        key === 'durationMs' &&
        typeof value === 'number' &&
        Number.isFinite(value) &&
        value >= 0
      )
        record[key] = value;
    }
    write(JSON.stringify(record));
  };
}
