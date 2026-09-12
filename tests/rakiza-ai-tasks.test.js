const fs=require('fs'),vm=require('vm');
let pass=0;
function ok(c,n,x){if(!c){console.error('FAIL',n,x||'');process.exit(1)}pass++}
function has(s,v,n){ok(String(s).includes(v),n||`${v} in output`,s)}

const employees=[
  {id:'e1',full_name:'محمد الغامدي',active:true},
  {id:'e2',full_name:'عمار مثنى',active:true},
  {id:'e3',full_name:'خليل الجبوري',active:true}
];
const sections=[{id:'s1',name:'الفاخر'},{id:'s2',name:'الأعمال'},{id:'s3',name:'الكلاسيك'}];
const recent=[
  {id:'d0',work_date:'2026-09-13',status:'مفتوح',day_type:'يوم تشغيلي'},
  {id:'d1',work_date:'2026-09-12',status:'مغلق',day_type:'يوم تشغيلي'},
  {id:'d2',work_date:'2026-09-11',status:'مغلق',day_type:'يوم تشغيلي'},
  {id:'d3',work_date:'2026-09-10',status:'مغلق',day_type:'يوم بيعي فقط'},
  {id:'d4',work_date:'2026-08-31',status:'مغلق',day_type:'يوم تشغيلي'}
];
const details={
 d0:{day:recent[0],plan:{header:{id:'p0',day_type:'يوم تشغيلي',version_no:1,plan_status:'معتمدة'},tasks:[
   {id:'t01',task_category:'ترتيب وتعبئة',section_id:'s1',task_detail:'الفاخر',employee_count:1},
   {id:'t02',task_category:'استلام',section_id:'s2',employee_count:1}
 ],assignments:[
   {task_id:'t01',employee_id:'e1',assignment_role:'مسؤول'},
   {task_id:'t02',employee_id:'e2',assignment_role:'مسؤول استلام'}
 ]},close:{header:{day_type:'يوم تشغيلي'},tasks:[],assignments:[],execution:[]}},
 d1:{day:recent[1],plan:{header:{id:'p1',day_type:'يوم تشغيلي',version_no:1,plan_status:'معتمدة'},tasks:[
   {id:'t11',task_category:'ترتيب وتعبئة',section_id:'s1',task_detail:'الفاخر',employee_count:1},
   {id:'t12',task_category:'استلام',section_id:'s2',employee_count:1},
   {id:'t13',task_category:'تحويل',transfer_destination:'جبرة',employee_count:2},
   {id:'t14',task_category:'العرض المرئي والعروض',vm_type:'عرض خاص',vm_detail:'واجهة',employee_count:1}
 ],assignments:[
   {task_id:'t11',employee_id:'e1',assignment_role:'مسؤول'},
   {task_id:'t12',employee_id:'e2',assignment_role:'مسؤول استلام'},
   {task_id:'t13',employee_id:'e1',assignment_role:'تجهيز/إخراج'},
   {task_id:'t13',employee_id:'e3',assignment_role:'جرد ومطابقة'},
   {task_id:'t14',employee_id:'e3',assignment_role:'مسؤول'}
 ]},close:{execution:[
   {task_id:'t11',execution_status:'مكتملة',noncompletion_reason:null},
   {task_id:'t12',execution_status:'مكتملة جزئيًا',noncompletion_reason:'نقص موظفين'},
   {task_id:'t13',execution_status:'لم تنفذ',noncompletion_reason:'لم تصل البضاعة'},
   {task_id:'t14',execution_status:'مكتملة',noncompletion_reason:null}
 ]}},
 d2:{day:recent[2],plan:{header:{id:'p2',day_type:'يوم تشغيلي',version_no:2,plan_status:'معتمدة',change_reason:'غياب موظف'},tasks:[
   {id:'t21',task_category:'ترتيب وتعبئة',section_id:'s2',task_detail:'الأعمال',employee_count:2},
   {id:'t22',task_category:'استلام',section_id:'s1',employee_count:1}
 ],assignments:[
   {task_id:'t21',employee_id:'e1',assignment_role:'مسؤول'},
   {task_id:'t21',employee_id:'e2',assignment_role:'مسؤول'},
   {task_id:'t22',employee_id:'e2',assignment_role:'مسؤول استلام'}
 ]},close:{execution:[
   {task_id:'t21',execution_status:'مكتملة جزئيًا',noncompletion_reason:'ضغط عمل'},
   {task_id:'t22',execution_status:'مكتملة',noncompletion_reason:null}
 ]}},
 d3:{day:recent[3],plan:{header:{id:'p3',day_type:'يوم بيعي فقط',version_no:1,plan_status:'معتمدة'},tasks:[],assignments:[]},close:{execution:[]}},
 d4:{day:recent[4],plan:{header:{id:'p4',day_type:'يوم تشغيلي',version_no:1,plan_status:'معتمدة'},tasks:[
   {id:'t41',task_category:'استلام',section_id:'s1',employee_count:1}
 ],assignments:[{task_id:'t41',employee_id:'e1',assignment_role:'مسؤول استلام'}]},close:{execution:[{task_id:'t41',execution_status:'لم تنفذ',noncompletion_reason:'تأخر الشحنة'}]}}
};

