/**
 * Type definitions for sequelize-apache-age
 */

import { Sequelize, QueryTypes, Transaction } from 'sequelize';

// ============================================================================
// Data Types
// ============================================================================

export class VERTEX {
  type: 'VERTEX';
  toSql(): string;
  static parse(value: string | object): any;
  static create(label: string, properties?: object): VertexObject;
}

export class EDGE {
  type: 'EDGE';
  toSql(): string;
  static parse(value: string | object): any;
  static create(label: string, startId: string | number, endId: string | number, properties?: object): EdgeObject;
}

export class PATH {
  type: 'PATH';
  toSql(): string;
  static parse(value: string | object): any;
  static create(vertices?: any[], edges?: any[]): PathObject;
}

export class AGTYPE {
  type: 'AGTYPE';
  toSql(): string;
  static parse(value: string): any;
  static stringify(value: any): string;
}

export const DataTypes: {
  VERTEX: typeof VERTEX;
  EDGE: typeof EDGE;
  PATH: typeof PATH;
  AGTYPE: typeof AGTYPE;
};

export interface VertexObject {
  label: string;
  properties: object;
  _type: 'vertex';
}

export interface EdgeObject {
  label: string;
  start_id: string | number;
  end_id: string | number;
  properties: object;
  _type: 'edge';
}

export interface PathObject {
  vertices: any[];
  edges: any[];
  _type: 'path';
}

// ============================================================================
// Cypher Functions
// ============================================================================

export class CypherQueryBuilder {
  match(pattern: string): this;
  optionalMatch(pattern: string): this;
  where(condition: string): this;
  create(pattern: string): this;
  merge(pattern: string): this;
  unwind(expression: string, alias: string): this;
  set(assignment: string): this;
  remove(target: string): this;
  delete(target: string): this;
  return(expression: string): this;
  with(expression: string): this;
  orderBy(expression: string): this;
  limit(count: number): this;
  skip(count: number): this;
  union(query: CypherQueryBuilder | string, all?: boolean): this;
  distinct(): this;
  build(): string;
  toString(): string;
}

export interface AggregationFunctions {
  count(expression?: string): string;
  sum(expression: string): string;
  avg(expression: string): string;
  min(expression: string): string;
  max(expression: string): string;
  collect(expression: string): string;
}

export interface ListOperations {
  create(items: any[]): string;
  comprehension(variable: string, list: string, filter?: string, map?: string): string;
  range(start: number, end: number, step?: number): string;
}

export interface StringFunctions {
  toLower(expression: string): string;
  toUpper(expression: string): string;
  trim(expression: string): string;
  substring(expression: string, start: number, length?: number): string;
  concat(...expressions: string[]): string;
}

export interface PathFunctions {
  length(pathVar: string): string;
  nodes(pathVar: string): string;
  relationships(pathVar: string): string;
  shortestPath(pattern: string): string;
  allShortestPaths(pattern: string): string;
}

export interface TypeFunctions {
  type(expression: string): string;
  labels(nodeVar: string): string;
  properties(expression: string): string;
}

export const CypherFunctions: {
  queryBuilder(): CypherQueryBuilder;
  escapeName(name: string): string;
  escapeString(value: string): string;
  formatProperties(properties: object): string;
  vertex(variable: string, label?: string, properties?: object): string;
  edge(variable: string, label?: string, properties?: object, direction?: 'left' | 'right' | 'both'): string;
  path(...elements: string[]): string;
  aggregation: AggregationFunctions;
  list: ListOperations;
  string: StringFunctions;
  pathFunctions: PathFunctions;
  type: TypeFunctions;
};

// ============================================================================
// Relationships
// ============================================================================

export class Relationship {
  constructor(type: string, options?: RelationshipOptions);
  type: string;
  options: RelationshipOptions;
  toCypherPattern(fromVar?: string, toVar?: string, relVar?: string): string;
}

export interface RelationshipOptions {
  direction?: 'outgoing' | 'incoming' | 'both';
  properties?: object;
  cardinality?: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
}

