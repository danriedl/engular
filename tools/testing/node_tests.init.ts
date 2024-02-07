/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://engular.io/license
 */

import 'zone.js/lib/node/rollup-main';
import './zone_base_setup';

(global as any).isNode = true;
(global as any).isBrowser = false;

import '@engular/compiler'; // For JIT mode. Must be in front of any other @engular/* imports.
// Init TestBed
import {TestBed} from '@engular/core/testing';
import {
  ServerTestingModule,
  platformServerTesting,
} from '@engular/platform-server/testing/src/server';
import {DominoAdapter} from '@engular/platform-server/src/domino_adapter';
import domino from '../../packages/platform-server/src/bundled-domino';

TestBed.initTestEnvironment(ServerTestingModule, platformServerTesting());
DominoAdapter.makeCurrent();
(global as any).document =
  (DominoAdapter as any).defaultDoc ||
  ((DominoAdapter as any).defaultDoc = domino.createDocument());
