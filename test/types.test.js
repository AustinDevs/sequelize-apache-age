/**
 * Tests for Apache AGE data types
 */

const { DataTypes, VERTEX, EDGE, PATH, AGTYPE } = require('../src/types');

describe('Apache AGE Data Types', () => {
  describe('VERTEX', () => {
    test('should create vertex instance', () => {
      const vertex = new VERTEX();
      expect(vertex.type).toBe('VERTEX');
    });

    test('should return correct SQL type', () => {
      const vertex = new VERTEX();
      expect(vertex.toSql()).toBe('ag_catalog.agtype');
    });

    test('should create vertex object', () => {
      const vertex = VERTEX.create('Person', { name: 'John', age: 30 });
      expect(vertex.label).toBe('Person');
      expect(vertex.properties.name).toBe('John');
      expect(vertex.properties.age).toBe(30);
      expect(vertex._type).toBe('vertex');
    });

    test('should parse vertex from string', () => {
      const json = '{"label":"Person","properties":{"name":"John"}}';
      const parsed = VERTEX.parse(json);
      expect(parsed.label).toBe('Person');
      expect(parsed.properties.name).toBe('John');
    });
  });

  describe('EDGE', () => {
    test('should create edge instance', () => {
      const edge = new EDGE();
      expect(edge.type).toBe('EDGE');
    });

    test('should return correct SQL type', () => {
      const edge = new EDGE();
      expect(edge.toSql()).toBe('ag_catalog.agtype');
    });

    test('should create edge object', () => {
      const edge = EDGE.create('KNOWS', 1, 2, { since: 2020 });
      expect(edge.label).toBe('KNOWS');
      expect(edge.start_id).toBe(1);
      expect(edge.end_id).toBe(2);
      expect(edge.properties.since).toBe(2020);
      expect(edge._type).toBe('edge');
    });
  });

  describe('PATH', () => {
    test('should create path instance', () => {
      const path = new PATH();
      expect(path.type).toBe('PATH');
    });

    test('should return correct SQL type', () => {
      const path = new PATH();
      expect(path.toSql()).toBe('ag_catalog.agtype');
    });

    test('should create path object', () => {
      const vertices = [{ id: 1 }, { id: 2 }];
      const edges = [{ id: 1, start: 1, end: 2 }];
      const path = PATH.create(vertices, edges);
      expect(path.vertices).toEqual(vertices);
      expect(path.edges).toEqual(edges);
      expect(path._type).toBe('path');
    });
  });

  describe('AGTYPE', () => {
    test('should create agtype instance', () => {
      const agtype = new AGTYPE();
      expect(agtype.type).toBe('AGTYPE');
    });

    test('should return correct SQL type', () => {
      const agtype = new AGTYPE();
      expect(agtype.toSql()).toBe('ag_catalog.agtype');
    });

    test('should parse JSON string', () => {
      const json = '{"key":"value"}';
      const parsed = AGTYPE.parse(json);
      expect(parsed.key).toBe('value');
    });

    test('should stringify object', () => {
      const obj = { key: 'value' };
      const stringified = AGTYPE.stringify(obj);
      expect(stringified).toBe('{"key":"value"}');
    });
  });
});
