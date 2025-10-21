import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LETTER_TYPE_TEMPLATES = {
  employment_termination: `Generate a formal employment termination letter following UAE labor law requirements.`,
  employment_contract: `Generate a comprehensive employment contract compliant with UAE labor law.`,
  lease_agreement: `Generate a residential/commercial lease agreement compliant with UAE RERA regulations.`,
  lease_termination: `Generate a formal lease termination notice following UAE tenancy laws.`,
  demand_letter: `Generate a formal demand letter for payment or action.`,
  nda: `Generate a non-disclosure agreement suitable for business use in the UAE. 
MUST include these mandatory clauses:
- Governing Law: "This Agreement shall be governed by and construed in accordance with the laws of the United Arab Emirates."
- Dispute Resolution: "Any dispute arising out of or in connection with this Agreement shall be resolved through [UAE courts/arbitration], with jurisdiction in [specific Emirate]."
Ensure these clauses are prominently placed near the end of the agreement, before the signature section.`,
  settlement_agreement: `Generate a settlement agreement for dispute resolution.`,
  power_of_attorney: `Generate a comprehensive Power of Attorney document compliant with UAE legal requirements and notarization standards.

CRITICAL REQUIREMENTS - MUST INCLUDE ALL OF THESE:

STRUCTURE & FORMATTING:
Use these EXACT section headers in order:
1. DOCUMENT TITLE & REFERENCE
2. PARTIES TO THE POWER OF ATTORNEY
3. RECITALS & BACKGROUND (Brief context)
4. APPOINTMENT OF ATTORNEY-IN-FACT
5. SCOPE OF POWERS GRANTED
6. LIMITATIONS & RESTRICTIONS
7. SUB-DELEGATION AUTHORITY
8. EFFECTIVE DATE & DURATION
9. REVOCATION PROVISIONS
10. RATIFICATION CLAUSE
11. CONFLICT WITH UAE LAW CLAUSE
12. GOVERNING LAW & DISPUTE RESOLUTION
13. DATA PROTECTION & CONFIDENTIALITY
14. NOTARIZATION & WITNESS REQUIREMENTS
15. SIGNATURE SECTION

LANGUAGE REQUIREMENTS:
- Use simple, clear sentences (maximum 20 words per sentence)
- Avoid complex legal jargon where possible - use plain business language
- Use bullet points and numbered lists for powers, limitations, and procedures
- Write in active voice
- Keep paragraphs short (3-4 sentences maximum)
- Use formal tone but ensure the Principal (grantor) can easily understand their rights and obligations

SCOPE OF POWERS - CLEAR CHECKBOX STRUCTURE:
Create a clear section listing powers with YES/NO indication for each:

"SCOPE OF POWERS GRANTED:

The Principal hereby grants the Attorney-in-Fact the following powers (as specifically indicated):

A. FINANCIAL POWERS: [YES/NO based on financialPowers field]
   ☑ Manage bank accounts, deposits, and withdrawals
   ☑ Pay bills, taxes, and financial obligations
   ☑ Invest, buy, or sell securities
   ☑ Access safe deposit boxes
   [Only include if financialPowers contains "Yes"]

B. PROPERTY POWERS: [YES/NO based on propertyPowers field]
   ☑ Buy, sell, lease, or mortgage real property
   ☑ Manage rental properties and collect rent
   ☑ Sign property documents and deeds
   ☑ Handle property maintenance and repairs
   [Only include if propertyPowers contains "Yes"]

C. LEGAL POWERS: [YES/NO based on legalPowers field]
   ☑ Sign contracts and legal agreements
   ☑ Initiate or defend legal proceedings
   ☑ Hire attorneys and legal representatives
   ☑ Settle legal disputes
   [Only include if legalPowers contains "Yes"]

D. BUSINESS POWERS: [YES/NO based on businessPowers field]
   ☑ Operate and manage business entities
   ☑ Sign business contracts and agreements
   ☑ Hire and terminate employees
   ☑ Make business decisions on behalf of the Principal
   [Only include if businessPowers contains "Yes"]

E. HEALTHCARE POWERS: [YES/NO based on healthcarePowers field]
   ☑ Make healthcare decisions (if permitted by UAE law)
   ☑ Access medical records
   ☑ Consent to medical treatment
   NOTE: Healthcare decisions may be limited under UAE law - confirm local jurisdiction requirements
   [Only include if healthcarePowers contains "Yes"]

F. GOVERNMENT & ADMINISTRATIVE POWERS: [YES/NO based on govPowers field]
   ☑ Interact with government authorities
   ☑ Submit applications and documents to ministries
   ☑ Obtain licenses, permits, and certificates
   ☑ Represent Principal in administrative matters
   [Only include if govPowers contains "Yes"]

POWERS EXPLICITLY EXCLUDED:
[List any powers that are NOT granted - based on fields that contain "No"]"

DELEGATION LIMITS & SUB-DELEGATION:
"SUB-DELEGATION AUTHORITY:

[If subDelegation contains "Allowed with restrictions"]
The Attorney-in-Fact MAY sub-delegate specific powers to third parties under the following conditions:
• Sub-delegation is permitted only for: [specific powers listed in additionalPowers if provided]
• Written consent from the Principal is required before any sub-delegation
• The Attorney-in-Fact remains fully responsible for acts of any sub-delegate
• Sub-delegation must be documented in writing and notarized
• The Principal must be notified within 7 days of any sub-delegation

[If subDelegation contains "Not allowed"]
The Attorney-in-Fact MAY NOT sub-delegate any powers granted under this Power of Attorney. All actions must be performed personally by the named Attorney-in-Fact.

[If subDelegation contains "Allowed without restrictions"]
The Attorney-in-Fact MAY sub-delegate powers to third parties at their discretion. However, the Attorney-in-Fact remains ultimately responsible for all acts performed under this Power of Attorney."

EFFECTIVE DATE & TERMINATION:
"EFFECTIVE DATE:
This Power of Attorney becomes effective on: [effectiveDate - format as DD MMMM YYYY]

[If durationType contains "Permanent"] This Power of Attorney remains in effect indefinitely until formally revoked by the Principal.
[If durationType contains "Fixed term"] This Power of Attorney expires automatically on: [expiryDate - format as DD MMMM YYYY]
[If durationType contains "Event-based"] This Power of Attorney terminates upon: [terminationEvent]

AUTOMATIC TERMINATION:
This Power of Attorney shall automatically terminate upon:
• Death of the Principal
• Mental incapacity of the Principal (unless this is a Durable Power of Attorney)
• Revocation by the Principal (see Revocation Provisions below)
[If expiryDate provided] • Expiry date: [expiryDate]
[If terminationEvent provided] • Occurrence of the specified termination event: [terminationEvent]

REVOCATION PROVISIONS:
The Principal reserves the right to revoke this Power of Attorney at any time by:
1. Providing written notice of revocation to the Attorney-in-Fact ([revocationNotice])
2. Having the revocation notarized by a UAE notary public
3. Notifying all third parties who have been provided copies of this Power of Attorney
4. Filing the revocation with relevant authorities (if originally filed)

Revocation becomes effective upon delivery of written notice to the Attorney-in-Fact, but the Principal should ensure all copies are retrieved and third parties are notified to prevent unauthorized use."

NOTARY & WITNESS REQUIREMENTS:
"NOTARIZATION & WITNESS REQUIREMENTS:

FOR LEGAL VALIDITY IN THE UAE, THIS POWER OF ATTORNEY MUST BE:

1. NOTARIZATION (MANDATORY):
   • This document must be notarized by a licensed UAE notary public or at a UAE notary public office in [emirate]
   • Both the Principal and Attorney-in-Fact should appear before the notary (or as required by local jurisdiction)
   • The notary will verify the identity of all parties using valid Emirates ID or passport
   • Notary fees apply (typically AED 50-200 depending on emirate and document complexity)

2. WITNESSES (REQUIRED):
   • Minimum of TWO (2) competent witnesses must be present during signing
   • Witnesses must be adults (18+ years old)
   • Witnesses must provide valid identification (Emirates ID or passport)
   • Witnesses should not be:
     - Family members of the Principal or Attorney-in-Fact
     - Beneficiaries of the Power of Attorney
     - Employees of the Principal (to avoid conflict of interest)

3. WITNESS INFORMATION:
   
   WITNESS 1:
   Name: [witness1Name]
   Emirates ID/Passport: [witness1EmiratesId]
   Contact Phone: [witness1Phone]
   Address: [witness1Address]
   Signature: ____________________

   WITNESS 2:
   Name: [witness2Name]
   Emirates ID/Passport: [witness2EmiratesId]
   Contact Phone: [witness2Phone]
   Address: [witness2Address]
   Signature: ____________________

4. ATTESTATION & LEGALIZATION (if applicable):
   • If this Power of Attorney will be used outside the UAE, it may require:
     - UAE Ministry of Foreign Affairs (MOFA) attestation
     - Embassy legalization of the destination country
   • Consult with the notary or legal advisor if international use is intended

5. NOTARY'S CERTIFICATION:
   The notary will affix an official stamp and signature certifying:
   • Identity verification of all parties
   • Voluntary signing by the Principal
   • Witnesses' attestation
   • Compliance with UAE notarization requirements"

DATA PROTECTION & CONFIDENTIALITY:
"DATA PROTECTION & CONFIDENTIALITY:

This Power of Attorney contains personal data protected under UAE Federal Law No. 45 of 2021 (Personal Data Protection Law - PDPL).

PERSONAL DATA COLLECTED:
• Principal's full name, Emirates ID/passport number, contact details
• Attorney-in-Fact's full name, Emirates ID/passport number, contact details
• Witnesses' identification and contact information
• Scope of powers and any financial/property information disclosed

WHO CAN ACCESS THIS DATA:
Access to this Power of Attorney and the personal data contained herein is restricted to:
• The Principal (grantor)
• The Attorney-in-Fact (agent)
• Authorized legal representatives of the Principal
• UAE notary public and government authorities (as required by law)
• Third parties specifically authorized in writing by the Principal for legitimate purposes related to the powers granted
• Courts and law enforcement (if legally required)

PURPOSE OF DATA PROCESSING:
Personal data is processed solely for the purpose of:
• Executing the powers granted in this Power of Attorney
• Verifying identity of parties for legal and notarization purposes
• Fulfilling legal and regulatory obligations
• Maintaining records as required by UAE law

DATA RETENTION:
• This Power of Attorney and associated personal data will be retained for the duration of the power of attorney plus a minimum of 5 years as required by UAE legal record-keeping requirements
• Upon revocation, the Principal may request return or destruction of copies, subject to mandatory legal retention periods

DATA SUBJECT RIGHTS:
Under UAE PDPL, parties have the right to:
• Access their personal data contained in this document
• Request correction of inaccurate data
• Object to data processing (subject to legal requirements)
• Lodge complaints with the UAE Data Protection Office

CONFIDENTIALITY:
The Attorney-in-Fact agrees to:
• Keep all information obtained through this Power of Attorney strictly confidential
• Not disclose the Principal's personal, financial, or business information to unauthorized parties
• Use information solely for purposes authorized by this Power of Attorney
• Take reasonable security measures to protect confidential information"

RATIFICATION CLAUSE (SIMPLIFIED):
"RATIFICATION OF ACTS:

The Principal hereby ratifies and confirms all acts lawfully performed by the Attorney-in-Fact under this Power of Attorney.

WHAT THIS MEANS:
• The Principal agrees in advance that any actions taken by the Attorney-in-Fact within the scope of granted powers are legally binding on the Principal
• The Principal accepts responsibility for the Attorney-in-Fact's actions as if the Principal had performed them personally
• This ratification applies ONLY to actions within the scope of powers granted - it does not cover unauthorized acts

LIMITATION:
• Actions taken outside the scope of granted powers are NOT ratified
• Fraudulent or illegal acts are NOT ratified
• Acts performed after revocation or expiry are NOT ratified"

CONFLICT WITH UAE LAW CLAUSE:
"CONFLICT WITH UAE LAW:

SUPREMACY OF UAE LAW:
This Power of Attorney is subject to the laws of the United Arab Emirates. Any provision of this Power of Attorney that conflicts with, violates, or is prohibited by UAE federal or emirate-specific laws is:
• Void and unenforceable
• Automatically severed from this document
• Not binding on any party

The remaining provisions of this Power of Attorney shall remain in full force and effect.

PROHIBITED ACTS:
The Attorney-in-Fact may NOT use this Power of Attorney to perform any act that:
• Violates UAE criminal law (Federal Law No. 31 of 2021 - UAE Penal Code)
• Violates UAE civil law (Federal Law No. 5 of 1985 - Civil Transactions Law)
• Breaches public policy or Islamic Sharia principles as applied in the UAE
• Involves illegal transactions, money laundering, or fraud
• Violates regulatory requirements of UAE government authorities

Any such act is void and provides grounds for immediate revocation and potential legal liability."

GOVERNING LAW & DISPUTE RESOLUTION:
"GOVERNING LAW:
This Power of Attorney is governed by and construed in accordance with:
• UAE Federal Law No. 5 of 1985 (Civil Transactions Law - Civil Code), as amended
• UAE Federal Law No. 10 of 1993 (Civil Procedure Law), as amended
• Any other applicable UAE federal and [emirate]-specific laws and regulations

DISPUTE RESOLUTION:
In the event of any dispute arising from or relating to this Power of Attorney:

1. NEGOTIATION (First Step):
   Parties agree to attempt to resolve disputes through good-faith negotiation

2. MEDIATION (Optional Second Step):
   If negotiation fails, parties may agree to mediation through an accredited UAE mediation center

3. JURISDICTION (Final Step):
   Any unresolved disputes shall be subject to the exclusive jurisdiction of the competent courts of [emirate], United Arab Emirates

APPLICABLE COURT:
• Civil disputes: [emirate] Court of First Instance
• Appeals: [emirate] Court of Appeal
• Final appeals: Federal Supreme Court (if applicable)

NOTE: The Attorney-in-Fact may not use this Power of Attorney to waive the Principal's right to bring legal claims or to settle disputes without the Principal's express written consent (unless such power is explicitly granted)."

PROFESSIONAL FORMATTING:
- Use proper document header with "POWER OF ATTORNEY" title
- Include reference number if provided
- Use clear section headers (UPPERCASE, bold)
- Use numbered lists and bullet points
- Include signature lines for:
  * Principal (Grantor): [principalFullName]
  * Attorney-in-Fact (Agent): [attorneyFullName]
  * Witness 1: [witness1Name]
  * Witness 2: [witness2Name]
  * Notary Public
- Include spaces for Emirates ID/Passport numbers, dates, and contact information

PLACEHOLDERS:
Replace ALL bracketed placeholders with actual information provided:
- [principalFullName] → actual principal name
- [principalEmiratesId] → actual principal Emirates ID/Passport
- [principalAddress] → actual principal address
- [principalPhone] → actual principal phone
- [principalEmail] → actual principal email
- [attorneyFullName] → actual attorney-in-fact name
- [attorneyEmiratesId] → actual attorney Emirates ID/Passport
- [attorneyAddress] → actual attorney address
- [attorneyPhone] → actual attorney phone
- [attorneyEmail] → actual attorney email
- [attorneyRelationship] → actual relationship
- [emirate] → actual emirate for jurisdiction
- [effectiveDate] → actual start date (format: DD MMMM YYYY)
- [expiryDate] → actual expiry date if provided (format: DD MMMM YYYY)
- [terminationEvent] → specific event if provided
- [compensation] → compensation arrangement
- [compensationAmount] → specific amount if provided
- [accountingFrequency] → accounting frequency
- [purposeContext] → purpose/context
- Do NOT leave any [bracketed text] in the final output

ADDITIONAL CONTEXT:
Include purposeContext field content in the RECITALS & BACKGROUND section.
If additionalPowers field is provided, include in SCOPE OF POWERS section.
If explicitLimitations field is provided, include in LIMITATIONS & RESTRICTIONS section.`,
  workplace_complaint: `Generate a formal workplace complaint letter following UAE Federal Decree-Law No. 33 of 2021 (Labor Law) and HR best practices.

CRITICAL REQUIREMENTS - MUST INCLUDE ALL OF THESE:

STRUCTURE & FORMATTING:
Use these EXACT section headers in order:
1. COMPLAINANT DETAILS
2. INCIDENT DETAILS
3. WITNESS INFORMATION (if applicable)
4. NATURE OF COMPLAINT
5. IMPACT & EVIDENCE
6. ACTION REQUESTED
7. INVESTIGATION PROCESS & TIMELINE
8. APPLICABLE LAW & DISPUTE RESOLUTION
9. DATA PROTECTION NOTICE
10. CONFIDENTIALITY STATEMENT
11. ACKNOWLEDGMENT OF RECEIPT

LANGUAGE REQUIREMENTS:
- Use simple, clear sentences (maximum 20 words per sentence)
- Avoid legal jargon where possible
- Use bullet points for lists and action steps
- Write in plain language suitable for HR personnel and employees
- Keep paragraphs short (3-4 sentences maximum)
- Use active voice, not passive

LEGAL COMPLIANCE:
- Reference UAE Labor Law (Federal Decree-Law No. 33 of 2021)
- Include UAE PDPL compliance (Federal Law No. 45 of 2021)
- Specify dispute resolution pathway: Internal HR → Ministry of Human Resources and Emiratisation (MOHRE) → Labor Courts
- Include employee rights under UAE labor law

WITNESS INFORMATION:
- If witnesses are mentioned, format as:
  • Full Name: [Name]
  • Position/Department: [Role]
  • Contact Information: [Email/Phone]
  • Relationship to Incident: [Brief description]
- If witness details are incomplete, add note: "Additional witness details will be collected during the investigation process."

INVESTIGATION PROCESS:
Include a detailed section with:
- Expected timeline: "Investigation will be completed within 7-14 business days from receipt of this complaint."
- Steps: Initial review → Investigation initiation → Witness interviews → Evidence collection → Findings report → Resolution
- Responsible party: "This complaint will be investigated by the Human Resources Department in coordination with relevant management."
- Progress updates: "The complainant will be updated on investigation progress at least every 5 business days."

CONFIDENTIALITY:
Include explicit statement:
"CONFIDENTIALITY STATEMENT
This complaint and all related investigation materials are strictly confidential. Access is limited to:
- The complainant
- Authorized HR personnel
- Management directly involved in the investigation
- Legal counsel (if required)

Unauthorized disclosure of complaint details may result in disciplinary action. All parties involved are required to maintain confidentiality throughout the investigation process and after its conclusion."

ACKNOWLEDGMENT SECTION:
End with:
"ACKNOWLEDGMENT OF RECEIPT

This formal workplace complaint was received by:

HR Representative Name: _______________________
Position: _____________________
Department: Human Resources
Date of Receipt: ________________________
Time of Receipt: ________________________
Signature: ____________________

A copy of this acknowledgment will be provided to the complainant within 24 hours of receipt."`,
  general_legal: `Generate a comprehensive formal legal letter following UAE legal standards and best practices.

CRITICAL REQUIREMENTS - MUST INCLUDE ALL OF THESE:

STRUCTURE & FORMATTING:
Use these EXACT section headers (include only those relevant to the letter purpose):
1. REFERENCE & DATE
2. PARTIES
3. BACKGROUND / CONTEXT
4. NATURE OF MATTER / ISSUE
5. LEGAL BASIS & APPLICABLE LAW
6. BREACH / VIOLATION / GROUNDS (if applicable)
7. REQUIRED ACTION & ACTIONABLE TIMELINE
8. LEGAL CONSEQUENCES OF NON-COMPLIANCE (if applicable)
9. GOVERNING LAW & DISPUTE RESOLUTION
10. CONFIDENTIALITY CLAUSE
11. DATA PROTECTION NOTICE
12. RESERVATION OF RIGHTS
13. SIGNATURE SECTION

LANGUAGE REQUIREMENTS:
- Use simple, clear sentences (maximum 20 words per sentence where possible)
- Avoid unnecessary legal jargon; use plain business language
- Use bullet points for lists of demands, actions, or consequences
- Write in active voice, not passive
- Keep paragraphs short (3-4 sentences maximum)
- Use formal but accessible tone suitable for business correspondence

LEGAL REFERENCES - UAE LAW ACCURACY:
When citing UAE laws, you MUST:
- Verify the law number and year (e.g., Federal Law No. 5 of 1985 is Civil Transactions Law)
- Use current, applicable legislation (check if laws have been amended or replaced)
- Common UAE laws to reference correctly:
  * Civil Transactions Law: Federal Law No. 5 of 1985 (Civil Code) - as amended
  * Commercial Companies Law: Federal Law No. 2 of 2015 - as amended by Federal Decree-Law No. 32 of 2021
  * Commercial Transactions Law: Federal Law No. 18 of 1993
  * UAE Labor Law: Federal Decree-Law No. 33 of 2021
  * Personal Data Protection Law (PDPL): Federal Law No. 45 of 2021
  * Consumer Protection Law: Federal Law No. 15 of 2020
  * Penal Code: Federal Law No. 31 of 2021
- Only cite laws that are directly relevant to the matter at hand
- If law citation is uncertain, use general language: "in accordance with applicable UAE federal and emirate laws"

ACTIONABLE DEADLINES & CONSEQUENCES:
- Specify exact dates (e.g., "by 15th April 2025") OR calendar days (e.g., "within 14 calendar days from receipt of this letter")
- Ensure deadlines are realistic and reasonable (typically 7-30 calendar days for compliance)
- Clearly state what action is required within the deadline
- Specify measurable compliance criteria
- Detail consequences of non-compliance (e.g., "legal proceedings will be initiated," "damages will be claimed," "contract termination")
- Use this format:
  "REQUIRED ACTION:
  You are hereby required to [specific action] by [exact date] or within [X calendar days] from receipt of this letter.
  
  CONSEQUENCES OF NON-COMPLIANCE:
  Failure to comply within the specified timeline will result in:
  • [Consequence 1]
  • [Consequence 2]
  • [Legal action without further notice]"

GOVERNING LAW & DISPUTE RESOLUTION:
ALWAYS include this section near the end:
"GOVERNING LAW:
This matter is governed by the laws of the United Arab Emirates, specifically [applicable UAE federal laws and relevant emirate-specific regulations].

DISPUTE RESOLUTION:
In the event this matter is not resolved amicably, disputes shall be subject to the exclusive jurisdiction of the courts of [Emirate: Dubai, Abu Dhabi, etc.], United Arab Emirates. [Alternative: Parties may agree to resolve disputes through arbitration under the UAE Arbitration Law (Federal Law No. 6 of 2018)]."

CONFIDENTIALITY CLAUSE:
For sensitive matters, ALWAYS include:
"CONFIDENTIALITY:
This letter and its contents are strictly confidential and intended solely for the addressee named above. Unauthorized disclosure, copying, distribution, or use of this letter by any person other than the intended recipient is strictly prohibited and may constitute a breach of confidentiality. If you have received this letter in error, please notify the sender immediately and destroy all copies."

DATA PROTECTION:
Include reference to UAE PDPL:
"This letter contains personal and/or business information protected under UAE Federal Law No. 45 of 2021 (PDPL). All parties must handle this information in accordance with applicable data protection regulations."

RESERVATION OF RIGHTS:
End with:
"RESERVATION OF RIGHTS:
Nothing in this letter shall be construed as a waiver of any rights, remedies, or defenses available to [Sender Name] under UAE law. All rights are expressly reserved, including but not limited to the right to seek damages, specific performance, injunctive relief, or any other legal or equitable remedies."

PROFESSIONAL FORMATTING:
- Use proper formal letter header with sender details, recipient details, date, and reference number
- Include clear subject line summarizing the matter
- Use "Dear [Title] [Name]," salutation
- End with "Yours faithfully," or "Yours sincerely," followed by signature section
- Include sender contact information at the bottom

PLACEHOLDERS:
Replace ALL bracketed placeholders with actual information provided in the letter details:
- [Sender Name] → actual sender name
- [Recipient Name] → actual recipient name
- [Specific date] → actual deadline date
- [Emirate] → actual emirate for jurisdiction
- [Amount] → actual monetary amount if applicable
- Do NOT leave any [bracketed text] in the final output unless explicitly asking recipient to fill it in`
};

