(()=>{
'use strict';

const oldOpenFollowups=window.openFollowups;
const oldSetFollowupTab=window.setFollowupTab;

function fixActionBody(x,extra={}){
  return {
    id:x.id,
    action_type:x.action_type,
    subject:x.subject,
    description:x.description||'',
    request_date:x.request_date||app.date,
    raised_to:x.raised_to||'',
    action_status:x.action_status||'قيد المتابعة',
    last_update:x.last_update||app.date,
    resolution_result:x.resolution_result||'',
    ...extra
  };
}

window.saveDailyAction=async function(){
  try{
    const subject=document.getElementById('dailyActionSubject').value.trim(),description=document.getElementById('dailyActionDesc').value.trim(),d=document.getElementById('dailyActionDate').value,type=document.getElementById('dailyActionType').value;
    if(!subject)throw Error('الموضوع مطلوب');if(!description)throw Error('وصف المطلوب مطلوب');if(!d)throw Error('تاريخ التسجيل مطلوب');
    await api('action-save',{method:'POST',body:{action_type:type,subject,description,request_date:d,raised_to:'',action_status:'جديد',last_update:d,resolution_result:''}});
    document.getElementById('dailyActionSubject').value='';document.getElementById('dailyActionDesc').value='';await refresh();openDailyActions();alert('تم تسجيل الإجراء اليومي بحالة مفتوح');
  }catch(e){alert(e.message)}
};

window.startDailyAction=async function(id){
  try{const x=(app.actions||[]).find(a=>a.id===id);if(!x)throw Error('الإجراء غير موجود');if(x.action_status==='مغلق')throw Error('الإجراء منتهٍ');await api('action-save',{method:'POST',body:fixActionBody(x,{action_status:'قيد المتابعة',last_update:app.calendarDate||app.date})});await refresh();openDailyActions();}catch(e){alert(e.message)}
};

function maintenanceUiStatus(x){
  if(x.action_status==='مغلق')return 'تم التحقق والإغلاق';
  if(x.action_status==='جديد')return 'تم تسجيل العطل';
  if(x.action_status==='تم الرفع')return 'تم رفع الطلب';
  if(x.action_status==='قيد المتابعة')return 'قيد المتابعة';
  if(x.action_status==='تم التنفيذ')return 'تمت الصيانة';
  return 'قيد المتابعة';
}

function renderFixedMaintenance(){
  const body=document.getElementById('followupBody');if(!body)return;
  document.getElementById('followupShortBtn')?.classList.add('ghost');
  document.getElementById('followupMaintBtn')?.classList.remove('ghost');
  const rows=(app.actions||[]).filter(x=>x.action_type==='صيانة');
  body.innerHTML=`<div class="card"><div class="title">تسجيل عطل صيانة</div>
    <div class="field"><label>العطل / الموضوع</label><input id="maintSubject"></div>
    <div class="field"><label>وصف العطل</label><textarea id="maintDesc"></textarea></div>
    <div class="field"><label>تاريخ التسجيل</label><input id="maintDate" type="date" value="${esc(app.calendarDate||app.date)}"></div>
    <div class="notice ok">المسار: <b>تم تسجيل العطل ← تم رفع الطلب ← قيد المتابعة ← تمت الصيانة ← تم التحقق والإغلاق</b></div>
    <button class="btn" onclick="saveMaintenance()">تسجيل العطل</button></div>
    <div class="card"><div class="title">متابعة الصيانة</div><div id="maintenanceList"></div></div>`;
  document.getElementById('maintenanceList').innerHTML=rows.map(x=>{
    const st=maintenanceUiStatus(x);let controls='';
    if(st==='تم تسجيل العطل')controls=`<div class="actions" style="justify-content:flex-start"><button class="mini" onclick="maintenanceRaised('${x.id}')">تم رفع الطلب</button></div>`;
    else if(st==='تم رفع الطلب')controls=`<div class="actions" style="justify-content:flex-start"><button class="mini" onclick="maintenanceStartFollow('${x.id}')">بدء المتابعة</button></div>`;
    else if(st==='قيد المتابعة')controls=`<div class="actions" style="justify-content:flex-start"><button class="mini" style="color:#166534;border-color:#86c99a;font-weight:700" onclick="maintenanceRepaired('${x.id}')">تمت الصيانة</button></div>`;
    else if(st==='تمت الصيانة')controls=`<div class="actions" style="justify-content:flex-start"><button class="mini" style="color:#166534;border-color:#86c99a;font-weight:700" onclick="maintenanceVerifyClose('${x.id}')">تم التحقق والإغلاق</button></div>`;
    else controls=`<div class="notice ok"><b>تم التحقق والإغلاق</b>${x.resolution_result?`<div style="margin-top:6px">النتيجة: ${esc(x.resolution_result)}</div>`:''}</div>`;
    return `<div class="task"><b>${esc(x.subject)}</b><div class="mut" style="margin-top:6px">تاريخ التسجيل: ${x.request_date} | الحالة: <b>${esc(st)}</b></div><p><b>وصف العطل:</b> ${esc(x.description||'')}</p>${x.raised_to?`<div class="notice">الجهة المرفوع لها: <b>${esc(x.raised_to)}</b></div>`:''}${controls}</div>`;
  }).join('')||'<p class="mut">لا توجد متابعات صيانة.</p>';
}

window.openFollowups=async function(tab='shortages'){
  if(tab!=='maintenance')return oldOpenFollowups(tab);
  await oldOpenFollowups('shortages');
  renderFixedMaintenance();
};

window.setFollowupTab=function(tab){
  if(tab==='maintenance')return renderFixedMaintenance();
  return oldSetFollowupTab('shortages');
};

window.saveMaintenance=async function(){
  try{const subject=document.getElementById('maintSubject').value.trim(),description=document.getElementById('maintDesc').value.trim(),d=document.getElementById('maintDate').value;if(!subject)throw Error('العطل / الموضوع مطلوب');if(!description)throw Error('وصف العطل مطلوب');if(!d)throw Error('تاريخ التسجيل مطلوب');await api('action-save',{method:'POST',body:{action_type:'صيانة',subject,description,request_date:d,raised_to:'',action_status:'جديد',last_update:d,resolution_result:''}});await refresh();await openFollowups('maintenance');alert('تم تسجيل عطل الصيانة');}catch(e){alert(e.message)}
};

window.maintenanceRaised=async function(id){
  try{const x=(app.actions||[]).find(a=>a.id===id);if(!x)throw Error('متابعة الصيانة غير موجودة');let to=prompt('الجهة التي رُفع لها طلب الصيانة:',x.raised_to||'');if(to===null)return;to=to.trim();if(!to)throw Error('حدد الجهة المرفوع لها');await api('action-save',{method:'POST',body:fixActionBody(x,{raised_to:to,action_status:'تم الرفع',last_update:app.calendarDate||app.date})});await refresh();await openFollowups('maintenance');}catch(e){alert(e.message)}
};

window.maintenanceStartFollow=async function(id){
  try{const x=(app.actions||[]).find(a=>a.id===id);if(!x)throw Error('متابعة الصيانة غير موجودة');await api('action-save',{method:'POST',body:fixActionBody(x,{action_status:'قيد المتابعة',last_update:app.calendarDate||app.date})});await refresh();await openFollowups('maintenance');}catch(e){alert(e.message)}
};

window.maintenanceRepaired=async function(id){
  try{const x=(app.actions||[]).find(a=>a.id===id);if(!x)throw Error('متابعة الصيانة غير موجودة');if(!confirm('تأكيد أن أعمال الصيانة تمت؟ سيبقى الطلب مفتوحًا حتى التحقق النهائي.'))return;await api('action-save',{method:'POST',body:fixActionBody(x,{action_status:'تم التنفيذ',last_update:app.calendarDate||app.date})});await refresh();await openFollowups('maintenance');}catch(e){alert(e.message)}
};

window.maintenanceVerifyClose=async function(id){
  try{const x=(app.actions||[]).find(a=>a.id===id);if(!x)throw Error('متابعة الصيانة غير موجودة');let result=prompt('نتيجة التحقق قبل الإغلاق:','تمت الصيانة والتحقق');if(result===null)return;result=result.trim();if(!result)throw Error('نتيجة التحقق مطلوبة');await api('action-save',{method:'POST',body:fixActionBody(x,{action_status:'مغلق',resolution_result:result,last_update:app.calendarDate||app.date})});await refresh();await openFollowups('maintenance');alert('تم التحقق وإغلاق متابعة الصيانة');}catch(e){alert(e.message)}
};

function uiPreviousDay(){
  const base=app?.calendarDate||app?.date||new Date().toISOString().slice(0,10),d=new Date(base+'T12:00:00');
  d.setDate(d.getDate()-1);
  return d.toISOString().slice(0,10);
}

function uiActionCounts(){
  const rows=app?.actions||[],open=x=>x.action_status!=='مغلق';
  return {
    daily:rows.filter(x=>!['نواقص','صيانة'].includes(x.action_type)&&open(x)).length,
    shortages:rows.filter(x=>x.action_type==='نواقص'&&open(x)).length,
    maintenance:rows.filter(x=>x.action_type==='صيانة'&&open(x)).length
  };
}

function ensureDailyCycleView(){
  if(document.getElementById('dailycycle'))return;
  const sec=document.createElement('section');sec.id='dailycycle';sec.className='view';
  sec.innerHTML=`<div class="top"><div><div class="brand">دورة التشغيل اليومي</div><div class="sub">مسار واحد يقودك تلقائيًا إلى الخطوة الصحيحة</div></div><button class="btn ghost" onclick="home()">الرئيسية</button></div><div id="dailyCycleMount" style="margin-top:14px"></div>`;
  document.querySelector('main.app')?.appendChild(sec);
}

function uiCycleState(){
  if(window.RakizaDayCycle?.derive)return window.RakizaDayCycle.derive(app);
  const day=app?.day,openingDone=!!day?.opening_approved_at,planDone=!!(day&&(day.plan_id||day.day_type)),closeDone=day?.status==='مغلق';
  const key=!day?'not_started':closeDone?'closed':!openingDone?'opening':!planDone?'planning':'operating';
  const label={not_started:'لم يبدأ',opening:'بدء اليوم',planning:'إعداد الخطة',operating:'قيد التشغيل',closed:'مغلق'}[key];
  return {key,label,description:'أكمل خطوات التشغيل اليومية بالترتيب.',buttonLabel:key==='not_started'?'بدء يوم التشغيل':key==='closed'?'عرض سجل الأيام':'متابعة دورة التشغيل',progress:closeDone?100:planDone?67:openingDone?33:0,steps:[{key:'opening',number:1,label:'بدء اليوم',status:openingDone?'done':key==='opening'?'current':'locked'},{key:'dayplan',number:2,label:'خطة اليوم',status:planDone?'done':key==='planning'?'current':'locked'},{key:'close',number:3,label:'إغلاق اليوم',status:closeDone?'done':key==='operating'?'current':'locked'}]};
}

function renderDailyCycleView(){
  ensureDailyCycleView();
  const mount=document.getElementById('dailyCycleMount');if(!mount)return;
  const cycle=uiCycleState(),status={done:'مكتمل',current:'الخطوة الحالية',locked:'بانتظار الخطوة السابقة'};
  const descriptions={opening:'الجاهزية التشغيلية واعتماد بدء اليوم',dayplan:'خطة اليوم وتواجد الفريق',close:'نتيجة اليوم واعتماد الإغلاق'};
  mount.innerHTML=`<style>
    .rkz-cycle-page{max-width:980px;margin:0 auto}.rkz-cycle-hero{background:linear-gradient(135deg,#12345a,#28527d);color:#fff;border-radius:20px;padding:22px;box-shadow:0 12px 30px rgba(23,54,93,.16)}
    .rkz-cycle-hero-top{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}.rkz-cycle-hero h2{margin:0 0 6px;font-size:24px}.rkz-cycle-hero p{margin:0;color:#dbe6f2}.rkz-cycle-badge{background:#fff1ce;color:#79510b;border-radius:999px;padding:7px 12px;font-weight:850;white-space:nowrap}.rkz-cycle-meter{height:9px;background:rgba(255,255,255,.18);border-radius:99px;overflow:hidden;margin-top:18px}.rkz-cycle-meter i{display:block;height:100%;background:#d9ae57;border-radius:99px}.rkz-cycle-meter-label{display:flex;justify-content:space-between;font-size:12px;color:#dbe6f2;margin-top:7px}
    .rkz-cycle-page-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:14px 0}.rkz-cycle-page-step{border:1px solid #e4e9ef;background:#fff;border-radius:16px;padding:17px;min-height:166px;display:flex;flex-direction:column}.rkz-cycle-page-step.current{border-color:#d5aa51;box-shadow:0 0 0 3px #fbf3e2}.rkz-cycle-page-step.done{border-color:#bcd8c7;background:#f7fcf8}.rkz-cycle-page-step.locked{opacity:.66}.rkz-cycle-page-num{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:#d9e0e8;color:#fff;font-weight:900;margin-bottom:12px}.rkz-cycle-page-step.done .rkz-cycle-page-num{background:#268354}.rkz-cycle-page-step.current .rkz-cycle-page-num{background:#d0a247}.rkz-cycle-page-step h3{margin:0;color:#17365d}.rkz-cycle-page-step p{color:#78879a;font-size:13px;line-height:1.7;flex:1}.rkz-cycle-step-status{font-size:12px;font-weight:800;color:#7d8a99}.rkz-cycle-page-step.done .rkz-cycle-step-status{color:#268354}.rkz-cycle-page-step.current .rkz-cycle-step-status{color:#9a6812}.rkz-cycle-next{background:#fff;border:1px solid #e5eaf0;border-radius:16px;padding:17px}.rkz-cycle-next p{margin:4px 0 14px;color:#758397}.rkz-cycle-next .btn{width:100%;padding:13px;font-weight:850}
    @media(max-width:700px){.rkz-cycle-page-steps{grid-template-columns:1fr}.rkz-cycle-hero-top{flex-direction:column}.rkz-cycle-page-step{min-height:0}}
  </style><div class="rkz-cycle-page">
    <div class="rkz-cycle-hero"><div class="rkz-cycle-hero-top"><div><h2>${cycle.label}</h2><p>${cycle.description}</p></div><span class="rkz-cycle-badge">${cycle.progress}% مكتمل</span></div><div class="rkz-cycle-meter"><i style="width:${cycle.progress}%"></i></div><div class="rkz-cycle-meter-label"><span>بدء اليوم</span><span>إغلاق اليوم</span></div></div>
    <div class="rkz-cycle-page-steps">${cycle.steps.map(step=>`<div class="rkz-cycle-page-step ${step.status}" onclick="rkzNav('${step.key}')"><div class="rkz-cycle-page-num">${step.status==='done'?'✓':step.number}</div><h3>${step.label}</h3><p>${descriptions[step.key]}</p><span class="rkz-cycle-step-status">${status[step.status]}</span></div>`).join('')}</div>
    <div class="rkz-cycle-next"><b>الخطوة التالية</b><p>${cycle.description}</p><button class="btn gold" onclick="rkzContinueCycle()">${cycle.buttonLabel}</button></div>
  </div>`;
}

function ensureTargetsView(){
  let sec=document.getElementById('targets');
  if(!sec){
    sec=document.createElement('section');sec.id='targets';sec.className='view';
    sec.innerHTML=`<div class="top"><div><div class="brand">المستهدفات</div><div class="sub">رفع واعتماد مستهدفات الشهر</div></div><button class="btn ghost" onclick="home()">الرئيسية</button></div><div id="targetsMount" style="margin-top:14px"></div>`;
    document.querySelector('main.app')?.appendChild(sec);
  }
  const card=document.getElementById('monthlyTargetCard'),mount=document.getElementById('targetsMount');
  if(card&&mount&&card.parentElement!==mount){card.style.marginTop='0';mount.appendChild(card)}
}

function updateSalesLabels(){
  const prev=uiPreviousDay(),sales=document.getElementById('sales');
  if(sales){
    const brand=sales.querySelector('.top .brand'),sub=sales.querySelector('.top .sub'),title=sales.querySelector('.card .title');
    if(brand)brand.textContent='ملخص المبيعات';
    if(sub)sub.textContent=`المبيعات المحققة حتى تاريخ ${prev}`;
    if(title)title.textContent='ملخص المبيعات';
  }
}

function rebuildHomeTiles(){
  ensureDailyCycleView();ensureTargetsView();updateSalesLabels();
  const tiles=document.querySelector('#home .tiles');if(!tiles)return;
  const c=uiActionCounts(),prev=uiPreviousDay();
  tiles.innerHTML=`
    <div class="tile"><h3>دورة التشغيل اليومي</h3><div class="mut" style="margin-bottom:8px">يتم تنفيذها يوميًا</div><button class="btn" onclick="openDailyCycle()">فتح</button></div>
    <div class="tile"><h3>المستهدفات</h3><div class="mut" style="margin-bottom:8px">رفع واعتماد تارقت الشهر</div><button class="btn" onclick="openTargets()">فتح</button></div>
    <div class="tile"><h3>خطة التواجد</h3><button class="btn" onclick="openRoster()">فتح</button></div>
    <div class="tile"><h3>ملخص المبيعات</h3><div class="mut" style="margin-bottom:8px">المبيعات المحققة حتى تاريخ ${prev}</div><button class="btn" onclick="openSales()">فتح</button></div>
    <div class="tile"><h3>ملخص التشغيل</h3><div class="mut" style="margin-bottom:8px">سيتم تطويره لاحقًا</div><button class="btn" disabled>قيد التطوير</button></div>
    <div class="tile"><h3>سجل الأيام</h3><button class="btn" onclick="openHistory()">فتح</button></div>
    <div class="tile"><h3>النواقص والطلبات</h3><button class="btn" onclick="openShortages()">فتح</button></div>
    <div class="tile" id="dailyActionsTile"><h3>الإجراءات اليومية</h3><div id="dailyActionsTileCount" class="mut" style="margin-bottom:8px">مفتوحة: ${c.daily}</div><button class="btn" onclick="openDailyActions()">فتح</button></div>
    <div class="tile" id="followupsTile"><h3>المتابعات</h3><div id="followupsTileCount" class="mut" style="margin-bottom:8px">نواقص: ${c.shortages} | صيانة: ${c.maintenance}</div><button class="btn" onclick="openFollowups()">فتح</button></div>
    <div class="tile"><h3>ركيزة AI ✦</h3><button class="btn gold" onclick="openAssistant()">اسأل ركيزة</button></div>
    <div class="tile"><h3>الأداء الأسبوعي</h3><div class="mut" style="margin-bottom:8px">تقرير المبيعات والفريق والتشغيل والمهام</div><button class="btn" onclick="openWeeklyPerformance()">فتح</button></div>
    <div class="tile"><h3>الأداء الشهري</h3><button class="btn" disabled>قيد التطوير</button></div>`;
}

window.openDailyCycle=function(){ensureDailyCycleView();renderDailyCycleView();show('dailycycle')};
window.openTargets=function(){ensureTargetsView();show('targets')};

const uiBaseRenderHome=window.renderHome;
window.renderHome=function(){uiBaseRenderHome.apply(this,arguments);rebuildHomeTiles()};

rebuildHomeTiles();
let uiTries=0;const uiTimer=setInterval(()=>{uiTries++;ensureTargetsView();if(app?.date||app?.calendarDate){rebuildHomeTiles();clearInterval(uiTimer)}else if(uiTries>40)clearInterval(uiTimer)},250);

})();
