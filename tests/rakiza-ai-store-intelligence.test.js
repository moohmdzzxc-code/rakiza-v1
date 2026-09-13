global.window={RakizaAI:{normalize:null,state:{}}};
global.app={calendarDate:'2026-09-13',date:'2026-09-13',sections:[{id:'f',name:'الفاخر'}],actions:[
{id:'a1',action_type:'صيانة',subject:'الشبكة',request_date:'2026-09-01',last_update:'2026-09-10',action_status:'قيد المتابعة',raised_to:'الدعم',resolution_result:'[[RAKIZA_ESCALATION]] تكرار الانقطاع'},
{id:'a2',action_type:'طلب دعم',subject:'جهاز الكاشير',request_date:'2026-09-08',last_update:'2026-09-09',action_status:'مغلق',raised_to:'',resolution_result:'تمت المعالجة'}
]};
const els={assistantInput:{value:''},assistantChat:{html:'',insertAdjacentHTML(_p,h){this.html+=h},lastElementChild:{scrollIntoView(){}}}};
global.document={getElementById(id){return els[id]||null}};
let shortageRows=[
{id:'s1',section_id:'f',sections:{name:'الفاخر'},size:'60L',first_detected_date:'2026-09-07',shortage_status:'مفتوح',lost_opportunities:4,requested_qty:4},
{id:'s2',section_id:'f',sections:{name:'الفاخر'},size:'60L',first_detected_date:'2026-09-10',shortage_status:'تم الطلب',lost_opportunities:3,requested_qty:4},
{id:'s3',section_id:'f',sections:{name:'الفاخر'},size:'58L',first_detected_date:'2026-08-20',shortage_status:'تمت التغذية',lost_opportunities:1,requested_qty:2}
];
global.api=async name=>name==='shortages'?shortageRows:[];

function currentPeriod(p){return p?.label?.includes('الماضي')||p?.label?.includes('السابق')?false:true}
window.RakizaAI.sales={periodStats:async p=>currentPeriod(p)?{rows:[{work_date:'2026-09-07'},{work_date:'2026-09-08'}],sales:8000,target:12000,targetToDate:12000,achievement:66.7,variance:-4000,average:4000,hit:0,miss:2,cutoff:'2026-09-08'}:{rows:[{work_date:'2026-08-31'}],sales:10000,target:9000,targetToDate:9000,achievement:111.1,variance:1000,average:10000,hit:1,miss:0,cutoff:'2026-08-31'}};
window.RakizaAI.readiness={periodStats:async p=>currentPeriod(p)?{count:2,average:82,min:76,max:88,failed:4,open:2,resolved:2,criticalOpen:1,details:[{failed:[{item_name_ar:'الشبكة',category_name_ar:'الأجهزة والأنظمة',weight:5,critical:true,resolution_status:'يحتاج متابعة'}]},{failed:[{item_name_ar:'الشبكة',category_name_ar:'الأجهزة والأنظمة',weight:5,critical:true,resolution_status:'عولج فورًا'},{item_name_ar:'أكياس',category_name_ar:'مستلزمات التشغيل',weight:3,critical:false,resolution_status:'عولج فورًا'}]}]}:{count:2,average:94,min:92,max:96,failed:1,open:0,resolved:1,criticalOpen:0,details:[{failed:[]},{failed:[{item_name_ar:'أكياس',category_name_ar:'مستلزمات التشغيل',weight:3,critical:false,resolution_status:'عولج فورًا'}]}]}};
window.RakizaAI.attendance={attendanceRows:async p=>currentPeriod(p)?[
{attendance_status:'حاضر'},{attendance_status:'متأخر'},{attendance_status:'غائب'}
]:[{attendance_status:'حاضر'},{attendance_status:'حاضر'}],rosterEntriesForPeriod:async p=>currentPeriod(p)?[{planned_status:'Morning'},{planned_status:'Evening'},{planned_status:'Morning'}]:[{planned_status:'Morning'},{planned_status:'Evening'}]};
window.RakizaAI.tasks={buildPeriod:async p=>currentPeriod(p)?{days:[{modifiedCount:1},{modifiedCount:0}],tasks:[
{category:'استلام',execution_final:true,execution_kind:'completed'},
{category:'تحويل',execution_final:true,execution_kind:'partial'},
{category:'ترتيب وتعبئة',execution_final:false,execution_kind:null}
]}:{days:[{modifiedCount:0}],tasks:[{category:'استلام',execution_final:true,execution_kind:'completed'}]}};
window.RakizaAI.actions={displayStatus:x=>x.action_status==='مغلق'?'مغلق':x.raised_to?'تم التصعيد — قيد المتابعة':'قيد المتابعة',actionAge:x=>x.id==='a1'?12:1};
window.askRakizaAssistant=async()=>{els.assistantChat.html+='BASE'};
require('../rakiza-ai-store-intelligence.js');
const S=window.RakizaAI.store;let pass=0;
function ok(c,m,g){if(!c){console.error('FAIL',m,g||'');process.exit(1)}pass++}
function rt(q,e){const x=S.isStoreLanguage(q,{});ok(x===e,q,x)}
function sp(q,pred){const x=S.detectSpec(q,{});ok(pred(x),q,x);return x}

