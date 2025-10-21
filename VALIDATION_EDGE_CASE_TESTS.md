# Validation Edge Case Tests

This document contains comprehensive edge case tests for validation across all implemented letter types: **Demand Letter**, **Power of Attorney**, and **General Legal Letter**.

---

## 1. DEMAND LETTER - Edge Case Tests

### 1.1 Amount Field Validation

| Test Case | Input | Expected Result | Error Message |
|-----------|-------|-----------------|---------------|
| Empty amount | `""` | ❌ FAIL | "Amount required" |
| Zero amount | `"0"` | ❌ FAIL | "Invalid amount - must be positive" |
| Negative amount | `"-5000"` | ❌ FAIL | "Invalid amount - must be positive" |
| Non-numeric | `"five thousand"` | ❌ FAIL | "Invalid amount - numbers only" |
| Special characters | `"5000@#$"` | ❌ FAIL | "Invalid amount - numbers only" |
| Decimal valid | `"50000.50"` | ✅ PASS | - |
| With commas | `"50,000"` | ✅ PASS (stripped) | - |
| With AED prefix | `"AED 50000"` | ✅ PASS (stripped) | - |
| Very large | `"999999999999"` | ✅ PASS | - |
| Multiple decimals | `"50.00.00"` | ❌ FAIL | "Invalid amount format" |
| Leading zeros | `"00050000"` | ✅ PASS (parsed as 50000) | - |

### 1.2 Payment Deadline Validation

| Test Case | Input | Expected Result | Error Message |
|-----------|-------|-----------------|---------------|
| Both empty | `paymentDeadline: ""`, `deadlineCalendarDays: ""` | ❌ FAIL | "Payment deadline required" |
| Past date | `"2024-01-01"` | ⚠️ WARN (should validate) | "Deadline should be in future" |
| Valid date | `"2025-12-31"` | ✅ PASS | - |
| Invalid calendar days | `"2"` (below minimum 3) | ❌ FAIL | "Invalid calendar days - must be 3-90" |
| Invalid calendar days | `"100"` (above maximum 90) | ❌ FAIL | "Invalid calendar days - must be 3-90" |
| Valid calendar days | `"14"` | ✅ PASS | - |
| Non-numeric calendar | `"two weeks"` | ❌ FAIL | "Invalid calendar days - numbers only" |
| Negative calendar | `"-7"` | ❌ FAIL | "Invalid calendar days - must be 3-90" |
| Zero calendar | `"0"` | ❌ FAIL | "Invalid calendar days - must be 3-90" |
| Both provided | `paymentDeadline: "2025-12-31"`, `deadlineCalendarDays: "14"` | ✅ PASS (date takes precedence) | - |

### 1.3 Payment Method Validation

| Test Case | Input | Expected Result | Error Message |
|-----------|-------|-----------------|---------------|
| No payment methods | All set to "No" | ❌ FAIL | "No payment method specified" |
| Bank transfer enabled, missing bank name | `bankTransferAllowed: "Yes"`, `bankName: ""` | ❌ FAIL | "Bank details incomplete" |
| Bank transfer enabled, missing account name | `bankTransferAllowed: "Yes"`, `accountName: ""` | ❌ FAIL | "Bank details incomplete" |
| Bank transfer enabled, missing account number | `bankTransferAllowed: "Yes"`, `accountNumber: ""` | ❌ FAIL | "Bank details incomplete" |
| Bank transfer complete | All bank fields filled | ✅ PASS | - |
| Cheque enabled, missing payee | `chequeAllowed: "Yes"`, `chequePayeeName: ""` | ❌ FAIL | "Cheque details incomplete" |
| Cheque enabled, missing address | `chequeAllowed: "Yes"`, `chequeDeliveryAddress: ""` | ❌ FAIL | "Cheque details incomplete" |
| Cash enabled, missing address | `cashAllowed: "Yes"`, `cashPaymentAddress: ""` | ❌ FAIL | "Cash payment details incomplete" |
| Cash enabled, missing hours | `cashAllowed: "Yes"`, `businessHours: ""` | ❌ FAIL | "Cash payment details incomplete" |
| Online enabled, missing URL | `onlinePaymentAllowed: "Yes"`, `paymentPortalURL: ""` | ❌ FAIL | "Online payment details incomplete" |
| Multiple methods enabled | Bank + Cheque both with details | ✅ PASS | - |

