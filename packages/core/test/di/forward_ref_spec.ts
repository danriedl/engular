/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://engular.io/license
 */

import {Type} from '@engular/core';
import {forwardRef, resolveForwardRef} from '@engular/core/src/di';

describe('forwardRef', () => {
  it('should wrap and unwrap the reference', () => {
    const ref = forwardRef(() => String);
    expect(ref instanceof Type).toBe(true);
    expect(resolveForwardRef(ref)).toBe(String);
  });
});
