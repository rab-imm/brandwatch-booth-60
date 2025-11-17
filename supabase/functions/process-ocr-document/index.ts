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
  },
  {
    clause_type: 'data_protection',
    display_name: 'Data Protection & Privacy',
    display_name_ar: 'حماية البيانات والخصوصية',
    importance: 'essential',
    category: 'legal',
    description: 'Addresses handling of personal data and privacy obligations',
    description_ar: 'يعالج التعامل مع البيانات الشخصية والتزامات الخصوصية',
    why_needed: 'Required by UAE Data Protection Law (Federal Decree-Law No. 45 of 2021) for any contract processing personal data.',
    why_needed_ar: 'مطلوب بموجب قانون حماية البيانات الإماراتي (المرسوم بقانون اتحادي رقم 45 لسنة 2021) لأي عقد يعالج البيانات الشخصية.',
    detection_patterns: [
      /\b(data protection|privacy|personal data|data processing|GDPR|data subject)\b/gi,
      /\b(confidential information|data security)\b/gi
    ],
    arabic_patterns: [
      /\b(حماية البيانات|الخصوصية|البيانات الشخصية|معالجة البيانات)\b/gu
    ],
    sample_wording_en: 'Each party shall comply with all applicable data protection laws, including UAE Federal Decree-Law No. 45 of 2021. Personal data shall be processed only for the purposes stated in this Agreement, and appropriate technical and organizational measures shall be implemented to protect such data.',
    sample_wording_ar: 'يلتزم كل طرف بالامتثال لجميع قوانين حماية البيانات المعمول بها، بما في ذلك المرسوم بقانون اتحادي رقم 45 لسنة 2021. تتم معالجة البيانات الشخصية فقط للأغراض المذكورة في هذا العقد، ويتم تطبيق التدابير التقنية والتنظيمية المناسبة لحماية هذه البيانات.',
    related_articles: ['Federal Decree-Law No. 45 of 2021'],
    common_in_document_types: ['contract', 'agreement', 'service_agreement', 'employment_contract']
  },
  {
    clause_type: 'intellectual_property',
    display_name: 'Intellectual Property Rights',
    display_name_ar: 'حقوق الملكية الفكرية',
    importance: 'essential',
    category: 'commercial',
    description: 'Defines ownership and usage rights of intellectual property',
    description_ar: 'يحدد ملكية وحقوق استخدام الملكية الفكرية',
    why_needed: 'Protects IP rights and prevents disputes over ownership of creative work, inventions, or business assets.',
    why_needed_ar: 'يحمي حقوق الملكية الفكرية ويمنع النزاعات حول ملكية الأعمال الإبداعية أو الاختراعات أو الأصول التجارية.',
    detection_patterns: [
      /\b(intellectual property|IP rights|copyright|trademark|patent|trade secret)\b/gi,
      /\b(ownership|proprietary rights|work product)\b/gi
    ],
    arabic_patterns: [
      /\b(الملكية الفكرية|حقوق النشر|العلامة التجارية|براءة اختراع)\b/gu
    ],
    sample_wording_en: 'All intellectual property rights, including but not limited to copyrights, trademarks, patents, and trade secrets, created or developed in connection with this Agreement shall be owned by [Party Name]. The other party shall not use, reproduce, or distribute such intellectual property without prior written consent.',
    sample_wording_ar: 'جميع حقوق الملكية الفكرية، بما في ذلك على سبيل المثال لا الحصر حقوق النشر والعلامات التجارية وبراءات الاختراع والأسرار التجارية، التي يتم إنشاؤها أو تطويرها فيما يتعلق بهذا العقد تكون ملكاً لـ [اسم الطرف]. لا يجوز للطرف الآخر استخدام أو استنساخ أو توزيع هذه الملكية الفكرية دون موافقة كتابية مسبقة.',
    related_articles: ['Federal Law No. 7 of 2002 - Copyrights', 'Federal Law No. 37 of 1992 - Trademarks'],
    common_in_document_types: ['contract', 'agreement', 'service_agreement', 'employment_contract']
  },
  {
    clause_type: 'limitation_of_liability',
    display_name: 'Limitation of Liability',
    display_name_ar: 'تحديد المسؤولية',
    importance: 'recommended',
    category: 'commercial',
    description: 'Limits liability exposure for each party',
    description_ar: 'يحد من التعرض للمسؤولية لكل طرف',
    why_needed: 'Protects parties from excessive financial exposure and defines the scope of liability.',
    why_needed_ar: 'يحمي الأطراف من التعرض المالي المفرط ويحدد نطاق المسؤولية.',
    detection_patterns: [
      /\b(limitation of liability|liability cap|maximum liability|damages limit)\b/gi,
      /\b(indirect damages|consequential damages|liability exclusion)\b/gi
    ],
    arabic_patterns: [
      /\b(تحديد المسؤولية|حد المسؤولية|الأضرار غير المباشرة)\b/gu
    ],
    sample_wording_en: 'Neither party shall be liable for any indirect, incidental, special, consequential, or punitive damages arising out of this Agreement. The total liability of each party shall not exceed the total amount paid under this Agreement in the twelve months preceding the claim.',
    sample_wording_ar: 'لا يكون أي طرف مسؤولاً عن أي أضرار غير مباشرة أو عرضية أو خاصة أو تبعية أو عقابية ناشئة عن هذا العقد. لا تتجاوز المسؤولية الإجمالية لكل طرف المبلغ الإجمالي المدفوع بموجب هذا العقد في الاثني عشر شهرًا السابقة للمطالبة.',
    common_in_document_types: ['contract', 'agreement', 'service_agreement']
  },
  {
    clause_type: 'indemnification',
    display_name: 'Indemnification',
    display_name_ar: 'التعويض',
    importance: 'recommended',
    category: 'commercial',
    description: 'Defines who compensates whom for losses or damages',
    description_ar: 'يحدد من يعوض من عن الخسائر أو الأضرار',
    why_needed: 'Allocates risk between parties and provides protection against third-party claims.',
    why_needed_ar: 'يوزع المخاطر بين الأطراف ويوفر الحماية ضد مطالبات الأطراف الثالثة.',
    detection_patterns: [
      /\b(indemnif(y|ication)|hold harmless|defend|reimburse)\b/gi,
      /\b(third.party claims?|losses|damages)\b/gi
    ],
    arabic_patterns: [
      /\b(تعويض|تحمل المسؤولية|الدفاع|مطالبات الغير)\b/gu
    ],
    sample_wording_en: 'Each party shall indemnify, defend, and hold harmless the other party from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys\' fees) arising out of or resulting from any breach of this Agreement or negligent acts by the indemnifying party.',
    sample_wording_ar: 'يتعهد كل طرف بتعويض والدفاع عن وحماية الطرف الآخر من وضد جميع المطالبات والأضرار والخسائر والالتزامات والتكاليف والنفقات (بما في ذلك أتعاب المحاماة المعقولة) الناشئة عن أو الناتجة عن أي خرق لهذا العقد أو الأفعال المهملة من قبل الطرف المعوض.',
    common_in_document_types: ['contract', 'agreement', 'service_agreement']
  },
  {
    clause_type: 'assignment',
    display_name: 'Assignment & Transfer',
    display_name_ar: 'التنازل والنقل',
    importance: 'recommended',
    category: 'legal',
    description: 'Governs whether and how the contract can be transferred',
    description_ar: 'ينظم ما إذا كان يمكن نقل العقد وكيفية نقله',
    why_needed: 'Controls whether parties can transfer their rights and obligations to third parties.',
    why_needed_ar: 'يتحكم في ما إذا كان يمكن للأطراف نقل حقوقهم والتزاماتهم إلى أطراف ثالثة.',
    detection_patterns: [
      /\b(assignment|transfer|assign rights|delegate)\b/gi,
      /\b(successor|permitted assignee|binding upon)\b/gi
    ],
    arabic_patterns: [
      /\b(التنازل|النقل|نقل الحقوق|التفويض)\b/gu
    ],
    sample_wording_en: 'Neither party may assign or transfer this Agreement or any rights or obligations hereunder without the prior written consent of the other party. Any attempted assignment in violation of this provision shall be void.',
    sample_wording_ar: 'لا يجوز لأي طرف التنازل عن هذا العقد أو نقله أو أي حقوق أو التزامات بموجبه دون موافقة كتابية مسبقة من الطرف الآخر. يعتبر أي تنازل يتم في انتهاك لهذا الحكم باطلاً.',
    common_in_document_types: ['contract', 'agreement', 'service_agreement']
  },
  {
    clause_type: 'amendment_procedures',
    display_name: 'Amendment Procedures',
    display_name_ar: 'إجراءات التعديل',
    importance: 'recommended',
    category: 'operational',
    description: 'Specifies how the contract can be modified',
    description_ar: 'يحدد كيفية تعديل العقد',
    why_needed: 'Prevents unauthorized changes and ensures both parties agree to modifications.',
    why_needed_ar: 'يمنع التغييرات غير المصرح بها ويضمن موافقة الطرفين على التعديلات.',
    detection_patterns: [
      /\b(amendment|modification|change|waiver)\b/gi,
      /\b(written consent|mutual agreement|signed by both)\b/gi
    ],
    arabic_patterns: [
      /\b(تعديل|تغيير|موافقة كتابية|اتفاق متبادل)\b/gu
    ],
    sample_wording_en: 'This Agreement may be amended or modified only by a written instrument signed by both parties. No waiver of any provision shall be effective unless in writing and signed by the party waiving its rights.',
    sample_wording_ar: 'لا يجوز تعديل أو تغيير هذا العقد إلا بوثيقة مكتوبة موقعة من الطرفين. لا يكون أي تنازل عن أي حكم ساريًا ما لم يكن كتابيًا وموقعًا من الطرف الذي يتنازل عن حقوقه.',
    common_in_document_types: ['contract', 'agreement']
  }
]

