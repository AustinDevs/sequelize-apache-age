/**
 * Tests for Cypher functions and query builder
 */

const { CypherFunctions, CypherQueryBuilder } = require('../src/functions');

describe('Cypher Functions', () => {
  describe('CypherQueryBuilder', () => {
    test('should build simple MATCH query', () => {
      const query = new CypherQueryBuilder()
        .match('(n:Person)')
        .return('n')
        .build();
      
      expect(query).toBe('MATCH (n:Person) RETURN n');
    });

    test('should build CREATE query', () => {
      const query = new CypherQueryBuilder()
        .create('(n:Person {name: "John"})')
        .return('n')
        .build();
      
      expect(query).toBe('CREATE (n:Person {name: "John"}) RETURN n');
    });

    test('should build query with WHERE clause', () => {
      const query = new CypherQueryBuilder()
        .match('(n:Person)')
        .where('n.age > 25')
        .return('n')
        .build();
      
      expect(query).toBe('MATCH (n:Person) WHERE n.age > 25 RETURN n');
    });

    test('should build query with multiple clauses', () => {
      const query = new CypherQueryBuilder()
        .match('(n:Person)')
        .where('n.age > 25')
        .return('n')
        .orderBy('n.name')
        .limit(10)
        .build();
      
      expect(query).toBe('MATCH (n:Person) WHERE n.age > 25 RETURN n ORDER BY n.name LIMIT 10');
    });

    test('should support method chaining', () => {
      const builder = new CypherQueryBuilder();
      const result = builder.match('(n)');
      expect(result).toBe(builder);
    });
  });

  describe('Helper functions', () => {
    test('should escape string values', () => {
      const escaped = CypherFunctions.escapeString("It's a test");
      expect(escaped).toBe("'It\\'s a test'");
    });

    test('should format properties', () => {
      const formatted = CypherFunctions.formatProperties({ name: 'John', age: 30 });
      expect(formatted).toBe('{name: "John", age: 30}');
    });

    test('should build vertex pattern', () => {
      const pattern = CypherFunctions.vertex('n', 'Person');
      expect(pattern).toBe('(n:Person)');
    });

    test('should build vertex pattern with properties', () => {
      const pattern = CypherFunctions.vertex('n', 'Person', { name: 'John' });
      expect(pattern).toContain('(n:Person');
      expect(pattern).toContain('name');
    });

    test('should build edge pattern', () => {
      const pattern = CypherFunctions.edge('r', 'KNOWS');
      expect(pattern).toBe('-[r:KNOWS]->');
    });

    test('should build edge pattern with direction', () => {
      const leftPattern = CypherFunctions.edge('r', 'KNOWS', null, 'left');
      expect(leftPattern).toBe('<-[r:KNOWS]-');

      const bothPattern = CypherFunctions.edge('r', 'KNOWS', null, 'both');
      expect(bothPattern).toBe('-[r:KNOWS]-');
    });
  });

  describe('queryBuilder factory', () => {
    test('should create new query builder instance', () => {
      const builder = CypherFunctions.queryBuilder();
      expect(builder).toBeInstanceOf(CypherQueryBuilder);
    });
  });
});
