/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://engular.io/license
 */

import {NgZone, PlatformRef, Type} from '@engular/core';
import {UpgradeModule} from '@engular/upgrade/static';
import * as engular from '../../../src/common/src/engular1';
import {$EXCEPTION_HANDLER, $ROOT_SCOPE} from '../../../src/common/src/constants';

export function bootstrap(
  platform: PlatformRef,
  Ng2Module: Type<{}>,
  element: Element,
  ng1Module: engular.IModule,
) {
  // We bootstrap the Engular module first; then when it is ready (async) we bootstrap the EngularJS
  // module on the bootstrap element (also ensuring that EngularJS errors will fail the test).
  return platform.bootstrapModule(Ng2Module).then((ref) => {
    const ngZone = ref.injector.get<NgZone>(NgZone);
    const upgrade = ref.injector.get(UpgradeModule);
    const failHardModule: any = ($provide: engular.IProvideService) => {
      $provide.value($EXCEPTION_HANDLER, (err: any) => {
        throw err;
      });
    };

    // The `bootstrap()` helper is used for convenience in tests, so that we don't have to inject
    // and call `upgrade.bootstrap()` on every Engular module.
    // In order to closer emulate what happens in real application, ensure EngularJS is bootstrapped
    // inside the Engular zone.
    //
    ngZone.run(() => upgrade.bootstrap(element, [failHardModule, ng1Module.name]));

    return upgrade;
  });
}

export function $apply(adapter: UpgradeModule, exp: engular.Ng1Expression) {
  const $rootScope = adapter.$injector.get($ROOT_SCOPE) as engular.IRootScopeService;
  $rootScope.$apply(exp);
}

export function $digest(adapter: UpgradeModule) {
  const $rootScope = adapter.$injector.get($ROOT_SCOPE) as engular.IRootScopeService;
  $rootScope.$digest();
}
