# Migrations Directory

This directory contains database migration files for your Apache AGE graph database.

## Quick Start

### Generate a new migration

```bash
npx age-migrate generate --name create-users
```

### Run pending migrations

```bash
npx age-migrate up
```

### Rollback last migration

```bash
npx age-migrate down
```

### Check migration status

```bash
npx age-migrate status
```

## Migration File Structure

Migration files follow this naming convention:
```
YYYYMMDDHHMMSS-description.js
```

Example: `20240101120000-create-user-system.js`

## Migration Template

```javascript
'use strict';

module.exports = {
  up: async (migrations) => {
    return migrations.create('20240101120000-migration-name')
      // Add your migration operations here
      .createVertexLabel('User')
      .createEdgeLabel('FOLLOWS');
  },

  down: async (migration) => {
    // Rollback is automatic based on up() operations
  }
};
```

## Available Operations

- `.createGraph(name)` - Create a graph
- `.dropGraph(name)` - Drop a graph
- `.createVertexLabel(label)` - Create a vertex label
- `.dropVertexLabel(label)` - Drop a vertex label
- `.createEdgeLabel(label)` - Create an edge label
- `.dropEdgeLabel(label)` - Drop an edge label
- `.rawCypher(upQuery, downQuery)` - Execute raw Cypher
- `.rawSQL(upQuery, downQuery)` - Execute raw SQL

## Documentation

For detailed documentation, see:
- [Migration Guide](../docs/MIGRATIONS.md)
- [Main README](../README.md)

## Examples

See example migrations in:
- [examples/migrations/](../examples/migrations/)
