'use strict';

const { GraphUtils, CypherFunctions } = require('sequelize-apache-age');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create vertex labels for social features
    await queryInterface.sequelize.query(
      "SELECT * FROM ag_catalog.create_vlabel('my_graph', 'Post');"
    );

    await queryInterface.sequelize.query(
      "SELECT * FROM ag_catalog.create_vlabel('my_graph', 'Comment');"
    );

    // Create edge labels for interactions
    await queryInterface.sequelize.query(
      "SELECT * FROM ag_catalog.create_elabel('my_graph', 'POSTED');"
    );

    await queryInterface.sequelize.query(
      "SELECT * FROM ag_catalog.create_elabel('my_graph', 'COMMENTED_ON');"
    );

    await queryInterface.sequelize.query(
      "SELECT * FROM ag_catalog.create_elabel('my_graph', 'FOLLOWS');"
    );

    await queryInterface.sequelize.query(
      "SELECT * FROM ag_catalog.create_elabel('my_graph', 'LIKED');"
    );

    // Add timestamps to existing users using Cypher
    const addTimestampsQuery = GraphUtils.buildAGEQuery(
      'my_graph',
      `MATCH (u:User)
       WHERE u.created_at IS NULL
       SET u.created_at = timestamp(),
           u.updated_at = timestamp()
       RETURN count(u) as updated`
    );
    await queryInterface.sequelize.query(addTimestampsQuery);

    // Create sample posts
    const createSamplePosts = GraphUtils.buildAGEQuery(
      'my_graph',
      `MATCH (u:User {name: 'admin'})
       CREATE (p1:Post {
         title: 'Welcome to the platform!',
         content: 'This is our first post.',
         created_at: timestamp()
       })
       CREATE (p2:Post {
         title: 'Getting Started Guide',
         content: 'Here is how to get started...',
         created_at: timestamp()
       })
       CREATE (u)-[:POSTED]->(p1)
       CREATE (u)-[:POSTED]->(p2)
       RETURN p1, p2`
    );
    await queryInterface.sequelize.query(createSamplePosts);
  },

  async down(queryInterface, Sequelize) {
    // Remove timestamps from users
    const removeTimestamps = GraphUtils.buildAGEQuery(
      'my_graph',
      'MATCH (u:User) REMOVE u.created_at, u.updated_at RETURN count(u)'
    );
    await queryInterface.sequelize.query(removeTimestamps);

    // Delete all posts and comments (DETACH DELETE removes relationships too)
    const deletePosts = GraphUtils.buildAGEQuery(
      'my_graph',
      'MATCH (p:Post) DETACH DELETE p'
    );
    await queryInterface.sequelize.query(deletePosts);

    const deleteComments = GraphUtils.buildAGEQuery(
      'my_graph',
      'MATCH (c:Comment) DETACH DELETE c'
    );
    await queryInterface.sequelize.query(deleteComments);

    // Drop edge labels
    await queryInterface.sequelize.query(
      "SELECT * FROM ag_catalog.drop_elabel('my_graph', 'LIKED', true);"
    );
    await queryInterface.sequelize.query(
      "SELECT * FROM ag_catalog.drop_elabel('my_graph', 'FOLLOWS', true);"
    );
    await queryInterface.sequelize.query(
      "SELECT * FROM ag_catalog.drop_elabel('my_graph', 'COMMENTED_ON', true);"
    );
    await queryInterface.sequelize.query(
      "SELECT * FROM ag_catalog.drop_elabel('my_graph', 'POSTED', true);"
    );

    // Drop vertex labels
    await queryInterface.sequelize.query(
      "SELECT * FROM ag_catalog.drop_vlabel('my_graph', 'Comment', true);"
    );
    await queryInterface.sequelize.query(
      "SELECT * FROM ag_catalog.drop_vlabel('my_graph', 'Post', true);"
    );
  }
};
