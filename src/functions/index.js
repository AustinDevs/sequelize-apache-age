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
      optionalMatch: [],
      where: [],
      create: [],
      merge: [],
      unwind: [],
      set: [],
      delete: [],
      remove: [],
      return: [],
      with: [],
      orderBy: [],
      limit: null,
      skip: null,
      union: [],
      distinct: false
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
   * Add OPTIONAL MATCH clause
   * @param {string} pattern - Pattern to optionally match
   * @returns {CypherQueryBuilder} this
   */
  optionalMatch(pattern) {
    this.queryParts.optionalMatch.push(pattern);
    return this;
  }

  /**
   * Add MERGE clause (create or match)
   * @param {string} pattern - Pattern to merge
   * @returns {CypherQueryBuilder} this
   */
  merge(pattern) {
    this.queryParts.merge.push(pattern);
    return this;
  }

  /**
   * Add UNWIND clause
   * @param {string} expression - Expression to unwind
   * @param {string} alias - Alias for unwound items
   * @returns {CypherQueryBuilder} this
   */
  unwind(expression, alias) {
    this.queryParts.unwind.push(`${expression} AS ${alias}`);
    return this;
  }

  /**
   * Add REMOVE clause
   * @param {string} target - Property or label to remove
   * @returns {CypherQueryBuilder} this
   */
  remove(target) {
    this.queryParts.remove.push(target);
    return this;
  }

  /**
   * Add UNION clause
   * @param {CypherQueryBuilder|string} query - Query to union
   * @param {boolean} all - Use UNION ALL instead of UNION
   * @returns {CypherQueryBuilder} this
   */
  union(query, all = false) {
    const queryString = typeof query === 'string' ? query : query.build();
    this.queryParts.union.push({ query: queryString, all });
    return this;
  }

  /**
   * Make RETURN distinct
   * @returns {CypherQueryBuilder} this
   */
  distinct() {
    this.queryParts.distinct = true;
    return this;
  }

  /**
   * Build the complete Cypher query
   * @returns {string} Complete Cypher query
   */
  build() {
    const parts = [];

    // UNWIND comes first
    if (this.queryParts.unwind.length > 0) {
      this.queryParts.unwind.forEach(unwind => {
        parts.push(`UNWIND ${unwind}`);
      });
    }

    // MATCH
    if (this.queryParts.match.length > 0) {
      parts.push(`MATCH ${this.queryParts.match.join(', ')}`);
    }

    // OPTIONAL MATCH
    if (this.queryParts.optionalMatch.length > 0) {
      this.queryParts.optionalMatch.forEach(pattern => {
        parts.push(`OPTIONAL MATCH ${pattern}`);
      });
    }

    // MERGE
    if (this.queryParts.merge.length > 0) {
      this.queryParts.merge.forEach(pattern => {
        parts.push(`MERGE ${pattern}`);
      });
    }

    // CREATE
    if (this.queryParts.create.length > 0) {
      parts.push(`CREATE ${this.queryParts.create.join(', ')}`);
    }

    // WHERE
    if (this.queryParts.where.length > 0) {
      parts.push(`WHERE ${this.queryParts.where.join(' AND ')}`);
    }

    // WITH
    if (this.queryParts.with.length > 0) {
      parts.push(`WITH ${this.queryParts.with.join(', ')}`);
    }

    // SET
    if (this.queryParts.set.length > 0) {
      parts.push(`SET ${this.queryParts.set.join(', ')}`);
    }

    // REMOVE
    if (this.queryParts.remove.length > 0) {
      parts.push(`REMOVE ${this.queryParts.remove.join(', ')}`);
    }

    // DELETE
    if (this.queryParts.delete.length > 0) {
      parts.push(`DELETE ${this.queryParts.delete.join(', ')}`);
    }

    // RETURN
    if (this.queryParts.return.length > 0) {
      const returnClause = this.queryParts.distinct
        ? `RETURN DISTINCT ${this.queryParts.return.join(', ')}`
        : `RETURN ${this.queryParts.return.join(', ')}`;
      parts.push(returnClause);
    }

    // ORDER BY
    if (this.queryParts.orderBy.length > 0) {
      parts.push(`ORDER BY ${this.queryParts.orderBy.join(', ')}`);
    }

    // SKIP
    if (this.queryParts.skip !== null) {
      parts.push(`SKIP ${this.queryParts.skip}`);
    }

    // LIMIT
    if (this.queryParts.limit !== null) {
      parts.push(`LIMIT ${this.queryParts.limit}`);
    }

    const query = parts.join(' ');

    // UNION
    if (this.queryParts.union.length > 0) {
      const unions = this.queryParts.union.map(u => {
        const keyword = u.all ? 'UNION ALL' : 'UNION';
        return `${keyword} ${u.query}`;
      }).join(' ');
      return `${query} ${unions}`;
    }

    return query;
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
  },

  /**
   * Aggregation functions
   */
  aggregation: {
    /**
     * COUNT aggregation
     * @param {string} expression - Expression to count
     * @returns {string} COUNT expression
     */
    count(expression = '*') {
      return `count(${expression})`;
    },

    /**
     * SUM aggregation
     * @param {string} expression - Expression to sum
     * @returns {string} SUM expression
     */
    sum(expression) {
      return `sum(${expression})`;
    },

    /**
     * AVG aggregation
     * @param {string} expression - Expression to average
     * @returns {string} AVG expression
     */
    avg(expression) {
      return `avg(${expression})`;
    },

    /**
     * MIN aggregation
     * @param {string} expression - Expression to find minimum
     * @returns {string} MIN expression
     */
    min(expression) {
      return `min(${expression})`;
    },

    /**
     * MAX aggregation
     * @param {string} expression - Expression to find maximum
     * @returns {string} MAX expression
     */
    max(expression) {
      return `max(${expression})`;
    },

    /**
     * COLLECT aggregation
     * @param {string} expression - Expression to collect
     * @returns {string} COLLECT expression
     */
    collect(expression) {
      return `collect(${expression})`;
    }
  },

  /**
   * List operations
   */
  list: {
    /**
     * Create a list
     * @param {Array} items - List items
     * @returns {string} List expression
     */
    create(items) {
      return `[${items.join(', ')}]`;
    },

    /**
     * List comprehension
     * @param {string} variable - Variable name
     * @param {string} list - List expression
     * @param {string} filter - Filter expression
     * @param {string} map - Map expression
     * @returns {string} List comprehension
     */
    comprehension(variable, list, filter = null, map = null) {
      let expr = `${variable} IN ${list}`;
      if (filter) expr += ` WHERE ${filter}`;
      if (map) expr += ` | ${map}`;
      return `[${expr}]`;
    },

    /**
     * Range expression
     * @param {number} start - Start value
     * @param {number} end - End value
     * @param {number} step - Step value
     * @returns {string} Range expression
     */
    range(start, end, step = 1) {
      return step === 1 ? `range(${start}, ${end})` : `range(${start}, ${end}, ${step})`;
    }
  },

  /**
   * String functions
   */
  string: {
    /**
     * Convert to lowercase
     * @param {string} expression - Expression
     * @returns {string} toLower expression
     */
    toLower(expression) {
      return `toLower(${expression})`;
    },

    /**
     * Convert to uppercase
     * @param {string} expression - Expression
     * @returns {string} toUpper expression
     */
    toUpper(expression) {
      return `toUpper(${expression})`;
    },

    /**
     * Trim whitespace
     * @param {string} expression - Expression
     * @returns {string} trim expression
     */
    trim(expression) {
      return `trim(${expression})`;
    },

    /**
     * Substring
     * @param {string} expression - Expression
     * @param {number} start - Start index
     * @param {number} length - Length
     * @returns {string} substring expression
     */
    substring(expression, start, length = null) {
      return length !== null
        ? `substring(${expression}, ${start}, ${length})`
        : `substring(${expression}, ${start})`;
    },

    /**
     * String concatenation
     * @param {Array<string>} expressions - Expressions to concatenate
     * @returns {string} Concatenation expression
     */
    concat(...expressions) {
      return expressions.join(' + ');
    }
  },

  /**
   * Path functions
   */
  pathFunctions: {
    /**
     * Get path length
     * @param {string} pathVar - Path variable
     * @returns {string} length expression
     */
    length(pathVar) {
      return `length(${pathVar})`;
    },

    /**
     * Get nodes in path
     * @param {string} pathVar - Path variable
     * @returns {string} nodes expression
     */
    nodes(pathVar) {
      return `nodes(${pathVar})`;
    },

    /**
     * Get relationships in path
     * @param {string} pathVar - Path variable
     * @returns {string} relationships expression
     */
    relationships(pathVar) {
      return `relationships(${pathVar})`;
    },

    /**
     * Shortest path
     * @param {string} pattern - Path pattern
     * @returns {string} shortestPath expression
     */
    shortestPath(pattern) {
      return `shortestPath(${pattern})`;
    },

    /**
     * All shortest paths
     * @param {string} pattern - Path pattern
     * @returns {string} allShortestPaths expression
     */
    allShortestPaths(pattern) {
      return `allShortestPaths(${pattern})`;
    }
  },

  /**
   * Type checking functions
   */
  type: {
    /**
     * Get type of value
     * @param {string} expression - Expression
     * @returns {string} type expression
     */
    type(expression) {
      return `type(${expression})`;
    },

    /**
     * Get labels of node
     * @param {string} nodeVar - Node variable
     * @returns {string} labels expression
     */
    labels(nodeVar) {
      return `labels(${nodeVar})`;
    },

    /**
     * Get properties
     * @param {string} expression - Expression
     * @returns {string} properties expression
     */
    properties(expression) {
      return `properties(${expression})`;
    }
  }
};

module.exports = {
  CypherFunctions,
  CypherQueryBuilder
};
