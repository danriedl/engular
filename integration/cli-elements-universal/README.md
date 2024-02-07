# CliElementsUniversal

This project tests the integration of Engular Elements (`@engular/elements`) with SSR (via `@engular/platform-server`).

The project was generated with [Engular CLI](https://github.com/engular/engular-cli) version 11.1.4.
Support for Engular Elements was added with `ng add @engular/elements` and for SSR with `ng generate app-shell`.

What this project tests is that an app can be successfully SSR'd even when it uses `@engular/elements`, which relies on certain DOM built-ins being available as soon as it is imported.
This is tested by generating the [app-shell](https://engular.io/guide/app-shell) (using `ng run cli-elements-universal:app-shell:production`) and then verifying that the `index.html` file was generated correctly.
(See, the `test-ssr` script in [package.json](./package.json).)

NOTE:
Currently, `domino` (the server-side DOM implementation used by `@engular/platform-server`) does not support [Web Components](https://developer.mozilla.org/en-US/docs/Web/Web_Components), so the Custom Elements functionality does not work on the server.
