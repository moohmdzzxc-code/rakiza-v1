from pathlib import Path
import re

p=Path('rakiza-ai.js')
s=p.read_text(encoding='utf-8')

s=s.replace("const RAI_VERSION='0.1.0';","const RAI_VERSION='0.2.0';",1)

new_domain_words=r'''const RAI_DOMAIN_WORDS={
  'تواجد':['تواجد','التواجد','توجد','التوجد','تواجذ','التواجذ'],
  'خطة':['خطه','خطة','الخطه','الخطة','بلان','plan'],
  'مسودة':['مسوده','مسودة','مبدئي','مبدئيه','مبدئية','درافت','draft'],
  'أسبوع':['اسبوع','أسبوع','الاسبوع','الأسبوع','اسبوعي','أسبوعي'],
  'شهر':['شهر','الشهر','شهري','شهور','اشهر','أشهر'],
  'دوام':['دوام','الدوام','دوم','مداوم','مداومين'],
  'شفت':['شفت','شفتات','شيفت','شيفتات','وردية','ورديه','ورديات'],
  'مبيعات':['مبيعات','المبيعات','مبيعاات','مبيعاتس','بيع','البيع','المباع'],
  'مستهدف':['مستهدف','المستهدف','تارقت','تارجت','target','تارغت','هدف','الهدف'],
  'تحقيق':['تحقيق','التحقيق','حقق','محقق','نسبة التحقيق'],
  'فجوة':['فجوه','فجوة','العجز','عجز','فرق','الفارق','متبقي','الباقي'],
  'نواقص':['نواقص','النواقص','نقص','ناقص','ناقصة','ناقصه'],
  'تغذية':['تغذيه','تغذية','توريد','تعويض النقص','وصلت البضاعة','وصلت البضاعه'],
  'فرص ضائعة':['فرص ضائعه','فرص ضائعة','فرص مفقوده','فرص مفقودة','lost opportunities'],
  'إجراءات':['اجراء','اجراءات','إجراء','إجراءات','الاجراءات','طلب','طلبات'],
  'متابعات':['متابعه','متابعة','متابعات','المتابعات','لاحق','تابع'],
  'تصعيد':['تصعيد','صعد','مرفوع','تم الرفع','رفع للمشرف'],
  'صيانة':['صيانه','صيانة','عطل','اعطال','أعطال','خربان'],
  'جاهزية':['جاهزيه','جاهزية','الجاهزيه','الجاهزية','استعداد','جاهز'],
  'حضور':['حضور','الحضور','داوم','دوام فعلي','التزام الحضور'],
  'غياب':['غياب','غايب','غائب','ما داوم','لم يداوم'],
  'تأخير':['تاخير','تأخير','متاخر','متأخر','تأخر'],
  'مهام':['مهمه','مهمة','مهام','المهام','تكليف','تكاليف'],
  'تنفيذ':['تنفيذ','نفذ','منفذ','انجاز','إنجاز','اكتمل','مكتمل'],
  'تقرير':['تقرير','تقارير','التقرير','ملخص','خلاصة','خلاصه'],
  'اكسل':['اكسل','إكسل','excel','xlsx','شيت','sheet'],
  'تحليل':['حلل','تحليل','حللي','فسر','فسّر','اقرا','اقرأ','شخص','شخّص'],
  'مقارنة':['قارن','مقارنه','مقارنة','مقابل','مقارنة مع','قارنه'],
  'ترتيب':['اكثر','أكثر','اقل','أقل','اعلى','أعلى','ادنى','أدنى','رتب','ترتيب','تكرر','متكرر'],
  'مفتوح':['مفتوح','مفتوحه','مفتوحة','قائم','قائمة','للحين','حتى الان','حتى الآن'],
  'مغلق':['مغلق','مغلقه','مغلقة','منتهي','منتهية','خلص','مخلص'],
  'اليوم':['اليوم','يوم'],
  'بكرة':['بكره','بكرة','غدا','غداً'],
  'أمس':['امس','أمس','البارح'],
  'افتح':['افتح','فتح','ودني','روح','انتقل','ادخل','أدخل'],
  'اعرض':['ورني','وريني','اعرض','أعرض','طلع','طلعلي','طلع لي','هات','عطني','اعطني','أعطني','وش عندي','كم عندي'],
  'صدر':['صدر','صدّر','تصدير','نزل','نزّل','حمل','حمّل'],
  'أنشئ':['سوي','سو','سوى','جهز','جهّز','اعمل','ابني','بني','رتب','انشئ','أنشئ','ابي','ابغى','أبغى','احتاج','أحتاج']
};

const RAI_MONTHS=[
  {month:1,name:'يناير',aliases:['يناير','january','jan']},
  {month:2,name:'فبراير',aliases:['فبراير','february','feb']},
  {month:3,name:'مارس',aliases:['مارس','march','mar']},
  {month:4,name:'أبريل',aliases:['ابريل','أبريل','إبريل','april','apr']},
  {month:5,name:'مايو',aliases:['مايو','may']},
  {month:6,name:'يونيو',aliases:['يونيو','june','jun']},
  {month:7,name:'يوليو',aliases:['يوليو','july','jul']},
  {month:8,name:'أغسطس',aliases:['اغسطس','أغسطس','اغستس','august','aug']},
  {month:9,name:'سبتمبر',aliases:['سبتمبر','september','sep','sept']},
  {month:10,name:'أكتوبر',aliases:['اكتوبر','أكتوبر','october','oct']},
  {month:11,name:'نوفمبر',aliases:['نوفمبر','november','nov']},
  {month:12,name:'ديسمبر',aliases:['ديسمبر','december','dec']}
];

const RAI_OPERATIONAL_CONCEPTS={
  sales:{
    sales:['مبيعات','بيع','المبيعات','المباع','دخل المبيعات'],
    target:['مستهدف','تارقت','تارجت','target','هدف المبيعات'],
    achievement:['تحقيق','نسبة التحقيق','حققنا','محقق'],
    gap:['فجوة','عجز','متبقي','الفرق عن المستهدف','ناقص عن التارقت'],
    daily_sales:['مبيعات اليوم','بيع اليوم','اليومي'],
    monthly_sales:['مبيعات الشهر','الشهري'],
    atv:['atv','متوسط الفاتورة','قيمة الفاتورة','متوسط قيمة الفاتورة'],
    upt:['upt','متوسط القطع','قطع الفاتورة','عدد القطع بالفاتورة'],
    transactions:['فواتير','عدد الفواتير','عمليات','عدد العمليات','transactions'],
    quantity:['كميات','قطع مباعة','عدد القطع','quantity'],
    visitors:['زوار','حركة','اقبال','إقبال','footfall','traffic'],
    conversion:['تحويل','نسبة التحويل','conversion','cv']
  },
  shortages:{
    shortage:['نواقص','نقص','ناقص','نفاد','مفقود'],
    open:['نواقص مفتوحة','نقص مفتوح','القائم','ما وصل'],
    ordered:['تم الطلب','طلبناه','طلبات التغذية','مطلوب للتغذية'],
    supplied:['تمت التغذية','وصلت التغذية','وصلت البضاعة','توفر'],
    requested_qty:['الكمية المطلوبة','المطلوب','كم طلبنا'],
    current_qty:['الموجود','المتوفر','الكمية الحالية'],
    lost_opportunities:['فرص ضائعة','فرص مفقودة','عميل راح','lost opportunities'],
    repeated:['متكرر','يتكرر','كرر النقص','اكثر نقص'],
    section:['قسم','الأقسام','اي قسم','أي قسم'],
    product:['صنف','منتج','مقاس','موديل','لون']
  },
  readiness:{
    readiness:['جاهزية','جاهزية المعرض','الجاهزية التشغيلية','استعداد المعرض'],
    score:['درجة الجاهزية','نسبة الجاهزية','تقييم الجاهزية','الدرجة'],
    critical:['حرج','حرجة','بند حرج','critical'],
    failed:['فشل','غير جاهز','غير ناجح','ملاحظة جاهزية','اخفق'],
    cleanliness:['نظافة','النظافة','صالة','واجهة','واجهات','غرف القياس'],
    displays:['معروضات','عرض','اكتمال المعروض','ترتيب المعروض'],
    cash:['نقدية','كاشير','صرف','فئات الصرف','ايداع','إيداع'],
    systems:['اجهزة','أجهزة','نظام البيع','نقاط البيع','شبكة','كمبيوتر'],
    supplies:['مستلزمات','اكياس','أكياس','رول','حبر','اوراق','أوراق'],
    facilities:['صيانة','انارة','إنارة','مكيف','باب','مرافق'],
    safety:['سلامة','السلامة','مخارج طوارئ','طفايات','اسعافات','إسعافات']
  },
  actions:{
    action:['اجراء','إجراء','اجراءات','إجراءات','طلب دعم','مشكلة عميل'],
    followup:['متابعة','متابعات','تابع','قيد المتابعة'],
    open:['مفتوح','قيد المتابعة','ما خلص','للحين'],
    closed:['مغلق','تم الاغلاق','تم الإغلاق','منتهي','خلص'],
    escalated:['تصعيد','تم التصعيد','تم الرفع','مرفوع'],
    overdue:['متاخر','متأخر','قديم','متأخرة','له فترة'],
    maintenance:['صيانة','عطل','اعطال','أعطال'],
    support:['دعم','طلب دعم'],
    customer_issue:['مشكلة عميل','شكوى عميل','عميل']
  },
  attendance:{
    attendance:['حضور','الحضور','مداوم','داوم'],
    absence:['غياب','غايب','غائب','ما داوم'],
    lateness:['تأخير','متأخر','تاخير','تأخر'],
    uniform:['زي','الزي','زي رسمي','لبس رسمي'],
    appearance:['مظهر','المظهر','هندام'],
    team_readiness:['جاهزية الفريق','الفريق جاهز','التزام الفريق']
  },
  roster:{
    roster:['تواجد','خطة التواجد','جدول الدوام','دوام','شفت','شفتات','ورديات'],
    morning:['صباح','صباحي','morning'],
    evening:['مساء','مسائي','evening'],
    off:['اجازة','إجازة','راحة','اوف','d/o'],
    annual_leave:['سنوية','اجازة سنوية','a/l'],
    sick_leave:['سكليف','مرضية','اجازة مرضية','s/l'],
    compensatory:['تعويضي','تعويض'],
    work_mission:['مهمة عمل','مهمه عمل'],
    change:['تغيير التواجد','غير الخطة','عدل الدوام','تعديل الخطة']
  },
  tasks:{
    task:['مهمة','مهام','تكليف','المهام اليومية','خطة اليوم'],
    completed:['تم التنفيذ','منفذ','مكتمل','تم','انتهى'],
    incomplete:['غير منفذ','ما تنفذ','غير مكتمل','متعثر','متأخر'],
    arrangement:['ترتيب','تعبئة','رفل','refill','ترتيب وتعبئة'],
    receiving:['استلام','استلام بضاعة','استلام البضاعة'],
    transfer:['تحويل','ترانسفير','transfer'],
    vm:['vm','فيجوال','visual merchandising','عرض بصري']
  },
  reporting:{
    report:['تقرير','ملخص','خلاصة','نتيجة'],
    export:['اكسل','excel','xlsx','صدر','تصدير'],
    compare:['قارن','مقارنة','مقابل','بالشهر اللي قبله','بالاسبوع اللي قبله'],
    analyze:['حلل','تحليل','فسر','شخص','اقرأ الأداء'],
    trend:['اتجاه','ترند','تحسن','تراجع','نمو','انخفاض','ارتفاع'],
    ranking:['اكثر','أكثر','اقل','أقل','اعلى','أعلى','رتب','متكرر']
  }
};

const RAI_INTENT_LABELS={
  navigate_roster:'فتح خطة التواجد',roster_draft:'إنشاء مسودة خطة تواجد',date_query:'فهم تاريخ/يوم',
  sales_query:'استعلام عن المبيعات',sales_analysis:'تحليل المبيعات',sales_compare:'مقارنة المبيعات',sales_export:'تصدير المبيعات',
  shortages_query:'استعلام عن النواقص',shortages_analysis:'تحليل النواقص',shortages_compare:'مقارنة النواقص',shortages_export:'تصدير النواقص',
  readiness_query:'استعلام عن الجاهزية',readiness_analysis:'تحليل الجاهزية',readiness_compare:'مقارنة الجاهزية',
  actions_query:'استعلام عن الإجراءات والمتابعات',actions_analysis:'تحليل الإجراءات والمتابعات',
  attendance_query:'استعلام عن الحضور والفريق',attendance_analysis:'تحليل الحضور والفريق',
  tasks_query:'استعلام عن تنفيذ المهام',tasks_analysis:'تحليل تنفيذ المهام',
  operational_summary:'ملخص تشغيلي شامل',open_items_summary:'الأعمال المفتوحة وغير المكتملة',report_request:'طلب تقرير'
};'''

