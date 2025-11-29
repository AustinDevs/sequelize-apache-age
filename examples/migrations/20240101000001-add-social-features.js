'use strict';

/**
 * Migration: add-social-features
 * Example migration showing how to add social features to the graph
 */

module.exports = {
  /**
   * Run the migration
   * @param {MigrationManager} migrations - Migration manager instance
   * @returns {Migration} Migration instance
   */
  up: async (migrations) => {
    return migrations.create('20240101000001-add-social-features')
      // Create vertex labels
      .createVertexLabel('Post')
      .createVertexLabel('Comment')
      .createVertexLabel('Like')

      // Create edge labels for social interactions
      .createEdgeLabel('POSTED')       // User -> Post
      .createEdgeLabel('COMMENTED_ON') // User -> Post
      .createEdgeLabel('REPLIED_TO')   // Comment -> Comment
      .createEdgeLabel('LIKED')        // User -> Post or User -> Comment
      .createEdgeLabel('FOLLOWS')      // User -> User
      .createEdgeLabel('TAGGED_IN')    // User -> Post

      // Add timestamps to existing users
      .rawCypher(
        `MATCH (u:User)
         WHERE u.created_at IS NULL
         SET u.created_at = timestamp(),
             u.updated_at = timestamp()
         RETURN count(u) as updated`,
        // Rollback: remove timestamps
        `MATCH (u:User)
         REMOVE u.created_at, u.updated_at
         RETURN count(u) as reverted`
      )

      // Create sample data for testing (optional)
      .rawCypher(
        `// Create a sample post
         MATCH (u:User {name: 'admin'})
         CREATE (p:Post {
           title: 'Welcome to the platform!',
           content: 'This is the first post.',
           created_at: timestamp()
         })
         CREATE (u)-[:POSTED]->(p)
         RETURN p`,
        // Cleanup sample data
        `MATCH (p:Post {title: 'Welcome to the platform!'})
         DETACH DELETE p`
      );
  },

  down: async (migration) => {
    // Automatic rollback from up() operations
  }
};