### 1.4 Email & Phone Validation

| Test Case | Input | Expected Result | Error Message |
|-----------|-------|-----------------|---------------|
| Empty email | `""` | ❌ FAIL | "Sender email required" |
| Invalid email format | `"notanemail"` | ❌ FAIL | "Invalid sender email" |
| Missing @ | `"email.com"` | ❌ FAIL | "Invalid sender email" |
| Missing domain | `"email@"` | ❌ FAIL | "Invalid sender email" |
| Valid email | `"sender@example.com"` | ✅ PASS | - |
| Email with plus | `"sender+tag@example.com"` | ✅ PASS | - |
| Invalid UAE phone | `"+1 234 567 8900"` (not UAE) | ❌ FAIL | "Phone should be UAE format" |
| UAE phone no +971 | `"50 123 4567"` | ❌ FAIL | "Phone should be UAE format" |
| Valid UAE phone | `"+971 50 123 4567"` | ✅ PASS | - |
| Valid UAE compact | `"+971501234567"` | ✅ PASS | - |
| Invalid digits | `"+971 50 12 345"` (too short) | ❌ FAIL | "Phone should be UAE format" |

### 1.5 Interest Rate & Legal Costs Validation

| Test Case | Input | Expected Result | Error Message |
|-----------|-------|-----------------|---------------|
| Empty interest rate | `""` | ✅ PASS (optional) | - |
| Negative interest | `"-5"` | ❌ FAIL | "Interest rate must be 0-50%" |
| Unrealistic rate | `"100"` | ❌ FAIL | "Interest rate must be 0-50%" |
| Valid rate | `"5"` | ✅ PASS | - |
| Decimal rate | `"5.5"` | ✅ PASS | - |
| Zero rate | `"0"` | ✅ PASS | - |
| Non-numeric rate | `"five percent"` | ❌ FAIL | "Invalid interest rate" |
| Empty legal costs | `""` | ✅ PASS (optional) | - |
| Negative costs | `"-1000"` | ❌ FAIL | "Invalid legal costs" |
| Valid costs | `"5000"` | ✅ PASS | - |
| Non-numeric costs | `"five thousand"` | ❌ FAIL | "Invalid legal costs" |

### 1.6 Required Field Validation

| Test Case | Input | Expected Result | Error Message |
|-----------|-------|-----------------|---------------|
| Missing debt type | `debtType: ""` | ❌ FAIL | "Debt type required" |
| Missing service description | `serviceDescription: ""` | ❌ FAIL | "Service description required" |
| Missing payment terms | `originalPaymentTerms: ""` | ❌ FAIL | "Payment terms required" |
| Missing original due date | `originalDueDate: ""` | ❌ FAIL | "Original due date required" |
| Missing supporting docs | `supportingDocs: ""` | ❌ FAIL | "Supporting documents required" |
| Missing consequences | `consequences: ""` | ❌ FAIL | "Consequences required" |
| Missing previous attempts | `previousAttempts: ""` | ❌ FAIL | "Previous attempts required" |
| Missing applicable law | `applicableLaw: ""` | ❌ FAIL | "Applicable law required" |
| Missing emirate | `emirate: ""` | ❌ FAIL | "Emirate required" |
| All required filled | All fields populated | ✅ PASS | - |

---

## 2. POWER OF ATTORNEY - Edge Case Tests

### 2.1 Date Validation

