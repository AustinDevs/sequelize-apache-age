/**
 * Apache AGE Migration Utilities
 *
 * Provides migration tools for graph schema management
 */

const { GraphUtils } = require('../utils');

/**
 * Migration class
 */
class Migration {
  /**
   * Create a migration
   * @param {string} name - Migration name
   * @param {Object} sequelize - Sequelize instance
   * @param {string} graphName - Graph name
   */
  constructor(name, sequelize, graphName) {
    this.name = name;
    this.sequelize = sequelize;
    this.graphName = graphName;
    this.operations = [];
  }

  /**
   * Create a graph
   * @param {string} graphName - Graph name
   */
  createGraph(graphName = null) {
    const name = graphName || this.graphName;
    this.operations.push({
      type: 'createGraph',
      graphName: name,
      up: async () => {
        await this.sequelize.query(`SELECT ag_catalog.create_graph('${name}')`);
      },
      down: async () => {
        await this.sequelize.query(`SELECT ag_catalog.drop_graph('${name}', true)`);
      }
    });
    return this;
  }

  /**
   * Drop a graph
   * @param {string} graphName - Graph name
   */
  dropGraph(graphName = null) {
    const name = graphName || this.graphName;
    this.operations.push({
      type: 'dropGraph',
      graphName: name,
      up: async () => {
        await this.sequelize.query(`SELECT ag_catalog.drop_graph('${name}', true)`);
      },
      down: async () => {
        await this.sequelize.query(`SELECT ag_catalog.create_graph('${name}')`);
      }
    });
    return this;
  }

  /**
   * Create a vertex label
   * @param {string} label - Label name
   */
  createVertexLabel(label) {
    this.operations.push({
      type: 'createVertexLabel',
      label,
      up: async () => {
        const query = `SELECT * FROM ag_catalog.create_vlabel('${this.graphName}', '${label}')`;
        await this.sequelize.query(query);
      },
      down: async () => {
        const query = `SELECT * FROM ag_catalog.drop_vlabel('${this.graphName}', '${label}', true)`;
        await this.sequelize.query(query);
      }
    });
    return this;
  }

  /**
   * Drop a vertex label
   * @param {string} label - Label name
   */
  dropVertexLabel(label) {
    this.operations.push({
      type: 'dropVertexLabel',
      label,
      up: async () => {
        const query = `SELECT * FROM ag_catalog.drop_vlabel('${this.graphName}', '${label}', true)`;
        await this.sequelize.query(query);
      },
      down: async () => {
        const query = `SELECT * FROM ag_catalog.create_vlabel('${this.graphName}', '${label}')`;
        await this.sequelize.query(query);
      }
    });
    return this;
  }

  /**
   * Create an edge label
   * @param {string} label - Label name
   */
  createEdgeLabel(label) {
    this.operations.push({
      type: 'createEdgeLabel',
      label,
      up: async () => {
        const query = `SELECT * FROM ag_catalog.create_elabel('${this.graphName}', '${label}')`;
        await this.sequelize.query(query);
      },
      down: async () => {
        const query = `SELECT * FROM ag_catalog.drop_elabel('${this.graphName}', '${label}', true)`;
        await this.sequelize.query(query);
      }
    });
    return this;
  }

  /**
   * Drop an edge label
   * @param {string} label - Label name
   */
  dropEdgeLabel(label) {
    this.operations.push({
      type: 'dropEdgeLabel',
      label,
      up: async () => {
        const query = `SELECT * FROM ag_catalog.drop_elabel('${this.graphName}', '${label}', true)`;
        await this.sequelize.query(query);
      },
      down: async () => {
        const query = `SELECT * FROM ag_catalog.create_elabel('${this.graphName}', '${label}')`;
        await this.sequelize.query(query);
      }
    });
    return this;
  }

  /**
   * Execute raw Cypher query
   * @param {string} upQuery - Query to run on up
   * @param {string} downQuery - Query to run on down
   */
  rawCypher(upQuery, downQuery = '') {
    this.operations.push({
      type: 'rawCypher',
      upQuery,
      downQuery,
      up: async () => {
        const query = GraphUtils.buildAGEQuery(this.graphName, upQuery);
        await this.sequelize.query(query);
      },
      down: async () => {
        if (downQuery) {
          const query = GraphUtils.buildAGEQuery(this.graphName, downQuery);
          await this.sequelize.query(query);
        }
      }
    });
    return this;
  }

  /**
   * Execute raw SQL query
   * @param {string} upQuery - Query to run on up
   * @param {string} downQuery - Query to run on down
   */
  rawSQL(upQuery, downQuery = '') {
    this.operations.push({
      type: 'rawSQL',
      upQuery,
      downQuery,
      up: async () => {
        await this.sequelize.query(upQuery);
      },
      down: async () => {
        if (downQuery) {
          await this.sequelize.query(downQuery);
        }
      }
    });
    return this;
  }

  /**
   * Run the migration (up)
   */
  async up() {
    for (const operation of this.operations) {
      await operation.up();
    }
  }

  /**
   * Rollback the migration (down)
   */
  async down() {
    // Execute in reverse order
    for (let i = this.operations.length - 1; i >= 0; i--) {
      await this.operations[i].down();
    }
  }