const DATA_PROTECTION_CLAUSES = {
  employment: `\n\nDATA PROTECTION NOTICE:\nAll personal data collected and processed in this document is handled in accordance with UAE Federal Law No. 45 of 2021 on the Protection of Personal Data (PDPL). The parties agree to process personal data only for the purposes stated herein and to maintain appropriate security measures. Employee records will be retained as per UAE labor law requirements and securely disposed of thereafter.`,
  
  lease: `\n\nDATA PROTECTION NOTICE:\nThe personal information contained in this agreement shall be processed in compliance with UAE Federal Law No. 45 of 2021 on the Protection of Personal Data (PDPL). Both parties commit to protecting each other's personal data and using it solely for the purposes of this tenancy/lease agreement. Personal data will be retained for the duration of the tenancy and for any legally required period thereafter.`,
  
  nda: `\n\nDATA PROTECTION NOTICE:\nThis agreement acknowledges that confidential information may include personal data protected under UAE Federal Law No. 45 of 2021 (PDPL). All parties agree to process any personal data in accordance with applicable data protection regulations and maintain confidentiality as specified herein.`,
  
  workplace_complaint: `\n\nDATA PROTECTION NOTICE:

This workplace complaint contains personal data protected under UAE Federal Law No. 45 of 2021 on the Protection of Personal Data (PDPL).

PERSONAL DATA COLLECTED:
- Complainant information (name, position, contact details)
- Respondent information (if applicable)
- Witness information
- Incident details and descriptions
- Supporting evidence

DATA PROCESSING:
All personal information collected in this complaint will be:
- Processed solely for investigating this workplace complaint
- Accessed only by authorized HR personnel, relevant management, and legal counsel
- Stored securely in compliance with company data retention policies
- Retained for the minimum period required by UAE labor law (2 years from case closure)
- Not disclosed to third parties except as required by law or with explicit consent

DATA SUBJECT RIGHTS:
Under UAE PDPL, you have the right to:
- Access your personal data held in relation to this complaint
- Request correction of inaccurate personal data
- Request deletion of personal data (subject to legal retention requirements)
- Withdraw consent for processing (where consent is the legal basis)
- Lodge a complaint with the UAE Data Protection Office

For data protection inquiries, contact your HR Department or Data Protection Officer.`,
  
  general: `\n\nDATA PROTECTION NOTICE:\nThis document contains personal data that is protected under UAE Federal Law No. 45 of 2021 on the Protection of Personal Data. All parties must handle this information in accordance with applicable data protection regulations and use it only for the purposes stated in this document.`
};

