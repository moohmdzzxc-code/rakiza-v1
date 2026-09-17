(()=>{
'use strict';

const AI=window.RakizaAI=window.RakizaAI||{};
if(AI.capabilities?.version)return;

const VERSION='1.0.0';
const STATE={pending:null,lastReceipt:null,history:[]};

const CATALOG=[
  ['navigate.home','التوجه للرئيسية','navigation','read','home'],
  ['navigate.daily_cycle','فتح دورة التشغيل اليومي','navigation','read','openDailyCycle'],
  ['navigate.targets','فتح المستهدفات','navigation','read','openTargets'],
  ['navigate.opening','فتح بدء اليوم والجاهزية','navigation','read','openOpening'],
  ['navigate.day_plan','فتح خطة اليوم','navigation','read','openDayPlan'],
  ['navigate.closing','فتح إغلاق اليوم','navigation','read','openClose'],
  ['navigate.roster','فتح خطة التواجد','navigation','read','openRoster'],
  ['navigate.sales','فتح ملخص المبيعات','navigation','read','openSales'],
  ['navigate.history','فتح سجل الأيام','navigation','read','openHistory'],
  ['navigate.shortages','فتح النواقص والطلبات','navigation','read','openShortages'],
  ['navigate.daily_actions','فتح الإجراءات اليومية','navigation','read','openDailyActions'],
  ['navigate.followups','فتح المتابعات','navigation','read','openFollowups'],
  ['read.sales','قراءة وتحليل المبيعات','sales','read','sales'],
  ['read.shortages','قراءة وتحليل النواقص','shortages','read','shortages'],
  ['read.readiness','قراءة وتحليل الجاهزية','readiness','read','readiness'],
  ['read.attendance','قراءة الحضور وخطة التواجد','attendance','read','attendance'],
  ['read.tasks','قراءة المهام والتنفيذ','tasks','read','tasks'],
  ['read.actions','قراءة الإجراءات والمتابعات','actions','read','actions'],
  ['read.store','التحليل الشامل للمعرض','store','read','store'],
  ['day.start','بدء يوم التشغيل','daily_cycle','write','startDay'],
  ['opening.approve','اعتماد افتتاح اليوم','daily_cycle','write','approveOpening'],
  ['day_plan.approve','اعتماد خطة اليوم','daily_cycle','write','approvePlan'],
  ['attendance.save','حفظ تواجد الفريق','attendance','write','saveTeam'],
  ['day.close','اعتماد إغلاق اليوم','daily_cycle','write','approveClose'],
  ['sales.save','حفظ مستهدفات ملخص المبيعات','sales','write','saveSalesStatus'],
  ['employees.save','حفظ فريق المعرض','attendance','write','saveEmployees'],
  ['roster.stage','تحويل خطة التواجد لمسودة تشغيلية','attendance','draft','rosterStage'],
  ['roster.save','اعتماد وحفظ خطة التواجد الأصلية','attendance','write','saveRoster'],
  ['roster.change','حفظ تغيير على خطة التواجد','attendance','write','saveRosterChange'],
  ['roster.copy','نسخ خطة تواجد أسبوع سابق','attendance','draft','copyPreviousRoster'],
  ['shortages.record','تسجيل نواقص','shortages','write','shortage-save'],
  ['shortages.export','تصدير Excel للنواقص المفتوحة','shortages','write','exportShortagesExcel'],
  ['shortages.order','تسجيل تم الطلب وتحويله للمتابعة','shortages','write','orderShortage'],
  ['shortages.supplied','تسجيل وصول التغذية وإغلاق المتابعة','shortages','write','followupShortageYes'],
  ['shortages.not_supplied','تحديث أن التغذية لم تصل','shortages','write','followupShortageNo'],
  ['shortages.escalate','تصعيد متابعة نقص','shortages','write','followupShortageEscalate'],
  ['daily_action.create','تسجيل إجراء يومي','actions','write','action-save'],
  ['daily_action.start','بدء معالجة إجراء يومي','actions','write','startDailyAction'],
  ['daily_action.finish','إغلاق إجراء يومي بنتيجة','actions','write','finishDailyAction'],
  ['maintenance.create','تسجيل عطل صيانة','actions','write','action-save'],
  ['maintenance.raise','تسجيل رفع طلب الصيانة','actions','write','maintenanceRaised'],
  ['maintenance.follow','بدء متابعة الصيانة','actions','write','maintenanceStartFollow'],
  ['maintenance.repaired','تسجيل إتمام الصيانة','actions','write','maintenanceRepaired'],
  ['maintenance.close','التحقق من الصيانة وإغلاقها','actions','write','maintenanceVerifyClose'],
  ['targets.import','رفع واعتماد مستهدفات الشهر','sales','interactive','openTargets'],
  ['roster.change.delete','حذف تغيير خطة تواجد','attendance','destructive','deleteRosterChange']
].map(([id,label,domain,mode,handler])=>({id,label,domain,mode,handler,approval:['write','destructive'].includes(mode)}));

const REQUIRED={
  'sales.save':['monthly_target'],
  'roster.change':['work_date','employee_id','new_status','reason'],
  'shortages.record':['section_id','reporter_employee_id','rows'],
  'shortages.order':['id'],
  'shortages.supplied':['id'],
  'shortages.not_supplied':['id'],
  'shortages.escalate':['id','raised_to','reason'],
  'daily_action.create':['action_type','subject','description','request_date'],
  'daily_action.start':['id'],
  'daily_action.finish':['id','resolution_result'],
  'maintenance.create':['subject','description','request_date'],
  'maintenance.raise':['id','raised_to'],
  'maintenance.follow':['id'],
  'maintenance.repaired':['id'],
  'maintenance.close':['id','resolution_result'],
  'roster.change.delete':['id']
};

function clone(v){try{return JSON.parse(JSON.stringify(v))}catch{return v}}
function get(id){return CATALOG.find(x=>x.id===id)||null}
function app(){return window.app||{}}
function el(id){return document.getElementById(id)}
function fn(name){return typeof window[name]==='function'?window[name]:null}
function missing(id,args={}){return(REQUIRED[id]||[]).filter(k=>args[k]===undefined||args[k]===null||args[k]===''||(Array.isArray(args[k])&&!args[k].length))}
function now(){return new Date().toISOString()}
function record(type,data){STATE.history.push({type,at:now(),...clone(data)});if(STATE.history.length>100)STATE.history.splice(0,STATE.history.length-100)}
function approvalText(v){const n=String(v||'').trim().replace(/[ًٌٍَُِّْـ]/g,'');return /^(اعتمد|اعتمدها|اعتمده|اعتمد الخطة|اعتمد المسودة|اعتمد واحفظ|اعتمد الحفظ|نفذ الاعتماد)(?:\s|$)/.test(n)}
function cancelText(v){return /^(الغ|ألغي|الغي|إلغاء|الغاء|لا تعتمد|تراجع)(?:\s|$)/.test(String(v||'').trim())}

function prepare(id,args={},meta={}){
  const cap=get(id);if(!cap)return{ok:false,code:'unknown_capability',message:'القدرة المطلوبة غير مسجلة في ركيزة.'};
  const need=missing(id,args);
  const pending={id,args:clone(args),meta:clone(meta),createdAt:now(),status:need.length?'needs_input':'ready',missing:need};
  STATE.pending=pending;record('prepared',pending);
  return{ok:!need.length,capability:clone(cap),pending:clone(pending),missing:need};
}

function updatePending(args={}){
  if(!STATE.pending)return{ok:false,code:'no_pending'};
  STATE.pending.args={...STATE.pending.args,...clone(args)};
  STATE.pending.missing=missing(STATE.pending.id,STATE.pending.args);
  STATE.pending.status=STATE.pending.missing.length?'needs_input':'ready';
  record('updated',STATE.pending);return{ok:!STATE.pending.missing.length,pending:clone(STATE.pending),missing:clone(STATE.pending.missing)};
}

function actionBody(x,extra={}){return{id:x.id,action_type:x.action_type,subject:x.subject,description:x.description||'',request_date:x.request_date||app().date,raised_to:x.raised_to||'',action_status:x.action_status||'قيد المتابعة',last_update:x.last_update||app().date,resolution_result:x.resolution_result||'',...extra}}
async function api(name,options){if(typeof window.api!=='function')throw Error('واجهة بيانات ركيزة غير متاحة');return window.api(name,options)}
async function refresh(){if(fn('refresh'))await fn('refresh')()}
function action(id){return(app().actions||[]).find(x=>String(x.id)===String(id))||null}
function actionMatches(id,expected={}){const row=action(id);return!!row&&Object.entries(expected).every(([k,v])=>String(row[k]??'')===String(v??''))}

async function executeRead(cap,args){const mod=AI[cap.handler];if(typeof mod?.answer!=='function')throw Error(`وحدة ${cap.label} غير متاحة`);return{result:await mod.answer(args.text||'',args.analysis||{}),verified:true}}
async function executeNavigation(cap,args){const h=fn(cap.handler);if(!h)throw Error(`شاشة ${cap.label} غير متاحة`);await h(...(args.callArgs||[]));return{result:cap.label,verified:true}}

async function executeWrite(cap,args){
  let h,x,res;
  switch(cap.id){
    case'day.start':case'opening.approve':case'day_plan.approve':case'attendance.save':case'day.close':case'employees.save':case'roster.copy':{
      h=fn(cap.handler);if(!h)throw Error(`وظيفة ${cap.label} غير متاحة`);await h();
      let verified=false;
      if(cap.id==='day.start')verified=!!app().day;
      if(cap.id==='opening.approve')verified=!!app().day?.opening_approved_at;
      if(cap.id==='day_plan.approve')verified=!!(app().day?.plan_id||app().day?.day_type);
      if(cap.id==='attendance.save')verified=Array.isArray(app().attendance);
      if(cap.id==='day.close')verified=app().day?.status==='مغلق';
      if(cap.id==='roster.copy')verified=!!el('rosterGrid')&&el('rosterGrid').dataset.saved!=='1';
      return{result:cap.label,verified};
    }
    case'roster.stage':
      if(!AI.rosterOperational?.stage)throw Error('ربط مسودة خطة التواجد غير متاح');res=await AI.rosterOperational.stage(args.draft);if(!res?.ok)throw Error(res?.message||'تعذر تجهيز المسودة التشغيلية');return{result:res,verified:true};
    case'roster.save':{
      const grid=el('rosterGrid'),week=el('weekStart')?.value||args.week_start;if(!grid||!week)throw Error('مسودة خطة التواجد التشغيلية غير متاحة');if(grid.dataset.saved==='1')throw Error('الخطة الأصلية محفوظة ولا يمكن الكتابة فوقها');
      const start=new Date(week+'T12:00:00'),dates=Array.from({length:7},(_,i)=>{const d=new Date(start);d.setDate(d.getDate()+i);return d.toISOString().slice(0,10)}),entries=[];
      for(const row of grid.querySelectorAll('tr'))for(const date of dates){const value=row.querySelector(`[data-date="${date}"]`)?.value;if(value)entries.push({employee_id:row.dataset.emp,work_date:date,planned_status:value})}
      if(!entries.length)throw Error('المسودة التشغيلية لا تحتوي أي دوام لحفظه');
      res=await api('roster-save',{method:'POST',body:{week_start:week,week_end:dates[6],prepared_by:el('rosterBy')?.value||args.prepared_by||null,entries}});
      const saved=await api('roster-get',{q:{week_start:week}});if(!saved?.header)throw Error('تم إرسال الخطة لكن تعذر التحقق من حفظها');await refresh();if(fn('prepareRoster'))await fn('prepareRoster')();return{result:{week_start:week,week_end:dates[6],entries:entries.length},verified:true};
    }
    case'sales.save':{
      if(fn('openSales'))await fn('openSales')();if(!el('salesMonthlyTarget'))throw Error('شاشة ملخص المبيعات غير متاحة');el('salesMonthlyTarget').value=args.monthly_target;if(el('salesDailyTarget')&&args.daily_target!==undefined)el('salesDailyTarget').value=args.daily_target;h=fn('saveSalesStatus');if(!h)throw Error('حفظ ملخص المبيعات غير متاح');await h();
      const actual=Number(app().day?.monthly_target_snapshot??app().monthlyTarget);return{result:{monthly_target:args.monthly_target,daily_target:args.daily_target},verified:Number.isFinite(actual)&&actual===Number(args.monthly_target)};
    }
    case'roster.change':{
      const week=el('weekStart')?.value||args.week_start||(()=>{const d=new Date(args.work_date+'T12:00:00');d.setDate(d.getDate()-d.getDay());return d.toISOString().slice(0,10)})();
      res=await api('roster-change-save',{method:'POST',body:{week_start:week,work_date:args.work_date,employee_id:args.employee_id,new_status:args.new_status,reason:args.reason,changed_by:args.changed_by||null}});
      const saved=await api('roster-get',{q:{week_start:week}}),row=(saved?.entries||[]).find(e=>String(e.employee_id)===String(args.employee_id)&&e.work_date===args.work_date);if(!row||row.planned_status!==args.new_status)throw Error('تم إرسال التغيير لكن تعذر التحقق من تطبيقه');await refresh();if(fn('prepareRoster'))await fn('prepareRoster')();return{result:{...clone(args),count:res?.count},verified:true};
    }
    case'shortages.record':
      res=await api('shortage-save',{method:'POST',body:{section_id:args.section_id,reporter_employee_id:args.reporter_employee_id,rows:args.rows}});await refresh();return{result:res,verified:true};
    case'shortages.export':{
      const before=await api('shortages'),open=(Array.isArray(before)?before:[]).filter(s=>s.shortage_status==='مفتوح');if(!open.length)throw Error('لا توجد نواقص مفتوحة لتصديرها');h=fn('exportShortagesExcel');if(!h)throw Error('تصدير النواقص غير متاح');await h();const after=await api('shortages'),verified=open.every(old=>(Array.isArray(after)?after:[]).find(s=>String(s.id)===String(old.id))?.excel_exported_at);if(!verified)throw Error('تم تشغيل التصدير لكن تعذر التحقق من اعتماد الملف');return{result:{rows:open.length},verified:true};
    }
    case'shortages.order':{
      await api('shortage-close',{method:'POST',body:{id:args.id}});const rows=await api('shortages'),saved=(Array.isArray(rows)?rows:[]).find(s=>String(s.id)===String(args.id));if(!saved||saved.shortage_status!=='تم الطلب')throw Error('تم إرسال الطلب لكن تعذر التحقق من تحويله للمتابعة');await refresh();return{result:{id:args.id},verified:true};
    }
    case'daily_action.create':
      res=await api('action-save',{method:'POST',body:{action_type:args.action_type,subject:args.subject,description:args.description,request_date:args.request_date,raised_to:'',action_status:'جديد',last_update:args.request_date,resolution_result:''}});await refresh();return{result:res,verified:!!(app().actions||[]).find(a=>a.subject===args.subject)};
    case'maintenance.create':
      res=await api('action-save',{method:'POST',body:{action_type:'صيانة',subject:args.subject,description:args.description,request_date:args.request_date,raised_to:'',action_status:'جديد',last_update:args.request_date,resolution_result:''}});await refresh();return{result:res,verified:!!(app().actions||[]).find(a=>a.action_type==='صيانة'&&a.subject===args.subject)};
    case'daily_action.start':
      x=action(args.id);if(!x)throw Error('الإجراء غير موجود');res=await api('action-save',{method:'POST',body:actionBody(x,{action_status:'قيد المتابعة',last_update:app().calendarDate||app().date})});await refresh();return{result:res,verified:actionMatches(args.id,{action_status:'قيد المتابعة'})};
    case'daily_action.finish':
      x=action(args.id);if(!x)throw Error('الإجراء غير موجود');res=await api('action-save',{method:'POST',body:actionBody(x,{action_status:'مغلق',resolution_result:args.resolution_result,last_update:app().calendarDate||app().date})});await refresh();return{result:res,verified:actionMatches(args.id,{action_status:'مغلق',resolution_result:args.resolution_result})};
    case'maintenance.raise':case'maintenance.follow':case'maintenance.repaired':case'maintenance.close':case'shortages.supplied':case'shortages.not_supplied':case'shortages.escalate':
      x=action(args.id);if(!x)throw Error('المتابعة المطلوبة غير موجودة');
      let expected={};
      if(cap.id==='maintenance.raise'){expected={raised_to:args.raised_to,action_status:'تم الرفع'};res=await api('action-save',{method:'POST',body:actionBody(x,{...expected,last_update:app().calendarDate||app().date})})}
      if(cap.id==='maintenance.follow')res=await api('action-save',{method:'POST',body:actionBody(x,{action_status:'قيد المتابعة',last_update:app().calendarDate||app().date})});
      if(cap.id==='maintenance.follow')expected={action_status:'قيد المتابعة'};
      if(cap.id==='maintenance.repaired'){expected={action_status:'تم التنفيذ'};res=await api('action-save',{method:'POST',body:actionBody(x,{...expected,last_update:app().calendarDate||app().date})})}
      if(cap.id==='maintenance.close'){expected={action_status:'مغلق',resolution_result:args.resolution_result};res=await api('action-save',{method:'POST',body:actionBody(x,{...expected,last_update:app().calendarDate||app().date})})}
      if(cap.id==='shortages.supplied'){expected={action_status:'مغلق',resolution_result:'تمت التغذية'};res=await api('action-save',{method:'POST',body:actionBody(x,{...expected,last_update:app().calendarDate||app().date})})}
      if(cap.id==='shortages.not_supplied')res=await api('action-save',{method:'POST',body:actionBody(x,{last_update:app().calendarDate||app().date})});
      if(cap.id==='shortages.escalate'){expected={raised_to:args.raised_to,action_status:'تم الرفع',resolution_result:'[[RAKIZA_ESCALATION]]'+args.reason};res=await api('action-save',{method:'POST',body:actionBody(x,{...expected,last_update:app().calendarDate||app().date})})}
      await refresh();return{result:res,verified:Object.keys(expected).length?actionMatches(args.id,expected):!!action(args.id)};
    case'roster.change.delete':
      h=fn('deleteRosterChange');if(!h)throw Error('حذف تغيير خطة التواجد غير متاح');await h(args.id);return{result:{id:args.id},verified:true};
    case'targets.import':
      if(fn('openTargets'))await fn('openTargets')();return{result:'تتطلب هذه القدرة اختيار ملف Excel من الجهاز ثم مراجعته قبل الاعتماد',verified:true,interactive:true};
    default:throw Error(`لم يتم ربط منفذ القدرة ${cap.id}`);
  }
}

async function execute(id,args={},options={}){
  const cap=get(id);if(!cap)return{ok:false,code:'unknown_capability',message:'القدرة المطلوبة غير مسجلة في ركيزة.'};
  const need=missing(id,args);if(need.length)return{ok:false,code:'missing_input',missing:need,message:'توجد بيانات ناقصة قبل التنفيذ.'};
  if(cap.approval&&!options.approved)return{ok:false,code:'approval_required',message:'هذه العملية تحتاج اعتمادًا صريحًا قبل التنفيذ.'};
  const startedAt=now();
  try{
    const out=cap.id.startsWith('read.')?await executeRead(cap,args):cap.id.startsWith('navigate.')?await executeNavigation(cap,args):await executeWrite(cap,args);
    const receipt={id:cap.id,label:cap.label,status:'completed',verified:out.verified===true,result:clone(out.result),startedAt,completedAt:now()};STATE.lastReceipt=receipt;record('executed',receipt);return{ok:true,receipt,interactive:!!out.interactive};
  }catch(error){const receipt={id:cap.id,label:cap.label,status:'failed',verified:false,error:String(error?.message||error),startedAt,completedAt:now()};STATE.lastReceipt=receipt;record('failed',receipt);return{ok:false,code:'execution_failed',message:receipt.error,receipt};}
}

async function approve(text){
  if(!STATE.pending)return{ok:false,code:'no_pending',message:'لا توجد عملية جاهزة للاعتماد.'};
  if(!approvalText(text))return{ok:false,code:'approval_required',message:'اكتب «اعتمد» لتنفيذ العملية المعروضة.'};
  if(STATE.pending.missing?.length)return{ok:false,code:'missing_input',missing:clone(STATE.pending.missing),message:'لا يمكن الاعتماد قبل إكمال البيانات الناقصة.'};
  const p=clone(STATE.pending);STATE.pending=null;return execute(p.id,p.args,{approved:true,approvalText:text,meta:p.meta});
}
function cancel(){const p=STATE.pending;STATE.pending=null;if(p)record('cancelled',p);return{ok:true,cancelled:clone(p)}}

AI.capabilities={version:VERSION,state:STATE,catalog:CATALOG,get,list:(domain=null)=>clone(domain?CATALOG.filter(x=>x.domain===domain):CATALOG),prepare,updatePending,execute,approve,cancel,approvalText,cancelText,required:id=>clone(REQUIRED[id]||[])};
})();
