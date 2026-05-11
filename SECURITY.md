# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in RiffSync, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, please email security concerns to the repository maintainers directly. If no security contact email is listed, use the GitHub "Report a vulnerability" feature under the Security tab of this repository.

### What to include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response timeline

- **Acknowledgment**: Within 48 hours
- **Initial assessment**: Within 1 week
- **Fix or mitigation**: Depends on severity, but we aim for critical fixes within 2 weeks

## Supported Versions

Only the latest release is actively supported with security updates.

## Security Practices

- Passwords are hashed with bcrypt (cost factor 12)
- Sessions use signed JWTs (HS256) in httpOnly, Secure, SameSite=Lax cookies
- All API routes enforce authentication and project membership authorization
- File uploads are sanitized to prevent path traversal
- Rate limiting is applied to authentication and invite code endpoints
- HTML content is sanitized before rendering to prevent XSS
