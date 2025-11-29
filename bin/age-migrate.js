#!/usr/bin/env node

/**
 * Apache AGE Migration CLI
 * Command-line interface for managing graph migrations
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const command = process.argv[2];
const args = process.argv.slice(3);

// Configuration
const CONFIG_FILE = 'age-config.js';
const MIGRATIONS_DIR = 'migrations';
const TEMPLATE_DIR = path.join(__dirname, '../templates');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  log(`Error: ${message}`, 'red');
  process.exit(1);
}

function success(message) {
  log(message, 'green');
}

function info(message) {
  log(message, 'cyan');
}

// Load configuration
function loadConfig() {
  const configPath = path.join(process.cwd(), CONFIG_FILE);

  if (!fs.existsSync(configPath)) {
    error(`Configuration file not found: ${CONFIG_FILE}\nRun 'age-migrate init' to create one.`);
  }

  try {
    return require(configPath);
  } catch (err) {
    error(`Failed to load configuration: ${err.message}`);
  }
}

// Get Sequelize instance from config
async function getSequelize(config) {
  const { Sequelize } = require('sequelize');

  const sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    {
      host: config.host || 'localhost',
      port: config.port || 5432,
      dialect: 'postgres',
      logging: config.logging || false,
      ...config.options
    }
  );

  return sequelize;
}

// Initialize migration system
async function init() {
  const configPath = path.join(process.cwd(), CONFIG_FILE);
  const migrationsPath = path.join(process.cwd(), MIGRATIONS_DIR);

  // Create config file
  if (!fs.existsSync(configPath)) {
    const configTemplate = `module.exports = {
  // Database connection
  database: process.env.DB_NAME || 'mydb',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,

  // Graph configuration
  graphName: process.env.GRAPH_NAME || 'my_graph',

  // Sequelize options
  options: {
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
};
`;

    fs.writeFileSync(configPath, configTemplate);
    success(`Created ${CONFIG_FILE}`);
  } else {
    info(`${CONFIG_FILE} already exists`);
  }

  // Create migrations directory
  if (!fs.existsSync(migrationsPath)) {
    fs.mkdirSync(migrationsPath, { recursive: true });
    success(`Created ${MIGRATIONS_DIR}/ directory`);
  } else {
    info(`${MIGRATIONS_DIR}/ directory already exists`);
  }

  success('\nMigration system initialized!');
  info('\nNext steps:');
  info('1. Update age-config.js with your database credentials');
  info('2. Generate a migration: age-migrate generate --name create-users');
  info('3. Edit the migration file in migrations/');
  info('4. Run migrations: age-migrate up');
}

// Generate migration file
function generate() {
  const nameArg = args.find((arg, i) => args[i - 1] === '--name' || args[i - 1] === '-n');

  if (!nameArg) {
    error('Migration name is required. Use: age-migrate generate --name <migration-name>');
  }

  const migrationsPath = path.join(process.cwd(), MIGRATIONS_DIR);

  if (!fs.existsSync(migrationsPath)) {
    error(`Migrations directory not found. Run 'age-migrate init' first.`);
  }

  // Generate timestamp
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '');
  const filename = `${timestamp}-${nameArg}.js`;
  const filepath = path.join(migrationsPath, filename);

  const template = `'use strict';

/**
 * Migration: ${nameArg}
 * Created: ${new Date().toISOString()}
 */