// High-level category grouping for violations
const CATEGORY_GROUPS: Record<string, string[]> = {
  'UAE Labor Law': [
    'working_hours',
    'annual_leave', 
    'sick_leave',
    'maternity_leave',
    'notice_period',
    'gratuity',
    'probation',
    'overtime',
    'wage_protection'
  ],
  'UAE Legal Clauses': [
    'contract_validity',
    'contract_language',
    'governing_law',
    'dispute_resolution',
    'termination',
    'confidentiality',
    'intellectual_property',
    'liability',
    'force_majeure',
    'amendments'
  ],
  'Commercial Terms': [
    'payment_terms',
    'delivery_terms',
    'warranties',
    'indemnification',
    'insurance',
    'commission',
    'territory',
    'distribution_rights'
  ],
  'Data Protection': [
    'data_privacy',
    'data_retention',
    'data_security'
  ],
  'Real Estate Terms': [
    'lease_terms',
    'rent_payment',
    'maintenance',
    'security_deposit',
    'property_description'
  ],
  'Intellectual Property': [
    'trademark_rights',
    'patent_rights',
    'copyright_protection'
  ],
  'Corporate Governance': [
    'shareholder_rights',
    'director_duties',
    'dividend_policy',
    'share_transfer',
    'corporate_governance'
  ],
  'Financial Terms': [
    'loan_amount',
    'interest_rate',
    'repayment_terms',
    'collateral',
    'default_provisions'
  ]
}

