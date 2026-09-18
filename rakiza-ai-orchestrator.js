(()=>{
'use strict';

const AI=window.RakizaAI=window.RakizaAI||{};
const CAPS=AI.capabilities;
if(!CAPS||AI.orchestrator?.version)return;

const VERSION='1.0.0';
const baseAsk=window.askRakizaAssistant;
const STATE={goal:null,turns:[],busy:false,model:{enabled:false,lastError:null},baseAsk};

function norm(v){try{return AI.normalize(v)}catch{return String(v??'').toLowerCase().replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي').replace(/[ًٌٍَُِّْـ]/g,'').replace(/[،,:;؛!?؟.()]/g,' ').replace(/\s+/g,' ').trim()}}
function esc(v){return String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]))}
function clone(v){try{return JSON.parse(JSON.stringify(v))}catch{return v}}
function app(){return window.app||{}}
function empName(e){return e?.full_name||e?.name||''}
function baseDate(){return String(app().calendarDate||app().day?.work_date||app().date||new Date().toISOString().slice(0,10)).slice(0,10)}
function dObj(v){return new Date(String(v)+'T12:00:00')}
function iso(d){return d.toISOString().slice(0,10)}
function addDays(v,n){const d=dObj(v);d.setDate(d.getDate()+n);return iso(d)}
function sunday(v){const d=dObj(v);d.setDate(d.getDate()-d.getDay());return iso(d)}
function nextWeek(){const start=addDays(sunday(baseDate()),7);return{type:'week',start:start,end:addDays(start,6),label:'الأسبوع القادم'}}
function currentDraft(){const d=AI.conversation?.state?.pending?.draft;return d?.kind==='roster'&&d.status!=='saved'?d:null}
function setDraft(draft){const C=AI.conversation;if(!C)return;C.state.pending=C.state.pending||{};C.state.pending.draft=draft;C.state.pending.question=C.nextClarification?C.nextClarification(draft):null;C.state.context=C.state.context||{};C.state.context.domain='attendance';C.state.context.period=clone(draft.period)}
function chat(role,html){const c=document.getElementById('assistantChat');if(!c)return;const mine=role==='user';if(!mine&&AI.voice?.present)html=AI.voice.present(html,{source:'orchestrator',domain:STATE.goal?.domain||null});c.insertAdjacentHTML('beforeend','<div style="display:flex;justify-content:'+(mine?'flex-start':'flex-end')+'"><div class="task" style="max-width:92%;margin:0;background:'+(mine?'#eef3f8':'#fff')+';border-color:'+(mine?'#d6e0ea':'#e3e7ec')+'">'+html+'</div></div>');c.lastElementChild?.scrollIntoView?.({behavior:'smooth',block:'nearest'})}
function record(role,text,data={}){STATE.turns.push({role:role,text:String(text||''),at:new Date().toISOString(),...clone(data)});if(STATE.turns.length>100)STATE.turns.splice(0,STATE.turns.length-100)}

function periodFromText(text){
  try{const p=AI.conversation?.interpret?.(text,{raw:text,entities:{}})?.period;if(p?.start)return p}catch{}
  const n=norm(text),cur=sunday(baseDate());let start=null,label='';
  if(/الاسبوع (?:القادم|الجاي|المقبل)/.test(n)){start=addDays(cur,7);label='الأسبوع القادم'}
  else if(/هذا الاسبوع|الاسبوع الحالي|هالاسبوع/.test(n)){start=cur;label='هذا الأسبوع'}
  else if(/الاسبوع (?:الماضي|السابق|اللي فات)/.test(n)){start=addDays(cur,-7);label='الأسبوع الماضي'}
  return start?{type:'week',start:start,end:addDays(start,6),label:label}:null;
}
function approved(text){return CAPS.approvalText(text)||/(?:^|\s)اعتمد(?:ها|ه)?(?:\s|$)/.test(norm(text))}
function operationalDraftRequest(n){return/(?:مسوده|مسودة).*(?:قابل|تشغيل|حفظ)|(?:قابل|تشغيل).*(?:مسوده|مسودة)|حول(?:ها)? (?:ل|الى) (?:مسوده|التشغيل)|انقل(?:ها)? (?:للجدول|لجدول|للخطه)/.test(n)}
function rosterRequest(n){return/خطة (?:ال)?تواجد|خطه (?:ال)?تواجد|جدول الدوام|روستر/.test(n)}
function createRequest(n){return/(?:قم ب|سوي|سو|اعمل|انشئ|جهز|ابني|اعد|اقترح)/.test(n)}
function isAck(n){return/^(تمام|حسنا|زين|اوكي|ok)$/.test(n)}
function isCapabilityQuestion(n){return/وش تقدر|ايش تقدر|ماذا تقدر|قدراتك|وش تسوي|ايش تسوي|كل اللي تقدر/.test(n)}

function capabilitySummary(){return'<b>أستطيع القراءة والتحليل والتنفيذ داخل ركيزة.</b><div style="margin-top:8px">دورة التشغيل اليومي، المستهدفات والمبيعات، خطة التواجد والحضور، المهام، النواقص وتصديرها، الإجراءات اليومية، الصيانة، المتابعات، سجل الأيام والتحليل الشامل.</div><div class="mut" style="margin-top:7px">القراءة والتنقل ينفذان مباشرة. أي حفظ أو تغيير أعرضه أولًا ثم أنتظر اعتمادك.</div>'}
function argsHtml(args={}){const labels={monthly_target:'مستهدف الشهر',daily_target:'مستهدف اليوم',subject:'الموضوع',description:'الوصف',request_date:'التاريخ',work_date:'التاريخ',new_status:'الحالة الجديدة',reason:'السبب',raised_to:'جهة التصعيد'};const rows=Object.entries(args).filter(([k,v])=>labels[k]&&v!==undefined&&v!==null&&v!=='').map(([k,v])=>'<div><span class="mut">'+labels[k]+':</span> <b>'+esc(v)+'</b></div>');return rows.length?'<div style="margin-top:7px">'+rows.join('')+'</div>':''}
function missingLabel(k){return({monthly_target:'مستهدف الشهر',daily_target:'مستهدف اليوم',subject:'الموضوع',description:'وصف المطلوب',request_date:'التاريخ',work_date:'تاريخ التغيير',employee_id:'الموظف',new_status:'الدوام الجديد',reason:'سبب التغيير',raised_to:'جهة التصعيد',resolution_result:'نتيجة المعالجة',id:'الإجراء المقصود',section_id:'القسم',reporter_employee_id:'مسؤول القسم',rows:'الصنف والكميات'})[k]||k}
function pendingHtml(p=CAPS.state.pending){if(!p)return'<b>لا توجد عملية بانتظار الاعتماد.</b>';const cap=CAPS.get(p.id);if(p.missing?.length)return'<b>فهمت '+esc(cap?.label||p.id)+'، وبقي فقط: '+esc(missingLabel(p.missing[0]))+'.</b><div class="mut" style="margin-top:6px">اكتب هذه المعلومة فقط وسأكمل نفس الطلب.</div>';return'<b>جهزت '+esc(cap?.label||p.id)+' للمراجعة.</b>'+argsHtml(p.args)+'<div class="notice" style="margin-top:9px">لم أنفذ أو أحفظ شيئًا بعد. قل <b>اعتمد</b> للتنفيذ.</div>'}
function receiptHtml(result){if(!result?.ok)return'<div class="notice err"><b>لم يكتمل التنفيذ.</b><div style="margin-top:5px">'+esc(result?.message||'حدث خطأ غير محدد')+'</div></div>';const r=result.receipt;return'<div class="notice ok"><b>تم: '+esc(r.label)+'.</b><div style="margin-top:5px">'+(r.verified?'اكتمل التنفيذ والتحقق من استدعاء قدرة ركيزة.':'تم تشغيل العملية، لكن لم أتمكن من التحقق النهائي من نتيجتها.')+'</div></div>'}

async function stageRoster(draft,text){
  const p=periodFromText(text)||draft.period||nextWeek();draft=clone(draft);draft.period=clone(p);draft.updatedAt=new Date().toISOString();draft.status='draft';setDraft(draft);
  const check=AI.rosterOperational?.validateDraft?.(draft);if(check&&!check.ok){const issue=check.issues?.[0];return'<b>المسودة محفوظة، لكن لا يمكن تحويلها للتشغيل بعد.</b><div class="notice" style="margin-top:8px">'+esc(issue?.message||'توجد بيانات ناقصة.')+'</div>'+(AI.conversation?.renderRosterDraft?.(draft)||'')}
  const res=await CAPS.execute('roster.stage',{draft:draft},{approved:true});if(!res.ok)return receiptHtml(res);
  CAPS.prepare('roster.save',{week_start:draft.period.start},{source:'roster_operational_draft'});STATE.goal={domain:'attendance',capability:'roster.save',status:'awaiting_approval'};
  return'<div class="notice ok"><b>حوّلت خطة التواجد إلى مسودة تشغيلية قابلة للاستخدام.</b><div style="margin-top:5px">الفترة: '+esc(draft.period.start)+' إلى '+esc(draft.period.end)+'. فتحت جدول الخطة وعبأته للمراجعة.</div></div><div class="notice" style="margin-top:8px">لم تُحفظ الخطة الأصلية بعد. عدّلها إن رغبت، ثم قل <b>اعتمد الحفظ</b> أو استخدم زر الاعتماد داخل الجدول.</div>';
}

async function createRoster(text){
  let draft=currentDraft(),period=periodFromText(text)||nextWeek();if(draft)return AI.conversation?.renderRosterDraft?.(draft)||'<b>مسودة خطة التواجد موجودة.</b>';
  try{const found=await AI.dialogue?.findRoster?.('latest');if(found?.rows?.length&&AI.dialogue?.rosterRowsToDraft){draft=AI.dialogue.rosterRowsToDraft(found.rows,period,found.period);setDraft(draft);STATE.goal={domain:'attendance',capability:'roster.stage',status:'draft'};return'<div class="notice ok"><b>جهزت مسودة خطة تواجد للفترة '+esc(period.start)+' إلى '+esc(period.end)+' اعتمادًا على آخر خطة محفوظة كنقطة بداية.</b><div style="margin-top:5px">لم أفترض توزيعًا جديدًا من عندي؛ يمكنك تعديل أي موظف أو يوم ثم تحويلها لمسودة تشغيلية.</div></div>'+(AI.conversation?.renderRosterDraft?.(draft)||'')}}catch(e){console.warn('Rakiza roster baseline unavailable',e)}
  const C=AI.conversation;if(C?.interpret&&C?.respond){const f=C.interpret(text,{raw:text,entities:{domain:'attendance'}}),html=await C.respond(f),d=currentDraft();if(d){if(!d.period){d.period=period;setDraft(d)}STATE.goal={domain:'attendance',capability:'roster.stage',status:'draft'};return html}}
  STATE.goal={domain:'attendance',capability:'roster.stage',status:'needs_input'};
  return'<b>لا توجد خطة تواجد محفوظة أبني عليها.</b><div class="mut" style="margin-top:6px">أرسل توزيع دوام الموظفين وإجازاتهم، وسأحوّله مباشرة إلى مسودة للأسبوع المطلوب دون افتراض بيانات من عندي.</div>';
}

function employeeFromText(text){const n=norm(text),hits=(app().employees||[]).filter(e=>{const full=norm(empName(e)),parts=full.split(' ').filter(x=>x.length>=3);return(full&&n.includes(full))||parts.some(p=>new RegExp('(?:^| )'+p+'(?: |$)').test(n))});return hits.length===1?hits[0]:null}
function actionFromText(text,type=null){const n=norm(text),rows=(app().actions||[]).filter(x=>!type||x.action_type===type),hits=rows.filter(x=>{const s=norm(x.subject||'');return s&&(n.includes(s)||s.split(' ').filter(w=>w.length>=4).filter(w=>n.includes(w)).length>=2)});return hits.length===1?hits[0]:rows.length===1?rows[0]:null}
function dateFromText(text){const m=String(text).match(/(20\d{2})[-\/]([01]?\d)[-\/]([0-3]?\d)/);return m?m[1]+'-'+String(+m[2]).padStart(2,'0')+'-'+String(+m[3]).padStart(2,'0'):baseDate()}
function numbers(text){return[...String(text).matchAll(/(?:^|\s)([\d٠-٩۰-۹][\d٠-٩۰-۹,٬]*)/g)].map(m=>Number(m[1].replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[,٬]/g,''))).filter(Number.isFinite)}
function after(text,re){const m=String(text).match(re);return m?m[1].trim():''}
function idFromText(text){return after(text,/(?:رقم|معرف|id)\s*[:：#-]?\s*([\w-]+)/i)}
function rosterStatus(text){const n=norm(text);if(/صباح|صباحي/.test(n))return'Morning';if(/مساء|مسائي/.test(n))return'Evening';if(/سنويه|سنوية/.test(n))return'A/L';if(/سكليف|مرضي/.test(n))return'S/L';if(/تعويضي/.test(n))return'تعويضي';if(/مهمه عمل/.test(n))return'مهمة عمل';if(/اجازه|اجازة|اوف|راحه/.test(n))return'D/O';return null}
function weekdayDate(text){const n=norm(text),days=[['الاحد',0],['الاثنين',1],['الثلاثاء',2],['الثلوث',2],['الاربعاء',3],['الربوع',3],['الخميس',4],['الجمعه',5],['السبت',6]],hit=days.find(x=>n.includes(x[0]));if(!hit)return null;const p=periodFromText(text),start=p?.start||sunday(baseDate());return addDays(start,hit[1])}
function shortagePlan(text){
  const n=norm(text),section=(app().sections||[]).filter(s=>n.includes(norm(s.name))).sort((a,b)=>norm(b.name).length-norm(a.name).length)[0],reporter=employeeFromText(text),size=after(text,/(?:مقاس|صنف|منتج)\s*[:：]?\s*([a-zA-Z0-9٠-٩۰-۹\/.-]+)/i),current=after(text,/(?:الموجود|متوفر)\s*[:：]?\s*(\d+)/i),requested=after(text,/(?:المطلوب|اطلب|طلب)\s*[:：]?\s*(\d+)/i),lost=after(text,/(?:فرص|فرصة)\s*(?:ضائعه|ضائعة)?\s*[:：]?\s*(\d+)/i);
  if(!section&&!size)return null;const row=size?{size:size,current_qty:current===''?0:Number(current),requested_qty:requested===''?0:Number(requested),lost_opportunities:lost===''?0:Number(lost)}:null;
  return{id:'shortages.record',args:{section_id:section?.id,reporter_employee_id:reporter?.id,rows:row?[row]:[]}};
}

function completePending(text){
  const p=CAPS.state.pending;if(!p||!p.missing?.length)return null;const key=p.missing[0],patch={};
  if(key==='subject'){patch.subject=String(text).trim();if(p.missing.includes('description'))patch.description=String(text).trim()}
  else if(key==='description')patch.description=String(text).trim();
  else if(key==='request_date'||key==='work_date')patch[key]=dateFromText(text);
  else if(key==='employee_id'||key==='reporter_employee_id')patch[key]=employeeFromText(text)?.id;
  else if(key==='new_status')patch.new_status=rosterStatus(text);
  else if(key==='reason'||key==='raised_to'||key==='resolution_result')patch[key]=String(text).trim();
  else if(key==='id')patch.id=idFromText(text)||actionFromText(text,p.id.startsWith('maintenance.')?'صيانة':p.id.startsWith('shortages.')?'نواقص':null)?.id;
  else if(key==='monthly_target'||key==='daily_target')patch[key]=numbers(text)[0];
  else if(key==='section_id')patch.section_id=(app().sections||[]).find(s=>norm(text).includes(norm(s.name)))?.id;
  else if(key==='rows'){const plan=shortagePlan(text);patch.rows=plan?.args?.rows}
  const r=CAPS.updatePending(patch);return pendingHtml(r.pending);
}

function operationalPlan(text){
  const n=norm(text),date=dateFromText(text);
  if(/^(?:ارجع|روح|افتح) (?:لل)?رئيسي/.test(n))return{id:'navigate.home',args:{}};
  const nav=[['navigate.daily_cycle',/افتح.*دورة التشغيل|روح.*دورة التشغيل/],['navigate.targets',/افتح.*المستهدف/],['navigate.opening',/افتح.*(?:بدء اليوم|الافتتاح|الجاهزيه)/],['navigate.day_plan',/افتح.*خطة اليوم/],['navigate.closing',/افتح.*اغلاق اليوم/],['navigate.roster',/افتح.*خطة التواجد/],['navigate.sales',/افتح.*(?:المبيعات|ملخص المبيعات)/],['navigate.history',/افتح.*سجل الايام/],['navigate.shortages',/افتح.*النواقص/],['navigate.daily_actions',/افتح.*الاجراءات اليوميه/],['navigate.followups',/افتح.*المتابعات/]];for(const row of nav)if(row[1].test(n))return{id:row[0],args:{}};
  if(/(?:ابدأ|ابدا|بدء) (?:يوم|اليوم|التشغيل)/.test(n))return{id:'day.start',args:{}};
  if(approved(text)&&/(?:بدء اليوم|الافتتاح|افتتاح|الجاهزيه)/.test(n))return{id:'opening.approve',args:{},approved:true};
  if(approved(text)&&/خطة اليوم/.test(n))return{id:'day_plan.approve',args:{},approved:true};
  if(/احفظ.*(?:تواجد الفريق|الحضور)/.test(n))return{id:'attendance.save',args:{}};
  if(approved(text)&&/اغلاق اليوم/.test(n))return{id:'day.close',args:{},approved:true};
  if(/(?:احفظ|عدل|غير).*(?:تارقت|مستهدف)/.test(n)){const nums=numbers(text);return{id:'sales.save',args:{monthly_target:nums[0],daily_target:nums[1]}}}
  if(/(?:ارفع|استورد|استيراد).*(?:ملف|اكسل).*(?:المستهدف|التارقت)|(?:ارفع|استورد).*(?:المستهدف|التارقت)/.test(n))return{id:'targets.import',args:{}};
  if(/(?:سجل|اضف|أضف).*(?:نقص|ناقص|نواقص)/.test(n))return shortagePlan(text);
  if(/(?:صدر|تصدير).*(?:النواقص|اكسل)/.test(n))return{id:'shortages.export',args:{}};
  if(/(?:تم الطلب|سجل.*الطلب|اعتمد.*الطلب).*(?:نقص|ناقص|تغذيه)/.test(n))return{id:'shortages.order',args:{id:idFromText(text)}};
  if(/(?:وصلت|تمت).*(?:التغذيه|التغذية)/.test(n)){const x=actionFromText(text,'نواقص');return{id:'shortages.supplied',args:{id:idFromText(text)||x?.id}}}
  if(/(?:لم تصل|ما وصلت|لم تتم).*(?:التغذيه|التغذية)/.test(n)){const x=actionFromText(text,'نواقص');return{id:'shortages.not_supplied',args:{id:idFromText(text)||x?.id}}}
  if(/(?:صعد|تصعيد|ارفع).*(?:النقص|نقص|التغذيه|التغذية)/.test(n)){const x=actionFromText(text,'نواقص'),to=after(text,/(?:الى|إلى|لـ|ل)\s+([^،,]+?)(?:\s+بسبب|\s+لان|$)/),reason=after(text,/(?:بسبب|لان|لأن|السبب)\s*[:：]?\s*(.+)$/i);return{id:'shortages.escalate',args:{id:idFromText(text)||x?.id,raised_to:to,reason:reason}}}
  if(/(?:غير|عدل|بدل).*(?:دوام|شفت|تواجد)/.test(n)){const e=employeeFromText(text),status=rosterStatus(text),work=weekdayDate(text)||dateFromText(text),reason=after(text,/(?:بسبب|السبب)\s*[:：]?\s*(.+)$/i);return{id:'roster.change',args:{work_date:work,employee_id:e?.id,new_status:status,reason:reason}}}
  if(/(?:سجل|انشئ|افتح).*(?:عطل|صيانه)/.test(n)){const subject=after(text,/(?:عطل(?:\s+صيانة)?|صيانة|صيانه)\s*(?:في|بخصوص|:)?\s*(.*)$/i);return{id:'maintenance.create',args:{subject:subject,description:subject,request_date:date}}}
  if(/(?:سجل|انشئ|افتح).*(?:اجراء|إجراء|طلب دعم|مشكلة عميل)/.test(n)){const type=/طلب دعم/.test(n)?'طلب دعم':/مشكله عميل|شكوى/.test(n)?'مشكلة عميل':'أخرى',subject=after(text,/(?:اجراء|إجراء|طلب دعم|مشكلة عميل|مشكله عميل)\s*(?:بخصوص|عن|:)?\s*(.+)$/i);return{id:'daily_action.create',args:{action_type:type,subject:subject,description:subject,request_date:date}}}
  if(/(?:ابدأ|ابدا).*معالج/.test(n)){const x=actionFromText(text);return{id:'daily_action.start',args:{id:x?.id}}}
  if(/(?:تمت المعالجه|اغلق الاجراء)/.test(n)){const x=actionFromText(text),result=after(text,/(?:النتيجة|النتيجه|بنتيجة|بنتيجه)\s*[:：]?\s*(.+)$/i);return{id:'daily_action.finish',args:{id:x?.id,resolution_result:result}}}
  if(/تم رفع.*صيانه|رفعنا.*صيانه/.test(n)){const x=actionFromText(text,'صيانة'),to=after(text,/(?:الى|إلى|لـ|ل)\s+(.+)$/);return{id:'maintenance.raise',args:{id:x?.id,raised_to:to}}}
  if(/ابدأ.*متابعة.*صيانه/.test(n)){const x=actionFromText(text,'صيانة');return{id:'maintenance.follow',args:{id:x?.id}}}
  if(/تمت الصيانه|اكتملت الصيانه/.test(n)){const x=actionFromText(text,'صيانة');return{id:'maintenance.repaired',args:{id:x?.id}}}
  if(/تحقق.*اغلق.*صيانه|اغلق.*بعد التحقق/.test(n)){const x=actionFromText(text,'صيانة'),result=after(text,/(?:النتيجة|النتيجه|بنتيجة|بنتيجه)\s*[:：]?\s*(.+)$/i)||'تمت الصيانة والتحقق';return{id:'maintenance.close',args:{id:x?.id,resolution_result:result}}}
  if(/(?:احذف|الغ).*تغيير.*تواجد/.test(n)){const id=after(text,/(?:رقم|id)\s*[:：]?\s*([\w-]+)/i);return{id:'roster.change.delete',args:{id:id}}}
  return null;
}

async function modelPlan(text){
  const cfg=window.RAKIZA_AI_MODEL;if(!cfg?.endpoint)return null;STATE.model.enabled=true;
  try{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000),body={text:text,context:{goal:STATE.goal,pending:CAPS.state.pending,lastTurns:STATE.turns.slice(-8)},capabilities:CAPS.list().map(x=>({id:x.id,label:x.label,domain:x.domain,mode:x.mode}))};const r=await fetch(cfg.endpoint,{method:'POST',headers:{'content-type':'application/json',...(cfg.headers||{})},body:JSON.stringify(body),signal:controller.signal});clearTimeout(timer);if(!r.ok)throw Error('model '+r.status);const plan=await r.json();if(!CAPS.get(plan?.capability_id))throw Error('invalid capability');return{id:plan.capability_id,args:plan.args||{},approved:false,model:true,confidence:plan.confidence}}
  catch(e){STATE.model.lastError=String(e?.message||e);return null}
}

async function handle(text){
  const n=norm(text),draft=currentDraft();
  if(CAPS.cancelText(text)){CAPS.cancel();STATE.goal=null;return'<b>ألغيت العملية المعلقة.</b><div class="mut">لم يتغير أي سجل تشغيلي.</div>'}
  if(isCapabilityQuestion(n))return capabilitySummary();
  if(isAck(n)){if(CAPS.state.pending)return pendingHtml();if(draft)return'<b>تمام.</b> مسودة خطة التواجد محفوظة في السياق، ويمكنك تعديلها أو تحويلها لمسودة تشغيلية.';return'<b>تمام، أكمل طلبك.</b>'}
  if(CAPS.state.pending&&!approved(text)){const completed=completePending(text);if(completed)return completed}
  if(draft&&(/اعرض.*(?:المسوده|الخطة|الخطه)|ورني.*(?:المسوده|الخطة|الخطه)/.test(n))&&!operationalDraftRequest(n))return AI.conversation?.renderRosterDraft?.(draft)||'<b>مسودة خطة التواجد جاهزة.</b>';
  if(CAPS.state.pending&&approved(text)){
    const pendingId=CAPS.state.pending.id,result=await CAPS.approve(text);
    if(result.ok&&pendingId==='roster.save'){
      const d=AI.conversation?.state?.pending?.draft;if(d?.kind==='roster'){d.status='saved';d.savedAt=new Date().toISOString();AI.conversation.state.context=AI.conversation.state.context||{};AI.conversation.state.context.lastSavedRoster=clone(d)}
      STATE.goal={domain:'attendance',capability:'roster.save',status:'completed'};
    }
    return receiptHtml(result);
  }
  if(draft&&(operationalDraftRequest(n)||approved(text)))return stageRoster(draft,text);
  if(approved(text)&&!CAPS.state.pending){
    const explicit=operationalPlan(text),cap=CAPS.get(explicit?.id),need=explicit?CAPS.required(explicit.id).filter(k=>explicit.args?.[k]===undefined||explicit.args?.[k]===null||explicit.args?.[k]===''||(Array.isArray(explicit.args?.[k])&&!explicit.args[k].length)):[];
    if(explicit&&cap?.approval&&!need.length)return receiptHtml(await CAPS.execute(explicit.id,explicit.args,{approved:true}));
    return'<b>لا توجد عملية جاهزة للاعتماد.</b><div class="mut">حدد الخطة أو الإجراء الذي تريد اعتماده، وسأحافظ على سياقه حتى التنفيذ.</div>';
  }
  if(rosterRequest(n)&&createRequest(n))return createRoster(text);
  if(createRequest(n)&&/(?:الافتتاح|الجاهزيه|بدء اليوم)/.test(n))return receiptHtml(await CAPS.execute('navigate.opening',{}, {approved:true}));
  if(createRequest(n)&&/خطة اليوم/.test(n))return receiptHtml(await CAPS.execute('navigate.day_plan',{}, {approved:true}));
  if(createRequest(n)&&/اغلاق اليوم/.test(n))return receiptHtml(await CAPS.execute('navigate.closing',{}, {approved:true}));
  const plan=await modelPlan(text)||operationalPlan(text);if(!plan)return null;const cap=CAPS.get(plan.id);if(!cap)return null;
  STATE.goal={domain:cap.domain,capability:cap.id,status:cap.approval?'review':'executing',text:text};
  if(plan.approved)return receiptHtml(await CAPS.execute(plan.id,plan.args,{approved:true}));
  if(cap.approval){const prepared=CAPS.prepare(plan.id,plan.args,{source:plan.model?'model':'internal',text:text});return pendingHtml(prepared.pending)}
  return receiptHtml(await CAPS.execute(plan.id,plan.args,{approved:true}));
}

const wrapped=async function(){const input=document.getElementById('assistantInput'),q=input?.value?.trim();if(!q)return;if(STATE.busy)return;STATE.busy=true;let html=null;try{html=await handle(q)}catch(e){html='<div class="notice err"><b>تعذر إكمال الطلب.</b><div style="margin-top:5px">'+esc(e?.message||e)+'</div></div>'}finally{STATE.busy=false}if(html==null){if(typeof baseAsk==='function')return baseAsk.apply(this,arguments);return}if(input)input.value='';chat('user',esc(q));chat('assistant',html);record('user',q,{handled:true,goal:STATE.goal});record('assistant','',{html:html,goal:STATE.goal})};
wrapped.__rakizaOrchestratorWrapped=true;wrapped.__base=baseAsk;window.askRakizaAssistant=wrapped;

AI.orchestrator={version:VERSION,state:STATE,handle:handle,operationalPlan:operationalPlan,periodFromText:periodFromText,stageRoster:stageRoster,createRoster:createRoster,modelPlan:modelPlan,reset(){STATE.goal=null;STATE.turns=[];STATE.busy=false;CAPS.cancel()}};
const baseOpen=window.openAssistant;
function refreshAssistantCopy(){const sec=document.getElementById('assistant');if(!sec)return;const sub=sec.querySelector?.('.top .sub'),notice=sec.querySelector?.('.notice'),suggest=document.getElementById('assistantSuggestions'),input=document.getElementById('assistantInput');if(sub)sub.textContent='محرك ركيزة الهجين — فهم، تنفيذ، واعتماد';if(notice)notice.innerHTML='<b>ركيزة AI مرتبط بقدرات النظام الفعلية.</b><div style="margin-top:5px">يفهم هدفك، يحافظ على السياق، ويجهز العمليات للتنفيذ. لا يتم أي حفظ تشغيلي دون اعتمادك.</div>';if(suggest)suggest.innerHTML='<button class="mini" onclick="askAssistantQuick(\'وش أهم أولوياتي اليوم؟\')">أولويات اليوم</button><button class="mini" onclick="askAssistantQuick(\'قم بعمل خطة تواجد\')">خطة تواجد</button><button class="mini" onclick="askAssistantQuick(\'سجل عطل صيانة في المكيف الرئيسي\')">تسجيل صيانة</button><button class="mini" onclick="askAssistantQuick(\'صدر ملف Excel للنواقص\')">تصدير النواقص</button>';if(input)input.placeholder='اكتب ما تريد تنفيذه أو تحليله بطريقتك الطبيعية'}
if(typeof baseOpen==='function')window.openAssistant=function(){const r=baseOpen.apply(this,arguments);refreshAssistantCopy();setTimeout(refreshAssistantCopy,0);return r};
refreshAssistantCopy();
})();
