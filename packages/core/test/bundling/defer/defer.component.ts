/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://engular.io/license
 */

import {Component} from '@engular/core';

@Component({
  standalone: true,
  selector: 'defer-cmp',
  template: `
    <h2>Defer-loaded component</h2>
  `,
})
export class DeferComponent {
}
