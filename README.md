# sequelize-apache-age

A Sequelize plugin for Apache AGE (A Graph Extension for PostgreSQL), providing support for graph database operations including Cypher queries, graph objects (vertices, edges, paths), and relationship management.

## Features

- 🔌 **Sequelize Integration**: Seamlessly integrates with Sequelize ORM
- 📊 **Graph Data Types**: Support for AGE-specific types (VERTEX, EDGE, PATH, AGTYPE)
- 🔍 **Cypher Query Builder**: Fluent API for building Cypher queries
- 🔗 **Relationship Management**: Utilities for defining and managing graph relationships
- 🛠️ **Utility Functions**: Helper functions for working with graph data
- 📝 **Type Safe**: Full TypeScript definitions included
- 🎯 **Model Integration**: Sequelize-like models for graph entities
- 💾 **Transaction Support**: ACID transactions for graph operations
- ⚡ **Advanced Cypher**: MERGE, OPTIONAL MATCH, UNWIND, aggregations, and more
- 🚀 **Query Optimization**: Built-in query analysis and optimization tools
- 📦 **Migration System**: Database migration utilities for graph schemas
- 📈 **Performance Monitoring**: Track and analyze query performance

## Installation

```bash
npm install sequelize-apache-age
```

**Prerequisites:**
- PostgreSQL 11 or higher
- Apache AGE extension installed in PostgreSQL
- Sequelize 6.x or higher

## Quick Start

```javascript
const { Sequelize } = require('sequelize');
const { initApacheAGE } = require('sequelize-apache-age');

// Create Sequelize instance
const sequelize = new Sequelize('postgres://user:pass@localhost:5432/mydb');

// Initialize Apache AGE plugin
const age = initApacheAGE(sequelize, {
  graphName: 'my_graph',
  autoCreateGraph: true
});

// Use the plugin
// (See examples below)
```

## Usage

### Working with Data Types

The plugin provides AGE-specific data types:

```javascript
const { DataTypes } = require('sequelize-apache-age');

// Create a vertex
const person = DataTypes.VERTEX.create('Person', {
  name: 'John Doe',
  age: 30
});

// Create an edge
const knows = DataTypes.EDGE.create('KNOWS', startVertexId, endVertexId, {
  since: 2020
});

// Create a path
const path = DataTypes.PATH.create(vertices, edges);
```

### Building Cypher Queries

Use the fluent query builder:

```javascript
const { CypherFunctions } = require('sequelize-apache-age');

// Simple query
const query = CypherFunctions.queryBuilder()
  .match('(p:Person)')
  .where('p.age > 25')
  .return('p')
  .build();

// Complex query with relationships
const query2 = CypherFunctions.queryBuilder()
  .match('(p1:Person)-[r:KNOWS]->(p2:Person)')
  .where('p1.name = "John"')
  .return('p1, r, p2')
  .orderBy('p2.name')
  .limit(10)
  .build();
```

### Helper Functions

Build Cypher patterns easily:

```javascript
const { CypherFunctions } = require('sequelize-apache-age');

// Build vertex pattern
const vertex = CypherFunctions.vertex('p', 'Person', { name: 'John' });
// Result: (p:Person {name: "John"})

// Build edge pattern
const edge = CypherFunctions.edge('r', 'KNOWS');
// Result: -[r:KNOWS]->

// Build complete path
const path = CypherFunctions.path(
  CypherFunctions.vertex('p1', 'Person'),
  CypherFunctions.edge('r', 'KNOWS'),
  CypherFunctions.vertex('p2', 'Person')
);
```

### Managing Relationships

Define and work with graph relationships:

```javascript
const { Relationships } = require('sequelize-apache-age');

// Define custom relationship
const knows = Relationships.define('KNOWS', {
  direction: 'outgoing'
});

// Use predefined patterns
const oneToMany = Relationships.patterns.oneToMany('HAS_CHILD');
const manyToMany = Relationships.patterns.manyToMany('COLLABORATES_WITH');

// Build relationship query
const query = Relationships.buildQuery('Person', 'KNOWS', 'Person');
```

### Utility Functions

Work with graph data:

```javascript
const { GraphUtils } = require('sequelize-apache-age');

// Validate graph/label names
GraphUtils.isValidGraphName('my_graph'); // true
GraphUtils.isValidLabel('Person'); // true

// Convert properties
const ageProps = GraphUtils.toAGEProperties({ name: 'John', age: 30 });
const jsProps = GraphUtils.fromAGEProperties(ageString);

// Build AGE query wrapper
const ageQuery = GraphUtils.buildAGEQuery('my_graph', 'MATCH (n) RETURN n');

// Extract graph elements from results
const vertices = GraphUtils.extractVertices(results);
const edges = GraphUtils.extractEdges(results);
const paths = GraphUtils.extractPaths(results);
```

