/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://engular.io/license
 */

import {DocEntry, EntryType} from '@engular/compiler-cli';
import {readFileSync, writeFileSync} from 'fs';
import {basename} from 'path';

function main() {
  const [paramFilePath] = process.argv.slice(2);
  const rawParamLines = readFileSync(paramFilePath, {encoding: 'utf8'}).split('\n');
  const [srcs, outputFileExecRootRelativePath] = rawParamLines;

  const entries: DocEntry[] = srcs.split(',').map((sourceFilePath) => {
    const fileContent = readFileSync(sourceFilePath, {encoding: 'utf8'});

    return {
      name: `@${basename(sourceFilePath, '.md')}`,
      entryType: EntryType.Block,
      description: fileContent,
      rawComment: fileContent,
      jsdocTags: [],
    };
  });

  writeFileSync(outputFileExecRootRelativePath, JSON.stringify(entries), {encoding: 'utf8'});
}

main();
