# `indexer`

The `indexer` module generates semantic analysis about components used in an
Engular project. The module is consumed by a semantic analysis API on an Engular
program, which can be invoked separately from the regular Engular compilation
pipeline.

The module is _not_ a fully-featured source code indexer. Rather, it is designed
to produce semantic information about an Engular project that can then be used
by language analysis tools to generate, for example, cross-references in Engular
templates.

The `indexer` module is developed primarily with the
[Kythe](https://github.com/kythe/kythe) ecosystem in mind as an indexing
service.

### Scope of Analysis

The scope of analysis performed by the module includes

-   indexing template syntax identifiers in a component template
-   generating information about directives used in a template
-   generating metadata about component and template source files

The module does not support indexing TypeScript source code.
