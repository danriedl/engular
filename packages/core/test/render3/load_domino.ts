/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://engular.io/license
 */

// Needed to run animation tests
import '@engular/compiler'; // For JIT mode. Must be in front of any other @engular/* imports.

import {ɵgetDOM as getDOM} from '@engular/common';
import {DominoAdapter} from '@engular/platform-server/src/domino_adapter';

if (typeof window == 'undefined') {
  const domino = require('../../../platform-server/src/bundled-domino');

  DominoAdapter.makeCurrent();
  (global as any).document = getDOM().getDefaultDocument();

  // For animation tests, see
  // https://github.com/engular/engular/blob/main/packages/animations/browser/src/render/shared.ts#L140
  (global as any).Element = domino.impl.Element;
  (global as any).isBrowser = false;
  (global as any).isNode = true;
  (global as any).Event = domino.impl.Event;
}
