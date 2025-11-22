/**
 * Apache AGE Cypher Functions
 * 
 * Provides utilities for building and executing Cypher queries
 * Compatible with Apache AGE's Cypher implementation
 */

/**
 * Cypher query builder
 */
class CypherQueryBuilder {
  constructor() {
    this.queryParts = {
      match: [],
      where: [],
      create: [],
      set: [],
      delete: [],
      return: [],
      with: [],
      orderBy: [],
      limit: null,
      skip: null
    };
  }

  /**
   * Add MATCH clause
   * @param {string} pattern - Pattern to match
   * @returns {CypherQueryBuilder} this
   */
  match(pattern) {
    this.queryParts.match.push(pattern);
    return this;
  }

  /**
   * Add WHERE clause
   * @param {string} condition - Condition to filter
   * @returns {CypherQueryBuilder} this
   */
  where(condition) {
    this.queryParts.where.push(condition);
    return this;
  }

  /**
   * Add CREATE clause
   * @param {string} pattern - Pattern to create
   * @returns {CypherQueryBuilder} this
   */
  create(pattern) {
    this.queryParts.create.push(pattern);
    return this;
  }

  /**
   * Add SET clause
   * @param {string} assignment - Property assignment
   * @returns {CypherQueryBuilder} this
   */
  set(assignment) {
    this.queryParts.set.push(assignment);
    return this;
  }

  /**
   * Add DELETE clause
   * @param {string} target - Target to delete
   * @returns {CypherQueryBuilder} this
   */
  delete(target) {
    this.queryParts.delete.push(target);
    return this;
  }

  /**
   * Add RETURN clause
   * @param {string} expression - Expression to return
   * @returns {CypherQueryBuilder} this
   */
  return(expression) {
    this.queryParts.return.push(expression);
    return this;
  }

  /**
   * Add WITH clause
   * @param {string} expression - Expression for WITH
   * @returns {CypherQueryBuilder} this
   */
  with(expression) {
    this.queryParts.with.push(expression);
    return this;
  }

  /**
   * Add ORDER BY clause
   * @param {string} expression - Order expression
   * @returns {CypherQueryBuilder} this
   */
  orderBy(expression) {
    this.queryParts.orderBy.push(expression);
    return this;
  }

  /**
   * Add LIMIT clause
   * @param {number} count - Limit count
   * @returns {CypherQueryBuilder} this
   */
  limit(count) {
    this.queryParts.limit = count;
    return this;
  }

  /**
   * Add SKIP clause
   * @param {number} count - Skip count
   * @returns {CypherQueryBuilder} this
   */
  skip(count) {
    this.queryParts.skip = count;
    return this;
  }

  /**
   * Build the complete Cypher query
   * @returns {string} Complete Cypher query
   */
  build() {
    const parts = [];

    if (this.queryParts.match.length > 0) {
      parts.push(`MATCH ${this.queryParts.match.join(', ')}`);
    }

    if (this.queryParts.create.length > 0) {
      parts.push(`CREATE ${this.queryParts.create.join(', ')}`);
    }

    if (this.queryParts.where.length > 0) {
      parts.push(`WHERE ${this.queryParts.where.join(' AND ')}`);
    }

    if (this.queryParts.with.length > 0) {
      parts.push(`WITH ${this.queryParts.with.join(', ')}`);
    }

    if (this.queryParts.set.length > 0) {
      parts.push(`SET ${this.queryParts.set.join(', ')}`);
    }

    if (this.queryParts.delete.length > 0) {
      parts.push(`DELETE ${this.queryParts.delete.join(', ')}`);
    }

    if (this.queryParts.return.length > 0) {
      parts.push(`RETURN ${this.queryParts.return.join(', ')}`);
    }

    if (this.queryParts.orderBy.length > 0) {
      parts.push(`ORDER BY ${this.queryParts.orderBy.join(', ')}`);
    }

    if (this.queryParts.skip !== null) {
      parts.push(`SKIP ${this.queryParts.skip}`);
    }

    if (this.queryParts.limit !== null) {
      parts.push(`LIMIT ${this.queryParts.limit}`);
    }

    return parts.join(' ');
  }

  /**
   * Convert to string
   * @returns {string} Query string
   */
  toString() {
    return this.build();
  }
}

/**
 * Cypher function utilities
 */
const CypherFunctions = {
  /**
   * Create a new query builder
   * @returns {CypherQueryBuilder} New query builder instance
   */
  queryBuilder() {
    return new CypherQueryBuilder();
  },

  /**
   * Escape a property name
   * @param {string} name - Property name
   * @returns {string} Escaped name
   */
  escapeName(name) {
    return `\`${name.replace(/`/g, '``')}\``;
  },

  /**
   * Escape a string value
   * @param {string} value - String value
   * @returns {string} Escaped value
   */
  escapeString(value) {
    // Escape backslashes first, then single quotes
    return `'${value.replace(/\\/g, '\\\\').replace(/'/g, '\\\'')}'`;
  },

  /**
   * Format properties object for Cypher
   * @param {Object} properties - Properties object
   * @returns {string} Formatted properties
   */
  formatProperties(properties) {
    const props = Object.entries(properties)
      .map(([key, value]) => {
        const formattedValue = typeof value === 'string' 
          ? `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"` // Escape backslashes then double quotes
          : JSON.stringify(value);
        return `${key}: ${formattedValue}`;
      })
      .join(', ');
    return `{${props}}`;
  },

  /**
   * Build a vertex pattern
   * @param {string} variable - Variable name
   * @param {string} label - Vertex label
   * @param {Object} properties - Vertex properties
   * @returns {string} Vertex pattern
   */
  vertex(variable, label = null, properties = null) {
    let pattern = variable;
    if (label) pattern += `:${label}`;
    if (properties) pattern += ` ${this.formatProperties(properties)}`;
    return `(${pattern})`;
  },

  /**
   * Build an edge pattern
   * @param {string} variable - Variable name
   * @param {string} label - Edge label
   * @param {Object} properties - Edge properties
   * @param {string} direction - Direction ('left', 'right', 'both')
   * @returns {string} Edge pattern
   */
  edge(variable, label = null, properties = null, direction = 'right') {
    let pattern = variable;
    if (label) pattern += `:${label}`;
    if (properties) pattern += ` ${this.formatProperties(properties)}`;
    
    if (direction === 'left') {
      return `<-[${pattern}]-`;
    } else if (direction === 'both') {
      return `-[${pattern}]-`;
    } else {
      return `-[${pattern}]->`;
    }
  },

  /**
   * Build a path pattern
   * @param {Array<string>} elements - Path elements
   * @returns {string} Path pattern
   */
  path(...elements) {
    return elements.join('');
  }
};

module.exports = {
  CypherFunctions,
  CypherQueryBuilder
};
