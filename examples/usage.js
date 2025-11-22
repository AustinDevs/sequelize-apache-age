/**
 * Example usage of sequelize-apache-age plugin
 * 
 * This example demonstrates how to use the plugin with Sequelize
 * to work with Apache AGE graph database
 */

// Optional: Only required if you want to test database connection
// const { Sequelize } = require('sequelize');
const { 
  initApacheAGE, 
  DataTypes, 
  CypherFunctions,
  Relationships 
} = require('../lib');

// Example 1: Initialize the plugin
async function example1_initialization() {
  console.log('Note: This example requires Sequelize and database connection');
  console.log('To use: npm install sequelize pg');
  
  // Uncomment when Sequelize is available:
  // const { Sequelize } = require('sequelize');
  // const sequelize = new Sequelize('postgres://user:pass@localhost:5432/mydb');
  // const age = initApacheAGE(sequelize, {
  //   graphName: 'social_network',
  //   autoCreateGraph: true
  // });
  // console.log('Apache AGE plugin initialized');
  // return { sequelize, age };
  
  return null;
}

// Example 2: Using Data Types
async function example2_dataTypes() {
  console.log('Creating graph objects with AGE data types:');

  // Create a vertex
  const person = DataTypes.VERTEX.create('Person', {
    name: 'John Doe',
    age: 30,
    email: 'john@example.com'
  });
  console.log('Person vertex:', person);

  // Create an edge
  const knows = DataTypes.EDGE.create('KNOWS', 1, 2, {
    since: 2020,
    closeness: 0.8
  });
  console.log('KNOWS edge:', knows);

  // Create a path
  const path = DataTypes.PATH.create(
    [{ id: 1 }, { id: 2 }, { id: 3 }],
    [{ id: 1, start: 1, end: 2 }, { id: 2, start: 2, end: 3 }]
  );
  console.log('Path:', path);
}

// Example 3: Building Cypher queries
async function example3_cypherQueries() {
  console.log('Building Cypher queries:');

  // Simple MATCH query
  const query1 = CypherFunctions.queryBuilder()
    .match('(p:Person)')
    .where('p.age > 25')
    .return('p')
    .build();
  console.log('Query 1:', query1);

  // CREATE query
  const query2 = CypherFunctions.queryBuilder()
    .create('(p:Person {name: "Jane", age: 28})')
    .return('p')
    .build();
  console.log('Query 2:', query2);

  // Complex query with relationships
  const query3 = CypherFunctions.queryBuilder()
    .match('(p1:Person)-[r:KNOWS]->(p2:Person)')
    .where('p1.name = "John"')
    .return('p1, r, p2')
    .build();
  console.log('Query 3:', query3);

  // Query with pagination
  const query4 = CypherFunctions.queryBuilder()
    .match('(p:Person)')
    .return('p')
    .orderBy('p.name')
    .skip(10)
    .limit(5)
    .build();
  console.log('Query 4:', query4);
}

// Example 4: Using helper functions
async function example4_helperFunctions() {
  console.log('Using Cypher helper functions:');

  // Build vertex pattern
  const personPattern = CypherFunctions.vertex('p', 'Person', { name: 'John' });
  console.log('Person pattern:', personPattern);

  // Build edge pattern
  const knowsPattern = CypherFunctions.edge('r', 'KNOWS');
  console.log('KNOWS pattern:', knowsPattern);

  // Build complete path pattern
  const pathPattern = CypherFunctions.path(
    CypherFunctions.vertex('p1', 'Person'),
    CypherFunctions.edge('r', 'KNOWS'),
    CypherFunctions.vertex('p2', 'Person')
  );
  console.log('Path pattern:', pathPattern);
}

// Example 5: Working with relationships
async function example5_relationships() {
  console.log('Working with relationships:');

  // Define relationship types
  const knows = Relationships.define('KNOWS', { direction: 'outgoing' });
  const worksAt = Relationships.define('WORKS_AT', { direction: 'outgoing' });

  // Use relationship patterns
  const oneToMany = Relationships.patterns.oneToMany('HAS_CHILD');
  const manyToMany = Relationships.patterns.manyToMany('COLLABORATES_WITH');

  console.log('KNOWS pattern:', knows.toCypherPattern('p1', 'p2', 'r'));
  console.log('WORKS_AT pattern:', worksAt.toCypherPattern('p', 'c', 'r'));

  // Build relationship query
  const query = Relationships.buildQuery('Person', 'KNOWS', 'Person', {
    fromVar: 'p1',
    toVar: 'p2',
    relVar: 'knows'
  });
  console.log('Relationship query:', query);
}

// Example 6: Complete workflow
async function example6_completeWorkflow() {
  console.log('Complete workflow example (query building only):');

  // Build a query to create nodes and relationships
  const createQuery = CypherFunctions.queryBuilder()
    .create('(john:Person {name: "John", age: 30})')
    .create('(jane:Person {name: "Jane", age: 28})')
    .create('(john)-[:KNOWS {since: 2020}]->(jane)')
    .return('john, jane')
    .build();

  console.log('Create query:', createQuery);

  // Build a query to find relationships
  const findQuery = CypherFunctions.queryBuilder()
    .match('(p1:Person)-[r:KNOWS]->(p2:Person)')
    .where('p1.name = "John"')
    .return('p1.name as from, p2.name as to, r.since as since')
    .build();

  console.log('Find query:', findQuery);

  console.log('\nNote: To execute queries, initialize with Sequelize instance');
  // In a real application with database connection:
  // const { sequelize, age } = await example1_initialization();
  // const results = await age.executeCypher(findQuery);
}

// Run examples
if (require.main === module) {
  (async () => {
    console.log('=== Sequelize Apache AGE Examples ===\n');
    
    console.log('--- Example 1: Initialization ---');
    // await example1_initialization(); // Requires database connection
    
    console.log('\n--- Example 2: Data Types ---');
    await example2_dataTypes();
    
    console.log('\n--- Example 3: Cypher Queries ---');
    await example3_cypherQueries();
    
    console.log('\n--- Example 4: Helper Functions ---');
    await example4_helperFunctions();
    
    console.log('\n--- Example 5: Relationships ---');
    await example5_relationships();
    
    console.log('\n--- Example 6: Complete Workflow ---');
    await example6_completeWorkflow();
    
    console.log('\n=== Examples completed ===');
  })();
}

module.exports = {
  example1_initialization,
  example2_dataTypes,
  example3_cypherQueries,
  example4_helperFunctions,
  example5_relationships,
  example6_completeWorkflow
};
