(()=>{
'use strict';

const RAI_VERSION='0.2.0';
const RAI_NAME='ركيزة AI';
const RAI_STATE={
  initialized:false,
  history:[],
  context:{intent:null,entities:{},lastMessage:''},
  pendingDraft:null
};

const RAI_DAYS=[
  {index:0,name:'الأحد',aliases:['الاحد','احد','الأحد']},
  {index:1,name:'الاثنين',aliases:['الاثنين','اثنين','الإثنين']},
  {index:2,name:'الثلاثاء',aliases:['الثلاثاء','الثلاثا','ثلاثاء','ثلاثا','ثلوث','ثلثاء']},
  {index:3,name:'الأربعاء',aliases:['الاربعاء','الأربعاء','اربعاء','أربعاء','ربوع']},
  {index:4,name:'الخميس',aliases:['الخميس','خميس']},
  {index:5,name:'الجمعة',aliases:['الجمعه','الجمعة','جمعه','جمعة']},
  {index:6,name:'السبت',aliases:['السبت','سبت']}
];

const RAI_STATUS=[
  {value:'Morning',label:'صباحي',aliases:['صباح','صباحي','الصباح','صبحي']},
  {value:'Evening',label:'مسائي',aliases:['مساء','مسائي','المساء']},
  {value:'D/O',label:'إجازة أسبوعية',aliases:['اجازه','اجازة','إجازة','اوف','off','d/o','راحه','راحة']},
  {value:'A/L',label:'إجازة سنوية',aliases:['سنويه','سنوية','سنوي','a/l','annual']},
  {value:'S/L',label:'إجازة مرضية',aliases:['سكليف','مرضي','مرضيه','مرضية','s/l','sick']},
  {value:'تعويضي',label:'تعويضي',aliases:['تعويضي','تعويض']},
  {value:'مهمة عمل',label:'مهمة عمل',aliases:['مهمه عمل','مهمة عمل','مهمه','مهمة']}
];

const RAI_DOMAIN_WORDS={
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
};

function raiDigits(v){
  return String(v??'')
    .replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
}

function raiNorm(v){
  return raiDigits(v)
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g,'')
    .replace(/ـ/g,'')
    .replace(/[أإآٱ]/g,'ا')
    .replace(/ى/g,'ي')
    .replace(/ة/g,'ه')
    .replace(/ؤ/g,'و')
    .replace(/ئ/g,'ي')
    .replace(/[،,:;؛!?؟.()\[\]{}"']/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}

function raiEsc(v){
  if(typeof esc==='function')return esc(String(v??''));
  return String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
}

function raiDistance(a,b){
  a=String(a||'');b=String(b||'');
  if(a===b)return 0;
  if(!a.length)return b.length;if(!b.length)return a.length;
  const prev=Array.from({length:b.length+1},(_,i)=>i),cur=new Array(b.length+1);
  for(let i=1;i<=a.length;i++){
    cur[0]=i;
    for(let j=1;j<=b.length;j++)cur[j]=Math.min(cur[j-1]+1,prev[j]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));
    for(let j=0;j<=b.length;j++)prev[j]=cur[j];
  }
  return prev[b.length];
}

function raiCloseToken(token,target){
  token=raiNorm(token);target=raiNorm(target);
  if(token===target)return true;
  if(token.length<4||target.length<4)return false;
  const max=Math.max(token.length,target.length);
  const allowed=max>=8?2:1;
  return raiDistance(token,target)<=allowed;
}

function raiCanonicalTokens(text){
  const raw=raiNorm(text).split(' ').filter(Boolean),out=[];
  for(const token of raw){
    let canonical=token;
    outer:for(const [key,aliases] of Object.entries(RAI_DOMAIN_WORDS)){
      for(const a of aliases){
        const na=raiNorm(a);
        if(token===na||raiCloseToken(token,na)){canonical=raiNorm(key);break outer}
      }
    }
    out.push(canonical);
  }
  return out;
}

function raiHas(text,words){
  const n=raiNorm(text),tokens=raiCanonicalTokens(text);
  return words.some(w=>{
    const nw=raiNorm(w);
    return n.includes(nw)||tokens.includes(nw);
  });
}

function raiBaseDate(){
  return String(window.app?.calendarDate||window.app?.date||new Date().toISOString().slice(0,10)).slice(0,10);
}

function raiDateObj(iso){return new Date(String(iso)+'T12:00:00')}
function raiIso(d){return d.toISOString().slice(0,10)}
function raiAddDays(iso,n){const d=raiDateObj(iso);d.setDate(d.getDate()+n);return raiIso(d)}
function raiSunday(iso){const d=raiDateObj(iso);d.setDate(d.getDate()-d.getDay());return raiIso(d)}
function raiWeekDates(start){return Array.from({length:7},(_,i)=>raiAddDays(start,i))}

function raiWeekScope(text){
  const t=raiNorm(text);
  if(/(?:الاسبوع|اسبوع)\s*(?:الجاي|القادم|المقبل)|(?:الجاي|القادم|المقبل)\s*(?:الاسبوع|اسبوع)/.test(t))return'next';
  if(/(?:الاسبوع|اسبوع)\s*(?:الماضي|السابق|اللي فات|الفايت)|(?:الماضي|السابق)\s*(?:الاسبوع|اسبوع)/.test(t))return'previous';
  if(/(?:هذا|هال)\s*(?:الاسبوع|اسبوع)|(?:الاسبوع|اسبوع)\s*(?:هذا|الحالي)/.test(t))return'current';
  return null;
}

function raiWeekStart(scope){
  const cur=raiSunday(raiBaseDate());
  if(scope==='next')return raiAddDays(cur,7);
  if(scope==='previous')return raiAddDays(cur,-7);
  return cur;
}

function raiWordsWithPositions(text){
  const n=raiNorm(text),out=[];let m;
  const re=/\S+/g;
  while((m=re.exec(n)))out.push({word:m[0],start:m.index,end:m.index+m[0].length});
  return{normalized:n,tokens:out};
}

function raiMatchDayToken(token){
  for(const day of RAI_DAYS){
    for(const alias of day.aliases){if(raiCloseToken(token,alias))return day}
  }
  return null;
}

function raiDayMentions(text){
  const {normalized,tokens}=raiWordsWithPositions(text),out=[];
  for(const tk of tokens){const day=raiMatchDayToken(tk.word);if(day)out.push({...day,start:tk.start,end:tk.end,matched:tk.word})}
  return{normalized,mentions:out};
}

function raiStatusIn(text){
  const n=raiNorm(text),tokens=n.split(' ').filter(Boolean);
  for(const st of RAI_STATUS){
    for(const alias of st.aliases){
      const a=raiNorm(alias);
      if(n.includes(a))return st;
      if(tokens.some(t=>raiCloseToken(t,a)))return st;
    }
  }
  return null;
}

function raiResolveDayDate(day,text,scope=null){
  const base=raiBaseDate();
  if(scope){return raiWeekDates(raiWeekStart(scope))[day.index]}
  const n=raiNorm(text);
  const strictFuture=/(الجاي|القادم|المقبل)/.test(n);
  const d=raiDateObj(base),delta=(day.index-d.getDay()+7)%7;
  return raiAddDays(base,delta===0&&strictFuture?7:delta);
}

function raiExplicitDate(text){
  const t=raiDigits(text),base=raiDateObj(raiBaseDate());
  let m=t.match(/\b(20\d{2})[-\/.](\d{1,2})[-\/.](\d{1,2})\b/);
  if(m)return`${m[1]}-${String(Number(m[2])).padStart(2,'0')}-${String(Number(m[3])).padStart(2,'0')}`;
  m=t.match(/\b(\d{1,2})[-\/](\d{1,2})(?:[-\/](20\d{2}|\d{2}))?\b/);
  if(m){let y=m[3]?Number(m[3]):base.getFullYear();if(y<100)y+=2000;return`${y}-${String(Number(m[2])).padStart(2,'0')}-${String(Number(m[1])).padStart(2,'0')}`}
  return null;
}

function raiRelativeDate(text){
  const n=raiNorm(text),base=raiBaseDate();
  if(/بعد\s*(?:بكره|بكرة|غدا)/.test(n))return raiAddDays(base,2);
  if(/اول\s*امس/.test(n))return raiAddDays(base,-2);
  if(/\b(?:بكره|بكرة|غدا)\b/.test(n))return raiAddDays(base,1);
  if(/\b(?:امس|البارح)\b/.test(n))return raiAddDays(base,-1);
  if(/\bاليوم\b/.test(n))return base;
  return null;
}

function raiParseTemporal(text){
  const explicit=raiExplicitDate(text);if(explicit)return{type:'date',date:explicit,label:explicit};
  const rel=raiRelativeDate(text);if(rel)return{type:'date',date:rel,label:rel};
  const scope=raiWeekScope(text),dm=raiDayMentions(text).mentions;
  if(dm.length)return{type:'weekday',scope,days:dm.map(d=>({...d,date:raiResolveDayDate(d,text,scope)}))};
  if(scope){const start=raiWeekStart(scope);return{type:'week',scope,start,end:raiAddDays(start,6)}};
  return null;
}

function raiEmployeeMentions(text){
  const n=raiNorm(text),emps=(window.app?.employees||[]).filter(e=>e.active!==false),candidates=[];
  for(const e of emps){
    const full=raiNorm(e.full_name||''),parts=full.split(' ').filter(Boolean),aliases=[full,parts.slice(0,2).join(' '),parts[0]].filter(x=>x&&x.length>=2);
    let best=null;
    for(const alias of [...new Set(aliases)]){
      const re=new RegExp(`(^|\\s)${alias.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}(?=\\s|$)`);
      const m=n.match(re);if(m){const start=(m.index||0)+m[1].length;if(!best||alias.length>best.alias.length)best={employee:e,alias,start,end:start+alias.length,confidence:'exact'}}
    }
    if(best)candidates.push(best);
  }
  if(!candidates.length){
    const words=n.split(' ').filter(x=>x.length>=4);
    for(const w of words){
      const matched=emps.filter(e=>raiCloseToken(w,raiNorm(e.full_name||'').split(' ')[0]||''));
      if(matched.length===1)candidates.push({employee:matched[0],alias:w,start:n.indexOf(w),end:n.indexOf(w)+w.length,confidence:'fuzzy'});
    }
  }
  candidates.sort((a,b)=>a.start-b.start||(b.alias.length-a.alias.length));
  const out=[];for(const c of candidates)if(!out.some(x=>c.start<x.end&&c.end>x.start))out.push(c);
  return out;
}

function raiParseRosterConstraints(text,employees,temporal){
  const {normalized}=raiWordsWithPositions(text),days=raiDayMentions(text).mentions,rows=[];
  const emps=employees.length?employees:(RAI_STATE.context.intent==='roster_draft'?(RAI_STATE.context.entities.employees||[]):[]);
  for(let ei=0;ei<emps.length;ei++){
    const emp=emps[ei],segStart=employees.length?emp.end:0,segEnd=employees.length&&ei+1<emps.length?employees[ei+1].start:normalized.length,seg=normalized.slice(segStart,segEnd);
    const localDays=raiDayMentions(seg).mentions;
    for(let i=0;i<localDays.length;i++){
      const d=localDays[i],end=i+1<localDays.length?localDays[i+1].start:seg.length,after=seg.slice(d.end,end),status=raiStatusIn(after),scope=raiWeekScope(text)||(temporal?.scope||'next');
      rows.push({employee:emp.employee,day:d.name,dayIndex:d.index,date:raiResolveDayDate(d,text,scope),status:status?.value||null,statusLabel:status?.label||null});
    }
  }
  if(!rows.length&&employees.length===1&&days.length){
    for(let i=0;i<days.length;i++){
      const d=days[i],end=i+1<days.length?days[i+1].start:normalized.length,status=raiStatusIn(normalized.slice(d.end,end)),scope=raiWeekScope(text)||(temporal?.scope||'next');
      rows.push({employee:employees[0].employee,day:d.name,dayIndex:d.index,date:raiResolveDayDate(d,text,scope),status:status?.value||null,statusLabel:status?.label||null});
    }
  }
  return rows;
}


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

function raiDetectIntent(text,entities){
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
}

function raiAnalyze(text){
  const temporal=raiParseTemporal(text),employees=raiEmployeeMentions(text),concepts=raiCollectConcepts(text),scores=raiDomainScores(text,concepts),domain=raiPrimaryDomain(scores),operation=raiOperation(text),period=raiParsePeriod(text,temporal),entities={temporal,period,employees,constraints:[],concepts,scores,domain,operation};
  entities.constraints=raiParseRosterConstraints(text,employees,temporal);
  const intent=raiDetectIntent(text,entities);
  return{raw:text,normalized:raiNorm(text),tokens:raiCanonicalTokens(text),intent,entities};
}

function raiAdd(role,html){
  const c=document.getElementById('assistantChat');if(!c)return;
  const mine=role==='user';
  c.insertAdjacentHTML('beforeend',`<div style="display:flex;justify-content:${mine?'flex-start':'flex-end'}"><div class="task" style="max-width:88%;margin:0;background:${mine?'#eef3f8':'#fff'};border-color:${mine?'#d6e0ea':'#e3e7ec'}">${html}</div></div>`);
  c.lastElementChild?.scrollIntoView({behavior:'smooth',block:'nearest'});
}

function raiInitUi(){
  const sec=document.getElementById('assistant');if(!sec)return;
  const brand=sec.querySelector('.top .brand'),sub=sec.querySelector('.top .sub'),notice=sec.querySelector('.notice'),suggest=document.getElementById('assistantSuggestions'),input=document.getElementById('assistantInput');
  if(brand)brand.textContent='ركيزة AI ✦';
  if(sub)sub.textContent='محرك ركيزة الداخلي — بدون API خارجي';
  if(notice)notice.innerHTML='<b>ركيزة AI يعمل من داخل ركيزة.</b><div style="margin-top:5px">المرحلة الحالية: فهم اللغة التشغيلية، المصطلحات والمرادفات، الأخطاء الشائعة، الأيام والفترات، وتحديد نوع الطلب والمجال. لن يتم حفظ أي تغيير تشغيلي دون اعتمادك.</div>';
  if(suggest)suggest.innerHTML=`<button class="mini" onclick="askAssistantQuick('حلل مبيعات أغسطس')">فهم تحليل المبيعات</button><button class="mini" onclick="askAssistantQuick('وش أكثر نقص متكرر؟')">فهم النواقص</button><button class="mini" onclick="askAssistantQuick('وش عندي للحين ما خلص؟')">فهم الأعمال المفتوحة</button><button class="mini" onclick="askAssistantQuick('سوي لي مسودة خطة التوجد الأسبوع الجاي')">فهم خطة التواجد</button>`;
  if(input)input.placeholder='مثال: حلل مبيعات أغسطس، أو وش أكثر نقص متكرر؟';
}

function raiInit(){
  raiInitUi();
  if(RAI_STATE.initialized)return;
  RAI_STATE.initialized=true;
  raiAdd('assistant',`<b>${RAI_NAME} جاهز.</b><div class="mut" style="margin-top:6px">أنا الآن أعمل بمحرك ركيزة الداخلي. لا أرسل طلبك إلى OpenAI أو أي نموذج خارجي. اكتب بطريقتك الطبيعية.</div>`);
}

function raiTemporalLabel(t){
  if(!t)return'غير محدد';
  if(t.type==='date')return t.date;
  if(t.type==='week')return`${t.start} إلى ${t.end}`;
  if(t.type==='weekday')return t.days.map(d=>`${d.name} (${d.date})`).join('، ');
  return'غير محدد';
}

function raiRosterReply(a){
  const t=a.entities.temporal,scope=t?.scope||'next',start=raiWeekStart(scope),end=raiAddDays(start,6),constraints=a.entities.constraints;
  RAI_STATE.pendingDraft={type:'roster',week_start:start,week_end:end,constraints,created_at:new Date().toISOString()};
  let html=`<b>فهمت الطلب كمسودة خطة تواجد.</b><div style="margin-top:7px">الفترة: <b>${start}</b> إلى <b>${end}</b></div>`;
  if(constraints.length){html+='<div style="margin-top:9px"><b>التعليمات التي فهمتها:</b><br>'+constraints.map(c=>`${raiEsc(c.employee.full_name)} — ${c.day} ${c.date}${c.statusLabel?` — <b>${raiEsc(c.statusLabel)}</b>`:' — الحالة غير محددة'}`).join('<br>')+'</div>'}
  else html+='<div class="mut" style="margin-top:8px">لم تذكر قيودًا على موظفين أو أيام، لذلك سجلت المقصود كطلب مسودة فقط. منطق توزيع الفريق نفسه سنبنيه في وحدة التخطيط التالية.</div>';
  html+='<div class="notice" style="margin-top:10px">هذه مسودة فهم فقط ولم يتم حفظ أو تعديل خطة التواجد.</div>';
  return html;
}

function raiDateReply(a){
  const t=a.entities.temporal;if(!t)return'لم أستطع تحديد التاريخ المقصود.';
  if(t.type==='weekday'&&t.days.length){const d=t.days[0];return`المقصود <b>${d.name}</b>، وتاريخه حسب السياق الحالي هو <b>${d.date}</b>.`}
  if(t.type==='date')return`التاريخ المقصود هو <b>${t.date}</b> (${raiEsc(new Intl.DateTimeFormat('ar-SA',{weekday:'long'}).format(raiDateObj(t.date)))})`;
  if(t.type==='week')return`الفترة المقصودة من <b>${t.start}</b> إلى <b>${t.end}</b>.`;
  return`فهمت الفترة: ${raiTemporalLabel(t)}`;
}

function raiUnknownReply(a){
  const detected=[];
  if(a.entities.temporal)detected.push(`الوقت/التاريخ: ${raiTemporalLabel(a.entities.temporal)}`);
  if(a.entities.employees.length)detected.push(`الموظف: ${a.entities.employees.map(x=>x.employee.full_name).join('، ')}`);
  return `<b>فهمت النص لغويًا، لكن القدرة التشغيلية لهذا النوع لم نبنها بعد.</b>${detected.length?`<div class="mut" style="margin-top:7px">التقطت: ${raiEsc(detected.join(' | '))}</div>`:''}<div class="mut" style="margin-top:7px">نبني قدرات ركيزة AI واحدة واحدة حتى لا يتصرف باجتهاد غير معتمد.</div>`;
}


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

function raiRespond(a){
  if(a.intent==='navigate_roster')return'<b>فهمت أنك تريد فتح خطة التواجد، وليس إنشاء مسودة.</b><div style="margin-top:9px"><button class="mini" onclick="openRoster()">فتح خطة التواجد</button></div>';
  if(a.intent==='roster_draft')return raiRosterReply(a);
  if(a.intent==='date_query')return raiDateReply(a);
  if(a.intent!=='unknown')return raiRecognizedReply(a);
  return raiUnknownReply(a);
}

window.openAssistant=function(){
  show('assistant');raiInit();setTimeout(()=>document.getElementById('assistantInput')?.focus(),50);
};
window.askAssistantQuick=function(q){const i=document.getElementById('assistantInput');if(i)i.value=q;window.askRakizaAssistant()};
window.askRakizaAssistant=function(){
  raiInit();const inp=document.getElementById('assistantInput'),q=inp?.value.trim();if(!q)return;if(inp)inp.value='';
  raiAdd('user',raiEsc(q));
  try{
    const a=raiAnalyze(q),reply=raiRespond(a);
    RAI_STATE.history.push({role:'user',text:q,analysis:a},{role:'assistant',intent:a.intent});
    RAI_STATE.context={intent:a.intent,entities:a.entities,lastMessage:q};
    raiAdd('assistant',reply);
  }catch(e){raiAdd('assistant',`<div class="notice err">تعذر فهم الطلب: ${raiEsc(e.message||String(e))}</div>`)}
};

window.RakizaAI={
  version:RAI_VERSION,
  analyze:raiAnalyze,
  normalize:raiNorm,
  parseTemporal:raiParseTemporal,
  state:RAI_STATE,
  dictionaries:{days:RAI_DAYS,statuses:RAI_STATUS,months:RAI_MONTHS,concepts:RAI_OPERATIONAL_CONCEPTS},intentLabels:RAI_INTENT_LABELS
};

raiInitUi();
})();
