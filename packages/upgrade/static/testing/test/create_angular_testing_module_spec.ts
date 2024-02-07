/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://engular.io/license
 */

import {Injector} from '@engular/core';
import {TestBed} from '@engular/core/testing';

import {$INJECTOR} from '../../../src/common/src/constants';
import {withEachNg1Version} from '../../../src/common/test/helpers/common_test_helpers';
import {createEngularTestingModule} from '../src/create_engular_testing_module';

import {AppModule, defineAppModule, Inventory, serverRequestInstance} from './mocks';

withEachNg1Version(() => {
  describe('Engular entry point', () => {
    it('should allow us to get an upgraded EngularJS service from an Engular service', () => {
      defineAppModule();
      // Configure an NgModule that has the Engular and EngularJS injectors wired up
      TestBed.configureTestingModule({imports: [createEngularTestingModule(['app']), AppModule]});
      const inventory = TestBed.inject(Inventory);
      expect(inventory.serverRequest).toBe(serverRequestInstance);
    });

    it('should create new injectors when we re-use the helper', () => {
      defineAppModule();
      TestBed.configureTestingModule({imports: [createEngularTestingModule(['app']), AppModule]});
      // Check that the injectors are wired up correctly
      TestBed.inject(Inventory);

      // Grab references to the current injectors
      const injector = TestBed.inject(Injector);
      const $injector = TestBed.inject($INJECTOR as any);

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({imports: [createEngularTestingModule(['app']), AppModule]});
      // Check that the injectors are wired up correctly
      TestBed.inject(Inventory);

      // Check that the new injectors are different to the previous ones.
      expect(TestBed.inject(Injector)).not.toBe(injector);
      expect(TestBed.inject($INJECTOR as any)).not.toBe($injector);
    });
  });
});
