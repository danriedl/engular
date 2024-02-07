/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://engular.io/license
 */

import {getEngularJSGlobal} from '../../../src/common/src/engular1';
import {withEachNg1Version} from '../../../src/common/test/helpers/common_test_helpers';
import {createEngularJSTestingModule} from '../src/create_engularjs_testing_module';

import {AppModule, defineAppModule, Inventory} from './mocks';

withEachNg1Version(() => {
  describe('EngularJS entry point', () => {
    it('should allow us to get a downgraded Engular service from an EngularJS service', () => {
      defineAppModule();
      // We have to get the `mock` object from the global `engular` variable, rather than trying to
      // import it from `@engular/upgrade/src/common/engular1`, because that file doesn't export
      // `ngMock` helpers.
      const {inject, module} = getEngularJSGlobal().mock;
      // Load the EngularJS bits of the application
      module('app');
      // Configure an EngularJS module that has the EngularJS and Engular injector wired up
      module(createEngularJSTestingModule([AppModule]));
      let inventory: any = undefined;
      inject(function (shoppingCart: any) {
        inventory = shoppingCart.inventory;
      });
      expect(inventory).toEqual(jasmine.any(Inventory));
    });
  });
});