s,n=re.subn(r"const RAI_DOMAIN_WORDS=\{.*?\n\};",lambda m:new_domain_words,s,count=1,flags=re.S)
if n!=1: raise SystemExit('RAI_DOMAIN_WORDS block not found')

insert=r'''
function raiConceptMatch(text,aliases){
  const n=raiNorm(text),tokens=n.split(' ').filter(Boolean);
  for(const alias of aliases){
    const a=raiNorm(alias);
    if(!a)continue;
    if(n.includes(a))return true;
    if(!a.includes(' ')&&tokens.some(t=>raiCloseToken(t,a)))return true;
  }
  return false;
}

function raiCollectConcepts(text){
  const out=[];
  for(const [domain,concepts] of Object.entries(RAI_OPERATIONAL_CONCEPTS)){
    for(const [concept,aliases] of Object.entries(concepts))if(raiConceptMatch(text,aliases))out.push({domain,concept});
  }
  return out;
}

function raiDomainScores(text,concepts=null){
  const found=concepts||raiCollectConcepts(text),scores={sales:0,shortages:0,readiness:0,actions:0,attendance:0,roster:0,tasks:0,reporting:0};
  for(const x of found)scores[x.domain]=(scores[x.domain]||0)+1;
  const n=raiNorm(text);
  if(/مبيعات|تارقت|تارجت|مستهدف|atv|upt|فواتير|تحقيق/.test(n))scores.sales+=2;
  if(/نواقص|نقص|تغذيه|فرص ضايعه|فرص ضائعه/.test(n))scores.shortages+=2;
  if(/جاهزي|نظاف|معروض|سلامه/.test(n))scores.readiness+=2;
  if(/اجراء|متابع|تصعيد|صيانه|عطل/.test(n))scores.actions+=2;
  if(/حضور|غياب|غايب|متاخر|زي رسمي/.test(n))scores.attendance+=2;
  if(/تواجد|شفت|جدول دوام|خطه التواجد/.test(n))scores.roster+=2;
  if(/مهمه|مهام|تنفيذ|استلام|تحويل|فيجوال/.test(n))scores.tasks+=2;
  return scores;
}

function raiPrimaryDomain(scores){
  const operational=Object.entries(scores).filter(([k])=>k!=='reporting').sort((a,b)=>b[1]-a[1]);
  if(!operational.length||operational[0][1]<=0)return null;
  if(operational[1]&&operational[1][1]===operational[0][1]&&operational[0][1]>=2)return'multi';
  return operational[0][0];
}

function raiOperation(text){
  const n=raiNorm(text);
  if(raiHas(text,['افتح'])&&!raiHas(text,['أنشئ','مسودة']))return'navigate';
  if(raiHas(text,['صدر','اكسل'])||/تصدير|xlsx|excel/.test(n))return'export';
  if(raiHas(text,['مقارنة'])||/قارن|مقابل/.test(n))return'compare';
  if(raiHas(text,['تحليل'])||/حلل|فسر|شخص|ليش|لماذا|سبب/.test(n))return'analyze';
  if(raiHas(text,['ترتيب'])||/اكثر|اقل|اعلي|اعلى|رتب|متكرر/.test(n))return'rank';
  if(raiHas(text,['أنشئ','مسودة'])||/سوي|جهز|ابني|ابي|ابغى|احتاج/.test(n))return'create';
  if(/ملخص|خلاصه|خلاصة|وضعي|وضعنا|الوضع/.test(n))return'summary';
  if(raiHas(text,['اعرض'])||/وش|كم|مين|ايش|اي |هل/.test(n))return'query';
  return'query';
}

function raiMonthPeriod(text){
  const n=raiNorm(text),base=raiDateObj(raiBaseDate());
  let y=base.getFullYear(),m=null;
  const yr=n.match(/\b(20\d{2})\b/);if(yr)y=Number(yr[1]);
  for(const row of RAI_MONTHS){if(row.aliases.some(a=>n.includes(raiNorm(a)))){m=row.month;break}}
  if(/الشهر\s*(?:الماضي|السابق|اللي فات)|(?:الشهر اللي فات)/.test(n)){const d=new Date(base.getFullYear(),base.getMonth()-1,1);return{type:'month',month:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`,label:'الشهر الماضي'}}
  if(/(?:هذا|هال)\s*الشهر|الشهر\s*(?:الحالي|هذا)/.test(n))return{type:'month',month:`${base.getFullYear()}-${String(base.getMonth()+1).padStart(2,'0')}`,label:'هذا الشهر'};
  const last=n.match(/(?:اخر|آخر)\s*(\d+)\s*(?:شهور|اشهر|أشهر)/);if(last)return{type:'last_n_months',count:Number(last[1])};
  if(m)return{type:'month',month:`${y}-${String(m).padStart(2,'0')}`,label:RAI_MONTHS.find(x=>x.month===m)?.name||''};
  return null;
}

function raiParsePeriod(text,temporal=null){
  const month=raiMonthPeriod(text);if(month)return month;
  if(temporal){
    if(temporal.type==='date')return{type:'date',date:temporal.date};
    if(temporal.type==='week')return{type:'range',start:temporal.start,end:temporal.end,scope:temporal.scope};
    if(temporal.type==='weekday')return{type:'dates',dates:temporal.days.map(x=>x.date)};
  }
  return null;
}

function raiBroadOperationalIntent(text){
  const n=raiNorm(text);
  if(/وش\s*(?:عندي|باقي)|ما\s*(?:خلص|اكتمل)|غير\s*مكتمل|مفتوح\s*(?:للحين|حتى الان)|اشياء\s*مفتوحه/.test(n))return'open_items_summary';
  if(/وضعي\s*(?:كيف|اليوم)|وضعنا\s*(?:كيف|اليوم)|كيف\s*(?:الوضع|وضعي)|وش\s*(?:اوضاعنا|وضعنا)|ركز\s*علي|اولويا|أولويا|وش\s*اهم\s*شي/.test(n))return'operational_summary';
  return null;
}
'''