rt('حلل المعرض هذا الأسبوع',true);
rt('وش وضع المعرض؟',true);
rt('وش وضعنا العام؟',true);
rt('هل التشغيل مأثر على المبيعات؟',true);
rt('وش أهم 3 أولويات؟',true);
rt('وش أكثر شي ضاغط علينا؟',true);
rt('كم مبيعات اليوم؟',false);
rt('مين غايب اليوم؟',false);
rt('وش نواقص الفاخر؟',false);
rt('وش جاهزية المعرض اليوم؟',false);
rt('حلل المبيعات والجاهزية هذا الأسبوع',true);
sp('حلل المعرض هذا الأسبوع',x=>x.task==='analysis'&&x.period?.type==='range');
sp('وش أهم 5 أولويات؟',x=>x.task==='priorities'&&x.limit===5);
sp('هل التشغيل مأثر على المبيعات؟',x=>x.task==='causal');
sp('وش أكثر مشكلة متكررة؟',x=>x.task==='recurrence');
sp('قارن هذا الأسبوع بالأسبوع الماضي',x=>x.task==='compare'&&x.period?.type==='compare'&&x.period.periods.length===2);
const def=sp('وش وضع المعرض؟',x=>x.period?.defaulted===true&&x.period.label==='هذا الأسبوع حتى اليوم');
ok(def.period.end==='2026-09-13','default period ends today',def);

