(()=>{
'use strict';

const VERSION='1.0.0';
const VAT_RATE=0.15;
const TEMPLATE_URL='cash-movement-template.xlsx';
const SALES_FIELDS=['cash_sales','mada_sales','visa_sales','mastercard_sales','amex_sales','coupons_sales','tamara_sales','other_sales'];

function number(value){
  const normalized=String(value??'').replace(/,/g,'').trim();
  if(normalized==='')return 0;
  const parsed=Number(normalized);
  if(!Number.isFinite(parsed))throw Error('راجع أرقام حركة الصندوق');
  return parsed;
}

function money(value){return Math.round((Number(value)||0)*100)/100}

function netOfVat(gross,rate=VAT_RATE){
  const divisor=1+Number(rate||0);
  if(divisor<=0)throw Error('نسبة الضريبة غير صالحة');
  return money(number(gross)/divisor);
}

function calculate(source={}){
  const values={};
  for(const field of SALES_FIELDS)values[field]=number(source[field]);
  values.opening_balance=number(source.opening_balance);
  values.deposits=number(source.deposits);
  values.approved_expenses=number(source.approved_expenses);
  const totalSales=money(SALES_FIELDS.reduce((sum,field)=>sum+values[field],0));
  const networkTotal=money(values.mada_sales+values.visa_sales+values.mastercard_sales+values.amex_sales);
  const noncashTotal=money(values.coupons_sales+values.tamara_sales+values.other_sales);
  const closingBalance=money(values.opening_balance+totalSales-values.deposits-networkTotal-noncashTotal-values.approved_expenses);
  return {...values,total_sales_gross:totalSales,total_sales_net:netOfVat(totalSales),network_total:networkTotal,noncash_withdrawals:noncashTotal,closing_balance:closingBalance};
}

function validate(source,calculated=calculate(source)){
  if(!source.close_by)throw Error('حدد القائم بالإغلاق');
  if(calculated.total_sales_gross<0)throw Error('إجمالي المبيعات لا يمكن أن يكون سالبًا');
  if(calculated.deposits<0||calculated.approved_expenses<0)throw Error('الإيداعات والمصروفات لا يمكن أن تكون سالبة');
  if(calculated.deposits>0&&!String(source.deposit_sequence||'').trim())throw Error('رقم تسلسل الإيداع مطلوب عند تسجيل إيداع');
  return true;
}

function dateKey(value){
  if(value instanceof Date&&!Number.isNaN(value.getTime()))return value.toISOString().slice(0,10);
  if(typeof value==='number')return new Date(Date.UTC(1899,11,30)+Math.round(value)*86400000).toISOString().slice(0,10);
  const match=String(value||'').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match?`${match[1]}-${match[2]}-${match[3]}`:'';
}

function findDateRow(sheet,workDate){
  const target=dateKey(workDate);
  let found=null;
  sheet.eachRow({includeEmpty:false},(row,index)=>{if(found==null&&dateKey(row.getCell(1).value)===target)found=index});
  return found;
}

function writeMovement(sheet,rowNumber,movement){
  const row=sheet.getRow(rowNumber),c=calculate(movement);
  const values={3:c.opening_balance,4:c.cash_sales,5:c.mada_sales,6:c.visa_sales,7:c.mastercard_sales,8:c.amex_sales,9:c.coupons_sales,10:c.tamara_sales,11:c.other_sales,12:c.total_sales_gross,13:c.deposits,14:c.network_total,15:c.noncash_withdrawals,16:c.approved_expenses,17:c.closing_balance,18:String(movement.deposit_sequence||''),19:String(movement.notes||'')};
  Object.entries(values).forEach(([column,value])=>{row.getCell(Number(column)).value=value});
  row.commit?.();
  return c;
}

function injectCloseCard(){
  const section=document.getElementById('close'),grid=section?.querySelector('.grid');
  if(!grid||document.getElementById('cashMovementCard'))return;
  const resultCard=grid.querySelectorAll(':scope > .card')[2];
  const card=document.createElement('div');
  card.id='cashMovementCard';card.className='card wide';
  card.innerHTML=`<div class="title">حركة الصندوق</div><div class="notice">سجّل وسائل الدفع كما تظهر في تقرير المبيعات. سينتقل نفس الإجمالي إلى الإغلاق وملف Excel.</div><div class="fields" style="margin-top:12px"><div class="field"><label>رصيد الصندوق في بداية اليوم</label><input id="cashOpening" readonly></div><div class="field"><label>المبيعات النقدية</label><input id="cashSales" inputmode="decimal"></div><div class="field"><label>الشبكة السعودية</label><input id="cashMada" inputmode="decimal"></div><div class="field"><label>فيزا</label><input id="cashVisa" inputmode="decimal"></div><div class="field"><label>ماستركارد</label><input id="cashMastercard" inputmode="decimal"></div><div class="field"><label>أمريكان إكسبريس</label><input id="cashAmex" inputmode="decimal"></div><div class="field"><label>كوبونات الجمعيات</label><input id="cashCoupons" inputmode="decimal"></div><div class="field"><label>تمارا</label><input id="cashTamara" inputmode="decimal"></div><div class="field"><label>مبيعات أخرى</label><input id="cashOther" inputmode="decimal"></div><div class="field"><label>الإيداعات</label><input id="cashDeposits" inputmode="decimal"></div><div class="field"><label>المصاريف المعتمدة من الإدارة</label><input id="cashExpenses" inputmode="decimal"></div><div class="field"><label>رقم تسلسل الإيداع</label><input id="cashDepositSequence"></div><div class="field"><label>رصيد الصندوق في نهاية اليوم</label><input id="cashClosing" readonly></div><div class="field" style="grid-column:1/-1"><label>ملاحظات</label><textarea id="cashNotes"></textarea></div></div>`;
  grid.insertBefore(card,resultCard||null);
  const salesLabel=document.querySelector('label[for="dailySales"]')||document.getElementById('dailySales')?.closest('.field')?.querySelector('label');
  if(salesLabel)salesLabel.textContent='إجمالي مبيعات الإغلاق (شامل الضريبة)';
  const daily=document.getElementById('dailySales');if(daily)daily.readOnly=true;
  const netField=document.createElement('div');netField.className='field';netField.innerHTML='<label>المبيعات المحتسبة للهدف (بدون الضريبة)</label><input id="dailySalesNet" readonly>';
  daily?.closest('.fields')?.appendChild(netField);
  card.querySelectorAll('input,textarea').forEach(el=>el.addEventListener('input',refreshCalculations));
}

function formValues(){
  const get=id=>document.getElementById(id)?.value??'';
  return{opening_balance:get('cashOpening'),cash_sales:get('cashSales'),mada_sales:get('cashMada'),visa_sales:get('cashVisa'),mastercard_sales:get('cashMastercard'),amex_sales:get('cashAmex'),coupons_sales:get('cashCoupons'),tamara_sales:get('cashTamara'),other_sales:get('cashOther'),deposits:get('cashDeposits'),approved_expenses:get('cashExpenses'),deposit_sequence:get('cashDepositSequence'),notes:get('cashNotes'),close_by:get('closeBy')};
}

function refreshCalculations(){
  try{const c=calculate(formValues());document.getElementById('dailySales').value=c.total_sales_gross.toFixed(2);document.getElementById('dailySalesNet').value=c.total_sales_net.toFixed(2);document.getElementById('cashClosing').value=c.closing_balance.toFixed(2)}catch{}
}

function fillForm(movement={},opening=0){
  const map={cashOpening:movement.opening_balance??opening,cashSales:movement.cash_sales,cashMada:movement.mada_sales,cashVisa:movement.visa_sales,cashMastercard:movement.mastercard_sales,cashAmex:movement.amex_sales,cashCoupons:movement.coupons_sales,cashTamara:movement.tamara_sales,cashOther:movement.other_sales,cashDeposits:movement.deposits,cashExpenses:movement.approved_expenses,cashDepositSequence:movement.deposit_sequence,cashNotes:movement.notes};
  Object.entries(map).forEach(([id,value])=>{const el=document.getElementById(id);if(el)el.value=value??''});refreshCalculations();
}

async function buildWorkbook(year){
  if(typeof ExcelJS==='undefined')throw Error('تعذر تحميل أداة Excel');
  const response=await fetch(TEMPLATE_URL,{cache:'no-store'});if(!response.ok)throw Error('تعذر تحميل نموذج حركة الصندوق');
  const workbook=new ExcelJS.Workbook();await workbook.xlsx.load(await response.arrayBuffer());
  const result=await api('cash-movements',{q:{year:String(year)}}),sheet=workbook.getWorksheet('الحركة اليومية');
  if(!sheet)throw Error('ورقة الحركة اليومية غير موجودة في النموذج');
  for(const movement of result.rows||[]){const row=findDateRow(sheet,movement.work_date);if(row)writeMovement(sheet,row,movement)}
  workbook.calcProperties.fullCalcOnLoad=true;workbook.calcProperties.forceFullCalc=true;workbook.calcProperties.calcMode='auto';
  return workbook;
}

async function exportAndShareCashMovement(selectedYear){
  const fallback=(app?.day?.work_date||app?.date||String(new Date().getFullYear())).slice(0,4),year=Number(selectedYear||fallback);
  const workbook=await buildWorkbook(year),buffer=await workbook.xlsx.writeBuffer(),name=`حركة الصندوق لمعرض ${app.branch.name} ${year}.xlsx`,file=new File([buffer],name,{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  if(navigator.share&&navigator.canShare?.({files:[file]})){await navigator.share({title:`حركة الصندوق — ${app.branch.name}`,text:'مرفق ملف حركة الصندوق المحدث.',files:[file]});return 'shared'}
  const url=URL.createObjectURL(file),anchor=document.createElement('a');anchor.href=url;anchor.download=name;document.body.appendChild(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);return 'downloaded';
}

function injectHistoryExport(){
  const card=document.querySelector('#history .card'),scroll=card?.querySelector('.scroll');
  if(!card||!scroll||document.getElementById('cashHistoryExportBtn'))return;
  const actions=document.createElement('div');actions.className='actions';actions.style.justifyContent='flex-start';
  actions.innerHTML='<button class="btn gold" id="cashHistoryExportBtn">تصدير وإرسال حركة الصندوق</button>';
  card.insertBefore(actions,scroll);
  document.getElementById('cashHistoryExportBtn').onclick=async event=>{const button=event.currentTarget;try{button.disabled=true;button.textContent='جاري تجهيز الملف...';const result=await exportAndShareCashMovement(document.getElementById('histYear')?.value);if(result==='downloaded')alert('تم تنزيل ملف حركة الصندوق المحدث. يمكنك إرفاقه في البريد.')}catch(error){if(error?.name!=='AbortError')alert(error.message)}finally{button.disabled=false;button.textContent='تصدير وإرسال حركة الصندوق'}};
}

function renderCloseSuccess(day){
  const box=document.getElementById('cashCloseSuccess')||document.createElement('div');box.id='cashCloseSuccess';box.className='notice ok';box.style.marginTop='14px';box.innerHTML=`<b>تم اعتماد إغلاق اليوم.</b><div style="margin-top:6px">إجمالي الإغلاق: ${Number(day.daily_sales_gross||0).toLocaleString('en-US')} ريال — المحتسب للهدف بدون الضريبة: ${Number(day.daily_sales||0).toLocaleString('en-US')} ريال.</div><div class="actions" style="justify-content:flex-start"><button class="btn gold" id="cashExportShareBtn">تصدير وإرسال Excel</button><button class="btn ghost" onclick="home()">العودة للرئيسية</button></div>`;
  document.querySelector('#close .grid')?.appendChild(box);document.getElementById('cashExportShareBtn').onclick=async event=>{const button=event.currentTarget;try{button.disabled=true;button.textContent='جاري تجهيز الملف...';const result=await exportAndShareCashMovement();if(result==='downloaded')alert('تم تنزيل ملف حركة الصندوق المحدث. يمكنك إرفاقه في البريد.')}catch(error){if(error?.name!=='AbortError')alert(error.message)}finally{button.disabled=false;button.textContent='تصدير وإرسال Excel'}};
}

const originalOpenClose=window.openClose;
window.openClose=async function(){
  if(!app.day)return alert('لا يوجد يوم تشغيل مفتوح');
  show('close');document.getElementById('cashCloseSuccess')?.remove();
  document.getElementById('cDate').value=app.day.work_date||app.date;document.getElementById('cDay').value=todayName(app.day.work_date||app.date);document.getElementById('cBranch').value=app.branch.name;document.getElementById('closeBy').innerHTML=empOptions();document.getElementById('cTarget').value=app.day.daily_target||0;
  const x=await api('close-get',{q:{day_id:app.day.id}});activePlan=x;document.getElementById('closeTasks').innerHTML=x.header?.day_type==='يوم بيعي فقط'?'<div class="notice">اليوم بيعي فقط — لا توجد مهام تشغيلية.</div>':(x.tasks||[]).map(t=>`<div class="task" data-task="${t.id}"><b>${esc(t.task_category)} ${esc(t.task_detail||'')}</b><div class="field"><label>حالة التنفيذ</label><select class="ex" onchange="this.closest('.task').querySelector('.why').classList.toggle('hidden',this.value==='مكتملة')"><option>مكتملة</option><option>مكتملة جزئيًا</option><option>لم تنفذ</option></select></div><div class="field why hidden"><label>سبب عدم الإكمال</label><input></div></div>`).join('')||'<div class="notice">لا توجد خطة مهام معتمدة.</div>';
  fillForm(x.cash_movement||{},x.previous_closing_balance||0);
  if(app.day.status==='مغلق')renderCloseSuccess(app.day);
};

window.approveClose=async function(){
  try{
    const values=formValues(),calculated=calculate(values);validate(values,calculated);
    const execution=[...document.querySelectorAll('#closeTasks .task')].map(row=>({task_id:row.dataset.task,execution_status:row.querySelector('.ex').value,noncompletion_reason:row.querySelector('.why input')?.value||null}));
    const result=await api('close-save',{method:'POST',body:{day_id:app.day.id,close_by:values.close_by,daily_sales_gross:calculated.total_sales_gross,daily_sales_net:calculated.total_sales_net,cash_movement:{...values,...calculated},next_day_followup:document.getElementById('nextFollow').value,next_day_note:document.getElementById('nextNote').value,execution}});
    await refresh();show('close');renderCloseSuccess(result);
  }catch(error){alert(error.message)}
};

injectCloseCard();
injectHistoryExport();

const apiPublic={VERSION,VAT_RATE,calculate,netOfVat,validate,dateKey,findDateRow,writeMovement};
window.RakizaCashClose=apiPublic;
if(typeof module!=='undefined'&&module.exports)module.exports=apiPublic;
})();
