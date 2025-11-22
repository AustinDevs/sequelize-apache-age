/**
 * Apache AGE Model Integration for Sequelize
 *
 * Provides Sequelize-like model definitions for graph entities
 */

const { CypherFunctions } = require('../functions');
const { GraphUtils } = require('../utils');

/**
 * Base Graph Model class
 */
class GraphModel {
  /**
   * Create a GraphModel instance
   * @param {Object} sequelize - Sequelize instance
   * @param {string} label - Vertex/Edge label
   * @param {Object} attributes - Model attributes
   * @param {Object} options - Model options
   */
  constructor(sequelize, label, attributes = {}, options = {}) {
    this.sequelize = sequelize;
    this.label = label;
    this.attributes = attributes;
    this.options = {
      graphName: options.graphName || 'default_graph',
      type: options.type || 'vertex', // 'vertex' or 'edge'
      ...options
    };
    this.hooks = {
      beforeCreate: [],
      afterCreate: [],
      beforeUpdate: [],
      afterUpdate: [],
      beforeDelete: [],
      afterDelete: []
    };
  }

  /**
   * Add a hook
   * @param {string} hookType - Type of hook
   * @param {Function} fn - Hook function
   */
  addHook(hookType, fn) {
    if (this.hooks[hookType]) {
      this.hooks[hookType].push(fn);
    }
  }

  /**
   * Execute hooks
   * @param {string} hookType - Type of hook
   * @param {*} data - Data to pass to hooks
   */
  async executeHooks(hookType, data) {
    if (this.hooks[hookType]) {
      for (const hook of this.hooks[hookType]) {
        await hook(data, this);
      }
    }
  }

  /**
   * Create a new vertex/edge
   * @param {Object} properties - Properties for the entity
   * @param {Object} options - Creation options
   * @returns {Promise<Object>} Created entity
   */
  async create(properties, options = {}) {
    await this.executeHooks('beforeCreate', properties);

    const cypherQuery = this.options.type === 'vertex'
      ? this._buildCreateVertexQuery(properties)
      : this._buildCreateEdgeQuery(properties, options);

    const query = GraphUtils.buildAGEQuery(this.options.graphName, cypherQuery);
    const results = await this.sequelize.query(query, {
      type: this.sequelize.QueryTypes.SELECT
    });

    const created = this._parseResult(results);
    await this.executeHooks('afterCreate', created);

    return created;
  }

  /**
   * Find entities by criteria
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Found entities
   */
  async findAll(options = {}) {
    const cypherQuery = this._buildFindQuery(options);
    const query = GraphUtils.buildAGEQuery(this.options.graphName, cypherQuery);

    const results = await this.sequelize.query(query, {
      type: this.sequelize.QueryTypes.SELECT
    });

    return this._parseResults(results);
  }

