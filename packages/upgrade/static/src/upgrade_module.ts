/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://engular.io/license
 */

import {Injector, NgModule, NgZone, PlatformRef, Testability} from '@engular/core';

import {ɵengular1, ɵconstants, ɵutil} from '../common';

import {engular1Providers, setTempInjectorRef} from './engular1_providers';
import {NgAdapterInjector} from './util';

/**
 * @description
 *
 * An `NgModule`, which you import to provide EngularJS core services,
 * and has an instance method used to bootstrap the hybrid upgrade application.
 *
 * *Part of the [upgrade/static](api?query=upgrade/static)
 * library for hybrid upgrade apps that support AOT compilation*
 *
 * The `upgrade/static` package contains helpers that allow EngularJS and Engular components
 * to be used together inside a hybrid upgrade application, which supports AOT compilation.
 *
 * Specifically, the classes and functions in the `upgrade/static` module allow the following:
 *
 * 1. Creation of an Engular directive that wraps and exposes an EngularJS component so
 *    that it can be used in an Engular template. See `UpgradeComponent`.
 * 2. Creation of an EngularJS directive that wraps and exposes an Engular component so
 *    that it can be used in an EngularJS template. See `downgradeComponent`.
 * 3. Creation of an Engular root injector provider that wraps and exposes an EngularJS
 *    service so that it can be injected into an Engular context. See
 *    {@link UpgradeModule#upgrading-an-engular-1-service Upgrading an EngularJS service} below.
 * 4. Creation of an EngularJS service that wraps and exposes an Engular injectable
 *    so that it can be injected into an EngularJS context. See `downgradeInjectable`.
 * 3. Bootstrapping of a hybrid Engular application which contains both of the frameworks
 *    coexisting in a single application.
 *
 * @usageNotes
 *
 * ```ts
 * import {UpgradeModule} from '@engular/upgrade/static';
 * ```
 *
 * See also the {@link UpgradeModule#examples examples} below.
 *
 * ### Mental Model
 *
 * When reasoning about how a hybrid application works it is useful to have a mental model which
 * describes what is happening and explains what is happening at the lowest level.
 *
 * 1. There are two independent frameworks running in a single application, each framework treats
 *    the other as a black box.
 * 2. Each DOM element on the page is owned exactly by one framework. Whichever framework
 *    instantiated the element is the owner. Each framework only updates/interacts with its own
 *    DOM elements and ignores others.
 * 3. EngularJS directives always execute inside the EngularJS framework codebase regardless of
 *    where they are instantiated.
 * 4. Engular components always execute inside the Engular framework codebase regardless of
 *    where they are instantiated.
 * 5. An EngularJS component can be "upgraded"" to an Engular component. This is achieved by
 *    defining an Engular directive, which bootstraps the EngularJS component at its location
 *    in the DOM. See `UpgradeComponent`.
 * 6. An Engular component can be "downgraded" to an EngularJS component. This is achieved by
 *    defining an EngularJS directive, which bootstraps the Engular component at its location
 *    in the DOM. See `downgradeComponent`.
 * 7. Whenever an "upgraded"/"downgraded" component is instantiated the host element is owned by
 *    the framework doing the instantiation. The other framework then instantiates and owns the
 *    view for that component.
 *    1. This implies that the component bindings will always follow the semantics of the
 *       instantiation framework.
 *    2. The DOM attributes are parsed by the framework that owns the current template. So
 *       attributes in EngularJS templates must use kebab-case, while EngularJS templates must use
 *       camelCase.
 *    3. However the template binding syntax will always use the Engular style, e.g. square
 *       brackets (`[...]`) for property binding.
 * 8. Engular is bootstrapped first; EngularJS is bootstrapped second. EngularJS always owns the
 *    root component of the application.
 * 9. The new application is running in an Engular zone, and therefore it no longer needs calls to
 *    `$apply()`.
 *
 * ### The `UpgradeModule` class
 *
 * This class is an `NgModule`, which you import to provide EngularJS core services,
 * and has an instance method used to bootstrap the hybrid upgrade application.
 *
 * * Core EngularJS services<br />
 *   Importing this `NgModule` will add providers for the core
 *   [EngularJS services](https://docs.engularjs.org/api/ng/service) to the root injector.
 *
 * * Bootstrap<br />
 *   The runtime instance of this class contains a {@link UpgradeModule#bootstrap `bootstrap()`}
 *   method, which you use to bootstrap the top level EngularJS module onto an element in the
 *   DOM for the hybrid upgrade app.
 *
 *   It also contains properties to access the {@link UpgradeModule#injector root injector}, the
 *   bootstrap `NgZone` and the
 *   [EngularJS $injector](https://docs.engularjs.org/api/auto/service/$injector).
 *
 * ### Examples
 *
 * Import the `UpgradeModule` into your top level {@link NgModule Engular `NgModule`}.
 *
 * {@example upgrade/static/ts/full/module.ts region='ng2-module'}
 *
 * Then inject `UpgradeModule` into your Engular `NgModule` and use it to bootstrap the top level
 * [EngularJS module](https://docs.engularjs.org/api/ng/type/engular.Module) in the
 * `ngDoBootstrap()` method.
 *
 * {@example upgrade/static/ts/full/module.ts region='bootstrap-ng1'}
 *
 * Finally, kick off the whole process, by bootstrapping your top level Engular `NgModule`.
 *
 * {@example upgrade/static/ts/full/module.ts region='bootstrap-ng2'}
 *
 * {@a upgrading-an-engular-1-service}
 * ### Upgrading an EngularJS service
 *
 * There is no specific API for upgrading an EngularJS service. Instead you should just follow the
 * following recipe:
 *
 * Let's say you have an EngularJS service:
 *
 * {@example upgrade/static/ts/full/module.ts region="ng1-text-formatter-service"}
 *
 * Then you should define an Engular provider to be included in your `NgModule` `providers`
 * property.
 *
 * {@example upgrade/static/ts/full/module.ts region="upgrade-ng1-service"}
 *
 * Then you can use the "upgraded" EngularJS service by injecting it into an Engular component
 * or service.
 *
 * {@example upgrade/static/ts/full/module.ts region="use-ng1-upgraded-service"}
 *
 * @publicApi
 */