| Test Case | Input | Expected Result | Error Message |
|-----------|-------|-----------------|---------------|
| Effective date in past | `effectiveDate: "2020-01-01"` | ⚠️ WARN | "Effective date is in the past" |
| Effective date today | `effectiveDate: TODAY` | ✅ PASS | - |
| Effective date future | `effectiveDate: "2026-01-01"` | ✅ PASS | - |
| Expiry before effective | `effectiveDate: "2025-12-31"`, `expiryDate: "2025-06-01"` | ❌ FAIL | "Expiry date must be after effective date" |
| Expiry same as effective | `effectiveDate: "2025-06-01"`, `expiryDate: "2025-06-01"` | ❌ FAIL | "Expiry must be after effective" |
| Valid date range | `effectiveDate: "2025-06-01"`, `expiryDate: "2025-12-31"` | ✅ PASS | - |
| Very long duration | Effective today, expiry 10 years later | ⚠️ WARN (but pass) | "Long POA duration - consider review" |
| Perpetual (no expiry) | `expiryDate: ""` | ✅ PASS | - |

### 2.2 Powers Selection Validation

| Test Case | Input | Expected Result | Error Message |
|-----------|-------|-----------------|---------------|
| No powers selected | All powers: `"No"` | ❌ FAIL | "At least one power must be granted" |
| Only one power | `financialTransactions: "Yes"`, rest "No" | ✅ PASS | - |
| All powers selected | All: `"Yes"` | ✅ PASS | - |
| Conflicting powers | `signContracts: "Yes"`, but scope says "financial only" | ⚠️ WARN (should review) | - |
| Real estate without property details | `buyProperty: "Yes"`, `propertyDetails: ""` | ⚠️ WARN | "Property details recommended" |

### 2.3 Delegation Validation

| Test Case | Input | Expected Result | Error Message |
|-----------|-------|-----------------|---------------|
| Delegation allowed, no sub-attorney | `delegationAllowed: "Yes - Can delegate..."`, `subAttorneyName: ""` | ✅ PASS (optional) | - |
| Delegation specific, no name | `delegationAllowed: "Yes - Only to specific..."`, `subAttorneyName: ""` | ❌ FAIL | "Sub-attorney name required" |
| Delegation specific, no ID | `delegationAllowed: "Yes - Only to specific..."`, `subAttorneyID: ""` | ❌ FAIL | "Sub-attorney ID required" |
| Delegation not allowed | `delegationAllowed: "No"`, fields empty | ✅ PASS | - |

### 2.4 Termination Validation

| Test Case | Input | Expected Result | Error Message |
|-----------|-------|-----------------|---------------|
| Early termination unspecified | `earlyTermination: ""` | ❌ FAIL | "Early termination clause required" |
| Notice period empty | `earlyTermination: "Yes - With notice period"`, `noticeRequired: ""` | ❌ FAIL | "Notice period required" |
| Notice period negative | `noticeRequired: "-7"` | ❌ FAIL | "Invalid notice period" |
| Notice period zero | `noticeRequired: "0"` | ✅ PASS (immediate termination) | - |
| Notice period unrealistic | `noticeRequired: "365"` (1 year) | ⚠️ WARN | "Very long notice period" |
| Valid notice | `noticeRequired: "30"` | ✅ PASS | - |

### 2.5 Party Information Validation

| Test Case | Input | Expected Result | Error Message |
|-----------|-------|-----------------|---------------|
| Missing principal name | `principalName: ""` | ❌ FAIL | "Principal name required" |
| Missing principal ID | `principalID: ""` | ❌ FAIL | "Principal ID required" |
| Invalid Emirates ID format | `principalID: "123456"` | ⚠️ WARN | "Invalid Emirates ID format" |
| Valid Emirates ID | `principalID: "784-1234-1234567-1"` | ✅ PASS | - |
| Missing attorney name | `attorneyName: ""` | ❌ FAIL | "Attorney name required" |
| Missing attorney ID | `attorneyID: ""` | ❌ FAIL | "Attorney ID required" |
| Missing relationship | `relationship: ""` | ✅ PASS (optional) | - |

### 2.6 Jurisdiction Validation

| Test Case | Input | Expected Result | Error Message |
|-----------|-------|-----------------|---------------|
| Empty jurisdiction | `jurisdiction: ""` | ❌ FAIL | "Jurisdiction required" |
| Valid emirate | `jurisdiction: "Dubai"` | ✅ PASS | - |
| Multiple emirates | `jurisdiction: "Dubai and Abu Dhabi"` | ✅ PASS | - |
| International | `jurisdiction: "UAE and Saudi Arabia"` | ⚠️ WARN | "International POA may need attestation" |

