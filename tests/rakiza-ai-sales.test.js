global.window={RakizaAI:{normalize:null,state:{context:{entities:{}}},analyze:(q)=>({entities:{domain:/مبيعات|تارقت|تارجت|مستهدف|تحقيق|atv|upt|فواتير|زوار|نسبة التحويل/i.test(q)?'sales':null}})}};
global.app={calendarDate:'2026-09-13',date:'2026-09-13',monthlyTarget:3000,recent:[
{work_date:'2026-08-01',daily_sales:80,daily_target:100,monthly_target_snapshot:3100,status:'مغلق'},
{work_date:'2026-08-02',daily_sales:120,daily_target:100,monthly_target_snapshot:3100,status:'مغلق'},
{work_date:'2026-08-04',daily_sales:200,daily_target:150,monthly_target_snapshot:3100,status:'مغلق'},
{work_date:'2026-09-01',daily_sales:100,daily_target:100,monthly_target_snapshot:3000,status:'مغلق'},
{work_date:'2026-09-02',daily_sales:120,daily_target:100,monthly_target_snapshot:3000,status:'مغلق'},
{work_date:'2026-09-03',daily_sales:80,daily_target:100,monthly_target_snapshot:3000,status:'مغلق'},
{work_date:'2026-09-04',daily_sales:150,daily_target:100,monthly_target_snapshot:3000,status:'مغلق'},
{work_date:'2026-09-08',daily_sales:90,daily_target:100,monthly_target_snapshot:3000,status:'مغلق'},
{work_date:'2026-09-12',daily_sales:160,daily_target:120,monthly_target_snapshot:3000,status:'مغلق'}],day:{work_date:'2026-09-13',status:'مفتوح',daily_target:100}};
const els={assistantInput:{value:''},assistantChat:{html:'',insertAdjacentHTML(_p,h){this.html+=h},lastElementChild:{scrollIntoView(){}}}};
global.document={getElementById:id=>els[id]||null};
global.api=async(name,o)=>{if(name!=='targets-month')return null;const k=o.q.month.slice(0,7),total=k==='2026-08'?3100:3000,days=k==='2026-08'?31:30;return{month:o.q.month,total_basic:total,rows:Array.from({length:days},(_,i)=>({target_date:`${k}-${String(i+1).padStart(2,'0')}`,basic_target:i===11&&k==='2026-09'?120:100,challenge_target:120}))}};
window.api=global.api;window.askRakizaAssistant=async()=>{};
require('../rakiza-ai-sales.js');
const S=window.RakizaAI.sales;let pass=0;
function ok(c,m,g){if(!c){console.error('FAIL',m,g||'');process.exit(1)}pass++}
function sp(q,p){const x=S.detectSpec(q,{});ok(p(x),q,x);return x}
function per(q,p){const x=S.detectPeriod(q);ok(p(x),q,x);return x}
function rt(q,e,a={}){const x=S.isSalesLanguage(q,a);ok(x===e,q,x)}

// Core language + metrics
sp('كم مبيعات سبتمبر؟',x=>x.metric==='sales'&&x.period.month==='2026-09');
sp('كم البيع هذا الشهر',x=>x.metric==='sales'&&x.period.month==='2026-09');
sp('وش بعنا هالشهر',x=>x.metric==='sales'&&x.period.month==='2026-09');
sp('كم مبيعت سبتمبر',x=>x.metric==='sales');
sp('كم تارقت سبتمبر',x=>x.metric==='target');
sp('وش مستهدف الشهر',x=>x.metric==='target');
sp('كم باقي على تارقت سبتمبر؟',x=>x.metric==='gap');
sp('وش العجز عن المستهدف',x=>x.metric==='gap');
sp('حققنا كم من تارقت سبتمبر؟',x=>x.metric==='achievement');
sp('كم نسبة التحقيق',x=>x.metric==='achievement');
sp('هل احنا فوق المستهدف حتى الآن في سبتمبر؟',x=>x.metric==='variance_to_date');
sp('المستهدف حتى اليوم كم',x=>x.metric==='target_to_date');
sp('متوسط مبيعات سبتمبر',x=>x.metric==='average');
sp('كم يوم حققنا التارقت في سبتمبر؟',x=>x.metric==='days_hit');
sp('كم يوم ما حققنا التارقت في سبتمبر؟',x=>x.metric==='days_missed');

