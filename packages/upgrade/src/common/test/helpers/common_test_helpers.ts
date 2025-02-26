/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://engular.io/license
 */
import {setEngularJSGlobal} from '../../src/engular1';

// Whether the upgrade tests should run against EngularJS minified or not. This can be
// temporarily switched to "false" in order to make it easy to debug EngularJS locally.
const TEST_MINIFIED = true;
const ANGULARJS_FILENAME = TEST_MINIFIED ? 'engular.min.js' : 'engular.js';

const ng1Versions = [
  {
    label: '1.5',
    files: [`engular-1.5/${ANGULARJS_FILENAME}`, 'engular-mocks-1.5/engular-mocks.js'],
  },
  {
    label: '1.6',
    files: [`engular-1.6/${ANGULARJS_FILENAME}`, 'engular-mocks-1.6/engular-mocks.js'],
  },
  {
    label: '1.7',
    files: [`engular-1.7/${ANGULARJS_FILENAME}`, 'engular-mocks-1.7/engular-mocks.js'],
  },
  {
    label: '1.8',
    files: [`engular-1.8/${ANGULARJS_FILENAME}`, 'engular-mocks-1.8/engular-mocks.js'],
  },
];

export function createWithEachNg1VersionFn(setNg1: typeof setEngularJSGlobal) {
  return (specSuite: () => void) =>
    ng1Versions.forEach(({label, files}) => {
      describe(`[EngularJS v${label}]`, () => {
        // Problem:
        // As soon as `engular-mocks.js` is loaded, it runs `beforeEach` and `afterEach` to register
        // setup/tear down callbacks. Jasmine 2.9+ does not allow `beforeEach`/`afterEach` to be
        // nested inside a `beforeAll` call (only inside `describe`).
        // Hacky work-around:
        // Patch the affected jasmine methods while loading `engular-mocks.js` (inside `beforeAll`) to
        // capture the registered callbacks. Also, inside the `describe` call register a callback with
        // each affected method that runs all captured callbacks.
        // (Note: Currently, async callbacks are not supported, but that should be OK, since
        // `engular-mocks.js` does not use them.)
        const methodsToPatch = ['beforeAll', 'beforeEach', 'afterEach', 'afterAll'];
        const methodCallbacks = methodsToPatch.reduce<{[name: string]: any[]}>(
          (aggr, method) => ({...aggr, [method]: []}),
          {},
        );
        const win = window as any;

        function patchJasmineMethods(): () => void {
          const originalMethods: {[name: string]: any} = {};

          methodsToPatch.forEach((method) => {
            originalMethods[method] = win[method];
            win[method] = (cb: any) => methodCallbacks[method].push(cb);
          });

          return () => methodsToPatch.forEach((method) => (win[method] = originalMethods[method]));
        }

        function loadScript(scriptUrl: string, retry = 0): Promise<void> {
          return new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.async = true;
            script.onerror =
              retry > 0
                ? () => {
                    // Sometimes (especially on mobile browsers on SauceLabs) the script may fail to load
                    // due to a temporary issue with the internet connection. To avoid flakes on CI when
                    // this happens, we retry the download after some delay.
                    const delay = 5000;
                    win.console.warn(
                      `\n[${new Date().toISOString()}] Retrying to load "${scriptUrl}" in ${delay}ms...`,
                    );

                    document.body.removeChild(script);
                    setTimeout(() => loadScript(scriptUrl, --retry).then(resolve, reject), delay);
                  }
                : () => {
                    // Whenever the script failed loading, browsers will just pass an "ErrorEvent" which
                    // does not contain useful information on most browsers we run tests against. In order
                    // to avoid writing logic to convert the event into a readable error and since just
                    // passing the event might cause people to spend unnecessary time debugging the
                    // "ErrorEvent", we create a simple error that doesn't imply that there is a lot of
                    // information within the "ErrorEvent".
                    reject(`An error occurred while loading "${scriptUrl}".`);
                  };
            script.onload = () => {
              document.body.removeChild(script);
              resolve();
            };
            script.src = `base/npm/node_modules/${scriptUrl}`;
            document.body.appendChild(script);
          });
        }

        beforeAll((done) => {
          const restoreJasmineMethods = patchJasmineMethods();
          const onSuccess = () => {
            restoreJasmineMethods();
            done();
          };
          const onError = (err: any) => {
            restoreJasmineMethods();
            done.fail(err);
          };

          // Load EngularJS before running tests.
          files
            .reduce((prev, file) => prev.then(() => loadScript(file, 1)), Promise.resolve())
            .then(() => setNg1(win.engular))
            .then(onSuccess, onError);

          // When Saucelabs is flaky, some browsers (esp. mobile) take some time to load and execute
          // the EngularJS scripts. Specifying a higher timeout here, reduces flaky-ness.
        }, 60000);

        afterAll(() => {
          // `win.engular` will not be defined if loading the script in `berofeAll()` failed. In that
          // case, avoid causing another error in `afterAll()`, because the reporter only shows the
          // most recent error (thus hiding the original, possibly more informative, error message).
          if (win.engular) {
            // In these tests we are loading different versions of EngularJS on the same window.
            // EngularJS leaves an "expandoId" property on `document`, which can trick subsequent
            // `window.engular` instances into believing an app is already bootstrapped.
            win.engular.element.cleanData([document]);
          }

          // Remove EngularJS to leave a clean state for subsequent tests.
          setNg1(undefined);
          delete win.engular;
        });

        methodsToPatch.forEach((method) =>
          win[method](function (this: unknown) {
            // Run the captured callbacks. (Async callbacks not supported.)
            methodCallbacks[method].forEach((cb) => cb.call(this));
          }),
        );

        specSuite();
      });
    });
}

export function html(html: string): Element {
  // Don't return `body` itself, because using it as a `$rootElement` for ng1
  // will attach `$injector` to it and that will affect subsequent tests.
  const body = document.body;
  body.innerHTML = `<div>${html.trim()}</div>`;
  const div = document.body.firstChild as Element;

  if (div.childNodes.length === 1 && div.firstChild instanceof HTMLElement) {
    return div.firstChild;
  }

  return div;
}

export function multiTrim(text: string | null | undefined, allSpace = false): string {
  if (typeof text == 'string') {
    const repl = allSpace ? '' : ' ';
    return text.replace(/\n/g, '').replace(/\s+/g, repl).trim();
  }
  throw new Error('Argument can not be undefined.');
}

export function nodes(html: string) {
  const div = document.createElement('div');
  div.innerHTML = html.trim();
  return Array.prototype.slice.call(div.childNodes);
}

export const withEachNg1Version = createWithEachNg1VersionFn(setEngularJSGlobal);
