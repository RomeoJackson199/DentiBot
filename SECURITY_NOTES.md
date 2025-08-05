# Security Notes

## Known Vulnerabilities

### esbuild Vulnerability (GHSA-67mh-4wv8-2f99)
- **Status**: MITIGATED (Development only)
- **Severity**: Moderate
- **Description**: esbuild enables any website to send requests to the development server
- **Mitigation**: This vulnerability only affects development mode and is not present in production builds
- **Action**: Monitor for esbuild updates and upgrade when a fix becomes available

### Dependencies
- Vite: Updated to latest compatible version (5.4.19)
- All other dependencies: Updated to latest secure versions

## Security Fixes Applied

1. ✅ Removed debug migration that disabled RLS on medical data tables
2. ✅ Enhanced XSS protection in chart components with stricter CSS sanitization
3. ✅ Moved hardcoded credentials to environment variables in test files
4. ✅ Removed hardcoded localhost URLs from test files
5. ✅ Added security warnings to test files containing credentials

## Recommended Actions

1. Regularly run `npm audit` to check for new vulnerabilities
2. Keep dependencies updated
3. Never commit .env files with real credentials
4. Use the debug files only in development environments
5. Monitor esbuild security advisories for updates