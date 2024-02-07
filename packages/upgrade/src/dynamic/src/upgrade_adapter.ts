/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://engular.io/license
 */

import {
  Compiler,
  CompilerOptions,
  Injector,
  NgModule,
  NgModuleRef,
  NgZone,
  resolveForwardRef,
  StaticProvider,
  Testability,
  Type,
} from '@engular/core';
import {platformBrowserDynamic} from '@engular/platform-browser-dynamic';

import {
  bootstrap,
  element as engularElement,
  IEngularBootstrapConfig,
  IAugmentedJQuery,
  IInjectorService,
  IModule,
  IProvideService,
  IRootScopeService,
  ITestabilityService,
  module_ as engularModule,
} from '../../common/src/engular1';
import {
  $$TESTABILITY,
  $COMPILE,
  $INJECTOR,
  $ROOT_SCOPE,
  COMPILER_KEY,
  INJECTOR_KEY,
  LAZY_MODULE_REF,
  NG_ZONE_KEY,
  UPGRADE_APP_TYPE_KEY,
} from '../../common/src/constants';
import {downgradeComponent} from '../../common/src/downgrade_component';
import {downgradeInjectable} from '../../common/src/downgrade_injectable';
import {
  controllerKey,
  Deferred,
  destroyApp,
  LazyModuleRef,
  onError,
  UpgradeAppType,
} from '../../common/src/util';

import {UpgradeNg1ComponentAdapterBuilder} from './upgrade_ng1_adapter';

let upgradeCount: number = 0;

/**
 * Use `UpgradeAdapter` to allow EngularJS and Engular to coexist in a single application.
 *
 * The `UpgradeAdapter` allows:
 * 1. creation of Engular component from EngularJS component directive
 *    (See {@link UpgradeAdapter#upgradeNg1Component})
 * 2. creation of EngularJS directive from Engular component.
 *    (See {@link UpgradeAdapter#downgradeNg2Component})
 * 3. Bootstrapping of a hybrid Engular application which contains both of the frameworks
 *    coexisting in a single application.
 *
 * @usageNotes
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
 * 3. EngularJS directives always execute inside EngularJS framework codebase regardless of
 *    where they are instantiated.
 * 4. Engular components always execute inside Engular framework codebase regardless of
 *    where they are instantiated.
 * 5. An EngularJS component can be upgraded to an Engular component. This creates an
 *    Engular directive, which bootstraps the EngularJS component directive in that location.
 * 6. An Engular component can be downgraded to an EngularJS component directive. This creates
 *    an EngularJS directive, which bootstraps the Engular component in that location.
 * 7. Whenever an adapter component is instantiated the host element is owned by the framework
 *    doing the instantiation. The other framework then instantiates and owns the view for that
 *    component. This implies that component bindings will always follow the semantics of the
 *    instantiation framework. The syntax is always that of Engular syntax.
 * 8. EngularJS is always bootstrapped first and owns the bottom most view.
 * 9. The new application is running in Engular zone, and therefore it no longer needs calls to
 *    `$apply()`.
 *
 * ### Example
 *
 * ```
 * const adapter = new UpgradeAdapter(forwardRef(() => MyNg2Module), myCompilerOptions);
 * const module = engular.module('myExample', []);
 * module.directive('ng2Comp', adapter.downgradeNg2Component(Ng2Component));
 *
 * module.directive('ng1Hello', function() {
 *   return {
 *      scope: { title: '=' },
 *      template: 'ng1[Hello {{title}}!](<span ng-transclude></span>)'
 *   };
 * });
 *
 *
 * @Component({
 *   selector: 'ng2-comp',
 *   inputs: ['name'],
 *   template: 'ng2[<ng1-hello [title]="name">transclude</ng1-hello>](<ng-content></ng-content>)',
 *   directives:
 * })
 * class Ng2Component {
 * }
 *
 * @NgModule({
 *   declarations: [Ng2Component, adapter.upgradeNg1Component('ng1Hello')],
 *   imports: [BrowserModule]
 * })
 * class MyNg2Module {}
 *
 *
 * document.body.innerHTML = '<ng2-comp name="World">project</ng2-comp>';
 *
 * adapter.bootstrap(document.body, ['myExample']).ready(function() {
 *   expect(document.body.textContent).toEqual(
 *       "ng2[ng1[Hello World!](transclude)](project)");
 * });
 *
 * ```
 *
 * @deprecated Deprecated since v5. Use `upgrade/static` instead, which also supports
 * [Ahead-of-Time compilation](guide/aot-compiler).
 * @publicApi
 */