---

## 3. GENERAL LEGAL LETTER - Edge Case Tests

### 3.1 Purpose & Subject Validation

| Test Case | Input | Expected Result | Error Message |
|-----------|-------|-----------------|---------------|
| Empty purpose | `purpose: ""` | ❌ FAIL | "Letter purpose required" |
| Very short purpose | `purpose: "Hi"` (< 10 chars) | ❌ FAIL | "Purpose too brief" |
| Very long purpose | `purpose: "A".repeat(10000)` | ⚠️ WARN | "Purpose very long - consider shortening" |
| Valid purpose | `purpose: "Request for contract review..."` | ✅ PASS | - |
| Empty subject | `subject: ""` | ⚠️ WARN (optional) | "Subject line recommended" |
| Valid subject | `subject: "Contract Review Request"` | ✅ PASS | - |

### 3.2 Required Action Validation

| Test Case | Input | Expected Result | Error Message |
|-----------|-------|-----------------|---------------|
| Empty required action | `requiredAction: ""` | ❌ FAIL | "Required action must be specified" |
| Vague action | `requiredAction: "Do something"` | ⚠️ WARN | "Action too vague - be specific" |
| Valid action | `requiredAction: "Sign and return the contract..."` | ✅ PASS | - |
| Multiple actions | `requiredAction: "1. Review 2. Sign 3. Return"` | ✅ PASS | - |

### 3.3 Response Deadline Validation

| Test Case | Input | Expected Result | Error Message |
|-----------|-------|-----------------|---------------|
| Empty deadline | `responseDeadline: ""` | ❌ FAIL | "Response deadline required" |
| Past deadline | `responseDeadline: "2020-01-01"` | ⚠️ WARN | "Deadline is in the past" |
| Today as deadline | `responseDeadline: TODAY` | ⚠️ WARN | "Same-day deadline may be unrealistic" |
| Valid future date | `responseDeadline: "2025-12-31"` | ✅ PASS | - |
| Very far future | `responseDeadline: "2030-01-01"` | ⚠️ WARN | "Very distant deadline" |

### 3.4 Urgency Validation

| Test Case | Input | Expected Result | Error Message |
|-----------|-------|-----------------|---------------|
| Empty urgency | `urgency: ""` | ❌ FAIL | "Urgency level required" |
| Invalid urgency | `urgency: "Super critical"` | ❌ FAIL | "Invalid urgency - use Standard/Urgent/Critical" |
| Valid urgency | `urgency: "Standard"` | ✅ PASS | - |
| Urgency vs deadline mismatch | `urgency: "Critical"`, `responseDeadline: 60 days away` | ⚠️ WARN | "Urgency/deadline mismatch" |

### 3.5 Legal Basis Validation

| Test Case | Input | Expected Result | Error Message |
|-----------|-------|-----------------|---------------|
| Empty legal basis | `legalBasis: ""` | ✅ PASS (optional but recommended) | - |
| Too brief | `legalBasis: "Law"` | ⚠️ WARN | "Legal basis too brief" |
| Valid legal basis | `legalBasis: "UAE Commercial Transactions Law Article 123"` | ✅ PASS | - |
| Multiple laws | `legalBasis: "Federal Law 5/1985, Federal Law 18/1993"` | ✅ PASS | - |

---

## 4. CROSS-CUTTING EDGE CASES (All Letter Types)

### 4.1 Character Encoding & Special Characters

| Test Case | Input | Expected Result |
|-----------|-------|-----------------|
| Arabic characters | `"الإمارات العربية المتحدة"` | ✅ PASS (support multilingual) |
| Emoji in text | `"Important 😊"` | ⚠️ WARN (strip or allow?) |
| Special quotes | `"Smart "quotes""` | ✅ PASS (handle gracefully) |
| Line breaks | `"Line 1\nLine 2"` | ✅ PASS (preserve formatting) |
| SQL injection attempt | `"'; DROP TABLE--"` | ✅ PASS (sanitized by backend) |
| XSS attempt | `"<script>alert('xss')</script>"` | ✅ PASS (sanitized) |

