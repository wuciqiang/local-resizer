import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('upload accessibility', () => {
  it('uses a native label instead of a nested role-button dropzone', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'src/components/image-processor/UploadDropzone.tsx'),
      'utf8',
    );

    expect(source).toContain('<label');
    expect(source).toContain('htmlFor="image-upload-input"');
    expect(source).not.toContain('role="button"');
  });
});
