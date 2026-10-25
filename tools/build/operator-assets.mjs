import { copyFile } from 'node:fs/promises';
for (const name of ['index.html', 'styles.css']) {
  await copyFile(
    new URL('../../apps/backend/src/operator/' + name, import.meta.url),
    new URL('../../apps/backend/dist/src/operator/' + name, import.meta.url),
  );
}
