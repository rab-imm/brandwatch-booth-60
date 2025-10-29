import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LETTER_TYPE_TEMPLATES = {
  employment_termination: `Generate a comprehensive Employment Termination Letter compliant with UAE Federal Decree-Law No. 33 of 2021 (Labor Law) and Personal Data Protection Law (PDPL).

CRITICAL REQUIREMENTS - MUST INCLUDE ALL OF THESE:

STRUCTURE & FORMATTING:
Use these EXACT section headers in order:
1. DOCUMENT HEADER & REFERENCE
2. RECIPIENT INFORMATION (Employee Details)
3. SUBJECT LINE
4. TERMINATION NOTICE
5. TERMINATION DETAILS
6. END-OF-SERVICE BENEFITS BREAKDOWN
7. COMPANY PROPERTY RETURN REQUIREMENTS
8. FINAL SETTLEMENT PROCESS
9. CONFIDENTIALITY & NON-DISCLOSURE OBLIGATIONS
10. NON-COMPETE CLAUSE (if applicable)
11. DATA PROTECTION & PDPL COMPLIANCE
12. LEGAL DISCLAIMER
13. NEXT STEPS & CONTACTS
14. GOVERNING LAW & DISPUTE RESOLUTION
15. SIGNATURE SECTION

LANGUAGE REQUIREMENTS:
- Use simple, clear sentences (maximum 20 words per sentence)
- Avoid unnecessary legal jargon; use plain business language
- Use bullet points for benefits, property, and instructions
- Write in active voice, not passive
- Keep paragraphs short (3-4 sentences maximum)

DOCUMENT HEADER:
"[companyName]
[companyAddress]

Reference: TERM-[employeeId]-[current date]
Date: [noticeDate format DD MMMM YYYY]

EMPLOYMENT TERMINATION LETTER

STRICTLY CONFIDENTIAL"

RECIPIENT INFORMATION:
"TO:
[employeeName]
Employee ID: [employeeId]
Position: [position]
Department: [department if provided]
Emirates ID/Passport: [emiratesIdOrPassport]
Email: [employeeEmail]
Address: [employeeAddress]"

SUBJECT LINE:
"SUBJECT: NOTICE OF EMPLOYMENT TERMINATION"

TERMINATION NOTICE:
"Dear [employeeName],

We write to inform you that your employment with [companyName] will be terminated effective [terminationDate format DD MMMM YYYY].

TERMINATION DETAILS:

Reason for Termination: [terminationReason]
Detailed Explanation: [detailedReason]

Notice Date: [noticeDate format DD MMMM YYYY]
Final Working Day: [finalWorkingDay format DD MMMM YYYY]
Termination Effective Date: [terminationDate format DD MMMM YYYY]

NOTICE PERIOD COMPLIANCE:
• Required Notice Period: [noticePeriodRequired] days (as per your employment contract)
• Notice Period Provided: [noticePeriodProvided] days
• Status: [noticePeriodCompliance]
[If noticePeriodProvided less than noticePeriodRequired: "You will receive payment in lieu of the shortfall of [difference] days."]"

END-OF-SERVICE BENEFITS BREAKDOWN:
"END-OF-SERVICE BENEFITS:

You are entitled to the following end-of-service benefits calculated in accordance with UAE Federal Decree-Law No. 33 of 2021 (Labor Law):

1. NOTICE PERIOD PAY:
   Period: [noticePeriodPay] days
   Daily Rate: AED [basicSalary divided by 30]
   Amount: AED [noticePeriodPayAmount]

2. ACCRUED ANNUAL LEAVE:
   Unused Leave Days: [accruedLeave] days
   Daily Rate: AED [basicSalary divided by 30]
   Amount: AED [annualLeavePayAmount if provided]

3. END-OF-SERVICE GRATUITY:
   Years of Service: [gratuityYears] years
   Calculation Basis: Articles 51-54 of UAE Labor Law
   [If gratuityYears less than 1: "Not eligible (less than 1 year service)"]
   [If 1-5 years: "21 days basic salary per year × [gratuityYears] years"]
   [If over 5 years: "21 days × 5 years + 30 days × [years beyond 5] years"]
   Gratuity Amount: AED [gratuityAmount]

4. REPATRIATION BENEFIT:
   Flight Ticket: [repatriationBenefit]
   [If repatriationDestination provided: "Destination: [repatriationDestination]"]
   [If cash equivalent: "Cash Equivalent: AED [repatriationAmount if provided]"]

5. OTHER DUES:
   [If otherDues provided: "[otherDues]: AED [otherDuesAmount]"]
   [If no otherDues: "None"]

───────────────────────────────────────────
TOTAL FINAL SETTLEMENT: AED [totalSettlement]
───────────────────────────────────────────

All amounts calculated based on your basic monthly salary of AED [basicSalary]."

COMPANY PROPERTY RETURN REQUIREMENTS:
"COMPANY PROPERTY RETURN:

[If propertyToReturn is "Yes":]
You are required to return ALL company property on or before [propertyReturnDeadline format DD MMMM YYYY]:

ITEMS TO RETURN:
[If laptopDetails provided: "• Company Laptop: [laptopDetails]"]
[If mobilePhone provided: "• Company Mobile Phone: [mobilePhone]"]
[If accessCards provided: "• Access Cards/Keys: [accessCards]"]
[If documentsToReturn provided: "• Documents/Files: [documentsToReturn]"]
[If otherProperty provided: "• Other Property: [otherProperty]"]

RETURN PROCESS:
• Where: HR Department, [companyAddress]
• When: On or before [propertyReturnDeadline format DD MMMM YYYY]
• Contact: [hrEmail] / [hrPhone]

CONSEQUENCES OF NON-RETURN:
[consequencesNonReturn]

[If propertyToReturn is "No":]
No company property return required."

FINAL SETTLEMENT PROCESS:
"FINAL SETTLEMENT PAYMENT:

TIMELINE:
• Settlement will be processed within [settlementTimeline]
• Expected payment date: [calculate based on settlementTimeline]

PAYMENT METHOD:
• Method: [settlementMethod]
[If bankAccountDetails provided: "• Bank Transfer to: [bankAccountDetails]"]
[If cheque: "• Cheque collection from HR Department"]

SETTLEMENT CONTACT:
• Contact Person: [settlementContact]
• For Queries: [settlementQueriesContact]
• HR Email: [hrEmail]
• HR Phone: [hrPhone]
• Payroll Email: [payrollEmail]

DOCUMENTATION:
On your final working day, you must:
• Sign the final settlement acknowledgment form
• Confirm receipt of all dues
• Provide bank account details for transfer (if not already on file)
• Collect your employment termination certificate"

POST-TERMINATION OBLIGATIONS:
"CONFIDENTIALITY & NON-DISCLOSURE:

[If confidentialityContinues is "Yes":]
Your confidentiality and non-disclosure obligations CONTINUE after termination:
• You must not disclose company confidential information, trade secrets, or proprietary data
• You must not use company information for personal benefit or to compete
• Breach may result in legal action for damages

[If nonCompeteApplicable is "Yes":]
NON-COMPETE CLAUSE:
• Duration: [nonCompeteDuration] months from termination date
• Scope: [nonCompeteScope]
• You must not work for direct competitors or start competing business during this period
• Violation may result in legal action and claims for damages

[If nonCompeteApplicable is "No":]
No non-compete restrictions apply after termination."

DATA PROTECTION & PDPL COMPLIANCE:
"DATA PROTECTION NOTICE (UAE PDPL Compliance):

This termination letter contains personal data protected under UAE Federal Law No. 45 of 2021 (Personal Data Protection Law).

PERSONAL DATA PROCESSING:
Your personal data will be processed and retained in accordance with UAE PDPL for the following purposes:
• Completion of employment termination process
• Calculation and payment of end-of-service benefits
• Compliance with UAE Labor Law record-keeping requirements
• Handling any post-termination inquiries or disputes

DATA RETENTION:
• Your employment records will be retained for [dataRetentionPeriod]
• Minimum retention: As required by UAE law (typically 5 years after termination)

YOUR DATA RIGHTS:
Under UAE PDPL, you have the right to:
• Access your personal data held by the company
• Request correction of inaccurate data
• Request deletion (subject to legal retention requirements)
• Lodge complaints with the UAE Data Protection Office

DATA PROTECTION CONTACT:
For data-related inquiries, contact: [dataProtectionEmail]"

LEGAL DISCLAIMER:
"LEGAL DISCLAIMER & RESERVATION OF RIGHTS:

This employment termination letter does not constitute a waiver of the Company's rights to pursue any claims, remedies, or legal actions available under:
• UAE Federal Decree-Law No. 33 of 2021 (Labor Law)
• Your employment contract
• Any other applicable UAE laws

The Company expressly reserves all rights to:
• Pursue claims for damages or losses caused by employee misconduct
• Recover company property or compensation for non-returned items
• Enforce confidentiality and non-compete obligations
• Take legal action for breach of employment terms or company policies

This termination is subject to all applicable UAE labor laws and regulations."

NEXT STEPS & INSTRUCTIONS:
"NEXT STEPS FOR YOU:

BEFORE YOUR FINAL WORKING DAY ([finalWorkingDay format DD MMMM YYYY]):
1. Complete all pending work and handover tasks as directed by your manager
2. Return all company property (see list above)
3. Complete exit interview (if requested by HR)
4. Ensure your contact details are up to date with HR

ON YOUR FINAL WORKING DAY:
1. Meet with HR Department to sign final settlement documents
2. Return any remaining company property
3. Collect your employment termination certificate
[If certificateRequired is "Yes": "4. Request employment certificate (ready within [certificateIssuanceTimeline if provided, else "5 business days"])"]

AFTER TERMINATION:
1. Final settlement will be paid within [settlementTimeline]
2. Contact [settlementContact] for any settlement queries
3. Notify HR immediately of any address or bank account changes

[additionalInstructions]"

GOVERNING LAW & DISPUTE RESOLUTION:
"GOVERNING LAW:

This employment termination is governed by UAE Federal Decree-Law No. 33 of 2021 on the Regulation of Labor Relations (UAE Labor Law) and any applicable amendments.

DISPUTE RESOLUTION:

If you have concerns regarding this termination, follow this process:

1. INTERNAL RESOLUTION:
   Contact: HR Department at [hrEmail] or [hrPhone]
   Timeline: Raise concerns within 14 days of receiving this letter

2. MINISTRY OF HUMAN RESOURCES AND EMIRATISATION (MOHRE):
   If internal resolution fails, you may file a complaint with MOHRE
   Online: www.mohre.gov.ae
   Timeline: Within 14 days of exhausting internal process

3. LABOR COURTS:
   If MOHRE mediation is unsuccessful, the matter may proceed to Labor Courts
   Jurisdiction: [emirate] Labor Court
   Timeline: As per MOHRE referral process

EMPLOYEE RIGHTS:
You retain all rights granted under UAE Labor Law, including:
• Right to receive all calculated end-of-service benefits (Articles 51-56)
• Right to file complaint with MOHRE if rights are violated
• Right to challenge unfair termination (if applicable under Articles 44-48)
• Right to receive employment termination certificate (Article 57)"

SIGNATURE SECTION:
"ISSUED BY:

Company Representative:
Name: _______________________
Position: _____________________
Signature: ____________________
Date: ________________________

Company Stamp: [AFFIX COMPANY STAMP]

ACKNOWLEDGED AND RECEIVED BY EMPLOYEE:

Employee Name: [employeeName]
Employee ID: [employeeId]
Signature: ____________________
Date: ________________________

A copy of this termination letter has been provided to the employee."

PROFESSIONAL FORMATTING:
- Use company letterhead if available
- Include clear section headers (UPPERCASE, bold)
- Use bullet points for lists
- Include signature lines
- Professional font and spacing
- Page numbering if multi-page

PLACEHOLDERS:
Replace ALL bracketed placeholders with actual information provided. Do NOT leave any [bracketed text] in the final output unless explicitly asking employee to provide information.`,

  employment_contract: `Generate a comprehensive Employment Contract compliant with UAE Federal Decree-Law No. 33 of 2021 (Labor Law) and Personal Data Protection Law (PDPL).

CRITICAL REQUIREMENTS - MUST INCLUDE ALL OF THESE:

STRUCTURE & FORMATTING:
Use these EXACT section headers in order:
1. EMPLOYMENT CONTRACT HEADING & REFERENCE
2. PARTIES TO THE CONTRACT
3. RECITALS
4. POSITION & DUTIES
5. EMPLOYMENT TERM
6. COMPENSATION & BENEFITS
7. WORKING HOURS & LEAVE ENTITLEMENTS
8. PROBATION PERIOD (if applicable)
9. TERMINATION PROVISIONS
10. CONFIDENTIALITY & NON-DISCLOSURE
11. NON-COMPETE CLAUSE (if applicable)
12. INTELLECTUAL PROPERTY RIGHTS
13. DATA PROTECTION & PDPL COMPLIANCE
14. GOVERNING LAW & DISPUTE RESOLUTION
15. GENERAL PROVISIONS
16. SIGNATURE SECTION

LANGUAGE REQUIREMENTS:
- Use simple, clear sentences (maximum 20 words per sentence)
- Avoid unnecessary legal jargon; use plain business language
- Use bullet points for compensation, benefits, and working hours
- Write in active voice, not passive
- Keep paragraphs short (3-4 sentences maximum)

EMPLOYMENT CONTRACT HEADING:
"EMPLOYMENT CONTRACT

Reference No: EMP-[employeeId if provided, else current date]
Date of Contract: [startDate format DD MMMM YYYY]
Place of Execution: [emirate if provided], United Arab Emirates"

PARTIES TO THE CONTRACT:
"PARTIES:

EMPLOYER (First Party):
Legal Name: [companyName]
License Number: [companyLicenseNumber if provided]
Address: [companyAddress]
Email: [hrContactEmail]
Phone: [hrContactPhone]

AND

EMPLOYEE (Second Party):
Full Legal Name: [employeeName] (as per passport)
Nationality: [employeeNationality]
Passport/Emirates ID: [passportOrEmiratesId]
Address in UAE: [employeeAddressUAE]
Email: [employeeEmail]
Phone: [employeePhone]
[If emergencyContact provided: "Emergency Contact: [emergencyContact]"]

(Hereinafter referred to as 'the Employer' and 'the Employee' respectively, and collectively as 'the Parties')"

RECITALS:
"RECITALS:

WHEREAS the Employer is engaged in business operations in the United Arab Emirates and requires the services of qualified personnel;

WHEREAS the Employee possesses the qualifications, skills, and experience necessary to perform the duties required by the Employer;

WHEREAS the Parties wish to enter into an employment relationship on the terms and conditions set forth in this Contract;

NOW, THEREFORE, in consideration of the mutual covenants and agreements contained herein, the Parties agree as follows:"

POSITION & DUTIES:
"1. POSITION & JOB DUTIES

1.1 POSITION:
The Employee is hired for the position of: [jobTitle]
Department: [department]
Direct Manager/Supervisor: [directManager]

1.2 JOB DESCRIPTION & DUTIES:
The Employee's primary duties and responsibilities include:
[jobDescription]

1.3 REPORTING STRUCTURE:
The Employee will report directly to: [reportingStructure if provided, else directManager]

1.4 DUTIES & OBLIGATIONS:
The Employee agrees to:
• Perform duties diligently, professionally, and in good faith
• Follow company policies, procedures, and code of conduct
• Comply with all UAE laws and regulations
• Act in the best interests of the Employer
• Maintain professional standards appropriate to the position"

EMPLOYMENT TERM:
"2. EMPLOYMENT TERM

2.1 CONTRACT TYPE:
This is a [contractType] employment contract.

[If contractType is "Limited/Fixed Term":]
• Contract Duration: [contractDuration]
• Start Date: [startDate format DD MMMM YYYY]
• End Date: [calculate based on duration]
• Renewal: Subject to mutual agreement and performance evaluation

[If contractType is "Unlimited/Indefinite":]
• Start Date: [startDate format DD MMMM YYYY]
• This contract continues until terminated by either party in accordance with Section 9 (Termination Provisions)

2.2 WORK LOCATION:
Primary Work Location: [workLocation]
[If remote/hybrid: "Work Arrangement: [Remote/Hybrid/On-site] as specified"]

2.3 PROBATION PERIOD:
[If probationPeriod is not "No Probation":]
• Probation Duration: [probationPeriod] (maximum 6 months per UAE Labor Law Article 10)
• Probation Notice Period: [probationNoticePeriod] days by either party
• Assessment: Performance will be evaluated at end of probation
• Confirmation: Upon successful completion, employment continues under full contract terms
• Termination during probation: Either party may terminate with [probationNoticePeriod] days' notice without end-of-service benefits

[If probationPeriod is "No Probation":]
No probation period applies. Full contract terms effective from start date."

COMPENSATION & BENEFITS:
"3. COMPENSATION PACKAGE

3.1 BASIC SALARY:
Monthly Basic Salary: AED [basicSalary]
(Payable on [paymentFrequency] basis via [paymentMethod])

3.2 ALLOWANCES:
• Housing Allowance: [housingAllowance]
  [If "Accommodation Provided": "Company-provided accommodation at [specify if details]"]
  [If amount: "AED [amount] per month"]

• Transport Allowance: [transportAllowance]
  [If "Transport Provided": "Company-provided transport"]
  [If amount: "AED [amount] per month"]

[If otherAllowances provided:]
• Other Allowances:
  [otherAllowances]

3.3 BONUSES & COMMISSION:
[If annualBonus provided: "• Annual Performance Bonus: [annualBonus]"]
[If commissionStructure provided: "• Commission Structure: [commissionStructure]"]

3.4 TOTAL MONTHLY COMPENSATION:
─────────────────────────────────────
TOTAL: AED [totalMonthlyCompensation]
─────────────────────────────────────

3.5 PAYMENT TERMS:
• Payment Frequency: [paymentFrequency]
• Payment Method: [paymentMethod]
• Payment Date: [Typically last working day of month/period]
• Salary Review: [salaryReviewFrequency if provided, else "Subject to company policy and performance"]

3.6 DEDUCTIONS:
The Employer may deduct from salary:
• Income tax (if applicable - currently UAE has no personal income tax)
• Social insurance contributions (for UAE nationals)
• Penalties for authorized absences or violations (as per UAE Labor Law limits)
• Any amounts owed to Employer (e.g., unreturned property, advances)"

BENEFITS:
"4. EMPLOYEE BENEFITS

4.1 HEALTH INSURANCE:
[healthInsurance]
[If "Provided": "Coverage: [healthInsuranceCoverage]"]
[If "Employee Responsible": "Employee must obtain own health insurance"]

4.2 ANNUAL LEAVE:
• Annual Leave Entitlement: [annualLeaveEntitlement] calendar days per year (minimum 30 days per UAE Labor Law Article 29)
• First year: 2 days per month if serving less than 1 year
• Leave includes: Full salary (basic + allowances)
• Timing: Subject to company approval and business needs
• Unused leave: May be carried forward (max 30 days) or paid out on termination

4.3 FLIGHT TICKETS:
[flightTickets]
[If destination provided: "Destination: [destination]"]
[Annual/Biennial as specified]

4.4 VISA & WORK PERMIT:
[visaWorkPermit]
[If "Company Provides": "The Employer will sponsor and bear costs of:
• Employment visa
• Work permit
• Emiratesإقامة (Residence permit)
• Medical fitness test
• Emirates ID"]

4.5 END-OF-SERVICE GRATUITY:
Upon termination, Employee entitled to end-of-service gratuity calculated per UAE Labor Law Articles 51-54:
• Less than 1 year: No gratuity
• 1-5 years: 21 days' basic salary per year of service
• Over 5 years: 30 days' basic salary per year exceeding 5 years
• Resignation before 5 years: Partial gratuity (1-3 years: 1/3; 3-5 years: 2/3)
• Maximum: 2 years' basic salary
• Calculation basis: Final basic salary only (excludes allowances)

4.6 OTHER BENEFITS:
[If otherBenefits provided: "[otherBenefits]"]
[If benefitsCommencementDate provided: "Benefits commence: [benefitsCommencementDate]"]"

WORKING HOURS & LEAVE:
"5. WORKING HOURS & LEAVE ENTITLEMENTS

5.1 WORKING HOURS:
• Standard Hours: [workingHoursPerDay] hours per day
• Working Days: [workingDaysPerWeek] days per week
• Work Schedule: [workSchedule]
• Maximum: 8 hours/day or 48 hours/week per UAE Labor Law Article 17
• During Ramadan: [ramadanWorkingHours]

5.2 OVERTIME:
[overtimePolicy]
• Overtime compensation: As per UAE Labor Law (125% basic salary for regular hours, 150% for night hours 9pm-4am)
• Approval: All overtime must be pre-approved by manager

5.3 REST DAYS:
• Weekly Rest: [restDaysPerWeek] day(s) per week (typically Friday)
• Employee cannot be required to work on rest day except in exceptional circumstances with additional compensation

5.4 ANNUAL LEAVE:
(Covered in Section 4.2 - 30 calendar days minimum)

5.5 SICK LEAVE:
Employee entitled to sick leave per UAE Labor Law Article 31:
• First 15 days: Full salary
• Next 30 days: Half salary
• Subsequent 45 days: Unpaid
• Maximum: 90 days per year (continuous or intermittent)
• Requirement: Medical certificate from licensed UAE medical facility

5.6 MATERNITY LEAVE (if applicable):
Female employees entitled to maternity leave per UAE Labor Law Article 30:
• Duration: 60 calendar days (45 days full pay + 15 days half pay)
• Extended unpaid leave: Up to 100 additional days
• Protection: No termination during maternity leave

5.7 OTHER LEAVE:
[If otherLeaveTypes provided: "[otherLeaveTypes]"]
[If leaveApprovalProcess provided: "Approval Process: [leaveApprovalProcess]"]"

TERMINATION PROVISIONS:
"6. TERMINATION OF EMPLOYMENT

6.1 TERMINATION CONDITIONS:
This contract may be terminated by:

A. MUTUAL AGREEMENT:
Both parties consent in writing to terminate

B. CONTRACT EXPIRY (if Limited Term):
Fixed-term contract ends on specified date

C. RESIGNATION BY EMPLOYEE:
• Notice Period: [noticePeroidByEmployee]
• Notice must be in writing
• Employee must work full notice period unless waived by Employer
• Failure to provide notice: Employer may deduct notice period salary

D. TERMINATION BY EMPLOYER:
• Notice Period: [noticePeriodByEmployer]
• Notice must be in writing
• Employer must pay notice period salary or allow employee to work notice period
• End-of-service benefits payable per UAE Labor Law

E. TERMINATION FOR CAUSE (Article 44):
Immediate termination without notice or benefits for serious violations including:
• Assault on employer, manager, or colleague
• Failure to perform duties and ignoring warnings
• Breach of confidentiality or trade secrets
• Fraud, theft, or dishonesty
• Being intoxicated or under influence of drugs at work
• Absence without valid reason for more than 20 non-continuous days or 7 continuous days per year
[terminationConditions if provided]

F. FORCE MAJEURE:
Circumstances beyond control of parties

6.2 NOTICE PERIODS:
• During probation: [probationNoticePeriod if applicable] days
• After probation - Employee: [noticePeriodByEmployee]
• After probation - Employer: [noticePeriodByEmployer]

[If gardenLeaveApplicable is "Yes":]
6.3 GARDEN LEAVE:
During notice period, Employer may require Employee to remain away from work ('garden leave') while receiving full salary and benefits."

CONFIDENTIALITY & IP:
"7. CONFIDENTIALITY & NON-DISCLOSURE

7.1 CONFIDENTIALITY OBLIGATION:
[If confidentialityObligation is "Yes":]
The Employee agrees to:
• Maintain strict confidentiality of all Company information, trade secrets, client data, and proprietary knowledge
• Not disclose confidential information to any third party during or after employment
• Not use confidential information for personal benefit or to compete with Company
• Return all confidential documents and data upon termination

Confidential information includes:
• Business strategies, plans, and financial information
• Client lists, pricing, and contract terms
• Proprietary processes, methods, and know-how
• Employee and personnel information
• Any information marked "Confidential" or that should reasonably be considered confidential

7.2 DURATION:
This confidentiality obligation continues indefinitely after termination of employment.

7.3 BREACH:
Breach of confidentiality may result in:
• Immediate termination for cause
• Legal action for damages and injunctive relief
• Criminal prosecution under UAE law

[If ndaSeparate is "Yes":]
7.4 SEPARATE NDA:
Employee has signed a separate Non-Disclosure Agreement dated [date] which remains in full force.

8. INTELLECTUAL PROPERTY RIGHTS

8.1 OWNERSHIP:
All work product, inventions, designs, discoveries, improvements, and intellectual property created by Employee during employment belong exclusively to the Employer.

This includes:
• Software code, designs, and technical specifications
• Business processes and methodologies
• Marketing materials and content
• Research and development outputs
• Any IP created using Company time, resources, or information

8.2 ASSIGNMENT:
Employee assigns all rights, title, and interest in work-related IP to the Employer.

8.3 MORAL RIGHTS:
Employee waives all moral rights in work product created during employment.

8.4 POST-EMPLOYMENT:
Employee has no right to use, exploit, or claim ownership of any Company IP after termination.

[If dataAccessLevel provided:]
8.5 DATA ACCESS:
Employee's data access level: [dataAccessLevel]"

NON-COMPETE:
"9. NON-COMPETE CLAUSE

[If nonCompeteClause is "Yes":]
9.1 NON-COMPETE OBLIGATION:
Employee agrees not to:
• Work for direct competitors
• Start or operate a competing business
• Solicit Company clients or employees

9.2 DURATION:
[nonCompeteDuration] months from termination date

9.3 SCOPE:
[nonCompeteScope]

9.4 GEOGRAPHIC AREA:
United Arab Emirates [or specific emirates if narrower scope]

9.5 ENFORCEMENT:
Violation may result in:
• Injunctive relief
• Claims for damages
• Legal costs

[If nonCompeteClause is "No":]
No non-compete restrictions apply after termination of employment."

DATA PROTECTION:
"10. DATA PROTECTION & PDPL COMPLIANCE

10.1 PERSONAL DATA PROCESSING:
This contract contains personal data protected under UAE Federal Law No. 45 of 2021 (Personal Data Protection Law).

10.2 EMPLOYEE PERSONAL DATA:
The Employer will collect and process Employee personal data including:
• Identification information (name, passport, Emirates ID)
• Contact details
• Employment history and qualifications
• Salary and bank account information
• Performance and disciplinary records

10.3 PURPOSE:
Personal data processed for:
• Employment relationship management
• Salary payment and benefits administration
• Compliance with UAE Labor Law and visa regulations
• HR administration and record-keeping

10.4 DATA RETENTION:
• During employment: All employment-related data retained
• After termination: [personalDataRetentionPeriod]
• Minimum retention: As required by UAE law (typically 5 years)

10.5 YOUR DATA RIGHTS UNDER UAE PDPL:

As an employee, you have the following rights regarding your personal data:

RIGHT TO ACCESS:
• You may request access to your personal data held by the Company
• You may request copies of your employment records
• Company will respond within 15 business days

RIGHT TO CORRECTION:
• You may request correction of inaccurate or incomplete personal data
• Company will update records within 10 business days of verification

RIGHT TO DELETION:
• You may request deletion of your personal data (subject to legal retention requirements)
• Note: Company must retain certain employment data as required by UAE Labor Law and tax regulations

RIGHT TO OBJECT:
• You may object to certain types of data processing
• Company will review objections and respond within 30 days

RIGHT TO LODGE COMPLAINTS:
• You may lodge complaints with the UAE Data Protection Office if your data rights are violated
• Website: www.uaedpo.gov.ae

HOW TO EXERCISE YOUR RIGHTS:
• Submit requests to: [dataProtectionEmail]
• Include: Your name, employee ID, and specific request
• Company will respond within 30 days

10.6 DATA PROTECTION CONTACT:
For data inquiries, contact: [dataProtectionEmail]

10.7 CONSENT:
Employee consents to processing of personal data as described above for legitimate employment purposes."

GOVERNING LAW:
"11. GOVERNING LAW & DISPUTE RESOLUTION

11.1 GOVERNING LAW:
This employment contract is governed by:
• UAE Federal Decree-Law No. 33 of 2021 (Labor Law)
• UAE Civil Transactions Law (Federal Law No. 5 of 1985)
[If freeZoneEmployment provided: "• [Free zone name] regulations and employment rules"]
• Any other applicable UAE federal and [emirate]-specific laws

11.2 DISPUTE RESOLUTION:
Disputes resolved through:

STEP 1 - INTERNAL RESOLUTION:
• Employee raises concern with HR/management
• Internal review and resolution attempt

STEP 2 - MINISTRY OF HUMAN RESOURCES AND EMIRATISATION (MOHRE):
• File complaint with MOHRE if internal resolution fails
• MOHRE mediation and conciliation services

STEP 3 - LABOR COURTS:
• If MOHRE mediation unsuccessful, proceed to Labor Courts
• Jurisdiction: [emirate] Labor Court
• Appeals: [emirate] Court of Appeal
• Final appeals: Federal Supreme Court (if applicable)

11.3 JURISDICTION:
Exclusive jurisdiction: Competent courts of [emirate], United Arab Emirates

11.4 EMPLOYEE RIGHTS:
Employee retains all rights under UAE Labor Law including:
• Right to fair treatment and non-discrimination
• Right to file complaints with MOHRE
• Right to challenge unfair termination
• Right to receive all statutory benefits and entitlements"

GENERAL PROVISIONS:
"12. GENERAL PROVISIONS

12.1 COMPANY PROPERTY:

ITEMS THAT MUST BE RETURNED:
Employee must return all Company property upon termination, including but not limited to:
• Laptop, desktop computer, or any computing devices
• Mobile phone(s), tablets, or other electronic devices
• Access cards, building keys, parking permits
• Company credit cards or purchasing cards
• Company vehicles (if provided)
• Confidential documents, files, and records (physical and digital)
• Client lists, contact information, and business records
• Proprietary software, data, or intellectual property
• Uniforms, safety equipment, or other company-issued items
• Any other property belonging to the Company

OBLIGATIONS:
Employee must:
• Use Company property solely for legitimate business purposes
• Maintain property in good working condition
• Not remove Company property from premises without authorization
• Return all property in good condition upon termination (normal wear and tear excepted)

CONSEQUENCES OF NON-RETURN:
Failure to return Company property may result in:
• Deduction from final settlement (for value of unreturned items)
• Legal action for recovery of property
• Filing of police report (if applicable)
• Withholding of employment certificate until property returned

12.2 AMENDMENTS:
This contract may only be amended by written agreement signed by both parties.

12.3 SEVERABILITY:
If any provision is invalid or unenforceable, remaining provisions remain in full effect.

12.4 ENTIRE AGREEMENT:
This contract constitutes the entire agreement and supersedes all prior agreements, understandings, or representations.

12.5 NOTICES:
All notices must be in writing and delivered to:
• Employer: [hrContactEmail] / [companyAddress]
• Employee: [employeeEmail] / [employeeAddressUAE]

12.6 COMPANY POLICIES:
Employee acknowledges receipt of and agrees to comply with:
• Company Employee Handbook
• Code of Conduct
• IT and Security Policies
• Any other company policies
[If companyPoliciesAcknowledgment provided: "[companyPoliciesAcknowledgment]"]

[If specialConditions provided:]
12.7 SPECIAL CONDITIONS:
[specialConditions]

[If attachments provided:]
12.8 ATTACHMENTS:
The following documents are attached and form part of this contract:
[attachments]"

SIGNATURE SECTION:
"13. SIGNATURES & ACKNOWLEDGMENT

The Parties have read, understood, and voluntarily agree to all terms and conditions of this Employment Contract.

EMPLOYER:

Company Name: [companyName]
Authorized Signatory: _______________________
Name: _______________________
Position: _____________________
Signature: ____________________
Company Stamp: [AFFIX COMPANY STAMP]
Date: ________________________

EMPLOYEE:

Employee Name: [employeeName]
Passport/Emirates ID: [passportOrEmiratesId]
Signature: ____________________
Date: ________________________

ACKNOWLEDGMENT:
• Employee acknowledges receiving a signed copy of this contract
• Employee was advised of the right to seek independent legal advice before signing
• Employee confirms understanding of all terms and voluntarily enters into this employment relationship
• Employee understands rights and obligations under UAE Labor Law"

PROFESSIONAL FORMATTING:
- Use proper contract header with "EMPLOYMENT CONTRACT" title
- Include reference number and date
- Use clear section numbering (1. 2. 3., etc.)
- Use subsection numbering (1.1, 1.2, etc.)
- Use bullet points for lists
- Include signature pages
- Professional font and spacing
- Page numbering

PLACEHOLDERS:
Replace ALL bracketed placeholders with actual information provided in letter details. Do NOT leave any [bracketed text] in the final output unless explicitly asking parties to provide information.`,
  lease_agreement: `Generate a comprehensive residential or commercial lease agreement compliant with UAE tenancy law and RERA regulations.

CRITICAL REQUIREMENTS - MUST INCLUDE ALL OF THESE:

STRUCTURE & FORMATTING:
Use these EXACT section headers in order:
1. LEASE AGREEMENT HEADER
2. PARTIES TO THE AGREEMENT
3. PROPERTY DESCRIPTION
4. LEASE TERM
5. RENT & PAYMENT TERMS
6. SECURITY DEPOSIT
7. PROPERTY USE
8. MAINTENANCE & REPAIRS
9. UTILITIES & SERVICES
10. ALTERATIONS & IMPROVEMENTS
11. INSURANCE REQUIREMENTS
12. ACCESS & INSPECTIONS
13. SUBLETTING & ASSIGNMENT
14. TERMINATION CONDITIONS
15. EJARI/TAWTHEEQ REGISTRATION
16. GOVERNING LAW & DISPUTE RESOLUTION
17. DATA PROTECTION & PDPL COMPLIANCE
18. ADDITIONAL TERMS & GENERAL PROVISIONS

LANGUAGE REQUIREMENTS:
- Use simple, clear sentences (maximum 20 words per sentence where possible)
- Use bullet points for lists (utilities, maintenance responsibilities, prohibited activities)
- Use clear section headers with numbering
- Use active voice
- Keep paragraphs short (3-4 sentences maximum)
- Avoid unnecessary legal jargon

DOCUMENT SECTIONS (DETAILED):

1. LEASE AGREEMENT HEADER
===========================

RESIDENTIAL/COMMERCIAL LEASE AGREEMENT
[Use "RESIDENTIAL LEASE AGREEMENT" if propertyType is Apartment/Villa/Townhouse, otherwise "COMMERCIAL LEASE AGREEMENT"]

Agreement Reference: [agreementReference or auto-generate: LA-UAE-YYYY-XXXX]
Execution Date: [executionDate or today's date]
Execution Place: [emirate], United Arab Emirates

2. PARTIES TO THE AGREEMENT
============================

This Lease Agreement is entered into on [leaseStartDate or executionDate] between:

LANDLORD (LESSOR):
Full Legal Name: [landlordName]
Emirates ID/Passport: [landlordId]
Address: [landlordAddress]
Phone: [landlordPhone]
Email: [landlordEmail]
[If landlordLegalRep provided]
Legal Representative: [landlordLegalRep]
Representative Emirates ID: [landlordRepId]

AND

TENANT (LESSEE):
Full Legal Name: [tenantName]
Emirates ID/Passport: [tenantId]
Address: [tenantAddress]
Phone: [tenantPhone]
Email: [tenantEmail]
[If tenantLegalRep provided]
Legal Representative: [tenantLegalRep]
Representative Emirates ID: [tenantRepId]

Collectively referred to as "the Parties" and individually as "a Party".

3. PROPERTY DESCRIPTION
========================

The Landlord agrees to lease to the Tenant the following property:

LOCATION:
[propertyAddress]

PROPERTY DETAILS:
• Property Type: [propertyType]
• Unit/Plot Number: [unitNumber]
• Total Area: [propertyAreaSqm] square meters ([propertyAreaSqft] square feet)
[If numberOfBedrooms provided]
• Bedrooms: [numberOfBedrooms]
• Bathrooms: [numberOfBathrooms]
[End if]

PARKING:
• Parking Spaces: [parkingSpaces]
[If parkingLocation provided]
• Parking Location: [parkingLocation]
[End if]

STORAGE:
[If storageUnit is "Yes"]
• Storage Unit Included: Yes
• Storage Details: [storageUnitDetails]
[Else]
• Storage Unit: Not included
[End if]

PROPERTY CONDITION:
The property is leased in [propertyCondition] condition as inspected and accepted by the Tenant.

FURNISHING:
[furnished]
[If furnitureList provided]

FURNITURE INCLUDED:
[furnitureList]
[End if]

APPLIANCES:
[If appliancesIncluded is "Yes"]
The following appliances are included with the property:
[appliancesList]

The Tenant agrees to maintain all included appliances in good working condition. Normal wear and tear excepted.
[Else]
No appliances included with the property.
[End if]

4. LEASE TERM
==============

START DATE: [leaseStartDate]
END DATE: [leaseEndDate]
TOTAL DURATION: [leaseDuration] months

AUTOMATIC RENEWAL:
[If autoRenewal is "Yes"]
This lease will automatically renew for successive periods of [leaseDuration] months unless either Party provides written notice of non-renewal at least [renewalNoticePeriod] days before the lease end date.

RENEWAL TERMS:
• Rent increase upon renewal: Maximum [renewalRentIncrease]% (subject to RERA Index compliance)
• All other terms remain the same unless mutually agreed otherwise in writing
[If renewalTerms provided]
• Additional renewal terms: [renewalTerms]
[End if]
[Else]
This lease does NOT automatically renew. Upon expiration, the Tenant must vacate the property or negotiate a new lease agreement.
[End if]

5. RENT & PAYMENT TERMS
========================

ANNUAL RENT: AED [annualRent]

PAYMENT STRUCTURE:
• Payment Frequency: [paymentFrequency]
• Payment Method: [paymentMethod]

[If paymentMethod includes "Cheque"]
CHEQUE PAYMENT DETAILS:
• Total Number of Cheques Required: [numberOfCheques]
• Cheque Schedule:
[chequeDatesAmounts]

All cheques must be:
• Made payable to: [landlordName]
• Dated as per the schedule above
• Delivered to Landlord on or before lease commencement
[End if]

[If paymentMethod includes "Bank Transfer"]
BANK TRANSFER DETAILS:
• Bank Name: [bankName]
• Account Name: [accountName]
• Account Number: [accountNumber]
• IBAN: [iban]
• Transfer must include: Unit number and tenant name as reference
[End if]

PAYMENT SCHEDULE:
• First Payment Due Date: [firstPaymentDueDate]
• Payment must be received by due date (not postmarked)

LATE PAYMENT:
[If latePaymentPenalty is "Yes"]
• Late Payment Penalty: [latePaymentRate]% per day after grace period
• Grace Period: [gracePeriod] days
• Accrual starts from day after grace period expires
[Else]
• Grace Period: [gracePeriod] days
• Late payment may result in legal action after grace period
[End if]

BOUNCED CHEQUE:
• Penalty for bounced cheque: AED [bouncedChequePenalty]
• Bounced cheque is a criminal offense in UAE and may result in legal action
• Tenant remains liable for original rent amount plus penalty

MUNICIPALITY FEES:
[If rentIncludesMunicipalityFees is "Yes"]
Annual rent includes Dubai Municipality housing fee (5%) or equivalent emirate fee.
[Else]
Municipality housing fee is NOT included in rent. Tenant is responsible for payment.
[End if]

6. SECURITY DEPOSIT
===================

DEPOSIT AMOUNT: AED [securityDeposit]

PAYMENT:
• Payment Method: [securityDepositPaymentMethod]
• Payment Date: [securityDepositPaymentDate]
• Must be paid before taking possession of property

[If depositSeparateAccount is "Yes"]
DEPOSIT HOLDING:
Landlord will hold security deposit in separate bank account:
[depositBankDetails]
[End if]

PURPOSE OF DEPOSIT:
The security deposit serves as protection against:
• Unpaid rent
• Property damage beyond normal wear and tear
• Unpaid utility bills
• Cleaning costs (if property not returned in clean condition)
• Early termination costs
• Breach of lease terms

PERMITTED DEDUCTIONS:
Landlord may deduct from security deposit for:
[List each item from permittedDeductions]

RETURN OF DEPOSIT:
• Timeline: Within [depositReturnTimeline] days after lease end and property handover
• Return Method: [depositReturnMethod]
• Landlord must provide itemized list of any deductions
• Tenant must provide forwarding address for deposit return

If Tenant disputes deductions, matter can be referred to Dubai Rental Dispute Centre (RDC) or equivalent authority.

7. PROPERTY USE
================

PERMITTED USE:
This property is leased for: [permittedUse]

OCCUPANCY:
• Maximum number of occupants: [numberOfOccupants] persons

PETS:
[If petsAllowed is "Yes"]
Pets are ALLOWED in the property.
[If petDepositRequired is "Yes"]
• Pet deposit required: AED [petDepositAmount]
• Pet deposit is refundable subject to no pet-related damage
[End if]
• Tenant responsible for all pet-related damage
• Tenant must comply with building/community pet regulations
[ElseIf petsAllowed is "With Consent"]
Pets are ALLOWED only with prior written consent from Landlord.
• Tenant must request permission in writing
• Landlord may impose conditions or require additional deposit
[Else]
NO PETS are allowed in the property.
[End if]

PROHIBITED ACTIVITIES:
The following activities are strictly PROHIBITED:

[prohibitedActivities]

Engaging in any prohibited activity constitutes a material breach of this lease and may result in immediate termination.

8. MAINTENANCE & REPAIRS
=========================

LANDLORD'S RESPONSIBILITIES:

The Landlord is responsible for:
[landlordMaintenanceResponsibilities]

TENANT'S RESPONSIBILITIES:

The Tenant is responsible for:
[tenantMaintenanceResponsibilities]

REPAIR REQUEST PROCEDURE:
[repairRequestProcedure]

EMERGENCY REPAIRS:
[emergencyRepairProtocol]

RESPONSE TIMELINE:
• Landlord must respond to repair requests within [repairResponseTimeline] days
• Emergency repairs: Immediate response required
• If Landlord fails to complete necessary repairs within reasonable time, Tenant may:
  - Arrange repair and deduct cost from rent (with proper documentation)
  - File complaint with RERA/RDC

COST ALLOCATION:
[repairCostAllocation]

9. UTILITIES & SERVICES
========================

RESPONSIBILITY FOR UTILITIES:

The following table shows who is responsible for each utility/service:

Electricity (DEWA/FEWA/SEWA): [electricityResponsibility]
Water: [waterResponsibility]
Gas: [gasResponsibility]
District Cooling/Heating: [coolingResponsibility]
Internet/Cable: [internetResponsibility]
Service Charges/Management Fees: [serviceChargesResponsibility]
Municipality Housing Fee: [municipalityFeeResponsibility]
Chiller Maintenance: [chillerMaintenanceResponsibility]

UTILITY CONNECTION:
[utilityConnectionProcedure]

FINAL SETTLEMENT:
[finalUtilitySettlement]

TENANT OBLIGATIONS:
• Pay all assigned utilities on time
• Maintain service accounts in good standing
• Not disconnect or tamper with utility services
• Provide proof of utility payments upon request

10. ALTERATIONS & IMPROVEMENTS
===============================

[If alterationsAllowed is "No Alterations"]
NO ALTERATIONS ALLOWED:
Tenant may NOT make any alterations, modifications, or improvements to the property without prior written consent from Landlord.

Any unauthorized alterations may result in:
• Requirement to restore property to original condition at Tenant's expense
• Deduction from security deposit
• Lease termination
[Else]
ALTERATIONS WITH CONSENT:
Tenant may make alterations only with prior written consent from Landlord.

EXPLICITLY PROHIBITED ALTERATIONS:
[alterationsProhibited]

APPROVAL PROCESS:
• Tenant must submit written request describing proposed alteration
• Include drawings, specifications, contractor details
• Landlord will respond within 14 days
• Approved alterations must comply with building codes

COST ALLOCATION:
[whoPaysAlterations]

RESTORATION REQUIREMENT:
[If restorationRequired is "Yes"]
At lease end, Tenant MUST restore property to original condition at Tenant's expense.
[ElseIf restorationRequired is "No"]
Approved alterations become part of the property. No restoration required.
[Else]
Restoration requirement will be determined on case-by-case basis as agreed in writing.
[End if]
[End if]

11. INSURANCE REQUIREMENTS
===========================

LANDLORD INSURANCE:
[If landlordBuildingInsurance is "Yes"]
Landlord MUST maintain building/property insurance.
• Coverage Amount: Minimum AED [landlordInsuranceCoverage]
• Coverage: Building structure, common areas, landlord's property
• Landlord must provide proof of insurance upon Tenant's request
[Else]
Landlord is not required to maintain building insurance.
Tenant advised to obtain comprehensive insurance coverage.
[End if]

TENANT INSURANCE:
[If tenantContentsInsuranceRequired includes "Required"]
Tenant MUST obtain contents insurance covering personal belongings.
• Required before taking possession
• Must provide proof of insurance to Landlord
• Minimum coverage: Replacement value of contents
[ElseIf tenantContentsInsuranceRequired includes "Recommended"]
Tenant is RECOMMENDED to obtain contents insurance.
Landlord is not liable for damage to Tenant's personal property.
[Else]
Contents insurance is optional but recommended.
[End if]

[If tenantLiabilityInsuranceRequired is "Yes"]
LIABILITY INSURANCE:
Tenant MUST obtain liability insurance covering:
• Personal liability for injuries to third parties
• Damage to Landlord's property caused by Tenant
• Minimum coverage: AED 500,000
[End if]

12. ACCESS & INSPECTIONS
=========================

LANDLORD'S RIGHT OF ACCESS:
Landlord has right to access property for following reasons:
[permittedAccessReasons]

NOTICE REQUIREMENT:
• Landlord must provide [landlordAccessNotice] hours advance written notice
• Notice may be by phone, email, or in person
• Tenant must reasonably accommodate access requests

EMERGENCY ACCESS:
[emergencyAccess]

INSPECTIONS:
• Inspection Frequency: [inspectionFrequency]
• Purpose: Verify property condition, check for maintenance needs, ensure compliance
• Landlord will provide reasonable notice except for emergencies

SHOWING TO PROSPECTIVE TENANTS:
During last 60 days of lease, Landlord may show property to prospective tenants with reasonable notice.

13. SUBLETTING & ASSIGNMENT
============================

SUBLETTING:
[If sublettingAllowed is "No"]
Subletting is STRICTLY PROHIBITED.
Tenant may NOT sublet, rent, or allow any third party to occupy the property without Landlord's written consent.
Unauthorized subletting is grounds for immediate lease termination.
[ElseIf sublettingAllowed is "Yes with Written Consent"]
Subletting is ALLOWED only with prior written consent from Landlord.

CONDITIONS FOR SUBLETTING:
[sublettingConditions]

• Tenant must submit written request including subtenant details
• Landlord has sole discretion to approve or deny
• Tenant remains fully liable for rent and property condition
• Subtenant must comply with all lease terms
[Else]
Subletting is ALLOWED.
[sublettingConditions]
• Tenant remains fully liable under this lease
[End if]

ASSIGNMENT:
[If assignmentAllowed is "No"]
Assignment of this lease is STRICTLY PROHIBITED.
Tenant may NOT assign, transfer, or convey this lease to any third party.
[ElseIf assignmentAllowed is "Yes with Written Consent"]
Assignment is ALLOWED only with prior written consent from Landlord.

ASSIGNMENT PROCESS:
[assignmentProcess]
[Else]
Assignment is ALLOWED.
[assignmentProcess]
[End if]

14. TERMINATION CONDITIONS
===========================

TERMINATION BY TENANT:

NOTICE PERIOD: [tenantNoticePeriod] days written notice required

EARLY TERMINATION:
If Tenant terminates lease before end date:
• Early termination penalty: [earlyTerminationPenalty] month(s) rent
• Tenant must pay all rent until replacement tenant found or lease end (whichever is earlier)
• Security deposit may be forfeited

[If earlyTerminationPenaltyWaiver provided]
PENALTY WAIVER CONDITIONS:
[earlyTerminationPenaltyWaiver]
[End if]

TERMINATION BY LANDLORD:

NOTICE PERIOD: [landlordNoticePeriod] days written notice required

VALID GROUNDS FOR TERMINATION:
[validGroundsLandlordTermination]

IMPORTANT: Under UAE law, Landlord must provide:
• 12 months notice for termination due to personal use (residential)
• 12 months notice for demolition/major renovation
• 90 days notice for commercial properties (unless otherwise specified)
• Proper legal process through RERA/RDC for breach of lease

MOVE-OUT PROCEDURE:
[moveOutProcedure]

FINAL INSPECTION:
[finalInspectionProcess]

HANDOVER REQUIREMENTS:
• Return all keys and access cards
• Property must be in same condition as move-in (normal wear and tear excepted)
• All utilities paid and final bills settled
• Property professionally cleaned
• All personal belongings removed
• All Tenant's contact information removed from property

15. EJARI/TAWTHEEQ REGISTRATION
================================

REGISTRATION REQUIREMENT:
[If registrationRequired includes "Ejari"]
This lease MUST be registered with Ejari (Dubai) within [registrationTimeline] days of signing.
Registration is a legal requirement under Dubai Law No. 26 of 2007.
Unregistered lease may not be enforceable.
[ElseIf registrationRequired includes "Tawtheeq"]
This lease MUST be registered with Tawtheeq (Abu Dhabi) within [registrationTimeline] days of signing.
Registration is a legal requirement under Abu Dhabi Law No. 20 of 2006.
[ElseIf registrationRequired includes "Other"]
This lease must be registered with relevant emirate authority within [registrationTimeline] days.
[Else]
Registration requirements as per local emirate regulations apply.
[End if]

REGISTRATION FEES:
Registration fees will be paid by: [registrationFeesPayer]

REQUIRED DOCUMENTS:
[registrationDocuments]

BOTH PARTIES' OBLIGATION:
• Both Landlord and Tenant must cooperate to complete registration
• Both parties must provide required documents promptly
• Both parties should retain copy of registration certificate
• Renewal must also be registered

16. GOVERNING LAW & DISPUTE RESOLUTION
=======================================

GOVERNING LAW:
This Lease Agreement is governed by and construed in accordance with:
• UAE Federal Law No. 26 of 2007 (Regulating Relationship between Landlords and Tenants)
[If emirate is "Dubai"]
• Dubai Law No. 26 of 2007 and RERA (Real Estate Regulatory Agency) regulations
• RERA Rental Index for rent increase limitations
[ElseIf emirate is "Abu Dhabi"]
• Abu Dhabi Law No. 20 of 2006
• Tawtheeq rental contract regulations
[Else]
• [emirate] specific tenancy regulations
[End if]

DISPUTE RESOLUTION AUTHORITY:
[disputeResolutionAuthority]

DISPUTE RESOLUTION PROCESS:

Step 1: AMICABLE RESOLUTION (30 days)
• Parties will attempt to resolve dispute through good faith negotiation
• All communications should be in writing
• Each party should clearly state their position and proposed resolution

Step 2: MEDIATION/OFFICIAL AUTHORITY
[If emirate is "Dubai"]
• File case with Dubai Rental Dispute Centre (RDC)
• Website: www.rdc.ae
• RDC will attempt mediation first
• If mediation fails, RDC will issue binding decision
[ElseIf emirate is "Abu Dhabi"]
• File case with Abu Dhabi Judicial Department
• Mediation will be attempted
• If mediation fails, case proceeds to court
[Else]
• File case with relevant emirate municipality or court
• Follow emirate-specific dispute resolution procedures
[End if]

Step 3: COURTS (if necessary)
• Either party may appeal RDC/authority decision to courts
• Courts have final jurisdiction

RENT INCREASE RESTRICTIONS:
[If emirate is "Dubai"]
• Rent increases must comply with RERA Rental Index
• Maximum increase based on property type and current rent vs. market rate
• No increase if current rent within 10% of market rate
• Increases allowed only at lease renewal
• 90 days advance notice required for rent increase
[Else]
• Rent increases subject to emirate regulations
• Cannot increase during lease term
• Advance notice required for increase at renewal
[End if]

17. DATA PROTECTION & PDPL COMPLIANCE
======================================

PERSONAL DATA PROTECTION:
This Lease Agreement contains personal data protected under UAE Federal Law No. 45 of 2021 (Personal Data Protection Law - PDPL).

PERSONAL DATA COLLECTED:
• Landlord's name, Emirates ID/passport, address, contact details
• Tenant's name, Emirates ID/passport, address, contact details, employment information
• Financial information (rent amounts, bank details, security deposit)
• Property access information
• Communication records

PURPOSE OF DATA PROCESSING:
Personal data is processed solely for:
• Executing this lease agreement
• Property management and maintenance
• Rent collection and financial obligations
• Compliance with legal and regulatory requirements (Ejari, municipality)
• Communication between parties
• Dispute resolution if necessary

WHO CAN ACCESS THIS DATA:
Access is restricted to:
• The Landlord and Tenant (parties to agreement)
• Property management company (if applicable)
• Ejari/Tawtheeq registration authority
• Utility companies (for service setup)
• RERA/RDC or courts (if dispute arises)
• UAE government authorities (as required by law)

DATA RETENTION:
[dataRetentionPeriod]

YOUR DATA RIGHTS UNDER UAE PDPL:

RIGHT TO ACCESS:
• You may request access to your personal data held by the other Party
• Request copy of lease and related documents
• Response within 15 business days

RIGHT TO CORRECTION:
• You may request correction of inaccurate personal data
• Updated documents will be provided within 10 business days

RIGHT TO DELETION:
• You may request deletion of personal data after lease ends
• Note: Parties must retain certain data as required by UAE law for record-keeping

RIGHT TO OBJECT:
• You may object to certain types of data processing
• Other party will review and respond within 30 days

HOW TO EXERCISE YOUR RIGHTS:
Contact: [dataProtectionEmail]
Include: Your name, property address, and specific request

18. ADDITIONAL TERMS & GENERAL PROVISIONS
==========================================

[If specialConditions provided]
SPECIAL CONDITIONS:
[specialConditions]
[End if]

[If attachments provided]
ATTACHMENTS:
The following documents are attached and form part of this agreement:
[attachments]
[End if]

FORCE MAJEURE:
Neither party is liable for failure to perform due to circumstances beyond reasonable control including:
• Natural disasters (flood, earthquake, fire)
• Government actions or regulations
• War, civil unrest, or terrorism
• Pandemics or health emergencies

However, rent obligations typically continue unless property becomes uninhabitable.

NOTICES:
All notices under this agreement must be in writing and delivered by:
• Email to addresses listed above (with read receipt)
• Registered mail to addresses listed above
• Hand delivery with signed receipt

Notices are deemed received:
• Email: Upon delivery confirmation
• Registered mail: 3 business days after posting
• Hand delivery: Upon receipt

ENTIRE AGREEMENT:
This lease agreement constitutes the entire agreement between parties. No verbal agreements or representations are binding.

AMENDMENTS:
Any amendments must be in writing and signed by both parties. Verbal modifications are not enforceable.

SEVERABILITY:
If any provision is found invalid, remaining provisions remain in full force and effect.

WAIVER:
Failure to enforce any provision does not constitute waiver of right to enforce in future.

BINDING EFFECT:
This agreement binds and benefits parties and their respective heirs, successors, and permitted assigns.

LANGUAGE:
This agreement is executed in English. If translated, English version prevails in case of conflict.

NUMBER OF ORIGINALS:
This agreement is executed in [2 or 3] original copies:
• One for Landlord
• One for Tenant
• One for Ejari/Tawtheeq registration

SIGNATURE SECTION
=================

By signing below, both parties acknowledge:
• Reading and understanding all terms of this lease
• Voluntary entry into this agreement
• Receiving copy of signed lease
• Understanding rights and obligations under UAE tenancy law
• Opportunity to seek independent legal advice

LANDLORD:
_______________________
Signature: [landlordName]
Emirates ID: [landlordId]
Date: _________________

TENANT:
_______________________
Signature: [tenantName]
Emirates ID: [tenantId]
Date: _________________

[If witnesses required]
WITNESSES:

Witness 1:
Name: _______________________
Emirates ID: _________________
Signature: ___________________
Date: _______________________

Witness 2:
Name: _______________________
Emirates ID: _________________
Signature: ___________________
Date: _______________________
[End if]

---END OF LEASE AGREEMENT---

PLACEHOLDERS:
Replace ALL bracketed placeholders with actual information. Do NOT leave any [bracketed text] in final output.`,
  lease_termination: `LEASE TERMINATION NOTICE

===== DOCUMENT HEADER =====

LEASE TERMINATION NOTICE
[If noticeReference provided: "Reference: [noticeReference]", else: "Reference: LTN-UAE-[CURRENT_YEAR]-AUTO"]
Date: [noticeDate format: DD MMMM YYYY]
Delivery Method: [deliveryMethod]
[If deliveryMethod is "Courier": "Courier: [courierName] | Tracking: [trackingNumber]"]

===== SECTION 1: PARTIES IDENTIFICATION =====

LANDLORD (Terminating Party):
• Name: [landlordName]
• Emirates ID/Passport: [landlordId]
• Address: [landlordAddress]
• Phone: [landlordPhone]
• Email: [landlordEmail]

TENANT (Recipient):
• Name: [tenantName]
• Emirates ID/Passport: [tenantId]
• Current Address: [tenantAddress]
• Phone: [tenantPhone]
• Email: [tenantEmail]

===== SECTION 2: PROPERTY IDENTIFICATION =====

PROPERTY DETAILS:
• Address: [propertyAddress]
• Property Type: [propertyType]
• Unit/Plot Number: [unitNumber]
[If propertyArea provided: "• Area: [propertyArea] sq. meters"]
[If propertyFeatures provided: "• Identifying Features: [propertyFeatures]"]

===== SECTION 3: ORIGINAL LEASE REFERENCE =====

ORIGINAL LEASE:
• Lease Date: [originalLeaseDate format: DD MMMM YYYY]
• Lease Start: [leaseStartDate format: DD MMMM YYYY]
• Lease End: [leaseEndDate format: DD MMMM YYYY]
[If ejariNumber provided: "• Registration Number: [ejariNumber]"]
• Current Status: [currentLeaseStatus]

===== SECTION 4: TERMINATION REASON & LEGAL GROUNDS =====

REASON FOR TERMINATION:
[terminationReason]

LEGAL BASIS:
[legalBasis]

DETAILED EXPLANATION:
[terminationDescription]

[If supportingDocs provided]
SUPPORTING DOCUMENTATION:
[supportingDocs]

[If priorWarnings is "Yes"]
PRIOR WARNINGS ISSUED:
[priorWarningDates]

===== SECTION 5: NOTICE PERIOD SPECIFICATION =====

NOTICE PERIOD PROVIDED: [noticePeriodDays] days
LEGAL REQUIREMENT: [minNoticePeriod] days minimum
NOTICE EFFECTIVE DATE: [noticeEffectiveDate format: DD MMMM YYYY]
TERMINATION EFFECTIVE DATE: [terminationDate format: DD MMMM YYYY]

COMPLIANCE STATEMENT:
[noticePeriodCompliance]

===== SECTION 6: PROPERTY CONDITION & HANDOVER OBLIGATIONS =====

TENANT MUST RETURN PROPERTY IN SAME CONDITION (normal wear excepted):

CLEANLINESS STANDARD REQUIRED: [cleanlinessStandard]

KEYS & ACCESS DEVICES TO RETURN:
[keysToReturn]

REPAIRS REQUIRED:
[repairsRequired]

UTILITIES FINAL SETTLEMENT:
[utilitiesFinal]

===== SECTION 7: MOVE-OUT INSPECTION & HANDOVER =====

[If moveOutInspection is "Yes"]
INSPECTION PROCEDURE:
• Contact: [inspectionContact]
• Phone: [inspectionPhone]
• Email: [inspectionEmail]
• Schedule inspection between [noticeEffectiveDate] and [terminationDate]
• Joint inspection with landlord/representative
• Condition report to be documented with photos
• Both parties sign condition report
• Any disputes documented immediately

===== SECTION 8: SECURITY DEPOSIT SETTLEMENT =====

DEPOSIT AMOUNT: AED [securityDeposit]

RETURN TIMELINE:
Deposit returned within [depositReturnDays] days after:
• Lease termination date
• Final inspection completed
• All keys handed over
• All utilities settled
• Property condition verified

PERMITTED DEDUCTIONS:
[depositDeductions]

DEDUCTION PROCESS:
• Itemized deduction list provided
• Supporting documentation (receipts/invoices)
• Balance returned via [depositReturnMethod]
[If depositReturnMethod is "Bank Transfer" and tenantBankAccount provided: "• Account: [tenantBankAccount]"]

DISPUTE RESOLUTION:
If tenant disputes deductions, contact Rental Dispute Centre within 30 days.

===== SECTION 9: FINAL ACCOUNT SETTLEMENT =====

AMOUNTS DUE FROM TENANT:
[If finalRentDue provided: "• Final Rent: AED [finalRentDue]"]
[If utilitiesOwed provided: "• Utilities: AED [utilitiesOwed]"]
[If otherOwed provided: "• [otherDescription]: AED [otherOwed]"]
TOTAL DUE: AED [totalAmountDue]

PAYMENT DEADLINE: [paymentDeadline format: DD MMMM YYYY]
PAYMENT METHOD: [paymentMethod]

===== SECTION 10: CONSEQUENCES OF NON-COMPLIANCE =====

FAILURE TO VACATE BY [terminationDate format: DD MMMM YYYY]:

Landlord may:
• File eviction case with Rental Dispute Centre
• Seek court order for eviction
• Claim compensation for continued occupation
• Place lien on security deposit
• Report to credit authorities

FINANCIAL CONSEQUENCES:
• Daily occupation charge: AED [dailyOccupationCharge] per day
• Legal fees: Tenant responsible
• Compensation: As awarded by court/RDC

LEGAL ACTION TIMELINE:
[legalActionTimeline]
[If estimatedFilingDate provided: "• Court/RDC filing: [estimatedFilingDate format: DD MMMM YYYY]"]

PROPERTY DAMAGE:
• Tenant liable for all damage beyond normal wear
• Landlord may claim repair costs exceeding deposit
• Legal action for recovery

ADDITIONAL CONSEQUENCES:
[additionalConsequences]

===== SECTION 11: TENANT RIGHTS & PROTECTIONS =====

YOUR RIGHTS UNDER UAE TENANCY LAW:
• Right to proper notice period per law and contract
• Right to peaceful possession until [terminationDate]
• Right to security deposit return (minus lawful deductions)
• Right to dispute termination with Rental Dispute Centre
• Right to receive itemized deduction list
• Right to participate in final inspection
• Right to challenge unlawful eviction

TIME TO FILE DISPUTE:
You have [disputeFilingDays] days from receipt to challenge termination.

CONTACT AUTHORITY:
[disputeAuthority]

PROTECTION AGAINST UNLAWFUL EVICTION:
• Landlord cannot forcibly evict without court order
• Landlord cannot change locks while in possession
• Landlord cannot remove belongings
• Landlord cannot shut off utilities to force eviction

TENANT RIGHTS SUMMARY:
[tenantRightsSummary]

===== SECTION 12: FORWARDING ADDRESS & CONTACT =====

TENANT MUST PROVIDE WITHIN [forwardingAddressDeadline] DAYS:
• New/forwarding address
• Contact phone
• Contact email

PURPOSE:
Security deposit refund, final statements, utility bills, legal notices, correspondence.

===== SECTION 13: GOVERNING LAW & DISPUTE RESOLUTION =====

APPLICABLE LAWS:
[applicableLaws]

JURISDICTION:
Emirate: [emirate]
Disputes subject to [emirate] courts and authorities

DISPUTE RESOLUTION PROCESS:

1. AMICABLE RESOLUTION (30 days):
   Parties attempt direct negotiation

2. RENTAL DISPUTE CENTRE / AUTHORITY:
   [disputeAuthority]

3. COURT APPEAL (if necessary):
   Appeal RDC/authority decision to courts

===== SECTION 14: DATA PROTECTION & PDPL COMPLIANCE =====

PERSONAL DATA PROCESSING:
This notice involves processing personal data per UAE Federal Decree-Law No. 45 of 2021 (PDPL).

YOUR DATA RIGHTS:

RIGHT TO ACCESS:
• Request access to personal data held by landlord
• Request copies of tenancy records
• Landlord responds within 15 business days

RIGHT TO RECTIFICATION:
• Request correction of inaccurate data
• Landlord updates within 10 business days

RIGHT TO ERASURE:
• Request deletion after obligations fulfilled
• Note: Landlord must retain certain data for legal compliance ([dataRetentionPeriod])

RIGHT TO OBJECT:
• Object to certain data processing
• Landlord reviews within 30 days

RIGHT TO LODGE COMPLAINT:
• Contact UAE Data Office if rights violated
• Website: www.uaedpo.gov.ae

DATA RETENTION:
Records retained for [dataRetentionPeriod] as required by UAE law.

DATA PROTECTION CONTACT:
Email: [dataProtectionEmail]

===== SECTION 15: ACKNOWLEDGMENT & SIGNATURE =====

LANDLORD DECLARATION:
I, [landlordName], serve this Lease Termination Notice per UAE tenancy law and original lease agreement.
All information is true and accurate.

Landlord Signature: _____________________
Name: [landlordName]
Date: [noticeDate format: DD MMMM YYYY]

[If witnessName provided]
WITNESS:
Name: [witnessName]
Signature: _____________________
Date: _____________________

TENANT ACKNOWLEDGMENT:
I acknowledge receipt of this Lease Termination Notice.

Tenant Signature: _____________________
Name: [tenantName]
Date: _____________________

DELIVERY CONFIRMATION:
Notice delivered via: [deliveryConfirmationMethod]
[If tenantReceiptDate provided: "Tenant acknowledged receipt on: [tenantReceiptDate format: DD MMMM YYYY]"]

---END OF LEASE TERMINATION NOTICE---

PLACEHOLDERS: Replace ALL bracketed placeholders with actual information. Do NOT leave any [bracketed text] in final output.`,
  demand_letter: `Generate a comprehensive formal demand letter for payment or action, compliant with UAE legal requirements.

CRITICAL REQUIREMENTS - MUST INCLUDE ALL OF THESE:

STRUCTURE & FORMATTING:
Use these EXACT section headers in order:
1. REFERENCE & DATE
2. PARTIES (Sender and Recipient)
3. SUBJECT LINE (Clear statement of demand)
4. BACKGROUND & CONTEXT
5. NATURE OF DEBT/CLAIM (Clear reason for demand)
6. LEGAL BASIS & APPLICABLE LAW
7. AMOUNT DEMANDED (If applicable)
8. PAYMENT DEADLINE & REQUIRED ACTION
9. PAYMENT METHOD & INSTRUCTIONS
10. CONSEQUENCES OF NON-COMPLIANCE
11. GOVERNING LAW & DISPUTE RESOLUTION
12. DATA PROTECTION NOTICE
13. RESERVATION OF RIGHTS
14. SIGNATURE SECTION

LANGUAGE REQUIREMENTS:
- Use simple, clear sentences (maximum 20 words per sentence where possible)
- Avoid unnecessary legal jargon; use plain business language
- Use bullet points for payment details, consequences, and instructions
- Write in active voice, not passive
- Keep paragraphs short (3-4 sentences maximum)
- Use firm but professional tone

REASON FOR DEBT - CLEAR DEFINITION:
MUST explicitly reference the agreement, invoice, service, or transaction that gives rise to the debt/claim:

"NATURE OF DEBT/CLAIM:

This demand arises from: [debtType]

[If debtType contains "Unpaid Invoice"]
• Invoice Number: [invoiceNumber]
• Invoice Date: [invoiceDate format DD/MM/YYYY]
• Goods/Services Provided: [serviceDescription]
• Original Payment Terms: [originalPaymentTerms]
• Due Date: [originalDueDate format DD MMMM YYYY]
• Amount Outstanding: AED [amount]

[If debtType contains "Breach of Contract"]
• Contract Title: [contractTitle]
• Contract Date: [contractDate format DD/MM/YYYY]
• Relevant Contract Clause(s): [contractClause]
• Breach Details: [breachDetails]
• Amount Owed: AED [amount]

[If debtType contains "Payment for Services"]
• Service Agreement: [agreementReference if provided, else "As agreed between parties"]
• Services Performed: [serviceDescription]
• Service Period: [serviceStartDate] to [serviceEndDate if provided]
• Original Quote/Agreement Amount: AED [amount]
• Payment Terms: [originalPaymentTerms]

[If debtType contains "Loan Repayment"]
• Loan Agreement Reference: [loanReference]
• Loan Date: [loanDate format DD/MM/YYYY]
• Original Loan Amount: AED [originalLoanAmount]
• Repayment Terms: [repaymentTerms]
• Outstanding Balance: AED [amount]
• Overdue Installments: [overdueDetails]

[If debtType contains "Rental Arrears"]
• Lease Agreement Reference: [leaseReference]
• Property Address: [propertyAddress]
• Rental Period in Arrears: [rentalPeriod]
• Monthly/Annual Rent: AED [rentAmount]
• Total Arrears: AED [amount]

[If debtType contains "Other"]
• Basis of Claim: [otherDebtBasis]
• Amount Claimed: AED [amount]

DOCUMENTATION REFERENCE:
Supporting documents: [supportingDocs]"

PAYMENT DEADLINE - REALISTIC & CLEAR:
"PAYMENT DEADLINE & REQUIRED ACTION:

You are hereby required to pay the full outstanding amount of AED [amount] by:

DEADLINE: [If paymentDeadline provided: format as DD MMMM YYYY, else: "Within [deadlineCalendarDays] calendar days from the date of receipt of this letter"]

TIME IS OF THE ESSENCE: This deadline is strict and compliance is required by the specified date.

REQUIRED ACTION:
• Pay the full amount stated above by the deadline
[If partialPaymentAccepted contains "Yes"] • Alternatively, contact us within 7 days to propose a payment plan
• Provide written confirmation of payment via email to: [senderEmail]
• Provide proof of payment (bank transfer receipt or cheque copy)"

PAYMENT METHOD & INSTRUCTIONS - CLEAR & SPECIFIC:
"PAYMENT METHOD & INSTRUCTIONS:

Payment must be made via one of the following methods:

[If bankTransferAllowed contains "Yes"]
1. BANK TRANSFER (Preferred Method):
   Bank Name: [bankName]
   Account Name: [accountName]
   Account Number: [accountNumber]
   IBAN: [iban if provided]
   SWIFT Code (for international): [swiftCode if provided]
   Bank Branch: [bankBranch if provided]
   Reference: Please include "[referenceNumber if provided, else invoiceNumber if provided, else 'Payment for demand letter']" as payment reference

[If chequeAllowed contains "Yes"]
2. CHEQUE PAYMENT:
   Make cheque payable to: [chequePayeeName]
   Deliver cheque to: [chequeDeliveryAddress]
   Cheque must be dated no later than [paymentDeadline or "the deadline specified above"]
   Write reference "[referenceNumber]" on the back of cheque

[If cashAllowed contains "Yes"]
3. CASH PAYMENT (Only for amounts under AED 55,000 as per UAE law):
   Pay at: [cashPaymentAddress]
   Business Hours: [businessHours]
   Contact: [contactPerson if provided] - [contactPhone if provided]
   Obtain official receipt upon payment

[If onlinePaymentAllowed contains "Yes"]
4. ONLINE PAYMENT:
   Payment Portal: [paymentPortalURL]
   Reference Code: [referenceCode if provided]

PAYMENT CONFIRMATION:
Upon making payment, please:
• Email proof of payment to: [senderEmail]
• Include reference number: [referenceNumber if provided, else invoiceNumber if provided]
• Phone: [senderPhone]

IMPORTANT: 
- Payment must be received by the deadline, not just initiated
- Bank charges are the responsibility of the payer
- Payment in any currency other than AED requires prior written agreement"

APPLICABLE LAW - UAE-SPECIFIC REFERENCES:
"LEGAL BASIS & APPLICABLE LAW:

This demand is made pursuant to and in accordance with: [applicableLaw]

You are legally obligated to settle this debt under the applicable laws of the United Arab Emirates.

LEGAL CONSEQUENCES:
Failure to comply may result in legal action under the above-cited laws, including but not limited to:
• Civil claim for recovery of debt plus interest [if interestRate provided: "at [interestRate]% per period"]
• Legal costs and attorney fees [if estimatedLegalCosts provided: "(estimated at AED [estimatedLegalCosts])"]
• Court filing fees
• Enforcement proceedings if judgment is obtained"

CONSEQUENCES OF NON-COMPLIANCE - SPECIFIC & ACTIONABLE:
"CONSEQUENCES OF NON-COMPLIANCE:

Failure to pay the outstanding amount by the deadline will result in the following actions WITHOUT FURTHER NOTICE:

[consequences]

IMMEDIATE LEGAL CONSEQUENCES:
1. LEGAL PROCEEDINGS:
   • We will initiate civil legal proceedings in the [emirate] Courts
   • A formal lawsuit will be filed for recovery of the debt
   • Court filing fees will be added to the amount claimed

2. ADDITIONAL COSTS:
   [If interestRate provided] • Late payment interest will be charged at [interestRate]% per period
   [If estimatedLegalCosts provided] • Legal fees and attorney costs will be claimed (estimated at AED [estimatedLegalCosts])
   • Court costs and enforcement fees will be added

[If creditReportingThreat contains "Yes"]
3. CREDIT IMPACT:
   • This default may be reported to UAE credit bureaus (Al Etihad Credit Bureau - AECB)
   • Negative credit reporting may affect your ability to obtain future credit in the UAE
   • May impact visa renewal or business license renewal (if applicable)

4. ENFORCEMENT ACTIONS (if judgment is obtained):
   • Wage garnishment (for employed individuals)
   • Bank account attachment
   • Asset seizure or lien on property
   • Travel ban (in certain cases under UAE law)

ALTERNATIVE RESOLUTION:
[If previousAttempts provided]
Previous attempts to resolve: [previousAttempts]

If you are experiencing genuine financial hardship, you must contact us immediately at [senderPhone] or [senderEmail] BEFORE the deadline to discuss potential payment arrangements. Failure to communicate will be considered unwillingness to settle the matter amicably.

We reserve the right to pursue all legal remedies available under UAE law."

GOVERNING LAW & DISPUTE RESOLUTION:
"GOVERNING LAW & DISPUTE RESOLUTION:

GOVERNING LAW:
This demand letter and any dispute arising from the underlying debt/claim shall be governed by and construed in accordance with the laws of the United Arab Emirates, specifically: [applicableLaw]

JURISDICTION:
Any legal proceedings arising from this matter shall be subject to the exclusive jurisdiction of the competent courts of [emirate], United Arab Emirates.

Specifically:
• First Instance: [emirate] Court of First Instance
• Appeals: [emirate] Court of Appeal
• Final Appeals: Federal Supreme Court (if applicable)

DISPUTE RESOLUTION:
1. Amicable Settlement (Preferred):
   We encourage you to contact us immediately to resolve this matter amicably before legal action becomes necessary.

2. Litigation (Final Step):
   If no payment or satisfactory arrangement is made by the deadline, we will proceed with litigation without further notice.

TIME FOR RESPONSE:
You have until the deadline specified above to either:
• Pay the full amount, OR
• Contact us with a genuine proposal for resolution

Failure to respond will be deemed as refusal to settle, and legal action will proceed."

DATA PROTECTION & PDPL COMPLIANCE:
"DATA PROTECTION NOTICE (UAE PDPL Compliance):

This demand letter contains personal and/or business data protected under UAE Federal Law No. 45 of 2021 (Personal Data Protection Law - PDPL).

PERSONAL DATA INCLUDED:
• Full name, address, and contact details of sender and recipient
• Financial information (amounts owed, payment details)
• Contractual or transactional information

WHO CAN ACCESS THIS DATA:
This letter and the information contained herein may be accessed by:
• The named recipient (debtor/respondent)
• Authorized legal representatives of the sender
• UAE courts and judicial authorities (if legal proceedings are initiated)
• Law enforcement and regulatory authorities (if legally required)
• Legal counsel and advisors engaged by either party
[If creditReportingThreat contains "Yes"] • Credit bureaus (if default is reported under UAE law)

PURPOSE OF DATA PROCESSING:
Personal data is processed solely for the purposes of:
• Debt recovery and enforcement of legal rights
• Legal proceedings and court filings (if necessary)
• Communication regarding the outstanding debt
• Compliance with legal and regulatory obligations

DATA RETENTION:
This letter and associated data will be retained for:
• Duration of debt recovery proceedings
• Minimum of 5 years after final settlement or judgment as required by UAE law
• In accordance with legal record-keeping obligations under UAE law

CONFIDENTIALITY:
This letter is confidential and intended solely for the named recipient. Unauthorized disclosure or distribution is prohibited."

RESERVATION OF RIGHTS:
"RESERVATION OF RIGHTS:

The sender expressly reserves all rights, remedies, and defenses available under UAE law and applicable contracts/agreements.

RIGHTS RESERVED:
• Right to pursue full legal action for recovery of the debt plus costs
[If interestRate provided] • Right to claim interest on the outstanding amount
• Right to claim damages for breach of contract
• Right to terminate any underlying agreements for non-payment
[If creditReportingThreat contains "Yes"] • Right to report default to credit bureaus
• Right to seek injunctive relief or other equitable remedies
• Right to pursue enforcement actions if judgment is obtained
• Right to amend or supplement this claim based on subsequently discovered facts

NO WAIVER:
• This letter does not constitute a waiver of any rights or remedies
• Acceptance of partial payment shall not be construed as full settlement unless explicitly agreed in writing
• Failure to immediately pursue legal action does not waive the right to do so in the future
• All rights remain in full force and effect subject to applicable statutory limitation periods"

PROFESSIONAL FORMATTING:
- Use proper formal business letter header with sender and recipient details
- Include reference number: "Ref: [referenceNumber if provided] / Date: [current date]"
- Include clear subject line: "FORMAL DEMAND FOR PAYMENT - [Brief description]"
- Use professional salutation: "Dear [recipientName],"
- End with "Yours faithfully," or "Yours sincerely," followed by signature section
- Include sender contact information (phone, email, address) for response

PLACEHOLDERS:
Replace ALL bracketed placeholders with actual information provided in letter details. Do NOT leave any [bracketed text] in the final output unless explicitly asking recipient to provide information.`,
  nda: `Generate a non-disclosure agreement suitable for business use in the UAE. 
MUST include these mandatory clauses:
- Governing Law: "This Agreement shall be governed by and construed in accordance with the laws of the United Arab Emirates."
- Dispute Resolution: "Any dispute arising out of or in connection with this Agreement shall be resolved through [UAE courts/arbitration], with jurisdiction in [specific Emirate]."
Ensure these clauses are prominently placed near the end of the agreement, before the signature section.`,
  settlement_agreement: `Generate a comprehensive Settlement Agreement for dispute resolution compliant with UAE legal requirements.

CRITICAL REQUIREMENTS - MUST INCLUDE ALL OF THESE:

STRUCTURE & FORMATTING:
Use these EXACT section headers in order:
1. SETTLEMENT AGREEMENT HEADING & REFERENCE
2. PARTIES TO THE SETTLEMENT
3. RECITALS & BACKGROUND (Whereas clauses)
4. DEFINITIONS & INTERPRETATION
5. DISPUTE DESCRIPTION & CONTEXT
6. TERMS OF SETTLEMENT
7. PAYMENT TERMS & SCHEDULE (if applicable)
8. MUTUAL RELEASE OF CLAIMS
9. NO ADMISSION OF LIABILITY
10. CONFIDENTIALITY CLAUSE
11. NON-DISPARAGEMENT (if applicable)
12. GOVERNING LAW & JURISDICTION
13. DISPUTE RESOLUTION FOR BREACH OF SETTLEMENT
14. DATA PROTECTION & PDPL COMPLIANCE
15. GENERAL PROVISIONS
16. EFFECTIVENESS & TERMINATION
17. NOTARIZATION REQUIREMENTS (if applicable)
18. SIGNATURES & WITNESSES

LANGUAGE REQUIREMENTS:
- Use simple, clear sentences (maximum 20 words per sentence where possible)
- Avoid unnecessary legal jargon; use plain business language
- Use bullet points for payment details, obligations, and instructions
- Write in active voice, not passive
- Keep paragraphs short (3-4 sentences maximum)
- Use formal but clear tone

AGREEMENT HEADING & REFERENCE:
"SETTLEMENT AGREEMENT

Reference No: [agreementReference if provided, else "SA-" + current date]
Date of Agreement: [agreementDate format DD MMMM YYYY]
Place of Execution: [agreementLocation], United Arab Emirates"

PARTIES TO THE SETTLEMENT:
"PARTIES:

PARTY A (First Party):
Full Legal Name: [partyAName]
Emirates ID / Passport: [partyAEmiratesId]
Address: [partyAAddress]
Email: [partyAEmail]
Phone: [partyAPhone]
[If partyALegalRep provided: "Represented by: [partyALegalRep] (Emirates ID: [partyALegalRepId])"]

AND

PARTY B (Second Party):
Full Legal Name: [partyBName]
Emirates ID / Passport: [partyBEmiratesId]
Address: [partyBAddress]
Email: [partyBEmail]
Phone: [partyBPhone]
[If partyBLegalRep provided: "Represented by: [partyBLegalRep] (Emirates ID: [partyBLegalRepId])"]

(Hereinafter collectively referred to as 'the Parties' and individually as 'a Party')"

RECITALS & BACKGROUND:
"RECITALS:

WHEREAS the Parties have been involved in a dispute concerning: [natureOfDispute]

WHEREAS the details of the dispute are as follows:
[disputeDescription]

WHEREAS the dispute originated on or about: [disputeOriginDate format DD MMMM YYYY]
[If disputeReference provided: "Reference: [disputeReference]"]

WHEREAS the Parties have attempted to resolve this matter through: [previousAttempts]

WHEREAS the Parties now wish to settle all differences and disputes between them on the terms and conditions set forth in this Agreement;

WHEREAS the Parties acknowledge that this Settlement is made voluntarily and without coercion;

NOW, THEREFORE, in consideration of the mutual covenants and agreements contained herein and for other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the Parties agree as follows:"

DEFINITIONS & INTERPRETATION:
"DEFINITIONS:

For purposes of this Agreement:
• 'Settlement Date' means the date of execution of this Agreement
• 'Dispute' means the matter described in the Recitals above
• 'Settlement Terms' means the obligations and conditions set forth in Section 6
[If paymentInvolved contains "Yes": "• 'Settlement Amount' means the total sum of AED [settlementAmount] ([settlementAmountWords])"]
• 'Effective Date' means [releaseEffectiveDate format DD MMMM YYYY]
• 'Confidential Information' includes the terms of this Settlement and all related documents"

DISPUTE DESCRIPTION & CONTEXT:
"DISPUTE DESCRIPTION:

NATURE OF DISPUTE: [natureOfDispute]

DETAILED DESCRIPTION:
[disputeDescription - Must be precise and unambiguous]

ORIGIN DATE: [disputeOriginDate format DD MMMM YYYY]

[If disputeReference provided: "REFERENCE/CASE NUMBER: [disputeReference]"]

PREVIOUS RESOLUTION ATTEMPTS:
[previousAttempts]

DISPUTE OBJECTIVE:
The Parties seek to: [settlementObjective]"

TERMS OF SETTLEMENT:
"SETTLEMENT TERMS:

The Parties agree to the following terms in full and final settlement of the Dispute:

KEY OBLIGATIONS:
[settlementTerms]

[If nonMonetaryObligations provided]
NON-MONETARY OBLIGATIONS:
[nonMonetaryObligations]

[If conditionsPrecedent provided]
CONDITIONS PRECEDENT:
The following conditions must be satisfied before this Settlement becomes effective:
[conditionsPrecedent]

PERFORMANCE TIMELINE:
[If performanceTimeline provided: "[performanceTimeline]", else: "The Parties shall perform their obligations within reasonable time as specified herein."]

[If deliveryRequirements provided]
DELIVERY REQUIREMENTS:
[deliveryRequirements]"

PAYMENT TERMS (If Applicable):
"[If paymentInvolved contains "Yes"]
PAYMENT TERMS:

TOTAL SETTLEMENT AMOUNT:
The total settlement amount is: AED [settlementAmount] ([settlementAmountWords])

Currency: [currency, default: AED (United Arab Emirates Dirhams)]

PAYMENT STRUCTURE: [paymentStructure]

[If paymentStructure contains "Lump Sum"]
• The entire amount shall be paid in a single lump sum payment

[If paymentStructure contains "Installments"]
• Payment shall be made in installments as follows: [paymentSchedule]

PAYMENT METHOD: [paymentMethod]

[If paymentMethod contains "Bank Transfer"]
BANK DETAILS:
• Bank Name: [bankName]
• Account Name: [accountName]
• Account Number: [accountNumber]
• IBAN: [iban]

[If paymentMethod contains "Cheque"]
CHEQUE PAYMENT:
• Cheque payable to: [accountName]
• Post-dated cheques (if applicable): [paymentSchedule]

PAYMENT DEADLINE:
[paymentSchedule]

TIME IS OF THE ESSENCE: Payment must be made by the specified deadlines.

LATE PAYMENT:
[If latePaymentConsequences provided: "[latePaymentConsequences]", else: "Late payment may result in breach of this Settlement Agreement and revival of original claims."]

RECEIPT & CONFIRMATION:
[If receiptRequirements provided: "[receiptRequirements]", else: "Party A shall provide written confirmation of receipt of payment within 3 business days."]]"

MUTUAL RELEASE OF CLAIMS:
"MUTUAL RELEASE:

[If partyAReleasesB contains "Yes"]
PARTY A RELEASES PARTY B:
Party A ([partyAName]) hereby irrevocably and unconditionally releases, acquits, and forever discharges Party B ([partyBName]), including their heirs, successors, assigns, and legal representatives, from:

[partyAReleaseScope]

This release is effective from: [releaseEffectiveDate format DD MMMM YYYY]

[If partyBReleasesA contains "Yes"]
PARTY B RELEASES PARTY A:
Party B ([partyBName]) hereby irrevocably and unconditionally releases, acquits, and forever discharges Party A ([partyAName]), including their heirs, successors, assigns, and legal representatives, from:

[partyBReleaseScope]

This release is effective from: [releaseEffectiveDate format DD MMMM YYYY]

[If partyAReleasesB contains "Yes" AND partyBReleasesA contains "Yes"]
MUTUAL RELEASE:
This is a mutual release. Both Parties release each other from all claims, demands, actions, causes of action, damages, costs, and expenses of any nature whatsoever, whether known or unknown, arising from or related to the Dispute described herein.

SCOPE OF RELEASE:
The release extends to all claims that could have been asserted in connection with the Dispute, including but not limited to claims for:
• Breach of contract
• Damages (direct, indirect, consequential)
• Legal costs and expenses
• Interest and penalties
• Any other claims related to the Dispute

RESERVATION OF RIGHTS:
This release does not extend to:
• Rights and obligations created by this Settlement Agreement
• Claims arising from breach of this Settlement Agreement
• Claims unrelated to the Dispute described herein"

NO ADMISSION OF LIABILITY:
"[If noAdmissionOfLiability contains "Yes" OR noAdmissionOfLiability is not provided]
NO ADMISSION OF LIABILITY:

The Parties expressly agree and acknowledge that:

• This Settlement Agreement does NOT constitute an admission of liability, fault, wrongdoing, or responsibility by any Party
• Neither Party admits to any breach of contract, negligence, or violation of law
• This Settlement is entered into solely to avoid the costs, uncertainty, and inconvenience of litigation
• No Party shall construe or represent this Settlement as an acknowledgment of any wrongful conduct

[If additionalLiabilityQualifications provided]
ADDITIONAL QUALIFICATIONS:
[additionalLiabilityQualifications]]"

CONFIDENTIALITY CLAUSE:
"[If isConfidential contains "Yes"]
CONFIDENTIALITY:

CONFIDENTIAL NATURE:
The Parties agree that this Settlement Agreement and all terms contained herein are CONFIDENTIAL.

SCOPE OF CONFIDENTIALITY:
The following information shall be treated as confidential:
[confidentialityScope]

WHO MAY ACCESS SETTLEMENT TERMS:
Disclosure is permitted only to:
[If whoCanAccess includes "Legal Advisors": "• The Parties' legal counsel and attorneys"]
[If whoCanAccess includes "Financial Advisors": "• Financial advisors and accountants (subject to confidentiality obligations)"]
[If whoCanAccess includes "Courts": "• Courts and judicial authorities (if legally required or to enforce this Agreement)"]
[If whoCanAccess includes "Auditors": "• External auditors (subject to professional confidentiality)"]
• No other person or entity without prior written consent

EXCEPTIONS TO CONFIDENTIALITY:
Disclosure is permitted without consent in the following circumstances:
[confidentialityExceptions]

BREACH OF CONFIDENTIALITY:
[If breachOfConfidentialityConsequences provided: "[breachOfConfidentialityConsequences]", else: "Breach of this confidentiality clause shall entitle the non-breaching Party to seek injunctive relief and claim damages."]

[If isConfidential contains "No"]
NON-CONFIDENTIAL:
This Settlement Agreement is not confidential and may be disclosed by either Party as they deem appropriate.]"

NON-DISPARAGEMENT:
"[If includeNonDisparagement contains "Yes"]
NON-DISPARAGEMENT:

The Parties agree:

• Neither Party shall make any disparaging, defamatory, or negative statements about the other Party
• This obligation extends to statements made publicly, privately, orally, in writing, or through any media
• Each Party shall refrain from actions that harm the reputation, business, or standing of the other Party

  [If nonDisparagementDetails provided]
  SPECIFIC TERMS:
  [nonDisparagementDetails]]

This non-disparagement obligation survives the termination or completion of this Settlement Agreement.]"

GOVERNING LAW & JURISDICTION:
"GOVERNING LAW:

This Settlement Agreement shall be governed by, interpreted, and construed in accordance with the laws of the United Arab Emirates, specifically:
• UAE Federal Law No. 5 of 1985 (Civil Transactions Law)
• Other applicable UAE Federal and Emirate-level laws

JURISDICTION:

The Parties agree that any legal proceedings arising from or related to this Settlement Agreement shall be subject to the exclusive jurisdiction of the courts of: [jurisdictionEmirate], United Arab Emirates

Specifically:
• First Instance: [jurisdictionEmirate] Court of First Instance
• Appeals: [jurisdictionEmirate] Court of Appeal
• Final Appeals: Federal Supreme Court (if applicable)"

DISPUTE RESOLUTION FOR BREACH:
"DISPUTE RESOLUTION:

In the event of a dispute arising from the interpretation, performance, or breach of this Settlement Agreement, the Parties agree to the following resolution process:

[If disputeResolutionMethod contains "Courts"]
LITIGATION:
Any dispute shall be resolved exclusively through litigation in the courts of [jurisdictionEmirate], UAE, as specified in the Jurisdiction clause above.

[If disputeResolutionMethod contains "Arbitration"]
ARBITRATION:
• Any dispute shall be resolved through arbitration in accordance with: [arbitrationDetails]
• The arbitration shall be conducted in: [jurisdictionEmirate], UAE
• The language of arbitration: [language, default: English and Arabic]
• The arbitrator's decision shall be final and binding on both Parties
• Either Party may enforce the arbitration award in any competent court

[If disputeResolutionMethod contains "Mediation"]
MEDIATION FOLLOWED BY COURTS:
• The Parties shall first attempt to resolve any dispute through mediation
• If mediation fails within [default: 30] days, either Party may proceed to litigation in [jurisdictionEmirate] Courts

GOOD FAITH NEGOTIATION:
Before initiating formal dispute resolution, the Parties agree to negotiate in good faith for a period of [default: 14] days."

EFFECTIVENESS & TERMINATION:
"EFFECTIVENESS:

This Settlement Agreement shall become effective upon: [If conditionsPrecedent provided: "satisfaction of all Conditions Precedent as specified in Section 6", else: "the date of execution by all Parties"]

COMPLETION:

This Settlement Agreement shall be deemed complete and discharged upon:
[If paymentInvolved contains "Yes": "• Full payment of the Settlement Amount as specified"]
• Performance of all obligations by all Parties
• Satisfaction of all conditions and terms herein

SURVIVAL:

The following provisions shall survive completion of this Agreement:
• Mutual Release (Section 8)
• No Admission of Liability (Section 9)
• Confidentiality (Section 10)
• Non-Disparagement (Section 11, if applicable)
• Data Protection (Section 14)
• Governing Law & Dispute Resolution (Sections 12-13)"

NOTARIZATION:
"[If requiresNotarization contains "Yes"]
NOTARIZATION REQUIREMENTS:

This Settlement Agreement shall be notarized in accordance with UAE law.

NOTARY LOCATION: [notaryLocation]

NOTARY CERTIFICATION:
The notary public shall certify:
• The identity of all signatories
• The voluntary nature of this Agreement
• The legal capacity of all Parties
• The authenticity of signatures

[If witnessesRequired > 0]
WITNESSES REQUIRED: [witnessesRequired] witness(es) must be present during execution and notarization

[If witnessesRequired >= 1 AND witness1Name provided]
WITNESS 1:
Name: [witness1Name]
Emirates ID: [witness1EmiratesId]

[If witnessesRequired >= 2 AND witness2Name provided]
WITNESS 2:
Name: [witness2Name]
Emirates ID: [witness2EmiratesId]

[If requiresNotarization contains "No"]
This Settlement Agreement does not require notarization but shall be executed under the hands and seals of the Parties.]"

SIGNATURES:
"SIGNATURES:

IN WITNESS WHEREOF, the Parties have executed this Settlement Agreement on the date first written above.

PARTY A:
_________________________
[partyAName]
Emirates ID: [partyAEmiratesId]
Date: _________________

[If partyALegalRep provided]
On behalf of Party A:
_________________________
[partyALegalRep]
(Authorized Representative)
Date: _________________


PARTY B:
_________________________
[partyBName]
Emirates ID: [partyBEmiratesId]
Date: _________________

[If partyBLegalRep provided]
On behalf of Party B:
_________________________
[partyBLegalRep]
(Authorized Representative)
Date: _________________

[If witnessesRequired >= 1]
WITNESSES:

WITNESS 1:
_________________________
[witness1Name]
Emirates ID: [witness1EmiratesId]
Date: _________________

[If witnessesRequired >= 2]
WITNESS 2:
_________________________
[witness2Name]
Emirates ID: [witness2EmiratesId]
Date: _________________

[If requiresNotarization contains "Yes"]
NOTARY PUBLIC:
_________________________
Notary Name: _____________
Notary Registration No: ___
Place of Notarization: [notaryLocation]
Date: _________________
[Notary Seal]"

PLACEHOLDERS:
Replace ALL bracketed placeholders with actual information provided in letter details. Do NOT leave any [bracketed text] in the final output unless explicitly asking recipient to provide information.`,
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
  
  general: `\n\nDATA PROTECTION NOTICE:\nThis document contains personal data that is protected under UAE Federal Law No. 45 of 2021 on the Protection of Personal Data. All parties must handle this information in accordance with applicable data protection regulations and use it only for the purposes stated in this document.`,

  settlement: `

DATA PROTECTION NOTICE (UAE PDPL COMPLIANCE):

This Settlement Agreement contains personal data protected under UAE Federal Law No. 45 of 2021 (Personal Data Protection Law - PDPL).

PERSONAL DATA INCLUDED:
• Party names, addresses, Emirates ID numbers, contact details
• Financial information (settlement amounts, payment details)
• Dispute-related information and communications
• Legal representative details (if applicable)

DATA PROCESSING PURPOSE:
Personal data is processed solely for:
• Execution and enforcement of this settlement agreement
• Legal compliance and record-keeping obligations
• Communication regarding settlement terms
• Court proceedings (if breach of settlement occurs)

WHO CAN ACCESS THIS DATA:
• The named parties to this settlement
• Legal representatives and counsel of the parties
• Financial institutions (for payment processing only)
• UAE courts and judicial authorities (if legally required)
• Arbitrators or mediators (if dispute resolution invoked)
• Auditors (subject to confidentiality obligations)

DATA RETENTION PERIOD:
• Active retention: Duration of settlement obligations plus [retentionPeriod, default: 5] years from date of final payment/completion
• After retention period: Personal data shall be securely deleted or anonymized in accordance with PDPL Article 21
• Legal exception: Data may be retained longer if required by UAE law or ongoing legal proceedings

DATA SUBJECT RIGHTS (PDPL Article 13):
Each party has the right to:
• Access their personal data in this agreement
• Request correction of inaccurate data
• Object to data processing (subject to legal obligations)
• Request deletion after retention period expires
• Lodge complaints with UAE Data Protection Office

DATA SECURITY:
All parties agree to:
• Store this agreement securely (physical and electronic copies)
• Limit access to authorized persons only
• Implement appropriate technical and organizational measures per PDPL Article 8
• Report any data breach immediately to affected parties

CONFIDENTIAL TREATMENT:
Personal data in this settlement shall be treated as confidential in accordance with the Confidentiality Clause of this agreement.

CROSS-BORDER TRANSFER:
Any transfer of personal data outside the UAE shall comply with PDPL Article 23 and require explicit consent unless falling within permitted exceptions.`,
};

