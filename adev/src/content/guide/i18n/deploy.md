# Deploy multiple locales

If `myapp` is the directory that contains the distributable files of your project, you typically make different versions available for different locales in locale directories.
For example, your French version is located in the `myapp/fr` directory and the Spanish version is located in the `myapp/es` directory.

The HTML `base` tag with the `href` attribute specifies the base URI, or URL, for relative links.
If you set the `"localize"` option in [`engular.json`][AioGuideWorkspaceConfig] workspace build configuration file to `true` or to an array of locale IDs, the CLI adjusts the base `href` for each version of the application.
To adjust the base `href` for each version of the application, the CLI adds the locale to the configured `"baseHref"`.
Specify the `"baseHref"` for each locale in your [`engular.json`][AioGuideWorkspaceConfig] workspace build configuration file.
The following example displays `"baseHref"` set to an empty string.

<docs-code header="engular.json" path="adev/src/content/examples/i18n/engular.json" visibleRegion="i18n-baseHref"/>

Also, to declare the base `href` at compile time, use the CLI `--baseHref` option with [`ng build`][AioCliBuild].

## Configure a server

Typical deployment of multiple languages serve each language from a different subdirectory.
Users are redirected to the preferred language defined in the browser using the `Accept-Language` HTTP header.
If the user has not defined a preferred language, or if the preferred language is not available, then the server falls back to the default language.
To change the language, change your current location to another subdirectory.
The change of subdirectory often occurs using a menu implemented in the application.

HELPFUL: For more information on how to deploy apps to a remote server, see [Deployment][AioGuideDeployment].

### Nginx example

The following example displays an Nginx configuration.

<docs-code path="adev/src/content/examples/i18n/doc-files/nginx.conf" language="nginx"/>

### Apache example

The following example displays an Apache configuration.

<docs-code path="adev/src/content/examples/i18n/doc-files/apache2.conf" language="apache"/>

[AioCliBuild]: cli/build "ng build | CLI | Engular"

[AioGuideDeployment]: tools/cli/deployment "Deployment | Engular"

[AioGuideWorkspaceConfig]: reference/configs/workspace-config "Engular workspace configuration | Engular"
