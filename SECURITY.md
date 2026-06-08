# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in the Premium Sports Field Booking Platform, please use the GitHub Security Advisory ["Report a Vulnerability"](https://github.com/Nicgott99/Premium-Sports-Field-Booking-Platform/security/advisories/new) tab or email **security@sports-platform.com**.

Please include:
- Description of the vulnerability
- Steps to reproduce (if applicable)
- Potential impact
- Suggested fix (if any)

We will acknowledge your report within 48 hours and keep you informed of progress.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Security Features

### Authentication & Authorization
- JWT token-based authentication with 30-day expiration
- Refresh token rotation for enhanced security
- Two-factor authentication (2FA) support
- Role-based access control (RBAC)
- Account lockout after failed login attempts

### Data Protection
- Password hashing with bcryptjs (12 salt rounds)
- Data encryption at rest and in transit
- HTTPS/TLS enforcement in production
- Sensitive data sanitization
- No sensitive data in logs

### API Security
- Rate limiting to prevent abuse
- Input validation and sanitization
- CORS protection with whitelisted origins
- CSRF token protection
- SQL injection prevention via parameterized queries
- XSS protection with content security policies

### Infrastructure Security
- Helmet.js for HTTP header security
- CORS configuration with specific origins
- Environment variable protection
- Secure cookie configuration
- Request size limits

## Security Best Practices for Contributors

1. Never commit secrets or API keys
2. Use environment variables for sensitive data
3. Follow secure coding guidelines
4. Review security implications of changes
5. Run security checks before submitting PRs

## Disclosure Policy

When a security bug is reported:
1. Confirm the problem and affected versions
2. Audit code for similar issues
3. Prepare fixes for all maintained versions
4. Release fixes as quickly as possible
5. Notify users of security updates

## Security Contacts

- **Security Email:** security@sports-platform.com
- **GitHub Security Tab:** https://github.com/Nicgott99/Premium-Sports-Field-Booking-Platform/security

---

**Last Updated:** March 2024