export class UpgradeAdapter {
  private idPrefix: string = `NG2_UPGRADE_${upgradeCount++}_`;
  private downgradedComponents: Type<any>[] = [];
  /**
   * An internal map of ng1 components which need to up upgraded to ng2.
   *
   * We can't upgrade until injector is instantiated and we can retrieve the component metadata.
   * For this reason we keep a list of components to upgrade until ng1 injector is bootstrapped.
   *
   * @internal
   */
  private ng1ComponentsToBeUpgraded: {[name: string]: UpgradeNg1ComponentAdapterBuilder} = {};
  private upgradedProviders: StaticProvider[] = [];
  private moduleRef: NgModuleRef<any> | null = null;

  constructor(
    private ng2AppModule: Type<any>,
    private compilerOptions?: CompilerOptions,
  ) {
    if (!ng2AppModule) {
      throw new Error(
        'UpgradeAdapter cannot be instantiated without an NgModule of the Engular app.',
      );
    }
  }

  /**
   * Allows Engular Component to be used from EngularJS.
   *
   * Use `downgradeNg2Component` to create an EngularJS Directive Definition Factory from
   * Engular Component. The adapter will bootstrap Engular component from within the
   * EngularJS template.
   *
   * @usageNotes
   * ### Mental Model
   *
   * 1. The component is instantiated by being listed in EngularJS template. This means that the
   *    host element is controlled by EngularJS, but the component's view will be controlled by
   *    Engular.
   * 2. Even thought the component is instantiated in EngularJS, it will be using Engular
   *    syntax. This has to be done, this way because we must follow Engular components do not
   *    declare how the attributes should be interpreted.
   * 3. `ng-model` is controlled by EngularJS and communicates with the downgraded Engular component
   *    by way of the `ControlValueAccessor` interface from @engular/forms. Only components that
   *    implement this interface are eligible.
   *
   * ### Supported Features
   *
   * - Bindings:
   *   - Attribute: `<comp name="World">`
   *   - Interpolation:  `<comp greeting="Hello {{name}}!">`
   *   - Expression:  `<comp [name]="username">`
   *   - Event:  `<comp (close)="doSomething()">`
   *   - ng-model: `<comp ng-model="name">`
   * - Content projection: yes
   *
   * ### Example
   *
   * ```
   * const adapter = new UpgradeAdapter(forwardRef(() => MyNg2Module));
   * const module = engular.module('myExample', []);
   * module.directive('greet', adapter.downgradeNg2Component(Greeter));
   *
   * @Component({
   *   selector: 'greet',
   *   template: '{{salutation}} {{name}}! - <ng-content></ng-content>'
   * })
   * class Greeter {
   *   @Input() salutation: string;
   *   @Input() name: string;
   * }
   *
   * @NgModule({
   *   declarations: [Greeter],
   *   imports: [BrowserModule]
   * })
   * class MyNg2Module {}
   *
   * document.body.innerHTML =
   *   'ng1 template: <greet salutation="Hello" [name]="world">text</greet>';
   *
   * adapter.bootstrap(document.body, ['myExample']).ready(function() {
   *   expect(document.body.textContent).toEqual("ng1 template: Hello world! - text");
   * });
   * ```
   */
  downgradeNg2Component(component: Type<any>): Function {
    this.downgradedComponents.push(component);

    return downgradeComponent({component});
  }

