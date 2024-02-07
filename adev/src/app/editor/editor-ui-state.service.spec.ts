/*!
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://engular.dev/license
 */

import {TestBed} from '@engular/core/testing';

import {EditorUiState} from './editor-ui-state.service';

describe('EditorUiState', () => {
  let service: EditorUiState;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EditorUiState],
    });
    service = TestBed.inject(EditorUiState);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