anchor='function raiDetectIntent(text,entities){'
if anchor not in s: raise SystemExit('intent anchor not found')
s=s.replace(anchor,insert+'\n'+anchor,1)

new_detect=r'''function raiDetectIntent(text,entities){
  const n=raiNorm(text),hasRoster=entities.domain==='roster'||raiHas(text,['تواجد','دوام','شفت'])||(/خطه/.test(n)&&/(فريق|موظف|اسبوع)/.test(n));
  const navigate=entities.operation==='navigate',create=entities.operation==='create';
  if(hasRoster&&navigate)return'navigate_roster';
  if(hasRoster&&(create||entities.constraints.length||raiHas(text,['مسودة'])))return'roster_draft';
  if(entities.employees.length&&entities.temporal&&entities.constraints.length)return'roster_draft';
  if((/متي|متى|تاريخ/.test(n)||/^وش\s+يوم/.test(n))&&entities.temporal)return'date_query';
  if(entities.temporal&&entities.temporal.type==='weekday'&&/(الجاي|القادم|المقبل)/.test(n)&&!entities.domain)return'date_query';
  const broad=raiBroadOperationalIntent(text);if(broad)return broad;
  const d=entities.domain,op=entities.operation;
  if(d==='sales')return op==='export'?'sales_export':op==='compare'?'sales_compare':(['analyze','rank'].includes(op)?'sales_analysis':'sales_query');
  if(d==='shortages')return op==='export'?'shortages_export':op==='compare'?'shortages_compare':(['analyze','rank'].includes(op)?'shortages_analysis':'shortages_query');
  if(d==='readiness')return op==='compare'?'readiness_compare':(['analyze','rank'].includes(op)?'readiness_analysis':'readiness_query');
  if(d==='actions')return ['analyze','rank','compare'].includes(op)?'actions_analysis':'actions_query';
  if(d==='attendance')return ['analyze','rank','compare'].includes(op)?'attendance_analysis':'attendance_query';
  if(d==='tasks')return ['analyze','rank','compare'].includes(op)?'tasks_analysis':'tasks_query';
  if(d==='multi')return'operational_summary';
  if(!d&&entities.concepts.some(x=>x.domain==='reporting'))return'report_request';
  return'unknown';
}'''
s,n=re.subn(r'function raiDetectIntent\(text,entities\)\{.*?\n\}',lambda m:new_detect,s,count=1,flags=re.S)
if n!=1: raise SystemExit('detect intent block not found')