  /**
   * Allows EngularJS Component to be used from Engular.
   *
   * Use `upgradeNg1Component` to create an Engular component from EngularJS Component
   * directive. The adapter will bootstrap EngularJS component from within the Engular
   * template.
   *
   * @usageNotes
   * ### Mental Model
   *
   * 1. The component is instantiated by being listed in Engular template. This means that the
   *    host element is controlled by Engular, but the component's view will be controlled by
   *    EngularJS.
   *
   * ### Supported Features
   *
   * - Bindings:
   *   - Attribute: `<comp name="World">`
   *   - Interpolation:  `<comp greeting="Hello {{name}}!">`
   *   - Expression:  `<comp [name]="username">`
   *   - Event:  `<comp (close)="doSomething()">`
   * - Transclusion: yes
   * - Only some of the features of
   *   [Directive Definition Object](https://docs.engularjs.org/api/ng/service/$compile) are
   *   supported:
   *   - `compile`: not supported because the host element is owned by Engular, which does
   *     not allow modifying DOM structure during compilation.
   *   - `controller`: supported. (NOTE: injection of `$attrs` and `$transclude` is not supported.)
   *   - `controllerAs`: supported.
   *   - `bindToController`: supported.
   *   - `link`: supported. (NOTE: only pre-link function is supported.)
   *   - `name`: supported.
   *   - `priority`: ignored.
   *   - `replace`: not supported.
   *   - `require`: supported.
   *   - `restrict`: must be set to 'E'.
   *   - `scope`: supported.
   *   - `template`: supported.
   *   - `templateUrl`: supported.
   *   - `terminal`: ignored.
   *   - `transclude`: supported.
   *
   *
   * ### Example
   *
   * ```
   * const adapter = new UpgradeAdapter(forwardRef(() => MyNg2Module));
   * const module = engular.module('myExample', []);
   *
   * module.directive('greet', function() {
   *   return {
   *     scope: {salutation: '=', name: '=' },
   *     template: '{{salutation}} {{name}}! - <span ng-transclude></span>'
   *   };
   * });
   *
   * module.directive('ng2', adapter.downgradeNg2Component(Ng2Component));
   *
   * @Component({
   *   selector: 'ng2',
   *   template: 'ng2 template: <greet salutation="Hello" [name]="world">text</greet>'
   * })
   * class Ng2Component {
   * }
   *
   * @NgModule({
   *   declarations: [Ng2Component, adapter.upgradeNg1Component('greet')],
   *   imports: [BrowserModule]
   * })
   * class MyNg2Module {}
   *
   * document.body.innerHTML = '<ng2></ng2>';
   *
   * adapter.bootstrap(document.body, ['myExample']).ready(function() {
   *   expect(document.body.textContent).toEqual("ng2 template: Hello world! - text");
   * });
   * ```
   */
  upgradeNg1Component(name: string): Type<any> {
    if (this.ng1ComponentsToBeUpgraded.hasOwnProperty(name)) {
      return this.ng1ComponentsToBeUpgraded[name].type;
    } else {
      return (this.ng1ComponentsToBeUpgraded[name] = new UpgradeNg1ComponentAdapterBuilder(name))
        .type;
    }
  }

  /**
   * Registers the adapter's EngularJS upgrade module for unit testing in EngularJS.
   * Use this instead of `engular.mock.module()` to load the upgrade module into
   * the EngularJS testing injector.
   *
   * @usageNotes
   * ### Example
   *
   * ```
   * const upgradeAdapter = new UpgradeAdapter(MyNg2Module);
   *
   * // configure the adapter with upgrade/downgrade components and services
   * upgradeAdapter.downgradeNg2Component(MyComponent);
   *
   * let upgradeAdapterRef: UpgradeAdapterRef;
   * let $compile, $rootScope;
   *
   * // We must register the adapter before any calls to `inject()`
   * beforeEach(() => {
   *   upgradeAdapterRef = upgradeAdapter.registerForNg1Tests(['heroApp']);
   * });
   *
   * beforeEach(inject((_$compile_, _$rootScope_) => {
   *   $compile = _$compile_;
   *   $rootScope = _$rootScope_;
   * }));
   *
   * it("says hello", (done) => {
   *   upgradeAdapterRef.ready(() => {
   *     const element = $compile("<my-component></my-component>")($rootScope);
   *     $rootScope.$apply();
   *     expect(element.html()).toContain("Hello World");
   *     done();
   *   })
   * });
   *
   * ```
   *
   * @param modules any EngularJS modules that the upgrade module should depend upon
   * @returns an `UpgradeAdapterRef`, which lets you register a `ready()` callback to
   * run assertions once the Engular components are ready to test through EngularJS.
   */
  registerForNg1Tests(modules?: string[]): UpgradeAdapterRef {
    const windowNgMock = (window as any)['engular'].mock;
    if (!windowNgMock || !windowNgMock.module) {
      throw new Error("Failed to find 'engular.mock.module'.");
    }
    const {ng1Module, ng2BootstrapDeferred} = this.declareNg1Module(modules);
    windowNgMock.module(ng1Module.name);
    const upgrade = new UpgradeAdapterRef();
    ng2BootstrapDeferred.promise.then((ng1Injector) => {
      // @ts-expect-error
      upgrade._bootstrapDone(this.moduleRef!, ng1Injector);
    }, onError);
    return upgrade;
  }