const UAEGovernanceComplianceRules: ComplianceRule[] = [
  {
    article: 'Working Hours',
    category: 'working_hours',
    requirement: 'Daily and weekly working hours should be clearly specified',
    requirement_ar: 'يجب تحديد ساعات العمل اليومية والأسبوعية بوضوح',
    mandatory: true,
    regex_patterns: [/\b(working hours?|work day|daily hours?|hours? per day|hours? per week|work schedule)\b/gi],
    arabic_patterns: [/\b(ساعات العمل|ساعة يوميا|ساعات يومية|ساعة في اليوم)\b/gu],
    violation_severity: 'high',
    recommendation: 'Specify maximum daily and weekly working hours to ensure clarity and legal compliance',
    recommendation_ar: 'حدد الحد الأقصى لساعات العمل اليومية والأسبوعية'
  },
  {
    article: 'Annual Leave',
    category: 'annual_leave',
    requirement: 'Annual leave entitlement should be clearly stated',
    requirement_ar: 'يجب تحديد استحقاق الإجازة السنوية بوضوح',
    mandatory: true,
    regex_patterns: [/\b(annual leave|vacation|paid leave|yearly leave|holiday entitlement)\b/gi],
    arabic_patterns: [/\b(إجازة سنوية|إجازة مدفوعة|إجازة)\b/gu],
    violation_severity: 'high',
    recommendation: 'Include clear annual leave provisions specifying duration and calculation method',
    recommendation_ar: 'قم بتضمين أحكام واضحة للإجازة السنوية'
  },
  {
    article: 'Sick Leave',
    category: 'sick_leave',
    requirement: 'Sick leave provisions should be documented',
    requirement_ar: 'يجب توثيق أحكام الإجازة المرضية',
    mandatory: true,
    regex_patterns: [/\b(sick leave|medical leave|illness|health)\b/gi],
    arabic_patterns: [/\b(إجازة مرضية|إجازة صحية)\b/gu],
    violation_severity: 'high',
    recommendation: 'Include sick leave provisions with clear terms and duration',
    recommendation_ar: 'قم بتضمين أحكام الإجازة المرضية بشروط ومدة واضحة'
  },
  {
    article: 'Maternity Leave',
    category: 'maternity_leave',
    requirement: 'Maternity leave entitlement should be specified if applicable',
    requirement_ar: 'يجب تحديد استحقاق إجازة الأمومة إن أمكن',
    mandatory: false,
    regex_patterns: [/\b(maternity leave|pregnancy leave|parental leave)\b/gi],
    arabic_patterns: [/\b(إجازة أمومة|إجازة وضع)\b/gu],
    violation_severity: 'medium',
    recommendation: 'Include maternity leave provisions for female employees',
    recommendation_ar: 'قم بتضمين أحكام إجازة الأمومة للموظفات'
  },
  {
    article: 'Notice Period',
    category: 'notice_period',
    requirement: 'Termination notice requirements should be specified',
    requirement_ar: 'يجب تحديد متطلبات الإخطار بالإنهاء',
    mandatory: true,
    regex_patterns: [/\b(notice period|termination notice|resignation notice|days? notice)\b/gi],
    arabic_patterns: [/\b(فترة الإخطار|إخطار مسبق|إشعار الإنهاء)\b/gu],
    violation_severity: 'critical',
    recommendation: 'Include notice period clause for contract termination by either party',
    recommendation_ar: 'قم بتضمين بند فترة الإخطار لإنهاء العقد من أي طرف'
  },
  {
    article: 'End of Service Benefits',
    category: 'gratuity',
    requirement: 'End of service benefits should be documented',
    requirement_ar: 'يجب توثيق مزايا نهاية الخدمة',
    mandatory: true,
    regex_patterns: [/\b(end of service|gratuity|severance pay|final settlement)\b/gi],
    arabic_patterns: [/\b(مكافأة نهاية الخدمة|تعويض نهاية الخدمة)\b/gu],
    violation_severity: 'critical',
    recommendation: 'Include end of service benefit provisions with clear calculation method',
    recommendation_ar: 'قم بتضمين أحكام مزايا نهاية الخدمة مع طريقة حساب واضحة'
  },
  {
    article: 'Probation Period',
    category: 'probation',
    requirement: 'Probation period duration should be specified if applicable',
    requirement_ar: 'يجب تحديد مدة الفترة التجريبية إن وجدت',
    mandatory: false,
    regex_patterns: [/\b(probation(ary)? period|trial period)\b/gi],
    arabic_patterns: [/\b(فترة تجريبية|فترة اختبار)\b/gu],
    violation_severity: 'medium',
    recommendation: 'If probation is included, specify the duration and terms clearly',
    recommendation_ar: 'إذا كانت الفترة التجريبية موجودة، حدد المدة والشروط بوضوح'
  },
  {
    article: 'Overtime Compensation',
    category: 'overtime',
    requirement: 'Overtime compensation should be specified',
    requirement_ar: 'يجب تحديد تعويض ساعات العمل الإضافية',
    mandatory: false,
    regex_patterns: [/\b(overtime|extra hours?|additional hours?)\b/gi],
    arabic_patterns: [/\b(ساعات إضافية|عمل إضافي)\b/gu],
    violation_severity: 'medium',
    recommendation: 'Include overtime compensation rates and calculation method',
    recommendation_ar: 'قم بتضمين معدلات تعويض الساعات الإضافية وطريقة الحساب'
  },
  {
    article: 'Wage Payment Terms',
    category: 'wage_protection',
    requirement: 'Salary payment terms should be clearly specified',
    requirement_ar: 'يجب تحديد شروط دفع الراتب بوضوح',
    mandatory: true,
    regex_patterns: [/\b(salary|wage|payment|compensation|remuneration)\b/gi],
    arabic_patterns: [/\b(راتب|أجر|مرتب|تعويض)\b/gu],
    violation_severity: 'critical',
    recommendation: 'Include clear salary payment terms, frequency, and amount',
    recommendation_ar: 'قم بتضمين شروط واضحة لدفع الراتب والتكرار والمبلغ'
  },
  {
    article: 'Contract Language',
    category: 'contract_language',
    requirement: 'Contract language should be clearly specified',
    requirement_ar: 'يجب تحديد لغة العقد بوضوح',
    mandatory: true,
    regex_patterns: [/[\u0600-\u06FF]/g],
    violation_severity: 'high',
    recommendation: 'Ensure contract language is appropriate for the jurisdiction',
    recommendation_ar: 'تأكد من أن لغة العقد مناسبة للولاية القضائية'
  },
  {
    article: 'Contract Validity',
    category: 'contract_validity',
    requirement: 'Contract must clearly identify parties and mutual agreement',
    requirement_ar: 'يجب أن يحدد العقد الأطراف والاتفاق المتبادل بوضوح',
    mandatory: true,
    regex_patterns: [/\b(offer|acceptance|mutual consent|agreement|parties)\b/gi],
    arabic_patterns: [/\b(إيجاب|قبول|توافق|اتفاق|أطراف)\b/gu],
    violation_severity: 'critical',
    recommendation: 'Ensure contract clearly identifies all parties and their agreement',
    recommendation_ar: 'تأكد من أن العقد يحدد جميع الأطراف واتفاقهم بوضوح'
  },
  {
    article: 'Lawful Purpose',
    category: 'consideration',
    requirement: 'Contract must have lawful purpose and consideration',
    requirement_ar: 'يجب أن يكون للعقد محل مشروع',
    mandatory: true,
    regex_patterns: [/\b(consideration|subject matter|purpose|scope of work)\b/gi],
    arabic_patterns: [/\b(المحل|موضوع العقد|الغرض|نطاق العمل)\b/gu],
    violation_severity: 'critical',
    recommendation: 'Include clear description of the subject matter and consideration',
    recommendation_ar: 'قم بتضمين وصف واضح لموضوع العقد والمحل'
  },
  {
    article: 'Commercial Law - Article 2',
    category: 'commercial_registration',
    requirement: 'Commercial parties must reference valid trade license',
    requirement_ar: 'يجب على الأطراف التجارية الإشارة إلى رخصة تجارية سارية',
    mandatory: false,
    regex_patterns: [/\b(trade license|commercial license|license number)\b/gi],
    arabic_patterns: [/\b(رخصة تجارية|رقم الرخصة)\b/gu],
    violation_severity: 'medium',
    recommendation: 'For commercial contracts, include trade license details of parties',
    recommendation_ar: 'بالنسبة للعقود التجارية، قم بتضمين تفاصيل الرخصة التجارية للأطراف'
  },
  {
    article: 'Data Protection Law - Article 5',
    category: 'data_processing',
    requirement: 'Data processing must have legal basis and specified purpose',
    requirement_ar: 'يجب أن تكون معالجة البيانات لها أساس قانوني وغرض محدد',
    mandatory: false,
    regex_patterns: [/\b(personal data|data processing|data protection|privacy)\b/gi],
    arabic_patterns: [/\b(بيانات شخصية|معالجة البيانات|حماية البيانات|الخصوصية)\b/gu],
    violation_severity: 'high',
    recommendation: 'If processing personal data, include data protection clauses compliant with UAE law',
    recommendation_ar: 'إذا كانت معالجة البيانات الشخصية، قم بتضمين بنود حماية البيانات المتوافقة مع القانون الإماراتي'
  },
  {
    article: 'Consumer Protection Law - Article 10',
    category: 'consumer_rights',
    requirement: 'Consumer contracts must clearly state terms, pricing, and return policies',
    requirement_ar: 'يجب أن توضح عقود المستهلك الشروط والأسعار وسياسات الإرجاع بوضوح',
    mandatory: false,
    regex_patterns: [/\b(consumer|customer|return policy|warranty|refund)\b/gi],
    arabic_patterns: [/\b(مستهلك|عميل|سياسة الإرجاع|ضمان|استرداد)\b/gu],
    violation_severity: 'medium',
    recommendation: 'For consumer-facing contracts, include clear terms, pricing, and return policies',
    recommendation_ar: 'بالنسبة للعقود الموجهة للمستهلكين، قم بتضمين شروط وأسعار وسياسات إرجاع واضحة'
  },
  {
    article: 'Companies Law - Article 25',
    category: 'corporate_authority',
    requirement: 'Corporate entities must demonstrate authority to contract',
    requirement_ar: 'يجب على الكيانات الشركات إثبات الصلاحية للتعاقد',
    mandatory: false,
    regex_patterns: [/\b(authorized signatory|board approval|corporate resolution)\b/gi],
    arabic_patterns: [/\b(مفوض بالتوقيع|موافقة مجلس الإدارة|قرار الشركة)\b/gu],
    violation_severity: 'medium',
    recommendation: 'For corporate parties, reference authorized signatory or board approval',
    recommendation_ar: 'بالنسبة للأطراف الشركات، أشر إلى المفوض بالتوقيع أو موافقة مجلس الإدارة'
  },
  {
    article: 'Civil Law - Article 246',
    category: 'contract_execution',
    requirement: 'Contract performance obligations must be clearly defined',
    requirement_ar: 'يجب تحديد التزامات تنفيذ العقد بوضوح',
    mandatory: true,
    regex_patterns: [/\b(obligations|performance|deliverables|duties)\b/gi],
    arabic_patterns: [/\b(التزامات|تنفيذ|المخرجات|واجبات)\b/gu],
    violation_severity: 'high',
    recommendation: 'Clearly define performance obligations and deliverables for each party',
    recommendation_ar: 'حدد بوضوح التزامات الأداء والمخرجات لكل طرف'
  },
  {
    article: 'Commercial Law - Article 90',
    category: 'payment_terms',
    requirement: 'Payment terms, currency, and methods must be specified',
    requirement_ar: 'يجب تحديد شروط الدفع والعملة والطرق',
    mandatory: true,
    regex_patterns: [/\b(payment|price|fees?|currency|AED|USD|invoice)\b/gi],
    arabic_patterns: [/\b(دفع|سعر|رسوم|عملة|درهم|فاتورة)\b/gu],
    violation_severity: 'high',
    recommendation: 'Include clear payment terms, amounts, currency, and payment methods',
    recommendation_ar: 'قم بتضمين شروط دفع واضحة، والمبالغ، والعملة، وطرق الدفع'
  }
]