  /**
   * Get migration info
   */
  getInfo() {
    return {
      name: this.name,
      graphName: this.graphName,
      operations: this.operations.map(op => ({
        type: op.type,
        ...op
      }))
    };
  }
}

/**
 * Migration Manager
 */
class MigrationManager {
  /**
   * Create a migration manager
   * @param {Object} sequelize - Sequelize instance
   * @param {string} graphName - Default graph name
   */
  constructor(sequelize, graphName = 'default_graph') {
    this.sequelize = sequelize;
    this.graphName = graphName;
    this.migrations = new Map();
    this.executedMigrations = new Set();
  }

  /**
   * Create a new migration
   * @param {string} name - Migration name
   * @returns {Migration} Migration instance
   */
  create(name) {
    const migration = new Migration(name, this.sequelize, this.graphName);
    this.migrations.set(name, migration);
    return migration;
  }

  /**
   * Run all pending migrations
   */
  async runPending() {
    await this._ensureMigrationTable();
    const executed = await this._getExecutedMigrations();

    const pending = Array.from(this.migrations.entries())
      .filter(([name]) => !executed.has(name))
      .sort((a, b) => a[0].localeCompare(b[0]));

    for (const [name, migration] of pending) {
      console.log(`Running migration: ${name}`);
      await migration.up();
      await this._recordMigration(name);
      this.executedMigrations.add(name);
      console.log(`Completed migration: ${name}`);
    }

    return pending.length;
  }

  /**
   * Rollback the last migration
   */
  async rollback() {
    await this._ensureMigrationTable();
    const executed = await this._getExecutedMigrations();

    if (executed.size === 0) {
      console.log('No migrations to rollback');
      return null;
    }

    // Get the last executed migration
    const lastMigration = Array.from(executed)
      .sort()
      .reverse()[0];

    const migration = this.migrations.get(lastMigration);
    if (!migration) {
      throw new Error(`Migration ${lastMigration} not found`);
    }

    console.log(`Rolling back migration: ${lastMigration}`);
    await migration.down();
    await this._removeMigrationRecord(lastMigration);
    this.executedMigrations.delete(lastMigration);
    console.log(`Rolled back migration: ${lastMigration}`);

    return lastMigration;
  }

  /**
   * Rollback all migrations
   */
  async rollbackAll() {
    let count = 0;
    while (await this.rollback()) {
      count++;
    }
    return count;
  }

  /**
   * Get migration status
   */
  async status() {
    await this._ensureMigrationTable();
    const executed = await this._getExecutedMigrations();

    const all = Array.from(this.migrations.keys()).sort();

    return all.map(name => ({
      name,
      executed: executed.has(name)
    }));
  }

  /**
   * Ensure migration tracking table exists
   */
  async _ensureMigrationTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS age_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        graph_name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await this.sequelize.query(query);
  }

  /**
   * Get executed migrations from database
   */
  async _getExecutedMigrations() {
    const query = `
      SELECT name FROM age_migrations
      WHERE graph_name = '${this.graphName}'
      ORDER BY executed_at
    `;

    const results = await this.sequelize.query(query, {
      type: this.sequelize.QueryTypes.SELECT
    });

    return new Set(results.map(r => r.name));
  }

  /**
   * Record a migration as executed
   */
  async _recordMigration(name) {
    const query = `
      INSERT INTO age_migrations (name, graph_name)
      VALUES ('${name}', '${this.graphName}')
    `;

    await this.sequelize.query(query);
  }

  /**
   * Remove a migration record
   */
  async _removeMigrationRecord(name) {
    const query = `
      DELETE FROM age_migrations
      WHERE name = '${name}' AND graph_name = '${this.graphName}'
    `;

    await this.sequelize.query(query);
  }
}

/**
 * Schema Builder
 * Fluent API for building graph schemas
 */
class SchemaBuilder {
  /**
   * Create a schema builder
   * @param {Object} sequelize - Sequelize instance
   * @param {string} graphName - Graph name
   */
  constructor(sequelize, graphName) {
    this.sequelize = sequelize;
    this.graphName = graphName;
  }

  /**
   * Create a new graph schema
   * @param {Function} callback - Schema definition callback
   */
  async createSchema(callback) {
    const schema = {
      vertexLabels: [],
      edgeLabels: [],

      vertex(label) {
        this.vertexLabels.push(label);
        return this;
      },

      edge(label) {
        this.edgeLabels.push(label);
        return this;
      }
    };

    callback(schema);

    // Create vertex labels
    for (const label of schema.vertexLabels) {
      await this.sequelize.query(
        `SELECT * FROM ag_catalog.create_vlabel('${this.graphName}', '${label}')`
      );
    }

    // Create edge labels
    for (const label of schema.edgeLabels) {
      await this.sequelize.query(
        `SELECT * FROM ag_catalog.create_elabel('${this.graphName}', '${label}')`
      );
    }
  }

  /**
   * Drop schema
   */
  async dropSchema() {
    await this.sequelize.query(
      `SELECT ag_catalog.drop_graph('${this.graphName}', true)`
    );
  }
}

module.exports = {
  Migration,
  MigrationManager,
  SchemaBuilder
};