const LEASE_AGREEMENT_LEGAL_CLAUSES = `

ADDITIONAL LEGAL PROVISIONS FOR LEASE AGREEMENTS:

UAE TENANCY LAW COMPLIANCE:
This lease agreement is governed by:
• UAE Federal Law No. 26 of 2007 (Regulating the Relationship between Landlords and Tenants)
• Dubai Law No. 26 of 2007 and RERA regulations (if Dubai property)
• Abu Dhabi Law No. 20 of 2006 and Tawtheeq regulations (if Abu Dhabi property)
• Relevant emirate-specific tenancy regulations

RENT INCREASE RESTRICTIONS:
• Rent increases are subject to RERA Rent Index (Dubai) or equivalent emirate regulations
• Rent cannot be increased during the lease term
• Rent increase allowed only upon renewal and must comply with:
  - Maximum increase as per RERA calculator/index
  - 90 days advance written notice required
  - No increase if current rent is within 10% of market rate (Dubai)

EVICTION PROCEDURES:
Landlord may only evict tenant through proper legal channels:
• Non-payment of rent: 30 days written notice required
• Breach of lease terms: Opportunity to remedy breach must be given
• Landlord personal use: 12 months written notice required
• Property demolition/renovation: 12 months written notice + compensation
• All evictions must be processed through Rental Dispute Centre (Dubai) or equivalent
• Self-help eviction is illegal and may result in penalties

TENANT PROTECTION RIGHTS:
• Tenant cannot be evicted without court order
• Tenant has right to renew lease at market rate (unless landlord has valid reason)
• Security deposit protected by law - must be returned within reasonable time
• Tenant has right to file complaint with RERA/Municipality if rights violated
• Rent cannot be demanded in advance beyond contract terms

EJARI/TAWTHEEQ REGISTRATION:
• Dubai properties: MUST be registered with Ejari within 30 days
• Abu Dhabi properties: MUST be registered with Tawtheeq
• Registration is legal requirement - unregistered lease may not be enforceable
• Both parties should retain copy of registration certificate
• Renewal must also be registered

LANDLORD OBLIGATIONS:
• Provide habitable property meeting safety and health standards
• Complete agreed repairs within reasonable timeframe
• Not interfere with tenant's peaceful enjoyment of property
• Maintain building structure and common areas
• Comply with all building codes and regulations
• Cannot enter property without proper notice (except emergency)

TENANT OBLIGATIONS:
• Pay rent on time as per agreement
• Maintain property in good condition
• Use property only for permitted purpose
• Not cause damage or nuisance
• Allow landlord access for repairs/inspections with proper notice
• Return property in same condition (normal wear and tear excepted)
• Comply with building rules and community regulations

RENT PAYMENT RULES:
• Post-dated cheques are common practice in UAE but not legally required
• Payment by bank transfer is acceptable alternative
• Cash payment allowed but receipt must be provided
• Rent must be paid on due date - late payment may incur penalties
• Bounced cheque is criminal offense in UAE and may result in:
  - Legal action by landlord
  - Travel ban
  - Criminal case
  - Additional financial penalties

SECURITY DEPOSIT REGULATIONS:
• Typical security deposit: 5-10% of annual rent
• Must be held in separate account (best practice)
• Can only be deducted for:
  - Actual damages beyond normal wear and tear
  - Unpaid rent
  - Unpaid utilities
  - Cleaning costs (if property left in poor condition)
• Itemized deduction list must be provided to tenant
• Must be returned within reasonable time (typically 30-60 days)
• Disputes over deposit can be filed with RERA/RDC

MAINTENANCE & REPAIR LEGAL FRAMEWORK:
• Landlord responsible for structural and major repairs
• Tenant responsible for minor repairs and maintenance
• Emergency repairs: Tenant may arrange and deduct from rent if landlord unresponsive
• Cost disputes can be resolved through RERA/RDC
• Landlord must maintain property to habitable standard

FORCE MAJEURE:
Neither party liable for failure to perform due to circumstances beyond control:
• Natural disasters
• Government actions/regulations
• Pandemics
• War or civil unrest
However, rent obligations typically continue unless property uninhabitable

JURISDICTION & DISPUTE RESOLUTION:
Step 1: Amicable Resolution (30 days)
- Parties attempt to resolve dispute directly
- Written communication recommended

Step 2: Rental Dispute Centre (Dubai) / Equivalent
- File case with RDC (Dubai) or relevant authority
- Mediation attempted first
- Binding decision if mediation fails

Step 3: Courts (if necessary)
- Appeal RDC decision to courts
- Final judicial determination

APPLICABLE LAWS BY EMIRATE:
• Dubai: RERA (Real Estate Regulatory Agency) - www.rdc.ae
• Abu Dhabi: Tawtheeq (Rental Contract Authentication System)
• Other Emirates: Respective municipality regulations

ACKNOWLEDGMENT OF LEGAL ADVICE:
Both parties acknowledge:
• Understanding all terms and conditions of this lease
• Opportunity to seek independent legal advice before signing
• Voluntary entry into this agreement
• Receipt of copy of signed lease agreement
• Awareness of rights and obligations under UAE tenancy law`;

