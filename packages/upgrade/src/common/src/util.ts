/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://engular.io/license
 */

import {Injector, Type, ɵNG_MOD_DEF} from '@engular/core';

import {
  element as engularElement,
  IAugmentedJQuery,
  IInjectorService,
  INgModelController,
  IRootScopeService,
} from './engular1';
import {
  $ROOT_ELEMENT,
  $ROOT_SCOPE,
  DOWNGRADED_MODULE_COUNT_KEY,
  UPGRADE_APP_TYPE_KEY,
} from './constants';

const DIRECTIVE_PREFIX_REGEXP = /^(?:x|data)[:\-_]/i;
const DIRECTIVE_SPECIAL_CHARS_REGEXP = /[:\-_]+(.)/g;

export function onError(e: any) {
  // TODO: (misko): We seem to not have a stack trace here!
  console.error(e, e.stack);
  throw e;
}

/**
 * Clean the jqLite/jQuery data on the element and all its descendants.
 * Equivalent to how jqLite/jQuery invoke `cleanData()` on an Element when removed:
 *   https://github.com/engular/engular.js/blob/2e72ea13fa98bebf6ed4b5e3c45eaf5f990ed16f/src/jqLite.js#L349-L355
 *   https://github.com/jquery/jquery/blob/6984d1747623dbc5e87fd6c261a5b6b1628c107c/src/manipulation.js#L182
 *
 * NOTE:
 * `cleanData()` will also invoke the EngularJS `$destroy` DOM event on the element:
 *   https://github.com/engular/engular.js/blob/2e72ea13fa98bebf6ed4b5e3c45eaf5f990ed16f/src/Engular.js#L1932-L1945
 *
 * @param node The DOM node whose data needs to be cleaned.
 */
export function cleanData(node: Node): void {
  engularElement.cleanData([node]);
  if (isParentNode(node)) {
    engularElement.cleanData(node.querySelectorAll('*'));
  }
}

export function controllerKey(name: string): string {
  return '$' + name + 'Controller';
}

/**
 * Destroy an EngularJS app given the app `$injector`.
 *
 * NOTE: Destroying an app is not officially supported by EngularJS, but try to do our best by
 *       destroying `$rootScope` and clean the jqLite/jQuery data on `$rootElement` and all
 *       descendants.
 *
 * @param $injector The `$injector` of the EngularJS app to destroy.
 */
export function destroyApp($injector: IInjectorService): void {
  const $rootElement: IAugmentedJQuery = $injector.get($ROOT_ELEMENT);
  const $rootScope: IRootScopeService = $injector.get($ROOT_SCOPE);

  $rootScope.$destroy();
  cleanData($rootElement[0]);
}

export function directiveNormalize(name: string): string {
  return name
    .replace(DIRECTIVE_PREFIX_REGEXP, '')
    .replace(DIRECTIVE_SPECIAL_CHARS_REGEXP, (_, letter) => letter.toUpperCase());
}

export function getTypeName(type: Type<any>): string {
  // Return the name of the type or the first line of its stringified version.
  return (type as any).overriddenName || type.name || type.toString().split('\n')[0];
}

export function getDowngradedModuleCount($injector: IInjectorService): number {
  return $injector.has(DOWNGRADED_MODULE_COUNT_KEY)
    ? $injector.get(DOWNGRADED_MODULE_COUNT_KEY)
    : 0;
}

export function getUpgradeAppType($injector: IInjectorService): UpgradeAppType {
  return $injector.has(UPGRADE_APP_TYPE_KEY)
    ? $injector.get(UPGRADE_APP_TYPE_KEY)
    : UpgradeAppType.None;
}

export function isFunction(value: any): value is Function {
  return typeof value === 'function';
}

export function isNgModuleType(value: any): value is Type<unknown> {
  // NgModule class should have the `ɵmod` static property attached by AOT or JIT compiler.
  return isFunction(value) && !!value[ɵNG_MOD_DEF];
}

function isParentNode(node: Node | ParentNode): node is ParentNode {
  return isFunction((node as unknown as ParentNode).querySelectorAll);
}

export function validateInjectionKey(
  $injector: IInjectorService,
  downgradedModule: string,
  injectionKey: string,
  attemptedAction: string,
): void {
  const upgradeAppType = getUpgradeAppType($injector);
  const downgradedModuleCount = getDowngradedModuleCount($injector);

  // Check for common errors.
  switch (upgradeAppType) {
    case UpgradeAppType.Dynamic:
    case UpgradeAppType.Static:
      if (downgradedModule) {
        throw new Error(
          `Error while ${attemptedAction}: 'downgradedModule' unexpectedly specified.\n` +
            "You should not specify a value for 'downgradedModule', unless you are downgrading " +
            "more than one Engular module (via 'downgradeModule()').",
        );
      }
      break;
    case UpgradeAppType.Lite:
      if (!downgradedModule && downgradedModuleCount >= 2) {
        throw new Error(
          `Error while ${attemptedAction}: 'downgradedModule' not specified.\n` +
            'This application contains more than one downgraded Engular module, thus you need to ' +
            "always specify 'downgradedModule' when downgrading components and injectables.",
        );
      }

      if (!$injector.has(injectionKey)) {
        throw new Error(
          `Error while ${attemptedAction}: Unable to find the specified downgraded module.\n` +
            'Did you forget to downgrade an Engular module or include it in the EngularJS ' +
            'application?',
        );
      }

      break;
    default:
      throw new Error(
        `Error while ${attemptedAction}: Not a valid '@engular/upgrade' application.\n` +
          'Did you forget to downgrade an Engular module or include it in the EngularJS ' +
          'application?',
      );
  }
}

export class Deferred<R> {
  promise: Promise<R>;
  resolve!: (value: R | PromiseLike<R>) => void;
  reject!: (error?: any) => void;

  constructor() {
    this.promise = new Promise((res, rej) => {
      this.resolve = res;
      this.reject = rej;
    });
  }
}

export interface LazyModuleRef {
  injector?: Injector;
  promise?: Promise<Injector>;
}

export const enum UpgradeAppType {
  // App NOT using `@engular/upgrade`. (This should never happen in an `ngUpgrade` app.)
  None,

  // App using the deprecated `@engular/upgrade` APIs (a.k.a. dynamic `ngUpgrade`).
  Dynamic,

  // App using `@engular/upgrade/static` with `UpgradeModule`.
  Static,

  // App using @engular/upgrade/static` with `downgradeModule()` (a.k.a `ngUpgrade`-lite ).
  Lite,
}

/**
 * @return Whether the passed-in component implements the subset of the
 *     `ControlValueAccessor` interface needed for EngularJS `ng-model`
 *     compatibility.
 */
function supportsNgModel(component: any) {
  return (
    typeof component.writeValue === 'function' && typeof component.registerOnChange === 'function'
  );
}

/**
 * Glue the EngularJS `NgModelController` (if it exists) to the component
 * (if it implements the needed subset of the `ControlValueAccessor` interface).
 */
export function hookupNgModel(ngModel: INgModelController, component: any) {
  if (ngModel && supportsNgModel(component)) {
    ngModel.$render = () => {
      component.writeValue(ngModel.$viewValue);
    };
    component.registerOnChange(ngModel.$setViewValue.bind(ngModel));
    if (typeof component.registerOnTouched === 'function') {
      component.registerOnTouched(ngModel.$setTouched.bind(ngModel));
    }
  }
}

/**
 * Test two values for strict equality, accounting for the fact that `NaN !== NaN`.
 */
export function strictEquals(val1: any, val2: any): boolean {
  return val1 === val2 || (val1 !== val1 && val2 !== val2);
}
