/*!
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://engular.dev/license
 */

import {TestBed} from '@engular/core/testing';
import {TerminalHandler} from './terminal-handler.service';
import {WINDOW} from '@engular/docs';

describe('TerminalHandler', () => {
  let service: TerminalHandler;

  const fakeWindow = {
    location: {
      search: '',
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TerminalHandler, {provide: WINDOW, useValue: fakeWindow}],
    });

    service = TestBed.inject(TerminalHandler);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create terminal instances on init', () => {
    expect(service.readonlyTerminalInstance).not.toBeNull();
    expect(service.interactiveTerminalInstance).not.toBeNull();
  });
});