// Group violations by high-level category
function groupViolationsByCategory(violations: ComplianceViolation[]): Record<string, ComplianceViolation[]> {
  const grouped: Record<string, ComplianceViolation[]> = {}
  
  for (const violation of violations) {
    // Find which high-level category this violation belongs to
    let highLevelCategory = 'Other'
    
    for (const [groupName, categories] of Object.entries(CATEGORY_GROUPS)) {
      if (categories.includes(violation.rule.category)) {
        highLevelCategory = groupName
        break
      }
    }
    
    if (!grouped[highLevelCategory]) {
      grouped[highLevelCategory] = []
    }
    grouped[highLevelCategory].push(violation)
  }
  
  return grouped
}

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

function checkUAEGovernanceCompliance(
  extractedText: string,
  detectedClauses: DetectedClause[]
): ComplianceViolation[] {
  const violations: ComplianceViolation[] = []
  const textLower = extractedText.toLowerCase()
  
  for (const rule of UAEGovernanceComplianceRules) {
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

async function detectDocumentTypeAndLaws(
  extractedText: string,
  lovableApiKey: string
): Promise<{
  document_type: string
  document_subtype: string
  applicable_uae_laws: string[]
  key_parties: string[]
  jurisdiction: string
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
          content: `You are a UAE legal document classification expert.

Analyze the document and identify:
1. Document Type (employment_contract, commercial_agreement, lease_agreement, service_contract, memorandum_of_understanding, power_of_attorney, loan_agreement, partnership_agreement, sales_agreement, nda, consulting_agreement, supply_agreement, distribution_agreement, franchise_agreement, license_agreement, construction_contract, real_estate_contract, insurance_policy, warranty, terms_and_conditions, privacy_policy, corporate_bylaws, shareholder_agreement, joint_venture_agreement, other)

2. Document Subtype (e.g., "Fixed-term employment contract", "Commercial lease", "Software license", etc.)

3. Applicable UAE Laws (select all relevant):
   - UAE Labour Law (Federal Decree-Law No. 33 of 2021)
   - UAE Civil Transactions Law (Federal Law No. 5 of 1985)
   - UAE Commercial Transactions Law (Federal Law No. 18 of 1993)
   - UAE Companies Law (Federal Law No. 2 of 2015)
   - UAE Consumer Protection Law (Federal Law No. 15 of 2020)
   - UAE Data Protection Law (Federal Decree-Law No. 45 of 2021)
   - UAE Real Property Law (Federal Law No. 24 of 2006)
   - UAE Commercial Agency Law (Federal Law No. 18 of 1981)
   - UAE Trademark Law (Federal Law No. 37 of 1992)
   - UAE Copyright Law (Federal Law No. 7 of 2002)
   - UAE Federal Penal Code (Federal Law No. 3 of 1987)
   - UAE Contract Law principles

4. Key parties mentioned (e.g., "employer and employee", "landlord and tenant")

5. Jurisdiction (e.g., "UAE", "Dubai", "Abu Dhabi", "DIFC", "ADGM")

Return ONLY raw JSON (NO markdown):
{
  "document_type": "string",
  "document_subtype": "string",
  "applicable_uae_laws": ["array of applicable laws"],
  "key_parties": ["array of party types"],
  "jurisdiction": "string",
  "summary": "1-2 sentence description of what this document is"
}`
        },
        {
          role: 'user',
          content: `Analyze this document:\n\n${extractedText.substring(0, 6000)}`
        }
      ]
    })
  })
  
  if (!response.ok) {
    console.error('Document type detection failed:', response.status)
    return {
      document_type: 'unknown',
      document_subtype: 'Unknown document type',
      applicable_uae_laws: ['UAE Contract Law principles'],
      key_parties: [],
      jurisdiction: 'UAE',
      summary: 'Document type could not be determined'
    }
  }
  
  const data = await response.json()
  let aiResponse = data.choices?.[0]?.message?.content || '{}'
  
  try {
    if (aiResponse.trim().startsWith('```')) {
      aiResponse = aiResponse.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    }
    
    const parsed = JSON.parse(aiResponse)
    return {
      document_type: parsed.document_type || 'unknown',
      document_subtype: parsed.document_subtype || 'Unknown',
      applicable_uae_laws: parsed.applicable_uae_laws || ['UAE Contract Law principles'],
      key_parties: parsed.key_parties || [],
      jurisdiction: parsed.jurisdiction || 'UAE',
      summary: parsed.summary || 'Legal document analysis'
    }
  } catch (error) {
    console.error('Failed to parse document type response:', error)
    return {
      document_type: 'unknown',
      document_subtype: 'Unknown',
      applicable_uae_laws: ['UAE Contract Law principles'],
      key_parties: [],
      jurisdiction: 'UAE',
      summary: 'Document type analysis incomplete'
    }
  }
}