### 4.2 Field Length Boundaries

| Test Case | Input | Expected Result |
|-----------|-------|-----------------|
| Empty string | `""` | Validate per field requirements |
| Single character | `"A"` | Validate per field (may fail if min length required) |
| Maximum typical length | 5000 characters | ✅ PASS |
| Extremely long | 100,000 characters | ⚠️ WARN or limit (DB constraint) |
| Just whitespace | `"     "` | ❌ FAIL (trim and validate as empty) |
| Leading/trailing spaces | `"  Text  "` | ✅ PASS (should trim) |

### 4.3 Date Edge Cases

| Test Case | Input | Expected Result |
|-----------|-------|-----------------|
| Invalid date format | `"2025-13-01"` (month 13) | ❌ FAIL (invalid month) |
| Leap year date | `"2024-02-29"` | ✅ PASS |
| Non-leap year | `"2025-02-29"` | ❌ FAIL (invalid date) |
| Date as string | `"January 1st, 2025"` | ❌ FAIL (wrong format) |
| Unix timestamp | `"1735689600"` | ❌ FAIL (wrong format) |
| ISO 8601 format | `"2025-12-31T23:59:59Z"` | ✅ PASS (parse correctly) |

### 4.4 Multiline Text Fields

| Test Case | Input | Expected Result |
|-----------|-------|-----------------|
| Single line | `"One line text"` | ✅ PASS |
| Multiple paragraphs | `"Para 1\n\nPara 2"` | ✅ PASS (preserve) |
| Excessive line breaks | `"\n\n\n\n"` | ⚠️ WARN (clean up) |
| Mixed formatting | Tabs, spaces, newlines | ✅ PASS (normalize) |

---

## 5. AUTOMATED TEST SCENARIOS

### 5.1 Demand Letter - Complete Valid Scenario

```javascript
const validDemandLetter = {
  // Reference
  referenceNumber: "DEM-2025-001",
  
  // Debt Type & Context
  debtType: "Unpaid Invoice - Goods or services provided but not paid",
  amount: "50000.00",
  
  // Invoice Details
  invoiceNumber: "INV-2024-12345",
  invoiceDate: "2024-11-15",
  serviceDescription: "Web development services for corporate website including design, development, and 3 months maintenance",
  originalPaymentTerms: "Net 30 days from invoice date",
  originalDueDate: "2024-12-15",
  
  // Supporting Documents
  supportingDocs: "Invoice No. INV-2024-12345 dated 15/11/2024, Service Agreement dated 01/10/2024, Email correspondence dated 20/12/2024",
  
  // Payment Deadline
  paymentDeadline: "2025-02-15",
  deadlineCalendarDays: "",
  
  // Partial Payment
  partialPaymentAccepted: "No - Full payment required by deadline",
  
  // Payment Methods
  bankTransferAllowed: "Yes - Provide bank details",
  bankName: "Emirates NBD",
  accountName: "ABC Legal Services LLC",
  accountNumber: "1234567890",
  iban: "AE070260001234567890123",
  swiftCode: "EBILAEAD",
  bankBranch: "Dubai Main Branch",
  
  chequeAllowed: "No - Not accepted",
  cashAllowed: "No - Not accepted",
  onlinePaymentAllowed: "No - Not accepted",
  
  // Sender Contact
  senderEmail: "legal@abclegal.ae",
  senderPhone: "+971 4 123 4567",
  
  // Consequences
  consequences: "Civil lawsuit in Dubai Courts, Late payment interest at 5% per month as per contract, Legal costs estimated at AED 15,000, Reporting to Al Etihad Credit Bureau",
  interestRate: "5",
  estimatedLegalCosts: "15000",
  
  // Legal
  applicableLaw: "Commercial Transactions Law (Federal Law No. 18 of 1993) - For business debts",
  emirate: "Dubai",
  creditReportingThreat: "Yes - Warn of AECB (Al Etihad Credit Bureau) reporting",
  
  // Additional
  urgency: "Standard (14-21 days)",
  previousAttempts: "Reminder email sent 20/12/2024, Phone call 05/01/2025, Final reminder 20/01/2025 - No response received"
};

// Expected: ✅ PASS all validations
```