## API Reference

### initApacheAGE(sequelize, options)

Initialize the Apache AGE plugin.

**Parameters:**
- `sequelize` (Object): Sequelize instance
- `options` (Object):
  - `graphName` (string): Name of the graph to use (default: 'default_graph')
  - `autoCreateGraph` (boolean): Automatically create graph if it doesn't exist (default: true)

**Returns:** Plugin API object

### DataTypes

Custom data types for Apache AGE:

- `VERTEX`: Graph vertex/node type
- `EDGE`: Graph edge/relationship type
- `PATH`: Graph path type
- `AGTYPE`: Apache AGE's flexible JSON-like type

### CypherFunctions

Query builder and helper functions:

- `queryBuilder()`: Create a new query builder instance
- `vertex(variable, label, properties)`: Build vertex pattern
- `edge(variable, label, properties, direction)`: Build edge pattern
- `path(...elements)`: Build path pattern
- `formatProperties(properties)`: Format properties for Cypher
- `escapeString(value)`: Escape string values
- `escapeName(name)`: Escape property names

### Relationships

Relationship management utilities:

- `define(type, options)`: Define a custom relationship
- `patterns`: Predefined relationship patterns (oneToOne, oneToMany, manyToOne, manyToMany)
- `traverse(startVertex, relationshipType, options)`: Configure relationship traversal
- `buildQuery(fromLabel, relationshipType, toLabel, options)`: Build relationship query

### GraphUtils

Utility functions:

- `parseAGEResult(results)`: Parse AGE query results
- `extractVertices(results)`: Extract vertices from results
- `extractEdges(results)`: Extract edges from results
- `extractPaths(results)`: Extract paths from results
- `isValidGraphName(name)`: Validate graph name
- `isValidLabel(label)`: Validate label name
- `buildAGEQuery(graphName, cypherQuery)`: Build AGE query wrapper
- `toAGEProperties(properties)`: Convert JS object to AGE properties
- `fromAGEProperties(properties)`: Parse AGE properties to JS object

### Models

Sequelize-like model definitions for graph entities:

- `GraphModel`: Base class for graph models
- `ModelRegistry`: Registry for managing models

```javascript
const age = initApacheAGE(sequelize, { graphName: 'my_graph' });

// Define a vertex model
const Person = age.models.define('Person', {
  name: String,
  age: Number
}, { type: 'vertex' });

// Create vertices
const person = await Person.create({ name: 'Alice', age: 30 });

// Query vertices
const people = await Person.findAll({ where: { age: { $gt: 25 } } });
const alice = await Person.findOne({ where: { name: 'Alice' } });

// Update vertices
await Person.update({ age: 31 }, { where: { name: 'Alice' } });

// Count vertices
const count = await Person.count({ where: { age: { $gte: 30 } } });
```

### Transactions

Transaction support for atomic graph operations:

- `TransactionManager`: Manages graph transactions
- `GraphTransaction`: Transaction wrapper for graph operations

```javascript
const age = initApacheAGE(sequelize, { graphName: 'my_graph' });

// Using withTransaction helper
await age.transaction.withTransaction(async (tx) => {
  const alice = await tx.createVertex('Person', { name: 'Alice' });
  const bob = await tx.createVertex('Person', { name: 'Bob' });
  await tx.createEdge('KNOWS', alice.id, bob.id, { since: 2020 });
});

// Manual transaction management
const tx = await age.transaction.startTransaction();
try {
  await tx.executeCypher('CREATE (n:Person {name: "Charlie"}) RETURN n');
  await tx.commit();
} catch (error) {
  await tx.rollback();
  throw error;
}
```

### Advanced Cypher Features

Enhanced query building capabilities:

- `OPTIONAL MATCH`: Optional pattern matching
- `MERGE`: Create-or-match patterns
- `UNWIND`: List unwinding
- `UNION`: Combine queries
- `DISTINCT`: Unique results
- Aggregation functions (count, sum, avg, min, max, collect)
- List operations and comprehensions
- String functions
- Path functions