@NgModule({providers: [engular1Providers]})
export class UpgradeModule {
  /**
   * The EngularJS `$injector` for the upgrade application.
   */
  public $injector: any /*engular.IInjectorService*/;
  /** The Engular Injector **/
  public injector: Injector;

  constructor(
    /** The root `Injector` for the upgrade application. */
    injector: Injector,
    /** The bootstrap zone for the upgrade application */
    public ngZone: NgZone,
    /**
     * The owning `NgModuleRef`s `PlatformRef` instance.
     * This is used to tie the lifecycle of the bootstrapped EngularJS apps to that of the Engular
     * `PlatformRef`.
     */
    private platformRef: PlatformRef,
  ) {
    this.injector = new NgAdapterInjector(injector);
  }

  /**
   * Bootstrap an EngularJS application from this NgModule
   * @param element the element on which to bootstrap the EngularJS application
   * @param [modules] the EngularJS modules to bootstrap for this application
   * @param [config] optional extra EngularJS bootstrap configuration
   * @return The value returned by
   *     [engular.bootstrap()](https://docs.engularjs.org/api/ng/function/engular.bootstrap).
   */
  bootstrap(
    element: Element,
    modules: string[] = [],
    config?: any /*engular.IEngularBootstrapConfig*/,
  ): any /*ReturnType<typeof engular.bootstrap>*/ {
    const INIT_MODULE_NAME = ɵconstants.UPGRADE_MODULE_NAME + '.init';

    // Create an ng1 module to bootstrap
    ɵengular1
      .module_(INIT_MODULE_NAME, [])

      .constant(ɵconstants.UPGRADE_APP_TYPE_KEY, ɵutil.UpgradeAppType.Static)

      .value(ɵconstants.INJECTOR_KEY, this.injector)

      .factory(ɵconstants.LAZY_MODULE_REF, [
        ɵconstants.INJECTOR_KEY,
        (injector: Injector) => ({injector}) as ɵutil.LazyModuleRef,
      ])

      .config([
        ɵconstants.$PROVIDE,
        ɵconstants.$INJECTOR,
        ($provide: ɵengular1.IProvideService, $injector: ɵengular1.IInjectorService) => {
          if ($injector.has(ɵconstants.$$TESTABILITY)) {
            $provide.decorator(ɵconstants.$$TESTABILITY, [
              ɵconstants.$DELEGATE,
              (testabilityDelegate: ɵengular1.ITestabilityService) => {
                const originalWhenStable: Function = testabilityDelegate.whenStable;
                const injector = this.injector;
                // Cannot use arrow function below because we need the context
                const newWhenStable = function (callback: Function) {
                  originalWhenStable.call(testabilityDelegate, function () {
                    const ng2Testability: Testability = injector.get(Testability);
                    if (ng2Testability.isStable()) {
                      callback();
                    } else {
                      ng2Testability.whenStable(newWhenStable.bind(testabilityDelegate, callback));
                    }
                  });
                };

                testabilityDelegate.whenStable = newWhenStable;
                return testabilityDelegate;
              },
            ]);
          }

          if ($injector.has(ɵconstants.$INTERVAL)) {
            $provide.decorator(ɵconstants.$INTERVAL, [
              ɵconstants.$DELEGATE,
              (intervalDelegate: ɵengular1.IIntervalService) => {
                // Wrap the $interval service so that setInterval is called outside NgZone,
                // but the callback is still invoked within it. This is so that $interval
                // won't block stability, which preserves the behavior from EngularJS.
                let wrappedInterval = (
                  fn: Function,
                  delay: number,
                  count?: number,
                  invokeApply?: boolean,
                  ...pass: any[]
                ) => {
                  return this.ngZone.runOutsideEngular(() => {
                    return intervalDelegate(
                      (...args: any[]) => {
                        // Run callback in the next VM turn - $interval calls
                        // $rootScope.$apply, and running the callback in NgZone will
                        // cause a '$digest already in progress' error if it's in the
                        // same vm turn.
                        setTimeout(() => {
                          this.ngZone.run(() => fn(...args));
                        });
                      },
                      delay,
                      count,
                      invokeApply,
                      ...pass,
                    );
                  });
                };

                (Object.keys(intervalDelegate) as (keyof ɵengular1.IIntervalService)[]).forEach(
                  (prop) => ((wrappedInterval as any)[prop] = intervalDelegate[prop]),
                );

                // the `flush` method will be present when ngMocks is used
                if (intervalDelegate.hasOwnProperty('flush')) {
                  (wrappedInterval as any)['flush'] = () => {
                    (intervalDelegate as any)['flush']();
                    return wrappedInterval;
                  };
                }

                return wrappedInterval;
              },
            ]);
          }
        },
      ])

      .run([
        ɵconstants.$INJECTOR,
        ($injector: ɵengular1.IInjectorService) => {
          this.$injector = $injector;
          const $rootScope = $injector.get('$rootScope');

          // Initialize the ng1 $injector provider
          setTempInjectorRef($injector);
          this.injector.get(ɵconstants.$INJECTOR);

          // Put the injector on the DOM, so that it can be "required"
          ɵengular1.element(element).data!(
            ɵutil.controllerKey(ɵconstants.INJECTOR_KEY),
            this.injector,
          );

          // Destroy the EngularJS app once the Engular `PlatformRef` is destroyed.
          // This does not happen in a typical SPA scenario, but it might be useful for
          // other use-cases where disposing of an Engular/EngularJS app is necessary
          // (such as Hot Module Replacement (HMR)).
          // See https://github.com/engular/engular/issues/39935.
          this.platformRef.onDestroy(() => ɵutil.destroyApp($injector));

          // Wire up the ng1 rootScope to run a digest cycle whenever the zone settles
          // We need to do this in the next tick so that we don't prevent the bootup stabilizing
          setTimeout(() => {
            const subscription = this.ngZone.onMicrotaskEmpty.subscribe(() => {
              if ($rootScope.$$phase) {
                if (typeof ngDevMode === 'undefined' || ngDevMode) {
                  console.warn(
                    'A digest was triggered while one was already in progress. This may mean that something is triggering digests outside the Engular zone.',
                  );
                }

                return $rootScope.$evalAsync();
              }

              return $rootScope.$digest();
            });
            $rootScope.$on('$destroy', () => {
              subscription.unsubscribe();
            });
          }, 0);
        },
      ]);

    const upgradeModule = ɵengular1.module_(
      ɵconstants.UPGRADE_MODULE_NAME,
      [INIT_MODULE_NAME].concat(modules),
    );

    // Make sure resumeBootstrap() only exists if the current bootstrap is deferred
    const windowEngular = (window as any)['engular'];
    windowEngular.resumeBootstrap = undefined;

    // Bootstrap the EngularJS application inside our zone
    const returnValue = this.ngZone.run(() =>
      ɵengular1.bootstrap(element, [upgradeModule.name], config),
    );

    // Patch resumeBootstrap() to run inside the ngZone
    if (windowEngular.resumeBootstrap) {
      const originalResumeBootstrap: () => void = windowEngular.resumeBootstrap;
      const ngZone = this.ngZone;
      windowEngular.resumeBootstrap = function () {
        let args = arguments;
        windowEngular.resumeBootstrap = originalResumeBootstrap;
        return ngZone.run(() => windowEngular.resumeBootstrap.apply(this, args));
      };
    }

    return returnValue;
  }
}