async function analyzeDynamicComplianceWithAI(
  extractedText: string,
  documentType: string,
  applicableLaws: string[],
  jurisdiction: string,
  lovableApiKey: string
): Promise<{
  violations: ComplianceViolation[]
  compliance_score: number
  summary: string
  category_findings: Record<string, number>
}> {
  
  // Build dynamic prompt based on document type and applicable laws
  const lawsContext = applicableLaws.join('\n- ')
  
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
          content: `You are a UAE legal compliance expert specializing in ${jurisdiction} law.

DOCUMENT TYPE: ${documentType}

APPLICABLE UAE LAWS:
- ${lawsContext}

Your task: Analyze this ${documentType} for compliance with the applicable UAE laws listed above. 

Focus on:
1. Mandatory clauses required by UAE law for this document type
2. Missing legal requirements specific to ${jurisdiction}
3. Compliance issues with specific UAE Federal Laws
4. Essential legal protections for the parties involved
5. Jurisdiction-specific requirements (e.g., DIFC, ADGM, UAE Federal)

For each violation, specify:
- The specific UAE law article/section (e.g., "Article 17, Labour Law No. 33/2021")
- Category (use one of: working_hours, annual_leave, sick_leave, maternity_leave, notice_period, gratuity, probation, overtime, wage_protection, contract_validity, contract_language, governing_law, dispute_resolution, termination, confidentiality, intellectual_property, liability, force_majeure, amendments, payment_terms, delivery_terms, warranties, indemnification, insurance, data_privacy, data_retention, data_security, lease_terms, rent_payment, maintenance, security_deposit, property_description, trademark_rights, patent_rights, copyright_protection, agency_terms, distribution_rights, territory, commission, liability_limits, insurance_requirements, construction_standards, project_timeline, payment_schedule, defect_liability, corporate_governance, shareholder_rights, director_duties, dividend_policy, share_transfer, loan_amount, interest_rate, repayment_terms, collateral, default_provisions, or other)
- Severity (critical, high, medium, low)
- Specific details of what's missing
- Actionable recommendation with UAE law reference

Return ONLY raw JSON (NO markdown):
{
  "violations": [
    {
      "article": "Specific Article/Section of UAE Law",
      "category": "category_name",
      "severity": "critical|high|medium|low",
      "details": "Specific issue found",
      "recommendation": "Specific action with UAE law reference"
    }
  ],
  "compliance_score": 0-100,
  "summary": "Brief 1-2 sentence compliance overview",
  "category_findings": {
    "UAE Labor Law": 0,
    "UAE Legal Clauses": 0,
    "Commercial Terms": 0,
    "Data Protection": 0,
    "Real Estate Terms": 0,
    "Intellectual Property": 0,
    "Corporate Governance": 0,
    "Financial Terms": 0
  }
}`
        },
        {
          role: 'user',
          content: `Analyze this ${documentType} for UAE compliance:\n\n${extractedText.substring(0, 12000)}`
        }
      ]
    })
  })
  
  if (!response.ok) {
    console.error('AI dynamic compliance check failed:', response.status)
    return {
      violations: [],
      compliance_score: 50,
      summary: 'AI compliance analysis unavailable',
      category_findings: {}
    }
  }
  
  const data = await response.json()
  let aiResponse = data.choices?.[0]?.message?.content || '{}'
  
  try {
    if (aiResponse.trim().startsWith('```')) {
      aiResponse = aiResponse.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    }
    
    const parsed = JSON.parse(aiResponse)
    
    const aiViolations: ComplianceViolation[] = (parsed.violations || []).map((v: any) => ({
      rule: {
        article: v.article || 'General Requirement',
        category: v.category || 'other',
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
      violations: aiViolations,
      compliance_score: parsed.compliance_score || 50,
      summary: parsed.summary || 'Compliance check complete',
      category_findings: parsed.category_findings || {}
    }
  } catch (error) {
    console.error('Failed to parse AI compliance response:', error)
    return {
      violations: [],
      compliance_score: 50,
      summary: 'Compliance analysis partially complete',
      category_findings: {}
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

async function detectDynamicMissingClauses(
  extractedText: string,
  documentType: string,
  applicableLaws: string[],
  lovableApiKey: string
): Promise<{
  missing_clauses: MissingClauseSuggestion[]
  summary: string
}> {
  
  const lawsContext = applicableLaws.join('\n- ')
  
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
          content: `You are a UAE legal drafting expert.

DOCUMENT TYPE: ${documentType}

APPLICABLE UAE LAWS:
- ${lawsContext}

Identify missing or weak clauses that should be included in this ${documentType} according to UAE law and best practices.

Focus on:
1. Mandatory clauses required by UAE law
2. Important protective clauses for parties
3. Jurisdiction-specific requirements
4. Industry best practices in UAE

For each missing clause:
- Type: descriptive name (e.g., "Working Hours Specification", "Payment Terms", "Governing Law")
- Category: matching category from violations (legal, commercial, operational)
- Importance: essential (required by law), recommended (best practice), optional (nice to have)
- Description: Why this clause is important
- Sample: Brief example text in English showing how to include it

Return ONLY raw JSON (NO markdown):
{
  "missing_clauses": [
    {
      "type": "Clause Name",
      "category": "legal|commercial|operational",
      "importance": "essential|recommended|optional",
      "description": "Why needed",
      "sample_wording": "Example clause text"
    }
  ],
  "summary": "Brief gap analysis summary"
}`
        },
        {
          role: 'user',
          content: `Identify missing clauses in this ${documentType}:\n\n${extractedText.substring(0, 10000)}`
        }
      ]
    })
  })
  
  if (!response.ok) {
    console.error('Missing clauses detection failed:', response.status)
    return {
      missing_clauses: [],
      summary: 'Gap analysis unavailable'
    }
  }
  
  const data = await response.json()
  let aiResponse = data.choices?.[0]?.message?.content || '{}'
  
  try {
    if (aiResponse.trim().startsWith('```')) {
      aiResponse = aiResponse.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    }
    
    const parsed = JSON.parse(aiResponse)
    
    const missingClauses: MissingClauseSuggestion[] = (parsed.missing_clauses || []).map((c: any) => ({
      clause_type: c.type || 'other',
      display_name: c.type || 'Additional Clause',
      display_name_ar: '',
      importance: c.importance || 'recommended',
      category: c.category || 'operational',
      description: c.description || '',
      description_ar: '',
      why_needed: c.description || '',
      why_needed_ar: '',
      sample_wording_en: c.sample_wording || '',
      sample_wording_ar: ''
    }))
    
    return {
      missing_clauses: missingClauses,
      summary: parsed.summary || 'Gap analysis complete'
    }
  } catch (error) {
    console.error('Failed to parse missing clauses response:', error)
    return {
      missing_clauses: [],
      summary: 'Gap analysis incomplete'
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
                  text: 'Extract all visible text from this image using OCR. For Arabic text, ensure letters are properly connected (cursive form). Return ONLY the extracted text without any additional commentary or formatting.'
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
              content: 'You are a document summarization expert. Provide ultra-concise, bullet-point summaries focusing only on the most critical information. Use a professional tone without emojis.'
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

    // STEP 1: Detect document type and applicable UAE laws
    console.log('Detecting document type and applicable UAE laws...')
    const documentAnalysis = await detectDocumentTypeAndLaws(extractedText, lovableApiKey)
    console.log(`Document type: ${documentAnalysis.document_type}`)
    console.log(`Applicable laws: ${documentAnalysis.applicable_uae_laws.join(', ')}`)

    // STEP 2: Perform dynamic UAE compliance analysis
    console.log('Performing dynamic UAE compliance analysis...')
    const complianceResult = await analyzeDynamicComplianceWithAI(
      extractedText,
      documentAnalysis.document_type,
      documentAnalysis.applicable_uae_laws,
      documentAnalysis.jurisdiction,
      lovableApiKey
    )
    console.log(`Found ${complianceResult.violations.length} compliance issues`)
    console.log(`Compliance score: ${complianceResult.compliance_score}%`)

    const allViolations = complianceResult.violations
    const criticalCount = allViolations.filter(v => v.severity === 'critical').length
    const highCount = allViolations.filter(v => v.severity === 'high').length
    const mediumCount = allViolations.filter(v => v.severity === 'medium').length
    const lowCount = allViolations.filter(v => v.severity === 'low').length
    
    // Calculate overall compliance score
    const complianceScore = complianceResult.compliance_score

    // STEP 3: Detect missing clauses dynamically
    console.log('Detecting missing clauses...')
    const missingClausesResult = await detectDynamicMissingClauses(
      extractedText,
      documentAnalysis.document_type,
      documentAnalysis.applicable_uae_laws,
      lovableApiKey
    )
    console.log(`Found ${missingClausesResult.missing_clauses.length} missing clauses`)

    const allMissingClauses = missingClausesResult.missing_clauses

    const sortedMissingClauses = allMissingClauses.sort((a, b) => {
      const importanceOrder = { essential: 1, recommended: 2, optional: 3 }
      return importanceOrder[a.importance] - importanceOrder[b.importance]
    })

    // STEP 4: Group violations by category
    const groupedViolations = groupViolationsByCategory(allViolations)

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
        document_analysis: {
          document_type: documentAnalysis.document_type,
          document_subtype: documentAnalysis.document_subtype,
          applicable_laws: documentAnalysis.applicable_uae_laws,
          key_parties: documentAnalysis.key_parties,
          jurisdiction: documentAnalysis.jurisdiction,
          type_summary: documentAnalysis.summary
        },
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
          grouped_violations: groupedViolations,
          category_findings: complianceResult.category_findings,
          compliance_score: complianceScore,
          total_violations: allViolations.length,
          critical_count: criticalCount,
          high_count: highCount,
          medium_count: mediumCount,
          low_count: lowCount,
          ai_summary: complianceResult.summary
        },
        missing_clauses: {
          suggestions: sortedMissingClauses,
          total_missing: sortedMissingClauses.length,
          essential_count: sortedMissingClauses.filter(c => c.importance === 'essential').length,
          recommended_count: sortedMissingClauses.filter(c => c.importance === 'recommended').length,
          gap_analysis_summary: missingClausesResult.summary
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