export interface RelationshipPatterns {
  oneToOne(type: string): Relationship;
  oneToMany(type: string): Relationship;
  manyToOne(type: string): Relationship;
  manyToMany(type: string): Relationship;
}

export const Relationships: {
  define(type: string, options?: RelationshipOptions): Relationship;
  patterns: RelationshipPatterns;
  traverse(startVertex: any, relationshipType: string, options?: any): any;
  buildQuery(fromLabel: string, relationshipType: string, toLabel: string, options?: any): string;
};

// ============================================================================
// Graph Utils
// ============================================================================

export const GraphUtils: {
  parseAGEResult(results: any[]): any[];
  extractVertices(results: any[]): any[];
  extractEdges(results: any[]): any[];
  extractPaths(results: any[]): any[];
  formatVertexId(id: string | number): string;
  formatEdgeId(id: string | number): string;
  isValidGraphName(name: string): boolean;
  isValidLabel(label: string): boolean;
  buildAGEQuery(graphName: string, cypherQuery: string): string;
  toAGEProperties(properties: object): string;
  fromAGEProperties(properties: string | object): object;
  generateVariableName(prefix?: string): string;
};

// ============================================================================
// Models
// ============================================================================

export interface ModelFindOptions {
  where?: object;
  order?: string | Array<[string, string]>;
  limit?: number;
  skip?: number;
  offset?: number;
}

export interface ModelCreateOptions {
  from?: string | number;
  to?: string | number;
  fromId?: string | number;
  toId?: string | number;
}

export class GraphModel {
  constructor(sequelize: Sequelize, label: string, attributes?: object, options?: any);
  sequelize: Sequelize;
  label: string;
  attributes: object;
  options: any;
  addHook(hookType: string, fn: Function): void;
  create(properties: object, options?: ModelCreateOptions): Promise<any>;
  findAll(options?: ModelFindOptions): Promise<any[]>;
  findOne(options?: ModelFindOptions): Promise<any | null>;
  findByPk(id: string | number): Promise<any | null>;
  update(properties: object, options?: ModelFindOptions): Promise<number>;
  destroy(options?: ModelFindOptions): Promise<number>;
  count(options?: ModelFindOptions): Promise<number>;
}

export class ModelRegistry {
  constructor(sequelize: Sequelize, defaultGraphName?: string);
  define(label: string, attributes?: object, options?: any): GraphModel;
  get(label: string): GraphModel | undefined;
  has(label: string): boolean;
  getAll(): Map<string, GraphModel>;
}

// ============================================================================
// Transactions
// ============================================================================

export class GraphTransaction {
  constructor(sequelizeTransaction: Transaction, graphName: string);
  transaction: Transaction;
  graphName: string;
  executeCypher(cypherQuery: string, options?: any): Promise<any[]>;
  createVertex(label: string, properties?: object): Promise<any>;
  createEdge(label: string, fromId: string | number, toId: string | number, properties?: object): Promise<any>;
  update(pattern: string, properties: object, whereClause?: string): Promise<any[]>;
  delete(pattern: string, whereClause?: string): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  getInfo(): any;
}

export class TransactionManager {
  constructor(sequelize: Sequelize, graphName?: string);
  startTransaction(options?: any): Promise<GraphTransaction>;
  withTransaction(callback: (transaction: GraphTransaction) => Promise<any>, options?: any): Promise<any>;
  executeAtomic(operations: Array<(transaction: GraphTransaction) => Promise<any>>, options?: any): Promise<any[]>;
  createSavepoint(transaction: GraphTransaction, savepointName: string): Promise<void>;
  rollbackToSavepoint(transaction: GraphTransaction, savepointName: string): Promise<void>;
  releaseSavepoint(transaction: GraphTransaction, savepointName: string): Promise<void>;
}

// ============================================================================
// Optimization
// ============================================================================

export interface QueryAnalysis {
  hasIndexableProperties: boolean;
  hasCartesianProduct: boolean;
  hasOptionalMatch: boolean;
  hasUnboundedPath: boolean;
  hasDistinct: boolean;
  suggestions: string[];
}

