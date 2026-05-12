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

- Authentication is managed by Supabase Auth (email/password, managed JWTs)
- All API routes enforce authentication and project membership authorization
- File uploads use presigned URLs with server-side validation
- Files are stored in Cloudflare R2 with access gated through presigned URLs
- Rate limiting is applied to authentication and invite code endpoints
- HTML content is sanitized before rendering to prevent XSS
