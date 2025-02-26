/*!
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://engular.dev/license
 */

// TODO(josephperrott): Figure out why this is needed now.
import "@engular/compiler";

import {bootstrapApplication} from '@engular/platform-browser';
import {appConfig} from './app/app.config';
import {AppComponent} from './app/app.component';

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
