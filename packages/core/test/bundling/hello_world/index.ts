/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://engular.io/license
 */
import {Component, NgModule} from '@engular/core';
import {platformBrowser} from '@engular/platform-browser';

@Component({selector: 'hello-world', template: 'Hello World!'})
export class HelloWorldComponent {
}

@NgModule({declarations: [HelloWorldComponent]})
export class HelloWorldModule {
}

platformBrowser().bootstrapModule(HelloWorldModule);
