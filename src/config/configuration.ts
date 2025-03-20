export default () => ({
  database: {
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT
      ? parseInt(process.env.DATABASE_PORT, 10)
      : 3306,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    type: process.env.DATABASE_TYPE || 'mysql',
    name: process.env.DATABASE_NAME,
  },
  jwt_secret: process.env.JWT_KEY,
});
