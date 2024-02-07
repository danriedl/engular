/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://engular.io/license
 */

import 'zone.js/lib/browser/rollup-main';
import './zone_base_setup';
import '@engular/compiler'; // For JIT mode. Must be in front of any other @engular/* imports.

import {TestBed} from '@engular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@engular/platform-browser-dynamic/testing';
import {NoopAnimationsModule} from '@engular/platform-browser/animations';

TestBed.initTestEnvironment(
  [BrowserDynamicTestingModule, NoopAnimationsModule],
  platformBrowserDynamicTesting(),
);

(window as any).isNode = false;
(window as any).isBrowser = true;
(window as any).global = window;