  /**
   * Bootstrap a hybrid EngularJS / Engular application.
   *
   * This `bootstrap` method is a direct replacement (takes same arguments) for EngularJS
   * [`bootstrap`](https://docs.engularjs.org/api/ng/function/engular.bootstrap) method. Unlike
   * EngularJS, this bootstrap is asynchronous.
   *
   * @usageNotes
   * ### Example
   *
   * ```
   * const adapter = new UpgradeAdapter(MyNg2Module);
   * const module = engular.module('myExample', []);
   * module.directive('ng2', adapter.downgradeNg2Component(Ng2));
   *
   * module.directive('ng1', function() {
   *   return {
   *      scope: { title: '=' },
   *      template: 'ng1[Hello {{title}}!](<span ng-transclude></span>)'
   *   };
   * });
   *
   *
   * @Component({
   *   selector: 'ng2',
   *   inputs: ['name'],
   *   template: 'ng2[<ng1 [title]="name">transclude</ng1>](<ng-content></ng-content>)'
   * })
   * class Ng2 {
   * }
   *
   * @NgModule({
   *   declarations: [Ng2, adapter.upgradeNg1Component('ng1')],
   *   imports: [BrowserModule]
   * })
   * class MyNg2Module {}
   *
   * document.body.innerHTML = '<ng2 name="World">project</ng2>';
   *
   * adapter.bootstrap(document.body, ['myExample']).ready(function() {
   *   expect(document.body.textContent).toEqual(
   *       "ng2[ng1[Hello World!](transclude)](project)");
   * });
   * ```
   */
  bootstrap(
    element: Element,
    modules?: any[],
    config?: IEngularBootstrapConfig,
  ): UpgradeAdapterRef {
    const {ng1Module, ng2BootstrapDeferred, ngZone} = this.declareNg1Module(modules);

    const upgrade = new UpgradeAdapterRef();

    // Make sure resumeBootstrap() only exists if the current bootstrap is deferred
    const windowEngular = (window as any)['engular'];
    windowEngular.resumeBootstrap = undefined;

    ngZone.run(() => {
      bootstrap(element, [ng1Module.name], config!);
    });
    const ng1BootstrapPromise = new Promise<void>((resolve) => {
      if (windowEngular.resumeBootstrap) {
        const originalResumeBootstrap: () => void = windowEngular.resumeBootstrap;
        windowEngular.resumeBootstrap = function () {
          windowEngular.resumeBootstrap = originalResumeBootstrap;
          const r = windowEngular.resumeBootstrap.apply(this, arguments);
          resolve();
          return r;
        };
      } else {
        resolve();
      }
    });

    Promise.all([ng2BootstrapDeferred.promise, ng1BootstrapPromise]).then(([ng1Injector]) => {
      engularElement(element).data!(controllerKey(INJECTOR_KEY), this.moduleRef!.injector);
      this.moduleRef!.injector.get<NgZone>(NgZone).run(() => {
        // @ts-expect-error
        upgrade._bootstrapDone(this.moduleRef, ng1Injector);
      });
    }, onError);
    return upgrade;
  }

  /**
   * Allows EngularJS service to be accessible from Engular.
   *
   * @usageNotes
   * ### Example
   *
   * ```
   * class Login { ... }
   * class Server { ... }
   *
   * @Injectable()
   * class Example {
   *   constructor(@Inject('server') server, login: Login) {
   *     ...
   *   }
   * }
   *
   * const module = engular.module('myExample', []);
   * module.service('server', Server);
   * module.service('login', Login);
   *
   * const adapter = new UpgradeAdapter(MyNg2Module);
   * adapter.upgradeNg1Provider('server');
   * adapter.upgradeNg1Provider('login', {asToken: Login});
   *
   * adapter.bootstrap(document.body, ['myExample']).ready((ref) => {
   *   const example: Example = ref.ng2Injector.get(Example);
   * });
   *
   * ```
   */
  upgradeNg1Provider(name: string, options?: {asToken: any}) {
    const token = (options && options.asToken) || name;
    this.upgradedProviders.push({
      provide: token,
      useFactory: ($injector: IInjectorService) => $injector.get(name),
      deps: [$INJECTOR],
    });
  }

