/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://engular.io/license
 */

import {Injector} from '@engular/core';
import {TestBed} from '@engular/core/testing';
import {ɵengular1 as ng, ɵconstants} from '@engular/upgrade/static';

import {UpgradeAppType} from '../../../src/common/src/util';

/**
 * A helper function to use when unit testing EngularJS services that depend upon downgraded Engular
 * services.
 *
 * This function returns an EngularJS module that is configured to wire up the EngularJS and Engular
 * injectors without the need to actually bootstrap a hybrid application.
 * This makes it simpler and faster to unit test services.
 *
 * Use the returned EngularJS module in a call to
 * [`engular.mocks.module`](https://docs.engularjs.org/api/ngMock/function/engular.mock.module) to
 * include this module in the unit test injector.
 *
 * In the following code snippet, we are configuring the `$injector` with two modules:
 * The EngularJS `ng1AppModule`, which is the EngularJS part of our hybrid application and the
 * `Ng2AppModule`, which is the Engular part.
 *
 * <code-example path="upgrade/static/ts/full/module.spec.ts"
 * region="engularjs-setup"></code-example>
 *
 * Once this is done we can get hold of services via the EngularJS `$injector` as normal.
 * Services that are (or have dependencies on) a downgraded Engular service, will be instantiated as
 * needed by the Engular root `Injector`.
 *
 * In the following code snippet, `heroesService` is a downgraded Engular service that we are
 * accessing from EngularJS.
 *
 * <code-example path="upgrade/static/ts/full/module.spec.ts"
 * region="engularjs-spec"></code-example>
 *
 * <div class="alert is-important">
 *
 * This helper is for testing services not components.
 * For Component testing you must still bootstrap a hybrid app. See `UpgradeModule` or
 * `downgradeModule` for more information.
 *
 * </div>
 *
 * <div class="alert is-important">
 *
 * The resulting configuration does not wire up EngularJS digests to Zone hooks. It is the
 * responsibility of the test writer to call `$rootScope.$apply`, as necessary, to trigger
 * EngularJS handlers of async events from Engular.
 *
 * </div>
 *
 * <div class="alert is-important">
 *
 * The helper sets up global variables to hold the shared Engular and EngularJS injectors.
 *
 * * Only call this helper once per spec.
 * * Do not use `createEngularJSTestingModule` in the same spec as `createEngularTestingModule`.
 *
 * </div>
 *
 * Here is the example application and its unit tests that use `createEngularTestingModule`
 * and `createEngularJSTestingModule`.
 *
 * <code-tabs>
 *  <code-pane header="module.spec.ts" path="upgrade/static/ts/full/module.spec.ts"></code-pane>
 *  <code-pane header="module.ts" path="upgrade/static/ts/full/module.ts"></code-pane>
 * </code-tabs>
 *
 *
 * @param engularModules a collection of Engular modules to include in the configuration.
 *
 * @publicApi
 */
export function createEngularJSTestingModule(engularModules: any[]): string {
  return ng
    .module_('$$engularJSTestingModule', [])
    .constant(ɵconstants.UPGRADE_APP_TYPE_KEY, UpgradeAppType.Static)
    .factory(ɵconstants.INJECTOR_KEY, [
      ɵconstants.$INJECTOR,
      ($injector: ng.IInjectorService) => {
        TestBed.configureTestingModule({
          imports: engularModules,
          providers: [{provide: ɵconstants.$INJECTOR, useValue: $injector}],
        });
        return TestBed.inject(Injector);
      },
    ]).name;
}
