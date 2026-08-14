/**
 * Environment Variable Validator
 * Purpose: Inspects and validates environment configuration at startup.
 * Fails fast if required secrets are missing, and logs clear warnings for optional settings.
 * Never prints secret values to console logs.
 */

const validateEnv = () => {
  console.log('🔍 Validating System Environment Variables...');

  const required = [
    { name: 'MONGO_URI', description: 'MongoDB connection URI' },
    { name: 'GROQ_API_KEY', description: 'Groq LPU Llama 3 API Key' }
  ];

  const optional = [
    { name: 'PORT', description: 'HTTP Server Port (default: 5000)' },
    { name: 'GROQ_MODEL', description: 'Groq Model Name (default: llama-3.3-70b-versatile)' },
    { name: 'SOCIAL_WEBHOOK_URL', description: 'Make.com / Social Webhook Endpoint' },
    { name: 'AUTO_BROADCAST', description: 'Auto Social Broadcasting Flag (true/false)' }
  ];

  let missingRequired = [];

  // Check required variables
  for (const envVar of required) {
    const val = process.env[envVar.name];
    if (!val || typeof val !== 'string' || val.trim() === '') {
      missingRequired.push(envVar.name);
      console.error(`❌ CRITICAL: Required environment variable [${envVar.name}] is missing or empty! (${envVar.description})`);
    } else {
      console.log(`✅ Required variable configured: [${envVar.name}]`);
    }
  }

  // Check optional variables
  for (const envVar of optional) {
    const val = process.env[envVar.name];
    if (!val || typeof val !== 'string' || val.trim() === '') {
      console.warn(`⚠️ WARNING: Optional variable [${envVar.name}] is not set. (${envVar.description})`);
    } else {
      console.log(`✅ Optional variable configured: [${envVar.name}]`);
    }
  }

  if (missingRequired.length > 0) {
    const errorMsg = `FATAL: Startup aborted due to ${missingRequired.length} missing required environment variable(s): [${missingRequired.join(', ')}]`;
    console.error(`\n🚨 ${errorMsg}\n`);
    throw new Error(errorMsg);
  }

  console.log('✨ Environment validation completed successfully.\n');
  return { success: true };
};

module.exports = validateEnv;
