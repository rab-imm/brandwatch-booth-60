import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import * as pdfjsLib from "npm:pdfjs-dist@4.0.379"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DetectedClause {
  type: string
  text: string
  start_index: number
  end_index: number
  confidence: 'pattern' | 'ai'
  keywords: string[]
  ai_confidence?: number
  reasoning?: string
}

interface ComplianceRule {
  article: string
  category: string
  requirement: string
  requirement_ar?: string
  mandatory: boolean
  minimum_value?: number
  maximum_value?: number
  regex_patterns: RegExp[]
  arabic_patterns?: RegExp[]
  violation_severity: 'critical' | 'high' | 'medium' | 'low'
  recommendation: string
  recommendation_ar?: string
}

interface ComplianceViolation {
  rule: {
    article: string
    category: string
    requirement: string
    requirement_ar?: string
  }
  found: boolean
  violation_type: 'missing' | 'non_compliant' | 'ambiguous' | 'compliant'
  details: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  recommended_action: string
  related_text?: string
}

interface MissingClauseRule {
  clause_type: string
  display_name: string
  display_name_ar: string
  importance: 'essential' | 'recommended' | 'optional'
  category: 'legal' | 'commercial' | 'operational'
  description: string
  description_ar: string
  why_needed: string
  why_needed_ar: string
  detection_patterns: RegExp[]
  arabic_patterns?: RegExp[]
  sample_wording_en: string
  sample_wording_ar: string
  related_articles?: string[]
  common_in_document_types: string[]
}

interface MissingClauseSuggestion {
  clause_type: string
  display_name: string
  display_name_ar: string
  importance: 'essential' | 'recommended' | 'optional'
  category: 'legal' | 'commercial' | 'operational'
  description: string
  description_ar: string
  why_needed: string
  why_needed_ar: string
  sample_wording_en: string
  sample_wording_ar: string
  related_articles?: string[]
  ai_confidence?: number
  ai_reasoning?: string
}

