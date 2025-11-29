/**
 * Apache AGE Query Optimization Helpers
 *
 * Provides utilities for optimizing graph queries
 */

/**
 * Query Analyzer
 * Analyzes queries and provides optimization suggestions
 */
class QueryAnalyzer {
  /**
   * Analyze a Cypher query
   * @param {string} query - Cypher query
   * @returns {Object} Analysis results
   */
  static analyze(query) {
    const analysis = {
      hasIndexableProperties: false,
      hasCartesianProduct: false,
      hasOptionalMatch: false,
      hasUnboundedPath: false,
      hasDistinct: false,
      suggestions: []
    };

    // Check for indexable properties in WHERE clauses
    if (/WHERE\s+\w+\.\w+\s*=/i.test(query)) {
      analysis.hasIndexableProperties = true;
      analysis.suggestions.push('Consider creating indexes on properties used in WHERE clauses');
    }

    // Check for potential cartesian products
    const matchCount = (query.match(/MATCH/gi) || []).length;
    const whereCount = (query.match(/WHERE/gi) || []).length;
    if (matchCount > 1 && whereCount < matchCount) {
      analysis.hasCartesianProduct = true;
      analysis.suggestions.push('Potential cartesian product detected. Consider adding WHERE clauses to connect patterns');
    }

    // Check for OPTIONAL MATCH
    if (/OPTIONAL\s+MATCH/i.test(query)) {
      analysis.hasOptionalMatch = true;
      analysis.suggestions.push('OPTIONAL MATCH can be expensive. Consider if it\'s necessary');
    }

    // Check for unbounded variable-length paths
    if (/\[\*\]/i.test(query)) {
      analysis.hasUnboundedPath = true;
      analysis.suggestions.push('Unbounded variable-length paths can be very expensive. Consider adding path length limits');
    }

    // Check for DISTINCT
    if (/RETURN\s+DISTINCT/i.test(query)) {
      analysis.hasDistinct = true;
    }

    return analysis;
  }

  /**
   * Suggest indexes based on query patterns
   * @param {Array<string>} queries - Array of queries
   * @returns {Array<Object>} Index suggestions
   */
  static suggestIndexes(queries) {
    const indexSuggestions = new Map();

    queries.forEach(query => {
      // Find WHERE clauses with property access
      const wherePattern = /WHERE\s+(\w+)\.(\w+)/gi;
      let match;

      while ((match = wherePattern.exec(query)) !== null) {
        const [, variable, property] = match;

        // Try to find label for this variable
        const labelPattern = new RegExp(`\\(${variable}:(\\w+)\\)`, 'i');
        const labelMatch = query.match(labelPattern);

        if (labelMatch) {
          const label = labelMatch[1];
          const key = `${label}.${property}`;

          if (!indexSuggestions.has(key)) {
            indexSuggestions.set(key, {
              label,
              property,
              frequency: 1
            });
          } else {
            indexSuggestions.get(key).frequency++;
          }
        }
      }
    });

    return Array.from(indexSuggestions.values())
      .sort((a, b) => b.frequency - a.frequency);
  }
}

/**
 * Query Optimizer
 * Provides query optimization utilities
 */
class QueryOptimizer {
  /**
   * Optimize a query by reordering patterns
   * @param {string} query - Cypher query
   * @returns {string} Optimized query
   */
  static optimizePatternOrder(query) {
    // This is a simplified optimization
    // In practice, you'd want more sophisticated analysis
    return query;
  }

  /**
   * Add query hints for better performance
   * @param {string} query - Cypher query
   * @param {Object} hints - Query hints
   * @returns {string} Query with hints
   */
  static addHints(query, hints = {}) {
    // AGE-specific query hints can be added here
    // This is a placeholder for future implementation
    return query;
  }

  /**
   * Batch multiple queries for better performance
   * @param {Array<string>} queries - Array of queries
   * @returns {string} Batched query
   */
  static batchQueries(queries) {
    // Combine multiple queries using UNION ALL
    return queries.join(' UNION ALL ');
  }
}

/**
 * Index Manager
 * Manages graph indexes for optimization
 */
class IndexManager {
  /**
   * Create an index manager
   * @param {Object} sequelize - Sequelize instance
   * @param {string} graphName - Graph name
   */
  constructor(sequelize, graphName) {
    this.sequelize = sequelize;
    this.graphName = graphName;
  }