const LEASE_TERMINATION_LEGAL_CLAUSES = `

LEGAL FRAMEWORK FOR LEASE TERMINATION IN UAE:

UAE FEDERAL LAW NO. 26 OF 2007:
This federal law regulates relationship between landlords and tenants across UAE.

KEY TERMINATION PROVISIONS:
• Article 25: Grounds for lease termination
• Article 25(1): Landlord-initiated termination with 12 months notice
• Article 25(2): Termination for tenant breach
• Notice requirements strictly enforced by courts

DUBAI LAW NO. 26 OF 2007 (AS AMENDED BY LAW NO. 33 OF 2008):
Specific to Dubai properties registered with RERA.

KEY PROVISIONS:
• 12 months notice for owner-occupation (personal use)
• 12 months notice for demolition/major renovation
• 90 days notice for non-renewal (at lease expiry)
• 30 days notice for non-payment after written demand
• Tenant protection against arbitrary eviction

ABU DHABI LAW NO. 20 OF 2006:
Governs tenancy relationships in Abu Dhabi.

KEY PROVISIONS:
• Similar notice requirements to federal law
• Tawtheeq registration mandatory
• Rent increase caps apply
• Dispute resolution through Municipality

LANDLORD-INITIATED TERMINATION:
Valid grounds for landlord to terminate lease:
1. Personal use or family member use (12 months notice)
2. Property sale (12 months notice + right of first refusal to tenant)
3. Major renovation/demolition (12 months notice + compensation)
4. Tenant breach of lease terms
5. Non-payment of rent (30 days after written demand)

NOTICE REQUIREMENTS:
• Must be in writing (registered mail or notary notification)
• Must specify grounds for termination
• Must provide proper notice period per law
• Verbal notice is not sufficient
• Notice period cannot be waived unless mutual agreement

TENANT-INITIATED TERMINATION:
Tenant may terminate lease:
• At end of lease term (90 days notice for non-renewal)
• For landlord breach (immediate termination possible)
• For property uninhabitability
• If landlord fails to provide essential services
• By mutual agreement

EARLY TERMINATION:
If tenant terminates early without valid reason:
• May forfeit security deposit
• May be liable for remaining rent (typically 2-3 months)
• Landlord must make reasonable effort to re-let property
• Tenant liability limited to actual landlord losses

SECURITY DEPOSIT DISPOSITION:
Upon lease termination:
• Landlord inspects property
• Deductions itemized in writing
• Balance returned within 30-60 days
• Disputes can be filed with RERA/RDC

PROPERTY HANDOVER:
• Tenant must return property in good condition (normal wear excepted)
• All utilities cleared and final bills paid
• Keys and access cards returned
• Forwarding address provided
• Joint inspection recommended (document condition)

MUTUAL TERMINATION:
Most flexible option:
• Both parties agree to terminate
• Terms negotiated freely
• Financial settlement agreed
• Security deposit disposition agreed
• Property handover terms agreed
• Release of claims agreed

BENEFITS:
• No court involvement
• Flexible terms
• Faster resolution
• Lower costs
• Preserve relationship

DOCUMENTATION:
• Written mutual termination agreement
• Signed by both parties
• Specify all terms clearly
• Notarized (recommended)
• Copy for each party

This notice is issued in compliance with UAE tenancy laws to protect the rights of both landlord and tenant.`;