new_analyze=r'''function raiAnalyze(text){
  const temporal=raiParseTemporal(text),employees=raiEmployeeMentions(text),concepts=raiCollectConcepts(text),scores=raiDomainScores(text,concepts),domain=raiPrimaryDomain(scores),operation=raiOperation(text),period=raiParsePeriod(text,temporal),entities={temporal,period,employees,constraints:[],concepts,scores,domain,operation};
  entities.constraints=raiParseRosterConstraints(text,employees,temporal);
  const intent=raiDetectIntent(text,entities);
  return{raw:text,normalized:raiNorm(text),tokens:raiCanonicalTokens(text),intent,entities};
}'''
s,n=re.subn(r'function raiAnalyze\(text\)\{.*?\n\}',lambda m:new_analyze,s,count=1,flags=re.S)
if n!=1: raise SystemExit('analyze block not found')

s=s.replace("المرحلة الحالية: فهم اللغة والسياق، الأيام والتواريخ، وتصنيف طلب خطة التواجد كمسودة.","المرحلة الحالية: فهم اللغة التشغيلية، المصطلحات والمرادفات، الأخطاء الشائعة، الأيام والفترات، وتحديد نوع الطلب والمجال.")
s=s.replace("if(suggest)suggest.innerHTML=`<button class=\"mini\" onclick=\"askAssistantQuick('سوي لي مسودة خطة تواجد الأسبوع الجاي')\">مسودة تواجد الأسبوع الجاي</button><button class=\"mini\" onclick=\"askAssistantQuick('عمار ثلوث إجازة وخميس مساء')\">فهم تعليمات التواجد</button><button class=\"mini\" onclick=\"askAssistantQuick('وش تاريخ ربوع الجاي؟')\">فهم أسماء الأيام</button><button class=\"mini\" onclick=\"askAssistantQuick('خطة التوجد الاسبوع الجاي')\">تجاوز خطأ إملائي</button>`;","if(suggest)suggest.innerHTML=`<button class=\"mini\" onclick=\"askAssistantQuick('حلل مبيعات أغسطس')\">فهم تحليل المبيعات</button><button class=\"mini\" onclick=\"askAssistantQuick('وش أكثر نقص متكرر؟')\">فهم النواقص</button><button class=\"mini\" onclick=\"askAssistantQuick('وش عندي للحين ما خلص؟')\">فهم الأعمال المفتوحة</button><button class=\"mini\" onclick=\"askAssistantQuick('سوي لي مسودة خطة التوجد الأسبوع الجاي')\">فهم خطة التواجد</button>`;")
s=s.replace("if(input)input.placeholder='مثال: سوي خطة تواجد الأسبوع الجاي، عمار ثلوث إجازة';","if(input)input.placeholder='مثال: حلل مبيعات أغسطس، أو وش أكثر نقص متكرر؟';")

