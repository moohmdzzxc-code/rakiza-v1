(()=>{
'use strict';

const AI=window.RakizaAI=window.RakizaAI||{};
if(AI.rosterOperational?.version)return;

const VERSION='1.0.0';
const STATUSES=new Set(['Morning','Evening','D/O','A/L','S/L','تعويضي','مهمة عمل']);

function clone(v){try{return JSON.parse(JSON.stringify(v))}catch{return v}}
function dObj(v){return new Date(String(v)+'T12:00:00')}
function iso(d){return d.toISOString().slice(0,10)}
function addDays(v,n){const d=dObj(v);d.setDate(d.getDate()+n);return iso(d)}
function dates7(start){return Array.from({length:7},(_,i)=>addDays(start,i))}
function fn(name){return typeof window[name]==='function'?window[name]:null}
function el(id){return document.getElementById(id)}
function refreshStaticCopy(){
  const note=document.querySelector?.('#assistant .notice div');
  if(note)note.textContent='يبني خطة التواجد معك حواريًا، وبعد مراجعتك ينقلها إلى جدول تشغيلي قابل للتعديل. لا تصبح الخطة محفوظة أو تشغيلية إلا بعد اعتمادها النهائي داخل شاشة خطة التواجد.';
}

function validateDraft(draft){
  const issues=[];
  if(!draft||draft.kind!=='roster')issues.push({code:'not_roster',message:'لا توجد مسودة خطة تواجد صالحة.'});
  if(!draft?.period?.start)issues.push({code:'missing_period',message:'حدد أسبوع الخطة قبل تحويلها إلى مسودة تشغيلية.'});
  if(!draft?.assignments?.length)issues.push({code:'missing_assignments',message:'المسودة لا تحتوي تكليفات يمكن نقلها.'});
  const unresolved=(draft?.assignments||[]).filter(a=>!a.resolved||!a.employee_id);
  if(unresolved.length)issues.push({code:'unresolved_people',message:'بقي اسم غير محدد في المسودة. حدده قبل التحويل التشغيلي.',assignments:clone(unresolved)});
  for(const a of draft?.assignments||[]){
    const values=[a.defaultStatus,...Object.values(a.overrides||{})].filter(Boolean);
    const invalid=values.filter(v=>!STATUSES.has(v));
    if(invalid.length)issues.push({code:'invalid_status',message:`توجد حالة دوام غير معتمدة للموظف ${a.employee?.full_name||a.mention||''}.`,values:invalid});
  }
  return{ok:issues.length===0,issues};
}

function buildEntries(draft){
  const check=validateDraft(draft);
  if(!check.ok)return{...check,entries:[]};
  const days=dates7(draft.period.start),entries=[];
  for(const a of draft.assignments){
    for(let day=0;day<7;day++){
      const status=(a.overrides||{})[day]??(a.overrides||{})[String(day)]??a.defaultStatus??'';
      if(status)entries.push({employee_id:String(a.employee_id),work_date:days[day],planned_status:status});
    }
  }
  return{ok:true,issues:[],entries,days};
}

function setupRosterScreen(weekStart){
  const show=fn('show'),renderEmployees=fn('renderEmployeeEditor'),options=fn('empOptions');
  if(show)show('roster');
  if(renderEmployees)renderEmployees();
  if(options){
    const html=options();
    for(const id of ['rosterBy','chgEmp','chgBy'])if(el(id))el(id).innerHTML=html;
  }
  el('weekStart').value=weekStart;
  if(el('copyWeekStart'))el('copyWeekStart').value=addDays(weekStart,-7);
}

async function stage(draft){
  const built=buildEntries(draft);
  if(!built.ok)return{ok:false,code:built.issues[0]?.code||'invalid_draft',message:built.issues[0]?.message||'تعذر تجهيز المسودة التشغيلية.',issues:built.issues};
  const required=['weekStart','rosterGrid','rosterState','saveRosterBtn'];
  if(required.some(id=>!el(id))||!fn('prepareRoster'))return{ok:false,code:'screen_unavailable',message:'شاشة خطة التواجد التشغيلية غير متاحة في هذه النسخة.'};

  setupRosterScreen(draft.period.start);
  await fn('prepareRoster')();

  const grid=el('rosterGrid');
  if(grid.dataset.saved==='1')return{ok:false,code:'already_saved',message:'توجد خطة أصلية محفوظة لهذا الأسبوع، لذلك لن أستبدلها. استخدم سجل التغييرات لتعديل الخطة المحفوظة.'};

  const entryMap=new Map(built.entries.map(x=>[`${x.employee_id}|${x.work_date}`,x.planned_status]));
  let applied=0,missing=0;
  for(const row of grid.querySelectorAll('tr')){
    const employeeId=String(row.dataset.emp||'');
    for(const date of built.days){
      const select=row.querySelector(`[data-date="${date}"]`);
      if(!select)continue;
      const value=entryMap.get(`${employeeId}|${date}`)||'';
      select.value=value;
      if(value)applied++;else missing++;
    }
  }

  if(fn('calcRosterTotals'))fn('calcRosterTotals')();
  const save=el('saveRosterBtn');
  save.textContent='اعتماد وحفظ الخطة الأصلية';
  save.dataset.draftSource='rakiza-ai';
  const missingNote=missing?` بقيت ${missing} خانة فارغة لتكملها أو تراجعها قبل الاعتماد النهائي.`:' جميع خانات الفريق المضمنة في الشاشة معبأة وجاهزة للمراجعة.';
  el('rosterState').innerHTML=`<div class="notice ok"><b>تم نقل مسودة ركيزة AI إلى الجدول التشغيلي.</b><div style="margin-top:5px">راجع التوزيع وعدّله عند الحاجة، ثم اضغط «اعتماد وحفظ الخطة الأصلية» لتصبح الخطة تشغيلية ومحفوظة.${missingNote}</div></div>`;

  const staged={status:'staged',weekStart:draft.period.start,weekEnd:built.days[6],entryCount:applied,missingCells:missing,stagedAt:new Date().toISOString()};
  draft.status='operational_draft';
  draft.approvedInConversation=true;
  draft.reviewedAt=staged.stagedAt;
  draft.operationalStage=clone(staged);
  return{ok:true,...staged,entries:built.entries};
}

AI.rosterOperational={version:VERSION,validateDraft,buildEntries,stage};
refreshStaticCopy();
})();
