/**
 * Tests for relationship utilities
 */

const { Relationships, Relationship } = require('../src/relationships');

describe('Relationships', () => {
  describe('Relationship class', () => {
    test('should create relationship with default options', () => {
      const rel = new Relationship('KNOWS');
      expect(rel.type).toBe('KNOWS');
      expect(rel.options.direction).toBe('outgoing');
    });

    test('should create relationship with custom direction', () => {
      const rel = new Relationship('KNOWS', { direction: 'incoming' });
      expect(rel.options.direction).toBe('incoming');
    });

    test('should generate outgoing Cypher pattern', () => {
      const rel = new Relationship('KNOWS', { direction: 'outgoing' });
      const pattern = rel.toCypherPattern('a', 'b', 'r');
      expect(pattern).toBe('(a)-[r:KNOWS]->(b)');
    });

    test('should generate incoming Cypher pattern', () => {
      const rel = new Relationship('KNOWS', { direction: 'incoming' });
      const pattern = rel.toCypherPattern('a', 'b', 'r');
      expect(pattern).toBe('(a)<-[r:KNOWS]-(b)');
    });

    test('should generate bidirectional Cypher pattern', () => {
      const rel = new Relationship('KNOWS', { direction: 'both' });
      const pattern = rel.toCypherPattern('a', 'b', 'r');
      expect(pattern).toBe('(a)-[r:KNOWS]-(b)');
    });
  });

  describe('Relationships utilities', () => {
    test('should define relationship', () => {
      const rel = Relationships.define('WORKS_AT');
      expect(rel).toBeInstanceOf(Relationship);
      expect(rel.type).toBe('WORKS_AT');
    });

    test('should create one-to-one pattern', () => {
      const rel = Relationships.patterns.oneToOne('MARRIED_TO');
      expect(rel.type).toBe('MARRIED_TO');
      expect(rel.options.cardinality).toBe('one-to-one');
    });

    test('should create one-to-many pattern', () => {
      const rel = Relationships.patterns.oneToMany('HAS_CHILD');
      expect(rel.type).toBe('HAS_CHILD');
      expect(rel.options.cardinality).toBe('one-to-many');
    });

    test('should create many-to-one pattern', () => {
      const rel = Relationships.patterns.manyToOne('BELONGS_TO');
      expect(rel.type).toBe('BELONGS_TO');
      expect(rel.options.cardinality).toBe('many-to-one');
    });

    test('should create many-to-many pattern', () => {
      const rel = Relationships.patterns.manyToMany('KNOWS');
      expect(rel.type).toBe('KNOWS');
      expect(rel.options.cardinality).toBe('many-to-many');
    });

    test('should build traversal configuration', () => {
      const startVertex = { id: 1, label: 'Person' };
      const traversal = Relationships.traverse(startVertex, 'KNOWS', { depth: 2 });
      
      expect(traversal.start).toBe(startVertex);
      expect(traversal.relationship).toBe('KNOWS');
      expect(traversal.depth).toBe(2);
    });

    test('should build relationship query', () => {
      const query = Relationships.buildQuery('Person', 'KNOWS', 'Person');
      expect(query).toContain('MATCH');
      expect(query).toContain('Person');
      expect(query).toContain('KNOWS');
      expect(query).toContain('RETURN');
    });
  });
});
