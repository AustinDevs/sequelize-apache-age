'use strict';

const { GraphUtils } = require('sequelize-apache-age');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Initialize Apache AGE extension
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS age;');
    await queryInterface.sequelize.query("LOAD 'age';");
    await queryInterface.sequelize.query("SET search_path = ag_catalog, '$user', public;");

    // Create a graph
    await queryInterface.sequelize.query("SELECT create_graph('my_graph');");

    // Create vertex labels
    const createUserLabel = "SELECT * FROM ag_catalog.create_vlabel('my_graph', 'User');";
    await queryInterface.sequelize.query(createUserLabel);

    const createProfileLabel = "SELECT * FROM ag_catalog.create_vlabel('my_graph', 'Profile');";
    await queryInterface.sequelize.query(createProfileLabel);

    // Create edge labels
    const createHasProfileEdge = "SELECT * FROM ag_catalog.create_elabel('my_graph', 'HAS_PROFILE');";
    await queryInterface.sequelize.query(createHasProfileEdge);

    // Create initial data using Cypher
    const createAdminQuery = GraphUtils.buildAGEQuery(
      'my_graph',
      `CREATE (u:User {name: 'admin', email: 'admin@example.com', created_at: timestamp()})
       CREATE (p:Profile {bio: 'System Administrator'})
       CREATE (u)-[:HAS_PROFILE]->(p)
       RETURN u, p`
    );
    await queryInterface.sequelize.query(createAdminQuery);
  },

  async down(queryInterface, Sequelize) {
    // Drop the graph (cascades to all labels and data)
    await queryInterface.sequelize.query("SELECT drop_graph('my_graph', true);");

    // Optionally drop the extension
    // await queryInterface.sequelize.query('DROP EXTENSION IF EXISTS age;');
  }
};
