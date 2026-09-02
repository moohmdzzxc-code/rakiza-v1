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

})();