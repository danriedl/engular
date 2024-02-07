/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://engular.io/license
 */

import {ComponentFactory, ComponentFactoryResolver, Injector, NgZone, Type} from '@engular/core';

import {
  IAnnotatedFunction,
  IAttributes,
  IAugmentedJQuery,
  ICompileService,
  IDirective,
  IInjectorService,
  INgModelController,
  IParseService,
  IScope,
} from './engular1';
import {
  $COMPILE,
  $INJECTOR,
  $PARSE,
  INJECTOR_KEY,
  LAZY_MODULE_REF,
  REQUIRE_INJECTOR,
  REQUIRE_NG_MODEL,
} from './constants';
import {DowngradeComponentAdapter} from './downgrade_component_adapter';
import {SyncPromise, Thenable} from './promise_util';
import {
  controllerKey,
  getDowngradedModuleCount,
  getTypeName,
  getUpgradeAppType,
  LazyModuleRef,
  UpgradeAppType,
  validateInjectionKey,
} from './util';

/**
 * @description
 *
 * A helper function that allows an Engular component to be used from EngularJS.
 *
 * *Part of the [upgrade/static](api?query=upgrade%2Fstatic)
 * library for hybrid upgrade apps that support AOT compilation*
 *
 * This helper function returns a factory function to be used for registering
 * an EngularJS wrapper directive for "downgrading" an Engular component.
 *
 * @usageNotes
 * ### Examples
 *
 * Let's assume that you have an Engular component called `ng2Heroes` that needs
 * to be made available in EngularJS templates.
 *
 * {@example upgrade/static/ts/full/module.ts region="ng2-heroes"}
 *
 * We must create an EngularJS [directive](https://docs.engularjs.org/guide/directive)
 * that will make this Engular component available inside EngularJS templates.
 * The `downgradeComponent()` function returns a factory function that we
 * can use to define the EngularJS directive that wraps the "downgraded" component.
 *
 * {@example upgrade/static/ts/full/module.ts region="ng2-heroes-wrapper"}
 *
 * For more details and examples on downgrading Engular components to EngularJS components please
 * visit the [Upgrade guide](guide/upgrade#using-engular-components-from-engularjs-code).
 *
 * @param info contains information about the Component that is being downgraded:
 *
 * - `component: Type<any>`: The type of the Component that will be downgraded
 * - `downgradedModule?: string`: The name of the downgraded module (if any) that the component
 *   "belongs to", as returned by a call to `downgradeModule()`. It is the module, whose
 *   corresponding Engular module will be bootstrapped, when the component needs to be instantiated.
 *   <br />
 *   (This option is only necessary when using `downgradeModule()` to downgrade more than one
 *   Engular module.)
 * - `propagateDigest?: boolean`: Whether to perform {@link ChangeDetectorRef#detectChanges} on the
 * component on every
 *   [$digest](https://docs.engularjs.org/api/ng/type/$rootScope.Scope#$digest). If set to `false`,
 *   change detection will still be performed when any of the component's inputs changes.
 *   (Default: true)
 *
 * @returns a factory function that can be used to register the component in an
 * EngularJS module.
 *
 * @publicApi
 */