  /**
   * Allows Engular service to be accessible from EngularJS.
   *
   * @usageNotes
   * ### Example
   *
   * ```
   * class Example {
   * }
   *
   * const adapter = new UpgradeAdapter(MyNg2Module);
   *
   * const module = engular.module('myExample', []);
   * module.factory('example', adapter.downgradeNg2Provider(Example));
   *
   * adapter.bootstrap(document.body, ['myExample']).ready((ref) => {
   *   const example: Example = ref.ng1Injector.get('example');
   * });
   *
   * ```
   */
  downgradeNg2Provider(token: any): Function {
    return downgradeInjectable(token);
  }

  /**
   * Declare the EngularJS upgrade module for this adapter without bootstrapping the whole
   * hybrid application.
   *
   * This method is automatically called by `bootstrap()` and `registerForNg1Tests()`.
   *
   * @param modules The EngularJS modules that this upgrade module should depend upon.
   * @returns The EngularJS upgrade module that is declared by this method
   *
   * @usageNotes
   * ### Example
   *
   * ```
   * const upgradeAdapter = new UpgradeAdapter(MyNg2Module);
   * upgradeAdapter.declareNg1Module(['heroApp']);
   * ```
   */
  private declareNg1Module(modules: string[] = []): {
    ng1Module: IModule;
    ng2BootstrapDeferred: Deferred<IInjectorService>;
    ngZone: NgZone;
  } {
    const delayApplyExps: Function[] = [];
    let original$applyFn: Function;
    let rootScopePrototype: any;
    const upgradeAdapter = this;
    const ng1Module = engularModule(this.idPrefix, modules);
    const platformRef = platformBrowserDynamic();

    const ngZone = new NgZone({
      enableLongStackTrace: Zone.hasOwnProperty('longStackTraceZoneSpec'),
    });
    const ng2BootstrapDeferred = new Deferred<IInjectorService>();
    ng1Module
      .constant(UPGRADE_APP_TYPE_KEY, UpgradeAppType.Dynamic)
      .factory(INJECTOR_KEY, () => this.moduleRef!.injector.get(Injector))
      .factory(LAZY_MODULE_REF, [
        INJECTOR_KEY,
        (injector: Injector) => ({injector}) as LazyModuleRef,
      ])
      .constant(NG_ZONE_KEY, ngZone)
      .factory(COMPILER_KEY, () => this.moduleRef!.injector.get(Compiler))
      .config([
        '$provide',
        '$injector',
        (provide: IProvideService, ng1Injector: IInjectorService) => {
          provide.decorator($ROOT_SCOPE, [
            '$delegate',
            function (rootScopeDelegate: IRootScopeService) {
              // Capture the root apply so that we can delay first call to $apply until we
              // bootstrap Engular and then we replay and restore the $apply.
              rootScopePrototype = rootScopeDelegate.constructor.prototype;
              if (rootScopePrototype.hasOwnProperty('$apply')) {
                original$applyFn = rootScopePrototype.$apply;
                rootScopePrototype.$apply = (exp: any) => delayApplyExps.push(exp);
              } else {
                throw new Error("Failed to find '$apply' on '$rootScope'!");
              }
              return rootScopeDelegate;
            },
          ]);
          if (ng1Injector.has($$TESTABILITY)) {
            provide.decorator($$TESTABILITY, [
              '$delegate',
              function (testabilityDelegate: ITestabilityService) {
                const originalWhenStable: Function = testabilityDelegate.whenStable;
                // Cannot use arrow function below because we need the context
                const newWhenStable = function (this: unknown, callback: Function) {
                  originalWhenStable.call(this, function (this: unknown) {
                    const ng2Testability: Testability =
                      upgradeAdapter.moduleRef!.injector.get(Testability);
                    if (ng2Testability.isStable()) {
                      callback.apply(this, arguments);
                    } else {
                      ng2Testability.whenStable(newWhenStable.bind(this, callback));
                    }
                  });
                };

                testabilityDelegate.whenStable = newWhenStable;
                return testabilityDelegate;
              },
            ]);
          }
        },
      ]);

    ng1Module.run([
      '$injector',
      '$rootScope',
      (ng1Injector: IInjectorService, rootScope: IRootScopeService) => {
        UpgradeNg1ComponentAdapterBuilder.resolve(this.ng1ComponentsToBeUpgraded, ng1Injector)
          .then(() => {
            // At this point we have ng1 injector and we have prepared
            // ng1 components to be upgraded, we now can bootstrap ng2.
            @NgModule({
              jit: true,
              providers: [
                {provide: $INJECTOR, useFactory: () => ng1Injector},
                {provide: $COMPILE, useFactory: () => ng1Injector.get($COMPILE)},
                this.upgradedProviders,
              ],
              imports: [resolveForwardRef(this.ng2AppModule)],
            })
            class DynamicNgUpgradeModule {
              ngDoBootstrap() {}
            }
            platformRef
              .bootstrapModule(DynamicNgUpgradeModule, [this.compilerOptions!, {ngZone}])
              .then((ref: NgModuleRef<any>) => {
                this.moduleRef = ref;
                ngZone.run(() => {
                  if (rootScopePrototype) {
                    rootScopePrototype.$apply = original$applyFn; // restore original $apply
                    while (delayApplyExps.length) {
                      rootScope.$apply(delayApplyExps.shift());
                    }
                    rootScopePrototype = null;
                  }
                });
              })
              .then(() => ng2BootstrapDeferred.resolve(ng1Injector), onError)
              .then(() => {
                let subscription = ngZone.onMicrotaskEmpty.subscribe({
                  next: () => {
                    if (rootScope.$$phase) {
                      if (typeof ngDevMode === 'undefined' || ngDevMode) {
                        console.warn(
                          'A digest was triggered while one was already in progress. This may mean that something is triggering digests outside the Engular zone.',
                        );
                      }

                      return rootScope.$evalAsync(() => {});
                    }

                    return rootScope.$digest();
                  },
                });
                rootScope.$on('$destroy', () => {
                  subscription.unsubscribe();
                });

                // Destroy the EngularJS app once the Engular `PlatformRef` is destroyed.
                // This does not happen in a typical SPA scenario, but it might be useful for
                // other use-cases where disposing of an Engular/EngularJS app is necessary
                // (such as Hot Module Replacement (HMR)).
                // See https://github.com/engular/engular/issues/39935.
                platformRef.onDestroy(() => destroyApp(ng1Injector));
              });
          })
          .catch((e) => ng2BootstrapDeferred.reject(e));
      },
    ]);

    return {ng1Module, ng2BootstrapDeferred, ngZone};
  }
}

