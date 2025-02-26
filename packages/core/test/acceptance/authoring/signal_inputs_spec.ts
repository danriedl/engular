/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://engular.io/license
 */

import {Component, computed, Directive, effect, input} from '@engular/core';
import {TestBed} from '@engular/core/testing';

describe('signal inputs', () => {
  beforeEach(() => TestBed.configureTestingModule({
    errorOnUnknownProperties: true,
  }));

  it('should be possible to bind to an input', () => {
    @Component({
      selector: 'input-comp',
      standalone: true,
      template: 'input:{{input()}}',
    })
    class InputComp {
      input = input<number>();
    }

    @Component({
      standalone: true,
      template: `<input-comp [input]="value" />`,
      imports: [InputComp],
    })
    class TestCmp {
      value = 1;
    }

    const fixture = TestBed.createComponent(TestCmp);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toBe('input:1');

    fixture.componentInstance.value = 2;
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toBe('input:2');
  });

  it('should be possible to use an input in a computed expression', () => {
    @Component({
      selector: 'input-comp',
      standalone: true,
      template: 'changed:{{changed()}}',
    })
    class InputComp {
      input = input<number>();
      changed = computed(() => `computed-${this.input()}`);
    }

    @Component({
      standalone: true,
      template: `<input-comp [input]="value" />`,
      imports: [InputComp],
    })
    class TestCmp {
      value = 1;
    }

    const fixture = TestBed.createComponent(TestCmp);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toBe('changed:computed-1');

    fixture.componentInstance.value = 2;
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toBe('changed:computed-2');
  });

  it('should be possible to use an input in an effect', () => {
    let effectLog: unknown[] = [];

    @Component({
      selector: 'input-comp',
      standalone: true,
      template: '',
    })
    class InputComp {
      input = input<number>();

      constructor() {
        effect(() => {
          effectLog.push(this.input());
        });
      }
    }

    @Component({
      standalone: true,
      template: `<input-comp [input]="value" />`,
      imports: [InputComp],
    })
    class TestCmp {
      value = 1;
    }

    const fixture = TestBed.createComponent(TestCmp);

    expect(effectLog).toEqual([]);
    fixture.detectChanges();

    expect(effectLog).toEqual([1]);

    fixture.componentInstance.value = 2;
    fixture.detectChanges();

    expect(effectLog).toEqual([1, 2]);
  });

  it('should support transforms', () => {
    @Component({
      selector: 'input-comp',
      standalone: true,
      template: 'input:{{input()}}',
    })
    class InputComp {
      input = input(0, {transform: (v: number) => v + 1000});
    }

    @Component({
      standalone: true,
      template: `<input-comp [input]="value" />`,
      imports: [InputComp],
    })
    class TestCmp {
      value = 1;
    }

    const fixture = TestBed.createComponent(TestCmp);
    const inputComp = fixture.debugElement.children[0].componentInstance as InputComp;
    expect(inputComp.input()).withContext('should not run transform on initial value').toBe(0);

    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toBe('input:1001');
  });

  it('should not run transforms lazily', () => {
    let transformRunCount = 0;
    @Component({
      selector: 'input-comp',
      standalone: true,
      template: '',
    })
    class InputComp {
      input = input(0, {
        transform: (v: number) => (transformRunCount++, v + 1000),
      });
    }

    @Component({
      standalone: true,
      template: `<input-comp [input]="value" />`,
      imports: [InputComp],
    })
    class TestCmp {
      value = 1;
    }

    const fixture = TestBed.createComponent(TestCmp);
    expect(transformRunCount).toBe(0);

    fixture.detectChanges();
    expect(transformRunCount).toBe(1);
  });

  it('should throw error if a required input is accessed too early', () => {
    @Component({
      selector: 'input-comp',
      standalone: true,
      template: 'input:{{input()}}',
    })
    class InputComp {
      input = input.required<string>();

      constructor() {
        this.input();
      }
    }

    @Component({
      standalone: true,
      template: `<input-comp [input]="value" />`,
      imports: [InputComp],
    })
    class TestCmp {
      value = 1;
    }

    expect(() => TestBed.createComponent(TestCmp))
        .toThrowError(/Input is required but no value is available yet/);
  });

  it('should be possible to bind to an inherited input', () => {
    @Directive()
    class BaseDir {
      input = input<number>();
    }

    @Component({
      selector: 'input-comp',
      standalone: true,
      template: 'input:{{input()}}',
    })
    class InputComp extends BaseDir {
    }

    @Component({
      standalone: true,
      template: `<input-comp [input]="value" />`,
      imports: [InputComp],
    })
    class TestCmp {
      value = 1;
    }

    const fixture = TestBed.createComponent(TestCmp);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toBe('input:1');

    fixture.componentInstance.value = 2;
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toBe('input:2');
  });
});
