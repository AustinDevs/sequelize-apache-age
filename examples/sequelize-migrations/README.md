# Sequelize CLI Migration Examples

These examples show how to use `sequelize-apache-age` functions within standard `sequelize-cli` migrations.

## Setup

### 1. Install Dependencies

```bash
npm install sequelize sequelize-cli pg
npm install sequelize-apache-age
```

### 2. Initialize Sequelize

```bash
npx sequelize-cli init
```

This creates:
- `config/config.json` - Database configuration
- `migrations/` - Directory for your migrations
- `models/` - Directory for models (optional for graph usage)
- `seeders/` - Directory for seeders (optional)

### 3. Configure Database

Edit `config/config.json`:

```json
{
  "development": {
    "username": "postgres",
    "password": "password",
    "database": "mydb",
    "host": "127.0.0.1",
    "dialect": "postgres"
  }
}
```

## Usage

### Generate a Migration

```bash
npx sequelize-cli migration:generate --name create-graph-and-labels
```

### Edit Migration File

Copy the structure from the examples in this directory. A typical migration looks like:

```javascript
'use strict';

const { GraphUtils } = require('sequelize-apache-age');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create AGE extension and graph
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS age;');
    await queryInterface.sequelize.query("LOAD 'age';");
    await queryInterface.sequelize.query("SELECT create_graph('my_graph');");

    // Create labels
    await queryInterface.sequelize.query(
      "SELECT * FROM ag_catalog.create_vlabel('my_graph', 'User');"
    );

    // Execute Cypher queries
    const cypherQuery = GraphUtils.buildAGEQuery(
      'my_graph',
      "CREATE (u:User {name: 'John'}) RETURN u"
    );
    await queryInterface.sequelize.query(cypherQuery);
  },

  async down(queryInterface, Sequelize) {
    // Cleanup
    await queryInterface.sequelize.query("SELECT drop_graph('my_graph', true);");
  }
};
```

### Run Migrations

```bash
# Run all pending migrations
npx sequelize-cli db:migrate

# Rollback last migration
npx sequelize-cli db:migrate:undo

# Rollback all migrations
npx sequelize-cli db:migrate:undo:all

# Check migration status
npx sequelize-cli db:migrate:status
```

## Examples in This Directory

### 1. `20240101000000-create-graph-and-labels.js`

Shows how to:
- Initialize Apache AGE extension
- Create a graph
- Create vertex labels (User, Profile)
- Create edge labels (HAS_PROFILE)
- Insert initial data using Cypher
- Clean up on rollback

### 2. `20240101000001-add-social-features.js`

Shows how to:
- Add new vertex labels (Post, Comment)
- Add new edge labels (POSTED, COMMENTED_ON, FOLLOWS, LIKED)
- Update existing data (add timestamps)
- Create sample data with relationships
- Rollback by removing data and labels

### 3. `20240101000002-migrate-user-data.js`

Shows how to:
- Transform existing data (normalize emails)
- Generate derived data (create usernames from emails)
- Create missing relationships (default profiles)
- Add PostgreSQL indexes on graph properties
- Handle non-reversible migrations

## Common Patterns

### Creating a Graph

```javascript
await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS age;');
await queryInterface.sequelize.query("LOAD 'age';");
await queryInterface.sequelize.query("SET search_path = ag_catalog, '$user', public;");
await queryInterface.sequelize.query("SELECT create_graph('my_graph');");
```

### Creating Labels

```javascript
// Vertex label
await queryInterface.sequelize.query(
  "SELECT * FROM ag_catalog.create_vlabel('my_graph', 'User');"
);

// Edge label
await queryInterface.sequelize.query(
  "SELECT * FROM ag_catalog.create_elabel('my_graph', 'FOLLOWS');"
);
```

### Executing Cypher Queries

```javascript
const { GraphUtils } = require('sequelize-apache-age');

const query = GraphUtils.buildAGEQuery(
  'my_graph',
  `MATCH (u:User)
   WHERE u.age > 25
   RETURN u`
);

const results = await queryInterface.sequelize.query(query);
```

### Using Query Builder

```javascript
const { CypherFunctions, GraphUtils } = require('sequelize-apache-age');

const cypher = CypherFunctions.queryBuilder()
  .match('(u:User)')
  .where('u.active = true')
  .return('u')
  .build();

const query = GraphUtils.buildAGEQuery('my_graph', cypher);
await queryInterface.sequelize.query(query);
```

### Creating Indexes

```javascript
// Index on a specific property (AGE stores properties as JSONB)
await queryInterface.sequelize.query(`
  CREATE INDEX IF NOT EXISTS idx_user_email
  ON my_graph."User" ((properties->>'email'));
`);
```

### Dropping a Graph

```javascript
// Drops the graph and all its data
await queryInterface.sequelize.query("SELECT drop_graph('my_graph', true);");
```

## Best Practices

1. **Always provide rollback logic** - Make migrations reversible when possible
2. **Use transactions** - Sequelize CLI wraps migrations in transactions by default
3. **Test migrations** - Test both `up` and `down` on a development database first
4. **Version control** - Commit migrations to git
5. **Document non-reversible changes** - If a migration can't be fully rolled back, document it
6. **Use GraphUtils.buildAGEQuery()** - Properly formats Cypher queries for AGE
7. **Create indexes** - Add indexes on frequently queried properties

## Integration with Application Code

In your application, you can use the graph data:

```javascript
const { initApacheAGE } = require('sequelize-apache-age');
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(/* config */);
const age = initApacheAGE(sequelize, { graphName: 'my_graph' });

// Use models
const User = age.models.define('User', { name: String, email: String });
const users = await User.findAll({ where: { active: true } });

// Or execute raw Cypher
const query = "MATCH (u:User)-[:FOLLOWS]->(f:User) RETURN u, f";
const results = await age.executeCypher(query);
```

## Resources

- [Sequelize CLI Documentation](https://github.com/sequelize/cli)
- [Apache AGE Documentation](https://age.apache.org/age-manual/master/intro/overview.html)
- [Main README](../../README.md)
