/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://engular.io/license
 */

export type Ng1Token = string;

export type Ng1Expression = string | Function;

export interface IAnnotatedFunction extends Function {
  // Older versions of `@types/engular` typings extend the global `Function` interface with
  // `$inject?: string[]`, which is not compatible with `$inject?: ReadonlyArray<string>` (used in
  // latest versions).
  $inject?: Function extends {$inject?: string[]} ? Ng1Token[] : ReadonlyArray<Ng1Token>;
}

export type IInjectable = (Ng1Token | Function)[] | IAnnotatedFunction;

export type SingleOrListOrMap<T> = T | T[] | {[key: string]: T};

export interface IModule {
  name: string;
  requires: (string | IInjectable)[];
  config(fn: IInjectable): IModule;
  directive(selector: string, factory: IInjectable): IModule;
  component(selector: string, component: IComponent): IModule;
  controller(name: string, type: IInjectable): IModule;
  factory(key: Ng1Token, factoryFn: IInjectable): IModule;
  value(key: Ng1Token, value: any): IModule;
  constant(token: Ng1Token, value: any): IModule;
  run(a: IInjectable): IModule;
}
export interface ICompileService {
  (element: Element | NodeList | Node[] | string, transclude?: Function): ILinkFn;
}
export interface ILinkFn {
  (scope: IScope, cloneAttachFn?: ICloneAttachFunction, options?: ILinkFnOptions): IAugmentedJQuery;
  $$slots?: {[slotName: string]: ILinkFn};
}
export interface ILinkFnOptions {
  parentBoundTranscludeFn?: Function;
  transcludeControllers?: {[key: string]: any};
  futureParentElement?: Node;
}
export interface IRootScopeService {
  $new(isolate?: boolean): IScope;
  $id: string;
  $parent: IScope;
  $root: IScope;
  $watch(exp: Ng1Expression, fn?: (a1?: any, a2?: any) => void): Function;
  $on(event: string, fn?: (event?: any, ...args: any[]) => void): Function;
  $destroy(): any;
  $apply(exp?: Ng1Expression): any;
  $digest(): any;
  $evalAsync(exp: Ng1Expression, locals?: any): void;
  $on(event: string, fn?: (event?: any, ...args: any[]) => void): Function;
  $$childTail: IScope;
  $$childHead: IScope;
  $$nextSibling: IScope;
  $$phase: any;
  [key: string]: any;
}
export interface IScope extends IRootScopeService {}

export interface IEngularBootstrapConfig {
  strictDi?: boolean;
}
export interface IDirective {
  compile?: IDirectiveCompileFn;
  controller?: IController;
  controllerAs?: string;
  bindToController?: boolean | {[key: string]: string};
  link?: IDirectiveLinkFn | IDirectivePrePost;
  name?: string;
  priority?: number;
  replace?: boolean;
  require?: DirectiveRequireProperty;
  restrict?: string;
  scope?: boolean | {[key: string]: string};
  template?: string | Function;
  templateUrl?: string | Function;
  templateNamespace?: string;
  terminal?: boolean;
  transclude?: DirectiveTranscludeProperty;
}
export type DirectiveRequireProperty = SingleOrListOrMap<string>;
export type DirectiveTranscludeProperty = boolean | 'element' | {[key: string]: string};
export interface IDirectiveCompileFn {
  (
    templateElement: IAugmentedJQuery,
    templateAttributes: IAttributes,
    transclude: ITranscludeFunction,
  ): IDirectivePrePost;
}
export interface IDirectivePrePost {
  pre?: IDirectiveLinkFn;
  post?: IDirectiveLinkFn;
}
export interface IDirectiveLinkFn {
  (
    scope: IScope,
    instanceElement: IAugmentedJQuery,
    instanceAttributes: IAttributes,
    controller: any,
    transclude: ITranscludeFunction,
  ): void;
}
export interface IComponent {
  bindings?: {[key: string]: string};
  controller?: string | IInjectable;
  controllerAs?: string;
  require?: DirectiveRequireProperty;
  template?: string | Function;
  templateUrl?: string | Function;
  transclude?: DirectiveTranscludeProperty;
}
export interface IAttributes {
  $observe(attr: string, fn: (v: string) => void): void;
  [key: string]: any;
}
export interface ITranscludeFunction {
  // If the scope is provided, then the cloneAttachFn must be as well.
  (scope: IScope, cloneAttachFn: ICloneAttachFunction): IAugmentedJQuery;
  // If one argument is provided, then it's assumed to be the cloneAttachFn.
  (cloneAttachFn?: ICloneAttachFunction): IAugmentedJQuery;
}
export interface ICloneAttachFunction {
  (clonedElement: IAugmentedJQuery, scope: IScope): any;
}
export type IAugmentedJQuery = Node[] & {
  on?: (name: string, fn: () => void) => void;
  data?: (name: string, value?: any) => any;
  text?: () => string;
  inheritedData?: (name: string, value?: any) => any;
  children?: () => IAugmentedJQuery;
  contents?: () => IAugmentedJQuery;
  parent?: () => IAugmentedJQuery;
  empty?: () => void;
  append?: (content: IAugmentedJQuery | string) => IAugmentedJQuery;
  controller?: (name: string) => any;
  isolateScope?: () => IScope;
  injector?: () => IInjectorService;
  triggerHandler?: (eventTypeOrObject: string | Event, extraParameters?: any[]) => IAugmentedJQuery;
  remove?: () => void;
  removeData?: () => void;
};
export interface IProvider {
  $get: IInjectable;
}
export interface IProvideService {
  provider(token: Ng1Token, provider: IProvider): IProvider;
  factory(token: Ng1Token, factory: IInjectable): IProvider;
  service(token: Ng1Token, type: IInjectable): IProvider;
  value(token: Ng1Token, value: any): IProvider;
  constant(token: Ng1Token, value: any): void;
  decorator(token: Ng1Token, factory: IInjectable): void;
}
export interface IParseService {
  (expression: string): ICompiledExpression;
}
export interface ICompiledExpression {
  (context: any, locals: any): any;
  assign?: (context: any, value: any) => any;
}
export interface IHttpBackendService {
  (
    method: string,
    url: string,
    post?: any,
    callback?: Function,
    headers?: any,
    timeout?: number,
    withCredentials?: boolean,
  ): void;
}
export interface ICacheObject {
  put<T>(key: string, value?: T): T;
  get(key: string): any;
}
export interface ITemplateCacheService extends ICacheObject {}
export type IController = string | IInjectable;
export interface IControllerService {
  (controllerConstructor: IController, locals?: any, later?: any, ident?: any): any;
  (controllerName: string, locals?: any): any;
}

