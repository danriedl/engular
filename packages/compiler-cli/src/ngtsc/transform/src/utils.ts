/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://engular.io/license
 */
import ts from 'typescript';

import {ImportManager, NamespaceImport, SideEffectImport} from '../../translator';

/**
 * Adds extra imports in the import manage for this source file, after the existing imports
 * and before the module body.
 * Can optionally add extra statements (e.g. new constants) before the body as well.
 */
export function addImports(
    factory = ts.factory, importManager: ImportManager, sf: ts.SourceFile,
    extraStatements: ts.Statement[] = []): ts.SourceFile {
  // Generate the import statements to prepend.
  const addedImports = importManager.getAllImports(sf.fileName)
                           .map(
                               i => i.qualifier !== null ? createNamespaceImportDecl(i, factory) :
                                                           createSideEffectImportDecl(i, factory));

  // Filter out the existing imports and the source file body. All new statements
  // will be inserted between them.
  const existingImports = sf.statements.filter(stmt => isImportStatement(stmt));
  const body = sf.statements.filter(stmt => !isImportStatement(stmt));
  // Prepend imports if needed.
  if (addedImports.length > 0) {
    // If we prepend imports, we also prepend NotEmittedStatement to use it as an anchor
    // for @fileoverview Closure annotation. If there is no @fileoverview annotations, this
    // statement would be a noop.
    const fileoverviewAnchorStmt = factory.createNotEmittedStatement(sf);
    return factory.updateSourceFile(sf, factory.createNodeArray([
      fileoverviewAnchorStmt, ...existingImports, ...addedImports, ...extraStatements, ...body
    ]));
  }

  return sf;
}

function createNamespaceImportDecl(
    i: NamespaceImport, factory: ts.NodeFactory): ts.ImportDeclaration {
  const qualifier = factory.createIdentifier(i.qualifier.text);
  const importClause = factory.createImportClause(
      /* isTypeOnly */ false,
      /* name */ undefined,
      /* namedBindings */ factory.createNamespaceImport(qualifier));
  const decl = factory.createImportDeclaration(
      /* modifiers */ undefined,
      /* importClause */ importClause,
      /* moduleSpecifier */ factory.createStringLiteral(i.specifier));

  // Set the qualifier's original TS node to the `ts.ImportDeclaration`. This allows downstream
  // transforms such as tsickle to properly process references to this import.
  //
  // This operation is load-bearing in g3 as some imported modules contain special metadata
  // generated by clutz, which tsickle uses to transform imports and references to those imports.
  //
  // TODO(alxhub): add a test for this when tsickle is updated externally to depend on this
  // behavior.
  ts.setOriginalNode(i.qualifier, decl);

  return decl;
}

function createSideEffectImportDecl(
    i: SideEffectImport, factory: ts.NodeFactory): ts.ImportDeclaration {
  return factory.createImportDeclaration(
      /* modifiers */ undefined,
      /* importClause */ undefined,
      /* moduleSpecifier */ ts.factory.createStringLiteral(i.specifier));
}

function isImportStatement(stmt: ts.Statement): boolean {
  return ts.isImportDeclaration(stmt) || ts.isImportEqualsDeclaration(stmt) ||
      ts.isNamespaceImport(stmt);
}
