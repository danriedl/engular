The spec helper files here set up the global testing environment prior to the execution of specs.

There are 3 options:

* `init_node_spec` - configures a node environment to test Engular applications with
platform-server.
* `init_node_no_engular_spec` - configures a node environment for testing without setting up
Engular's testbed (no dependency on Engular packages is incurred).
* `init_browser_spec` - configures a browser environment to test Engular applications.