module.exports = {
  /**
   * Run the migration
   * @param {MigrationManager} migrations - Migration manager instance
   * @returns {Migration} Migration instance
   */
  up: async (migrations) => {
    return migrations.create('${timestamp}-${nameArg}')
      // Add your migration operations here
      // Examples:
      // .createVertexLabel('User')
      // .createEdgeLabel('FOLLOWS')
      // .rawCypher('CREATE (n:Node) RETURN n', 'MATCH (n:Node) DELETE n')
      ;
  },

  /**
   * Revert the migration
   * Note: The down operation is handled automatically by the migration system
   * based on the operations defined in up()
   */
  down: async (migration) => {
    // Down operations are automatically generated from up() operations
    // You can add custom cleanup here if needed
  }
};
`;

  fs.writeFileSync(filepath, template);
  success(`Created migration: ${filename}`);
  info(`\nEdit the migration file at: ${filepath}`);
}

// Run pending migrations
async function up() {
  const config = loadConfig();
  const sequelize = await getSequelize(config);
  const { initApacheAGE } = require('../lib/index.js');

  try {
    info('Connecting to database...');
    await sequelize.authenticate();
    success('Connected to database');

    const age = initApacheAGE(sequelize, {
      graphName: config.graphName
    });

    // Load migration files
    const migrationsPath = path.join(process.cwd(), MIGRATIONS_DIR);

    if (!fs.existsSync(migrationsPath)) {
      error('Migrations directory not found. Run "age-migrate init" first.');
    }

    const files = fs.readdirSync(migrationsPath)
      .filter(f => f.endsWith('.js'))
      .sort();

    if (files.length === 0) {
      info('No migration files found.');
      await sequelize.close();
      return;
    }

    info(`Found ${files.length} migration file(s)\n`);

    // Get current migration status
    const status = await age.migrations.status();
    const executedNames = new Set(status.filter(s => s.executed).map(s => s.name));

    let executedCount = 0;

    // Execute pending migrations
    for (const file of files) {
      const migrationModule = require(path.join(migrationsPath, file));
      const migrationName = file.replace('.js', '');

      if (executedNames.has(migrationName)) {
        info(`⊘ ${file} (already executed)`);
        continue;
      }

      try {
        info(`→ Running ${file}...`);
        const migration = await migrationModule.up(age.migrations);
        await migration.up();
        success(`✓ ${file}`);
        executedCount++;
      } catch (err) {
        error(`Failed to execute ${file}: ${err.message}\n${err.stack}`);
      }
    }

    if (executedCount === 0) {
      success('\n✓ All migrations are up to date');
    } else {
      success(`\n✓ Successfully executed ${executedCount} migration(s)`);
    }

    await sequelize.close();
  } catch (err) {
    error(`Migration failed: ${err.message}\n${err.stack}`);
  }
}

// Rollback last migration
async function down() {
  const config = loadConfig();
  const sequelize = await getSequelize(config);
  const { initApacheAGE } = require('../lib/index.js');

  try {
    info('Connecting to database...');
    await sequelize.authenticate();
    success('Connected to database');

    const age = initApacheAGE(sequelize, {
      graphName: config.graphName
    });

    info('Rolling back last migration...');
    const rolledBack = await age.migrations.rollback();

    if (rolledBack) {
      success(`✓ Rolled back: ${rolledBack}`);
    } else {
      info('No migrations to rollback');
    }

    await sequelize.close();
  } catch (err) {
    error(`Rollback failed: ${err.message}\n${err.stack}`);
  }
}

// Show migration status
async function status() {
  const config = loadConfig();
  const sequelize = await getSequelize(config);
  const { initApacheAGE } = require('../lib/index.js');

  try {
    await sequelize.authenticate();

    const age = initApacheAGE(sequelize, {
      graphName: config.graphName
    });

    const migrationStatus = await age.migrations.status();

    info(`\nMigration Status (Graph: ${config.graphName})\n`);
    info('─'.repeat(60));

    if (migrationStatus.length === 0) {
      info('No migrations found');
    } else {
      migrationStatus.forEach(({ name, executed }) => {
        const status = executed ? '✓ up  ' : '✗ down';
        const color = executed ? 'green' : 'yellow';
        log(`${status} ${name}`, color);
      });

      const executedCount = migrationStatus.filter(m => m.executed).length;
      const pendingCount = migrationStatus.length - executedCount;

      info('─'.repeat(60));
      info(`Total: ${migrationStatus.length} | Executed: ${executedCount} | Pending: ${pendingCount}`);
    }

    await sequelize.close();
  } catch (err) {
    error(`Failed to get status: ${err.message}`);
  }
}

// Show help
function showHelp() {
  console.log(`
${colors.cyan}Apache AGE Migration CLI${colors.reset}

Usage: age-migrate <command> [options]

Commands:
  ${colors.green}init${colors.reset}                    Initialize migration system
  ${colors.green}generate${colors.reset} --name <name>  Generate a new migration file
  ${colors.green}up${colors.reset}                      Run all pending migrations
  ${colors.green}down${colors.reset}                    Rollback the last migration
  ${colors.green}status${colors.reset}                  Show migration status
  ${colors.green}help${colors.reset}                    Show this help message

Examples:
  age-migrate init
  age-migrate generate --name create-users
  age-migrate up
  age-migrate down
  age-migrate status

Environment Variables:
  DB_NAME          Database name
  DB_USER          Database username
  DB_PASSWORD      Database password
  DB_HOST          Database host (default: localhost)
  DB_PORT          Database port (default: 5432)
  GRAPH_NAME       Graph name (default: my_graph)

Configuration:
  Edit age-config.js to customize database connection and graph settings.

For more information, visit:
  https://github.com/AustinDevs/sequelize-apache-age
`);
}

// Main CLI handler
async function main() {
  switch (command) {
    case 'init':
      await init();
      break;
    case 'generate':
    case 'g':
      generate();
      break;
    case 'up':
    case 'migrate':
      await up();
      break;
    case 'down':
    case 'rollback':
      await down();
      break;
    case 'status':
      await status();
      break;
    case 'help':
    case '--help':
    case '-h':
    case undefined:
      showHelp();
      break;
    default:
      error(`Unknown command: ${command}\n\nRun 'age-migrate help' for usage information.`);
  }
}

// Run CLI
main().catch(err => {
  error(err.message);
});
