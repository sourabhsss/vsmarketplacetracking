# Security Guidelines

## Environment Variables

### Required Variables

```env
# Supabase Configuration (Public - Safe to expose in browser)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Cron Secret (Server-side only - NEVER expose)
CRON_SECRET=your-random-secret-key
```

### Security Best Practices

1. **Never commit `.env.local`** - Already in `.gitignore`
2. **Use strong random strings** for `CRON_SECRET`:
   ```bash
   # Generate a secure random string
   openssl rand -base64 32
   ```
3. **Rotate secrets regularly** - Update `CRON_SECRET` every 90 days
4. **Use different secrets** for development and production

## API Security

### Cron Endpoint Protection

The cron endpoints (`/api/cron/*`) are protected with authorization:

```typescript
const authHeader = request.headers.get('authorization');
const cronSecret = process.env.CRON_SECRET;

if (authHeader !== `Bearer ${cronSecret}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

Vercel automatically adds the `CRON_SECRET` as a Bearer token when calling cron jobs.

### Manual Testing

To test cron endpoints manually:

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-app.vercel.app/api/cron/sync-stats
```

## Database Security

### Supabase Row Level Security (RLS)

**Recommended**: Enable RLS policies in Supabase dashboard:

```sql
-- Enable RLS on tables
ALTER TABLE extensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE install_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for dashboard)
CREATE POLICY "Allow public read access" ON extensions
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access" ON install_stats
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access" ON sync_logs
  FOR SELECT USING (true);

-- Restrict write access (only via service role or authenticated users)
CREATE POLICY "Restrict write access" ON extensions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Restrict write access" ON install_stats
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Restrict write access" ON sync_logs
  FOR ALL USING (auth.role() = 'service_role');
```

### API Keys

- **Anon Key**: Safe to expose in browser (read-only with RLS)
- **Service Role Key**: NEVER expose (bypasses RLS)

## Rate Limiting

### Marketplace API

The VS Code Marketplace API has rate limits. The sync job includes:

- 100ms delay between requests
- Retry logic with exponential backoff
- Error handling for rate limit responses

### Cron Job Frequency

- Current: Daily at 00:00 UTC
- Recommended: Don't increase frequency beyond hourly
- Monitor sync logs for rate limit errors

## Vercel Security

### Environment Variables

1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add all required variables
3. Select appropriate environments (Production, Preview, Development)
4. **Never** log environment variables in production

### Deployment Protection

1. Enable "Deployment Protection" in Vercel settings
2. Restrict access to preview deployments
3. Use "Vercel Authentication" for sensitive previews

## Code Security Checklist

✅ No hardcoded secrets or API keys
✅ Environment variables properly configured
✅ `.env.local` in `.gitignore`
✅ Cron endpoints protected with authorization
✅ Input validation on all API endpoints
✅ Error messages don't expose sensitive data
✅ Dependencies regularly updated (`pnpm update`)

## Monitoring

### Sync Health Dashboard

Monitor sync status at `/monitoring`:

- Last sync time
- Success/failure status
- Error logs
- Data gaps detection

### Alerts

Set up alerts for:

- Failed sync jobs (check sync_logs table)
- Unusual API response times
- Database connection errors

## Incident Response

If secrets are compromised:

1. **Immediately rotate** the compromised secret
2. **Update** in Vercel environment variables
3. **Redeploy** the application
4. **Review** access logs in Supabase
5. **Monitor** for unusual activity

## Reporting Security Issues

If you discover a security vulnerability:

1. **Do NOT** open a public issue
2. Email: [your-security-email]
3. Include detailed description
4. Allow time for fix before disclosure

## Regular Maintenance

### Monthly Tasks

- [ ] Review Supabase access logs
- [ ] Check for dependency updates
- [ ] Verify cron job execution
- [ ] Review error logs

### Quarterly Tasks

- [ ] Rotate `CRON_SECRET`
- [ ] Audit RLS policies
- [ ] Review API rate limits
- [ ] Update dependencies

## Additional Resources

- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Supabase Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Vercel Security](https://vercel.com/docs/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)