const fs=require('fs'),vm=require('vm');
let pass=0;
function ok(c,n,x){if(!c){console.error('FAIL',n,x||'');process.exit(1)}pass++}
function has(s,v,n){ok(String(s).includes(v),n||`${v} in output`,s)}

const rows=[
 {id:'a1',action_type:'صيانة',subject:'مكيف الصالة',description:'ضعف التبريد في الصالة',request_date:'2026-09-01',raised_to:'الصيانة المركزية',action_status:'تم الرفع',last_update:'2026-09-10',resolution_result:'[[RAKIZA_ESCALATION]]لم تتم المعالجة بعد'},
 {id:'a2',action_type:'طلب دعم',subject:'جهاز نقاط البيع',description:'تعطل طابعة الفواتير',request_date:'2026-09-05',raised_to:'',action_status:'قيد المتابعة',last_update:'2026-09-05',resolution_result:''},
 {id:'a3',action_type:'مشكلة عميل',subject:'استبدال منتج',description:'طلب استبدال من العميل',request_date:'2026-09-02',raised_to:'',action_status:'مغلق',last_update:'2026-09-04',resolution_result:'تم الاستبدال للعميل'},
 {id:'a4',action_type:'نواقص',subject:'نقص مقاس 56M',description:'طلب تغذية للقسم',request_date:'2026-08-28',raised_to:'مشرف المنطقة',action_status:'مغلق',last_update:'2026-09-03',resolution_result:'تمت التغذية'},
 {id:'a5',action_type:'أخرى',subject:'لوحة الأسعار',description:'تحديث اللوحة الخارجية',request_date:'2026-08-20',raised_to:'',action_status:'قيد المتابعة',last_update:'2026-08-20',resolution_result:''},
 {id:'a6',action_type:'صيانة',subject:'إنارة الواجهة',description:'لمبة خارجية لا تعمل',request_date:'2026-08-15',raised_to:'',action_status:'مغلق',last_update:'2026-08-18',resolution_result:'تم تغيير اللمبة'}
];
const assistantInput={value:''},fakeChat={insertAdjacentHTML(){},lastElementChild:null};
const sandbox={console,window:{},document:{getElementById(id){if(id==='assistantInput')return assistantInput;if(id==='assistantChat')return fakeChat;return null}},app:{calendarDate:'2026-09-13',date:'2026-09-13',actions:rows},openActions(){},setTimeout,clearTimeout};
sandbox.window=sandbox;
sandbox.window.RakizaAI={normalize:v=>String(v??'').toLowerCase().replace(/[\u064B-\u065F\u0670]/g,'').replace(/ـ/g,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/ؤ/g,'و').replace(/ئ/g,'ي').replace(/[،,:;؛!?؟.()\[\]{}"']/g,' ').replace(/\s+/g,' ').trim(),analyze:q=>({entities:{domain:null}}),state:{context:{}}};
sandbox.window.askRakizaAssistant=()=>{};
vm.createContext(sandbox);vm.runInContext(fs.readFileSync('rakiza-ai-actions.js','utf8'),sandbox,{filename:'rakiza-ai-actions.js'});
const A=sandbox.window.RakizaAI.actions;
(async()=>{
ok(A.version==='0.1.0','version');
for(const q of ['وش الإجراءات المفتوحة؟','وش اللي تم تصعيده؟','وش إجراءات الصيانة؟','وش طلبات الدعم المفتوحة؟','وش مشاكل العملاء؟','وش أقدم إجراء مفتوح؟','كم له طلب المكيف مفتوح؟','حلل الإجراءات هذا الشهر','مرفوع لمين طلب المكيف؟','وش نتيجة إغلاق استبدال المنتج؟'])ok(A.isActionsLanguage(q,{}),`route + ${q}`);
for(const q of ['كم مبيعات اليوم؟','وش أكثر صنف ناقص؟','وش ناقص في الجاهزية؟','مين غايب اليوم؟','وش مهام اليوم؟','هل تمت التغذية؟'])ok(!A.isActionsLanguage(q,{}),`route - ${q}`);
let p=A.detectPeriod('إجراءات هذا الشهر');ok(p.type==='month'&&p.month==='2026-09','this month',p);
p=A.detectPeriod('إجراءات الشهر الماضي');ok(p.month==='2026-08','last month',p);
p=A.detectPeriod('قارن هذا الشهر بالشهر الماضي');ok(p.type==='compare'&&p.periods.length===2,'compare month',p);
p=A.detectPeriod('وش اتقفل 2026-09-04');ok(p.type==='date'&&p.date==='2026-09-04','explicit date',p);
let s=A.detectSpec('وش الإجراءات المفتوحة',{});ok(s.status==='open','open status',s);
s=A.detectSpec('وش قيد المتابعة',{});ok(s.status==='followup','followup status',s);
s=A.detectSpec('وش اللي تم تصعيده',{});ok(s.status==='escalated','escalated status',s);
s=A.detectSpec('وش المغلق هذا الشهر',{});ok(s.status==='closed'&&s.dateBasis==='closure','closed uses closure date',s);
s=A.detectSpec('وش إجراءات الصيانة',{});ok(s.type==='صيانة','maintenance type',s);
s=A.detectSpec('كم له طلب المكيف مفتوح',{});ok(s.task==='age'&&s.focus?.id==='a1','focus and age',s);
s=A.detectSpec('مرفوع لمين طلب المكيف',{});ok(s.task==='escalation_to'&&s.focus?.id==='a1','escalation target task',s);
s=A.detectSpec('وش سبب تصعيد المكيف',{});ok(s.task==='escalation_reason','escalation reason task',s);
s=A.detectSpec('كم مرة تصعد طلب المكيف',{});ok(s.task==='unsupported_escalation_history','no escalation history invention',s);
s=A.detectSpec('وش الإجراءات المتأخرة',{});ok(s.task==='unsupported_overdue','no SLA invention',s);
s=A.detectSpec('سجل إجراء صيانة للمكيف',{});ok(s.task==='create_draft','create draft',s);
s=A.detectSpec('صعد طلب المكيف للمشرف',{});ok(s.task==='escalate_draft','escalate draft',s);
s=A.detectSpec('اغلق طلب المكيف',{});ok(s.task==='close_draft','close draft',s);
ok(A.displayStatus(rows[0])==='تم التصعيد — قيد المتابعة','escalation display not closure');
ok(A.displayStatus(rows[2])==='مغلق','closed display');
ok(A.escalationReason(rows[0])==='لم تتم المعالجة بعد','parse escalation reason');
ok(A.closureResult(rows[0])===null,'escalated not resolution');
ok(A.closureResult(rows[2])==='تم الاستبدال للعميل','closure result');
ok(A.actionAge(rows[0])===12,'open age');ok(A.actionAge(rows[2])===2,'closed duration to last update');
let filtered=A.applySpec(rows,{status:'open'});ok(filtered.length===3,'all unresolved includes escalated');
filtered=A.applySpec(rows,{status:'escalated'});ok(filtered.length===1&&filtered[0].id==='a1','escalated current only');
filtered=A.applySpec(rows,{status:'closed'});ok(filtered.length===3,'closed count');
filtered=A.applySpec(rows,{status:'closed',period:{type:'month',month:'2026-09'},dateBasis:'closure'});ok(filtered.length===2,'closure date filter');
let h=await A.answer('وش الإجراءات المفتوحة',{});has(h,'مكيف الصالة','open list escalated');has(h,'جهاز نقاط البيع','open list regular');has(h,'لوحة الأسعار','older open');ok(!h.includes('استبدال منتج'),'closed excluded');
h=await A.answer('وش اللي تم تصعيده',{});has(h,'مكيف الصالة','escalated list');has(h,'تم التصعيد — قيد المتابعة','escalation still followup');
h=await A.answer('مرفوع لمين طلب المكيف',{});has(h,'الصيانة المركزية','escalation destination');has(h,'التصعيد لا يغلق الإجراء','escalation safety');
h=await A.answer('وش سبب تصعيد المكيف',{});has(h,'لم تتم المعالجة بعد','current escalation reason');
h=await A.answer('وش نتيجة إغلاق استبدال المنتج',{});has(h,'تم الاستبدال للعميل','resolution result');
h=await A.answer('كم له طلب المكيف مفتوح',{});has(h,'12 يوم','age answer');has(h,'لا أتعامل مع هذه المدة كـ SLA','age not SLA');
h=await A.answer('وش أقدم إجراء مفتوح',{});has(h,'لوحة الأسعار','oldest open');has(h,'ليست حكمًا','oldest not overdue');
h=await A.answer('وش الإجراءات المتأخرة',{});has(h,'لا يوجد SLA','unsupported overdue');
h=await A.answer('كم مرة تصعد طلب المكيف',{});has(h,'لا يحتفظ بتاريخ تصعيد مستقل أو بعدد مرات التصعيد','no fake escalation history');
h=await A.answer('حلل الإجراءات هذا الشهر',{});has(h,'تحليل الإجراءات والمتابعات','analysis');has(h,'قيد المتابعة','analysis counts');has(h,'مصعّدة ومفتوحة','analysis escalated');has(h,'لا أنشئ نسبة إغلاق أو SLA','no invented KPI');
h=await A.answer('وش أكثر نوع إجراءات هذا الشهر',{});has(h,'أكثر أنواع الإجراءات تسجيلًا','rank types');
h=await A.answer('قارن هذا الشهر بالشهر الماضي',{});has(h,'مقارنة الإجراءات حسب تاريخ التسجيل','compare');has(h,'الحالة الحالية','compare snapshot caveat');
h=await A.answer('وش المغلق هذا الشهر',{});has(h,'الفترة هنا مطبقة على آخر تحديث/الإغلاق المسجل','closure basis disclosed');has(h,'استبدال منتج','closed sept one');has(h,'نقص مقاس 56M','closed sept two');
h=await A.answer('سجل إجراء صيانة للمكيف',{});has(h,'مسودة إجراء جديد','create draft only');has(h,'لن أسجل الإجراء تلقائيًا','no write create');
h=await A.answer('صعد طلب المكيف للمشرف',{});has(h,'مسودة تصعيد','escalate draft only');has(h,'يبقى الإجراء','escalation stays open');
h=await A.answer('اغلق طلب المكيف',{});has(h,'مسودة إغلاق','close draft');has(h,'نتيجة معالجة','closure requires result');
await A.answer('وش إجراءات الصيانة هذا الشهر',{});s=A.detectSpec('طيب المفتوحة بس؟',{});ok(s.type==='صيانة'&&s.status==='open','context type and status',s);ok(s.period?.month==='2026-09','context period',s);
await A.answer('وش اللي تم تصعيده هذا الشهر',{});s=A.detectSpec('طيب الشهر اللي قبله؟',{});ok(s.status==='escalated','context escalated',s);ok(s.period?.month==='2026-08','context previous month',s);
ok(!A.isActionsLanguage('طيب كم مبيعات الشهر الماضي؟',{}),'followup new sales domain');
console.log('Rakiza AI actions tests passed:',pass);
})().catch(e=>{console.error(e);process.exit(1)});
