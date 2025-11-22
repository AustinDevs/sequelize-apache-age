/**
 * Apache AGE Data Types for Sequelize
 * 
 * Defines custom data types for graph objects:
 * - VERTEX: Graph vertex/node
 * - EDGE: Graph edge/relationship
 * - PATH: Graph path (sequence of vertices and edges)
 * - AGTYPE: Apache AGE's JSON-like data type
 */

/**
 * VERTEX data type
 * Represents a node in the graph
 */
class VERTEX {
  constructor() {
    this.type = 'VERTEX';
  }

  toSql() {
    return 'ag_catalog.agtype';
  }

  /**
   * Parse vertex from AGE format
   * @param {string} value - Raw vertex value
   * @returns {Object} Parsed vertex
   */
  static parse(value) {
    if (typeof value === 'string') {
      return JSON.parse(value);
    }
    return value;
  }

  /**
   * Create vertex object
   * @param {string} label - Vertex label
   * @param {Object} properties - Vertex properties
   * @returns {Object} Vertex object
   */
  static create(label, properties = {}) {
    return {
      label,
      properties,
      _type: 'vertex'
    };
  }
}

/**
 * EDGE data type
 * Represents a relationship/edge in the graph
 */
class EDGE {
  constructor() {
    this.type = 'EDGE';
  }

  toSql() {
    return 'ag_catalog.agtype';
  }

  /**
   * Parse edge from AGE format
   * @param {string} value - Raw edge value
   * @returns {Object} Parsed edge
   */
  static parse(value) {
    if (typeof value === 'string') {
      return JSON.parse(value);
    }
    return value;
  }

  /**
   * Create edge object
   * @param {string} label - Edge label
   * @param {string|number} startId - Start vertex ID
   * @param {string|number} endId - End vertex ID
   * @param {Object} properties - Edge properties
   * @returns {Object} Edge object
   */
  static create(label, startId, endId, properties = {}) {
    return {
      label,
      start_id: startId,
      end_id: endId,
      properties,
      _type: 'edge'
    };
  }
}

/**
 * PATH data type
 * Represents a path in the graph (sequence of vertices and edges)
 */
class PATH {
  constructor() {
    this.type = 'PATH';
  }

  toSql() {
    return 'ag_catalog.agtype';
  }

  /**
   * Parse path from AGE format
   * @param {string} value - Raw path value
   * @returns {Object} Parsed path
   */
  static parse(value) {
    if (typeof value === 'string') {
      return JSON.parse(value);
    }
    return value;
  }

  /**
   * Create path object
   * @param {Array} vertices - Array of vertices
   * @param {Array} edges - Array of edges
   * @returns {Object} Path object
   */
  static create(vertices = [], edges = []) {
    return {
      vertices,
      edges,
      _type: 'path'
    };
  }
}

/**
 * AGTYPE data type
 * Apache AGE's flexible JSON-like data type
 */
class AGTYPE {
  constructor() {
    this.type = 'AGTYPE';
  }

  toSql() {
    return 'ag_catalog.agtype';
  }

  /**
   * Parse agtype from AGE format
   * @param {string} value - Raw agtype value
   * @returns {*} Parsed value
   */
  static parse(value) {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
    }
    return value;
  }

  /**
   * Stringify value to agtype format
   * @param {*} value - Value to stringify
   * @returns {string} Stringified value
   */
  static stringify(value) {
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }
}

const DataTypes = {
  VERTEX,
  EDGE,
  PATH,
  AGTYPE
};

module.exports = {
  DataTypes,
  VERTEX,
  EDGE,
  PATH,
  AGTYPE
};
