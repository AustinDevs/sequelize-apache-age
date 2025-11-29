# Migrations Guide

This guide covers the migration system in `sequelize-apache-age`, which provides database migration utilities for managing graph schema changes over time.

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Creating Migrations](#creating-migrations)
- [Running Migrations](#running-migrations)
- [Rolling Back Migrations](#rolling-back-migrations)
- [Migration Operations](#migration-operations)
- [Best Practices](#best-practices)
- [Advanced Usage](#advanced-usage)
- [API Reference](#api-reference)

## Overview

The migration system in `sequelize-apache-age` helps you:

- **Version control your graph schema**: Track schema changes over time
- **Collaborate with teams**: Share schema changes across development teams
- **Deploy safely**: Apply schema changes consistently across environments
- **Rollback changes**: Revert schema changes when needed
- **Automate deployments**: Integrate migrations into your CI/CD pipeline

### Key Components

- **Migration**: Defines a single schema change with up/down operations
- **MigrationManager**: Manages the execution and tracking of migrations
- **SchemaBuilder**: Provides a fluent API for defining graph schemas

## Getting Started

### Initialization

First, initialize the Apache AGE plugin with migration support:

```javascript
const { Sequelize } = require('sequelize');
const { initApacheAGE } = require('sequelize-apache-age');

// Create Sequelize instance
const sequelize = new Sequelize('postgres://user:pass@localhost:5432/mydb');

// Initialize Apache AGE
const age = initApacheAGE(sequelize, {
  graphName: 'my_graph'
});

// Access migration manager
const migrations = age.migrations;
```

### Your First Migration

Create your first migration to set up the initial graph schema:

```javascript
// Create a migration
const migration = migrations.create('001_initial_schema')
  .createGraph('my_graph')
  .createVertexLabel('User')
  .createVertexLabel('Post')
  .createEdgeLabel('AUTHORED');

// Run the migration
await migrations.runPending();
```

## Creating Migrations

### Basic Migration

A migration consists of operations that run when applying the migration (up) and operations that run when reverting it (down):

```javascript
const migration = migrations.create('002_add_comment_system')
  .createVertexLabel('Comment')
  .createEdgeLabel('COMMENTED_ON')
  .createEdgeLabel('REPLIED_TO');
```

### Migration with Custom Cypher

You can execute custom Cypher queries in migrations:

```javascript
const migration = migrations.create('003_seed_admin_user')
  .rawCypher(
    // Up query - creates admin user
    'CREATE (u:User {name: "admin", role: "administrator", created_at: timestamp()}) RETURN u',
    // Down query - removes admin user
    'MATCH (u:User {name: "admin"}) DELETE u'
  );
```

### Migration with Raw SQL

For operations that need to interact with PostgreSQL directly:

```javascript
const migration = migrations.create('004_create_indexes')
  .rawSQL(
    // Up - create indexes
    `CREATE INDEX idx_user_name ON my_graph."User" ((properties->>'name'))`,
    // Down - drop indexes
    `DROP INDEX IF EXISTS idx_user_name`
  );
```

### Complex Migration Example

Combine multiple operations in a single migration:

```javascript
const migration = migrations.create('005_user_profile_system')
  // Create new labels
  .createVertexLabel('Profile')
  .createEdgeLabel('HAS_PROFILE')

  // Add initial data
  .rawCypher(
    `MATCH (u:User)
     CREATE (u)-[:HAS_PROFILE]->(p:Profile {
       created_at: timestamp(),
       bio: '',
       avatar_url: null
     })
     RETURN u, p`,
    // Cleanup on rollback
    `MATCH (p:Profile) DETACH DELETE p`
  )

  // Create indexes for performance
  .rawSQL(
    `CREATE INDEX idx_profile_created ON my_graph."Profile" ((properties->>'created_at'))`,
    `DROP INDEX IF EXISTS idx_profile_created`
  );
```

## Running Migrations

### Run All Pending Migrations

Execute all migrations that haven't been run yet:

```javascript
const count = await migrations.runPending();
console.log(`Applied ${count} migrations`);
```

This will:
1. Check which migrations have already been executed
2. Run pending migrations in alphabetical order
3. Track each migration in the `age_migrations` table

### Check Migration Status

View the status of all migrations:

```javascript
const status = await migrations.status();

status.forEach(({ name, executed }) => {
  console.log(`${name}: ${executed ? '✓ executed' : '✗ pending'}`);
});
```

Output:
```
001_initial_schema: ✓ executed
002_add_comment_system: ✓ executed
003_seed_admin_user: ✓ executed
004_create_indexes: ✗ pending
005_user_profile_system: ✗ pending
```

### Programmatic Execution

Execute specific migrations programmatically:

```javascript
// Create and run a migration immediately
const migration = migrations.create('006_new_feature')
  .createVertexLabel('Feature')
  .createEdgeLabel('HAS_FEATURE');

await migration.up();
```

## Rolling Back Migrations

### Rollback Last Migration

Revert the most recently applied migration:

```javascript
const rolledBack = await migrations.rollback();
console.log(`Rolled back: ${rolledBack}`);
```

### Rollback All Migrations

Revert all migrations (useful for testing or resetting):

```javascript
const count = await migrations.rollbackAll();
console.log(`Rolled back ${count} migrations`);
```

### Manual Rollback

Rollback a specific migration manually:

```javascript
const migration = migrations.create('005_user_profile_system')
  .createVertexLabel('Profile')
  .createEdgeLabel('HAS_PROFILE');

// Manually execute the down operation
await migration.down();
```

## Migration Operations

### Graph Operations

#### Create Graph

```javascript
migration.createGraph('my_graph');
```

#### Drop Graph

```javascript
migration.dropGraph('my_graph');
```

### Vertex Label Operations

#### Create Vertex Label

```javascript
migration.createVertexLabel('User');
migration.createVertexLabel('Post');
migration.createVertexLabel('Comment');
```

#### Drop Vertex Label

```javascript
migration.dropVertexLabel('Comment');
```

### Edge Label Operations

#### Create Edge Label

```javascript
migration.createEdgeLabel('FOLLOWS');
migration.createEdgeLabel('LIKES');
migration.createEdgeLabel('COMMENTED_ON');
```

#### Drop Edge Label

```javascript
migration.dropEdgeLabel('LIKES');
```

### Custom Operations

#### Raw Cypher Query

Execute arbitrary Cypher queries:

```javascript
migration.rawCypher(
  // Up: Create data
  `CREATE (n:Category {name: "Technology", slug: "tech"})
   CREATE (m:Category {name: "Science", slug: "sci"})
   RETURN n, m`,

  // Down: Remove data
  `MATCH (n:Category) WHERE n.slug IN ["tech", "sci"] DELETE n`
);
```

#### Raw SQL Query

Execute PostgreSQL SQL directly:

```javascript
migration.rawSQL(
  // Up: Add PostgreSQL-level constraints or indexes
  `ALTER TABLE my_graph."User"
   ADD CONSTRAINT unique_username
   UNIQUE ((properties->>'username'))`,

  // Down: Remove constraints
  `ALTER TABLE my_graph."User"
   DROP CONSTRAINT IF EXISTS unique_username`
);
```

## Best Practices

### 1. Naming Conventions

Use descriptive, timestamped migration names:

```javascript
// Good
migrations.create('20240101_create_user_system')
migrations.create('20240102_add_post_categories')
migrations.create('20240103_migrate_user_data')

// Avoid
migrations.create('migration1')
migrations.create('update')
migrations.create('fix')
```

### 2. Atomic Migrations

Keep migrations focused on a single logical change:

```javascript
// Good - focused migration
migrations.create('20240101_add_user_authentication')
  .createVertexLabel('AuthToken')
  .createEdgeLabel('HAS_TOKEN');

// Better to split into separate migrations
migrations.create('20240101_add_user_authentication');
migrations.create('20240102_add_user_profiles');
```

### 3. Always Provide Down Operations

Ensure every migration can be rolled back:

```javascript
// Good - reversible
migration.rawCypher(
  'CREATE (n:Setting {key: "theme", value: "dark"})',
  'MATCH (n:Setting {key: "theme"}) DELETE n'
);

// Avoid - no rollback
migration.rawCypher(
  'CREATE (n:Setting {key: "theme", value: "dark"})',
  '' // Empty down operation
);
```

### 4. Test Migrations

Always test both up and down operations:

```javascript
// Test in development
await migration.up();
await migration.down();
await migration.up(); // Should work again
```

### 5. Data Migrations

When migrating data, handle edge cases:

```javascript
migrations.create('20240101_normalize_usernames')
  .rawCypher(
    // Handle null/empty values
    `MATCH (u:User)
     WHERE u.username IS NULL OR u.username = ''
     SET u.username = 'user_' + id(u)
     RETURN u`,

    // Provide meaningful rollback
    `MATCH (u:User)
     WHERE u.username STARTS WITH 'user_'
     SET u.username = null
     RETURN u`
  );
```

### 6. Version Control

Commit migrations to version control:

```bash
git add migrations/
git commit -m "Add user authentication schema migration"
```

## Advanced Usage

### Schema Builder

Use the SchemaBuilder for fluent schema definition:

```javascript
await age.schema.createSchema((schema) => {
  schema
    .vertex('User')
    .vertex('Post')
    .vertex('Comment')
    .edge('AUTHORED')
    .edge('COMMENTED_ON')
    .edge('REPLIED_TO');
});
```

### Migration Info

Get detailed information about a migration:

```javascript
const migration = migrations.create('test_migration')
  .createVertexLabel('Test');

const info = migration.getInfo();
console.log(info);
// {
//   name: 'test_migration',
//   graphName: 'my_graph',
//   operations: [
//     { type: 'createVertexLabel', label: 'Test', ... }
//   ]
// }
```

### Conditional Migrations

Create migrations that check conditions before executing:

```javascript
const migration = migrations.create('conditional_migration')
  .rawCypher(
    // Only create if not exists
    `MERGE (s:System {name: "config"})
     ON CREATE SET s.created_at = timestamp()
     RETURN s`,

    // Safe cleanup
    `MATCH (s:System {name: "config"})
     WHERE s.created_at IS NOT NULL
     DELETE s`
  );
```

### Bulk Operations

Create multiple related migrations:

```javascript
// Social network schema
const socialMigrations = [
  {
    name: '001_users',
    create: (m) => m
      .createVertexLabel('User')
      .createVertexLabel('Profile')
  },
  {
    name: '002_posts',
    create: (m) => m
      .createVertexLabel('Post')
      .createEdgeLabel('AUTHORED')
  },
  {
    name: '003_interactions',
    create: (m) => m
      .createEdgeLabel('LIKED')
      .createEdgeLabel('SHARED')
      .createEdgeLabel('COMMENTED_ON')
  }
];

// Create all migrations
socialMigrations.forEach(({ name, create }) => {
  const migration = migrations.create(name);
  create(migration);
});

// Run all at once
await migrations.runPending();
```

### Environment-Specific Migrations

Handle different environments:

```javascript
const env = process.env.NODE_ENV || 'development';

const migration = migrations.create('seed_data');

if (env === 'development') {
  migration.rawCypher(
    'CREATE (u:User {name: "Dev User", email: "dev@example.com"})',
    'MATCH (u:User {email: "dev@example.com"}) DELETE u'
  );
} else if (env === 'production') {
  migration.rawCypher(
    'CREATE (u:User {name: "Admin", email: "admin@example.com"})',
    'MATCH (u:User {email: "admin@example.com"}) DELETE u'
  );
}
```

### Migration Hooks

Add custom logic before/after migrations:

```javascript
class CustomMigrationManager extends MigrationManager {
  async runPending() {
    console.log('Starting migrations...');
    await this.beforeMigrations();

    const count = await super.runPending();

    await this.afterMigrations();
    console.log(`Completed ${count} migrations`);

    return count;
  }

  async beforeMigrations() {
    // Backup, logging, etc.
  }

  async afterMigrations() {
    // Cleanup, notifications, etc.
  }
}
```

## API Reference

### MigrationManager

#### `create(name: string): Migration`

Create a new migration.

```javascript
const migration = migrations.create('my_migration');
```

#### `runPending(): Promise<number>`

Run all pending migrations. Returns the number of migrations executed.

```javascript
const count = await migrations.runPending();
```

#### `rollback(): Promise<string | null>`

Rollback the last executed migration. Returns the migration name or null.

```javascript
const name = await migrations.rollback();
```

#### `rollbackAll(): Promise<number>`

Rollback all migrations. Returns the number of migrations rolled back.

```javascript
const count = await migrations.rollbackAll();
```

#### `status(): Promise<Array<{name: string, executed: boolean}>>`

Get the status of all migrations.

```javascript
const status = await migrations.status();
```

### Migration

#### `createGraph(graphName?: string): this`

Create a graph.

```javascript
migration.createGraph('my_graph');
```

#### `dropGraph(graphName?: string): this`

Drop a graph.

```javascript
migration.dropGraph('my_graph');
```

#### `createVertexLabel(label: string): this`

Create a vertex label.

```javascript
migration.createVertexLabel('User');
```

#### `dropVertexLabel(label: string): this`

Drop a vertex label.

```javascript
migration.dropVertexLabel('User');
```

#### `createEdgeLabel(label: string): this`

Create an edge label.

```javascript
migration.createEdgeLabel('FOLLOWS');
```

#### `dropEdgeLabel(label: string): this`

Drop an edge label.

```javascript
migration.dropEdgeLabel('FOLLOWS');
```

#### `rawCypher(upQuery: string, downQuery?: string): this`

Execute raw Cypher queries.

```javascript
migration.rawCypher(
  'CREATE (n:Node) RETURN n',
  'MATCH (n:Node) DELETE n'
);
```

#### `rawSQL(upQuery: string, downQuery?: string): this`

Execute raw SQL queries.

```javascript
migration.rawSQL(
  'CREATE INDEX ...',
  'DROP INDEX ...'
);
```

#### `up(): Promise<void>`

Execute the migration (apply changes).

```javascript
await migration.up();
```

#### `down(): Promise<void>`

Rollback the migration (revert changes).

```javascript
await migration.down();
```

#### `getInfo(): object`

Get migration information.

```javascript
const info = migration.getInfo();
```

### SchemaBuilder

#### `createSchema(callback: Function): Promise<void>`

Create a graph schema using a fluent API.

```javascript
await schemaBuilder.createSchema((schema) => {
  schema
    .vertex('User')
    .vertex('Post')
    .edge('AUTHORED');
});
```

#### `dropSchema(): Promise<void>`

Drop the entire graph schema.

```javascript
await schemaBuilder.dropSchema();
```

## Examples

### Example 1: E-commerce Schema

```javascript
// Migration: Set up e-commerce graph
const migration = migrations.create('20240101_ecommerce_schema')
  // Product catalog
  .createVertexLabel('Product')
  .createVertexLabel('Category')
  .createVertexLabel('Brand')

  // Customer & orders
  .createVertexLabel('Customer')
  .createVertexLabel('Order')
  .createVertexLabel('CartItem')

  // Relationships
  .createEdgeLabel('IN_CATEGORY')
  .createEdgeLabel('MANUFACTURED_BY')
  .createEdgeLabel('PURCHASED')
  .createEdgeLabel('CONTAINS')
  .createEdgeLabel('REVIEWED')

  // Seed categories
  .rawCypher(
    `CREATE (c1:Category {name: "Electronics", slug: "electronics"})
     CREATE (c2:Category {name: "Clothing", slug: "clothing"})
     CREATE (c3:Category {name: "Books", slug: "books"})
     RETURN c1, c2, c3`,
    `MATCH (c:Category) WHERE c.slug IN ["electronics", "clothing", "books"] DELETE c`
  );

await migrations.runPending();
```

### Example 2: Social Network Schema

```javascript
// Migration 1: Core user system
migrations.create('20240101_user_system')
  .createVertexLabel('User')
  .createVertexLabel('Profile')
  .createEdgeLabel('HAS_PROFILE');

// Migration 2: Social features
migrations.create('20240102_social_features')
  .createEdgeLabel('FOLLOWS')
  .createEdgeLabel('BLOCKED')
  .createEdgeLabel('FRIEND_REQUEST');

// Migration 3: Content
migrations.create('20240103_content_system')
  .createVertexLabel('Post')
  .createVertexLabel('Comment')
  .createEdgeLabel('POSTED')
  .createEdgeLabel('COMMENTED_ON')
  .createEdgeLabel('LIKED');

// Migration 4: Add timestamps
migrations.create('20240104_add_timestamps')
  .rawCypher(
    `MATCH (u:User) WHERE u.created_at IS NULL
     SET u.created_at = timestamp()
     RETURN count(u)`,
    `MATCH (u:User) SET u.created_at = null`
  );

// Run all migrations
await migrations.runPending();
```

### Example 3: Data Migration

```javascript
// Migration: Normalize user data
migrations.create('20240105_normalize_users')
  .rawCypher(
    // Normalize email addresses to lowercase
    `MATCH (u:User)
     WHERE u.email IS NOT NULL
     SET u.email = toLower(u.email),
         u.updated_at = timestamp()
     RETURN count(u)`,

    // Rollback not possible for this transformation
    // Document this in your migration notes
    ''
  )
  .rawCypher(
    // Create username from email if missing
    `MATCH (u:User)
     WHERE u.username IS NULL AND u.email IS NOT NULL
     SET u.username = split(u.email, '@')[0]
     RETURN count(u)`,

    `MATCH (u:User)
     WHERE u.username IS NOT NULL
     SET u.username = null`
  );
```

## Troubleshooting

### Migration Table Doesn't Exist

The migration tracking table is created automatically on first use. If you encounter issues:

```javascript
// Manually ensure migration table exists
await sequelize.query(`
  CREATE TABLE IF NOT EXISTS age_migrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    graph_name VARCHAR(255) NOT NULL,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);
```

### Reset Migrations

To completely reset and start over:

```javascript
// Rollback all migrations
await migrations.rollbackAll();

// Drop the migration tracking table
await sequelize.query('DROP TABLE IF EXISTS age_migrations');

// Recreate and run migrations
await migrations.runPending();
```

### Stuck Migration

If a migration fails partway through:

```javascript
// 1. Fix the migration code
// 2. Manually remove the migration record
await sequelize.query(`
  DELETE FROM age_migrations
  WHERE name = 'problematic_migration'
`);

// 3. Run again
await migrations.runPending();
```

## Conclusion

The migration system provides a robust way to manage your graph schema over time. By following best practices and using the provided tools, you can safely evolve your schema in production environments.

For more information, see:
- [Main README](../README.md)
- [API Documentation](./API.md)
- [Examples](../examples/)
