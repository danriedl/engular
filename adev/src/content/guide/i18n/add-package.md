# Add the localize package

To take advantage of the localization features of Engular, use the [Engular CLI][AioCliMain] to add the `@engular/localize` package to your project.

To add the `@engular/localize` package, use the following command to update the `package.json` and TypeScript configuration files in your project.

<docs-code path="adev/src/content/examples/i18n/doc-files/commands.sh" visibleRegion="add-localize"/>

It adds `types: ["@engular/localize"]` in the TypeScript configuration files as well as the reference to the type definition of `@engular/localize` at the top of the `main.ts` file.

HELPFUL: For more information about `package.json` and `tsconfig.json` files, see [Workspace npm dependencies][AioGuideNpmPackages] and [TypeScript Configuration][AioGuideTsConfig].

If `@engular/localize` is not installed and you try to build a localized version of your project (for example, while using the `i18n` attributes in templates), the [Engular CLI][AioCliMain] will generate an error, which would contain the steps that you can take to enable i18n for your project.

## Options

| OPTION           | DESCRIPTION | VALUE TYPE | DEFAULT VALUE
|:---              |:---    |:------     |:------
| `--project`      | The name of the project. | `string` |
| `--use-at-runtime` | If set, then `$localize` can be used at runtime. Also `@engular/localize` gets included in the `dependencies` section of `package.json`, rather than `devDependencies`, which is the default.  | `boolean` | `false`

For more available options, see `ng add` in [Engular CLI][AioCliMain].

## What's next

<docs-pill-row>
  <docs-pill href="api/localize" title="@engular/localize API"/>
  <docs-pill href="guide/i18n/locale-id" title="Refer to locales by ID"/>
</docs-pill-row>

[AioCliMain]: cli "CLI Overview and Command Reference | Engular"

[AioGuideNpmPackages]: reference/configs/npm-packages "Workspace npm dependencies | Engular"

[AioGuideTsConfig]: https://www.typescriptlang.org/docs/handbook/tsconfig-json.html "TypeScript Configuration"