const NDA_LEGAL_CLAUSES = `

GOVERNING LAW:
This Agreement shall be governed by and construed in accordance with the laws of the United Arab Emirates.

DISPUTE RESOLUTION:
Any dispute arising out of or in connection with this Agreement shall be resolved through [UAE courts/arbitration], with jurisdiction in [specific Emirate].

NOTE: The parties should specify their preferred dispute resolution method (courts or arbitration) and the specific Emirate (Dubai, Abu Dhabi, etc.) for jurisdiction.`;

const EMPLOYMENT_TERMINATION_CLAUSES = `

ADDITIONAL LEGAL PROVISIONS FOR EMPLOYMENT TERMINATION:

GOVERNING LAW:
This employment termination is governed by UAE Federal Decree-Law No. 33 of 2021 on the Regulation of Labor Relations (UAE Labor Law) and any applicable amendments.

EMPLOYEE RIGHTS:
The employee retains all rights granted under UAE Labor Law, including:
• Right to receive all end-of-service benefits as calculated per Labor Law Articles 51-56
• Right to file a complaint with MOHRE if rights are violated
• Right to challenge unfair termination (if applicable under Articles 44-48)
• Right to receive employment termination certificate (Article 57)

CERTIFICATE OF EMPLOYMENT:
Upon request, the Company will provide a Certificate of Employment stating employment period, position held, and final salary (if requested) within specified business days of the final working day.`;