  /**
   * Find one entity by criteria
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>} Found entity or null
   */
  async findOne(options = {}) {
    const results = await this.findAll({ ...options, limit: 1 });
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Find entity by ID
   * @param {string|number} id - Entity ID
   * @returns {Promise<Object|null>} Found entity or null
   */
  async findByPk(id) {
    return this.findOne({ where: { id } });
  }

  /**
   * Update entities
   * @param {Object} properties - Properties to update
   * @param {Object} options - Update options
   * @returns {Promise<number>} Number of updated entities
   */
  async update(properties, options = {}) {
    await this.executeHooks('beforeUpdate', { properties, options });

    const cypherQuery = this._buildUpdateQuery(properties, options);
    const query = GraphUtils.buildAGEQuery(this.options.graphName, cypherQuery);

    await this.sequelize.query(query, {
      type: this.sequelize.QueryTypes.SELECT
    });

    await this.executeHooks('afterUpdate', { properties, options });

    return 1; // AGE doesn't return update count easily
  }

  /**
   * Delete entities
   * @param {Object} options - Delete options
   * @returns {Promise<number>} Number of deleted entities
   */
  async destroy(options = {}) {
    await this.executeHooks('beforeDelete', options);

    const cypherQuery = this._buildDeleteQuery(options);
    const query = GraphUtils.buildAGEQuery(this.options.graphName, cypherQuery);

    await this.sequelize.query(query, {
      type: this.sequelize.QueryTypes.SELECT
    });

    await this.executeHooks('afterDelete', options);

    return 1; // AGE doesn't return delete count easily
  }

  /**
   * Count entities
   * @param {Object} options - Count options
   * @returns {Promise<number>} Count of entities
   */
  async count(options = {}) {
    const builder = CypherFunctions.queryBuilder()
      .match(`(n:${this.label})`);

    if (options.where) {
      const whereClause = this._buildWhereClause(options.where);
      if (whereClause) {
        builder.where(whereClause);
      }
    }

    builder.return('count(n) as count');

    const query = GraphUtils.buildAGEQuery(this.options.graphName, builder.build());
    const results = await this.sequelize.query(query, {
      type: this.sequelize.QueryTypes.SELECT
    });

    if (results.length > 0 && results[0].count) {
      const parsed = GraphUtils.parseAGEResult([results[0].count]);
      return parsed[0] || 0;
    }

    return 0;
  }

  /**
   * Build create vertex query
   * @param {Object} properties - Properties
   * @returns {string} Cypher query
   */
  _buildCreateVertexQuery(properties) {
    const pattern = CypherFunctions.vertex('n', this.label, properties);
    return CypherFunctions.queryBuilder()
      .create(pattern)
      .return('n')
      .build();
  }

  /**
   * Build create edge query
   * @param {Object} properties - Properties
   * @param {Object} options - Options with from/to vertex info
   * @returns {string} Cypher query
   */
  _buildCreateEdgeQuery(properties, options) {
    const fromId = options.from || options.fromId;
    const toId = options.to || options.toId;

    if (!fromId || !toId) {
      throw new Error('Edge creation requires "from" and "to" vertex IDs');
    }

    const builder = CypherFunctions.queryBuilder()
      .match(`(a), (b)`)
      .where(`id(a) = ${fromId} AND id(b) = ${toId}`)
      .create(`(a)-[r:${this.label} ${CypherFunctions.formatProperties(properties)}]->(b)`)
      .return('r');

    return builder.build();
  }

  /**
   * Build find query
   * @param {Object} options - Query options
   * @returns {string} Cypher query
   */
  _buildFindQuery(options) {
    const varName = 'n';
    const builder = CypherFunctions.queryBuilder()
      .match(`(${varName}:${this.label})`);

    if (options.where) {
      const whereClause = this._buildWhereClause(options.where, varName);
      if (whereClause) {
        builder.where(whereClause);
      }
    }

    if (options.order) {
      builder.orderBy(this._buildOrderClause(options.order, varName));
    }

    if (options.limit) {
      builder.limit(options.limit);
    }

    if (options.skip || options.offset) {
      builder.skip(options.skip || options.offset);
    }

    builder.return(varName);

    return builder.build();
  }

  /**
   * Build update query
   * @param {Object} properties - Properties to update
   * @param {Object} options - Update options
   * @returns {string} Cypher query
   */
  _buildUpdateQuery(properties, options) {
    const varName = 'n';
    const builder = CypherFunctions.queryBuilder()
      .match(`(${varName}:${this.label})`);

    if (options.where) {
      const whereClause = this._buildWhereClause(options.where, varName);
      if (whereClause) {
        builder.where(whereClause);
      }
    }

    // Build SET clauses for each property
    Object.entries(properties).forEach(([key, value]) => {
      const formattedValue = typeof value === 'string'
        ? `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
        : JSON.stringify(value);
      builder.set(`${varName}.${key} = ${formattedValue}`);
    });

    builder.return(varName);

    return builder.build();
  }

  /**
   * Build delete query
   * @param {Object} options - Delete options
   * @returns {string} Cypher query
   */
  _buildDeleteQuery(options) {
    const varName = 'n';
    const builder = CypherFunctions.queryBuilder()
      .match(`(${varName}:${this.label})`);

    if (options.where) {
      const whereClause = this._buildWhereClause(options.where, varName);
      if (whereClause) {
        builder.where(whereClause);
      }
    }

    builder.delete(varName);

    return builder.build();
  }

  /**
   * Build WHERE clause from options
   * @param {Object} where - Where conditions
   * @param {string} varName - Variable name
   * @returns {string} WHERE clause
   */
  _buildWhereClause(where, varName = 'n') {
    const conditions = [];

    Object.entries(where).forEach(([key, value]) => {
      if (typeof value === 'string') {
        conditions.push(`${varName}.${key} = "${value.replace(/"/g, '\\"')}"`);
      } else if (typeof value === 'number') {
        conditions.push(`${varName}.${key} = ${value}`);
      } else if (typeof value === 'boolean') {
        conditions.push(`${varName}.${key} = ${value}`);
      } else if (value === null) {
        conditions.push(`${varName}.${key} IS NULL`);
      } else if (typeof value === 'object') {
        // Handle operators like { $gt: 5 }, { $lt: 10 }, etc.
        Object.entries(value).forEach(([op, val]) => {
          const operator = this._mapOperator(op);
          const formattedVal = typeof val === 'string' ? `"${val}"` : val;
          conditions.push(`${varName}.${key} ${operator} ${formattedVal}`);
        });
      }
    });

    return conditions.join(' AND ');
  }

  /**
   * Map Sequelize operators to Cypher operators
   * @param {string} op - Sequelize operator
   * @returns {string} Cypher operator
   */
  _mapOperator(op) {
    const operatorMap = {
      '$gt': '>',
      '$gte': '>=',
      '$lt': '<',
      '$lte': '<=',
      '$ne': '<>',
      '$eq': '=',
      '$in': 'IN',
      '$notIn': 'NOT IN'
    };

    return operatorMap[op] || '=';
  }

  /**
   * Build ORDER BY clause
   * @param {Array|string} order - Order specification
   * @param {string} varName - Variable name
   * @returns {string} ORDER BY clause
   */
  _buildOrderClause(order, varName = 'n') {
    if (typeof order === 'string') {
      return `${varName}.${order}`;
    }

    if (Array.isArray(order)) {
      return order.map(item => {
        if (typeof item === 'string') {
          return `${varName}.${item}`;
        }
        if (Array.isArray(item)) {
          const [field, direction] = item;
          return `${varName}.${field} ${direction.toUpperCase()}`;
        }
        return '';
      }).join(', ');
    }

    return '';
  }

  /**
   * Parse query result
   * @param {Array} results - Raw results
   * @returns {Object} Parsed result
   */
  _parseResult(results) {
    if (!results || results.length === 0) {
      return null;
    }

    const parsed = GraphUtils.parseAGEResult(results.map(r => r.result || r));
    return parsed[0] || null;
  }

  /**
   * Parse query results
   * @param {Array} results - Raw results
   * @returns {Array} Parsed results
   */
  _parseResults(results) {
    if (!results || results.length === 0) {
      return [];
    }

    return GraphUtils.parseAGEResult(results.map(r => r.result || r));
  }
}

/**
 * Model registry and factory
 */
class ModelRegistry {
  constructor(sequelize, defaultGraphName = 'default_graph') {
    this.sequelize = sequelize;
    this.defaultGraphName = defaultGraphName;
    this.models = new Map();
  }

  /**
   * Define a new model
   * @param {string} label - Model label
   * @param {Object} attributes - Model attributes
   * @param {Object} options - Model options
   * @returns {GraphModel} Model instance
   */
  define(label, attributes = {}, options = {}) {
    const modelOptions = {
      graphName: options.graphName || this.defaultGraphName,
      ...options
    };

    const model = new GraphModel(this.sequelize, label, attributes, modelOptions);
    this.models.set(label, model);

    return model;
  }

  /**
   * Get a model by label
   * @param {string} label - Model label
   * @returns {GraphModel|undefined} Model instance
   */
  get(label) {
    return this.models.get(label);
  }

  /**
   * Check if a model exists
   * @param {string} label - Model label
   * @returns {boolean} True if model exists
   */
  has(label) {
    return this.models.has(label);
  }

  /**
   * Get all models
   * @returns {Map} All models
   */
  getAll() {
    return this.models;
  }
}

module.exports = {
  GraphModel,
  ModelRegistry
};
