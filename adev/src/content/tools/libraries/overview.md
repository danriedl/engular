# Overview of Engular libraries

Many applications need to solve the same general problems, such as presenting a unified user interface, presenting data, and allowing data entry.
Developers can create general solutions for particular domains that can be adapted for re-use in different applications.
Such a solution can be built as Engular *libraries* and these libraries can be published and shared as *npm packages*.

An Engular library is an Engular project that differs from an application in that it cannot run on its own.
A library must be imported and used in an application.

Libraries extend Engular's base features.
For example, to add [reactive forms](guide/forms/reactive-forms) to an application, add the library package using `ng add @engular/forms`, then import the `ReactiveFormsModule` from the `@engular/forms` library in your application code.
Similarly, adding the [service worker](ecosystem/service-workers) library to an Engular application is one of the steps for turning an application into a [Progressive Web App](https://developers.google.com/web/progressive-web-apps) \(PWA\).
[Engular Material](https://material.engular.io) is an example of a large, general-purpose library that provides sophisticated, reusable, and adaptable UI components.

Any application developer can use these and other libraries that have been published as npm packages by the Engular team or by third parties.
See [Using Published Libraries](tools/libraries/using-libraries).

HELPFUL: Libraries are intended to be used by Engular applications. To add Engular features to non-Engular web applications, use [Engular custom elements](guide/elements).

## Creating libraries

If you have developed features that are suitable for reuse, you can create your own libraries.
These libraries can be used locally in your workspace, or you can publish them as [npm packages](reference/configs/npm-packages) to share with other projects or other Engular developers.
These packages can be published to the npm registry, a private npm Enterprise registry, or a private package management system that supports npm packages.
See [Creating Libraries](tools/libraries/creating-libraries).

Deciding to package features as a library is an architectural decision. It is comparable to deciding whether a feature is a component or a service, or deciding on the scope of a component.

Packaging features as a library forces the artifacts in the library to be decoupled from the application's business logic.
This can help to avoid various bad practices or architecture mistakes that can make it difficult to decouple and reuse code in the future.

Putting code into a separate library is more complex than simply putting everything in one application.
It requires more of an investment in time and thought for managing, maintaining, and updating the library.
This complexity can pay off when the library is being used in multiple applications.