const NDA_LEGAL_CLAUSES = `

GOVERNING LAW:
This Agreement shall be governed by and construed in accordance with the laws of the United Arab Emirates.

DISPUTE RESOLUTION:
Any dispute arising out of or in connection with this Agreement shall be resolved through [UAE courts/arbitration], with jurisdiction in [specific Emirate].

NOTE: The parties should specify their preferred dispute resolution method (courts or arbitration) and the specific Emirate (Dubai, Abu Dhabi, etc.) for jurisdiction.`;

const WORKPLACE_COMPLAINT_LEGAL_CLAUSES = `

APPLICABLE LAW & DISPUTE RESOLUTION:

GOVERNING LEGISLATION:
This complaint is filed under UAE Federal Decree-Law No. 33 of 2021 on the Regulation of Labour Relations (UAE Labor Law).

DISPUTE RESOLUTION PATHWAY:

1. INTERNAL RESOLUTION (First Stage):
   This complaint will be handled through the company's internal HR processes and management review. The company commits to conducting a fair, impartial, and thorough investigation.

2. MINISTRY OF HUMAN RESOURCES AND EMIRATISATION - MOHRE (Second Stage):
   If internal resolution is unsuccessful or unsatisfactory, either party may escalate the matter to MOHRE for mediation within 30 calendar days of the conclusion of internal proceedings.

3. UAE LABOR COURTS (Third Stage):
   If MOHRE mediation does not resolve the dispute, the matter may be referred to the competent UAE Labor Court. The jurisdiction will be determined by the emirate where the employment relationship is registered.

4. ALTERNATIVE DISPUTE RESOLUTION (Optional):
   The company may offer arbitration or mediation through an accredited ADR provider as an alternative to court proceedings, subject to mutual written agreement of both parties.

EMPLOYEE RIGHTS UNDER UAE LABOR LAW:

The complainant has the following protected rights:
✓ Right to be informed of investigation progress and preliminary findings
✓ Right to provide additional evidence or identify additional witnesses
✓ Right to be protected from retaliation, discrimination, or adverse employment action for filing this complaint in good faith
✓ Right to seek external assistance from MOHRE if internal resolution is inadequate
✓ Right to legal representation if the matter proceeds to formal dispute resolution or court
✓ Right to confidentiality throughout the investigation process
✓ Right to appeal investigation findings through internal mechanisms

RETALIATION PROHIBITION:

Retaliation against employees who file good-faith workplace complaints is strictly prohibited under UAE labor law. Prohibited retaliatory actions include:
- Termination or suspension
- Demotion or reduction in pay
- Unfavorable schedule changes
- Exclusion from meetings or projects
- Negative performance evaluations not based on legitimate performance issues
- Creating a hostile work environment

Any retaliation must be reported immediately to HR and may result in:
- Disciplinary action against the retaliating party
- Penalties against the employer under UAE labor law
- Potential criminal charges under UAE Penal Code

COMPLAINT VALIDITY:

This complaint is made in good faith based on the complainant's honest belief. The complainant understands that:
- All information provided must be truthful and accurate
- False or malicious complaints may result in disciplinary action
- The investigation will be conducted impartially and based on evidence
- Outcomes will be determined based on factual findings and applicable policies

ADDITIONAL NOTES:

- The complainant may request updates on the investigation status at reasonable intervals
- All parties have a duty to cooperate fully with the investigation
- The complainant should preserve all relevant evidence (emails, messages, documents)
- This complaint does not waive any legal rights the complainant may have under UAE law
- Time limits for filing complaints with MOHRE or courts may apply - seek legal advice if needed`;