const MissingClauseRules: MissingClauseRule[] = [
  {
    clause_type: 'governing_law',
    display_name: 'Governing Law',
    display_name_ar: 'القانون الحاكم',
    importance: 'essential',
    category: 'legal',
    description: 'Specifies which jurisdiction\'s laws govern the contract',
    description_ar: 'يحدد أي قوانين الولاية القضائية تحكم العقد',
    why_needed: 'Critical for resolving disputes and determining applicable legal framework. Required for enforceability in UAE courts.',
    why_needed_ar: 'ضروري لحل النزاعات وتحديد الإطار القانوني المطبق. مطلوب للإنفاذ في محاكم الإمارات.',
    detection_patterns: [
      /\b(governing law|applicable law|law of the|laws? of|governed by|subject to.*law)\b/gi,
      /\b(jurisdiction|legal system|courts? of)\b/gi
    ],
    arabic_patterns: [
      /\b(القانون الحاكم|القانون الواجب التطبيق|قوانين|يخضع لقوانين|القضاء)\b/gu
    ],
    sample_wording_en: 'This Agreement shall be governed by and construed in accordance with the laws of the United Arab Emirates, and specifically the laws applicable in the Emirate of [Dubai/Abu Dhabi/etc.], without regard to its conflict of law provisions.',
    sample_wording_ar: 'يخضع هذا العقد ويفسر وفقاً لقوانين دولة الإمارات العربية المتحدة، وتحديداً القوانين المطبقة في إمارة [دبي/أبو ظبي/إلخ]، دون النظر إلى أحكام تنازع القوانين.',
    related_articles: ['UAE Civil Code', 'Federal Law No. 11 of 1992'],
    common_in_document_types: ['contract', 'agreement', 'employment_contract', 'service_agreement']
  },
  {
    clause_type: 'dispute_resolution',
    display_name: 'Dispute Resolution',
    display_name_ar: 'حل النزاعات',
    importance: 'essential',
    category: 'legal',
    description: 'Defines how disputes will be resolved (arbitration, mediation, court)',
    description_ar: 'يحدد كيفية حل النزاعات (التحكيم، الوساطة، المحكمة)',
    why_needed: 'Prevents costly litigation by establishing clear dispute resolution procedures. UAE law favors arbitration for commercial disputes.',
    why_needed_ar: 'يمنع التقاضي المكلف من خلال إنشاء إجراءات واضحة لحل النزاعات. يفضل قانون الإمارات التحكيم للنزاعات التجارية.',
    detection_patterns: [
      /\b(arbitration|mediation|dispute resolution|conflict resolution)\b/gi,
      /\b(DIAC|ADCCAC|ICC|settlement|legal proceedings)\b/gi
    ],
    arabic_patterns: [
      /\b(تحكيم|وساطة|حل النزاعات|فض النزاعات|التسوية)\b/gu
    ],
    sample_wording_en: 'Any dispute, controversy, or claim arising out of or relating to this Agreement shall be settled by arbitration in accordance with the Rules of the Dubai International Arbitration Centre (DIAC). The arbitration shall be conducted in [English/Arabic], and the seat of arbitration shall be Dubai, UAE.',
    sample_wording_ar: 'أي نزاع أو خلاف أو مطالبة ناشئة عن هذا العقد أو تتعلق به يتم تسويته بالتحكيم وفقاً لقواعد مركز دبي للتحكيم الدولي (DIAC). يجري التحكيم باللغة [الإنجليزية/العربية]، ومقر التحكيم هو دبي، الإمارات.',
    related_articles: ['Federal Law No. 6 of 2018 - Arbitration Law'],
    common_in_document_types: ['contract', 'agreement', 'commercial_contract']
  },
  {
    clause_type: 'entire_agreement',
    display_name: 'Entire Agreement',
    display_name_ar: 'العقد الكامل',
    importance: 'recommended',
    category: 'legal',
    description: 'States that the written contract supersedes all prior agreements',
    description_ar: 'ينص على أن العقد المكتوب يحل محل جميع الاتفاقات السابقة',
    why_needed: 'Prevents claims based on prior verbal agreements or negotiations.',
    why_needed_ar: 'يمنع المطالبات بناءً على الاتفاقيات أو المفاوضات الشفهية السابقة.',
    detection_patterns: [
      /\b(entire agreement|entire understanding|complete agreement|full agreement)\b/gi,
      /\b(supersedes?|replaces? all|prior agreements?)\b/gi
    ],
    arabic_patterns: [
      /\b(العقد الكامل|الاتفاق الكامل|يحل محل|الاتفاقيات السابقة)\b/gu
    ],
    sample_wording_en: 'This Agreement constitutes the entire agreement between the parties and supersedes all prior or contemporaneous agreements, understandings, negotiations, and discussions, whether oral or written, relating to the subject matter hereof.',
    sample_wording_ar: 'يشكل هذا العقد الاتفاق الكامل بين الطرفين ويحل محل جميع الاتفاقيات أو التفاهمات أو المفاوضات أو المناقشات السابقة أو المعاصرة، سواء كانت شفهية أو كتابية، المتعلقة بموضوع هذا العقد.',
    common_in_document_types: ['contract', 'agreement', 'service_agreement']
  },
  {
    clause_type: 'severability',
    display_name: 'Severability',
    display_name_ar: 'قابلية الفصل',
    importance: 'recommended',
    category: 'legal',
    description: 'Ensures remaining provisions survive if one is deemed invalid',
    description_ar: 'يضمن بقاء الأحكام المتبقية إذا اعتبر أحدها باطلاً',
    why_needed: 'Protects the contract from being entirely void if one clause is unenforceable.',
    why_needed_ar: 'يحمي العقد من أن يصبح باطلاً بالكامل إذا كان أحد البنود غير قابل للتنفيذ.',
    detection_patterns: [
      /\b(severability|severable|savings? clause)\b/gi,
      /\b(invalid.*remain|void.*rest|unenforceable.*survive)\b/gi
    ],
    arabic_patterns: [
      /\b(قابلية الفصل|فصل الأحكام|بطلان.*بقية|باطل.*الباقي)\b/gu
    ],
    sample_wording_en: 'If any provision of this Agreement is held to be invalid, illegal, or unenforceable, the validity, legality, and enforceability of the remaining provisions shall not be affected or impaired thereby.',
    sample_wording_ar: 'إذا تم اعتبار أي حكم من أحكام هذا العقد باطلاً أو غير قانوني أو غير قابل للتنفيذ، فلن تتأثر صحة أو قانونية أو قابلية تنفيذ الأحكام المتبقية.',
    common_in_document_types: ['contract', 'agreement', 'employment_contract']
  },
  {
    clause_type: 'force_majeure',
    display_name: 'Force Majeure',
    display_name_ar: 'القوة القاهرة',
    importance: 'recommended',
    category: 'legal',
    description: 'Addresses unforeseeable events beyond parties\' control',
    description_ar: 'يعالج الأحداث غير المتوقعة الخارجة عن سيطرة الأطراف',
    why_needed: 'Protects parties from liability for events like pandemics, natural disasters, or war.',
    why_needed_ar: 'يحمي الأطراف من المسؤولية عن أحداث مثل الأوبئة أو الكوارث الطبيعية أو الحرب.',
    detection_patterns: [
      /\b(force majeure|act of god|unforeseeable|beyond.*control)\b/gi,
      /\b(natural disaster|pandemic|war|civil unrest)\b/gi
    ],
    arabic_patterns: [
      /\b(قوة قاهرة|ظروف قاهرة|خارج عن السيطرة|كارثة طبيعية)\b/gu
    ],
    sample_wording_en: 'Neither party shall be liable for any failure or delay in performance due to events beyond their reasonable control, including but not limited to acts of God, natural disasters, war, terrorism, pandemics, government actions, or public emergencies.',
    sample_wording_ar: 'لا يكون أي طرف مسؤولاً عن أي فشل أو تأخير في الأداء بسبب أحداث خارجة عن سيطرته المعقولة، بما في ذلك على سبيل المثال لا الحصر الكوارث الطبيعية أو الحرب أو الإرهاب أو الأوبئة أو الإجراءات الحكومية أو حالات الطوارئ العامة.',
    common_in_document_types: ['contract', 'agreement', 'service_agreement']
  },
  {
    clause_type: 'notices',
    display_name: 'Notices and Communications',
    display_name_ar: 'الإخطارات والمراسلات',
    importance: 'recommended',
    category: 'operational',
    description: 'Specifies how official communications must be sent',
    description_ar: 'يحدد كيفية إرسال المراسلات الرسمية',
    why_needed: 'Ensures proper delivery of important legal notices.',
    why_needed_ar: 'يضمن التسليم السليم للإخطارات القانونية المهمة.',
    detection_patterns: [
      /\b(notices?|notification|communication|written notice)\b/gi,
      /\b(notice address|delivery of notice|deemed received)\b/gi
    ],
    arabic_patterns: [
      /\b(إخطار|إشعار|مراسلة|عنوان الإخطار)\b/gu
    ],
    sample_wording_en: 'All notices required or permitted under this Agreement shall be in writing and delivered by registered mail, courier service, or email to the addresses specified in this Agreement. Notices shall be deemed received: (i) if by registered mail, five business days after posting; (ii) if by courier, upon delivery; (iii) if by email, upon confirmation of receipt.',
    sample_wording_ar: 'يجب أن تكون جميع الإخطارات المطلوبة أو المسموح بها بموجب هذا العقد كتابية ويتم تسليمها بالبريد المسجل أو خدمة البريد السريع أو البريد الإلكتروني إلى العناوين المحددة في هذا العقد. تعتبر الإخطارات مستلمة: (1) إذا كانت بالبريد المسجل، بعد خمسة أيام عمل من الإرسال؛ (2) إذا كانت بالبريد السريع، عند التسليم؛ (3) إذا كانت بالبريد الإلكتروني، عند تأكيد الاستلام.',
    common_in_document_types: ['contract', 'agreement', 'employment_contract']
  }
]

