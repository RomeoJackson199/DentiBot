/**
 * Environment variable validation and type-safe access
 * This module ensures all required environment variables are present at startup
 */

interface EnvVariables {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  VITE_GEMINI_API_KEY?: string; // Optional - fallback to rule-based if not present
  VITE_ENABLE_PERFORMANCE_MONITORING?: string;
}

/**
 * Required environment variables that must be present
 */
const REQUIRED_ENV_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
] as const;

/**
 * Optional environment variables
 */
const OPTIONAL_ENV_VARS = [
  'VITE_GEMINI_API_KEY',
  'VITE_ENABLE_PERFORMANCE_MONITORING',
] as const;

/**
 * Validates that all required environment variables are present
 * @throws Error if any required variables are missing
 */
export function validateEnv(): void {
  const missing = REQUIRED_ENV_VARS.filter(
    (key) => !import.meta.env[key] || import.meta.env[key] === ''
  );

  if (missing.length > 0) {
    const errorMessage = [
      '❌ Missing required environment variables:',
      ...missing.map((key) => `   - ${key}`),
      '',
      'Please ensure your .env file contains all required variables.',
      'See .env.example for reference.',
    ].join('\n');

    throw new Error(errorMessage);
  }

  // Validate format of specific variables
  validateSupabaseUrl(import.meta.env.VITE_SUPABASE_URL);

  // Log optional variables status (development only)
  if (import.meta.env.DEV) {
    const optionalStatus = OPTIONAL_ENV_VARS.map((key) => {
      const value = import.meta.env[key];
      return `   ${value ? '✅' : '⚠️ '} ${key}`;
    });

    console.log('Environment Variables Status:');
    console.log('Required:');
    REQUIRED_ENV_VARS.forEach((key) => {
      console.log(`   ✅ ${key}`);
    });
    console.log('Optional:');
    optionalStatus.forEach((status) => console.log(status));
  }
}

/**
 * Validates Supabase URL format
 */
function validateSupabaseUrl(url: string): void {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes('supabase')) {
      console.warn(
        '⚠️  VITE_SUPABASE_URL does not appear to be a Supabase URL. Please verify.'
      );
    }
  } catch (error) {
    throw new Error(
      `Invalid VITE_SUPABASE_URL format: "${url}". Must be a valid URL.`
    );
  }
}

/**
 * Type-safe getter for environment variables
 */
export function getEnv<K extends keyof EnvVariables>(
  key: K
): EnvVariables[K] | undefined {
  return import.meta.env[key] as EnvVariables[K];
}

/**
 * Type-safe getter for environment variables with a default value
 */
export function getEnvOrDefault<K extends keyof EnvVariables>(
  key: K,
  defaultValue: NonNullable<EnvVariables[K]>
): NonNullable<EnvVariables[K]> {
  const value = import.meta.env[key];
  return (value as NonNullable<EnvVariables[K]>) || defaultValue;
}

/**
 * Check if we're in development mode
 */
export function isDevelopment(): boolean {
  return import.meta.env.DEV;
}

/**
 * Check if we're in production mode
 */
export function isProduction(): boolean {
  return import.meta.env.PROD;
}

/**
 * Check if performance monitoring is enabled
 */
export function isPerformanceMonitoringEnabled(): boolean {
  const value = import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING;
  return value === 'true' || value === '1';
}

/**
 * Get Supabase configuration
 */
export function getSupabaseConfig() {
  return {
    url: import.meta.env.VITE_SUPABASE_URL as string,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  };
}

/**
 * Check if Gemini AI is configured
 */
export function hasGeminiConfig(): boolean {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  return Boolean(apiKey && apiKey !== '');
}

/**
 * Get Gemini API key (throws if not configured)
 */
export function getGeminiApiKey(): string {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'VITE_GEMINI_API_KEY is not configured. AI features will use fallback logic.'
    );
  }
  return apiKey;
}
