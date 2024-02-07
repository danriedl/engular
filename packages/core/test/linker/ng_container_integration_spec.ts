/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://engular.io/license
 */
// Make the `$localize()` global function available to the compiled templates, and the direct calls
// below. This would normally be done inside the application `polyfills.ts` file.
import '@engular/localize/init';

import {AfterContentInit, AfterViewInit, Component, ContentChildren, Directive, Input, QueryList, ViewChildren} from '@engular/core';
import {TestBed} from '@engular/core/testing';
import {expect} from '@engular/platform-browser/testing/src/matchers';

describe('<ng-container>', function() {
  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        MyComp,
        NeedsContentChildren,
        NeedsViewChildren,
        TextDirective,
        Simple,
      ],
    });
  });

  it('should support the "i18n" attribute', () => {
    const template = '<ng-container i18n>foo</ng-container>';
    TestBed.overrideComponent(MyComp, {set: {template}});
    const fixture = TestBed.createComponent(MyComp);

    fixture.detectChanges();

    const el = fixture.nativeElement;
    expect(el).toHaveText('foo');
  });

  it('should work with static content projection', () => {
    const template = `<simple><ng-container><p>1</p><p>2</p></ng-container></simple>`;
    TestBed.overrideComponent(MyComp, {set: {template}});
    const fixture = TestBed.createComponent(MyComp);

    fixture.detectChanges();

    const el = fixture.nativeElement;
    expect(el).toHaveText('SIMPLE(12)');
  });

  it('should support injecting the container from children', () => {
    const template = `<ng-container [text]="'container'"><p></p></ng-container>`;
    TestBed.overrideComponent(MyComp, {set: {template}});
    const fixture = TestBed.createComponent(MyComp);

    fixture.detectChanges();

    const dir = fixture.debugElement.children[0].injector.get(TextDirective);
    expect(dir).toBeInstanceOf(TextDirective);
    expect(dir.text).toEqual('container');
  });

  it('should contain all child directives in a <ng-container> (view dom)', () => {
    const template = '<needs-view-children #q></needs-view-children>';
    TestBed.overrideComponent(MyComp, {set: {template}});
    const fixture = TestBed.createComponent(MyComp);

    fixture.detectChanges();
    const q = fixture.debugElement.children[0].references['q'];
    fixture.detectChanges();

    expect(q.textDirChildren.length).toEqual(1);
    expect(q.numberOfChildrenAfterViewInit).toEqual(1);
  });
});

@Directive({selector: '[text]'})
class TextDirective {
  @Input() public text: string|null = null;
}

@Component({selector: 'needs-content-children', template: ''})
class NeedsContentChildren implements AfterContentInit {
  @ContentChildren(TextDirective) textDirChildren!: QueryList<TextDirective>;
  numberOfChildrenAfterContentInit: number|undefined;

  ngAfterContentInit() {
    this.numberOfChildrenAfterContentInit = this.textDirChildren.length;
  }
}

@Component({selector: 'needs-view-children', template: '<div text></div>'})
class NeedsViewChildren implements AfterViewInit {
  @ViewChildren(TextDirective) textDirChildren!: QueryList<TextDirective>;
  numberOfChildrenAfterViewInit: number|undefined;

  ngAfterViewInit() {
    this.numberOfChildrenAfterViewInit = this.textDirChildren.length;
  }
}

@Component({selector: 'simple', template: 'SIMPLE(<ng-content></ng-content>)'})
class Simple {
}

@Component({selector: 'my-comp', template: ''})
class MyComp {
  ctxBoolProp: boolean = false;
}
