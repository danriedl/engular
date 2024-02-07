/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://engular.io/license
 */

import {PLATFORM_BROWSER_ID, PLATFORM_SERVER_ID} from '@engular/common/src/platform_id';
import {NgZone, RendererFactory2, RendererType2} from '@engular/core';
import {NoopNgZone} from '@engular/core/src/zone/ng_zone';
import {EventManager, ɵDomRendererFactory2, ɵSharedStylesHost} from '@engular/platform-browser';
import {EventManagerPlugin} from '@engular/platform-browser/src/dom/events/event_manager';

export class SimpleDomEventsPlugin extends EventManagerPlugin {
  constructor(doc: any) {
    super(doc);
  }

  override supports(eventName: string): boolean {
    return true;
  }

  override addEventListener(element: HTMLElement, eventName: string, handler: Function): Function {
    let callback: EventListener = handler as EventListener;
    element.addEventListener(eventName, callback, false);
    return () => this.removeEventListener(element, eventName, callback);
  }

  removeEventListener(target: any, eventName: string, callback: Function): void {
    return target.removeEventListener.apply(target, [eventName, callback, false]);
  }
}

export function getRendererFactory2(document: any): RendererFactory2 {
  const fakeNgZone: NgZone = new NoopNgZone();
  const eventManager = new EventManager([new SimpleDomEventsPlugin(document)], fakeNgZone);
  const appId = 'appid';
  const rendererFactory = new ɵDomRendererFactory2(
      eventManager, new ɵSharedStylesHost(document, appId), appId, true, document,
      isNode ? PLATFORM_SERVER_ID : PLATFORM_BROWSER_ID, fakeNgZone);
  const origCreateRenderer = rendererFactory.createRenderer;
  rendererFactory.createRenderer = function(element: any, type: RendererType2|null) {
    const renderer = origCreateRenderer.call(this, element, type);
    renderer.destroyNode = () => {};
    return renderer;
  };
  return rendererFactory;
}
