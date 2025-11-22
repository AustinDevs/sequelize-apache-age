/**
 * Apache AGE Relationship Utilities
 * 
 * Provides utilities for managing graph relationships
 */

/**
 * Relationship definition class
 */
class Relationship {
  /**
   * Create a relationship definition
   * @param {string} type - Relationship type/label
   * @param {Object} options - Relationship options
   */
  constructor(type, options = {}) {
    this.type = type;
    this.options = {
      direction: options.direction || 'outgoing', // 'outgoing', 'incoming', 'both'
      properties: options.properties || {},
      ...options
    };
  }

  /**
   * Get Cypher pattern for this relationship
   * @param {string} fromVar - From vertex variable
   * @param {string} toVar - To vertex variable
   * @param {string} relVar - Relationship variable
   * @returns {string} Cypher pattern
   */
  toCypherPattern(fromVar = 'a', toVar = 'b', relVar = 'r') {
    const props = Object.keys(this.options.properties).length > 0
      ? ` ${JSON.stringify(this.options.properties)}`
      : '';

    if (this.options.direction === 'incoming') {
      return `(${fromVar})<-[${relVar}:${this.type}${props}]-(${toVar})`;
    } else if (this.options.direction === 'both') {
      return `(${fromVar})-[${relVar}:${this.type}${props}]-(${toVar})`;
    } else {
      return `(${fromVar})-[${relVar}:${this.type}${props}]->(${toVar})`;
    }
  }
}

/**
 * Relationship utilities and helpers
 */
const Relationships = {
  /**
   * Create a relationship definition
   * @param {string} type - Relationship type
   * @param {Object} options - Relationship options
   * @returns {Relationship} Relationship instance
   */
  define(type, options = {}) {
    return new Relationship(type, options);
  },

  /**
   * Common relationship patterns
   */
  patterns: {
    /**
     * One-to-one relationship
     * @param {string} type - Relationship type
     * @returns {Relationship} Relationship instance
     */
    oneToOne(type) {
      return new Relationship(type, { 
        direction: 'outgoing',
        cardinality: 'one-to-one'
      });
    },

    /**
     * One-to-many relationship
     * @param {string} type - Relationship type
     * @returns {Relationship} Relationship instance
     */
    oneToMany(type) {
      return new Relationship(type, { 
        direction: 'outgoing',
        cardinality: 'one-to-many'
      });
    },

    /**
     * Many-to-one relationship
     * @param {string} type - Relationship type
     * @returns {Relationship} Relationship instance
     */
    manyToOne(type) {
      return new Relationship(type, { 
        direction: 'incoming',
        cardinality: 'many-to-one'
      });
    },

    /**
     * Many-to-many relationship
     * @param {string} type - Relationship type
     * @returns {Relationship} Relationship instance
     */
    manyToMany(type) {
      return new Relationship(type, { 
        direction: 'both',
        cardinality: 'many-to-many'
      });
    }
  },

  /**
   * Traverse relationships
   * @param {Object} startVertex - Starting vertex
   * @param {string} relationshipType - Type of relationship to traverse
   * @param {Object} options - Traversal options
   * @returns {Object} Traversal configuration
   */
  traverse(startVertex, relationshipType, options = {}) {
    return {
      start: startVertex,
      relationship: relationshipType,
      depth: options.depth || 1,
      direction: options.direction || 'outgoing',
      filter: options.filter || null
    };
  },

  /**
   * Build a relationship query
   * @param {string} fromLabel - From vertex label
   * @param {string} relationshipType - Relationship type
   * @param {string} toLabel - To vertex label
   * @param {Object} options - Query options
   * @returns {string} Cypher query
   */
  buildQuery(fromLabel, relationshipType, toLabel, options = {}) {
    const fromVar = options.fromVar || 'from';
    const relVar = options.relVar || 'rel';
    const toVar = options.toVar || 'to';
    
    const fromPattern = `(${fromVar}:${fromLabel})`;
    const toPattern = `(${toVar}:${toLabel})`;
    
    const relationship = new Relationship(relationshipType, options);
    const direction = relationship.options.direction;
    
    // Build relationship pattern with labels
    let relPattern;
    if (direction === 'incoming') {
      relPattern = `${fromPattern}<-[${relVar}:${relationshipType}]-${toPattern}`;
    } else if (direction === 'both') {
      relPattern = `${fromPattern}-[${relVar}:${relationshipType}]-${toPattern}`;
    } else {
      relPattern = `${fromPattern}-[${relVar}:${relationshipType}]->${toPattern}`;
    }
    
    return `MATCH ${relPattern} RETURN ${fromVar}, ${relVar}, ${toVar}`;
  }
};

module.exports = {
  Relationships,
  Relationship
};