const UAELabourComplianceRules: ComplianceRule[] = [
  {
    article: 'Article 17',
    category: 'working_hours',
    requirement: 'Maximum 8 hours per day, 48 hours per week',
    requirement_ar: 'الحد الأقصى 8 ساعات يوميًا، 48 ساعة أسبوعيًا',
    mandatory: true,
    maximum_value: 8,
    regex_patterns: [/\b(working hours?|work day|daily hours?|hours? per day|hours? per week)\b/gi],
    arabic_patterns: [/\b(ساعات العمل|ساعة يوميا|ساعات يومية|ساعة في اليوم)\b/gu],
    violation_severity: 'high',
    recommendation: 'Include explicit working hours clause stating maximum 8 hours per day or 48 hours per week',
    recommendation_ar: 'يجب تضمين بند صريح بساعات العمل لا تزيد عن 8 ساعات يوميًا أو 48 ساعة أسبوعيًا'
  },
  {
    article: 'Article 29',
    category: 'annual_leave',
    requirement: 'Minimum 30 calendar days annual leave (2 days per month for first 6 months)',
    requirement_ar: 'الحد الأدنى 30 يوم إجازة سنوية',
    mandatory: true,
    minimum_value: 30,
    regex_patterns: [/\b(annual leave|vacation|paid leave|yearly leave)\b/gi],
    arabic_patterns: [/\b(إجازة سنوية|إجازة مدفوعة|إجازة)\b/gu],
    violation_severity: 'critical',
    recommendation: 'Include annual leave clause granting minimum 30 calendar days per year',
    recommendation_ar: 'يجب تضمين بند الإجازة السنوية بحد أدنى 30 يومًا تقويميًا سنويًا'
  },
  {
    article: 'Article 31',
    category: 'sick_leave',
    requirement: '90 days sick leave per year (full pay + half pay + unpaid)',
    requirement_ar: '90 يوم إجازة مرضية سنويًا',
    mandatory: true,
    regex_patterns: [/\b(sick leave|medical leave|illness)\b/gi],
    arabic_patterns: [/\b(إجازة مرضية|إجازة صحية)\b/gu],
    violation_severity: 'high',
    recommendation: 'Include sick leave clause granting 90 days per year as per UAE Labour Law',
    recommendation_ar: 'يجب تضمين بند الإجازة المرضية 90 يومًا سنويًا'
  },
  {
    article: 'Article 30',
    category: 'maternity_leave',
    requirement: '60 days maternity leave',
    requirement_ar: '60 يوم إجازة أمومة',
    mandatory: false,
    regex_patterns: [/\b(maternity leave|pregnancy leave)\b/gi],
    arabic_patterns: [/\b(إجازة أمومة|إجازة وضع)\b/gu],
    violation_severity: 'medium',
    recommendation: 'Include maternity leave clause granting 60 days for female employees',
    recommendation_ar: 'يجب تضمين بند إجازة الأمومة 60 يومًا للموظفات'
  },
  {
    article: 'Articles 43-44',
    category: 'notice_period',
    requirement: 'Minimum 30 days notice for indefinite contracts',
    requirement_ar: 'إخطار مسبق 30 يومًا للعقود غير محددة المدة',
    mandatory: true,
    minimum_value: 30,
    regex_patterns: [/\b(notice period|termination notice|resignation notice|days? notice)\b/gi],
    arabic_patterns: [/\b(فترة الإخطار|إخطار مسبق|إشعار الإنهاء)\b/gu],
    violation_severity: 'critical',
    recommendation: 'Include notice period clause with minimum 30 days for contract termination',
    recommendation_ar: 'يجب تضمين بند فترة الإخطار بحد أدنى 30 يومًا'
  },
  {
    article: 'Articles 51-54',
    category: 'gratuity',
    requirement: 'End of service gratuity: 21 days salary per year (1-5 years), 30 days after',
    requirement_ar: 'مكافأة نهاية الخدمة: 21 يوم راتب للسنة (1-5 سنوات)، 30 يوم بعدها',
    mandatory: true,
    regex_patterns: [/\b(end of service|gratuity|severance pay|final settlement)\b/gi],
    arabic_patterns: [/\b(مكافأة نهاية الخدمة|تعويض نهاية الخدمة)\b/gu],
    violation_severity: 'critical',
    recommendation: 'Include end of service gratuity calculation as per UAE Labour Law',
    recommendation_ar: 'يجب تضمين بند مكافأة نهاية الخدمة وفق قانون العمل'
  },
  {
    article: 'Article 10',
    category: 'probation',
    requirement: 'Maximum 6 months probation period',
    requirement_ar: 'الحد الأقصى 6 أشهر فترة تجريبية',
    mandatory: false,
    maximum_value: 6,
    regex_patterns: [/\b(probation(ary)? period|trial period)\b/gi],
    arabic_patterns: [/\b(فترة تجريبية|فترة اختبار)\b/gu],
    violation_severity: 'medium',
    recommendation: 'If probation is included, ensure it does not exceed 6 months',
    recommendation_ar: 'إذا كانت الفترة التجريبية موجودة، يجب ألا تتجاوز 6 أشهر'
  },
  {
    article: 'Article 18',
    category: 'overtime',
    requirement: 'Overtime: 125% regular rate, 150% for night hours (9 PM - 4 AM)',
    requirement_ar: 'ساعات إضافية: 125% من الأجر العادي، 150% للساعات الليلية',
    mandatory: false,
    regex_patterns: [/\b(overtime|extra hours?|additional hours?)\b/gi],
    arabic_patterns: [/\b(ساعات إضافية|عمل إضافي)\b/gu],
    violation_severity: 'medium',
    recommendation: 'Include overtime compensation rates: 125% regular, 150% night hours',
    recommendation_ar: 'يجب تضمين أجر الساعات الإضافية: 125% عادي، 150% ليلي'
  },
  {
    article: 'Articles 56-61',
    category: 'wage_protection',
    requirement: 'Timely wage payment (monthly for monthly employees)',
    requirement_ar: 'دفع الأجور في الموعد المحدد',
    mandatory: true,
    regex_patterns: [/\b(salary|wage|payment|compensation|remuneration)\b/gi],
    arabic_patterns: [/\b(راتب|أجر|مرتب|تعويض)\b/gu],
    violation_severity: 'critical',
    recommendation: 'Include clear salary payment terms and amount',
    recommendation_ar: 'يجب تضمين شروط واضحة لدفع الراتب والمبلغ'
  },
  {
    article: 'Article 8',
    category: 'contract_language',
    requirement: 'Contract must be in Arabic or bilingual (Arabic + other language)',
    requirement_ar: 'يجب أن يكون العقد باللغة العربية أو ثنائي اللغة',
    mandatory: true,
    regex_patterns: [/[\u0600-\u06FF]/g], // Check for Arabic characters
    violation_severity: 'high',
    recommendation: 'Ensure contract includes Arabic version or is bilingual',
    recommendation_ar: 'يجب أن يتضمن العقد نسخة عربية أو يكون ثنائي اللغة'
  }
]

