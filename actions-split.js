(()=>{
'use strict';

let followupTab='shortages';
const DAILY_TYPES=['طلب دعم','مشكلة عميل','أخرى'];
const isFollowupType=t=>t==='نواقص'||t==='صيانة';
const isDailyAction=x=>!isFollowupType(x.action_type);
const isClosed=x=>x.action_status==='مغلق';

function splitActionBody(x,extra={}){
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

function splitDailyStatus(x){
  if(isClosed(x))return 'تم';
  if(['قيد المعالجة','قيد المتابعة','تم الرفع'].includes(x.action_status))return 'قيد المعالجة';
  return 'مفتوح';
}

function splitShortageStatus(x){
  if(isClosed(x))return x.resolution_result==='تمت التغذية'?'تمت التغذية':'مغلق';
  if(x.raised_to)return 'تم التصعيد — قيد المتابعة';
  return 'قيد المتابعة';
}

function splitMaintenanceStatus(x){
  if(isClosed(x))return 'تم التحقق والإغلاق';
  if(['تم تسجيل العطل','تم رفع الطلب','قيد المتابعة','تمت الصيانة'].includes(x.action_status))return x.action_status;
  if(x.action_status==='جديد')return 'تم تسجيل العطل';
  return 'قيد المتابعة';
}

function splitCounts(){
  const acts=app.actions||[];
  return {
    daily:acts.filter(x=>isDailyAction(x)&&!isClosed(x)).length,
    shortages:acts.filter(x=>x.action_type==='نواقص'&&!isClosed(x)).length,
    maintenance:acts.filter(x=>x.action_type==='صيانة'&&!isClosed(x)).length
  };
}

function ensureSplitHomeTiles(){
  const tiles=document.querySelector('#home .tiles');
  if(!tiles)return;
  let legacy=[...tiles.querySelectorAll('.tile')].find(t=>t.querySelector('h3')?.textContent.trim()==='الإجراءات والمتابعة');
  if(legacy){
    legacy.id='dailyActionsTile';
    legacy.innerHTML='<h3>الإجراءات اليومية</h3><div id="dailyActionsTileCount" class="mut" style="margin-bottom:8px">مفتوحة: 0</div><button class="btn" onclick="openDailyActions()">فتح</button>';
  }
  if(!document.getElementById('followupsTile')){
    const daily=document.getElementById('dailyActionsTile');
    if(daily){
      const t=document.createElement('div');
      t.className='tile';t.id='followupsTile';
      t.innerHTML='<h3>المتابعات</h3><div id="followupsTileCount" class="mut" style="margin-bottom:8px">نواقص: 0 | صيانة: 0</div><button class="btn" onclick="openFollowups()">فتح</button>';
      daily.insertAdjacentElement('afterend',t);
    }
  }
}

function renderSplitHome(){
  ensureSplitHomeTiles();
  const c=splitCounts();
  const h=document.getElementById('hActions');
  if(h){h.textContent=String(c.daily);const label=h.parentElement?.querySelector('.mut');if(label)label.textContent='الإجراءات اليومية المفتوحة';}
  const d=document.getElementById('dailyActionsTileCount');if(d)d.textContent=`مفتوحة: ${c.daily}`;
  const f=document.getElementById('followupsTileCount');if(f)f.textContent=`نواقص: ${c.shortages} | صيانة: ${c.maintenance}`;
}

function buildDailySection(){
  const sec=document.getElementById('actions');if(!sec)return;
  sec.innerHTML=`<div class="top"><div><div class="brand">الإجراءات اليومية</div><div class="sub">إجراءات تشغيلية تُعالج خلال اليوم</div></div><button class="btn ghost" onclick="home()">الرئيسية</button></div>
  <div class="grid">
    <div class="card"><div class="title">إجراء يومي جديد</div>
      <div class="field"><label>نوع الإجراء</label><select id="dailyActionType">${DAILY_TYPES.map(v=>`<option>${v}</option>`).join('')}</select></div>
      <div class="field"><label>الموضوع</label><input id="dailyActionSubject"></div>
      <div class="field"><label>وصف المطلوب</label><textarea id="dailyActionDesc"></textarea></div>
      <div class="field"><label>تاريخ التسجيل</label><input id="dailyActionDate" type="date"></div>
      <div class="notice ok">المسار: <b>مفتوح ← قيد المعالجة ← تم</b></div>
      <button class="btn" onclick="saveDailyAction()">تسجيل الإجراء</button>
    </div>
    <div class="card"><div class="title">سجل الإجراءات اليومية</div>
      <div class="field"><label>الحالة</label><select id="dailyActionFilter" onchange="renderDailyActions()"><option value="">الكل</option><option>مفتوح</option><option>قيد المعالجة</option><option>تم</option></select></div>
      <div id="dailyActionList"></div>
    </div>
  </div>`;
}

function buildFollowupSection(){
  if(document.getElementById('followups'))return;
  const sec=document.createElement('section');sec.id='followups';sec.className='view';
  sec.innerHTML=`<div class="top"><div><div class="brand">المتابعات</div><div class="sub">متابعة النواقص والصيانة حتى الإغلاق</div></div><button class="btn ghost" onclick="home()">الرئيسية</button></div>
    <div class="card" style="margin-top:14px"><div class="actions" style="justify-content:flex-start;flex-wrap:wrap;margin-top:0">
      <button id="followupShortBtn" class="btn" onclick="setFollowupTab('shortages')">متابعة النواقص</button>
      <button id="followupMaintBtn" class="btn ghost" onclick="setFollowupTab('maintenance')">متابعة الصيانة</button>
    </div></div>
    <div id="followupBody" class="grid"></div>`;
  document.querySelector('main.app')?.appendChild(sec);
}

function initActionSplit(){buildDailySection();buildFollowupSection();ensureSplitHomeTiles();renderSplitHome();}

window.openDailyActions=function(){show('actions');const d=document.getElementById('dailyActionDate');if(d)d.value=app.calendarDate||app.date;renderDailyActions();};
window.openActions=window.openDailyActions;

window.renderDailyActions=function(){
  const list=document.getElementById('dailyActionList');if(!list)return;
  const filter=document.getElementById('dailyActionFilter')?.value||'';
  const rows=(app.actions||[]).filter(isDailyAction).filter(x=>!filter||splitDailyStatus(x)===filter);
  list.innerHTML=rows.map(x=>{
    const st=splitDailyStatus(x);let controls='';
    if(st==='مفتوح')controls=`<div class="actions" style="justify-content:flex-start"><button class="mini" onclick="startDailyAction('${x.id}')">بدء المعالجة</button></div>`;
    else if(st==='قيد المعالجة')controls=`<div class="actions" style="justify-content:flex-start"><button class="mini" style="color:#166534;border-color:#86c99a;font-weight:700" onclick="finishDailyAction('${x.id}')">تمت المعالجة</button></div>`;
    else controls=`<div class="notice ok"><b>تم</b>${x.resolution_result?`<div style="margin-top:6px">نتيجة المعالجة: ${esc(x.resolution_result)}</div>`:''}</div>`;
    return `<div class="task"><b>${esc(x.action_type)} — ${esc(x.subject)}</b><div class="mut" style="margin-top:6px">تاريخ التسجيل: ${x.request_date} | الحالة: <b>${esc(st)}</b></div><p><b>وصف المطلوب:</b> ${esc(x.description||'')}</p>${controls}</div>`;
  }).join('')||'<p class="mut">لا توجد إجراءات يومية.</p>';
};

window.saveDailyAction=async function(){
  try{
    const subject=document.getElementById('dailyActionSubject').value.trim(),description=document.getElementById('dailyActionDesc').value.trim(),d=document.getElementById('dailyActionDate').value,type=document.getElementById('dailyActionType').value;
    if(!subject)throw Error('الموضوع مطلوب');if(!description)throw Error('وصف المطلوب مطلوب');if(!d)throw Error('تاريخ التسجيل مطلوب');
    await api('action-save',{method:'POST',body:{action_type:type,subject,description,request_date:d,raised_to:'',action_status:'مفتوح',last_update:d,resolution_result:''}});
    document.getElementById('dailyActionSubject').value='';document.getElementById('dailyActionDesc').value='';await refresh();openDailyActions();alert('تم تسجيل الإجراء اليومي بحالة مفتوح');
  }catch(e){alert(e.message)}
};

window.startDailyAction=async function(id){
  try{const x=(app.actions||[]).find(a=>a.id===id);if(!x)throw Error('الإجراء غير موجود');if(isClosed(x))throw Error('الإجراء منتهٍ');await api('action-save',{method:'POST',body:splitActionBody(x,{action_status:'قيد المعالجة',last_update:app.calendarDate||app.date})});await refresh();openDailyActions();}catch(e){alert(e.message)}
};

window.finishDailyAction=async function(id){
  try{const x=(app.actions||[]).find(a=>a.id===id);if(!x)throw Error('الإجراء غير موجود');let result=prompt('نتيجة المعالجة:','');if(result===null)return;result=result.trim();if(!result)throw Error('نتيجة المعالجة مطلوبة');await api('action-save',{method:'POST',body:splitActionBody(x,{action_status:'مغلق',resolution_result:result,last_update:app.calendarDate||app.date})});await refresh();openDailyActions();alert('تم إغلاق الإجراء اليومي');}catch(e){alert(e.message)}
};

window.openFollowups=async function(tab='shortages'){
  show('followups');followupTab=tab;shortagesData=await api('shortages');renderFollowups();
};
window.setFollowupTab=function(tab){followupTab=tab;renderFollowups();};

window.renderFollowups=function(){
  const body=document.getElementById('followupBody');if(!body)return;
  document.getElementById('followupShortBtn')?.classList.toggle('ghost',followupTab!=='shortages');
  document.getElementById('followupMaintBtn')?.classList.toggle('ghost',followupTab!=='maintenance');
  if(followupTab==='maintenance')renderMaintenanceFollowups();else renderShortageFollowups();
};

function renderShortageFollowups(){
  const body=document.getElementById('followupBody');
  const rows=(app.actions||[]).filter(x=>x.action_type==='نواقص');
  body.innerHTML=`<div class="card wide"><div class="title">متابعة النواقص</div><div class="notice">تظهر هنا تلقائيًا النواقص بعد تسجيل <b>تم الطلب</b>. لا يتم تسجيلها يدويًا من هذه الصفحة.</div><div id="shortageFollowupList"></div></div>`;
  document.getElementById('shortageFollowupList').innerHTML=rows.map(x=>{
    const shortage=shortagesData.find(q=>q.action_id===x.id),st=splitShortageStatus(x),closed=isClosed(x);let controls='';
    if(closed){controls=`<div class="notice ok"><b>${esc(st)}</b>${shortage?.supplied_date?`<div style="margin-top:6px">تاريخ التغذية: ${shortage.supplied_date}</div>`:''}</div>`;}
    else if(shortage){controls=`<div class="notice"><b>هل تمت التغذية؟</b><div class="actions" style="justify-content:flex-start"><button class="mini" style="color:#166534;border-color:#86c99a;font-weight:700" onclick="followupShortageYes('${x.id}')">نعم</button><button class="mini" style="color:#8a1c1c;border-color:#efb4b4;font-weight:700" onclick="followupShortageNo('${x.id}')">لا</button></div><div class="mut" style="margin-top:8px">آخر متابعة: ${x.last_update||x.request_date}</div></div><div class="actions" style="justify-content:flex-start"><button class="mini" style="color:#725700;border-color:#d7bb74;font-weight:700" onclick="followupShortageEscalate('${x.id}')">بحاجة إلى تصعيد</button></div>`;}
    const meta=shortage?`<div class="mut" style="margin-top:6px">${esc(shortage.sections?.name||'')} — ${esc(shortage.size||'')} | المطلوب: ${shortage.requested_qty??'—'} | تاريخ الطلب: ${shortage.ordered_date||'—'}</div>`:'';
    return `<div class="task"><b>${esc(x.subject)}</b>${meta}<div class="mut" style="margin-top:6px">الحالة: <b>${esc(st)}</b></div>${x.raised_to&&!closed?`<div class="notice">آخر جهة تم التصعيد لها: <b>${esc(x.raised_to)}</b></div>`:''}${controls}</div>`;
  }).join('')||'<p class="mut">لا توجد متابعات نواقص.</p>';
}

window.followupShortageYes=async function(id){
  try{const x=(app.actions||[]).find(a=>a.id===id),shortage=shortagesData.find(q=>q.action_id===id);if(!x||!shortage)throw Error('طلب النقص المرتبط غير موجود');if(isClosed(x))throw Error('الطلب مغلق');if(!confirm('تأكيد أن التغذية وصلت؟ سيتم إغلاق المتابعة وتحديث سجل النقص.'))return;await api('action-save',{method:'POST',body:splitActionBody(x,{action_status:'مغلق',resolution_result:'تمت التغذية',last_update:app.calendarDate||app.date})});await refresh();shortagesData=await api('shortages');await openFollowups('shortages');alert('تم تسجيل وصول التغذية وإغلاق المتابعة');}catch(e){alert(e.message)}
};
window.followupShortageNo=async function(id){
  try{const x=(app.actions||[]).find(a=>a.id===id),shortage=shortagesData.find(q=>q.action_id===id);if(!x||!shortage)throw Error('طلب النقص المرتبط غير موجود');if(isClosed(x))throw Error('الطلب مغلق');await api('action-save',{method:'POST',body:splitActionBody(x,{last_update:app.calendarDate||app.date})});await refresh();shortagesData=await api('shortages');await openFollowups('shortages');alert('تم تحديث المتابعة — التغذية لم تصل بعد');}catch(e){alert(e.message)}
};
window.followupShortageEscalate=async function(id){
  try{const x=(app.actions||[]).find(a=>a.id===id);if(!x)throw Error('المتابعة غير موجودة');if(isClosed(x))throw Error('الطلب مغلق');let to=prompt('الجهة المرفوع لها:',x.raised_to||'');if(to===null)return;to=to.trim();if(!to)throw Error('حدد الجهة المرفوع لها');let reason=prompt('سبب التصعيد / الملاحظة:','');if(reason===null)return;reason=reason.trim();if(!reason)throw Error('سبب التصعيد مطلوب');await api('action-save',{method:'POST',body:splitActionBody(x,{raised_to:to,action_status:'تم الرفع',last_update:app.calendarDate||app.date,resolution_result:'[[RAKIZA_ESCALATION]]'+reason})});await refresh();shortagesData=await api('shortages');await openFollowups('shortages');alert('تم التصعيد وبقي طلب النقص قيد المتابعة');}catch(e){alert(e.message)}
};

function renderMaintenanceFollowups(){
  const body=document.getElementById('followupBody');
  const rows=(app.actions||[]).filter(x=>x.action_type==='صيانة');
  body.innerHTML=`<div class="card"><div class="title">تسجيل عطل صيانة</div>
    <div class="field"><label>العطل / الموضوع</label><input id="maintSubject"></div>
    <div class="field"><label>وصف العطل</label><textarea id="maintDesc"></textarea></div>
    <div class="field"><label>تاريخ التسجيل</label><input id="maintDate" type="date" value="${esc(app.calendarDate||app.date)}"></div>
    <div class="notice ok">المسار: <b>تم تسجيل العطل ← تم رفع الطلب ← قيد المتابعة ← تمت الصيانة ← تم التحقق والإغلاق</b></div>
    <button class="btn" onclick="saveMaintenance()">تسجيل العطل</button></div>
    <div class="card"><div class="title">متابعة الصيانة</div><div id="maintenanceList"></div></div>`;
  document.getElementById('maintenanceList').innerHTML=rows.map(x=>{
    const st=splitMaintenanceStatus(x);let controls='';
    if(st==='تم تسجيل العطل')controls=`<div class="actions" style="justify-content:flex-start"><button class="mini" onclick="maintenanceRaised('${x.id}')">تم رفع الطلب</button></div>`;
    else if(st==='تم رفع الطلب')controls=`<div class="actions" style="justify-content:flex-start"><button class="mini" onclick="maintenanceStartFollow('${x.id}')">بدء المتابعة</button></div>`;
    else if(st==='قيد المتابعة')controls=`<div class="actions" style="justify-content:flex-start"><button class="mini" style="color:#166534;border-color:#86c99a;font-weight:700" onclick="maintenanceRepaired('${x.id}')">تمت الصيانة</button></div>`;
    else if(st==='تمت الصيانة')controls=`<div class="actions" style="justify-content:flex-start"><button class="mini" style="color:#166534;border-color:#86c99a;font-weight:700" onclick="maintenanceVerifyClose('${x.id}')">تم التحقق والإغلاق</button></div>`;
    else controls=`<div class="notice ok"><b>تم التحقق والإغلاق</b>${x.resolution_result?`<div style="margin-top:6px">النتيجة: ${esc(x.resolution_result)}</div>`:''}</div>`;
    return `<div class="task"><b>${esc(x.subject)}</b><div class="mut" style="margin-top:6px">تاريخ التسجيل: ${x.request_date} | الحالة: <b>${esc(st)}</b></div><p><b>وصف العطل:</b> ${esc(x.description||'')}</p>${x.raised_to?`<div class="notice">الجهة المرفوع لها: <b>${esc(x.raised_to)}</b></div>`:''}${controls}</div>`;
  }).join('')||'<p class="mut">لا توجد متابعات صيانة.</p>';
}

window.saveMaintenance=async function(){
  try{const subject=document.getElementById('maintSubject').value.trim(),description=document.getElementById('maintDesc').value.trim(),d=document.getElementById('maintDate').value;if(!subject)throw Error('العطل / الموضوع مطلوب');if(!description)throw Error('وصف العطل مطلوب');if(!d)throw Error('تاريخ التسجيل مطلوب');await api('action-save',{method:'POST',body:{action_type:'صيانة',subject,description,request_date:d,raised_to:'',action_status:'تم تسجيل العطل',last_update:d,resolution_result:''}});await refresh();await openFollowups('maintenance');alert('تم تسجيل عطل الصيانة');}catch(e){alert(e.message)}
};
window.maintenanceRaised=async function(id){
  try{const x=(app.actions||[]).find(a=>a.id===id);if(!x)throw Error('متابعة الصيانة غير موجودة');let to=prompt('الجهة التي رُفع لها طلب الصيانة:',x.raised_to||'');if(to===null)return;to=to.trim();if(!to)throw Error('حدد الجهة المرفوع لها');await api('action-save',{method:'POST',body:splitActionBody(x,{raised_to:to,action_status:'تم رفع الطلب',last_update:app.calendarDate||app.date})});await refresh();await openFollowups('maintenance');}catch(e){alert(e.message)}
};
window.maintenanceStartFollow=async function(id){
  try{const x=(app.actions||[]).find(a=>a.id===id);if(!x)throw Error('متابعة الصيانة غير موجودة');await api('action-save',{method:'POST',body:splitActionBody(x,{action_status:'قيد المتابعة',last_update:app.calendarDate||app.date})});await refresh();await openFollowups('maintenance');}catch(e){alert(e.message)}
};
window.maintenanceRepaired=async function(id){
  try{const x=(app.actions||[]).find(a=>a.id===id);if(!x)throw Error('متابعة الصيانة غير موجودة');if(!confirm('تأكيد أن أعمال الصيانة تمت؟ سيبقى الطلب مفتوحًا حتى التحقق النهائي.'))return;await api('action-save',{method:'POST',body:splitActionBody(x,{action_status:'تمت الصيانة',last_update:app.calendarDate||app.date})});await refresh();await openFollowups('maintenance');}catch(e){alert(e.message)}
};
window.maintenanceVerifyClose=async function(id){
  try{const x=(app.actions||[]).find(a=>a.id===id);if(!x)throw Error('متابعة الصيانة غير موجودة');let result=prompt('نتيجة التحقق قبل الإغلاق:','تمت الصيانة والتحقق');if(result===null)return;result=result.trim();if(!result)throw Error('نتيجة التحقق مطلوبة');await api('action-save',{method:'POST',body:splitActionBody(x,{action_status:'مغلق',resolution_result:result,last_update:app.calendarDate||app.date})});await refresh();await openFollowups('maintenance');alert('تم التحقق وإغلاق متابعة الصيانة');}catch(e){alert(e.message)}
};

const oldRenderHome=renderHome;
renderHome=function(){oldRenderHome();renderSplitHome();};

orderShortage=async function(id){
  try{let x=shortagesData.find(s=>s.id===id);if(!x)throw Error('سجل النقص غير موجود');if(x.shortage_status!=='مفتوح')throw Error('تم التعامل مع هذا النقص مسبقًا');if(!x.excel_exported_at)throw Error('صدّر آخر نسخة من Excel أولًا');if(!confirm('تأكيد أن ملف Excel تم إرساله للمشرف وأن طلب التغذية تم؟ سيتم تحويل النقص إلى متابعة النواقص.'))return;await api('shortage-close',{method:'POST',body:{id}});shortagesData=await api('shortages');await refresh();show('shortages');renderShortages();alert('تم تسجيل الطلب وتحويله إلى متابعة النواقص');}catch(e){alert(e.message)}
};

initActionSplit();
})();