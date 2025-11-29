'use strict';

/**
 * Migration: create-user-system
 * Example migration showing how to create a user system in a graph database
 */

module.exports = {
  /**
   * Run the migration
   * @param {MigrationManager} migrations - Migration manager instance
   * @returns {Migration} Migration instance
   */
  up: async (migrations) => {
    return migrations.create('20240101000000-create-user-system')
      // Create vertex labels for entities
      .createVertexLabel('User')
      .createVertexLabel('Profile')
      .createVertexLabel('Role')

      // Create edge labels for relationships
      .createEdgeLabel('HAS_PROFILE')
      .createEdgeLabel('HAS_ROLE')

      // Seed initial roles
      .rawCypher(
        `CREATE (r1:Role {name: 'admin', permissions: ['read', 'write', 'delete']})
         CREATE (r2:Role {name: 'user', permissions: ['read', 'write']})
         CREATE (r3:Role {name: 'guest', permissions: ['read']})
         RETURN r1, r2, r3`,
        // Rollback: delete seeded roles
        `MATCH (r:Role) WHERE r.name IN ['admin', 'user', 'guest'] DELETE r`
      );
  },

  /**
   * Revert the migration
   * Note: The down operation is handled automatically by the migration system
   */
  down: async (migration) => {
    // Down operations are automatically generated from up() operations
  }
};
