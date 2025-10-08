# Edge Functions Guide - UAE Legal Assistant

## 📋 Overview

This application uses Supabase Edge Functions (Deno runtime) for backend logic. All functions are automatically deployed when code is pushed.

## 🗂️ Function Inventory

### Payment & Billing (7 functions)

#### 1. `purchase-credits`
**Purpose:** Handle one-time credit purchases via Stripe
**Auth:** Required (JWT)
**Key Features:**
- Creates Stripe Checkout session
- Links payment to user account
- Records transaction in `credit_transactions`

**Request:**
```typescript
const { data } = await supabase.functions.invoke('purchase-credits', {
  body: { credits: 100, price_aed: 500 }
});
// Returns: { url: string, session_id: string }
```

#### 2. `create-checkout`
**Purpose:** Create subscription checkout sessions
**Auth:** Required (JWT)
**Key Features:**
- Supports multiple subscription tiers
- Monthly/annual billing options
- Customer creation if needed

**Request:**
```typescript
const { data } = await supabase.functions.invoke('create-checkout', {
  body: { priceId: 'price_xxx' }
});
```

#### 3. `check-subscription`
**Purpose:** Verify and sync subscription status
**Auth:** Required (JWT)
**Key Features:**
- Checks Stripe for active subscriptions
- Returns tier and expiry date
- Auto-refreshes on login

**Request:**
```typescript
const { data } = await supabase.functions.invoke('check-subscription');
// Returns: { subscribed: boolean, product_id: string, subscription_end: string }
```

#### 4. `customer-portal`
**Purpose:** Generate Stripe Customer Portal link
**Auth:** Required (JWT)
**Key Features:**
- Subscription management
- Payment method updates
- Invoice history

**Request:**
```typescript
const { data } = await supabase.functions.invoke('customer-portal');
// Returns: { url: string }
```

#### 5. `billing-webhook-handler`
**Purpose:** Process Stripe webhook events
**Auth:** Public (signature verified)
**Key Features:**
- Handles all Stripe events
- Updates subscription status
- Manages payment failures
- Records transactions

**Webhook Events Handled:**
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `checkout.session.completed`

#### 6. `download-invoice`
**Purpose:** Generate PDF invoices
**Auth:** Required (JWT)
**Key Features:**
- Retrieves invoice from Stripe
- Generates PDF
- Verifies user ownership

#### 7. `dunning-management`
**Purpose:** Handle failed payment recovery
**Auth:** Public (cron job)
**Key Features:**
- Retries failed payments
- Sends reminder emails
- Cancels after 7 days

### User & Credit Management (2 functions)

#### 8. `usage-alerts`
**Purpose:** Monitor and alert on credit usage
**Auth:** Required (JWT)
**Key Features:**
- Checks usage thresholds (75%, 90%)
- Creates notifications
- Suggests upgrades

**Thresholds:**
- 75% - Info notification
- 90% - Warning notification

#### 9. `process-credit-rollover`
**Purpose:** Monthly credit rollover
**Auth:** Public (cron job)
**Key Features:**
- Rolls over unused credits
- Configurable percentage
- Sets expiry dates

**Configuration:**
```sql
-- In system_config table
{
  "enabled": true,
  "max_rollover_percentage": 50,
  "rollover_expiry_months": 3
}
```

#### 10. `bulk-user-operations`
**Purpose:** Batch user management
**Auth:** Required (admin only)
**Key Features:**
- CSV upload support
- Operations: allocate credits, suspend, activate, change role, delete
- Progress tracking
- Error reporting

### Marketplace & Creator (3 functions)

#### 11. `create-template-payment`
**Purpose:** Handle template purchases
**Auth:** Required (JWT)
**Key Features:**
- One-time payment flow
- Revenue share calculation
- Template access grant

#### 12. `process-creator-payouts`
**Purpose:** Automated creator payments
**Auth:** Public (cron job)
**Key Features:**
- Monthly payout calculation
- Stripe Connect transfers
- Minimum threshold ($50 AED)
- Payout tracking

#### 13. `marketplace-analytics`
**Purpose:** Creator dashboard analytics
**Auth:** Required (JWT)
**Key Features:**
- Template performance
- Revenue metrics
- Download statistics
- Review aggregation

#### 14. `stripe-connect-onboarding`
**Purpose:** Creator onboarding to Stripe
**Auth:** Required (JWT)
**Key Features:**
- Express account creation
- Onboarding link generation
- Account status tracking

### Document & Signature (2 functions)

#### 15. `create-digital-signature`
**Purpose:** Create digital signatures
**Auth:** Required (JWT)
**Key Features:**
- SHA-256 hashing
- Signature metadata
- Compliance tracking

**Request:**
```typescript
const { data } = await supabase.functions.invoke('create-digital-signature', {
  body: { 
    letter_id: 'uuid',
    signature_data: 'base64_string',
    signer_name: 'John Doe'
  }
});
```