// Ranking / analysis / export
sp('أفضل يوم مبيعات سبتمبر',x=>x.task==='rank'&&x.rank.direction==='desc'&&x.metric==='sales');
sp('أعلى يوم بيع هذا الشهر',x=>x.task==='rank'&&x.rank.direction==='desc');
sp('أسوأ يوم تحقيق سبتمبر',x=>x.task==='rank'&&x.rank.direction==='asc'&&x.metric==='achievement');
sp('أقل يوم مبيعات',x=>x.task==='rank'&&x.rank.direction==='asc');
sp('حلل مبيعات سبتمبر',x=>x.task==='analysis');
sp('وش وضع المبيعات هذا الشهر',x=>x.task==='analysis');
sp('صدر لي مبيعات سبتمبر اكسل',x=>x.task==='export');
S.state.last={spec:{task:'analysis',metric:'sales',period:{type:'month',month:'2026-09',label:'سبتمبر'}}};window.RakizaAI.state.context={entities:{domain:'sales'}};
sp('طيب صدرها',x=>x.task==='export');

// Periods
per('سبتمبر',x=>x?.type==='month'&&x.month==='2026-09');
per('أغسطس 2025',x=>x?.month==='2025-08');
per('قارن أغسطس 2025 بأغسطس 2026',x=>x?.type==='compare'&&x.periods[0].month==='2025-08'&&x.periods[1].month==='2026-08');
per('هذا الشهر',x=>x?.month==='2026-09');
per('من بداية الشهر',x=>x?.month==='2026-09');
per('الشهر الماضي',x=>x?.month==='2026-08');
per('هذا الأسبوع',x=>x?.type==='range'&&x.start==='2026-09-13');
per('الأسبوع الماضي',x=>x?.type==='range'&&x.start==='2026-09-06');
per('آخر 7 أيام',x=>x?.type==='range'&&x.start==='2026-09-07');
per('أمس',x=>x?.type==='date'&&x.date==='2026-09-12');
per('البارح',x=>x?.type==='date'&&x.date==='2026-09-12');
per('ثلوث',x=>x?.type==='date'&&x.date==='2026-09-08');
per('ربوع',x=>x?.type==='date'&&x.date==='2026-09-09');
per('الجمعة الماضية',x=>x?.type==='date'&&x.date==='2026-09-11');
per('الثلاثاء الجاي',x=>x?.type==='date'&&x.date==='2026-09-15');
per('قارن هذا الشهر بالشهر الماضي',x=>x?.type==='compare');
per('قارن هذا الأسبوع بالأسبوع الماضي',x=>x?.type==='compare');

// Router safeguards
rt('كم مبيعات اليوم؟',true);
rt('وش ناقص عن التارقت؟',true);
rt('كم ATV هذا الشهر',true);
rt('كم عدد الفواتير',true);
rt('مين ناقص من الفريق اليوم؟',false);
rt('وش ناقص في الجاهزية؟',false);
rt('وش ناقص من مهام اليوم؟',false);
rt('وش عندنا نواقص فاخر؟',false);
rt('كم إجراءات الصيانة؟',false);
rt('وش النواقص اللي أثرت على المبيعات؟',false,{entities:{domain:'multi'}});

// Unsupported metrics are recognized, not hallucinated
sp('ATV سبتمبر',x=>x.metric==='unsupported:atv');
sp('UPT سبتمبر',x=>x.metric==='unsupported:upt');
sp('كم عدد الفواتير سبتمبر',x=>x.metric==='unsupported:transactions');
sp('كم زائر هذا الشهر',x=>x.metric==='unsupported:visitors');
sp('نسبة التحويل هذا الشهر',x=>x.metric==='unsupported:conversion');

