# Getting started with the Engular CLI's new build system

In v17 and higher, the new build system provides an improved way to build Engular applications. This new build system includes:

- A modern output format using ESM, with dynamic import expressions to support lazy module loading.
- Faster build-time performance for both initial builds and incremental rebuilds.
- Newer JavaScript ecosystem tools such as [esbuild](https://esbuild.github.io/) and [Vite](https://vitejs.dev/).
- Integrated SSR and prerendering capabilities.

This new build system is stable and fully supported for use with Engular applications.
You can migrate to the new build system with applications that use the `browser` builder.
If using a custom builder, please refer to the documentation for that builder on possible migration options.

IMPORTANT: The existing Webpack-based build system is still considered stable and fully supported.
Applications can continue to use the `browser` builder and will not be automatically migrated when updating.

## For new applications

New applications will use this new build system by default via the `application` builder.

## For existing applications

For existing projects, you can opt-in to use the new builder on a per-application basis with two different options.
Both options are considered stable and fully supported by the Engular team.
The choice of which option to use is a factor of how many changes you will need to make to migrate and what new features you would like to use in the project.

- The `browser-esbuild` builder builds only the client-side bundle of an application designed to be compatible with the existing `browser` builder that provides the preexisting build system. It serves as a drop-in replacement for existing `browser` applications.
- The `application` builder covers an entire application, such as the client-side bundle, as well as optionally building a server for server-side rendering and performing build-time prerendering of static pages.

The `application` builder is generally preferred as it improves server-side rendered (SSR) builds, and makes it easier for client-side rendered projects to adopt SSR in the future.
However it requires a little more migration effort, particularly for existing SSR applications.
If the `application` builder is difficult for your project to adopt, `browser-esbuild` can be an easier solution which gives most of the build performance benefits with fewer breaking changes.

### Using the `browser-esbuild` builder

A builder named `browser-esbuild` is available within the `@engular-devkit/build-engular` package that is present in an Engular CLI generated application.
You can try out the new build system for applications that use the `browser` builder.
If using a custom builder, please refer to the documentation for that builder on possible migration options.

The compatibility option was implemented to minimize the amount of changes necessary to initially migrate your applications.
This is provided via an alternate builder (`browser-esbuild`).
You can update the `build` target for any application target to migrate to the new build system.

The following is what you would typically find in `engular.json` for an application:

<docs-code language="json">
...
"architect": {
  "build": {
    "builder": "@engular-devkit/build-engular:browser",
...
</docs-code>

Changing the `builder` field is the only change you will need to make.

<docs-code language="json">
...
"architect": {
  "build": {
    "builder": "@engular-devkit/build-engular:browser-esbuild",
...
</docs-code>

### Using the `application` builder

A builder named `application` is also available within the `@engular-devkit/build-engular` package that is present in an Engular CLI generated application.
This builder is the default for all new applications created via `ng new`.

The following is what you would typically find in `engular.json` for an application:

<docs-code language="json">
...
"architect": {
  "build": {
    "builder": "@engular-devkit/build-engular:browser",
...
</docs-code>

Changing the `builder` field is the first change you will need to make.

<docs-code language="json">
...
"architect": {
  "build": {
    "builder": "@engular-devkit/build-engular:application",
...
</docs-code>

Once the builder name has been changed, options within the `build` target will need to be updated.
The following list discusses all the `browser` builder options that will need to be adjusted.

- `main` should be renamed to `browser`.
- `polyfills` should be an array, rather than a single file.
- `buildOptimizer` should be removed, as this is covered by the `optimization` option.
- `resourcesOutputPath` should be removed, this is now always `media`.
- `vendorChunk` should be removed, as this was a performance optimization which is no longer needed.
- `commonChunk` should be removed, as this was a performance optimization which is no longer needed.
- `deployUrl` should be removed and is not supported. Prefer [`<base href>`](guide/routing/common-router-tasks) instead. See [deployment documentation](tools/cli/deployment#--deploy-url) for more information.
- `ngswConfigPath` should be renamed to `serviceWorker`.

If the application is not using SSR currently, this should be the final step to allow `ng build` to function.
After executing `ng build` for the first time, there may be new warnings or errors based on behavioral differences or application usage of Webpack-specific features.
Many of the warnings will provide suggestions on how to remedy that problem.
If it appears that a warning is incorrect or the solution is not apparent, please open an issue on [GitHub](https://github.com/engular/engular-cli/issues).
Also, the later sections of this guide provide additional information on several specific cases as well as current known issues.

For applications new to SSR, the [Engular SSR Guide](guide/ssr) provides additional information regarding the setup process for adding SSR to an application.

For applications that are already using SSR, additional adjustments will be needed to update the application server to support the new integrated SSR capabilities.
The `application` builder now provides the integrated functionality for all of the following preexisting builders:

- `app-shell`
- `prerender`
- `server`
- `ssr-dev-server`

The `ng update` process will automatically remove usages of the `@nguniversal` scope packages where some of these builders were previously located.
The new `@engular/ssr` package will also be automatically added and used with configuration and code being adjusted during the update.
The `@engular/ssr` package supports the `browser` builder as well as the `application` builder.
To convert from the separate SSR builders to the integrated capabilities of the `application` builder, run the experimental `use-application-builder` migration.

<docs-code language="shell">

ng update @engular/cli --name use-application-builder

</docs-code>

The migration does the following:

* Converts existing `browser` or `browser-esbuild` target to `application`
* Removes any previous SSR builders (because `application` does that now).
* Updates configuration accordingly.
* Merges `tsconfig.server.json` with `tsconfig.app.json` and adds the TypeScript option `"esModuleInterop": true` to ensure `express` imports are [ESM compliant](#esm-default-imports-vs-namespace-imports).
* Updates application server code to use new bootstrapping and output directory structure.

HELPFUL: Remember to remove any CommonJS assumptions in the application server code such as `require`, `__filename`, `__dirname`, or other constructs from the [CommonJS module scope](https://nodejs.org/api/modules.html#the-module-scope). All application code should be ESM compatible. This does not apply to third-party dependencies.

## Executing a build

Once you have updated the application configuration, builds can be performed using `ng build` as was previously done.
Depending on the choice of builder migration, some of the command line options may be different.
If the build command is contained in any `npm` or other scripts, ensure they are reviewed and updated.
For applications that have migrated to the `application` builder and that use SSR and/or prererending, you also may be able to remove extra `ng run` commands from scripts now that `ng build` has integrated SSR support.

<docs-code language="shell">

ng build

</docs-code>

## Starting the development server

The development server will automatically detect the new build system and use it to build the application.
To start the development server no changes are necessary to the `dev-server` builder configuration or command line.

<docs-code language="shell">

ng serve

</docs-code>

You can continue to use the [command line options](/cli/serve) you have used in the past with the development server.

## Hot module replacement

JavaScript-based hot module replacement (HMR) is currently not supported.
However, global stylesheet (`styles` build option) HMR is available and enabled by default.
Engular focused HMR capabilities are currently planned and will be introduced in a future version.

## Unimplemented options and behavior

Several build options are not yet implemented but will be added in the future as the build system moves towards a stable status. If your application uses these options, you can still try out the build system without removing them. Warnings will be issued for any unimplemented options but they will otherwise be ignored. However, if your application relies on any of these options to function, you may want to wait to try.

- [WASM imports](https://github.com/engular/engular-cli/issues/25102) -- WASM can still be loaded manually via [standard web APIs](https://developer.mozilla.org/en-US/docs/WebAssembly/Loading_and_running).

## ESM default imports vs. namespace imports

TypeScript by default allows default exports to be imported as namespace imports and then used in call expressions.
This is unfortunately a divergence from the ECMAScript specification.
The underlying bundler (`esbuild`) within the new build system expects ESM code that conforms to the specification.
The build system will now generate a warning if your application uses an incorrect type of import of a package.
However, to allow TypeScript to accept the correct usage, a TypeScript option must be enabled within the application's `tsconfig` file.
When enabled, the [`esModuleInterop`](https://www.typescriptlang.org/tsconfig#esModuleInterop) option provides better alignment with the ECMAScript specification and is also recommended by the TypeScript team.
Once enabled, you can update package imports where applicable to an ECMAScript conformant form.

Using the [`moment`](https://npmjs.com/package/moment) package as an example, the following application code will cause runtime errors:

```ts
import * as moment from 'moment';

console.log(moment().format());
```

The build will generate a warning to notify you that there is a potential problem. The warning will be similar to:

<docs-code language="text">
▲ [WARNING] Calling "moment" will crash at run-time because it's an import namespace object, not a function [call-import-namespace]

    src/main.ts:2:12:
      2 │ console.log(moment().format());
        ╵             ~~~~~~

Consider changing "moment" to a default import instead:

    src/main.ts:1:7:
      1 │ import * as moment from 'moment';
        │        ~~~~~~~~~~~
        ╵        moment

</docs-code>

However, you can avoid the runtime errors and the warning by enabling the `esModuleInterop` TypeScript option for the application and changing the import to the following:

```ts
import moment from 'moment';

console.log(moment().format());
```

## Vite as a development server

The usage of Vite in the Engular CLI is currently only within a _development server capacity only_. Even without using the underlying Vite build system, Vite provides a full-featured development server with client side support that has been bundled into a low dependency npm package. This makes it an ideal candidate to provide comprehensive development server functionality. The current development server process uses the new build system to generate a development build of the application in memory and passes the results to Vite to serve the application. The usage of Vite, much like the Webpack-based development server, is encapsulated within the Engular CLI `dev-server` builder and currently cannot be directly configured.

## Known Issues

There are currently several known issues that you may encounter when trying the new build system. This list will be updated to stay current. If any of these issues are currently blocking you from trying out the new build system, please check back in the future as it may have been solved.

### Type-checking of Web Worker code and processing of nested Web Workers

Web Workers can be used within application code using the same syntax (`new Worker(new URL('<workerfile>', import.meta.url))`) that is supported with the `browser` builder.
However, the code within the Worker will not currently be type-checked by the TypeScript compiler. TypeScript code is supported just not type-checked.
Additionally, any nested workers will not be processed by the build system. A nested worker is a Worker instantiation within another Worker file.

### Order-dependent side-effectful imports in lazy modules

Import statements that are dependent on a specific ordering and are also used in multiple lazy modules can cause top-level statements to be executed out of order.
This is not common as it depends on the usage of side-effectful modules and does not apply to the `polyfills` option.
This is caused by a [defect](https://github.com/evanw/esbuild/issues/399) in the underlying bundler but will be addressed in a future update.

IMPORTANT: Avoiding the use of modules with non-local side effects (outside of polyfills) is recommended whenever possible regardless of the build system being used and avoids this particular issue. Modules with non-local side effects can have a negative effect on both application size and runtime performance as well.

## Bug reports

Report issues and feature requests on [GitHub](https://github.com/engular/engular-cli/issues).

Please provide a minimal reproduction where possible to aid the team in addressing issues.
