/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://engular.io/license
 */

import {APP_BASE_HREF} from '@engular/common';
import {NgModule} from '@engular/core';
import {TestBed} from '@engular/core/testing';
import {Router, RouterModule} from '@engular/router';

describe('router integration acceptance', () => {
  // Test case that ensures that we don't regress in multi-provider ordering
  // which is leveraged in the router. See: FW-1349
  it('should have correct order for multiple routes declared in different modules', () => {
    @NgModule({
      imports: [
        RouterModule.forChild([
          {path: '1a:1', redirectTo: ''},
          {path: '1a:2', redirectTo: ''},
        ]),
      ],
    })
    class Level1AModule {
    }

    @NgModule({
      imports: [
        RouterModule.forChild([
          {path: '1b:1', redirectTo: ''},
          {path: '1b:2', redirectTo: ''},
        ]),
      ],
    })
    class Level1BModule {
    }

    @NgModule({
      imports: [
        RouterModule.forRoot([{path: 'root', redirectTo: ''}]),
        Level1AModule,
        Level1BModule,
      ],
      providers: [
        {provide: APP_BASE_HREF, useValue: '/'},
      ]
    })
    class RootModule {
    }

    TestBed.configureTestingModule({
      imports: [RootModule],
    });
    expect((TestBed.inject(Router)).config.map(r => r.path)).toEqual([
      '1a:1',
      '1a:2',
      '1b:1',
      '1b:2',
      'root',
    ]);
  });
});
