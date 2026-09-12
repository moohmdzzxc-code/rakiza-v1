global.window={RakizaAI:{state:{context:{}},analyze:q=>({entities:{domain:/جاهزي|غير جاهز|بند حرج|مشكله تشغيليه/.test(q)?'readiness':null}})}};
const items=[
{id:'i1',category_name_ar:'النظافة والجاهزية العامة',item_name_ar:'صالة',weight:3,critical:false},{id:'i2',category_name_ar:'النظافة والجاهزية العامة',item_name_ar:'واجهات',weight:2,critical:false},{id:'i3',category_name_ar:'النظافة والجاهزية العامة',item_name_ar:'كاشير',weight:2,critical:false},{id:'i4',category_name_ar:'النظافة والجاهزية العامة',item_name_ar:'منتجات العرض',weight:2,critical:false},{id:'i5',category_name_ar:'النظافة والجاهزية العامة',item_name_ar:'غرف القياس',weight:2,critical:false},{id:'i6',category_name_ar:'النظافة والجاهزية العامة',item_name_ar:'المستودع',weight:2,critical:false},{id:'i7',category_name_ar:'النظافة والجاهزية العامة',item_name_ar:'المدخل',weight:2,critical:false},
{id:'i8',category_name_ar:'المعروضات',item_name_ar:'اكتمال المعروضات',weight:7,critical:false},{id:'i9',category_name_ar:'المعروضات',item_name_ar:'ترتيب المعروضات',weight:5,critical:false},{id:'i10',category_name_ar:'المعروضات',item_name_ar:'حسب الفئات',weight:4,critical:false},{id:'i11',category_name_ar:'المعروضات',item_name_ar:'حسب المقاسات',weight:4,critical:false},
{id:'i12',category_name_ar:'جاهزية النقدية',item_name_ar:'فئات الصرف',weight:7,critical:true},{id:'i13',category_name_ar:'جاهزية النقدية',item_name_ar:'مبلغ الصرف',weight:4,critical:false},{id:'i14',category_name_ar:'جاهزية النقدية',item_name_ar:'الإيداع النقدي',weight:4,critical:false},
{id:'i15',category_name_ar:'الأجهزة والأنظمة',item_name_ar:'الكمبيوتر',weight:5,critical:false},{id:'i16',category_name_ar:'الأجهزة والأنظمة',item_name_ar:'برنامج البيع',weight:5,critical:true},{id:'i17',category_name_ar:'الأجهزة والأنظمة',item_name_ar:'نقاط البيع',weight:5,critical:false},{id:'i18',category_name_ar:'الأجهزة والأنظمة',item_name_ar:'الشبكة',weight:5,critical:false},
{id:'i19',category_name_ar:'مستلزمات التشغيل',item_name_ar:'أكياس',weight:3,critical:false},{id:'i20',category_name_ar:'مستلزمات التشغيل',item_name_ar:'رول فواتير',weight:3,critical:false},{id:'i21',category_name_ar:'مستلزمات التشغيل',item_name_ar:'أوراق طباعة',weight:2,critical:false},{id:'i22',category_name_ar:'مستلزمات التشغيل',item_name_ar:'حبر',weight:1,critical:false},{id:'i23',category_name_ar:'مستلزمات التشغيل',item_name_ar:'سلات',weight:1,critical:false},
{id:'i24',category_name_ar:'مرافق وصيانة',item_name_ar:'إنارة داخلية',weight:2,critical:false},{id:'i25',category_name_ar:'مرافق وصيانة',item_name_ar:'خارجية ولوحة',weight:2,critical:false},{id:'i26',category_name_ar:'مرافق وصيانة',item_name_ar:'مكيفات',weight:3,critical:false},{id:'i27',category_name_ar:'مرافق وصيانة',item_name_ar:'باب',weight:2,critical:false},{id:'i28',category_name_ar:'مرافق وصيانة',item_name_ar:'أقسام بحاجة لصيانة',weight:1,critical:false},
{id:'i29',category_name_ar:'السلامة التشغيلية',item_name_ar:'مخارج طوارئ',weight:3,critical:true},{id:'i30',category_name_ar:'السلامة التشغيلية',item_name_ar:'طفايات',weight:3,critical:false},{id:'i31',category_name_ar:'السلامة التشغيلية',item_name_ar:'لا مخاطر بارزة',weight:2,critical:false},{id:'i32',category_name_ar:'السلامة التشغيلية',item_name_ar:'إسعافات أولية',weight:2,critical:false}
];
const dates=['2026-08-31','2026-09-07','2026-09-08','2026-09-09','2026-09-10','2026-09-11','2026-09-12','2026-09-13'];
const failMap={
'2026-08-31':[['i18','يحتاج متابعة','ضعف الشبكة']],
'2026-09-07':[['i18','يحتاج متابعة','الشبكة متقطعة'],['i19','عولج فورًا','نقص أكياس'],['i29','يحتاج متابعة','مخرج محجوب']],
'2026-09-08':[['i20','عولج فورًا','رول ناقص']],
'2026-09-09':[['i8','يحتاج متابعة','نقص معروض'],['i18','يحتاج متابعة','الشبكة']],
'2026-09-10':[],
'2026-09-11':[['i9','يحتاج متابعة','الترتيب'],['i12','يحتاج متابعة','فئات صرف ناقصة'],['i26','يحتاج متابعة','مكيف']],
'2026-09-12':[['i16','يحتاج متابعة','برنامج البيع متوقف']],
'2026-09-13':[['i19','عولج فورًا','تم توفير الأكياس']]
};
function makeChecks(date){const fails=new Map((failMap[date]||[]).map(x=>[x[0],x]));return items.map(i=>{const f=fails.get(i.id);return{item_id:i.id,readiness_status:f?'غير جاهز':'جاهز',resolution_status:f?f[1]:'',note:f?f[2]:'',action_text:'',opening_check_items:i}})}
const scoreByDate={};for(const d of dates){scoreByDate[d]=makeChecks(d).reduce((s,c)=>s+(c.readiness_status==='جاهز'?c.opening_check_items.weight:0),0)}
const recent=dates.map((d,i)=>({id:'d'+i,work_date:d,operational_readiness:scoreByDate[d],status:'مغلق'}));
global.app={calendarDate:'2026-09-13',date:'2026-09-13',items,recent,day:{...recent[recent.length-1],status:'مفتوح'},checks:makeChecks('2026-09-13')};
const details=new Map(recent.map(r=>[r.id,{day:r,checks:makeChecks(r.work_date),attendance:[],roster_changes:[]}]))
global.api=async(name,o)=>{if(name==='day')return details.get(o.q.id);throw Error('unexpected api '+name)};window.api=global.api;
const els={assistantInput:{value:''},assistantChat:{html:'',insertAdjacentHTML(_p,h){this.html+=h},lastElementChild:{scrollIntoView(){}}}};global.document={getElementById:id=>els[id]||null};window.askRakizaAssistant=async()=>{els.assistantChat.html+='BASE'};
require('../rakiza-ai-readiness.js');
const R=window.RakizaAI.readiness;let pass=0;
function ok(c,m,g){if(!c){console.error('FAIL',m,g||'');process.exit(1)}pass++}
function sp(q,p){const x=R.detectSpec(q,{});ok(p(x),q,x);return x}
function rt(q,e){const x=R.isReadinessLanguage(q,{});ok(x===e,q,x)}
function per(q,p){const x=R.detectPeriod(q);ok(p(x),q,x);return x}

