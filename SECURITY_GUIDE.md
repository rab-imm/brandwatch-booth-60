# Security Guide - UAE Legal Assistant

## 🔐 Security Architecture

### Authentication & Authorization

#### Multi-Role System
The application uses a role-based access control (RBAC) system with the following roles:

```typescript
enum UserRole {
  super_admin    // Full system access
  company_admin  // Company management
  company_manager // Team oversight
  company_staff  // Basic company user
  individual     // Personal account
}
```

#### Role Storage (Critical)
**IMPORTANT:** Roles are stored in a separate `user_roles` table, NOT in the profiles table. This prevents privilege escalation attacks.

```sql
-- Security definer function prevents RLS recursion
CREATE FUNCTION has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
```

### Row-Level Security (RLS)

All tables have RLS enabled. Key patterns:

#### User-Owned Data
```sql
-- Users can only access their own data
CREATE POLICY "Users view own data"
ON table_name FOR SELECT
USING (auth.uid() = user_id);
```

#### Admin Access
```sql
-- Admins can access all data
CREATE POLICY "Admins access all"
ON table_name FOR ALL
USING (has_role(auth.uid(), 'super_admin'));
```

#### Company Data
```sql
-- Users access company data through membership
CREATE POLICY "Company members access"
ON table_name FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_company_roles
    WHERE user_id = auth.uid()
    AND company_id = table_name.company_id
  )
);
```

## 🔒 API Security

### Edge Functions

#### JWT Verification
All sensitive endpoints require authentication:

```toml
# supabase/config.toml
[functions.sensitive-function]
verify_jwt = true  # Default - requires auth
```

Public endpoints (webhooks only):
```toml
[functions.billing-webhook-handler]
verify_jwt = false  # Public webhook
```

#### CORS Configuration
All edge functions include proper CORS headers:

```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
```

### Input Validation

#### Client-Side
All forms use Zod schemas:

```typescript
const schema = z.object({
  email: z.string().email().max(255),
  name: z.string().trim().min(1).max(100),
  message: z.string().trim().min(1).max(1000)
});
```

#### Server-Side
Edge functions validate all inputs:

```typescript
const { credits, price_aed } = await req.json();
if (!credits || !price_aed) {
  throw new Error("Invalid input");
}
```

## 💳 Payment Security

### Stripe Integration

#### API Keys
- Secret key stored in Supabase secrets (never in code)
- API version standardized: `2025-08-27.basil`
- Webhook signatures verified for all webhooks

#### Payment Flow Security
1. ✅ Customer emails verified before Stripe customer creation
2. ✅ Payment intents linked to user IDs in metadata
3. ✅ Webhook events validated with signature
4. ✅ Idempotent operations prevent duplicate charges

#### PCI Compliance
- ✅ No card data stored in database
- ✅ All payments processed through Stripe Checkout
- ✅ Customer Portal for subscription management

## 🛡️ Data Protection

### Sensitive Data Handling

#### User Data (PII)
Tables with PII have strict RLS:
- `profiles` - User information
- `companies` - Company details
- `invitation_tokens` - Email addresses

#### Encryption
- ✅ All data encrypted at rest (Supabase default)
- ✅ All connections use TLS/SSL
- ✅ Stripe API keys encrypted in Supabase Vault

#### Password Security
```sql
-- Supabase Auth handles:
✅ Bcrypt hashing
✅ Password complexity rules
⚠️ Leaked password protection (needs enabling)
```

**ACTION REQUIRED:** Enable leaked password protection in Supabase Dashboard:
```
Settings → Authentication → Password Settings
→ Enable "Leaked Password Protection"
```

## 🔍 Security Monitoring

### Audit Logging

All admin actions logged to `activity_logs`:
```typescript
await supabase.from("activity_logs").insert({
  user_id: admin_id,
  action: "user_role_changed",
  resource_type: "user",
  resource_id: target_user_id,
  metadata: { old_role, new_role }
});
```

### Real-time Monitoring
Security events tracked in `SecurityMonitoring` component:
- Failed login attempts
- Permission errors
- Unusual API usage
- Rate limit violations

### Alerts
Automatic notifications for:
- Failed payment attempts
- Unauthorized access attempts
- Suspicious activity patterns

## 🚨 Vulnerability Prevention

### SQL Injection
✅ **Protected** - All queries use parameterized Supabase client methods:
```typescript
// ✅ SAFE
await supabase.from('table').select().eq('id', userId);

// ❌ NEVER DO THIS
await supabase.rpc('raw_sql', { query: userInput });
```

### XSS (Cross-Site Scripting)
✅ **Protected** - React escapes all output by default
- Never use `dangerouslySetInnerHTML` with user input
- All form inputs sanitized

### CSRF (Cross-Site Request Forgery)
✅ **Protected** - JWT tokens in Authorization header
- Tokens not in cookies (immune to CSRF)
- All mutations require authentication

### Privilege Escalation
✅ **Protected** - Roles in separate table
- Server-side role checks
- RLS enforced on all tables
- Security definer functions for role checks

## 🔐 Secrets Management

### Environment Variables
```bash
# Stored in Supabase Vault (not in code)
STRIPE_SECRET_KEY=sk_live_...
OPENAI_API_KEY=sk-...
PERPLEXITY_API_KEY=pplx-...
```

### Adding New Secrets
```typescript
// Through Lovable AI
await addSecret("NEW_API_KEY");

// Or via Supabase CLI
supabase secrets set NEW_API_KEY=value
```

## ✅ Security Checklist

### Pre-Production
- [ ] Enable leaked password protection
- [ ] Review all RLS policies
- [ ] Test role permissions thoroughly
- [ ] Verify Stripe webhook signatures
- [ ] Audit all edge functions
- [ ] Review activity logs
- [ ] Test error handling
- [ ] Verify input validation

### Production
- [ ] Monitor security alerts
- [ ] Review audit logs weekly
- [ ] Update dependencies monthly
- [ ] Rotate API keys quarterly
- [ ] Conduct security audits
- [ ] Test disaster recovery
- [ ] Monitor for data breaches
- [ ] Keep Stripe API version updated

## 🛠️ Security Tools

### Available Tools
1. **Supabase Linter** - Automated security checks
2. **Security Monitoring Dashboard** - Real-time alerts
3. **Audit Logs** - Complete activity history
4. **Bulk User Operations** - Safe mass user management

### Running Security Scan
```typescript
// Through Lovable AI or Supabase CLI
await runSecurityScan();
```

## 📞 Incident Response

### Security Breach Protocol
1. **Immediate Actions**
   - Disable affected user accounts
   - Rotate all API keys
   - Review audit logs
   - Notify affected users

2. **Investigation**
   - Identify attack vector
   - Assess data exposure
   - Document timeline
   - Preserve evidence

3. **Recovery**
   - Patch vulnerabilities
   - Restore from backup if needed
   - Update security policies
   - Communicate with stakeholders

### Emergency Contacts
- Supabase Support: support@supabase.io
- Stripe Security: security@stripe.com

## 📚 Additional Resources

- [Supabase Security](https://supabase.com/docs/guides/auth/auth-helpers/overview)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Stripe Security](https://stripe.com/docs/security)
- [RLS Best Practices](https://supabase.com/docs/guides/auth/row-level-security)

---

**Last Security Audit:** 2025-01-15
**Next Review Date:** 2025-04-15
**Security Contact:** admin@uaelegalassistant.ae
