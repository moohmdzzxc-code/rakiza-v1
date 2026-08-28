(()=>{
'use strict';
let targetPlan=null,targetPlanMonth='',targetDraft=[],targetSourceType='',targetSourceName='',targetLoading=false;

const tf$=id=>document.getElementById(id);
const getApp=()=>typeof app!=='undefined'?app:null;
const safe=v=>String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
const money=v=>v===null||v===undefined||v===''?'—':Number(v).toLocaleString('en-US');
const monthStartFromDate=d=>String(d||'').slice(0,7)+'-01';
const activeWorkDate=()=>getApp()?.day?.work_date||getApp()?.date||getApp()?.calendarDate||new Date().toISOString().slice(0,10);
const activeMonth=()=>monthStartFromDate(activeWorkDate());
const monthDates=m=>{const [y,mo]=m.slice(0,7).split('-').map(Number),days=new Date(Date.UTC(y,mo,0)).getUTCDate();return Array.from({length:days},(_,i)=>`${y}-${String(mo).padStart(2,'0')}-${String(i+1).padStart(2,'0')}`)};
const dayAr=d=>new Intl.DateTimeFormat('ar-SA',{weekday:'long'}).format(new Date(d+'T12:00:00'));
const monthAr=m=>new Intl.DateTimeFormat('ar-SA',{month:'long',year:'numeric'}).format(new Date(m+'T12:00:00'));
const arabicDigits=s=>String(s??'').replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[٬،]/g,',').replace(/٫/g,'.');
const num=v=>{if(v===null||v===undefined||v==='')return null;if(typeof v==='number')return Number.isFinite(v)?v:null;if(typeof v==='object'&&v.result!==undefined)return num(v.result);const n=Number(arabicDigits(v).replace(/[^0-9.\-]/g,''));return Number.isFinite(n)?n:null};
const pad=n=>String(n).padStart(2,'0');

function dateMaps(month){
  const map=new Map();
  for(const d of monthDates(month)){
    const [y,m,day]=d.split('-').map(Number),yy=String(y).slice(-2);
    [
      `${pad(day)}/${pad(m)}/${yy}`,`${day}/${m}/${yy}`,
      `${pad(day)}/${pad(m)}/${y}`,`${day}/${m}/${y}`,
      d
    ].forEach(k=>map.set(k,d));
    try{
      const parts=new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura',{day:'2-digit',month:'2-digit',year:'2-digit',timeZone:'Asia/Riyadh'}).formatToParts(new Date(d+'T12:00:00+03:00'));
      const get=t=>parts.find(p=>p.type===t)?.value||'';
      const hd=Number(get('day')),hm=Number(get('month')),hy=get('year');
      if(hd&&hm&&hy){map.set(`${pad(hd)}/${pad(hm)}/${hy}`,d);map.set(`${hd}/${hm}/${hy}`,d)}
    }catch{}
  }
  return map;
}

function parseDisplayDate(v,month,map=dateMaps(month)){
  if(v instanceof Date&&!Number.isNaN(v.getTime())){
    const d=`${v.getFullYear()}-${pad(v.getMonth()+1)}-${pad(v.getDate())}`;
    return d.startsWith(month.slice(0,7))?d:null;
  }
  if(typeof v==='number'&&v>20000&&v<90000){
    const ms=Math.round((v-25569)*86400*1000),dt=new Date(ms),d=`${dt.getUTCFullYear()}-${pad(dt.getUTCMonth()+1)}-${pad(dt.getUTCDate())}`;
    return d.startsWith(month.slice(0,7))?d:null;
  }
  let s=arabicDigits(v).trim().replace(/-/g,'/');
  if(/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(s)){const [y,m,d]=s.split('/');const out=`${y}-${pad(Number(m))}-${pad(Number(d))}`;return out.startsWith(month.slice(0,7))?out:null}
  const mm=s.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if(!mm)return null;
  return map.get(`${Number(mm[1])}/${Number(mm[2])}/${mm[3]}`)||map.get(`${pad(Number(mm[1]))}/${pad(Number(mm[2]))}/${mm[3]}`)||null;
}

function ensureTargetUi(){
  const opening=tf$('opening');if(!opening)return;
  const firstMetrics=opening.querySelector('.card .metrics');
  if(firstMetrics&&!tf$('quickDailyTarget'))firstMetrics.insertAdjacentHTML('beforeend','<div class="metric"><span class="mut">مستهدف اليوم</span><strong id="quickDailyTarget">—</strong></div>');
  if(tf$('monthlyTargetCard'))return;
  const o2=tf$('o2');if(!o2)return;
  const card=document.createElement('div');card.id='monthlyTargetCard';card.className='card';card.style.marginTop='14px';
  card.innerHTML=`<div class="title">مستهدفات الشهر</div>
    <div id="monthlyTargetState"><div class="mut">تحميل...</div></div>
    <div id="monthlyTargetImport" class="hidden">
      <div class="notice">في بداية الشهر ارفع ملف Excel للمستهدفات مرة واحدة، ثم راجع الأرقام قبل الاعتماد.</div>
      <div class="field"><label>ملف Excel للمستهدفات</label><input id="monthlyTargetFile" type="file" accept=".xlsx,.xlsm"></div>
      <div id="monthlyTargetParseMsg"></div>
      <div id="monthlyTargetReview" class="hidden" style="margin-top:12px"></div>
    </div>`;
  o2.parentNode.insertBefore(card,o2);
  tf$('monthlyTargetFile')?.addEventListener('change',monthlyTargetFileChanged);
}

function setDailyMetric(){
  const el=tf$('quickDailyTarget');if(!el)return;
  const d=activeWorkDate(),r=targetPlan?.rows?.find(x=>x.target_date===d);
  el.textContent=r?money(r.basic_target):'—';
}

function renderTargetState(){
  ensureTargetUi();setDailyMetric();
  const state=tf$('monthlyTargetState'),box=tf$('monthlyTargetImport');if(!state||!box)return;
  const m=activeMonth();
  if(targetLoading){state.innerHTML='<div class="notice">جاري تحميل مستهدفات الشهر...</div>';box.classList.add('hidden');return}
  if(targetPlan?.imported&&targetPlan.month===m){
    const d=activeWorkDate(),today=targetPlan.rows.find(x=>x.target_date===d),source=targetPlan.rows[0]?.source_name||'الملف المعتمد';
    state.innerHTML=`<div class="notice ok"><b>مستهدفات ${monthAr(m)} معتمدة.</b><div style="margin-top:6px">المصدر: ${safe(source)}</div></div>
      <div class="metrics"><div class="metric"><span class="mut">مستهدف الشهر</span><strong>${money(targetPlan.total_basic)}</strong></div><div class="metric"><span class="mut">مستهدف اليوم</span><strong>${money(today?.basic_target)}</strong></div><div class="metric"><span class="mut">تحدي اليوم</span><strong>${money(today?.challenge_target)}</strong></div></div>`;
    box.classList.add('hidden');
  }else{
    state.innerHTML=`<div class="notice"><b>لم يتم اعتماد مستهدفات ${monthAr(m)} بعد.</b></div>`;
    box.classList.remove('hidden');
  }
  applySalesPlanLock();
}

async function loadTargetPlan(force=false){
  if(!getApp()?.date&&!getApp()?.calendarDate)return;
  const m=activeMonth();if(!force&&targetPlanMonth===m&&targetPlan)return renderTargetState();
  targetLoading=true;targetPlanMonth=m;renderTargetState();
  try{targetPlan=await window.api('targets-month',{q:{month:m}})}catch(e){targetPlan={month:m,imported:false,rows:[]};console.error(e)}finally{targetLoading=false;renderTargetState()}
}

function headerNorm(v){return arabicDigits(v).toLowerCase().replace(/[\s_\-–—%]+/g,'').replace(/[.:/\\]/g,'')}
function cellText(cell){if(!cell)return'';if(typeof cell.text==='string'&&cell.text.trim())return cell.text.trim();let v=cell.value;if(v&&typeof v==='object'&&v.result!==undefined)v=v.result;return String(v??'').trim()}
function isDateHeader(s){const n=headerNorm(s);return n==='date'||n.includes('date')||n.includes('التاريخ')}
function isBasicHeader(s){const n=headerNorm(s);return (n.includes('basic')&&n.includes('target'))||n.includes('basictarget')||n.includes('المستهدفالأساسي')||n.includes('التارقتالأساسي')}
function isChallengeHeader(s){const n=headerNorm(s);return (n.includes('challenge')&&n.includes('target'))||n.includes('challengetarget')||n.includes('مستهدفالتحدي')||n.includes('تارقتالتحدي')}

async function parseExcelFile(file){
  if(!window.ExcelJS)throw Error('تعذر تحميل أداة Excel');
  const wb=new ExcelJS.Workbook();await wb.xlsx.load(await file.arrayBuffer());const month=activeMonth(),dmap=dateMaps(month),found=new Map();let headerFound=false;
  wb.eachSheet(ws=>{
    let header=null;
    for(let r=1;r<=Math.min(ws.rowCount,60)&&!header;r++){
      const row=ws.getRow(r);let dc=0,bc=0,cc=0;
      for(let c=1;c<=Math.min(ws.columnCount,30);c++){const t=cellText(row.getCell(c));if(!dc&&isDateHeader(t))dc=c;if(!bc&&isBasicHeader(t))bc=c;if(!cc&&isChallengeHeader(t))cc=c}
      if(dc&&bc)header={row:r,dateCol:dc,basicCol:bc,challengeCol:cc};
    }
    if(!header)return;headerFound=true;
    for(let r=header.row+1;r<=ws.rowCount;r++){
      const row=ws.getRow(r),dc=row.getCell(header.dateCol),date=parseDisplayDate(dc.value??cellText(dc),month,dmap);if(!date)continue;
      const basic=num(row.getCell(header.basicCol).value??cellText(row.getCell(header.basicCol)));if(basic===null)continue;
      const challenge=header.challengeCol?num(row.getCell(header.challengeCol).value??cellText(row.getCell(header.challengeCol))):null;
      found.set(date,{basic_target:basic,challenge_target:challenge});
    }
  });
  if(!headerFound)throw Error('لم أجد أعمدة Date و Basic Target داخل ملف Excel');
  if(!found.size)throw Error('لم أجد مستهدفات مطابقة لأيام هذا الشهر داخل الملف');
  return found;
}

function buildDraft(found){return monthDates(activeMonth()).map(d=>({target_date:d,basic_target:found.get(d)?.basic_target??'',challenge_target:found.get(d)?.challenge_target??''}))}
function renderReview(){
  const box=tf$('monthlyTargetReview');if(!box)return;const missing=targetDraft.filter(r=>r.basic_target==='').length,recognized=targetDraft.length-missing;
  box.classList.remove('hidden');box.innerHTML=`<div class="notice ${missing?'':'ok'}"><b>راجع الأرقام قبل الاعتماد.</b><div style="margin-top:5px">تمت قراءة ${recognized} من ${targetDraft.length} يومًا.${missing?` أكمل ${missing} يومًا الناقصة يدويًا قبل الاعتماد.`:''}</div></div>
    <div class="scroll" style="max-height:430px"><table><thead><tr><th>التاريخ</th><th>اليوم</th><th>المستهدف الأساسي</th><th>مستهدف التحدي</th></tr></thead><tbody>${targetDraft.map(r=>`<tr><td>${r.target_date}</td><td>${dayAr(r.target_date)}</td><td><input class="targetBasic" data-date="${r.target_date}" inputmode="decimal" value="${r.basic_target}"></td><td><input class="targetChallenge" data-date="${r.target_date}" inputmode="decimal" value="${r.challenge_target}"></td></tr>`).join('')}</tbody></table></div>
    <div class="actions"><button id="monthlyTargetCancel" class="btn ghost">إلغاء</button><button id="monthlyTargetApprove" class="btn gold">اعتماد مستهدفات الشهر</button></div>`;
  tf$('monthlyTargetCancel')?.addEventListener('click',resetImport);
  tf$('monthlyTargetApprove')?.addEventListener('click',approveTargetImport);
}

async function monthlyTargetFileChanged(e){
  const file=e.target.files?.[0];if(!file)return;const msg=tf$('monthlyTargetParseMsg'),review=tf$('monthlyTargetReview');if(review)review.classList.add('hidden');if(msg)msg.innerHTML='<div class="notice">جاري قراءة ملف Excel...</div>';
  try{if(!/\.(xlsx|xlsm)$/i.test(file.name))throw Error('ارفع ملف Excel بصيغة xlsx أو xlsm فقط');targetSourceType='excel';targetSourceName=file.name;targetDraft=buildDraft(await parseExcelFile(file));if(msg)msg.innerHTML='';renderReview()}catch(err){if(msg)msg.innerHTML=`<div class="notice err">${safe(err.message)}</div>`}
}

function resetImport(){targetDraft=[];targetSourceName='';targetSourceType='';const input=tf$('monthlyTargetFile');if(input)input.value='';if(tf$('monthlyTargetParseMsg'))tf$('monthlyTargetParseMsg').innerHTML='';tf$('monthlyTargetReview')?.classList.add('hidden')}
function collectReview(){return monthDates(activeMonth()).map(d=>{const b=document.querySelector(`.targetBasic[data-date="${d}"]`)?.value.trim()??'',c=document.querySelector(`.targetChallenge[data-date="${d}"]`)?.value.trim()??'';if(b==='')throw Error(`مستهدف ${d} الأساسي مطلوب`);const bn=num(b),cn=c===''?null:num(c);if(bn===null||bn<0)throw Error(`راجع المستهدف الأساسي لتاريخ ${d}`);if(c!==''&&(cn===null||cn<0))throw Error(`راجع مستهدف التحدي لتاريخ ${d}`);return{target_date:d,basic_target:bn,challenge_target:cn}})}
async function approveTargetImport(){
  const btn=tf$('monthlyTargetApprove');try{const rows=collectReview();if(!confirm(`اعتماد مستهدفات ${monthAr(activeMonth())}؟ بعد الاعتماد سيظهر مستهدف كل يوم تلقائيًا.`))return;if(btn){btn.disabled=true;btn.textContent='جاري الاعتماد...'}const res=await api('targets-import',{method:'POST',body:{month:activeMonth(),source_type:targetSourceType,source_name:targetSourceName,rows}});targetPlan=res;targetPlanMonth=activeMonth();resetImport();await refresh();try{window.renderOpeningQuick?.()}catch{}renderTargetState();alert('تم اعتماد مستهدفات الشهر. من الآن سيظهر مستهدف اليوم تلقائيًا.')}catch(err){alert(err.message)}finally{if(btn){btn.disabled=false;btn.textContent='اعتماد مستهدفات الشهر'}}
}

function applySalesPlanLock(){
  if(!targetPlan?.imported||targetPlan.month!==activeMonth())return;const d=activeWorkDate(),today=targetPlan.rows.find(r=>r.target_date===d),m=tf$('salesMonthlyTarget'),dy=tf$('salesDailyTarget');if(m){m.value=targetPlan.total_basic;m.disabled=true}if(dy){dy.value=today?.basic_target??'';dy.disabled=true}const msg=tf$('salesMsg');if(msg&&document.getElementById('sales')?.classList.contains('active'))msg.innerHTML='<div class="notice ok">مستهدف الشهر واليوم مأخوذان تلقائيًا من خطة المستهدفات المعتمدة.</div>'
}

const oldRenderOpening=window.renderOpening;
if(typeof oldRenderOpening==='function')window.renderOpening=function(){oldRenderOpening.apply(this,arguments);ensureTargetUi();renderTargetState();loadTargetPlan()};
const oldRenderOpeningQuick=window.renderOpeningQuick;
if(typeof oldRenderOpeningQuick==='function')window.renderOpeningQuick=function(){oldRenderOpeningQuick.apply(this,arguments);setDailyMetric()};
const oldRenderSales=window.renderSales;
if(typeof oldRenderSales==='function')window.renderSales=function(){oldRenderSales.apply(this,arguments);applySalesPlanLock()};
const oldOpenSales=window.openSales;
if(typeof oldOpenSales==='function')window.openSales=function(){oldOpenSales.apply(this,arguments);loadTargetPlan().then(applySalesPlanLock)};

ensureTargetUi();
let tries=0;const timer=setInterval(()=>{tries++;if(getApp()?.date||getApp()?.calendarDate){clearInterval(timer);loadTargetPlan()}else if(tries>60)clearInterval(timer)},250);
})();