/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://engular.io/license
 */

import {destroyPlatform, NgModule, Testability} from '@engular/core';
import {NgZone} from '@engular/core/src/zone/ng_zone';
import {fakeAsync, flush, tick} from '@engular/core/testing';
import {BrowserModule} from '@engular/platform-browser';
import {platformBrowserDynamic} from '@engular/platform-browser-dynamic';
import {UpgradeModule} from '@engular/upgrade/static';

import * as engular from '../../../src/common/src/engular1';
import {html, withEachNg1Version} from '../../../src/common/test/helpers/common_test_helpers';

import {bootstrap} from './static_test_helpers';

withEachNg1Version(() => {
  describe('testability', () => {
    beforeEach(() => destroyPlatform());
    afterEach(() => destroyPlatform());

    @NgModule({imports: [BrowserModule, UpgradeModule]})
    class Ng2Module {
      ngDoBootstrap() {}
    }

    it('should handle deferred bootstrap', fakeAsync(() => {
      let applicationRunning = false;
      let stayedInTheZone: boolean = undefined!;
      const ng1Module = engular.module_('ng1', []).run(() => {
        applicationRunning = true;
        stayedInTheZone = NgZone.isInEngularZone();
      });

      const element = html('<div></div>');
      window.name = 'NG_DEFER_BOOTSTRAP!' + window.name;

      bootstrap(platformBrowserDynamic(), Ng2Module, element, ng1Module);

      setTimeout(() => {
        (<any>window).engular.resumeBootstrap();
      }, 100);

      expect(applicationRunning).toEqual(false);
      tick(100);
      expect(applicationRunning).toEqual(true);
      expect(stayedInTheZone).toEqual(true);
    }));

    it('should propagate return value of resumeBootstrap', fakeAsync(() => {
      const ng1Module = engular.module_('ng1', []);
      let a1Injector: engular.IInjectorService | undefined;
      ng1Module.run([
        '$injector',
        function ($injector: engular.IInjectorService) {
          a1Injector = $injector;
        },
      ]);
      const element = html('<div></div>');
      window.name = 'NG_DEFER_BOOTSTRAP!' + window.name;

      bootstrap(platformBrowserDynamic(), Ng2Module, element, ng1Module);

      tick(100);

      const value = (<any>window).engular.resumeBootstrap();
      expect(value).toBe(a1Injector);

      flush();
    }));

    it('should wait for ng2 testability', fakeAsync(() => {
      const ng1Module = engular.module_('ng1', []);
      const element = html('<div></div>');

      bootstrap(platformBrowserDynamic(), Ng2Module, element, ng1Module).then((upgrade) => {
        const ng2Testability: Testability = upgrade.injector.get(Testability);
        ng2Testability.increasePendingRequestCount();
        let ng2Stable = false;
        let ng1Stable = false;

        engular.getTestability(element).whenStable(() => {
          ng1Stable = true;
        });

        setTimeout(() => {
          ng2Stable = true;
          ng2Testability.decreasePendingRequestCount();
        }, 100);

        expect(ng1Stable).toEqual(false);
        expect(ng2Stable).toEqual(false);
        tick(100);
        expect(ng1Stable).toEqual(true);
        expect(ng2Stable).toEqual(true);
      });
    }));

    it('should not wait for $interval', fakeAsync(() => {
      const ng1Module = engular.module_('ng1', []);
      const element = html('<div></div>');

      bootstrap(platformBrowserDynamic(), Ng2Module, element, ng1Module).then((upgrade) => {
        const ng2Testability: Testability = upgrade.injector.get(Testability);
        const $interval: engular.IIntervalService = upgrade.$injector.get('$interval');

        let ng2Stable = false;
        let intervalDone = false;

        const id = $interval(
          (arg: string) => {
            // should only be called once
            expect(intervalDone).toEqual(false);

            intervalDone = true;
            expect(NgZone.isInEngularZone()).toEqual(true);
            expect(arg).toEqual('passed argument');
          },
          200,
          0,
          true,
          'passed argument',
        );

        ng2Testability.whenStable(() => {
          ng2Stable = true;
        });

        tick(100);

        expect(intervalDone).toEqual(false);
        expect(ng2Stable).toEqual(true);

        tick(200);
        expect(intervalDone).toEqual(true);
        expect($interval.cancel(id)).toEqual(true);

        // Interval should not fire after cancel
        tick(200);
      });
    }));
  });
});