recognized=r'''
function raiPeriodLabel(p){
  if(!p)return'غير محددة';
  if(p.type==='month')return p.month;
  if(p.type==='last_n_months')return`آخر ${p.count} أشهر`;
  if(p.type==='date')return p.date;
  if(p.type==='range')return`${p.start} إلى ${p.end}`;
  if(p.type==='dates')return p.dates.join('، ');
  return'غير محددة';
}

function raiDomainLabel(d){return({sales:'المبيعات',shortages:'النواقص',readiness:'الجاهزية التشغيلية',actions:'الإجراءات والمتابعات',attendance:'الحضور والفريق',roster:'خطة التواجد',tasks:'تنفيذ المهام',multi:'أكثر من مجال'})[d]||'عام'}

function raiRecognizedReply(a){
  const label=RAI_INTENT_LABELS[a.intent]||a.intent,concepts=[...new Set(a.entities.concepts.filter(x=>x.domain!=='reporting').map(x=>x.concept))].slice(0,8);
  let html=`<b>فهمت طلبك: ${raiEsc(label)}.</b><div style="margin-top:7px">المجال: <b>${raiEsc(raiDomainLabel(a.entities.domain))}</b> | نوع الطلب: <b>${raiEsc(a.entities.operation)}</b></div>`;
  if(a.entities.period)html+=`<div style="margin-top:5px">الفترة: <b>${raiEsc(raiPeriodLabel(a.entities.period))}</b></div>`;
  if(concepts.length)html+=`<div class="mut" style="margin-top:6px">التفاصيل التي التقطتها: ${raiEsc(concepts.join('، '))}</div>`;
  html+='<div class="notice" style="margin-top:10px">تم بناء فهم هذا الطلب داخل ركيزة AI. ربطه بقراءة البيانات والتحليل الفعلي هو الوحدة التالية، لذلك لن أخمّن نتيجة من بيانات لم تُقرأ بعد.</div>';
  return html;
}
'''
anchor2='function raiRespond(a){'
if anchor2 not in s: raise SystemExit('respond anchor not found')
s=s.replace(anchor2,recognized+'\n'+anchor2,1)

new_respond=r'''function raiRespond(a){
  if(a.intent==='navigate_roster')return'<b>فهمت أنك تريد فتح خطة التواجد، وليس إنشاء مسودة.</b><div style="margin-top:9px"><button class="mini" onclick="openRoster()">فتح خطة التواجد</button></div>';
  if(a.intent==='roster_draft')return raiRosterReply(a);
  if(a.intent==='date_query')return raiDateReply(a);
  if(a.intent!=='unknown')return raiRecognizedReply(a);
  return raiUnknownReply(a);
}'''
s,n=re.subn(r'function raiRespond\(a\)\{.*?\n\}',lambda m:new_respond,s,count=1,flags=re.S)
if n!=1: raise SystemExit('respond block not found')

old="dictionaries:{days:RAI_DAYS,statuses:RAI_STATUS}"
new="dictionaries:{days:RAI_DAYS,statuses:RAI_STATUS,months:RAI_MONTHS,concepts:RAI_OPERATIONAL_CONCEPTS},intentLabels:RAI_INTENT_LABELS"
if old not in s: raise SystemExit('dictionary export not found')
s=s.replace(old,new,1)

p.write_text(s,encoding='utf-8')
