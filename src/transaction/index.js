/**
 * Apache AGE Transaction Support
 *
 * Provides transaction management for graph operations
 */

const { GraphUtils } = require('../utils');

/**
 * Graph Transaction class
 * Wraps Sequelize transactions for AGE operations
 */
class GraphTransaction {
  /**
   * Create a graph transaction
   * @param {Object} sequelizeTransaction - Underlying Sequelize transaction
   * @param {string} graphName - Graph name
   */
  constructor(sequelizeTransaction, graphName) {
    this.transaction = sequelizeTransaction;
    this.graphName = graphName;
    this.operations = [];
    this.committed = false;
    this.rolledBack = false;
  }

  /**
   * Execute a Cypher query within the transaction
   * @param {string} cypherQuery - Cypher query to execute
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Query results
   */
  async executeCypher(cypherQuery, options = {}) {
    if (this.committed || this.rolledBack) {
      throw new Error('Transaction has already been committed or rolled back');
    }

    const query = GraphUtils.buildAGEQuery(this.graphName, cypherQuery);

    this.operations.push({ query, cypherQuery, timestamp: Date.now() });

    const sequelize = this.transaction.sequelize;
    const results = await sequelize.query(query, {
      transaction: this.transaction,
      type: sequelize.QueryTypes.SELECT,
      ...options
    });

    return GraphUtils.parseAGEResult(results.map(r => r.result || r));
  }

  /**
   * Create a vertex within the transaction
   * @param {string} label - Vertex label
   * @param {Object} properties - Vertex properties
   * @returns {Promise<Object>} Created vertex
   */
  async createVertex(label, properties = {}) {
    const { CypherFunctions } = require('../functions');
    const pattern = CypherFunctions.vertex('n', label, properties);
    const cypherQuery = CypherFunctions.queryBuilder()
      .create(pattern)
      .return('n')
      .build();

    const results = await this.executeCypher(cypherQuery);
    return results[0] || null;
  }

  /**
   * Create an edge within the transaction
   * @param {string} label - Edge label
   * @param {string|number} fromId - Source vertex ID
   * @param {string|number} toId - Target vertex ID
   * @param {Object} properties - Edge properties
   * @returns {Promise<Object>} Created edge
   */
  async createEdge(label, fromId, toId, properties = {}) {
    const { CypherFunctions } = require('../functions');
    const cypherQuery = CypherFunctions.queryBuilder()
      .match('(a), (b)')
      .where(`id(a) = ${fromId} AND id(b) = ${toId}`)
      .create(`(a)-[r:${label} ${CypherFunctions.formatProperties(properties)}]->(b)`)
      .return('r')
      .build();

    const results = await this.executeCypher(cypherQuery);
    return results[0] || null;
  }

  /**
   * Update vertices/edges within the transaction
   * @param {string} pattern - Match pattern
   * @param {Object} properties - Properties to update
   * @param {string} whereClause - WHERE clause
   * @returns {Promise<Array>} Updated entities
   */
  async update(pattern, properties, whereClause = null) {
    const { CypherFunctions } = require('../functions');
    const builder = CypherFunctions.queryBuilder().match(pattern);

    if (whereClause) {
      builder.where(whereClause);
    }

    Object.entries(properties).forEach(([key, value]) => {
      const formattedValue = typeof value === 'string'
        ? `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
        : JSON.stringify(value);
      builder.set(`n.${key} = ${formattedValue}`);
    });

    builder.return('n');

    return await this.executeCypher(builder.build());
  }

  /**
   * Delete vertices/edges within the transaction
   * @param {string} pattern - Match pattern
   * @param {string} whereClause - WHERE clause
   * @returns {Promise<void>}
   */
  async delete(pattern, whereClause = null) {
    const { CypherFunctions } = require('../functions');
    const builder = CypherFunctions.queryBuilder().match(pattern);

    if (whereClause) {
      builder.where(whereClause);
    }

    // Use DETACH DELETE to remove vertices and their relationships
    const query = builder.build().replace('MATCH', 'MATCH') + ' DETACH DELETE n';

    await this.executeCypher(query);
  }

  /**
   * Commit the transaction
   * @returns {Promise<void>}
   */
  async commit() {
    if (this.committed) {
      throw new Error('Transaction already committed');
    }
    if (this.rolledBack) {
      throw new Error('Transaction already rolled back');
    }

    await this.transaction.commit();
    this.committed = true;
  }

  /**
   * Rollback the transaction
   * @returns {Promise<void>}
   */
  async rollback() {
    if (this.committed) {
      throw new Error('Transaction already committed');
    }
    if (this.rolledBack) {
      throw new Error('Transaction already rolled back');
    }

    await this.transaction.rollback();
    this.rolledBack = true;
  }

  /**
   * Get transaction info
   * @returns {Object} Transaction info
   */
  getInfo() {
    return {
      graphName: this.graphName,
      operationCount: this.operations.length,
      committed: this.committed,
      rolledBack: this.rolledBack,
      operations: this.operations
    };
  }
}

/**
 * Transaction Manager
 */
class TransactionManager {
  /**
   * Create a transaction manager
   * @param {Object} sequelize - Sequelize instance
   * @param {string} graphName - Default graph name
   */
  constructor(sequelize, graphName = 'default_graph') {
    this.sequelize = sequelize;
    this.graphName = graphName;
  }

  /**
   * Start a new transaction
   * @param {Object} options - Transaction options
   * @returns {Promise<GraphTransaction>} Graph transaction
   */
  async startTransaction(options = {}) {
    const sequelizeTransaction = await this.sequelize.transaction(options);
    return new GraphTransaction(sequelizeTransaction, this.graphName);
  }

  /**
   * Execute code within a transaction
   * @param {Function} callback - Callback function
   * @param {Object} options - Transaction options
   * @returns {Promise<*>} Result of callback
   */
  async withTransaction(callback, options = {}) {
    const transaction = await this.startTransaction(options);

    try {
      const result = await callback(transaction);
      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Execute multiple operations atomically
   * @param {Array<Function>} operations - Array of operation functions
   * @param {Object} options - Transaction options
   * @returns {Promise<Array>} Results of all operations
   */
  async executeAtomic(operations, options = {}) {
    return this.withTransaction(async (transaction) => {
      const results = [];
      for (const operation of operations) {
        const result = await operation(transaction);
        results.push(result);
      }
      return results;
    }, options);
  }

  /**
   * Create a savepoint within a transaction
   * @param {GraphTransaction} transaction - Graph transaction
   * @param {string} savepointName - Savepoint name
   * @returns {Promise<void>}
   */
  async createSavepoint(transaction, savepointName) {
    await this.sequelize.query(`SAVEPOINT ${savepointName}`, {
      transaction: transaction.transaction
    });
  }

  /**
   * Rollback to a savepoint
   * @param {GraphTransaction} transaction - Graph transaction
   * @param {string} savepointName - Savepoint name
   * @returns {Promise<void>}
   */
  async rollbackToSavepoint(transaction, savepointName) {
    await this.sequelize.query(`ROLLBACK TO SAVEPOINT ${savepointName}`, {
      transaction: transaction.transaction
    });
  }

  /**
   * Release a savepoint
   * @param {GraphTransaction} transaction - Graph transaction
   * @param {string} savepointName - Savepoint name
   * @returns {Promise<void>}
   */
  async releaseSavepoint(transaction, savepointName) {
    await this.sequelize.query(`RELEASE SAVEPOINT ${savepointName}`, {
      transaction: transaction.transaction
    });
  }
}

module.exports = {
  GraphTransaction,
  TransactionManager
};