const EMPLOYMENT_CONTRACT_CLAUSES = `

ADDITIONAL LEGAL PROVISIONS FOR EMPLOYMENT CONTRACTS:

GOVERNING LAW:
This employment contract is governed by UAE Federal Decree-Law No. 33 of 2021 (Labor Law), UAE Civil Transactions Law (Federal Law No. 5 of 1985), and any applicable free zone regulations.

DISCIPLINARY PROCEDURES:
Company may take disciplinary action for violations per Articles 43-44 including warning, suspension, fine, demotion, or termination for cause. Employee has right to be informed, respond, and appeal decisions.

ENTIRE AGREEMENT:
This contract constitutes the entire agreement and supersedes all prior agreements. May only be amended by written agreement signed by both parties.`;

const SETTLEMENT_AGREEMENT_CLAUSES = `

ADDITIONAL LEGAL PROVISIONS FOR SETTLEMENT AGREEMENTS:

INTERPRETATION & CONSTRUCTION:
This Settlement Agreement shall be interpreted in accordance with UAE law. In the event of ambiguity, the provisions shall not be construed against the drafting party. Headings are for convenience only and do not affect interpretation.

ENTIRE AGREEMENT:
This Settlement Agreement constitutes the entire agreement between the parties concerning the subject matter herein and supersedes all prior negotiations, representations, agreements, and understandings (whether written or oral) relating to the dispute described herein. No party has relied on any representation or warranty not expressly set forth in this agreement.

SEVERABILITY:
If any provision of this Settlement Agreement is found to be invalid, illegal, or unenforceable by a court of competent jurisdiction, such provision shall be severed from this agreement, and the remaining provisions shall continue in full force and effect. The parties agree to negotiate in good faith to replace any severed provision with a valid provision that achieves the original intent.

AMENDMENT & MODIFICATION:
This Settlement Agreement may only be amended, modified, or supplemented by a written instrument signed by all parties. No oral modification shall be valid. Any purported amendment that is not in writing and signed by all parties shall be null and void.

WAIVER:
No waiver of any provision of this Settlement Agreement shall be effective unless in writing and signed by the party against whom the waiver is sought to be enforced. Waiver of any breach shall not constitute a waiver of any subsequent breach. The failure of any party to enforce any provision shall not be construed as a waiver of that provision or any other provision.

BINDING EFFECT:
This Settlement Agreement shall be binding upon and inure to the benefit of the parties and their respective heirs, executors, administrators, successors, and permitted assigns. No party may assign their rights or obligations under this agreement without the prior written consent of the other party, except as may be required by law.

COUNTERPARTS & SIGNATURES:
This Settlement Agreement may be executed in counterparts, each of which shall be deemed an original and all of which together shall constitute one and the same instrument. Electronic signatures and scanned copies of signatures shall have the same legal effect as original signatures.

NOTICES:
All notices, demands, or communications required or permitted under this Settlement Agreement shall be in writing and delivered by:
• Hand delivery (with signed acknowledgment)
• Registered mail with return receipt requested
• Email to the addresses specified in this agreement (with read receipt)

Notices shall be deemed effective:
• Upon hand delivery
• 3 business days after posting by registered mail
• Upon confirmed receipt of email

LANGUAGE:
This Settlement Agreement is executed in [language, default: English and Arabic]. In case of conflict between versions, the [language] version shall prevail.

AUTHORITY TO EXECUTE:
Each party represents and warrants that:
• They have full legal capacity and authority to enter into this Settlement Agreement
• They have obtained all necessary consents, approvals, or authorizations required
• The execution of this agreement does not violate any other agreement or obligation
• They have been advised to seek independent legal counsel (or have had opportunity to do so)

COSTS & EXPENSES:
Each party shall bear their own legal costs, fees, and expenses incurred in negotiating and executing this Settlement Agreement, unless otherwise specified in the payment terms. [If costsAllocation = "loser pays": In the event of litigation arising from breach of this settlement, the prevailing party shall be entitled to recover reasonable attorney fees and costs.]

ACKNOWLEDGMENT OF UNDERSTANDING:
Each party acknowledges that:
• They have read and understood all terms of this Settlement Agreement
• They have had adequate time to review the agreement and seek legal advice
• They enter into this agreement voluntarily and without coercion
• They understand the consequences of this settlement, including the release of claims

SURVIVAL:
The following provisions shall survive the completion, termination, or expiration of this Settlement Agreement: Mutual Release, No Admission of Liability, Confidentiality, Data Protection, Governing Law, and Dispute Resolution.

SPECIFIC PERFORMANCE:
The parties acknowledge that monetary damages may be insufficient to remedy a breach of this Settlement Agreement. Accordingly, each party shall be entitled to seek specific performance, injunctive relief, or other equitable remedies in addition to all other remedies available at law or in equity.

FURTHER ASSURANCES:
Each party agrees to execute and deliver such additional documents and take such further actions as may be reasonably necessary to give full effect to the terms and intent of this Settlement Agreement.`;

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