function detectClausesByPattern(text: string): DetectedClause[] {
  const patterns = {
    termination: [
      /\b(terminat(e|ion|ed)|cancel(lation)?|end of (contract|agreement)|notice period|early exit)\b/gi,
      /\b(dissolution|expiration|cessation|withdrawal)\b/gi,
      /\b(إنهاء|إلغاء|فسخ|إخطار|نهاية العقد|إنتهاء|الإنهاء)\b/gu
    ],
    confidentiality: [
      /\b(confidential(ity)?|non-disclosure|NDA|proprietary|trade secret|private information)\b/gi,
      /\b(data protection|privacy|sensitive (data|information))\b/gi,
      /\b(سرية|السرية|عدم الإفصاح|معلومات سرية|حماية البيانات|سري)\b/gu
    ],
    payment: [
      /\b(payment|fee(s)?|pricing|invoice|cost|compensation|remuneration)\b/gi,
      /\b(late payment|interest rate|due date|billing cycle)\b/gi,
      /\b(دفع|رسوم|تسعير|فاتورة|تكلفة|تعويض|مستحقات|أتعاب|الدفع)\b/gu
    ],
    liability: [
      /\b(liabilit(y|ies)|indemnif(y|ication)|disclaimer|limitation of liability)\b/gi,
      /\b(hold harmless|damages|loss|injury|claim)\b/gi,
      /\b(مسؤولية|مسئولية|تعويض|إخلاء مسؤولية|ضمان|تعهد|المسؤولية)\b/gu
    ],
    intellectual_property: [
      /\b(intellectual property|IP|copyright|trademark|patent|license)\b/gi,
      /\b(ownership|proprietary rights|work product)\b/gi,
      /\b(الملكية الفكرية|حقوق الملكية|براءة اختراع|علامة تجارية|ملكية)\b/gu
    ],
    dispute_resolution: [
      /\b(dispute|arbitration|mediation|jurisdiction|governing law|venue)\b/gi,
      /\b(legal proceedings|court|litigation)\b/gi,
      /\b(نزاع|خلاف|تحكيم|وساطة|اختصاص قضائي|القانون الواجب|محكمة)\b/gu
    ],
    warranties: [
      /\b(warrant(y|ies)|guarantee|represent(ation)?|assurance)\b/gi,
      /\b(fitness for purpose|merchantability|as-is)\b/gi,
      /\b(ضمان|ضمانات|كفالة|تعهد|إقرار|الضمان)\b/gu
    ],
    duration: [
      /\b(term|duration|period|effective date|commencement|renewal)\b/gi,
      /\b(initial term|extension|anniversary)\b/gi,
      /\b(مدة|فترة|مهلة|تاريخ السريان|بداية|نفاذ|المدة)\b/gu
    ],
    parties: [
      /\b(party|parties|contractor|vendor|client|customer|provider)\b/gi,
      /\b(between|undersigned|hereinafter|referred to as)\b/gi,
      /\b(طرف|أطراف|المتعاقد|البائع|العميل|المشتري|الموقعين|الطرف)\b/gu
    ],
    obligations: [
      /\b(obligation(s)?|requirement(s)?|must|shall|responsible for|duty)\b/gi,
      /\b(deliverable(s)?|performance|compliance)\b/gi,
      /\b(التزام|التزامات|واجب|يجب|مسؤول عن|متطلبات|الالتزام)\b/gu
    ],
    force_majeure: [
      /\b(force majeure|act of god|unforeseeable|natural disaster|pandemic)\b/gi,
      /\b(war|terrorism|strike|riot)\b/gi,
      /\b(قوة قاهرة|ظروف قاهرة|حدث غير متوقع|كارثة طبيعية)\b/gu
    ],
    non_compete: [
      /\b(non-compete|non-competition|restrictive covenant|non-solicitation)\b/gi,
      /\b(prohibited activities|competitive business)\b/gi,
      /\b(عدم المنافسة|حظر المنافسة|قيود تنافسية)\b/gu
    ],
    amendments: [
      /\b(amendment|modification|change|alteration|revision)\b/gi,
      /\b(written consent|mutual agreement|change order)\b/gi,
      /\b(تعديل|تغيير|تحوير|تنقيح|التعديل)\b/gu
    ],
    notices: [
      /\b(notice|notification|written notice|communication)\b/gi,
      /\b(address|contact|email|registered office)\b/gi,
      /\b(إخطار|إشعار|إبلاغ|إعلام|تبليغ|الإخطار)\b/gu
    ],
    definitions: [
      /\b(definition(s)?|means|defined as|refers to|interpretation)\b/gi,
      /\b(for purposes of|hereinafter defined)\b/gi,
      /\b(تعريف|تعاريف|يعني|يقصد به|المقصود|التعريف)\b/gu
    ]
  }
  
  const paragraphs = text.split(/\n\n+/)
  const detectedClauses: DetectedClause[] = []
  let currentIndex = 0
  
  for (const paragraph of paragraphs) {
    if (paragraph.trim().length < 50) {
      currentIndex += paragraph.length + 2
      continue
    }
    
    for (const [clauseType, regexList] of Object.entries(patterns)) {
      let matchCount = 0
      const foundKeywords: string[] = []
      
      for (const regex of regexList) {
        const matches = paragraph.match(regex)
        if (matches) {
          matchCount += matches.length
          foundKeywords.push(...matches.map(m => m.toLowerCase()))
        }
      }
      
      if (matchCount >= 1 && paragraph.length > 100) {
        detectedClauses.push({
          type: clauseType,
          text: paragraph.trim(),
          start_index: currentIndex,
          end_index: currentIndex + paragraph.length,
          confidence: 'pattern',
          keywords: [...new Set(foundKeywords)]
        })
      }
    }
    
    currentIndex += paragraph.length + 2
  }
  
  return detectedClauses
}

