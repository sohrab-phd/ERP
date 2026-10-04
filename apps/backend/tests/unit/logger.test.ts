import test from 'node:test';
import assert from 'node:assert/strict';
import { createLogger } from '../../src/infrastructure/logging/json-logger.js';
void test('logger ignores credentials payload URLs unknown fields and invalid identifiers', () => {
  const lines: string[] = [];
  const log = createLogger('info', (line) => lines.push(line));
  log('debug', 'host.started');
  log(
    'error',
    'command.failed',
    Object.assign(
      { code: 'retryable', requestId: '00000000-0000-4000-8000-000000000001', durationMs: 2 },
      {
        payload: 'PASSWORD',
        databaseUrl: 'postgresql://secret',
        command: 'https://secret',
        executionId: 'person name',
      },
    ),
  );
  assert.equal(lines.length, 1);
  const value = JSON.parse(lines[0]!) as Record<string, unknown>;
  assert.equal(value.code, 'retryable');
  assert.equal(value.durationMs, 2);
  assert.equal(value.command, undefined);
  assert.equal(value.executionId, undefined);
  assert.doesNotMatch(lines[0]!, /PASSWORD|person name|postgresql|secret/);
});
