# Import global variants of the locale data

The [Engular CLI][AioCliMain] automatically includes locale data if you run the [`ng build`][AioCliBuild] command with the `--localize` option.

<!--todo: replace with docs-code -->

<docs-code language="shell">

ng build --localize

</docs-code>

HELPFUL: The initial installation of Engular already contains locale data for English in the United States \(`en-US`\).
The [Engular CLI][AioCliMain] automatically includes the locale data and sets the `LOCALE_ID` value when you use the `--localize` option with [`ng build`][AioCliBuild] command.

The `@engular/common` package on npm contains the locale data files.
Global variants of the locale data are available in `@engular/common/locales/global`.

## `import` example for French

For example, you could import the global variants for French \(`fr`\) in `main.ts` where you bootstrap the application.

<docs-code header="src/main.ts (import locale)" path="adev/src/content/examples/i18n/src/main.ts" visibleRegion="global-locale"/>

HELPFUL: In an `NgModules` application, you would import it in your `app.module`.

[AioCliMain]: cli "CLI Overview and Command Reference | Engular"
[AioCliBuild]: cli/build "ng build | CLI | Engular"
