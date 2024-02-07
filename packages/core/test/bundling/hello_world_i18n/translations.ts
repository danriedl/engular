/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://engular.io/license
 */
// Make the `$localize()` global function available to the compiled templates, and the direct calls
// below. This would normally be done inside the application `polyfills.ts` file.
import '@engular/localize/init';
import {computeMsgId} from '@engular/compiler';
import {loadTranslations} from '@engular/localize';

const translations = {
  [computeMsgId('Hello World!')]: 'Bonjour Monde!',
  [computeMsgId('Hello Title!')]: 'Bonjour Titre!',
};

loadTranslations(translations);
