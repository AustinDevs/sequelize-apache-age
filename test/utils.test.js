/**
 * Tests for graph utilities
 */

const { GraphUtils } = require('../src/utils');

describe('GraphUtils', () => {
  describe('parseAGEResult', () => {
    test('should parse string results', () => {
      const results = ['{"id": 1}', '{"id": 2}'];
      const parsed = GraphUtils.parseAGEResult(results);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].id).toBe(1);
    });

    test('should handle non-array input', () => {
      const parsed = GraphUtils.parseAGEResult('not an array');
      expect(parsed).toEqual([]);
    });
  });

  describe('extractVertices', () => {
    test('should extract vertices from results', () => {
      const results = [
        { _type: 'vertex', id: 1, label: 'Person' },
        { _type: 'edge', id: 2 }
      ];
      const vertices = GraphUtils.extractVertices(results);
      expect(vertices).toHaveLength(1);
      expect(vertices[0]._type).toBe('vertex');
    });
  });

  describe('extractEdges', () => {
    test('should extract edges from results', () => {
      const results = [
        { _type: 'vertex', id: 1 },
        { _type: 'edge', id: 2, label: 'KNOWS' }
      ];
      const edges = GraphUtils.extractEdges(results);
      expect(edges).toHaveLength(1);
      expect(edges[0]._type).toBe('edge');
    });
  });

  describe('extractPaths', () => {
    test('should extract paths from results', () => {
      const results = [
        { _type: 'path', vertices: [], edges: [] },
        { _type: 'vertex', id: 1 }
      ];
      const paths = GraphUtils.extractPaths(results);
      expect(paths).toHaveLength(1);
      expect(paths[0]._type).toBe('path');
    });
  });

  describe('Validation functions', () => {
    test('should validate graph names', () => {
      expect(GraphUtils.isValidGraphName('my_graph')).toBe(true);
      expect(GraphUtils.isValidGraphName('graph123')).toBe(true);
      expect(GraphUtils.isValidGraphName('123graph')).toBe(false);
      expect(GraphUtils.isValidGraphName('my-graph')).toBe(false);
    });

    test('should validate label names', () => {
      expect(GraphUtils.isValidLabel('Person')).toBe(true);
      expect(GraphUtils.isValidLabel('My_Label')).toBe(true);
      expect(GraphUtils.isValidLabel('123Label')).toBe(false);
      expect(GraphUtils.isValidLabel('Label-Name')).toBe(false);
    });
  });

  describe('buildAGEQuery', () => {
    test('should build AGE query wrapper', () => {
      const cypherQuery = 'MATCH (n) RETURN n';
      const ageQuery = GraphUtils.buildAGEQuery('my_graph', cypherQuery);
      
      expect(ageQuery).toContain('ag_catalog.cypher');
      expect(ageQuery).toContain('my_graph');
      expect(ageQuery).toContain('MATCH (n) RETURN n');
    });

    test('should escape single quotes in query', () => {
      const cypherQuery = "MATCH (n {name: 'John'}) RETURN n";
      const ageQuery = GraphUtils.buildAGEQuery('my_graph', cypherQuery);
      
      expect(ageQuery).toContain("''");
    });
  });

  describe('Properties conversion', () => {
    test('should convert object to AGE properties', () => {
      const props = { name: 'John', age: 30 };
      const ageProps = GraphUtils.toAGEProperties(props);
      
      expect(ageProps).toContain('name:');
      expect(ageProps).toContain('age:');
      expect(ageProps).toContain('{');
      expect(ageProps).toContain('}');
    });

    test('should handle empty properties', () => {
      const ageProps = GraphUtils.toAGEProperties({});
      expect(ageProps).toBe('{}');
    });

    test('should parse AGE properties to object', () => {
      const json = '{"name":"John","age":30}';
      const parsed = GraphUtils.fromAGEProperties(json);
      
      expect(parsed.name).toBe('John');
      expect(parsed.age).toBe(30);
    });
  });

  describe('generateVariableName', () => {
    test('should generate unique variable names', () => {
      const var1 = GraphUtils.generateVariableName('test');
      const var2 = GraphUtils.generateVariableName('test');
      
      expect(var1).toContain('test_');
      expect(var2).toContain('test_');
      expect(var1).not.toBe(var2);
    });
  });
});