function checkUAELabourCompliance(
  extractedText: string,
  detectedClauses: DetectedClause[]
): ComplianceViolation[] {
  const violations: ComplianceViolation[] = []
  const textLower = extractedText.toLowerCase()
  
  for (const rule of UAELabourComplianceRules) {
    const clausesOfType = detectedClauses.filter(c => c.type === rule.category)
    
    // Check if required clause exists
    if (rule.mandatory && clausesOfType.length === 0) {
      // Check if there's any mention of this in the text
      const hasAnyMention = rule.regex_patterns.some(pattern => pattern.test(extractedText)) ||
        (rule.arabic_patterns?.some(pattern => pattern.test(extractedText)) || false)
      
      if (!hasAnyMention) {
        violations.push({
          rule: {
            article: rule.article,
            category: rule.category,
            requirement: rule.requirement,
            requirement_ar: rule.requirement_ar
          },
          found: false,
          violation_type: 'missing',
          severity: rule.violation_severity,
          details: `Missing required clause: ${rule.requirement}`,
          recommended_action: rule.recommendation
        })
      }
    }
    
    // Additional check for specific values
    if (rule.category === 'annual_leave' && clausesOfType.length > 0) {
      const leaveText = clausesOfType[0].text.toLowerCase()
      const dayMatches = leaveText.match(/(\d+)\s*days?/i)
      if (dayMatches && parseInt(dayMatches[1]) < (rule.minimum_value || 30)) {
        violations.push({
          rule: {
            article: rule.article,
            category: rule.category,
            requirement: rule.requirement,
            requirement_ar: rule.requirement_ar
          },
          found: true,
          violation_type: 'non_compliant',
          severity: 'critical',
          details: `Annual leave (${dayMatches[1]} days) is less than the minimum required (30 days)`,
          recommended_action: rule.recommendation,
          related_text: clausesOfType[0].text.substring(0, 200)
        })
      }
    }
  }
  
  return violations
}

async function analyzeComplianceWithAI(
  extractedText: string,
  patternViolations: ComplianceViolation[],
  lovableApiKey: string
): Promise<{
  additional_violations: ComplianceViolation[]
  compliance_score: number
  summary: string
}> {
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content: `You are a UAE employment law expert specializing in Federal Decree-Law No. 33 of 2021.

Analyze the employment document for compliance with UAE Labour Law. Check for:
1. Working hours (max 8h/day, 48h/week - Article 17)
2. Annual leave (min 30 days - Article 29)
3. Sick leave (90 days - Article 31)
4. Maternity leave (60 days - Article 30)
5. Notice period (min 30 days - Article 43-44)
6. End of service gratuity (Articles 51-54)
7. Probation (max 6 months - Article 10)
8. Overtime rates (125%/150% - Article 18)
9. Wage protection (Articles 56-61)
10. Termination rights (Articles 42-48)

Return ONLY raw JSON (NO markdown code fences):
{
  "violations": [{"category": "string", "article": "string", "severity": "critical|high|medium|low", "details": "string", "recommendation": "string"}],
  "compliance_score": 0-100,
  "summary": "brief overview in 1-2 sentences"
}`
        },
        {
          role: 'user',
          content: `Analyze this employment document for UAE Labour Law compliance:\n\n${extractedText.substring(0, 8000)}`
        }
      ]
    })
  })
  
  if (!response.ok) {
    console.error('AI compliance check failed:', response.status)
    return {
      additional_violations: [],
      compliance_score: 50,
      summary: 'AI compliance analysis unavailable'
    }
  }
  
  const data = await response.json()
  let aiResponse = data.choices?.[0]?.message?.content || '{}'
  
  try {
    // Strip markdown code fences if present
    if (aiResponse.trim().startsWith('```')) {
      aiResponse = aiResponse.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    }
    
    const parsed = JSON.parse(aiResponse)
    
    const aiViolations: ComplianceViolation[] = (parsed.violations || []).map((v: any) => ({
      rule: {
        article: v.article || 'Various',
        category: v.category || 'general',
        requirement: v.details || '',
        requirement_ar: ''
      },
      found: false,
      violation_type: 'missing',
      severity: v.severity || 'medium',
      details: v.details || '',
      recommended_action: v.recommendation || ''
    }))
    
    return {
      additional_violations: aiViolations,
      compliance_score: parsed.compliance_score || 50,
      summary: parsed.summary || 'Compliance check complete'
    }
  } catch (error) {
    console.error('Failed to parse AI compliance response:', error)
    return {
      additional_violations: [],
      compliance_score: 50,
      summary: 'Compliance analysis partially complete'
    }
  }
}