  /**
   * Create an index on a label property
   * @param {string} label - Vertex/Edge label
   * @param {string} property - Property name
   * @returns {Promise<void>}
   */
  async createIndex(label, property) {
    // AGE doesn't have native graph indexes yet, but we can create
    // indexes on the underlying PostgreSQL tables
    const indexName = `idx_${this.graphName}_${label}_${property}`;
    const query = `
      CREATE INDEX IF NOT EXISTS ${indexName}
      ON ${this.graphName}.${label}
      USING btree (properties)
    `;

    try {
      await this.sequelize.query(query);
    } catch (error) {
      // Index creation might fail if schema doesn't exist yet
      // This is expected for AGE as it manages its own schemas
      console.warn(`Could not create index: ${error.message}`);
    }
  }

  /**
   * Drop an index
   * @param {string} label - Vertex/Edge label
   * @param {string} property - Property name
   * @returns {Promise<void>}
   */
  async dropIndex(label, property) {
    const indexName = `idx_${this.graphName}_${label}_${property}`;
    const query = `DROP INDEX IF EXISTS ${indexName}`;

    try {
      await this.sequelize.query(query);
    } catch (error) {
      console.warn(`Could not drop index: ${error.message}`);
    }
  }

  /**
   * List all indexes
   * @returns {Promise<Array>} List of indexes
   */
  async listIndexes() {
    const query = `
      SELECT
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM
        pg_indexes
      WHERE
        schemaname = '${this.graphName}'
      ORDER BY
        tablename,
        indexname
    `;

    try {
      const results = await this.sequelize.query(query, {
        type: this.sequelize.QueryTypes.SELECT
      });
      return results;
    } catch (error) {
      console.warn(`Could not list indexes: ${error.message}`);
      return [];
    }
  }
}

/**
 * Query Cache
 * Simple query result cache for optimization
 */
class QueryCache {
  constructor(options = {}) {
    this.cache = new Map();
    this.maxSize = options.maxSize || 100;
    this.ttl = options.ttl || 60000; // 1 minute default
  }

  /**
   * Get cached result
   * @param {string} key - Cache key
   * @returns {*} Cached result or null
   */
  get(key) {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Set cached result
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   */
  set(key, value) {
    // Simple LRU: if cache is full, remove oldest entry
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  /**
   * Clear cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get cache size
   * @returns {number} Cache size
   */
  size() {
    return this.cache.size;
  }
}

/**
 * Performance Monitor
 * Monitors query performance
 */
class PerformanceMonitor {
  constructor() {
    this.queryStats = new Map();
  }

  /**
   * Record query execution
   * @param {string} query - Query string
   * @param {number} duration - Execution duration in ms
   */
  record(query, duration) {
    const key = this._normalizeQuery(query);

    if (!this.queryStats.has(key)) {
      this.queryStats.set(key, {
        query: key,
        count: 0,
        totalDuration: 0,
        avgDuration: 0,
        minDuration: Infinity,
        maxDuration: 0
      });
    }

    const stats = this.queryStats.get(key);
    stats.count++;
    stats.totalDuration += duration;
    stats.avgDuration = stats.totalDuration / stats.count;
    stats.minDuration = Math.min(stats.minDuration, duration);
    stats.maxDuration = Math.max(stats.maxDuration, duration);
  }

  /**
   * Get slowest queries
   * @param {number} limit - Number of queries to return
   * @returns {Array} Slowest queries
   */
  getSlowestQueries(limit = 10) {
    return Array.from(this.queryStats.values())
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, limit);
  }

  /**
   * Get most frequent queries
   * @param {number} limit - Number of queries to return
   * @returns {Array} Most frequent queries
   */
  getMostFrequentQueries(limit = 10) {
    return Array.from(this.queryStats.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Reset statistics
   */
  reset() {
    this.queryStats.clear();
  }

  /**
   * Normalize query for comparison
   * @param {string} query - Query string
   * @returns {string} Normalized query
   */
  _normalizeQuery(query) {
    // Remove extra whitespace and normalize
    return query.replace(/\s+/g, ' ').trim();
  }
}

module.exports = {
  QueryAnalyzer,
  QueryOptimizer,
  IndexManager,
  QueryCache,
  PerformanceMonitor
};
