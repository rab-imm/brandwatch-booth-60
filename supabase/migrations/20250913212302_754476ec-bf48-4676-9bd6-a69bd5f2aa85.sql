-- Insert sample templates for testing
INSERT INTO public.templates (title, description, content, category, price_aed, created_by, is_active) VALUES
(
  'UAE Employment Contract Template',
  'Comprehensive employment contract template compliant with UAE Labor Law',
  'EMPLOYMENT CONTRACT\n\nThis Employment Contract is entered into between [COMPANY NAME], a company incorporated under the laws of the United Arab Emirates (the "Company") and [EMPLOYEE NAME], an individual (the "Employee").\n\nArticle 1: Position and Duties\nThe Employee agrees to serve as [POSITION] and perform duties including but not limited to:\n- [DUTY 1]\n- [DUTY 2]\n- [DUTY 3]\n\nArticle 2: Term of Employment\nThis contract shall commence on [START DATE] and continue for [CONTRACT PERIOD].\n\nArticle 3: Compensation\nThe Employee shall receive a monthly salary of AED [AMOUNT].\n\nArticle 4: Working Hours\nNormal working hours shall be [HOURS] per day, [DAYS] per week, in accordance with UAE Labor Law.\n\nArticle 5: Termination\nEither party may terminate this contract with [NOTICE PERIOD] written notice, subject to UAE Labor Law provisions.\n\nThis contract is governed by UAE Labor Law and DIFC Employment Law where applicable.',
  'employment',
  0,
  NULL,
  true
),
(
  'Employee Termination Notice Template',
  'Professional termination notice template following UAE Labor Law procedures',
  'TERMINATION NOTICE\n\nTo: [EMPLOYEE NAME]\nEmployee ID: [ID]\nDepartment: [DEPARTMENT]\n\nDear [EMPLOYEE NAME],\n\nThis letter serves as formal notice of termination of your employment with [COMPANY NAME], effective [TERMINATION DATE].\n\nReason for Termination: [REASON]\n\nIn accordance with UAE Labor Law Article 51, you are entitled to:\n- [NOTICE PERIOD] notice period or payment in lieu\n- End of service gratuity calculation\n- Outstanding salary and benefits\n- Return of company property\n\nFinal Settlement Details:\n- Basic Salary: AED [AMOUNT]\n- Gratuity: AED [AMOUNT]\n- Outstanding Leave: AED [AMOUNT]\n- Total: AED [TOTAL]\n\nPlease ensure all company property is returned by [DATE].\n\nSincerely,\n[HR MANAGER NAME]\n[COMPANY NAME]',
  'employment',
  25,
  NULL,
  true
),
(
  'Company Registration Application - UAE',
  'Complete company registration application for UAE mainland and free zones',
  'COMPANY REGISTRATION APPLICATION\n\nCOMPANY DETAILS:\nProposed Company Name: [NAME]\nLegal Structure: [LLC/SOLE PROPRIETORSHIP/PARTNERSHIP]\nBusiness Activity: [PRIMARY ACTIVITY]\nSecondary Activities: [LIST]\n\nSHAREHOLDER INFORMATION:\nShareholder 1:\n- Name: [NAME]\n- Nationality: [NATIONALITY]\n- Passport Number: [NUMBER]\n- Share Percentage: [%]\n\nShareholder 2:\n- Name: [NAME]\n- Nationality: [NATIONALITY]\n- Passport Number: [NUMBER]\n- Share Percentage: [%]\n\nREGISTERED ADDRESS:\nEmirate: [EMIRATE]\nArea: [AREA]\nBuilding: [BUILDING]\nOffice Number: [NUMBER]\n\nREQUIRED DOCUMENTS:\n✓ Passport copies of all shareholders\n✓ Visa copies (if UAE residents)\n✓ No Objection Certificate (if applicable)\n✓ Memorandum of Association\n✓ Tenancy contract for registered address\n✓ Initial approval certificate\n\nAPPROVAL AUTHORITIES:\n- DED (Dubai Economic Department)\n- Chamber of Commerce\n- Ministry of Economy\n- Immigration Department',
  'corporate',
  40,
  NULL,
  true
),
(
  'Rental Agreement Template - UAE',
  'Standard residential and commercial rental agreement for UAE properties',
  'RENTAL AGREEMENT\n\nLANDLORD: [LANDLORD NAME]\nTitle Deed Number: [NUMBER]\nEmirates ID: [ID]\n\nTENANT: [TENANT NAME]\nEmirates ID/Passport: [ID]\nVisa Number: [VISA]\n\nPROPERTY DETAILS:\nAddress: [FULL ADDRESS]\nType: [APARTMENT/VILLA/OFFICE]\nArea: [SQ FT]\nFurnishing: [FURNISHED/UNFURNISHED]\n\nRENTAL TERMS:\nAnnual Rent: AED [AMOUNT]\nPayment Schedule: [SCHEDULE]\nSecurity Deposit: AED [AMOUNT]\nReal Estate Commission: AED [AMOUNT]\n\nDURATION:\nContract Period: [START DATE] to [END DATE]\nRenewal Terms: [TERMS]\n\nUTILITIES:\nIncluded: [LIST]\nTenant Responsibility: [LIST]\n\nTERMS AND CONDITIONS:\n1. Rent payment due dates and penalties\n2. Property maintenance responsibilities\n3. Subletting restrictions\n4. Termination clauses\n5. RERA regulations compliance\n\nThis agreement is subject to UAE Real Estate Laws and RERA regulations.',
  'real_estate',
  30,
  NULL,
  true
),
(
  'Power of Attorney - UAE Legal',
  'General and special power of attorney templates for UAE legal matters',
  'POWER OF ATTORNEY\n\nI, [PRINCIPAL NAME], holder of [PASSPORT/EMIRATES ID NUMBER], hereby appoint [ATTORNEY NAME], holder of [ID NUMBER], as my lawful attorney-in-fact.\n\nSCOPE OF AUTHORITY:\nThis Power of Attorney grants authority to:\n\n✓ Represent me in all legal proceedings\n✓ Sign documents on my behalf\n✓ Conduct banking transactions\n✓ Handle real estate matters\n✓ Manage business affairs\n✓ Submit applications to government authorities\n\nSPECIFIC POWERS:\n1. To appear before courts and government departments\n2. To sign contracts and agreements\n3. To collect documents and certificates\n4. To handle visa and immigration matters\n5. To manage financial transactions\n\nLIMITATIONS:\n[SPECIFY ANY LIMITATIONS]\n\nDURATION:\nThis Power of Attorney is valid from [START DATE] until [END DATE] or until revoked.\n\nNOTARIZATION:\nThis document must be:\n- Notarized by UAE Notary Public\n- Attested by Ministry of Foreign Affairs\n- Translated to Arabic if required\n\nWITNESS:\nName: [WITNESS NAME]\nSignature: [SIGNATURE]\nDate: [DATE]\n\nPRINCIPAL:\nSignature: [SIGNATURE]\nDate: [DATE]',
  'family',
  35,
  NULL,
  true
);

-- Insert template creation function for super admins
CREATE OR REPLACE FUNCTION create_template(
  p_title TEXT,
  p_description TEXT,
  p_content TEXT,
  p_category template_category,
  p_price_aed DECIMAL(10,2),
  p_created_by UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  template_id UUID;
BEGIN
  INSERT INTO public.templates (
    title, 
    description, 
    content, 
    category, 
    price_aed, 
    created_by,
    is_active
  ) VALUES (
    p_title,
    p_description,
    p_content,
    p_category,
    p_price_aed,
    p_created_by,
    true
  ) RETURNING id INTO template_id;
  
  RETURN template_id;
END;
$$;