### 5.2 Demand Letter - Missing Required Fields Scenario

```javascript
const invalidDemandLetter = {
  referenceNumber: "DEM-2025-002",
  debtType: "Unpaid Invoice - Goods or services provided but not paid",
  amount: "50000.00",
  // MISSING: serviceDescription (required)
  // MISSING: originalPaymentTerms (required)
  // MISSING: originalDueDate (required)
  // MISSING: supportingDocs (required)
  // MISSING: consequences (required)
  // MISSING: previousAttempts (required)
  // MISSING: paymentDeadline AND deadlineCalendarDays (at least one required)
  // MISSING: applicableLaw (required)
  // MISSING: emirate (required)
  // MISSING: senderEmail (required)
  // MISSING: senderPhone (required)
  // No payment methods enabled
};

// Expected: ❌ FAIL with specific error messages for each missing field
```

### 5.3 Power of Attorney - Complete Valid Scenario

```javascript
const validPOA = {
  // Parties
  principalName: "Ahmed Mohammed Al Maktoum",
  principalID: "784-1985-1234567-1",
  principalAddress: "Villa 123, Emirates Hills, Dubai, UAE",
  principalPhone: "+971 50 123 4567",
  principalEmail: "ahmed@example.ae",
  
  attorneyName: "Fatima Hassan Al Mansoori",
  attorneyID: "784-1990-7654321-2",
  attorneyAddress: "Apartment 456, Marina Tower, Dubai, UAE",
  attorneyPhone: "+971 55 987 6543",
  attorneyEmail: "fatima@example.ae",
  
  relationship: "Business Partner",
  
  // Purpose & Scope
  poaType: "Special - Limited to specific acts or transactions",
  purpose: "To manage and operate the principal's import-export business during his medical treatment abroad",
  scopeOfPowers: "Limited to business operations including signing commercial contracts under AED 500,000, managing inventory, and making routine business decisions. EXCLUDES: sale of company assets, borrowing exceeding AED 100,000, or hiring/firing senior management.",
  
  // Powers
  financialTransactions: "Yes - Can manage financial matters",
  signContracts: "Yes - Can sign contracts on behalf of principal",
  buyProperty: "No - Cannot purchase real estate",
  sellProperty: "No - Cannot sell property",
  accessBankAccounts: "Yes - Can access and manage bank accounts",
  signCheques: "Yes - Can sign cheques",
  governmentDocuments: "Yes - Can sign government documents",
  manageBusiness: "Yes - Can manage business operations",
  legalProceedings: "Yes - Can represent in legal proceedings",
  
  // Delegation
  delegationAllowed: "No - Cannot delegate powers to anyone else",
  
  // Duration
  effectiveDate: "2025-03-01",
  expiryDate: "2025-09-01",
  durationType: "Fixed term - Expires on specified date",
  
  // Termination
  earlyTermination: "Yes - With notice period required",
  noticeRequired: "30",
  
  // Legal
  jurisdiction: "Dubai",
  applicableLaw: "UAE Federal Law No. 5 of 1985 (Civil Transactions Law)",
  
  // Additional
  specificInstructions: "Attorney must provide monthly financial reports to principal. Any transaction exceeding AED 200,000 requires prior written approval via email.",
  notaryRequired: "Yes - Attestation by UAE notary required"
};

// Expected: ✅ PASS all validations
```

### 5.4 General Legal Letter - Boundary Conditions