export interface IndexSuggestion {
  label: string;
  property: string;
  frequency: number;
}

export class QueryAnalyzer {
  static analyze(query: string): QueryAnalysis;
  static suggestIndexes(queries: string[]): IndexSuggestion[];
}

export class QueryOptimizer {
  static optimizePatternOrder(query: string): string;
  static addHints(query: string, hints?: object): string;
  static batchQueries(queries: string[]): string;
}

export class IndexManager {
  constructor(sequelize: Sequelize, graphName: string);
  createIndex(label: string, property: string): Promise<void>;
  dropIndex(label: string, property: string): Promise<void>;
  listIndexes(): Promise<any[]>;
}

export class QueryCache {
  constructor(options?: { maxSize?: number; ttl?: number });
  get(key: string): any;
  set(key: string, value: any): void;
  clear(): void;
  size(): number;
}

export class PerformanceMonitor {
  record(query: string, duration: number): void;
  getSlowestQueries(limit?: number): any[];
  getMostFrequentQueries(limit?: number): any[];
  reset(): void;
}

// ============================================================================
// Migrations
// ============================================================================

export class Migration {
  constructor(name: string, sequelize: Sequelize, graphName: string);
  name: string;
  createGraph(graphName?: string): this;
  dropGraph(graphName?: string): this;
  createVertexLabel(label: string): this;
  dropVertexLabel(label: string): this;
  createEdgeLabel(label: string): this;
  dropEdgeLabel(label: string): this;
  rawCypher(upQuery: string, downQuery?: string): this;
  rawSQL(upQuery: string, downQuery?: string): this;
  up(): Promise<void>;
  down(): Promise<void>;
  getInfo(): any;
}

export class MigrationManager {
  constructor(sequelize: Sequelize, graphName?: string);
  create(name: string): Migration;
  runPending(): Promise<number>;
  rollback(): Promise<string | null>;
  rollbackAll(): Promise<number>;
  status(): Promise<Array<{ name: string; executed: boolean }>>;
}

export interface SchemaDefinition {
  vertex(label: string): this;
  edge(label: string): this;
}

export class SchemaBuilder {
  constructor(sequelize: Sequelize, graphName: string);
  createSchema(callback: (schema: SchemaDefinition) => void): Promise<void>;
  dropSchema(): Promise<void>;
}

// ============================================================================
// Main Plugin
// ============================================================================

export interface ApacheAGEOptions {
  graphName?: string;
  autoCreateGraph?: boolean;
  cacheOptions?: {
    maxSize?: number;
    ttl?: number;
  };
}

export interface ApacheAGEPlugin {
  config: any;
  DataTypes: typeof DataTypes;
  CypherFunctions: typeof CypherFunctions;
  Relationships: typeof Relationships;
  GraphUtils: typeof GraphUtils;
  models: ModelRegistry;
  transaction: TransactionManager;
  optimization: {
    analyzer: typeof QueryAnalyzer;
    optimizer: typeof QueryOptimizer;
    indexManager: IndexManager;
    cache: QueryCache;
    monitor: PerformanceMonitor;
  };
  migrations: MigrationManager;
  schema: SchemaBuilder;
  executeCypher(cypherQuery: string, params?: object): Promise<any[]>;
  createVertex(label: string, properties?: object): Promise<any>;
  createEdge(label: string, fromVertex: any, toVertex: any, properties?: object): Promise<any>;
}

export function initApacheAGE(sequelize: Sequelize, options?: ApacheAGEOptions): ApacheAGEPlugin;

// Export all classes and interfaces
export {
  VERTEX,
  EDGE,
  PATH,
  AGTYPE,
  CypherQueryBuilder,
  Relationship,
  GraphModel,
  ModelRegistry,
  GraphTransaction,
  TransactionManager,
  QueryAnalyzer,
  QueryOptimizer,
  IndexManager,
  QueryCache,
  PerformanceMonitor,
  Migration,
  MigrationManager,
  SchemaBuilder
};
