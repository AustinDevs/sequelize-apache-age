/**
 * Apache AGE Graph Utilities
 * 
 * Provides utility functions for working with graph data
 */

/**
 * Graph utility functions
 */
const GraphUtils = {
  /**
   * Parse AGE response to extract graph elements
   * @param {Array} results - Raw results from AGE query
   * @returns {Array} Parsed graph elements
   */
  parseAGEResult(results) {
    if (!Array.isArray(results)) {
      return [];
    }

    return results.map(row => {
      if (typeof row === 'string') {
        try {
          return JSON.parse(row);
        } catch (e) {
          return row;
        }
      }
      return row;
    });
  },

  /**
   * Extract vertices from query results
   * @param {Array} results - Query results
   * @returns {Array} Array of vertices
   */
  extractVertices(results) {
    const vertices = [];
    const parsed = this.parseAGEResult(results);

    parsed.forEach(item => {
      if (item && item._type === 'vertex') {
        vertices.push(item);
      } else if (item && typeof item === 'object') {
        Object.values(item).forEach(value => {
          if (value && value._type === 'vertex') {
            vertices.push(value);
          }
        });
      }
    });

    return vertices;
  },

  /**
   * Extract edges from query results
   * @param {Array} results - Query results
   * @returns {Array} Array of edges
   */
  extractEdges(results) {
    const edges = [];
    const parsed = this.parseAGEResult(results);

    parsed.forEach(item => {
      if (item && item._type === 'edge') {
        edges.push(item);
      } else if (item && typeof item === 'object') {
        Object.values(item).forEach(value => {
          if (value && value._type === 'edge') {
            edges.push(value);
          }
        });
      }
    });

    return edges;
  },

  /**
   * Extract paths from query results
   * @param {Array} results - Query results
   * @returns {Array} Array of paths
   */
  extractPaths(results) {
    const paths = [];
    const parsed = this.parseAGEResult(results);

    parsed.forEach(item => {
      if (item && item._type === 'path') {
        paths.push(item);
      }
    });

    return paths;
  },

  /**
   * Format vertex ID for AGE
   * @param {string|number} id - Vertex ID
   * @returns {string} Formatted ID
   */
  formatVertexId(id) {
    return String(id);
  },

  /**
   * Format edge ID for AGE
   * @param {string|number} id - Edge ID
   * @returns {string} Formatted ID
   */
  formatEdgeId(id) {
    return String(id);
  },

  /**
   * Validate graph name
   * @param {string} name - Graph name
   * @returns {boolean} True if valid
   */
  isValidGraphName(name) {
    // Graph names must be valid PostgreSQL identifiers
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
  },

  /**
   * Validate label name
   * @param {string} label - Label name
   * @returns {boolean} True if valid
   */
  isValidLabel(label) {
    // Labels must be valid identifiers
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(label);
  },

  /**
   * Build AGE query wrapper
   * @param {string} graphName - Graph name
   * @param {string} cypherQuery - Cypher query
   * @returns {string} Complete AGE query
   */
  buildAGEQuery(graphName, cypherQuery) {
    const escapedQuery = cypherQuery.replace(/'/g, "''");
    return `SELECT * FROM ag_catalog.cypher('${graphName}', $$ ${escapedQuery} $$) as (result ag_catalog.agtype);`;
  },

  /**
   * Convert JavaScript object to AGE properties format
   * @param {Object} properties - Properties object
   * @returns {string} AGE properties string
   */
  toAGEProperties(properties) {
    if (!properties || typeof properties !== 'object') {
      return '{}';
    }

    const props = Object.entries(properties)
      .map(([key, value]) => {
        const jsonValue = JSON.stringify(value);
        return `${key}: ${jsonValue}`;
      })
      .join(', ');

    return `{${props}}`;
  },

  /**
   * Parse AGE properties to JavaScript object
   * @param {string|Object} properties - AGE properties
   * @returns {Object} JavaScript object
   */
  fromAGEProperties(properties) {
    if (typeof properties === 'object') {
      return properties;
    }

    if (typeof properties === 'string') {
      try {
        return JSON.parse(properties);
      } catch (e) {
        return {};
      }
    }

    return {};
  },

  /**
   * Generate unique variable name
   * @param {string} prefix - Variable prefix
   * @returns {string} Unique variable name
   */
  generateVariableName(prefix = 'var') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
};

module.exports = {
  GraphUtils
};