```javascript
// MERGE and OPTIONAL MATCH
const query = CypherFunctions.queryBuilder()
  .merge('(p:Person {name: "Alice"})')
  .optionalMatch('(p)-[r:KNOWS]->(friend)')
  .return('p, collect(friend) as friends')
  .build();

// UNWIND for batch operations
const query2 = CypherFunctions.queryBuilder()
  .unwind('[1, 2, 3]', 'num')
  .create('(n:Number {value: num})')
  .return('n')
  .build();

// Aggregation
const query3 = CypherFunctions.queryBuilder()
  .match('(p:Person)')
  .return(`${CypherFunctions.aggregation.count('p')} as total`)
  .build();

// Path operations
const shortestPath = CypherFunctions.pathFunctions.shortestPath(
  '(a:Person)-[*]-(b:Person)'
);
```

### Query Optimization

Tools for analyzing and optimizing queries:

- `QueryAnalyzer`: Analyze queries for optimization opportunities
- `QueryOptimizer`: Optimize query patterns
- `IndexManager`: Manage graph indexes
- `QueryCache`: Cache query results
- `PerformanceMonitor`: Monitor query performance

```javascript
const age = initApacheAGE(sequelize, { graphName: 'my_graph' });

// Analyze a query
const analysis = age.optimization.analyzer.analyze(cypherQuery);
console.log(analysis.suggestions);

// Suggest indexes based on query patterns
const queries = [/* array of queries */];
const suggestions = age.optimization.analyzer.suggestIndexes(queries);

// Create an index
await age.optimization.indexManager.createIndex('Person', 'name');

// Monitor query performance
age.optimization.monitor.record(query, duration);
const slowQueries = age.optimization.monitor.getSlowestQueries(10);
```

### Migrations

Database migration utilities for graph schemas:

- `Migration`: Define schema changes
- `MigrationManager`: Manage migration execution
- `SchemaBuilder`: Fluent schema definition API

```javascript
const age = initApacheAGE(sequelize, { graphName: 'my_graph' });

// Create a migration
const migration = age.migrations.create('create_person_schema')
  .createVertexLabel('Person')
  .createVertexLabel('Company')
  .createEdgeLabel('WORKS_AT')
  .rawCypher('CREATE (n:Person {name: "Admin"}) RETURN n');

// Run pending migrations
await age.migrations.runPending();

// Rollback last migration
await age.migrations.rollback();

// Check migration status
const status = await age.migrations.status();

// Schema builder
await age.schema.createSchema((schema) => {
  schema
    .vertex('Person')
    .vertex('Company')
    .edge('WORKS_AT')
    .edge('KNOWS');
});
```

### TypeScript Support

Full TypeScript definitions included:

```typescript
import { initApacheAGE, GraphModel, CypherFunctions } from 'sequelize-apache-age';
import { Sequelize } from 'sequelize';

const sequelize = new Sequelize(/* ... */);
const age = initApacheAGE(sequelize, { graphName: 'my_graph' });

// Type-safe model operations
const Person: GraphModel = age.models.define('Person', {
  name: String,
  age: Number
});

// Type-safe query building
const query: string = CypherFunctions.queryBuilder()
  .match('(p:Person)')
  .where('p.age > 25')
  .return('p')
  .build();
```

## Examples

See the [examples](./examples) directory for complete usage examples.

Run examples:
```bash
node examples/usage.js
```

## Development

### Setup

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run linter
npm run lint
```

### Project Structure

```
sequelize-apache-age/
├── src/                    # Source files
│   ├── index.js           # Main entry point
│   ├── types/             # AGE data types
│   ├── functions/         # Cypher functions and query builder
│   ├── relationships/     # Relationship utilities
│   └── utils/             # Utility functions
├── lib/                   # Built files (generated)
├── test/                  # Test files
├── examples/              # Usage examples
└── scripts/               # Build scripts
```

### Running Tests

```bash
npm test
```

## Apache AGE Resources

- [Apache AGE Website](https://age.apache.org/)
- [Apache AGE Documentation](https://age.apache.org/age-manual/master/intro/overview.html)
- [Apache AGE GitHub](https://github.com/apache/age)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Support

For issues and questions:
- GitHub Issues: [https://github.com/AustinDevs/sequelize-apache-age/issues](https://github.com/AustinDevs/sequelize-apache-age/issues)

## Roadmap

- [x] Full Sequelize model integration ✅
- [x] Transaction support ✅
- [x] Advanced Cypher features ✅
- [x] Query optimization helpers ✅
- [x] Migration utilities ✅
- [x] TypeScript definitions ✅
- [ ] GraphQL integration
- [ ] Comprehensive documentation
- [ ] Performance benchmarks