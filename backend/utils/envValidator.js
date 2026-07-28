export const validateEnv = () => {
  const requiredEnvVars = [
    'DB_HOST',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME',
    'JWT_SECRET'
  ];

  const missingVars = requiredEnvVars.filter((envVar) => {
    // DB_PASSWORD can be empty string in local setups, so we only check if it is explicitly undefined
    if (envVar === 'DB_PASSWORD') {
      return process.env[envVar] === undefined;
    }
    return !process.env[envVar];
  });

  if (missingVars.length > 0) {
    console.error(`\n❌ ERROR: Missing required environment variables:\n`);
    missingVars.forEach((envVar) => {
      console.error(`   - ${envVar}`);
    });
    console.error(`\nPlease ensure these variables are defined in your .env file.\n`);
    
    // Only exit if we are not in a test environment, to prevent breaking test suites
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
  }
};