async function classifyClausesWithAI(
  text: string, 
  patternClauses: DetectedClause[],
  lovableApiKey: string
): Promise<DetectedClause[]> {
  const truncatedText = text.substring(0, 8000)
  
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content: `You are a legal document analyzer that works with documents in ANY language (Arabic, English, etc.).

Identify and classify legal clauses regardless of language.

Clause Types: termination, confidentiality, payment, liability, intellectual_property, dispute_resolution, warranties, duration, parties, obligations, force_majeure, non_compete, amendments, notices, definitions

For each clause found, return a JSON object:
{"clauses": [{"type": "clause_type", "text": "full clause text in original language", "confidence": 0.95, "reasoning": "why this classification"}]}

CRITICAL: Return ONLY the raw JSON object. Do NOT wrap it in markdown code fences like \`\`\`json. Just the plain JSON.`
        },
        {
          role: 'user',
          content: `Analyze this document and extract all legal clauses:\n\n${truncatedText}`
        }
      ]
    })
  })
  
  if (!response.ok) {
    console.error('AI clause classification failed:', response.status)
    return []
  }
  
  const data = await response.json()
  const aiResponse = data.choices?.[0]?.message?.content || '{}'
  
  try {
    // Strip markdown code fences if present
    let cleanedResponse = aiResponse.trim()
    
    // Remove ```json ... ``` or ``` ... ```
    if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    }
    
    const parsed = JSON.parse(cleanedResponse)
    const aiClauses = parsed.clauses || []
    
    return aiClauses.map((clause: any, index: number) => ({
      type: clause.type,
      text: clause.text.substring(0, 1000),
      start_index: index * 100,
      end_index: index * 100 + clause.text.length,
      confidence: 'ai',
      keywords: [],
      ai_confidence: clause.confidence || 0.9,
      reasoning: clause.reasoning
    }))
  } catch (parseError) {
    console.error('Failed to parse AI clause response:', parseError)
    return []
  }
}

async function detectMissingClauses(
  extractedText: string,
  detectedClauses: DetectedClause[],
  missingClauseRules: MissingClauseRule[]
): Promise<MissingClauseSuggestion[]> {
  const missingClauses: MissingClauseSuggestion[] = []
  
  for (const rule of missingClauseRules) {
    let foundInText = false
    
    for (const pattern of rule.detection_patterns) {
      if (pattern.test(extractedText)) {
        foundInText = true
        break
      }
    }
    
    if (!foundInText && rule.arabic_patterns) {
      for (const pattern of rule.arabic_patterns) {
        if (pattern.test(extractedText)) {
          foundInText = true
          break
        }
      }
    }
    
    const foundInClauses = detectedClauses.some(clause => 
      clause.type === rule.clause_type || 
      clause.text.toLowerCase().includes(rule.clause_type.replace(/_/g, ' '))
    )
    
    if (!foundInText && !foundInClauses) {
      missingClauses.push({
        clause_type: rule.clause_type,
        display_name: rule.display_name,
        display_name_ar: rule.display_name_ar,
        importance: rule.importance,
        category: rule.category,
        description: rule.description,
        description_ar: rule.description_ar,
        why_needed: rule.why_needed,
        why_needed_ar: rule.why_needed_ar,
        sample_wording_en: rule.sample_wording_en,
        sample_wording_ar: rule.sample_wording_ar,
        related_articles: rule.related_articles
      })
    }
  }
  
  return missingClauses
}