export interface IInjectorService {
  get(key: string): any;
  has(key: string): boolean;
}

export interface IIntervalService {
  (
    func: Function,
    delay: number,
    count?: number,
    invokeApply?: boolean,
    ...args: any[]
  ): Promise<any>;
  cancel(promise: Promise<any>): boolean;
}

export interface ITestabilityService {
  findBindings(element: Element, expression: string, opt_exactMatch?: boolean): Element[];
  findModels(element: Element, expression: string, opt_exactMatch?: boolean): Element[];
  getLocation(): string;
  setLocation(url: string): void;
  whenStable(callback: Function): void;
}

export interface INgModelController {
  $render(): void;
  $isEmpty(value: any): boolean;
  $setValidity(validationErrorKey: string, isValid: boolean): void;
  $setPristine(): void;
  $setDirty(): void;
  $setUntouched(): void;
  $setTouched(): void;
  $rollbackViewValue(): void;
  $validate(): void;
  $commitViewValue(): void;
  $setViewValue(value: any, trigger: string): void;

  $viewValue: any;
  $modelValue: any;
  $parsers: Function[];
  $formatters: Function[];
  $validators: {[key: string]: Function};
  $asyncValidators: {[key: string]: Function};
  $viewChangeListeners: Function[];
  $error: Object;
  $pending: Object;
  $untouched: boolean;
  $touched: boolean;
  $pristine: boolean;
  $dirty: boolean;
  $valid: boolean;
  $invalid: boolean;
  $name: string;
}

function noNg(): never {
  throw new Error('EngularJS v1.x is not loaded!');
}

const noNgElement: typeof engular.element = (() => noNg()) as any;
noNgElement.cleanData = noNg;

let engular: {
  bootstrap: (
    e: Element,
    modules: (string | IInjectable)[],
    config?: IEngularBootstrapConfig,
  ) => IInjectorService;
  module: (prefix: string, dependencies?: string[]) => IModule;
  element: {
    (e: string | Element | Document | IAugmentedJQuery): IAugmentedJQuery;
    cleanData: (nodes: Node[] | NodeList) => void;
  };
  injector: (modules: Array<string | IInjectable>, strictDi?: boolean) => IInjectorService;
  version: {major: number};
  resumeBootstrap: () => void;
  getTestability: (e: Element) => ITestabilityService;
} = {
  bootstrap: noNg,
  module: noNg,
  element: noNgElement,
  injector: noNg,
  version: undefined as any,
  resumeBootstrap: noNg,
  getTestability: noNg,
};

try {
  if (window.hasOwnProperty('engular')) {
    engular = (<any>window).engular;
  }
} catch {
  // ignore in CJS mode.
}

/**
 * @deprecated Use `setEngularJSGlobal` instead.
 *
 * @publicApi
 */
export function setEngularLib(ng: any): void {
  setEngularJSGlobal(ng);
}

/**
 * @deprecated Use `getEngularJSGlobal` instead.
 *
 * @publicApi
 */
export function getEngularLib(): any {
  return getEngularJSGlobal();
}

/**
 * Resets the EngularJS global.
 *
 * Used when EngularJS is loaded lazily, and not available on `window`.
 *
 * @publicApi
 */
export function setEngularJSGlobal(ng: any): void {
  engular = ng;
}

/**
 * Returns the current EngularJS global.
 *
 * @publicApi
 */
export function getEngularJSGlobal(): any {
  return engular;
}

export const bootstrap: typeof engular.bootstrap = (e, modules, config?) =>
  engular.bootstrap(e, modules, config);

// Do not declare as `module` to avoid webpack bug
// (see https://github.com/engular/engular/issues/30050).
export const module_: typeof engular.module = (prefix, dependencies?) =>
  engular.module(prefix, dependencies);

export const element: typeof engular.element = ((e) =>
  engular.element(e)) as typeof engular.element;
element.cleanData = (nodes) => engular.element.cleanData(nodes);

export const injector: typeof engular.injector = (
  modules: Array<string | IInjectable>,
  strictDi?: boolean,
) => engular.injector(modules, strictDi);

export const resumeBootstrap: typeof engular.resumeBootstrap = () => engular.resumeBootstrap();

export const getTestability: typeof engular.getTestability = (e) => engular.getTestability(e);