const GENERAL_LEGAL_CLAUSES = `

GOVERNING LAW & DISPUTE RESOLUTION:

GOVERNING LAW:
This matter, and any disputes arising from or related to it, shall be governed by and construed in accordance with the laws of the United Arab Emirates. Applicable UAE federal laws include but are not limited to:
- Federal Law No. 5 of 1985 (Civil Transactions Law - Civil Code), as amended
- Federal Law No. 18 of 1993 (Commercial Transactions Law), as amended
- Other relevant federal and emirate-specific legislation as applicable to this matter

DISPUTE RESOLUTION:
In the event that this matter cannot be resolved amicably between the parties, any disputes, claims, or controversies arising from or relating to this matter shall be subject to the exclusive jurisdiction of the competent courts of [EMIRATE], United Arab Emirates.

Alternative Dispute Resolution (Optional): The parties may, by mutual written agreement, elect to resolve disputes through:
- Mediation: Under the rules of an accredited UAE mediation center
- Arbitration: In accordance with UAE Federal Law No. 6 of 2018 on Arbitration, conducted in the UAE

CONFIDENTIALITY:

This letter and all information contained herein are strictly confidential and are intended solely for the use of the addressee named above ("Intended Recipient").

CONFIDENTIALITY OBLIGATIONS:
- This letter may not be disclosed, reproduced, distributed, or used by any person or entity other than the Intended Recipient without the express prior written consent of the sender.
- Unauthorized disclosure or use of this letter may result in legal action for breach of confidentiality, breach of privacy, or other applicable legal remedies under UAE law.
- If you are not the Intended Recipient, you are hereby notified that any review, dissemination, distribution, copying, or other use of this letter is strictly prohibited.

ERROR RECEIPT NOTIFICATION:
If you have received this letter in error, please:
1. Notify the sender immediately via the contact details provided
2. Destroy or permanently delete all copies of this letter
3. Refrain from using or disclosing any information contained herein

RESERVATION OF RIGHTS:

The sender expressly reserves all rights, remedies, defenses, and claims available under UAE law and applicable international conventions to which the UAE is a signatory.

RIGHTS RESERVED INCLUDE:
- The right to seek monetary damages, compensation, or restitution
- The right to seek specific performance or injunctive relief
- The right to pursue civil or criminal proceedings as applicable
- The right to seek interest, costs, and legal fees
- The right to pursue alternative dispute resolution mechanisms
- The right to amend or supplement claims based on subsequently discovered facts

WAIVER DISCLAIMER:
Nothing in this letter shall be construed as:
- A waiver of any rights or remedies
- An admission of liability or wrongdoing (unless explicitly stated)
- A release of any claims or defenses
- An agreement to terms not expressly stated herein

TIME LIMITATION:
All rights and remedies shall be preserved regardless of the passage of time, subject only to applicable statutory limitation periods under UAE law.

This letter does not constitute a complete or final settlement of any matters discussed herein unless explicitly stated otherwise. All rights not expressly waived or released remain in full force and effect.`;

