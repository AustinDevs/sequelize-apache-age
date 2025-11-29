'use strict';

const { GraphUtils, CypherFunctions } = require('sequelize-apache-age');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Example: Normalize email addresses to lowercase
    const normalizeEmails = GraphUtils.buildAGEQuery(
      'my_graph',
      `MATCH (u:User)
       WHERE u.email IS NOT NULL
       SET u.email = toLower(u.email),
           u.updated_at = timestamp()
       RETURN count(u) as normalized`
    );
    await queryInterface.sequelize.query(normalizeEmails);

    // Example: Create username from email if missing
    const createUsernames = GraphUtils.buildAGEQuery(
      'my_graph',
      `MATCH (u:User)
       WHERE u.username IS NULL AND u.email IS NOT NULL
       SET u.username = split(u.email, '@')[0]
       RETURN count(u) as updated`
    );
    await queryInterface.sequelize.query(createUsernames);

    // Example: Create default profile for users without one
    const createDefaultProfiles = GraphUtils.buildAGEQuery(
      'my_graph',
      `MATCH (u:User)
       WHERE NOT EXISTS((u)-[:HAS_PROFILE]->(:Profile))
       CREATE (p:Profile {
         bio: 'No bio yet',
         created_at: timestamp()
       })
       CREATE (u)-[:HAS_PROFILE]->(p)
       RETURN count(p) as created`
    );
    await queryInterface.sequelize.query(createDefaultProfiles);

    // Example: Add indexes on commonly queried properties (using raw SQL)
    // Note: AGE stores properties as JSONB, so we create indexes on the properties column
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_user_email
      ON my_graph."User" ((properties->>'email'));
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_user_username
      ON my_graph."User" ((properties->>'username'));
    `);
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS idx_user_username;');
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS idx_user_email;');

    // Revert username creation (set to null where it was auto-generated)
    const revertUsernames = GraphUtils.buildAGEQuery(
      'my_graph',
      `MATCH (u:User)
       WHERE u.username IS NOT NULL
       SET u.username = null
       RETURN count(u)`
    );
    await queryInterface.sequelize.query(revertUsernames);

    // Note: Email normalization is generally not reversible
    // If you need to preserve original emails, store them in a separate field first
  }
};