```javascript
// Test 1: Minimum valid input
const minimalGeneralLetter = {
  purpose: "Request for information about contract terms and conditions",
  subject: "Contract Query",
  requiredAction: "Please provide clarification on payment terms outlined in section 5.2",
  responseDeadline: "2025-03-15",
  urgency: "Standard (7-14 days)"
};
// Expected: ✅ PASS

// Test 2: Maximum realistic input
const maximalGeneralLetter = {
  purpose: "A".repeat(5000), // 5000 characters
  subject: "B".repeat(200),
  additionalContext: "C".repeat(10000),
  requiredAction: "D".repeat(2000),
  responseDeadline: "2025-12-31",
  urgency: "Critical (immediate attention required)",
  consequences: "E".repeat(3000),
  legalBasis: "F".repeat(2000),
  attachmentList: "G".repeat(1000)
};
// Expected: ✅ PASS (but may trigger length warnings)

// Test 3: Invalid urgency with mismatched deadline
const mismatchedUrgencyLetter = {
  purpose: "Urgent contract review required",
  subject: "Critical Issue",
  requiredAction: "Review and respond immediately",
  responseDeadline: "2026-06-01", // 1+ year away
  urgency: "Critical (immediate attention required)" // Mismatch!
};
// Expected: ⚠️ WARN about urgency/deadline mismatch
```

---

## 6. TESTING CHECKLIST

### Pre-Test Setup
- [ ] Clear browser cache and local storage
- [ ] Test in clean browser session
- [ ] Verify user has sufficient credits (5 credits per letter)
- [ ] Confirm backend edge functions are deployed

### Demand Letter Testing
- [ ] Test all 10 amount validation edge cases
- [ ] Test all 10 payment deadline edge cases
- [ ] Test all 11 payment method validation edge cases
- [ ] Test all 11 email & phone validation edge cases
- [ ] Test all 10 interest rate & legal costs edge cases
- [ ] Test all 10 required field validation edge cases
- [ ] Generate letter with valid data
- [ ] Verify generated PDF contains all sections
- [ ] Verify no [bracketed placeholders] remain

### Power of Attorney Testing
- [ ] Test all 9 date validation edge cases
- [ ] Test all 5 powers selection edge cases
- [ ] Test all 4 delegation validation edge cases
- [ ] Test all 6 termination validation edge cases
- [ ] Test all 7 party information edge cases
- [ ] Test all 4 jurisdiction edge cases
- [ ] Generate letter with valid data
- [ ] Verify notary requirements mentioned

### General Legal Letter Testing
- [ ] Test all 4 purpose & subject edge cases
- [ ] Test all 4 required action edge cases
- [ ] Test all 5 response deadline edge cases
- [ ] Test all 4 urgency validation edge cases
- [ ] Test all 4 legal basis edge cases
- [ ] Generate letter with minimal valid data
- [ ] Generate letter with maximal valid data
- [ ] Verify urgency/deadline warnings

### Cross-Cutting Testing
- [ ] Test all 6 character encoding edge cases
- [ ] Test all 6 field length boundary cases
- [ ] Test all 6 date format edge cases
- [ ] Test all 4 multiline text edge cases

---

## 7. EXPECTED VALIDATION BEHAVIOR SUMMARY

### ❌ MUST FAIL (Block submission)
- Empty required fields
- Invalid formats (email, phone, date)
- Out-of-range values (amount ≤ 0, interest rate > 50%)
- Missing payment method when all disabled
- Incomplete payment method details when enabled
- Expiry date before effective date (POA)
- No powers granted (POA)

### ⚠️ SHOULD WARN (Allow but warn)
- Past dates for deadlines
- Unrealistic values (interest 45%, notice 365 days)
- Urgency/deadline mismatches
- Very long text inputs (>5000 chars)
- Missing optional but recommended fields

### ✅ SHOULD PASS (Accept)
- Valid required fields
- Proper formats
- Reasonable values within ranges
- At least one payment method with complete details
- Valid date ranges
- At least one power granted (POA)

---

## 8. REGRESSION TEST SUITE

After any code changes, verify these continue to work:

1. **Demand Letter:** Generate with all payment methods enabled
2. **Demand Letter:** Generate with only bank transfer
3. **Demand Letter:** Generate with rental arrears type
4. **Power of Attorney:** Generate with all powers granted
5. **Power of Attorney:** Generate with limited powers
6. **Power of Attorney:** Generate with delegation allowed
7. **General Legal Letter:** Generate with minimal fields
8. **All Types:** Submit with missing required fields (should fail)
9. **All Types:** Review step displays all entered data correctly
10. **All Types:** Generated letter has correct structure and no placeholders

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-XX  
**Covers:** Demand Letter, Power of Attorney, General Legal Letter