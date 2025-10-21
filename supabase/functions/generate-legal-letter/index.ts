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
  power_of_attorney: `Generate a power of attorney document.`,
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
  general_legal: `Generate a formal legal letter.`
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
      DATA_PROTECTION_CLAUSES.general;
    
    letterContent += dataProtectionClause;

    // Add NDA-specific legal clauses if this is an NDA
    if (letterType === 'nda') {
      letterContent += NDA_LEGAL_CLAUSES;
    }

    // Add workplace complaint legal clauses
    if (letterType === 'workplace_complaint') {
      letterContent += WORKPLACE_COMPLAINT_LEGAL_CLAUSES;
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