// Router separation
rt('وش ناقص في الجاهزية؟',true);rt('وش أكثر بند جاهزية فشل؟',true);rt('كم مرة الشبكة فشلت؟',true);rt('وش أكثر مشكلة تشغيلية تتكرر؟',true);rt('مين ناقص من الفريق اليوم؟',false);rt('وش جاهزية الفريق اليوم؟',false);rt('كم مبيعات اليوم؟',false);rt('وش أكثر صنف ناقص؟',false);rt('وش ناقص من مهام اليوم؟',false);rt('وش وضع الصيانة؟',false);
// Periods
per('هذا الشهر',x=>x?.month==='2026-09');per('الشهر الماضي',x=>x?.month==='2026-08');per('اغسطس',x=>x?.month==='2026-08');per('قارن اغسطس بسبتمبر',x=>x?.type==='compare'&&x.periods[0].month==='2026-08'&&x.periods[1].month==='2026-09');per('اليوم',x=>x?.date==='2026-09-13');per('البارح',x=>x?.date==='2026-09-12');per('ثلوث الماضي',x=>x?.type==='date');per('هذا الاسبوع',x=>x?.type==='range');per('الاسبوع الماضي',x=>x?.type==='range');
// Intent / metrics
sp('كم الجاهزية اليوم؟',x=>x.metric==='score'&&x.period.date==='2026-09-13');
sp('متوسط الجاهزية هذا الشهر',x=>x.metric==='average_score'&&x.period.month==='2026-09');
sp('وش البنود غير الجاهزة اليوم؟',x=>x.metric==='failed_items');
sp('وش الملاحظات المفتوحة اليوم؟',x=>x.metric==='open_issues');
sp('وش البنود الحرجة المفتوحة؟',x=>x.metric==='critical_open'&&x.criticalOnly);
sp('وش اللي تعالج فورًا اليوم؟',x=>x.metric==='resolved_immediate');
sp('كم مرة فشل بند الشبكة؟',x=>x.metric==='fail_count'&&x.item?.name==='الشبكة');
sp('وش أكثر بند جاهزية فشل؟',x=>x.task==='rank'&&x.groupBy==='item'&&x.metric==='fail_count');
sp('وش أكثر قسم يفشل في الجاهزية؟',x=>x.task==='rank'&&x.groupBy==='category'&&x.metric==='fail_count');
sp('وش أكثر قسم يخصم من الجاهزية؟',x=>x.task==='rank'&&x.groupBy==='category'&&x.metric==='lost_weight');
sp('وش أكثر بند يخصم من الجاهزية؟',x=>x.task==='rank'&&x.groupBy==='item'&&x.metric==='lost_weight');
sp('وش البنود الحرجة اللي تكررت؟',x=>x.task==='rank'&&x.groupBy==='item'&&x.metric==='critical_fail_count'&&x.criticalOnly);
sp('كم مرة صار عندنا بند حرج هذا الشهر؟',x=>x.metric==='critical_fail_count');
sp('كم يوم الجاهزية حمراء هذا الشهر؟',x=>x.metric==='color_days'&&x.color==='أحمر');
sp('أفضل يوم جاهزية هذا الشهر',x=>x.task==='rank'&&x.groupBy==='day'&&x.rank.direction==='desc');
sp('أسوأ يوم جاهزية هذا الشهر',x=>x.task==='rank'&&x.groupBy==='day'&&x.rank.direction==='asc');
sp('حلل جاهزية هذا الشهر',x=>x.task==='analysis');
sp('قارن جاهزية هذا الأسبوع بالأسبوع الماضي',x=>x.task==='compare'&&x.period.type==='compare');
sp('صدر تقرير الجاهزية pdf',x=>x.task==='export');
sp('وش وضع الأجهزة والأنظمة هذا الشهر؟',x=>x.category==='الأجهزة والأنظمة');
sp('كم مرة برنامج البيع صار غير جاهز؟',x=>x.item?.name==='برنامج البيع'&&x.metric==='fail_count'&&x.item.critical===true);
sp('وش وضع مخارج الطوارئ؟',x=>x.item?.name==='مخارج طوارئ');
sp('وش مشاكل السلامة التشغيلية؟',x=>x.category==='السلامة التشغيلية');

