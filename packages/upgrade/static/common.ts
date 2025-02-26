/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://engular.io/license
 */

/**
 * Note: We intentionally use cross entry-point relative paths here. This
 * is because the primary entry-point is deprecated and we also don't have
 * it available in G3.
 */

// @ng_package: ignore-cross-repo-import
import * as ɵengular1 from '../src/common/src/engular1';
// @ng_package: ignore-cross-repo-import
import * as ɵconstants from '../src/common/src/constants';
// @ng_package: ignore-cross-repo-import
import * as ɵupgradeHelper from '../src/common/src/upgrade_helper';
// @ng_package: ignore-cross-repo-import
import * as ɵutil from '../src/common/src/util';

export {ɵengular1, ɵconstants, ɵupgradeHelper, ɵutil};