const POWER_OF_ATTORNEY_CLAUSES = `

ADDITIONAL LEGAL PROVISIONS FOR POWER OF ATTORNEY:

FIDUCIARY DUTY:
The Attorney-in-Fact acknowledges and agrees that they owe a fiduciary duty to the Principal, which includes:
• Duty of Loyalty: Acting in the Principal's best interests at all times
• Duty of Care: Exercising reasonable care, skill, and diligence
• Duty of Good Faith: Acting honestly and transparently
• Duty to Account: Maintaining accurate records of all transactions and providing accountings upon request
• Duty to Avoid Conflicts of Interest: Not using the power for personal benefit unless explicitly authorized

RECORD-KEEPING REQUIREMENTS:
The Attorney-in-Fact shall:
• Maintain detailed records of all transactions performed under this Power of Attorney
• Keep the Principal's funds and property separate from the Attorney-in-Fact's personal funds
• Provide written accountings to the Principal upon request (or at regular intervals if specified)
• Retain all receipts, contracts, and documentation for a minimum of 5 years

PROHIBITED SELF-DEALING:
Unless explicitly authorized in writing, the Attorney-in-Fact may NOT:
• Make gifts of the Principal's property to themselves or their family members
• Borrow money from the Principal or use the Principal's assets as collateral
• Enter into contracts where the Attorney-in-Fact has a personal interest
• Transfer the Principal's property to the Attorney-in-Fact except for reasonable compensation

THIRD PARTY RELIANCE:
Third parties (banks, government agencies, businesses) may rely on this Power of Attorney if:
• It appears genuine and has been properly notarized
• The third party has no actual knowledge of revocation
• The third party acts in good faith
• The action requested is within the scope of granted powers

The Principal agrees that third parties who rely on this Power of Attorney in good faith shall not be liable for actions taken before receiving notice of revocation.

LIABILITY & INDEMNIFICATION:
• The Attorney-in-Fact is personally liable for:
  - Fraudulent acts or willful misconduct
  - Gross negligence in performing duties
  - Acts outside the scope of granted powers
  - Acts performed after revocation or expiry

• The Principal agrees to indemnify and hold harmless the Attorney-in-Fact for reasonable acts performed in good faith within the scope of authority, provided such acts do not constitute fraud, gross negligence, or willful misconduct.

COMPENSATION:
[Insert compensation details based on compensation field]

COPIES & VALIDITY:
• Photocopies, scanned copies, and certified copies of this Power of Attorney shall have the same legal effect as the original
• The Principal may execute multiple originals, all of which shall be considered one instrument
• If any copy is lost or destroyed, the Principal may execute a replacement copy with the same effective date

AMENDMENTS:
This Power of Attorney may only be amended by:
• Written agreement signed by both the Principal and Attorney-in-Fact
• Notarization of the amendment
• Notification to all parties who received copies of the original

No oral amendments or modifications are valid.

SURVIVAL:
The provisions regarding record-keeping, confidentiality, data protection, and liability shall survive the termination or revocation of this Power of Attorney.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { letterType, details, conversationContext } = await req.json();

    if (!letterType || !details) {
      return new Response(
        JSON.stringify({ error: "Letter type and details are required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check user credits (queries_used is the DB column name but represents credits)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('queries_used, max_credits_per_period, subscription_tier')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "User profile not found" }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const creditsNeeded = 5; // Letter generation costs 5 credits
    const creditsUsed = profile.queries_used || 0; // DB column is queries_used but tracks credits
    const creditsLimit = profile.max_credits_per_period || 0;
    
    if (creditsUsed + creditsNeeded > creditsLimit) {
      return new Response(
        JSON.stringify({ 
          error: "Insufficient credits",
          creditsNeeded,
          creditsAvailable: creditsLimit - creditsUsed
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const templatePrompt = LETTER_TYPE_TEMPLATES[letterType as keyof typeof LETTER_TYPE_TEMPLATES] 
      || LETTER_TYPE_TEMPLATES.general_legal;

    const systemPrompt = `You are an expert legal document generator specializing in UAE law.