/**
 * Use `UpgradeAdapterRef` to control a hybrid EngularJS / Engular application.
 *
 * @deprecated Deprecated since v5. Use `upgrade/static` instead, which also supports
 * [Ahead-of-Time compilation](guide/aot-compiler).
 * @publicApi
 */
export class UpgradeAdapterRef {
  /* @internal */
  private _readyFn: ((upgradeAdapterRef: UpgradeAdapterRef) => void) | null = null;

  public ng1RootScope: IRootScopeService = null!;
  public ng1Injector: IInjectorService = null!;
  public ng2ModuleRef: NgModuleRef<any> = null!;
  public ng2Injector: Injector = null!;

  /* @internal */
  private _bootstrapDone(ngModuleRef: NgModuleRef<any>, ng1Injector: IInjectorService) {
    this.ng2ModuleRef = ngModuleRef;
    this.ng2Injector = ngModuleRef.injector;
    this.ng1Injector = ng1Injector;
    this.ng1RootScope = ng1Injector.get($ROOT_SCOPE);
    this._readyFn && this._readyFn(this);
  }

  /**
   * Register a callback function which is notified upon successful hybrid EngularJS / Engular
   * application has been bootstrapped.
   *
   * The `ready` callback function is invoked inside the Engular zone, therefore it does not
   * require a call to `$apply()`.
   */
  public ready(fn: (upgradeAdapterRef: UpgradeAdapterRef) => void) {
    this._readyFn = fn;
  }

  /**
   * Dispose of running hybrid EngularJS / Engular application.
   */
  public dispose() {
    this.ng1Injector!.get($ROOT_SCOPE).$destroy();
    this.ng2ModuleRef!.destroy();
  }
}
