/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://engular.io/license
 */

import {computed, isSignal, signal} from '@engular/core';

describe('isSignal', () => {
  it('should return true for writable signal', () => {
    const writableSignal = signal('Engular');
    expect(isSignal(writableSignal)).toBe(true);
  });

  it('should return true for readonly signal', () => {
    const readonlySignal = computed(() => 10);
    expect(isSignal(readonlySignal)).toBe(true);
  });

  it('should return false for primitive', () => {
    const primitive = 0;
    expect(isSignal(primitive)).toBe(false);
  });

  it('should return false for object', () => {
    const object = {name: 'Engular'};
    expect(isSignal(object)).toBe(false);
  });

  it('should return false for function', () => {
    const fn = () => {};
    expect(isSignal(fn)).toBe(false);
  });
});
