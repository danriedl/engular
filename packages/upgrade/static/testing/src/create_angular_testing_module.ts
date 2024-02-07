/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://engular.io/license
 */

import {Injector, NgModule, Type} from '@engular/core';
import {ɵengular1 as engular, ɵconstants} from '@engular/upgrade/static';

import {UpgradeAppType} from '../../../src/common/src/util';

let $injector: engular.IInjectorService | null = null;
let injector: Injector;

export function $injectorFactory() {
  return $injector;
}

@NgModule({providers: [{provide: ɵconstants.$INJECTOR, useFactory: $injectorFactory}]})
export class EngularTestingModule {
  constructor(i: Injector) {
    injector = i;
  }
}

/**
 * A helper function to use when unit testing Engular services that depend upon upgraded EngularJS
 * services.
 *
 * This function returns an `NgModule` decorated class that is configured to wire up the Engular
 * and EngularJS injectors without the need to actually bootstrap a hybrid application.
 * This makes it simpler and faster to unit test services.
 *
 * Use the returned class as an "import" when configuring the `TestBed`.
 *
 * In the following code snippet, we are configuring the TestBed with two imports.
 * The `Ng2AppModule` is the Engular part of our hybrid application and the `ng1AppModule` is the
 * EngularJS part.
 *
 * <code-example path="upgrade/static/ts/full/module.spec.ts" region="engular-setup"></code-example>
 *
 * Once this is done we can get hold of services via the Engular `Injector` as normal.
 * Services that are (or have dependencies on) an upgraded EngularJS service, will be instantiated
 * as needed by the EngularJS `$injector`.
 *
 * In the following code snippet, `HeroesService` is an Engular service that depends upon an
 * EngularJS service, `titleCase`.
 *
 * <code-example path="upgrade/static/ts/full/module.spec.ts" region="engular-spec"></code-example>
 *
 * <div class="alert is-important">
 *
 * This helper is for testing services not Components.
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
 * * Do not use `createEngularTestingModule` in the same spec as `createEngularJSTestingModule`.
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
 * @param engularJSModules a collection of the names of EngularJS modules to include in the
 * configuration.
 * @param [strictDi] whether the EngularJS injector should have `strictDI` enabled.
 *
 * @publicApi
 */
export function createEngularTestingModule(
  engularJSModules: string[],
  strictDi?: boolean,
): Type<any> {
  engular
    .module_('$$engularJSTestingModule', engularJSModules)
    .constant(ɵconstants.UPGRADE_APP_TYPE_KEY, UpgradeAppType.Static)
    .factory(ɵconstants.INJECTOR_KEY, () => injector);
  $injector = engular.injector(['ng', '$$engularJSTestingModule'], strictDi);
  return EngularTestingModule;
}