async function analyzeGapsWithAI(
  extractedText: string,
  patternMissingClauses: MissingClauseSuggestion[],
  lovableApiKey: string
): Promise<{
  additional_missing: MissingClauseSuggestion[]
  gap_analysis_summary: string
}> {
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content: `You are a UAE legal expert analyzing contract completeness. Identify missing essential legal clauses. Return ONLY raw JSON (NO markdown):
{
  "missing_clauses": [
    {
      "clause_type": "string",
      "display_name": "string",
      "importance": "essential|recommended|optional",
      "category": "legal|commercial|operational",
      "why_needed": "explanation",
      "sample_wording": "suggested clause text",
      "confidence": 0.95
    }
  ],
  "gap_analysis": "brief overview"
}`
        },
        {
          role: 'user',
          content: `Analyze this document for missing critical legal clauses:\n\n${extractedText.substring(0, 8000)}`
        }
      ]
    })
  })
  
  if (!response.ok) {
    console.error('AI gap analysis failed:', response.status)
    return {
      additional_missing: [],
      gap_analysis_summary: 'Gap analysis unavailable'
    }
  }
  
  const data = await response.json()
  let aiResponse = data.choices?.[0]?.message?.content || '{}'
  
  try {
    if (aiResponse.trim().startsWith('```')) {
      aiResponse = aiResponse.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    }
    
    const parsed = JSON.parse(aiResponse)
    
    const aiMissingClauses: MissingClauseSuggestion[] = (parsed.missing_clauses || []).map((c: any) => ({
      clause_type: c.clause_type || 'other',
      display_name: c.display_name || 'Additional Clause',
      display_name_ar: '',
      importance: c.importance || 'optional',
      category: c.category || 'operational',
      description: c.why_needed || '',
      description_ar: '',
      why_needed: c.why_needed || '',
      why_needed_ar: '',
      sample_wording_en: c.sample_wording || '',
      sample_wording_ar: '',
      ai_confidence: c.confidence || 0.8,
      ai_reasoning: c.why_needed || ''
    }))
    
    const filteredAIClauses = aiMissingClauses.filter(aiClause => 
      !patternMissingClauses.some(pc => pc.clause_type === aiClause.clause_type)
    )
    
    return {
      additional_missing: filteredAIClauses,
      gap_analysis_summary: parsed.gap_analysis || 'Document analysis complete'
    }
  } catch (error) {
    console.error('Failed to parse AI gap analysis:', error)
    return {
      additional_missing: [],
      gap_analysis_summary: 'Gap analysis partially complete'
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const startTime = Date.now()
    const { file_path, user_id, company_id, file_name, file_type } = await req.json()

    console.log('Processing OCR request:', { file_name, file_type, user_id, company_id })

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('ocr-documents')
      .download(file_path)

    if (downloadError) {
      console.error('Error downloading file:', downloadError)
      throw new Error(`Failed to download file: ${downloadError.message}`)
    }

    console.log('File downloaded successfully, size:', fileData.size)

    // Extract text based on file type
    let extractedText = ''
    
    if (file_type === 'application/pdf') {
      console.log('Processing PDF with PDF.js...')
      
      try {
        // Convert blob to ArrayBuffer
        const arrayBuffer = await fileData.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)
        
        // Load the PDF document
        const loadingTask = pdfjsLib.getDocument({ data: uint8Array })
        const pdfDoc = await loadingTask.promise
        
        console.log(`PDF loaded: ${pdfDoc.numPages} pages`)
        
        // Extract text from all pages
        const textPromises = []
        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
          textPromises.push(
            pdfDoc.getPage(pageNum).then(async (page) => {
              const textContent = await page.getTextContent()
              const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ')
              return pageText
            })
          )
        }
        
        const pageTexts = await Promise.all(textPromises)
        extractedText = pageTexts.join('\n\n').trim()
        
        console.log(`Processing file: ${file_name}, type: ${file_type}`)
        
        // HEIC/HEIF images are automatically handled by AI vision
        if (file_type.includes('heic') || file_type.includes('heif')) {
          console.log('✅ HEIC format detected - AI vision will process directly')
        }
        
        if (!extractedText || extractedText.length < 10) {
          // If no text found, it might be a scanned PDF
          extractedText = `Scanned PDF Document: ${file_name}\n\nThis appears to be a scanned PDF with no extractable text. The document contains ${pdfDoc.numPages} page(s).\n\nTo extract text from scanned PDFs, please:\n1. Convert the PDF pages to images\n2. Upload each page as a separate image file for OCR\n\nFile Information:\n- File Name: ${file_name}\n- File Size: ${(fileData.size / 1024).toFixed(2)} KB\n- Pages: ${pdfDoc.numPages}`
        } else {
          console.log(`Extracted ${extractedText.length} characters from PDF`)
        }
      } catch (pdfError) {
        console.error('PDF parsing error:', pdfError)
        extractedText = `Error processing PDF: ${file_name}\n\nThe PDF file could not be processed. It may be encrypted, corrupted, or in an unsupported format.\n\nError: ${pdfError.message}\n\nPlease try:\n1. Converting the PDF to images\n2. Ensuring the PDF is not password-protected\n3. Re-saving the PDF with a different tool`
      }
      
    } else if (file_type.startsWith('image/')) {
      // For images, convert to base64 and use AI vision
      const arrayBuffer = await fileData.arrayBuffer()
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
      
      console.log('Processing image with AI vision...')
      
      const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')
      const extractResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Extract all visible text from this image using OCR. Return ONLY the extracted text without any additional commentary or formatting.'
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${file_type};base64,${base64}`
                  }
                }
              ]
            }
          ]
        })
      })

      if (!extractResponse.ok) {
        const errorText = await extractResponse.text()
        console.error('AI extraction error:', extractResponse.status, errorText)
        throw new Error(`AI extraction failed: ${extractResponse.status}`)
      }

      const extractData = await extractResponse.json()
      extractedText = extractData.choices?.[0]?.message?.content || ''
    }

    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No text could be extracted from the document')
    }
    
    // Generate AI summary
    let aiSummary = ''
    
    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No text could be extracted from the document')
    }
    
    console.log('Text extracted, length:', extractedText.length)

    // Generate AI summary
    console.log('Generating AI summary...')
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')
    const summaryResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: 'You are a document summarization expert. Provide ultra-concise, bullet-point summaries focusing only on the most critical information.'
            },
            {
              role: 'user',
              content: `Analyze this document and provide a SHORT summary with:

### Summary
- 1-2 sentence overview

### Key Points
- Max 3 bullet points of most important info only

### Details
- Document type (if identifiable)
- Critical dates/amounts/names (if any)

Keep it brief and scannable.

Text:
${extractedText.substring(0, 4000)}`
            }
          ]
        })
      })

    if (!summaryResponse.ok) {
      console.error('AI summary error:', summaryResponse.status)
      throw new Error('Failed to generate AI summary')
    }

    const summaryData = await summaryResponse.json()
    aiSummary = summaryData.choices?.[0]?.message?.content || ''

    console.log('AI summary generated')

    // Detect clauses using pattern matching
    console.log('Detecting clauses by pattern...')
    const patternClauses = detectClausesByPattern(extractedText)
    console.log(`Found ${patternClauses.length} clauses by pattern`)

    // Enhance with AI classification
    console.log('Classifying clauses with AI...')
    const aiClauses = await classifyClausesWithAI(extractedText, patternClauses, lovableApiKey)
    console.log(`Found ${aiClauses.length} clauses by AI`)

    // Merge and deduplicate clauses
    const allClauses = [...patternClauses, ...aiClauses]
    const clausesByType = allClauses.reduce((acc, clause) => {
      if (!acc[clause.type]) acc[clause.type] = []
      acc[clause.type].push(clause)
      return acc
    }, {} as Record<string, DetectedClause[]>)

    // Calculate clause statistics
    const clauseStats = Object.entries(clausesByType).map(([type, clauses]) => ({
      type,
      count: clauses.length,
      total_characters: clauses.reduce((sum, c) => sum + c.text.length, 0)
    }))

    // UAE Labour Law Compliance Check
    console.log('Checking UAE Labour Law compliance...')
    const patternViolations = checkUAELabourCompliance(extractedText, allClauses)
    console.log(`Found ${patternViolations.length} pattern-based violations`)
    
    const aiCompliance = await analyzeComplianceWithAI(
      extractedText,
      patternViolations,
      lovableApiKey
    )
    console.log(`AI compliance score: ${aiCompliance.compliance_score}%`)
    
    const allViolations = [...patternViolations, ...aiCompliance.additional_violations]
    const criticalCount = allViolations.filter(v => v.severity === 'critical').length
    const highCount = allViolations.filter(v => v.severity === 'high').length
    
    // Calculate overall compliance score
    const complianceScore = allViolations.length === 0 ? 100 :
      Math.max(0, Math.min(100, aiCompliance.compliance_score - (criticalCount * 10) - (highCount * 5)))

    // Detect missing key clauses
    console.log('Detecting missing key clauses...')
    const patternMissingClauses = await detectMissingClauses(
      extractedText,
      allClauses,
      MissingClauseRules
    )
    console.log(`Found ${patternMissingClauses.length} missing clauses (pattern-based)`)

    const aiGapAnalysis = await analyzeGapsWithAI(
      extractedText,
      patternMissingClauses,
      lovableApiKey
    )
    console.log(`Found ${aiGapAnalysis.additional_missing.length} additional gaps (AI)`)

    const allMissingClauses = [
      ...patternMissingClauses,
      ...aiGapAnalysis.additional_missing
    ]

    const sortedMissingClauses = allMissingClauses.sort((a, b) => {
      const importanceOrder = { essential: 1, recommended: 2, optional: 3 }
      return importanceOrder[a.importance] - importanceOrder[b.importance]
    })

    // Calculate statistics
    const characterCount = extractedText.length
    const wordCount = extractedText.trim().split(/\s+/).length
    const processingTime = Date.now() - startTime

    // Save to database
    const { data: historyData, error: dbError } = await supabase
      .from('ocr_history')
      .insert({
        user_id,
        company_id,
        file_name,
        file_type,
        file_size: fileData.size,
        extracted_text: extractedText,
        ai_summary: aiSummary,
        character_count: characterCount,
        word_count: wordCount,
        processing_time_ms: processingTime,
        credits_used: 1,
        metadata: {
          processed_at: new Date().toISOString(),
          clauses: allClauses,
          clause_stats: clauseStats,
          clause_types_found: Object.keys(clausesByType),
          total_clauses: allClauses.length,
          compliance_check: {
            violations: allViolations,
            compliance_score: complianceScore,
            total_violations: allViolations.length,
            critical_count: criticalCount,
            high_count: highCount,
            checked_at: new Date().toISOString(),
            ai_summary: aiCompliance.summary
          },
          missing_clauses: {
            suggestions: sortedMissingClauses,
            total_missing: sortedMissingClauses.length,
            essential_count: sortedMissingClauses.filter(c => c.importance === 'essential').length,
            recommended_count: sortedMissingClauses.filter(c => c.importance === 'recommended').length,
            gap_analysis_summary: aiGapAnalysis.gap_analysis_summary,
            analyzed_at: new Date().toISOString()
          }
        }
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      throw new Error(`Failed to save OCR history: ${dbError.message}`)
    }

    console.log('OCR processing complete:', { 
      characters: characterCount, 
      words: wordCount, 
      time: processingTime 
    })

    return new Response(
      JSON.stringify({
        success: true,
        extracted_text: extractedText,
        ai_summary: aiSummary,
        statistics: {
          characters: characterCount,
          words: wordCount,
          processing_time_ms: processingTime,
          clauses_detected: allClauses.length
        },
        clauses: allClauses,
        clause_stats: clauseStats,
        compliance_check: {
          violations: allViolations,
          compliance_score: complianceScore,
          total_violations: allViolations.length,
          critical_count: criticalCount,
          high_count: highCount,
          ai_summary: aiCompliance.summary
        },
        missing_clauses: {
          suggestions: sortedMissingClauses,
          total_missing: sortedMissingClauses.length,
          essential_count: sortedMissingClauses.filter(c => c.importance === 'essential').length,
          recommended_count: sortedMissingClauses.filter(c => c.importance === 'recommended').length,
          gap_analysis_summary: aiGapAnalysis.gap_analysis_summary
        },
        history_id: historyData.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('OCR processing error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Failed to process document'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