async function ask(q){R.state.last=null;els.assistantChat.html='';els.assistantInput.value=q;await window.askRakizaAssistant();return els.assistantChat.html}
(async()=>{
let s=await R.periodStats({type:'month',month:'2026-09',label:'سبتمبر'},true);ok(s.count===7,'September day count',s);ok(Math.round(s.average)===93,'September average',s.average);ok(s.failed===11,'September failed count',s.failed);ok(s.criticalOpen===3,'critical open count',s.criticalOpen);
let h=await ask('كم مرة الشبكة فشلت هذا الشهر؟');ok(/3/.test(h),'network failed 3',h);
h=await ask('وش أكثر بند جاهزية فشل هذا الشهر؟');ok(/الشبكة/.test(h)&&/3/.test(h),'top repeated network',h);
h=await ask('وش أكثر قسم يخصم من الجاهزية هذا الشهر؟');ok(/الأجهزة والأنظمة/.test(h),'devices top lost category',h);
h=await ask('وش البنود الحرجة المفتوحة هذا الشهر؟');ok(/مخارج طوارئ/.test(h)&&/فئات الصرف/.test(h)&&/برنامج البيع/.test(h),'critical list',h);
h=await ask('وش اللي تعالج فورًا اليوم؟');ok(/أكياس/.test(h),'resolved immediate today',h);
h=await ask('حلل جاهزية هذا الشهر');ok(/تحليل الجاهزية التشغيلية/.test(h)&&/الشبكة/.test(h),'analysis output',h);
h=await ask('قارن جاهزية هذا الأسبوع بالأسبوع الماضي');ok(/مقارنة الجاهزية التشغيلية/.test(h),'compare output',h);
// Context follow-up
R.state.last={spec:R.detectSpec('كم مرة الشبكة فشلت هذا الشهر؟',{})};let x=R.detectSpec('طيب الشهر الماضي؟',{});ok(x.item?.name==='الشبكة'&&x.period.month==='2026-08','follow-up keeps item changes period',x);
console.log('Rakiza AI readiness tests passed:',pass);
})().catch(e=>{console.error(e);process.exit(1)});
