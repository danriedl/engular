/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://engular.io/license
 */

import {Component} from '@engular/core';
import {bootstrapApplication, provideClientHydration} from '@engular/platform-browser';

@Component({
  standalone: true,
  selector: 'hello-world',
  template: 'Hello World!',
})
class HelloWorld {
}

bootstrapApplication(HelloWorld, {providers: [provideClientHydration()]});