#### 16. `verify-signature`
**Purpose:** Verify digital signatures
**Auth:** Required (JWT)
**Key Features:**
- Hash verification
- Timestamp validation
- Signer information

### System & Monitoring (1 function)

#### 17. `system-health-monitor`
**Purpose:** Service health checks
**Auth:** Public (cron job)
**Key Features:**
- Database connectivity
- API responsiveness
- Auth service status
- Performance metrics

**Health Checks:**
```typescript
{
  database: { status: 'healthy', response_time: 45 },
  api: { status: 'healthy', response_time: 120 },
  auth: { status: 'healthy', response_time: 89 },
  overall: 'healthy'
}
```

### Communication (3 functions)

#### 18. `notify-lawyer-request`
**Purpose:** Send lawyer consultation notifications
**Auth:** Required (JWT)

#### 19. `notify-document-upload`
**Purpose:** Document upload notifications
**Auth:** Required (JWT)

#### 20. `automated-email`
**Purpose:** Email notification system
**Auth:** Public (internal only)

## 🔧 Configuration

### Environment Variables
All functions have access to:
```bash
SUPABASE_URL=https://icsttnftxcfgnwhifsdm.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... # Admin access
STRIPE_SECRET_KEY=sk_live_...
OPENAI_API_KEY=sk-...
PERPLEXITY_API_KEY=pplx-...
```

### Adding Secrets
```bash
# Via Supabase CLI
supabase secrets set NEW_SECRET=value

# Or through Lovable AI
# AI will prompt for the value securely
```

### JWT Verification
Configure in `supabase/config.toml`:
```toml
[functions.function-name]
verify_jwt = true  # Requires authentication
```

## 📊 Logging

### Standard Log Format
All functions use consistent logging:
```typescript
const logStep = (step: string, details?: any) => {
  console.log(`[FUNCTION-NAME] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

// Usage
logStep("Function started");
logStep("User authenticated", { userId: user.id });
logStep("ERROR", { message: error.message });
```

### Viewing Logs
```bash
# Via Supabase CLI
supabase functions logs function-name

# Or in Supabase Dashboard
# Project → Edge Functions → function-name → Logs
```

## 🚀 Deployment

### Automatic Deployment
All functions deploy automatically on code push. No manual deployment needed!

### Manual Deployment (if needed)
```bash
supabase functions deploy function-name
```

### Testing Locally
```bash
# Start local development
supabase start

# Serve function locally
supabase functions serve function-name --env-file .env.local
```

## 🔍 Debugging

### Common Issues

#### 1. "No authorization header"
**Cause:** Missing JWT token
**Fix:** Ensure client passes Authorization header:
```typescript
const { data } = await supabase.functions.invoke('function-name', {
  headers: {
    Authorization: `Bearer ${session.access_token}`
  }
});
```

#### 2. "STRIPE_SECRET_KEY is not set"
**Cause:** Missing environment variable
**Fix:** Add secret via Supabase Dashboard or CLI

#### 3. "User not authenticated"
**Cause:** Invalid or expired JWT
**Fix:** Refresh user session:
```typescript
await supabase.auth.refreshSession();
```

### Debug Mode
Add extra logging:
```typescript
console.log('Request body:', await req.json());
console.log('Auth header:', req.headers.get('Authorization'));
```

## 📈 Performance

### Timeouts
Default timeout: 60 seconds
Configure in `supabase/config.toml`:
```toml
[functions.long-running-task]
timeout = 300  # 5 minutes
```

### Cold Starts
- First invocation: ~500ms
- Subsequent: ~50ms
- Keep functions warm with scheduled invocations

### Optimization Tips
1. Reuse Supabase client instances
2. Batch database operations
3. Use connection pooling
4. Cache frequently accessed data
5. Minimize external API calls

## 🔐 Security Best Practices

### 1. Always Validate Input
```typescript
const { amount } = await req.json();
if (!amount || amount < 0) {
  throw new Error("Invalid amount");
}
```

### 2. Never Log Sensitive Data
```typescript
// ❌ DON'T
logStep("Payment", { stripe_key: key });

// ✅ DO
logStep("Payment processed", { amount: data.amount });
```

### 3. Use Service Role Key Carefully
```typescript
// Only for admin operations
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL"),
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"), // Bypasses RLS
  { auth: { persistSession: false } }
);
```

### 4. Implement Rate Limiting
```typescript
// Track requests per user
const requestCount = await getRequestCount(userId);
if (requestCount > 100) {
  throw new Error("Rate limit exceeded");
}
```

## 📚 Examples

### Creating a New Function

1. **Create file:**
```bash
supabase/functions/my-function/index.ts
```

2. **Basic template:**
```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Your logic here

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
```

3. **Configure:**
```toml
# supabase/config.toml
[functions.my-function]
verify_jwt = true
```

## 🔗 Related Documentation

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Deno Documentation](https://deno.land/manual)
- [Stripe API Reference](https://stripe.com/docs/api)

---

**Last Updated:** 2025-01-15
**Total Functions:** 20
**Runtime:** Deno 1.x
