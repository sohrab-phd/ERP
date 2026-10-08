const forbidden = new Set([
  'BEGIN',
  'COMMIT',
  'ROLLBACK',
  'END',
  'ABORT',
  'START',
  'PREPARE',
  'TRANSACTION',
  'CONCURRENTLY',
  'VACUUM',
]);
/** Lexical guard only, not a SQL grammar. PostgreSQL validates actual reviewed SQL.
 * Ignore literal/comment/function contents, never textual regex pairs inside strings.
 * Both standard-string modes must agree; ambiguous backslash strings must use E syntax.
 */
function scan(sql, ordinaryEscapes) {
  let i = 0;
  const fail = () => {
    throw new Error('Invalid migration content');
  };
  const quoted = (quote, escapes) => {
    i++;
    while (i < sql.length) {
      if (escapes && sql[i] === '\\') {
        i += 2;
        continue;
      }
      if (sql[i] === quote) {
        if (sql[i + 1] === quote) {
          i += 2;
          continue;
        }
        i++;
        return;
      }
      i++;
    }
    fail();
  };
  while (i < sql.length) {
    if (sql.startsWith('--', i)) {
      const end = /[\r\n]/u.exec(sql.slice(i + 2));
      i = end === null ? sql.length : i + 2 + end.index + 1;
      continue;
    }
    if (sql.startsWith('/*', i)) {
      i += 2;
      let depth = 1;
      while (i < sql.length && depth > 0) {
        if (sql.startsWith('/*', i)) {
          depth++;
          i += 2;
        } else if (sql.startsWith('*/', i)) {
          depth--;
          i += 2;
        } else i++;
      }
      if (depth !== 0) fail();
      continue;
    }
    if (sql[i] === "'") {
      quoted("'", ordinaryEscapes);
      continue;
    }
    if (sql[i] === '"') {
      quoted('"', false);
      continue;
    }
    if (sql[i] === '$') {
      const tag = /^\$(?:[A-Za-z_][A-Za-z_0-9]*)?\$/u.exec(sql.slice(i))?.[0];
      if (tag) {
        const end = sql.indexOf(tag, i + tag.length);
        if (end < 0) fail();
        i = end + tag.length;
        continue;
      }
    }
    if (/[A-Za-z_]/u.test(sql[i])) {
      const start = i++;
      while (i < sql.length && /[A-Za-z_0-9$]/u.test(sql[i])) i++;
      const word = sql.slice(start, i).toUpperCase();
      if (word === 'E' && sql[i] === "'") {
        quoted("'", true);
        continue;
      }
      if (forbidden.has(word)) fail();
      continue;
    }
    i++;
  }
}
export function validateMigrationSql(sql) {
  if (typeof sql !== 'string') throw new Error('Invalid migration content');
  scan(sql, false);
  scan(sql, true);
}