(async()=>{
let g=await S.gatherPeriod({type:'range',start:'2026-09-07',end:'2026-09-13',label:'آخر 7 أيام'});
ok(g.sales.available&&g.sales.sales===8000,'sales gathered',g.sales);
ok(g.sales.variance===-4000,'sales variance gathered',g.sales);
ok(g.readiness.available&&g.readiness.average===82,'readiness gathered',g.readiness);
ok(g.readiness.criticalOpen===1,'critical readiness preserved',g.readiness);
ok(g.readiness.repeated[0].label==='الشبكة'&&g.readiness.repeated[0].count===2,'readiness recurrence',g.readiness.repeated);
ok(g.attendance.absent===1&&g.attendance.late===1,'attendance counts',g.attendance);
ok(g.tasks.incomplete===1,'only final incomplete tasks count',g.tasks);
ok(g.tasks.unfinalized===1,'open-day task remains unfinalized',g.tasks);
ok(g.tasks.notDone===0,'unfinalized task not treated as not done',g.tasks);
ok(g.shortages.periodRecords===2,'period shortages counted',g.shortages);
ok(g.shortages.unresolvedCurrent===2,'current unresolved shortages counted',g.shortages);
ok(g.shortages.repeated[0].label==='60L'&&g.shortages.repeated[0].section==='الفاخر','shortage identity keeps section',g.shortages.repeated);
ok(g.actions.openCurrent===1&&g.actions.escalatedCurrent===1,'action lifecycle gathered',g.actions);
ok(g.actions.oldest.subject==='الشبكة'&&g.actions.oldest.age===12,'oldest action age',g.actions.oldest);
let sig=S.operationalSignals(g);
ok(sig[0].kind==='critical','critical signal first',sig);
ok(sig.some(x=>x.kind==='repeated'),'repeated signal included',sig);
let pri=S.priorityItems(g,3);
ok(pri.length===3,'priority limit honored',pri);
ok(/البنود الحرجة/.test(pri[0].text),'critical readiness priority first',pri);
ok(!pri.some(x=>/سبب/.test(x.text)&&/المبيعات/.test(x.text)),'no invented sales cause',pri);
let link=S.linkageText(g);
ok(/تزامن/.test(link)&&/لا تثبت/.test(link),'causal guard',link);
let rec=S.recurringItems(g);
ok(rec.some(x=>x.domain==='الجاهزية'&&x.label==='الشبكة'),'readiness recurrence surfaced',rec);
ok(rec.some(x=>x.domain==='النواقص'&&x.label==='60L'),'shortage recurrence surfaced',rec);

let h=await S.answer('حلل المعرض هذا الأسبوع',{});
ok(/تحليل شامل للمعرض/.test(h),'summary title',h);
ok(/الوضع العام/.test(h),'overall section',h);
ok(/الربط بين المؤشرات/.test(h),'linkage section',h);
ok(/الأولويات الآن/.test(h),'priorities section',h);
ok(/لا توجد درجة صحة\/خطر مركبة/.test(h),'no hidden store score statement',h);
ok(/هذا الأسبوع/.test(h),'period label shown',h);
ok(/المبيعات/.test(h)&&/الجاهزية/.test(h)&&/الفريق/.test(h),'multi-domain facts shown',h);
ok(!/Conversion.*\d|ATV.*\d|UPT.*\d/.test(h),'unsupported sales metrics not fabricated',h);

h=await S.answer('هل التشغيل مأثر على المبيعات؟',{});
ok(/هل التشغيل مؤثر على المبيعات/.test(h),'causal answer title',h);
ok(/لا تثبت/.test(h),'causal answer explicitly guarded',h);
ok(/ATV/.test(h)&&/Traffic/.test(h)&&/Conversion/.test(h),'causal limitations declared',h);

h=await S.answer('وش أكثر مشكلة متكررة؟',{});
ok(/أبرز التكرارات/.test(h),'recurrence section',h);
ok(/لا أوحّد أنواع أحداث مختلفة/.test(h),'no cross-domain fake ranking',h);
ok(/الشبكة/.test(h),'current-week recurrence shown without importing prior-week shortage history',h);

h=await S.answer('قارن هذا الأسبوع بالأسبوع الماضي',{});
ok(/مقارنة شاملة للمعرض/.test(h),'comparison title',h);
ok(/Sales/.test(h)&&/متوسط الجاهزية/.test(h),'comparison domains',h);
ok(/وصفية/.test(h)&&/علاقة سببية/.test(h),'comparison causal caveat',h);
ok(/أرقام الإجراءات حسب تاريخ التسجيل/.test(h),'actions history caveat',h);

S.state.last={spec:{task:'analysis',period:{type:'range',start:'2026-09-07',end:'2026-09-13',label:'آخر 7 أيام'}},snapshot:g};
rt('طيب وش أكثر مشكلة متكررة؟',true);
const f=sp('قارنها بالشهر الماضي',x=>x.task==='compare'&&x.period?.type==='compare');
ok(f.period.periods.length===2,'follow-up comparison keeps prior period',f.period);

els.assistantChat.html='';els.assistantInput.value='حلل المعرض هذا الأسبوع';S.state.busy=false;await window.askRakizaAssistant();
ok(/تحليل شامل للمعرض/.test(els.assistantChat.html),'chat bridge handles store question',els.assistantChat.html);
els.assistantChat.html='';els.assistantInput.value='كم مبيعات اليوم؟';S.state.busy=false;await window.askRakizaAssistant();
ok(/BASE/.test(els.assistantChat.html),'single-domain question passes to previous bridge',els.assistantChat.html);
console.log('Rakiza AI store intelligence tests passed:',pass);
})().catch(e=>{console.error(e);process.exit(1)});
