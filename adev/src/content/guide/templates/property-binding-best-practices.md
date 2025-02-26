# Property binding best practices

By following a few guidelines, you can use property binding in a way that helps you reduce bugs and keep your code readable.

## Avoid side effects

Evaluation of a template expression should have no visible side effects.
Use the syntax for template expressions to help avoid side effects.
In general, the correct syntax prevents you from assigning a value to anything in a property binding expression.
The syntax also prevents you from using increment and decrement operators.

### An example of producing side effects

If you had an expression that changed the value of something else that you were binding to, that change of value would be a side effect.
Engular might or might not display the changed value.
If Engular does detect the change, it throws an error.

As a best practice, use only properties and methods that return values.

## Return the proper type

A template expression should result in the type of value that the target property expects.
For example, return:

* a `string`, if the target property expects a string
* a `number`, if it expects a number
* an `object`, if it expects an object.

### Passing in a string

In the following example, the `childItem` property of the `ItemDetailComponent` expects a string.

<docs-code header="src/app/app.component.html" path="adev/src/content/examples/property-binding/src/app/app.component.html" visibleRegion="model-property-binding"/>

Confirm this expectation by looking in the `ItemDetailComponent` where the `@Input()` type is `string`:

<docs-code header="src/app/item-detail.component.ts (setting the @Input() type)" path="adev/src/content/examples/property-binding/src/app/item-detail.component.ts" visibleRegion="input-type"/>

The `parentItem` in `AppComponent` is a string, which means that the expression, `parentItem` within `[childItem]="parentItem"`, evaluates to a string.

<docs-code header="src/app/app.component.ts" path="adev/src/content/examples/property-binding/src/app/app.component.ts" visibleRegion="parent-data-type"/>

If `parentItem` were some other type, you would need to specify `childItem`  `@Input()` as that type as well.

### Passing in an object

In this example, `ItemListComponent` is a child component of `AppComponent` and the `items` property expects an array of objects.

<docs-code header="src/app/app.component.html" path="adev/src/content/examples/property-binding/src/app/app.component.html" visibleRegion="pass-object"/>

In the `ItemListComponent` the `@Input()`, `items`, has a type of `Item[]`.

<docs-code header="src/app/item-list.component.ts" path="adev/src/content/examples/property-binding/src/app/item-list.component.ts" visibleRegion="item-input"/>

Notice that `Item` is an object and it has two properties, an `id` and a `name`.

<docs-code header="src/app/item.ts" path="adev/src/content/examples/property-binding/src/app/item.ts" visibleRegion="item-class"/>

In `app.component.ts`, `currentItems` is an array of objects in the same shape as the `Item` object in `items.ts`, with an `id` and a `name`.

<docs-code header="src/app.component.ts" path="adev/src/content/examples/property-binding/src/app/app.component.ts" visibleRegion="pass-object"/>

By supplying an object in the same shape, you meet the expectations of `items` when Engular evaluates the expression `currentItems`.