${templatePrompt}

Requirements:
- Use formal, professional legal language
- Include all necessary legal clauses and provisions
- Follow UAE legal formatting standards
- Make the letter clear, comprehensive, and legally sound
- Use proper date format: [Date will be inserted]
- Include signature lines and notary sections where appropriate
- Reference relevant UAE laws when applicable
- IMPORTANT: Comply with UAE Federal Law No. 45 of 2021 on the Protection of Personal Data (PDPL)
- Include appropriate data protection language for any personal information processed

Structure the letter properly with:
1. Header (letterhead information if provided)
2. Date
3. Recipient information
4. Subject line
5. Main content with proper paragraphs
6. Closing
7. Signature lines

Return ONLY the letter content in plain text format, ready to be saved and used.`;

    const userPrompt = `Generate a ${letterType.replace(/_/g, ' ')} with the following details:

${Object.entries(details).map(([key, value]) => `${key}: ${value}`).join('\n')}

${conversationContext ? `\nContext from conversation:\n${conversationContext}` : ''}

Generate the complete letter now.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds to your workspace." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Letter generation failed" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    let letterContent = data.choices?.[0]?.message?.content;

    if (!letterContent) {
      return new Response(
        JSON.stringify({ error: "Failed to generate letter content" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Append appropriate data protection clause based on letter type
    const dataProtectionClause = 
      letterType.includes('employment') ? DATA_PROTECTION_CLAUSES.employment :
      letterType.includes('lease') ? DATA_PROTECTION_CLAUSES.lease :
      letterType === 'nda' ? DATA_PROTECTION_CLAUSES.nda :
      letterType === 'workplace_complaint' ? DATA_PROTECTION_CLAUSES.workplace_complaint :
      letterType === 'general_legal' ? DATA_PROTECTION_CLAUSES.general :
      DATA_PROTECTION_CLAUSES.general;
    
    letterContent += dataProtectionClause;

    // Add letter-type-specific legal clauses
    if (letterType === 'nda') {
      letterContent += NDA_LEGAL_CLAUSES;
    }

    if (letterType === 'workplace_complaint') {
      letterContent += WORKPLACE_COMPLAINT_LEGAL_CLAUSES;
    }

    if (letterType === 'general_legal') {
      letterContent += GENERAL_LEGAL_CLAUSES;
    }

    if (letterType === 'power_of_attorney') {
      letterContent += POWER_OF_ATTORNEY_CLAUSES;
    }

    // Deduct credits (queries_used is the DB column name)
    await supabase
      .from('profiles')
      .update({ queries_used: creditsUsed + creditsNeeded })
      .eq('user_id', user.id);

    console.log(`Letter generated for user ${user.id}, ${creditsNeeded} credits deducted`);

    return new Response(
      JSON.stringify({ 
        content: letterContent,
        creditsUsed: creditsNeeded
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in generate-legal-letter:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