const assistantInput={value:''};
const fakeChat={insertAdjacentHTML(){},lastElementChild:null};
const sandbox={
 console,
 window:{},
 document:{getElementById(id){if(id==='assistantInput')return assistantInput;if(id==='assistantChat')return fakeChat;return null}},
 app:{calendarDate:'2026-09-13',date:'2026-09-13',day:recent[0],recent,employees,sections},
 api:async(name,o={})=>{if(name==='day')return details[o.q.id];throw Error('unexpected api '+name)},
 openDayPlan(){},
 setTimeout,clearTimeout
};
sandbox.window=sandbox;
sandbox.window.RakizaAI={
 normalize:v=>String(v??'').toLowerCase().replace(/[\u064B-\u065F\u0670]/g,'').replace(/ـ/g,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/ؤ/g,'و').replace(/ئ/g,'ي').replace(/[،,:;؛!?؟.()\[\]{}"']/g,' ').replace(/\s+/g,' ').trim(),
 analyze:q=>({entities:{domain:null}}),
 state:{context:{}}
};
sandbox.window.askRakizaAssistant=()=>{};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('rakiza-ai-tasks.js','utf8'),sandbox,{filename:'rakiza-ai-tasks.js'});
const A=sandbox.window.RakizaAI.tasks;

(async()=>{
ok(A.version==='0.1.0','version');
// routing positives
for(const q of ['وش مهام اليوم؟','افتح خطة اليوم','مين مسؤول عن الاستلام؟','وش حالة تنفيذ المهام؟','وش المهام اللي ما اكتملت؟','ليش ما تنفذت مهمة التحويل؟','حلل المهام هذا الشهر','مين أكثر موظف مكلف بمهام؟','وش أكثر مهمة ما اكتملت؟','وش صار في الفيجوال؟'])ok(A.isTasksLanguage(q,{}),`route + ${q}`);
// routing negatives / domain boundaries
for(const q of ['كم مبيعات اليوم؟','وش أكثر صنف ناقص؟','وش ناقص في الجاهزية التشغيلية؟','مين غايب اليوم؟','عمار مهمة عمل اليوم','كم نسبة التحويل؟','وش الإجراءات المفتوحة؟'])ok(!A.isTasksLanguage(q,{}),`route - ${q}`);
// period parsing
let p=A.detectPeriod('مهام اليوم');ok(p.type==='date'&&p.date==='2026-09-13','today period',p);
p=A.detectPeriod('مهام أمس');ok(p.date==='2026-09-12','yesterday period',p);
p=A.detectPeriod('حلل مهام هذا الشهر');ok(p.type==='month'&&p.month==='2026-09','month period',p);
p=A.detectPeriod('حلل مهام الشهر الماضي');ok(p.month==='2026-08','prev month',p);
p=A.detectPeriod('قارن هذا الأسبوع بالأسبوع الماضي');ok(p.type==='compare'&&p.periods.length===2,'compare weeks',p);
p=A.detectPeriod('وش مهام الخميس الماضي');ok(p.type==='date','weekday period',p);
p=A.detectPeriod('مهام اغسطس 2026');ok(p.month==='2026-08','named month year',p);
// detection
let s=A.detectSpec('مين مسؤول عن الاستلام اليوم',{});ok(s.task==='assignments','assignment task',s);ok(s.category==='استلام','category receive',s);
s=A.detectSpec('وش المهام اللي ما اكتملت هذا الشهر',{});ok(s.task==='execution'&&s.execution==='incomplete','incomplete execution',s);
s=A.detectSpec('كم نسبة تنفيذ المهام؟',{});ok(s.task==='unsupported_rate','unsupported rate',s);
s=A.detectSpec('كم مرة تعدلت الخطة هذا الشهر',{});ok(s.task==='plan_changes','plan changes',s);
s=A.detectSpec('سوي مسودة مهمة استلام لعمار اليوم',{});ok(s.task==='draft'&&s.category==='استلام'&&s.employee.id==='e2','draft parse',s);
s=A.detectSpec('عدل مهمة الاستلام وخلي عمار مسؤول',{});ok(s.task==='change_draft','change draft',s);
// build data
let data=await A.buildPeriod({type:'month',month:'2026-09',label:'سبتمبر'});ok(data.tasks.length===8,'sept planned task count',data.tasks.length);ok(data.days.length===4,'sept day count',data.days.length);
let open=data.tasks.filter(x=>x.date==='2026-09-13');ok(open.every(x=>!x.execution_final),'open day not final');
let closed=data.tasks.filter(x=>x.date==='2026-09-12');ok(closed.filter(x=>x.execution_kind==='completed').length===2,'closed completed count');ok(closed.filter(x=>x.execution_kind==='partial').length===1,'closed partial count');ok(closed.filter(x=>x.execution_kind==='not_done').length===1,'closed not done count');
// E2E answers
let h=await A.answer('وش مهام اليوم',{});has(h,'ترتيب وتعبئة','today task listed');has(h,'التنفيذ النهائي لم يُثبت بعد','open task safe wording');
h=await A.answer('هل الاستلام تم اليوم؟',{});has(h,'ما زال مفتوحًا','open execution no false failure');
h=await A.answer('مين مسؤول عن الاستلام اليوم',{});has(h,'عمار مثنى','today receive owner');
h=await A.answer('وش مهام محمد اليوم',{});has(h,'ترتيب وتعبئة','employee today tasks');
h=await A.answer('وش المهام اللي ما اكتملت هذا الشهر',{});has(h,'مكتملة جزئيًا','partial shown');has(h,'لم تنفذ','not done shown');ok(!h.includes('t01'),'no raw ids');
h=await A.answer('ليش ما اكتملت المهام هذا الشهر',{});has(h,'نقص موظفين','reason one');has(h,'ضغط عمل','reason two');has(h,'لم تصل البضاعة','reason three');
h=await A.answer('وش أكثر مهمة ما اكتملت هذا الشهر',{});has(h,'أكثر أنواع المهام تعثرًا','rank noncompletion');
h=await A.answer('مين أكثر موظف مكلف بمهام هذا الشهر',{});has(h,'عدد التكليفات المسجلة','rank assignments');has(h,'ليس تقييمًا للإنتاجية','no productivity leap');
h=await A.answer('حلل المهام هذا الشهر',{});has(h,'مهام مخططة','analysis planned');has(h,'مكتملة جزئيًا','analysis partial');has(h,'لم تنفذ','analysis not done');has(h,'لم أعتبرها فشلًا','open tasks excluded');has(h,'لا أحسب «نسبة تنفيذ»','no invented KPI');
h=await A.answer('كم مرة تعدلت الخطة هذا الشهر',{});has(h,'2026-09-11','changed day');has(h,'عدد التعديلات: 1','change count');has(h,'غياب موظف','last change reason');has(h,'لا أعيد بناء محتوى النسخ السابقة','no invented prior plan');
h=await A.answer('كم نسبة تنفيذ المهام؟',{});has(h,'لم نعتمد مؤشر','unsupported KPI');
h=await A.answer('سوي لي خطة اليوم فيها استلام',{});has(h,'مسودة','draft only');has(h,'لن أحفظ','no write');
h=await A.answer('عدل مهمة الاستلام وخلي عمار مسؤول',{});has(h,'تعديل مقترح','change draft only');has(h,'تحتاج سببًا','approved change reason rule');
h=await A.answer('وش مهام 2026-09-10',{});has(h,'يوم بيعي فقط','sales-only day');
h=await A.answer('قارن هذا الشهر بالشهر الماضي',{});has(h,'مقارنة المهام والتنفيذ','compare output');has(h,'المهام المخططة','compare planned');
// Context: category/task/period should carry in follow-up
await A.answer('مين مسؤول عن الاستلام اليوم',{});s=A.detectSpec('طيب الشهر الماضي؟',{});ok(s.category==='استلام','context category');ok(s.task==='assignments','context task');ok(s.period?.month==='2026-08','context month shift',s);
await A.answer('وش المهام اللي ما اكتملت هذا الشهر',{});s=A.detectSpec('طيب الشهر اللي قبله؟',{});ok(s.execution==='incomplete','context execution');ok(s.task==='execution','context execution task');ok(s.period?.month==='2026-08','context previous month 2',s);
// explicit new domain should not route as task follow-up
ok(!A.isTasksLanguage('طيب كم مبيعات الشهر الماضي؟',{}),'follow-up new sales domain');
console.log('Rakiza AI tasks tests passed:',pass);
})().catch(e=>{console.error(e);process.exit(1)});