const DEMAND_LETTER_CLAUSES = `

ADDITIONAL LEGAL PROVISIONS FOR DEMAND LETTERS:

STATUTE OF LIMITATIONS NOTICE:
This demand is made within the applicable limitation period under UAE law. Claims for debt recovery are generally subject to limitation periods specified in UAE Federal Law No. 5 of 1985 (Civil Transactions Law). Failure to respond or pay within the specified deadline will not extend or reset any applicable limitation periods.

ACKNOWLEDGMENT OF DEBT:
Any partial payment, acknowledgment in writing, or proposal for settlement made in response to this demand letter may constitute an acknowledgment of the debt and may restart or extend the applicable limitation period under UAE law.

THIRD-PARTY CLAIMS:
If you contend that the debt is owed by a third party or that you are not the proper party to this demand, you must provide written notice with supporting evidence within 7 days of receiving this letter. Failure to do so will be deemed an admission that you are the proper party liable for this debt.

SET-OFF CLAIMS:
If you claim any right of set-off or counterclaim against the amount demanded, you must provide detailed written notice of such claim within 7 days. Any set-off or counterclaim must be supported by documentary evidence and will be considered only if legally valid under UAE law.

COSTS AND EXPENSES:
The sender reserves the right to claim all reasonable costs and expenses incurred in pursuing this debt, including but not limited to:
• Legal fees and attorney costs
• Court filing fees and judicial costs
• Debt collection agency fees (if engaged)
• Administrative costs for processing payments and correspondence
• Bank charges and currency conversion costs (if applicable)

SETTLEMENT NEGOTIATIONS:
Any settlement negotiations or discussions shall be conducted on a "without prejudice" basis and shall not constitute an admission of liability or waiver of rights by either party. All settlement proposals must be in writing to be considered binding.

ENFORCEMENT IN OTHER JURISDICTIONS:
If the debtor has assets located outside the UAE, the sender reserves the right to seek recognition and enforcement of any UAE court judgment in other jurisdictions in accordance with applicable international conventions and reciprocal enforcement agreements.`;

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

    console.log("Letter generation request:", {
      userId: user.id,
      letterType: letterType,
      detailsKeys: Object.keys(details || {}),
      timestamp: new Date().toISOString()
    });

    if (!letterType || !details) {
      console.error("Missing required fields:", { letterType, hasDetails: !!details });
      return new Response(
        JSON.stringify({ error: "Letter type and details are required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============= INPUT VALIDATION & SANITIZATION =============
    console.log('Validating input fields...');
    
    // Check for suspiciously long inputs (potential abuse)
    const MAX_FIELD_LENGTH = 5000;
    for (const [key, value] of Object.entries(details)) {
      if (typeof value === 'string' && value.length > MAX_FIELD_LENGTH) {
        return new Response(
          JSON.stringify({ 
            error: `Field "${key}" exceeds maximum length of ${MAX_FIELD_LENGTH} characters`,
            field: key
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Validate fields using shared validation library
    const { validateLetterFields, sanitizeString } = await import('../_shared/validation.ts');
    const validationResult = validateLetterFields(letterType, details);

    if (!validationResult.valid) {
      console.error('Validation errors:', validationResult.errors);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input data',
          validationErrors: validationResult.errors,
          message: 'Please correct the highlighted fields and try again'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Sanitize all string inputs to prevent injection
    console.log('Sanitizing input data...');
    const sanitizedDetails = Object.entries(details).reduce((acc, [key, value]) => {
      if (typeof value === 'string') {
        acc[key] = sanitizeString(value);
      } else {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);

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

${Object.entries(sanitizedDetails).map(([key, value]) => `${key}: ${value}`).join('\n')}

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
      console.error("AI Gateway error:", {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText.substring(0, 500),
        letterType: letterType,
        userId: user.id
      });
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: "Rate limit exceeded. Please try again in a few minutes.",
            retryAfter: response.headers.get('retry-after') || 'unknown'
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            error: "AI credits exhausted. Please add funds to your Lovable workspace to continue using letter generation.",
            contactSupport: true
          }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          error: "Letter generation failed. Please try again or contact support if the issue persists.",
          details: errorText.substring(0, 200)
        }),
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
      letterType === 'settlement_agreement' ? DATA_PROTECTION_CLAUSES.settlement :
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

    if (letterType === 'employment_termination') {
      letterContent += EMPLOYMENT_TERMINATION_CLAUSES;
    }

    if (letterType === 'employment_contract') {
      letterContent += EMPLOYMENT_CONTRACT_CLAUSES;
    }

    if (letterType === 'general_legal') {
      letterContent += GENERAL_LEGAL_CLAUSES;
    }

    if (letterType === 'power_of_attorney') {
      letterContent += POWER_OF_ATTORNEY_CLAUSES;
    }

    if (letterType === 'demand_letter') {
      letterContent += DEMAND_LETTER_CLAUSES;
    }

  if (letterType === 'employment_termination') {
    letterContent += EMPLOYMENT_TERMINATION_CLAUSES;
  }
  
  if (letterType === 'employment_contract') {
    letterContent += EMPLOYMENT_CONTRACT_CLAUSES;
  }

  if (letterType === 'settlement_agreement') {
    letterContent += SETTLEMENT_AGREEMENT_CLAUSES;
  }

  if (letterType === 'lease_agreement') {
    letterContent += LEASE_AGREEMENT_LEGAL_CLAUSES;
  }

  if (letterType === 'lease_termination') {
    letterContent += LEASE_TERMINATION_LEGAL_CLAUSES;
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
