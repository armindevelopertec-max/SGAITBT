const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'sga_admin',
  password: process.env.DB_PASSWORD || 'sga_secret_2026',
  database: process.env.DB_NAME || 'sga_itbt',
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/database/migrations/*.js'],
  cli: {
    migrationsDir: 'src/database/migrations',
  },
};