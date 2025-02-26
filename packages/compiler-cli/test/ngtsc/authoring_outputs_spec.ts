/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {runInEachFileSystem} from '../../src/ngtsc/file_system/testing';
import {loadStandardTestFiles} from '../../src/ngtsc/testing';

import {NgtscTestEnvironment} from './env';

const testFiles = loadStandardTestFiles();

runInEachFileSystem(() => {
  describe('initializer-based output() API', () => {
    let env!: NgtscTestEnvironment;

    beforeEach(() => {
      env = NgtscTestEnvironment.setup(testFiles);
      env.tsconfig({strictTemplates: true});
    });

    it('should handle a basic output()', () => {
      env.write('test.ts', `
        import {Component, output} from '@angular/core';

        @Component({selector: 'test', template: ''})
        export class TestDir {
          click = output();
        }
      `);
      env.driveMain();

      const js = env.getContents('test.js');
      const dts = env.getContents('test.d.ts');

      expect(js).toContain(`outputs: { click: "click" }`);
      expect(dts).toContain('{ "click": "click"; ');
    });

    it('should handle an aliased output()', () => {
      env.write('test.ts', `
        import {Component, output} from '@angular/core';

        @Component({selector: 'test', template: ''})
        export class TestDir {
          click = output({alias: 'publicClick'});
        }
      `);
      env.driveMain();

      const js = env.getContents('test.js');
      const dts = env.getContents('test.d.ts');

      expect(js).toContain(`outputs: { click: "publicClick" }`);
      expect(dts).toContain('{ "click": "publicClick"; ');
    });

    describe('diagnostics', () => {
      it('should fail if used with @Output decorator', () => {
        env.write('test.ts', `
          import {Component, Output, output} from '@angular/core';

          @Component({selector: 'test', template: ''})
          export class TestDir {
            @Output() click = output({alias: 'publicClick'});
          }
        `);
        const diagnostics = env.driveDiagnostics();

        expect(diagnostics).toEqual([
          jasmine.objectContaining(
              {messageText: 'Using "@Output" with "output()" is not allowed.'}),
        ]);
      });

      it('should fail if used with output declared in @Directive metadata', () => {
        env.write('test.ts', `
          import {Directive, Output, output} from '@angular/core';

          @Directive({
            selector: 'test',
            outputs: ['click'],
          })
          export class TestDir {
            click = output({alias: 'publicClick'});
          }
        `);
        const diagnostics = env.driveDiagnostics();

        expect(diagnostics).toEqual([
          jasmine.objectContaining(
              {messageText: 'Output "click" is unexpectedly declared in @Directive as well.'}),
        ]);
      });

      it('should fail if used with output declared in @Component metadata', () => {
        env.write('test.ts', `
          import {Component, Output, output} from '@angular/core';

          @Component({
            selector: 'test',
            template: '',
            outputs: ['click'],
          })
          export class TestDir {
            click = output({alias: 'publicClick'});
          }
        `);
        const diagnostics = env.driveDiagnostics();

        expect(diagnostics).toEqual([
          jasmine.objectContaining(
              {messageText: 'Output "click" is unexpectedly declared in @Component as well.'}),
        ]);
      });

      it('should fail if declared on a static member', () => {
        env.write('test.ts', `
          import {Component, output} from '@angular/core';

          @Component({
            selector: 'test',
            template: '',
          })
          export class TestDir {
            static click = output({alias: 'publicClick'});
          }
        `);
        const diagnostics = env.driveDiagnostics();

        expect(diagnostics).toEqual([
          jasmine.objectContaining(
              {messageText: 'Output is incorrectly declared on a static class member.'}),
        ]);
      });

      it('should fail if `.required` method is used (even though not supported via types)', () => {
        env.write('test.ts', `
          import {Component, output} from '@angular/core';

          @Component({
            selector: 'test',
            template: '',
          })
          export class TestDir {
            // @ts-ignore
            click = output.required({alias: 'publicClick'});
          }
        `);
        const diagnostics = env.driveDiagnostics();

        expect(diagnostics).toEqual([
          jasmine.objectContaining({messageText: 'Output does not support ".required()".'}),
        ]);
      });
    });
  });
});