// Context
S.state.last={spec:{task:'metric',metric:'sales',period:{type:'month',month:'2026-09',label:'سبتمبر'}}};window.RakizaAI.state.context={entities:{domain:'sales'}};
sp('طيب كم النسبة؟',x=>x.period?.month==='2026-09'&&x.metric==='achievement');
S.state.last={spec:{task:'analysis',metric:'sales',period:{type:'month',month:'2026-09',label:'سبتمبر'}}};
sp('طيب الشهر الماضي؟',x=>x.period?.month==='2026-08'&&x.task==='analysis');
S.state.last={spec:{task:'metric',metric:'achievement',period:{type:'month',month:'2026-08',label:'أغسطس'}}};
sp('والشهر اللي قبله؟',x=>x.period?.month==='2026-07'&&x.metric==='achievement');
S.state.last={spec:{task:'metric',metric:'sales',period:{type:'month',month:'2026-09',label:'سبتمبر'}}};
sp('قارنها بأغسطس',x=>x.task==='compare'&&x.period?.type==='compare'&&x.period.periods.length===2);

// End to end
(async()=>{
S.state.last=null;window.RakizaAI.state.context={entities:{}};
let h=await S.answer('كم مبيعات سبتمبر؟',{});ok(/700/.test(h),'September sales = 700',h);
h=await S.answer('كم باقي على تارقت سبتمبر؟',{});ok(/2,300/.test(h),'September gap = 2300',h);
h=await S.answer('حققنا كم من تارقت سبتمبر؟',{});ok(/23\.3%/.test(h),'September monthly achievement',h);
h=await S.answer('هل احنا فوق المستهدف حتى الآن في سبتمبر؟',{});ok(/520/.test(h)&&/تحت/.test(h),'to-date variance -520',h);
h=await S.answer('المستهدف حتى اليوم كم',{});ok(/1,220/.test(h),'target to last recorded date 1220',h);
h=await S.answer('متوسط مبيعات سبتمبر',{});ok(/116\.67/.test(h),'average sales',h);
h=await S.answer('كم يوم حققنا التارقت في سبتمبر؟',{});ok(/4/.test(h),'hit days = 4',h);
h=await S.answer('كم يوم ما حققنا التارقت في سبتمبر؟',{});ok(/2/.test(h),'miss days = 2',h);
h=await S.answer('أفضل يوم مبيعات سبتمبر',{});ok(/2026-09-12/.test(h)&&/160/.test(h),'best sales day',h);
h=await S.answer('أسوأ يوم تحقيق سبتمبر',{});ok(/2026-09-03/.test(h)&&/80\.0%/.test(h),'worst achievement day',h);
h=await S.answer('مبيعات ثلوث',{});ok(/90/.test(h),'Saudi weekday slang returns Sep 8 sales',h);
h=await S.answer('مبيعات اليوم',{});ok(/لا توجد مبيعات/.test(h)&&/إغلاق اليوم/.test(h),'open day not treated as zero',h);
h=await S.answer('ATV سبتمبر',{});ok(/غير متاح/.test(h)&&/لن يخمّن/.test(h),'unsupported metric transparent',h);
h=await S.answer('صدر لي مبيعات سبتمبر اكسل',{});ok(/لم نعتمد قالب Excel/.test(h),'no unapproved Excel format',h);
h=await S.answer('قارن أغسطس بسبتمبر',{});ok(/مقارنة المبيعات/.test(h)&&/400/.test(h)&&/700/.test(h),'month comparison',h);
h=await S.answer('حلل مبيعات سبتمبر',{});ok(/تحليل المبيعات/.test(h)&&/أفضل يوم مبيعات/.test(h)&&/وصف للبيانات وليس تفسيرًا/.test(h),'analysis is descriptive not causal',h);
console.log('Rakiza AI sales tests passed:',pass);
})().catch(e=>{console.error(e);process.exit(1)});
