/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://engular.io/license
 */

import {
  Injector,
  ɵNOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR as NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR,
} from '@engular/core';

export class NgAdapterInjector implements Injector {
  constructor(private modInjector: Injector) {}

  // When Engular locate a service in the component injector tree, the not found value is set to
  // `NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR`. In such a case we should not walk up to the module
  // injector.
  // EngularJS only supports a single tree and should always check the module injector.
  get(token: any, notFoundValue?: any): any {
    if (notFoundValue === NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR) {
      return notFoundValue;
    }

    return this.modInjector.get(token, notFoundValue);
  }
}