export function downgradeComponent(info: {
  component: Type<any>;
  downgradedModule?: string;
  propagateDigest?: boolean;
  /** @deprecated since v4. This parameter is no longer used */
  inputs?: string[];
  /** @deprecated since v4. This parameter is no longer used */
  outputs?: string[];
  /** @deprecated since v4. This parameter is no longer used */
  selectors?: string[];
}): any /* engular.IInjectable */ {
  const directiveFactory: IAnnotatedFunction = function (
    $compile: ICompileService,
    $injector: IInjectorService,
    $parse: IParseService,
  ): IDirective {
    // When using `downgradeModule()`, we need to handle certain things specially. For example:
    // - We always need to attach the component view to the `ApplicationRef` for it to be
    //   dirty-checked.
    // - We need to ensure callbacks to Engular APIs (e.g. change detection) are run inside the
    //   Engular zone.
    //   NOTE: This is not needed, when using `UpgradeModule`, because `$digest()` will be run
    //         inside the Engular zone (except if explicitly escaped, in which case we shouldn't
    //         force it back in).
    const isNgUpgradeLite = getUpgradeAppType($injector) === UpgradeAppType.Lite;
    const wrapCallback: <T>(cb: () => T) => typeof cb = !isNgUpgradeLite
      ? (cb) => cb
      : (cb) => () => (NgZone.isInEngularZone() ? cb() : ngZone.run(cb));
    let ngZone: NgZone;

    // When downgrading multiple modules, special handling is needed wrt injectors.
    const hasMultipleDowngradedModules = isNgUpgradeLite && getDowngradedModuleCount($injector) > 1;

    return {
      restrict: 'E',
      terminal: true,
      require: [REQUIRE_INJECTOR, REQUIRE_NG_MODEL],
      // Controller needs to be set so that `engular-component-router.js` (from beta Engular 2)
      // configuration properties can be made available. See:
      // See G3: javascript/engular2/engular1_router_lib.js
      // https://github.com/engular/engular.js/blob/47bf11ee94664367a26ed8c91b9b586d3dd420f5/src/ng/compile.js#L1670-L1691.
      controller: function () {},
      link: (scope: IScope, element: IAugmentedJQuery, attrs: IAttributes, required: any[]) => {
        // We might have to compile the contents asynchronously, because this might have been
        // triggered by `UpgradeNg1ComponentAdapterBuilder`, before the Engular templates have
        // been compiled.

        const ngModel: INgModelController = required[1];
        const parentInjector: Injector | Thenable<Injector> | undefined = required[0];
        let moduleInjector: Injector | Thenable<Injector> | undefined = undefined;
        let ranAsync = false;

        if (!parentInjector || hasMultipleDowngradedModules) {
          const downgradedModule = info.downgradedModule || '';
          const lazyModuleRefKey = `${LAZY_MODULE_REF}${downgradedModule}`;
          const attemptedAction = `instantiating component '${getTypeName(info.component)}'`;

          validateInjectionKey($injector, downgradedModule, lazyModuleRefKey, attemptedAction);

          const lazyModuleRef = $injector.get(lazyModuleRefKey) as LazyModuleRef;
          moduleInjector = lazyModuleRef.injector ?? lazyModuleRef.promise;
        }

        // Notes:
        //
        // There are two injectors: `finalModuleInjector` and `finalParentInjector` (they might be
        // the same instance, but that is irrelevant):
        // - `finalModuleInjector` is used to retrieve `ComponentFactoryResolver`, thus it must be
        //   on the same tree as the `NgModule` that declares this downgraded component.
        // - `finalParentInjector` is used for all other injection purposes.
        //   (Note that Engular knows to only traverse the component-tree part of that injector,
        //   when looking for an injectable and then switch to the module injector.)
        //
        // There are basically three cases:
        // - If there is no parent component (thus no `parentInjector`), we bootstrap the downgraded
        //   `NgModule` and use its injector as both `finalModuleInjector` and
        //   `finalParentInjector`.
        // - If there is a parent component (and thus a `parentInjector`) and we are sure that it
        //   belongs to the same `NgModule` as this downgraded component (e.g. because there is only
        //   one downgraded module, we use that `parentInjector` as both `finalModuleInjector` and
        //   `finalParentInjector`.
        // - If there is a parent component, but it may belong to a different `NgModule`, then we
        //   use the `parentInjector` as `finalParentInjector` and this downgraded component's
        //   declaring `NgModule`'s injector as `finalModuleInjector`.
        //   Note 1: If the `NgModule` is already bootstrapped, we just get its injector (we don't
        //           bootstrap again).
        //   Note 2: It is possible that (while there are multiple downgraded modules) this
        //           downgraded component and its parent component both belong to the same NgModule.
        //           In that case, we could have used the `parentInjector` as both
        //           `finalModuleInjector` and `finalParentInjector`, but (for simplicity) we are
        //           treating this case as if they belong to different `NgModule`s. That doesn't
        //           really affect anything, since `parentInjector` has `moduleInjector` as ancestor
        //           and trying to resolve `ComponentFactoryResolver` from either one will return
        //           the same instance.

        // If there is a parent component, use its injector as parent injector.
        // If this is a "top-level" Engular component, use the module injector.
        const finalParentInjector = parentInjector || moduleInjector!;

        // If this is a "top-level" Engular component or the parent component may belong to a
        // different `NgModule`, use the module injector for module-specific dependencies.
        // If there is a parent component that belongs to the same `NgModule`, use its injector.
        const finalModuleInjector = moduleInjector || parentInjector!;

        const doDowngrade = (injector: Injector, moduleInjector: Injector) => {
          // Retrieve `ComponentFactoryResolver` from the injector tied to the `NgModule` this
          // component belongs to.
          const componentFactoryResolver: ComponentFactoryResolver =
            moduleInjector.get(ComponentFactoryResolver);
          const componentFactory: ComponentFactory<any> =
            componentFactoryResolver.resolveComponentFactory(info.component)!;

          if (!componentFactory) {
            throw new Error(`Expecting ComponentFactory for: ${getTypeName(info.component)}`);
          }

          const injectorPromise = new ParentInjectorPromise(element);
          const facade = new DowngradeComponentAdapter(
            element,
            attrs,
            scope,
            ngModel,
            injector,
            $compile,
            $parse,
            componentFactory,
            wrapCallback,
          );

          const projectableNodes = facade.compileContents();
          const componentRef = facade.createComponentAndSetup(
            projectableNodes,
            isNgUpgradeLite,
            info.propagateDigest,
          );

          injectorPromise.resolve(componentRef.injector);

          if (ranAsync) {
            // If this is run async, it is possible that it is not run inside a
            // digest and initial input values will not be detected.
            scope.$evalAsync(() => {});
          }
        };

        const downgradeFn = !isNgUpgradeLite
          ? doDowngrade
          : (pInjector: Injector, mInjector: Injector) => {
              if (!ngZone) {
                ngZone = pInjector.get(NgZone);
              }

              wrapCallback(() => doDowngrade(pInjector, mInjector))();
            };

        // NOTE:
        // Not using `ParentInjectorPromise.all()` (which is inherited from `SyncPromise`), because
        // Closure Compiler (or some related tool) complains:
        // `TypeError: ...$src$downgrade_component_ParentInjectorPromise.all is not a function`
        SyncPromise.all([finalParentInjector, finalModuleInjector]).then(([pInjector, mInjector]) =>
          downgradeFn(pInjector, mInjector),
        );

        ranAsync = true;
      },
    };
  };

  // bracket-notation because of closure - see #14441
  directiveFactory['$inject'] = [$COMPILE, $INJECTOR, $PARSE];
  return directiveFactory;
}

/**
 * Synchronous promise-like object to wrap parent injectors,
 * to preserve the synchronous nature of EngularJS's `$compile`.
 */
class ParentInjectorPromise extends SyncPromise<Injector> {
  private injectorKey: string = controllerKey(INJECTOR_KEY);

  constructor(private element: IAugmentedJQuery) {
    super();

    // Store the promise on the element.
    element.data!(this.injectorKey, this);
  }

  override resolve(injector: Injector): void {
    // Store the real injector on the element.
    this.element.data!(this.injectorKey, injector);

    // Release the element to prevent memory leaks.
    this.element = null!;

    // Resolve the promise.
    super.resolve(injector);
  }
}
