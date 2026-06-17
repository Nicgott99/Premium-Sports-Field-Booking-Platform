const REQUIRED_ENV_VARS = [
  'MONGODB_URI',
  'JWT_SECRET',
  'NODE_ENV',
  'PORT',
];

const OPTIONAL_ENV_VARS = [
  'CLIENT_URL',
  'REDIS_URL',
  'FIREBASE_API_KEY',
  'STRIPE_SECRET_KEY',
  'EMAIL_USER',
  'EMAIL_PASS',
];

export const validateEnvironment = () => {
  const missing = REQUIRED_ENV_VARS.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    console.error(`\nRequired variables: ${REQUIRED_ENV_VARS.join(', ')}`);
    process.exit(1);
  }

  console.log('✅ All required environment variables validated');
  return true;
};

export const logEnvironmentStatus = () => {
  const configured = {
    required: REQUIRED_ENV_VARS.filter(key => !!process.env[key]),
    optional: OPTIONAL_ENV_VARS.filter(key => !!process.env[key]),
  };

  console.log(`📋 Environment Status:`);
  console.log(`   Required: ${configured.required.length}/${REQUIRED_ENV_VARS.length}`);
  console.log(`   Optional: ${configured.optional.length}/${OPTIONAL_ENV_VARS.length}`);
};
