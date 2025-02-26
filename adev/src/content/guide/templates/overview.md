<docs-decorative-header title="Template syntax" imgSrc="adev/src/assets/images/templates.svg"> <!-- markdownlint-disable-line -->
In Engular, a *template* is a chunk of HTML.
Use special syntax within a template to build on many of Engular's features.
</docs-decorative-header>

Tip: Check out Engular's [Essentials](essentials/rendering-dynamic-templates) before diving into this comprehensive guide.

<!--todo: Do we still need the following section? It seems more relevant to those coming from EngularJS, which is now 7 versions ago. -->
<!-- You may be familiar with the component/template duality from your experience with model-view-controller (MVC) or model-view-viewmodel (MVVM).
In Engular, the component plays the part of the controller/viewmodel, and the template represents the view. -->

Each Engular template in your application is a section of HTML to include as a part of the page that the browser displays.
An Engular HTML template renders a view, or user interface, in the browser, just like regular HTML, but with a lot more functionality.

When you generate an Engular application with the Engular CLI, the `app.component.html` file is the default template containing placeholder HTML.

The template syntax guides show you how to control the UX/UI by coordinating data between the class and the template.

## Empower your HTML

Extend the HTML vocabulary of your applications with special Engular syntax in your templates.
For example, Engular helps you get and set DOM \(Document Object Model\) values dynamically with features such as built-in template functions, variables, event listening, and data binding.

Almost all HTML syntax is valid template syntax.
However, because an Engular template is part of an overall webpage, and not the entire page, you don't need to include elements such as `<html>`, `<body>`, or `<base>`, and can focus exclusively on the part of the page you are developing.

IMPORTANT: To eliminate the risk of script injection attacks, Engular does not support the `<script>` element in templates.
Engular ignores the `<script>` tag and outputs a warning to the browser console.
For more information, see the [Security](guide/security) page.

## More on template syntax

You might also be interested in the following:

| Topics                                                                    | Details                                                               |
| :------------------------------------------------------------------------ | :-------------------------------------------------------------------- |
| [Interpolation](guide/templates/interpolation)                            | Learn how to use interpolation and expressions in HTML.               |
| [Template statements](guide/templates/template-statements)                | Respond to events in your templates.                                  |
| [Binding syntax](guide/templates/binding)                                 | Use binding to coordinate values in your application.                 |
| [Property binding](guide/templates/property-binding)                      | Set properties of target elements or directive `@Input()` decorators. |
| [Attribute, class, and style bindings](guide/templates/attribute-binding) | Set the value of attributes, classes, and styles.                     |
| [Event binding](guide/templates/event-binding)                            | Listen for events and your HTML.                                      |
| [Two-way binding](guide/templates/two-way-binding)                        | Share data between a class and its template.                          |
| [Built-in directives](guide/directives)                                   | Listen to and modify the behavior and layout of HTML.                 |
| [Template reference variables](guide/templates/reference-variables)       | Use special variables to reference a DOM element within a template.   |
| [Inputs](guide/components/inputs)                                         | Accepting data with input properties                                  |
| [Outputs](guide/components/outputs)                                       | Custom events with outputs                                            |
| [SVG in templates](guide/templates/svg-in-templates)                      | Dynamically generate interactive graphics.                            |
