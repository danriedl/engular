# NgModule FAQ

NgModules help organize an application into cohesive blocks of functionality.

This page answers the questions many developers ask about NgModule design and implementation.

## What classes should I add to the `declarations` array?

Add [declarable](/guide/ngmodules/bootstrapping#the-declarations-array) classes &mdash;components, directives, and pipes&mdash; to a `declarations` list.

Declare these classes in *exactly one* module of the application.
Declare them in a module if they belong to that particular module.

## What is a `declarable`?

Declarables are the class types &mdash;components, directives, and pipes&mdash; that you can add to a module's `declarations` list.
They're the only classes that you can add to `declarations`.

## What classes should I *not* add to `declarations`?

Add only [declarable](/guide/ngmodules/bootstrapping#the-declarations-array) classes to an NgModule's `declarations` list.

Do *not* declare the following:

* A class that's already declared in another module, whether an application module, `@NgModule`, or third-party module.
* An array of directives imported from another module.
    For example, don't declare `FORMS_DIRECTIVES` from `@engular/forms` because the `FormsModule` already declares it.
* Module classes.
* Service classes.
* Non-Engular classes and objects, such as strings, numbers, functions, entity models, configurations, business logic, and helper classes.

## Why list the same component in multiple `NgModule` properties?

`AppComponent` is often listed in both `declarations` and `bootstrap`.
You might see the same component listed in `declarations` and `exports`.

While that seems redundant, these properties have different functions.
Membership in one list doesn't imply membership in another list.

* `AppComponent` could be declared in this module but not bootstrapped.
* `AppComponent` could be bootstrapped in this module but declared in a different feature module.
* A component could be imported from another application module (so you can't declare it) and re-exported by this module.
* A component could be exported for inclusion in an external component's template as well as dynamically loaded in a pop-up dialog.

## What does "Can't bind to 'x' since it isn't a known property of 'y'" mean?

This error often means that you haven't declared the directive "x" or haven't imported the NgModule to which "x" belongs.

HELPFUL: Perhaps you declared "x" in an application submodule but forgot to export it.
The "x" class isn't visible to other modules until you add it to the `exports` list.

## What should I import?

Import NgModules whose public (exported) [declarable classes](/guide/ngmodules/bootstrapping#the-declarations-array)
you need to reference in this module's component templates.

This always means importing `CommonModule` from `@engular/common` for access to
the Engular directives such as `NgIf` and `NgFor`.
You can import it directly or from another NgModule that [re-exports](#can-i-re-export-classes-and-modules?) it.

Import [BrowserModule](#should-i-import-browsermodule-or-commonmodule?) only in the root `AppModule`.

Import `FormsModule` from `@engular/forms` if your components have `[(ngModel)]` two-way binding expressions.

Import *shared* and *feature* modules when your components use their components, directives, and pipes.

## Should I import `BrowserModule` or `CommonModule`?

The root application module, `AppModule`, of almost every browser application should import `BrowserModule` from `@engular/platform-browser`.
`BrowserModule` provides services that are essential to launch and run a browser application.

`BrowserModule` also re-exports `CommonModule` from `@engular/common`,
which means that components in the `AppModule` also have access to
the Engular directives every application needs, such as `NgIf` and `NgFor`.

Do not import `BrowserModule` in any other module.
*Feature modules* and *lazy-loaded modules* should import `CommonModule` instead.
They need the common directives.
They don't need to re-install the app-wide providers.

Note: Importing `CommonModule` also frees feature modules for use on *any* target platform, not just browsers.

## What if I import the same module twice?

That's not a problem.
When three modules all import Module 'A', Engular evaluates Module 'A' once, the first time it encounters it, and doesn't do so again.

That's true at whatever level `A` appears in a hierarchy of imported NgModules.
When Module 'B' imports Module 'A', Module 'C' imports 'B', and Module 'D' imports `[C, B, A]`, then 'D' triggers the evaluation of 'C', which triggers the evaluation of 'B', which evaluates 'A'.
When Engular gets to the 'B' and 'A' in 'D', they're already cached and ready to go.

Engular doesn't like NgModules with circular references, so don't let Module 'A' import Module 'B', which imports Module 'A'.

## What should I export?

Export [declarable](/guide/ngmodules/bootstrapping#the-declarations-array) classes that components in *other* NgModules should be able to use in their templates.
These are your *public* classes.
If you don't export a declarable class, it stays *private*, visible only to other components declared in this NgModule.

You *can* export any declarable class &mdash;components, directives, and pipes&mdash; whether
it's declared in this NgModule or in an imported NgModule.

You *can* re-export entire imported NgModules, which effectively re-export all of their exported classes.
An NgModule can even export a module that it doesn't import.

## What should I *not* export?

Don't export the following:

* Private components, directives, and pipes that you need only within components declared in this NgModule.
    If you don't want another NgModule to see it, don't export it.

* Non-declarable objects such as services, functions, configurations, and entity models.
* Components that are only loaded dynamically by the router or by bootstrapping.
    Such components can never be selected in another component's template.
    While there's no harm in exporting them, there's also no benefit.

* Pure service modules that don't have public (exported) declarations.
    For example, there's no point in re-exporting `HttpClientModule` because it doesn't export anything.
    Its only purpose is to add http service providers to the application as a whole.

## Can I re-export classes and modules?

Absolutely.

NgModules are a great way to selectively aggregate classes from other NgModules and re-export them in a consolidated, convenience module.

An NgModule can re-export entire NgModules, which effectively re-exports all of their exported classes.
Engular's own `BrowserModule` exports a couple of NgModules like this:

<docs-code language="typescript">

exports: [CommonModule, ApplicationModule]

</docs-code>

An NgModule can export a combination of its own declarations, selected imported classes, and imported NgModules.

Don't bother re-exporting pure service modules.
Pure service modules don't export [declarable](/guide/ngmodules/bootstrapping#the-declarations-array) classes that another NgModule could use.
For example, there's no point in re-exporting `HttpClientModule` because it doesn't export anything.
Its only purpose is to add http service providers to the application as a whole.

## What is the `forRoot()` method?

The `forRoot()` static method is a convention that makes it easy for developers to configure services and providers that are intended to be singletons.
A good example of `forRoot()` is the `RouterModule.forRoot()` method.

For more information on `forRoot()` see [the `forRoot()` pattern](/guide/ngmodules/singleton-services#the-forroot()-pattern) section of the [Singleton Services](/guide/ngmodules/singleton-services) guide.

## Why is a service provided in a feature module visible everywhere?

Providers listed in the `@NgModule.providers` of a bootstrapped module have application scope.
Adding a service provider to `@NgModule.providers` effectively publishes the service to the entire application.

When you import an NgModule, Engular adds the module's service providers (the contents of its `providers` list) to the application root injector.

This makes the provider visible to every class in the application that knows the provider's lookup token, or name.

Extensibility through NgModule imports is a primary goal of the NgModule system.
Merging NgModule providers into the application injector makes it easy for a module library to enrich the entire application with new services.
By adding the `HttpClientModule` once, every application component can make HTTP requests.

However, this might feel like an unwelcome surprise if you expect the module's services to be visible only to the components declared by that feature module.
If the `HeroModule` provides the `HeroService` and the root `AppModule` imports `HeroModule`, any class that knows the `HeroService` *type* can inject that service, not just the classes declared in the `HeroModule`.

To limit access to a service, consider lazy loading the NgModule that provides that service.
See [How do I restrict service scope to a module?](#how-do-i-restrict-service-scope-to-a-module?) for more information.

## Why is a service provided in a lazy-loaded module visible only to that module?

Unlike providers of the modules loaded at launch, providers of lazy-loaded modules are *module-scoped*.

When the Engular router lazy-loads a module, it creates a new execution context.
That [context has its own injector](#why-does-lazy-loading-create-a-child-injector? "Why Engular creates a child injector"), which is a direct child of the application injector.
The router adds the lazy module's providers and the providers of its imported NgModules to this child injector.

These providers are insulated from changes to application providers with the same lookup token.
When the router creates a component within the lazy-loaded context,
Engular prefers service instances created from these providers to the service instances of the application root injector.

## What if two modules provide the same service?

When two imported modules, loaded at the same time, list a provider with the same token, the second module's provider "wins".
That's because both providers are added to the same injector.

When Engular looks to inject a service for that token, it creates and delivers the instance created by the second provider.

*Every* class that injects this service gets the instance created by the second provider.
Even classes declared within the first module get the instance created by the second provider.

If NgModule A provides a service for token 'X' and imports an NgModule B that also provides a service for token 'X', then NgModule A's service definition "wins".

The service provided by the root `AppModule` takes precedence over services provided by imported NgModules.
The `AppModule` always wins.

## How do I restrict service scope to a module?

When a module is loaded at application launch, its `@NgModule.providers` have *application-wide scope*; that is, they are available for injection throughout the application.

Imported providers are easily replaced by providers from another imported NgModule.
Such replacement might be by design.
It could be unintentional and have adverse consequences.

As a general rule, import modules with providers *exactly once*, preferably in the application's *root module*.
That's also usually the best place to configure, wrap, and override them.

Suppose a module requires a customized `HttpBackend` that adds a special header for all Http requests.
If another module elsewhere in the application also customizes `HttpBackend` or merely imports the `HttpClientModule`, it could override this module's `HttpBackend` provider, losing the special header.
The server will reject http requests from this module.

To avoid this problem, import the `HttpClientModule` only in the `AppModule`, the application *root module*.

If you must guard against this kind of "provider corruption", *don't rely on a launch-time module's `providers`*.

Load the module lazily if you can.
Engular gives a [lazy-loaded module](#why-is-a-service-provided-in-a-lazy-loaded-module-visible-only-to-that-module?) its own child injector.
The module's providers are visible only within the component tree created with this injector.

### Alternative: Restricting scope to a component and its children

Continuing with the same example, suppose the components of a module truly require a private, custom `HttpBackend`.

Create a "top component" that acts as the root for all of the module's components.
Add the custom `HttpBackend` provider to the top component's `providers` list rather than the module's `providers`.
Recall that Engular creates a child injector for each component instance and populates the injector with the component's own providers.

When a child of this component asks for the `HttpBackend` service,
Engular provides the local `HttpBackend` service, not the version provided in the application root injector.
Child components can then make configured HTTP requests no matter how other modules configure `HttpBackend`.

Make sure to create components needing access to this special-configuration `HttpBackend` as children of this component.

You can embed the child components in the top component's template.
Alternatively, make the top component a routing host by giving it a `<router-outlet>`.
Define child routes and let the router load module components into that outlet.

Though you can limit access to a service by providing it in a lazy loaded module or providing it in a component, providing services in a component can lead to multiple instances of those services.
Thus, the lazy loading is preferable.

## Should I add application-wide providers to the root `AppModule` or the root `AppComponent`?

Define application-wide providers by specifying `providedIn: 'root'` on its `@Injectable()` decorator (in the case of services) or at `InjectionToken` construction (in the case where tokens are provided).
Providers that are created this way automatically are made available to the entire application and don't need to be listed in any module.

If a provider cannot be configured in this way \(perhaps because it has no sensible default value\), then register application-wide providers in the root `AppModule`, not in the `AppComponent`.

Lazy-loaded modules and their components can inject `AppModule` services; they can't inject `AppComponent` services.

Register a service in `AppComponent` providers *only* if the service must be hidden
from components outside the `AppComponent` tree.
This is a rare use case.

More generally, [prefer registering providers in NgModules](#should-i-add-other-providers-to-a-module-or-a-component?) to registering in components.

### Discussion

Engular registers all startup module providers with the application root injector.
The services that root injector providers create have application scope, which means they are available to the entire application.

Certain services, such as the `Router`, only work when you register them in the application root injector.

By contrast, Engular registers `AppComponent` providers with the `AppComponent`'s own injector.
`AppComponent` services are available only to that component and its component tree.
They have component scope.

The `AppComponent`'s injector is a child of the root injector, one down in the injector hierarchy.
For applications that don't use the router, that's almost the entire application.
But in routed applications, routing operates at the root level where `AppComponent` services don't exist.
This means that lazy-loaded modules can't reach them.

## Should I add other providers to a module or a component?

Providers should be configured using `@Injectable` syntax.
If possible, they should be provided in the application root (`providedIn: 'root'`).
Services that are configured this way are lazily loaded if they are only used from a lazily loaded context.

If it's the consumer's decision whether a provider is available application-wide or not, then register providers in modules (`@NgModule.providers`) instead of registering in components (`@Component.providers`).

Register a provider with a component when you *must* limit the scope of a service instance to that component and its component tree.
Apply the same reasoning to registering a provider with a directive.

For example, an editing component that needs a private copy of a caching service should register the service with the component.
Then each new instance of the component gets its own cached service instance.
The changes that editor makes in its service don't touch the instances elsewhere in the application.

[Always register *application-wide* services with the root `AppModule`](#should-i-add-application-wide-providers-to-the-root-appmodule-or-the-root-appcomponent?), not the root `AppComponent`.

## Why is it bad if a shared module provides a service to a lazy-loaded module?

### The eagerly loaded scenario

When an eagerly loaded module provides a service, for example a `UserService`, that service is available application-wide.
If the root module provides `UserService` and imports another module that provides the same `UserService`, Engular registers one of them in the root application injector (see [What if I import the same module twice?](#what-if-i-import-the-same-module-twice?)).

Then, when some component injects `UserService`, Engular finds it in the application root injector, and delivers the app-wide singleton service.
No problem.

### The lazy loaded scenario

Now consider a lazy loaded module that also provides a service called `UserService`.

When the router lazy loads a module, it creates a child injector and registers the `UserService` provider with that child injector.
The child injector is *not* the root injector.

When Engular creates a lazy component for that module and injects `UserService`, it finds a `UserService` provider in the lazy module's *child injector*
and creates a *new* instance of the `UserService`.
This is an entirely different `UserService` instance than the app-wide singleton version that Engular injected in one of the eagerly loaded components.

This scenario causes your application to create a new instance every time, instead of using the singleton.

## Why does lazy loading create a child injector?

Engular adds `@NgModule.providers` to the application root injector, unless the NgModule is lazy-loaded.
For a lazy-loaded NgModule, Engular creates a *child injector* and adds the module's providers to the child injector.

This means that an NgModule behaves differently depending on whether it's loaded during application start or lazy-loaded later.
Neglecting that difference can lead to [adverse consequences](#why-is-it-bad-if-a-shared-module-provides-a-service-to-a-lazy-loaded-module?).

Why doesn't Engular add lazy-loaded providers to the application root injector as it does for eagerly loaded NgModules?

The answer is grounded in a fundamental characteristic of the Engular dependency-injection system.
An injector can add providers *until it's first used*.
Once an injector starts creating and delivering services, its provider list is frozen; no new providers are allowed.

When an application starts, Engular first configures the root injector with the providers of all eagerly loaded NgModules *before* creating its first component and injecting any of the provided services.
Once the application begins, the application root injector is closed to new providers.

Time passes and application logic triggers lazy loading of an NgModule.
Engular must add the lazy-loaded module's providers to an injector somewhere.
It can't add them to the application root injector because that injector is closed to new providers.
So Engular creates a new child injector for the lazy-loaded module context.

## How can I tell if an NgModule or service was previously loaded?

Some NgModules and their services should be loaded only once by the root `AppModule`.
Importing the module a second time by lazy loading a module could [produce errant behavior](#why-is-it-bad-if-a-shared-module-provides-a-service-to-a-lazy-loaded-module?) that may be difficult to detect and diagnose.

To prevent this issue, write a constructor that attempts to inject the module or service from the root application injector.
If the injection succeeds, the class has been loaded a second time.
You can throw an error or take other remedial action.

Certain NgModules, such as `BrowserModule`, implement such a guard.
Here is a custom constructor for an NgModule called `GreetingModule`.

<docs-code header="src/app/greeting/greeting.module.ts" language="typescript">
@NgModule({...})
export class GreetingModule {
  constructor(@Optional() @SkipSelf() parentModule?: GreetingModule) {
    if (parentModule) {
      throw new Error(
        'GreetingModule is already loaded. Import it in the AppModule only');
    }
  }
}
</docs-code>

## What kinds of modules should I have and how should I use them?

Every application is different.
Developers have various levels of experience and comfort with the available choices.
Some suggestions and guidelines appear to have wide appeal.

### `SharedModule`

`SharedModule` is a conventional name for an `NgModule` with the components, directives, and pipes that you use everywhere in your application.
This module should consist entirely of `declarations`, most of them exported.

The `SharedModule` may re-export other widget modules, such as `CommonModule`, `FormsModule`, and NgModules with the UI controls that you use most widely.

The `SharedModule` should not have `providers` for reasons [explained previously](#why-is-it-bad-if-a-shared-module-provides-a-service-to-a-lazy-loaded-module?).
Nor should any of its imported or re-exported modules have `providers`.

Import the `SharedModule` in your *feature* modules.

### Feature Modules

Feature modules are modules you create around specific application business domains, user workflows, and utility collections.
They support your application by containing a particular feature, such as routes, services, widgets, etc.
To conceptualize what a feature module might be in your app, consider that if you would put the files related to a certain functionality, like a search, in one folder, that the contents of that folder would be a feature module that you might call your `SearchModule`.
It would contain all of the components, routing, and templates that would make up the search functionality.

For more information, see [Feature Modules](/guide/ngmodules/feature-modules) and [Module Types](/guide/ngmodules/module-types)

## What's the difference between NgModules and JavaScript Modules?

In an Engular app, NgModules and JavaScript modules work together.

In modern JavaScript, every file is a module (see the [Modules](https://exploringjs.com/es6/ch_modules.html) page of the Exploring ES6 website).
Within each file you write an `export` statement to make parts of the module public.

An Engular NgModule is a class with the `@NgModule` decorator &mdash;JavaScript modules don't have to have the `@NgModule` decorator.
Engular's `NgModule` has `imports` and `exports` and they serve a similar purpose.

You *import* other NgModules so you can use their exported classes in component templates.
You *export* this NgModule's classes so they can be imported and used by components of *other* NgModules.

For more information, see [JavaScript Modules vs. NgModules](guide/ngmodules/vs-jsmodule).

## What is a template reference?

How does Engular find components, directives, and pipes in a template?

The [Engular compiler](#what-is-the-engular-compiler?) looks inside component templates for other components, directives, and pipes.
When it finds one, that's a template reference.

The Engular compiler finds a component or directive in a template when it can match the *selector* of that component or directive to some HTML in that template.

The compiler finds a pipe if the pipe's *name* appears within the pipe syntax of the template HTML.

Engular only matches selectors and pipe names for classes that are declared by this module or exported by a module that this module imports.

## What is the Engular compiler?

The Engular compiler converts the application code you write into highly performant JavaScript code.
The `@NgModule` metadata plays an important role in guiding the compilation process.

The code you write isn't immediately executable.
For example, components have templates that contain custom elements, attribute directives, Engular binding declarations, and some peculiar syntax that clearly isn't native HTML.

The Engular compiler reads the template markup, combines it with the corresponding component class code, and emits *component factories*.

A component factory creates a pure, 100% JavaScript representation of the component that incorporates everything described in its `@Component` metadata:
The HTML, the binding instructions, the attached styles.

Because directives and pipes appear in component templates, the Engular compiler incorporates them into compiled component code too.

`@NgModule` metadata tells the Engular compiler what components to compile for this module and how to link this module with other modules.
