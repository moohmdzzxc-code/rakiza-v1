(()=>{
'use strict';

const RSI_VERSION='0.2.0';
const RSI_STATE={last:null,busy:false};

const RSI_SECTIONS={
  'الفاخر':['الفاخر','فاخر','فاخـر','fakher'],
  'الأعمال':['الأعمال','الاعمال','اعمال','أعمال','business'],
  'الكلاسيك':['الكلاسيك','كلاسيك','classic'],
  'الأشمغة':['الأشمغة','الاشمغة','اشمغة','أشمغة','شماغ','شماخ','غترة','غتره','shumagh','ghutra'],
  'الداخليات':['الداخليات','داخليات','ملابس داخلية','ملابس داخليه','u.w','uw','underwear'],
  'الحركات':['الحركات','حركات','school','سكول'],
  'الزخرفات':['الزخرفات','زخرفات','zakhrafat'],
  'ري ثوب':['ري ثوب','ريثوب','re thobe','rethobe'],
  'الصيفي':['الصيفي','صيفي','summer'],
  'الشتوي':['الشتوي','شتوي','winter'],
  'العقال والطاقية':['العقال والطاقية','العقال والطاقيه','عقال','طاقية','طاقيه','egal','hat'],
  'الجلابيات والبيجامات':['الجلابيات والبيجامات','جلابيات','جلابية','جلابيه','بيجامات','بيجامة','بيجامه','بيجاما','البيجاما','nightrobe','pajama','pigama'],
  'الإكسسوارات والجوارب':['الإكسسوارات والجوارب','الاكسسوارات والجوارب','اكسسوارات','إكسسوارات','جوارب','accessories','socks']
};

const RSI_MONTHS={
  'يناير':1,'فبراير':2,'مارس':3,'ابريل':4,'أبريل':4,'مايو':5,'يونيو':6,'يوليو':7,
  'اغسطس':8,'أغسطس':8,'سبتمبر':9,'اكتوبر':10,'أكتوبر':10,'نوفمبر':11,'ديسمبر':12
};

const RSI_STOP=new Set([
  'وش','ايش','إيش','ما','هو','هي','هذا','هذه','هذي','ذا','ذي','عندي','عندنا','لي','لنا','من','في','على','عن','الى','إلى','و','او','أو','طيب','تمام','الحين','الان','الآن','بس','كل','كم','مين','اي','أي','اكثر','أكثر','اقل','أقل','اعلى','أعلى','شي','شيء','اشياء','أشياء','طلع','طلعلي','ورني','وريني','اعرض','أعرض','عطني','اعطني','أعطني','حلل','حللي','تحليل','قارن','قارنة','قارنه','رتب','صدر','صدّر','اكسل','إكسل','excel','نواقص','النواقص','نقص','ناقص','ناقصة','ناقصه','صنف','اصناف','أصناف','منتج','منتجات','مقاس','مقاسات','قسم','اقسام','أقسام','فرص','فرصة','فرصه','ضائعة','ضايعة','ضايعه','مفقودة','مفقوده','طلب','طلبنا','طلبناه','طلبناها','مطلوب','المطلوب','تغذية','تغذيه','توريد','وصل','وصلت','وصلنا','وصلتنا','باقي','متكرر','يتكرر','تكرر','مرة','مره','مرات','اليوم','امس','أمس','البارح','بكره','بكرة','غدا','غداً','اسبوع','أسبوع','الاسبوع','الأسبوع','شهر','الشهر','هذا','هالشهر','الماضي','السابق','الجاي','القادم'
].map(x=>normBasic(x)));

function normBasic(v){
  return String(v??'').toLowerCase()
    .replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/[\u064B-\u065F\u0670]/g,'').replace(/ـ/g,'')
    .replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/ؤ/g,'و').replace(/ئ/g,'ي')
    .replace(/[،,:;؛!?؟.()\[\]{}"']/g,' ').replace(/\s+/g,' ').trim();
}
function norm(v){return window.RakizaAI?.normalize?window.RakizaAI.normalize(v):normBasic(v)}
function esc(v){return String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]))}
function num(v){const n=Number(v||0);return Number.isFinite(n)?n:0}
function fmt(v){return num(v).toLocaleString('en-US')}
function getApp(){try{return app}catch{return window.app||{}}}
function baseDate(){const a=getApp();return String(a.calendarDate||a.date||new Date().toISOString().slice(0,10)).slice(0,10)}
function dateObj(v){return new Date(String(v)+'T12:00:00')}
function iso(d){return d.toISOString().slice(0,10)}
function addDays(v,n){const d=dateObj(v);d.setDate(d.getDate()+n);return iso(d)}
function monthKey(v){return String(v||'').slice(0,7)}
function previousMonth(k){const m=String(k).match(/^(20\d{2})-(\d{2})$/);if(!m)return null;const d=new Date(Number(m[1]),Number(m[2])-2,1);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`}
function sunday(v){const d=dateObj(v);d.setDate(d.getDate()-d.getDay());return iso(d)}
function daysBetween(a,b){if(!a||!b)return null;return Math.max(0,Math.floor((dateObj(b)-dateObj(a))/86400000))}

function chat(role,html){
  const c=document.getElementById('assistantChat');if(!c)return;
  const mine=role==='user';
  c.insertAdjacentHTML('beforeend',`<div style="display:flex;justify-content:${mine?'flex-start':'flex-end'}"><div class="task" style="max-width:88%;margin:0;background:${mine?'#eef3f8':'#fff'};border-color:${mine?'#d6e0ea':'#e3e7ec'}">${html}</div></div>`);
  c.lastElementChild?.scrollIntoView({behavior:'smooth',block:'nearest'});
}

function has(text,arr){const n=norm(text);return arr.some(x=>n.includes(norm(x)))}
function tokens(text){return norm(text).split(' ').filter(Boolean)}
function fuzzyToken(a,b){
  a=norm(a);b=norm(b);if(a===b)return true;if(a.length<4||b.length<4)return false;
  const p=Array.from({length:b.length+1},(_,i)=>i),c=new Array(b.length+1);
  for(let i=1;i<=a.length;i++){c[0]=i;for(let j=1;j<=b.length;j++)c[j]=Math.min(c[j-1]+1,p[j]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));for(let j=0;j<=b.length;j++)p[j]=c[j]}
  return p[b.length]<=(Math.max(a.length,b.length)>=8?2:1);
}

function detectSection(text){
  const n=norm(text),found=[];
  for(const [name,aliases] of Object.entries(RSI_SECTIONS)){
    for(const a of aliases){const na=norm(a);if(n.includes(na)||(!na.includes(' ')&&tokens(text).some(t=>fuzzyToken(t,na)))){found.push({name,score:na.length});break}}
  }
  const appSections=getApp().sections||[];
  for(const s of appSections){const ns=norm(s.name);if(ns&&n.includes(ns)&&!found.some(x=>x.name===s.name))found.push({name:s.name,score:ns.length})}
  found.sort((a,b)=>b.score-a.score);return found[0]?.name||null;
}

function detectNamedMonths(text){
  const n=norm(text),baseYear=dateObj(baseDate()).getFullYear(),defs=[
    ['يناير',1],['فبراير',2],['مارس',3],['ابريل',4],['مايو',5],['يونيو',6],['يوليو',7],
    ['اغسطس',8],['سبتمبر',9],['اكتوبر',10],['نوفمبر',11],['ديسمبر',12]
  ],out=[];
  for(const [name,m] of defs){
    let from=0,i;
    while((i=n.indexOf(name,from))>=0){
      const after=n.slice(i+name.length,i+name.length+12),ym=after.match(/^\s*(20\d{2})/),year=ym?Number(ym[1]):baseYear;
      out.push({key:`${year}-${String(m).padStart(2,'0')}`,name,index:i,year,month:m});
      from=i+name.length;
    }
  }
  out.sort((a,b)=>a.index-b.index);
  const uniq=[];for(const x of out)if(!uniq.some(y=>y.index===x.index&&y.key===x.key))uniq.push(x);return uniq;
}
function detectPeriod(text){
  const n=norm(text),base=baseDate(),named=detectNamedMonths(text);
  if(named.length>=2)return{type:'compare',periods:named.slice(0,2).map(x=>({type:'month',month:x.key,label:`${x.name}${x.year!==dateObj(base).getFullYear()?` ${x.year}`:''}`}))};
  if(named.length===1)return{type:'month',month:named[0].key,label:named[0].name};
  if(/هذا الشهر|هالشهر|الشهر الحالي|من بدايه الشهر|من اول الشهر/.test(n))return{type:'month',month:monthKey(base),label:'هذا الشهر'};
  if(/الشهر الماضي|الشهر السابق|الشهر اللي فات|الشهر الي فات/.test(n))return{type:'month',month:previousMonth(monthKey(base)),label:'الشهر الماضي'};
  let m=n.match(/اخر\s*(\d+)\s*(?:يوم|ايام)/);if(m){const c=Math.max(1,Number(m[1]));return{type:'range',start:addDays(base,-c+1),end:base,label:`آخر ${c} يوم`}}
  if(/هذا الاسبوع|هالاسبوع|الاسبوع الحالي|الاسبوع ذا/.test(n)){const st=sunday(base);return{type:'range',start:st,end:addDays(st,6),label:'هذا الأسبوع'}}
  if(/الاسبوع الماضي|الاسبوع السابق|الاسبوع اللي فات|الاسبوع الي فات/.test(n)){const st=addDays(sunday(base),-7);return{type:'range',start:st,end:addDays(st,6),label:'الأسبوع الماضي'}}
  if(/اليوم/.test(n))return{type:'date',date:base,label:'اليوم'};
  if(/امس|البارح/.test(n))return{type:'date',date:addDays(base,-1),label:'أمس'};
  return null;
}
function inPeriod(date,p){
  if(!p)return true;if(!date)return false;const d=String(date).slice(0,10);
  if(p.type==='date')return d===p.date;if(p.type==='month')return d.slice(0,7)===p.month;if(p.type==='range')return d>=p.start&&d<=p.end;return true;
}

function statusKind(row){
  const s=norm(row.shortage_status||'');
  if(s===norm('مفتوح'))return'open';
  if(s===norm('تم الطلب'))return'ordered';
  if(s===norm('تمت التغذية'))return'supplied';
  if(s===norm('مغلق'))return'closed';
  return'other';
}
function displayStatus(row){
  const k=statusKind(row);
  if(k==='open')return row.excel_exported_at?'تم تصدير Excel — بانتظار تسجيل الطلب':'مفتوح — بانتظار تصدير Excel';
  if(k==='ordered')return'تم الطلب — قيد المتابعة';
  if(k==='supplied')return'تمت التغذية';if(k==='closed')return'مغلق';return row.shortage_status||'—';
}
function rowSection(row){return row.sections?.name||(getApp().sections||[]).find(s=>s.id===row.section_id)?.name||'غير محدد'}
function rowKey(row){return`${norm(rowSection(row))}|${norm(row.size||'')}`}
function itemLabel(row){return String(row.size||'—')}

function detectSpec(text,analysis){
  const n=norm(text),section=detectSection(text),prior=RSI_STATE.last;
  let period=detectPeriod(text);
  if(!period&&prior?.spec?.period?.type==='month'&&/(?:الشهر|والشهر) (?:اللي|الي) قبله|الشهر قبله/.test(n)){
    const pm=previousMonth(prior.spec.period.month);period={type:'month',month:pm,label:'الشهر اللي قبله'};
  }
  const periodOnly=!!period&&/^(?:طيب |تمام |زين )?(?:هذا الشهر|هالشهر|الشهر|والشهر|هذا الاسبوع|هالاسبوع|الاسبوع|والاسبوع)/.test(n);
  const follow=!!prior&&(
    /^(طيب|تمام|زين|وكمان|وبعدين|بعدها|وبرضو|وبرضه|وكم|ووش|وايش|والشهر|والاسبوع)/.test(n)||
    /(منه|منها|فيه|فيها|هذي|هذا|نفسه|نفسها|صدرها|قارنها|اللي قبله|الي قبله)/.test(n)||periodOnly
  );
  const spec={task:'summary',metric:'count',groupBy:null,status:null,section,period,dateField:'first_detected_date',limit:5,focus:null,follow};
  const explicit={task:false,metric:false,groupBy:false,status:false,period:!!period,section:!!section};

  if(/بانتظار (?:الاكسل|اكسل)|لسه ما صدر|ما صدرناه|ما تصدر|مفتوح.*اكسل/.test(n)){spec.status='pending_export';explicit.status=true}
  else if(/صدرنا.*(?:لسه|ما).*طلب|مصدر.*(?:لسه|ما).*طلب|بانتظار.*طلب|تصدير.*بانتظار.*طلب/.test(n)){spec.status='exported_waiting_order';explicit.status=true}
  else if(/طلبناه.*ما (?:وصل|جانا)|طلبنا.*ما (?:وصل|جانا)|ما وصل|ما جانا|بانتظار.*تغذ|قيد المتابع/.test(n)){spec.status='ordered';spec.dateField='ordered_date';explicit.status=true}
  else if(/تم الطلب|انطلب/.test(n)){spec.status='ordered';spec.dateField='ordered_date';explicit.status=true}
  else if(/تمت التغذ|تم تغذ|وصلت التغذ|وصلت البضاع|وش وصل|ايش وصل|تغذي|توفر بعد النقص/.test(n)){spec.status='supplied';spec.dateField='supplied_date';explicit.status=true}
  else if(/مفتوح|مفتوحه|ما انطلب|قبل الطلب/.test(n)){spec.status='open';explicit.status=true}
  else if(/غير منتهي|غير مكتمل|لسه ناقص|باقي ناقص|النواقص الحاليه/.test(n)){spec.status='unresolved';explicit.status=true}

  const exportCommand=/(?:^| )(?:صدر|تصدير) (?:لي|لنا|النواقص|النتيجه)|(?:^| )(?:صدرها|صدرهم)(?: لي)?(?:$| )|(?:سوي|جهز|طلع|اعمل|انشي).*اكسل|(?:ابي|ابغي|ابغا|اريد).*اكسل/.test(n);
  const recurWords=/متكرر|يتكرر|تكرر|كل شوي|ينقطع|انقطاع|يرجع.*ناقص|دايم.*ينقص|ينقص.*دايم/.test(n);
  if(/قارن|مقارنه|مقابل|الفرق بين/.test(n)||period?.type==='compare'){spec.task='compare';explicit.task=true}
  else if(exportCommand){spec.task='export';explicit.task=true}
  else if(/اكثر|اعلي|رتب/.test(n)||recurWords){spec.task='rank';explicit.task=true}
  else if(/كم|عدد|قد ايش/.test(n)){spec.task='metric';explicit.task=true}
  else if(/وش|ايش|ورني|اعرض|طلع|هات|عطني|وين/.test(n)){spec.task='list';explicit.task=true}

  if(/فرص|ضايع|ضائع|ضاعت|خسر|مفقود|راحت علينا/.test(n)){spec.metric='lost';explicit.metric=true}
  else if(/كميه.*طلب|كم.*(?:حبه|قطعه).*طلب|كم طلبنا|كم طلبناه|كم طلبناها|المطلوب|كميه مطلوبه|requested/.test(n)){spec.metric='requested';explicit.metric=true}
  else if(/باقي موجود|كم باقي|الموجود|المتوفر|كم موجود|current/.test(n)){spec.metric='current';explicit.metric=true}
  else if(/كم لها|كم له|من متي|من يوم متي|منذ|مده|صار له|صار لها|قد ايش له|قد ايش لها|كم جلس|كم قعد|له كم يوم|لها كم يوم|لين وصل|حتي وصل/.test(n)){spec.metric='age';explicit.metric=true}
  else if(recurWords||/كم مره|يرجع/.test(n)){spec.metric='recurrence';explicit.metric=true}

  if(spec.metric==='age'&&!explicit.task){spec.task='metric';explicit.task=true}
  if(/بعد.*تغذ|بعد ما.*وصل|رجع.*بعد|يتكرر.*تغذ/.test(n)){spec.task='rank';spec.metric='recur_after_supply';explicit.task=true;explicit.metric=true}

  if(/قسم|اقسام|اي قسم/.test(n)||(spec.metric==='lost'&&/وين|اي قسم/.test(n))){spec.groupBy='section';explicit.groupBy=true}
  else if(/حاله|حالات/.test(n)){spec.groupBy='status';explicit.groupBy=true}
  else if(/منتج|صنف|مقاس|اصناف|منتجات/.test(n)||spec.task==='rank'){spec.groupBy='item';explicit.groupBy=true}

  const lm=n.match(/(?:اكثر|اعلي|اول|top|اخطر)\s*(\d+)/);if(lm)spec.limit=Math.min(20,Math.max(1,Number(lm[1])));
  if(/اخطر/.test(n)){spec.task='rank';spec.metric='lost';spec.groupBy='item';spec.status='unresolved';spec.riskBy='lost';explicit.task=explicit.metric=explicit.groupBy=explicit.status=true}

  if(follow&&prior){
    const ps=prior.spec||{};
    if(!explicit.section&&ps.section)spec.section=ps.section;
    if(!spec.period&&ps.period)spec.period=ps.period;
    if(!explicit.task&&ps.task&&ps.task!=='export')spec.task=ps.task;
    if(!explicit.metric&&ps.metric)spec.metric=ps.metric;
    if(!explicit.groupBy&&ps.groupBy)spec.groupBy=ps.groupBy;
    if(!explicit.status&&ps.status)spec.status=ps.status;
    if(prior.focus)spec.focus=prior.focus;
  }
  return spec;
}
function isShortageLanguage(text,analysis){
  const n=norm(text),prior=RSI_STATE.last;
  const strong=/نواقص|تغذ|صنف|اصناف|منتج|منتجات|مقاس|مقاسات|مخزون|بضاع|فرص (?:ضايعه|ضائعه|مفقوده)|طلبناه.*ما (?:وصل|جانا)|طلبنا.*ما (?:وصل|جانا)|بانتظار (?:الاكسل|اكسل)|تمت التغذ/.test(n);
  const other=/فريق|موظف|موظفين|الحضور|غياب|تواجد|دوام|شفت|جاهزيه|مهام|مهمه|خطة اليوم|خطه اليوم|تنفيذ/.test(n);
  if(other&&!strong)return false;
  if(analysis?.entities?.domain==='shortages')return true;
  if(strong)return true;
  if(/نقص|ناقص|ناقصه/.test(n)&&detectSection(text))return true;
  if(/مقاس|صنف|منتج/.test(n)&&/يتكرر|متكرر|نقص|طلب|وصل|فرص|موجود|مطلوب|ينقطع/.test(n))return true;
  const sec=detectSection(text);if(sec&&/طلب|تغذ|وصل|ناقص|نقص|مقاس|صنف|منتج|فرص|موجود|مطلوب|مخزون/.test(n))return true;
  if(/\d{2,3}(?:[a-z]{1,4})?/i.test(n)&&/يتكرر|نقص|ناقص|طلب|وصل|فرص|موجود/.test(n))return true;
  if(prior&&/^(طيب|تمام|زين|وكمان|وبعدين|بعدها|وبرضو|وبرضه|وكم|ووش|وايش|والشهر|والاسبوع)|(?:منه|منها|فيه|فيها|هذي|هذا|نفسه|نفسها|صدرها|قارنها|اللي قبله|الي قبله)/.test(n))return true;
  return false;
}
function detectStrongProduct(text,rows,spec){
  if(spec.focus?.type==='item')return spec.focus.key;
  const n=norm(text),toks=tokens(text).filter(t=>!RSI_STOP.has(t)&&t.length>=2);
  const strong=toks.filter(t=>/\d/.test(t)||/[a-z]/i.test(t));
  for(const t of strong){if(rows.some(r=>norm(r.size).split(' ').some(x=>x===t||x.includes(t))))return t}
  if(spec.task==='rank'||spec.groupBy==='section'||spec.task==='compare'||spec.task==='export')return null;
  const candidates=[];
  for(const r of rows){const rt=norm(r.size),parts=[...new Set(rt.split(' ').filter(x=>x.length>=3&&!RSI_STOP.has(x)))];let score=0;for(const t of toks)if(parts.some(p=>p===t||p.includes(t)||t.includes(p)))score+=Math.min(5,t.length);if(score)candidates.push({key:rt,score,label:r.size})}
  candidates.sort((a,b)=>b.score-a.score);if(!candidates.length)return null;
  if(candidates[0].score>=5&&(candidates.length===1||candidates[0].score>candidates[1].score))return candidates[0].key;
  return null;
}

function applySpec(rows,spec,text){
  let out=rows.slice();
  if(spec.section)out=out.filter(r=>norm(rowSection(r))===norm(spec.section));
  if(spec.focus?.type==='section')out=out.filter(r=>norm(rowSection(r))===norm(spec.focus.key));
  if(spec.focus?.type==='item'&&spec.focus?.section)out=out.filter(r=>norm(rowSection(r))===norm(spec.focus.section));
  const prod=detectStrongProduct(text,out,spec);if(prod)out=out.filter(r=>norm(r.size).includes(norm(prod))||norm(prod).includes(norm(r.size)));
  if(spec.focus?.type==='item'&&!prod)out=out.filter(r=>norm(r.size)===norm(spec.focus.key));
  if(spec.status==='open')out=out.filter(r=>statusKind(r)==='open');
  if(spec.status==='ordered')out=out.filter(r=>statusKind(r)==='ordered');
  if(spec.status==='supplied')out=out.filter(r=>statusKind(r)==='supplied');
  if(spec.status==='unresolved')out=out.filter(r=>!['supplied','closed'].includes(statusKind(r)));
  if(spec.status==='pending_export')out=out.filter(r=>statusKind(r)==='open'&&!r.excel_exported_at);
  if(spec.status==='exported_waiting_order')out=out.filter(r=>statusKind(r)==='open'&&!!r.excel_exported_at);
  const dateField=spec.dateField||'first_detected_date';if(spec.period&&spec.period.type!=='compare')out=out.filter(r=>inPeriod(r[dateField]||r.first_detected_date,spec.period));
  return{rows:out,product:prod};
}
function aggregate(rows,groupBy,metric){
  const m=new Map(),oneSection=new Set(rows.map(rowSection)).size===1;
  for(const r of rows){
    const raw=groupBy==='section'?rowSection(r):groupBy==='status'?displayStatus(r):itemLabel(r);
    const id=groupBy==='item'?rowKey(r):norm(raw),label=groupBy==='item'?(oneSection?itemLabel(r):`${rowSection(r)} — ${itemLabel(r)}`):raw;
    if(!m.has(id))m.set(id,{key:id,label,count:0,lost:0,requested:0,current:0,rows:[]});
    const x=m.get(id);x.count++;x.lost+=num(r.lost_opportunities);x.requested+=num(r.requested_qty);x.current+=num(r.current_qty);x.rows.push(r);
  }
  const arr=[...m.values()];
  const value=x=>metric==='lost'?x.lost:metric==='requested'?x.requested:metric==='current'?x.current:x.count;
  arr.forEach(x=>x.value=value(x));arr.sort((a,b)=>b.value-a.value||b.count-a.count||String(a.label).localeCompare(String(b.label),'ar'));return arr;
}
function recurAfterSupply(rows){
  const groups=new Map();for(const r of rows){const k=rowKey(r);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(r)}
  const out=[];
  for(const g of groups.values()){
    g.sort((a,b)=>String(a.first_detected_date||'').localeCompare(String(b.first_detected_date||'')));
    let suppliedBefore=null,repeats=0,lost=0,requested=0;
    for(const r of g){if(suppliedBefore&&r.first_detected_date&&String(r.first_detected_date)>String(suppliedBefore)){repeats++;lost+=num(r.lost_opportunities);requested+=num(r.requested_qty)}if(r.supplied_date)suppliedBefore=r.supplied_date}
    if(repeats){const r=g[g.length-1];out.push({key:rowKey(r),label:`${rowSection(r)} — ${itemLabel(r)}`,value:repeats,count:g.length,lost,requested,rows:g})}
  }
  return out.sort((a,b)=>b.value-a.value||b.lost-a.lost);
}

function periodLabel(p){if(!p)return'كل السجل المتاح';if(p.type==='month')return p.label||p.month;if(p.type==='date')return p.label||p.date;if(p.type==='range')return p.label||`${p.start} إلى ${p.end}`;return'الفترة المحددة'}
function metrics(rows){
  const items=new Set(rows.map(rowKey)),repeatGroups=aggregate(rows,'item','recurrence').filter(x=>x.count>1).length;
  return{records:rows.length,items:items.size,requested:rows.reduce((s,r)=>s+num(r.requested_qty),0),lost:rows.reduce((s,r)=>s+num(r.lost_opportunities),0),open:rows.filter(r=>statusKind(r)==='open').length,ordered:rows.filter(r=>statusKind(r)==='ordered').length,supplied:rows.filter(r=>['supplied','closed'].includes(statusKind(r))).length,repeatGroups};
}
function metricName(m){return m==='lost'?'الفرص الضائعة':m==='requested'?'الكمية المطلوبة':m==='current'?'الكمية الموجودة':m==='recurrence'?'مرات التسجيل':'عدد حالات النقص'}
function metricValue(x,m){return m==='lost'?x.lost:m==='requested'?x.requested:m==='current'?x.current:x.count}

function summaryHtml(rows,spec){
  const m=metrics(rows),where=[spec.section?`القسم: ${spec.section}`:null,`الفترة: ${periodLabel(spec.period)}`].filter(Boolean).join(' | ');
  return `<b>ملخص النواقص حسب البيانات المسجلة في ركيزة</b><div class="mut" style="margin-top:6px">${esc(where)}</div><div class="metrics" style="margin-top:10px"><div class="metric"><span class="mut">حالات النقص</span><strong>${fmt(m.records)}</strong></div><div class="metric"><span class="mut">الكمية المطلوبة</span><strong>${fmt(m.requested)}</strong></div><div class="metric"><span class="mut">الفرص الضائعة</span><strong>${fmt(m.lost)}</strong></div><div class="metric"><span class="mut">تم الطلب — متابعة</span><strong>${fmt(m.ordered)}</strong></div></div><div class="mut" style="margin-top:8px">مفتوح قبل الطلب: ${fmt(m.open)} | تمت التغذية/الإغلاق: ${fmt(m.supplied)} | أصناف مسجلة: ${fmt(m.items)} | أصناف تكرر تسجيلها: ${fmt(m.repeatGroups)}</div>`;
}

function listHtml(rows,spec){
  if(!rows.length)return`<b>لم أجد نواقص مطابقة لطلبك.</b><div class="mut" style="margin-top:6px">الفترة: ${esc(periodLabel(spec.period))}${spec.section?` | القسم: ${esc(spec.section)}`:''}</div>`;
  const sorted=rows.slice().sort((a,b)=>String(b.first_detected_date||'').localeCompare(String(a.first_detected_date||''))),show=sorted.slice(0,10);
  let h=`<b>وجدت ${fmt(rows.length)} حالة مطابقة.</b><div class="mut" style="margin-top:6px">الفترة: ${esc(periodLabel(spec.period))}${spec.section?` | القسم: ${esc(spec.section)}`:''}</div><div style="margin-top:10px">`;
  h+=show.map(r=>`<div class="task"><b>${esc(rowSection(r))} — ${esc(itemLabel(r))}</b><div class="mut" style="margin-top:5px">الموجود: ${fmt(r.current_qty)} | المطلوب: ${fmt(r.requested_qty)} | الفرص الضائعة: ${fmt(r.lost_opportunities)}</div><div class="mut">أول رصد: ${esc(r.first_detected_date||'—')} | الطلب: ${esc(r.ordered_date||'—')} | التغذية: ${esc(r.supplied_date||'—')}</div><div style="margin-top:4px">الحالة: <b>${esc(displayStatus(r))}</b></div></div>`).join('');
  h+='</div>';if(rows.length>show.length)h+=`<div class="mut">وهناك ${fmt(rows.length-show.length)} حالة أخرى.</div>`;return h;
}

function rankHtml(rows,spec){
  let arr;if(spec.metric==='recur_after_supply')arr=recurAfterSupply(rows);else arr=aggregate(rows,spec.groupBy||'item',spec.metric);
  if(!arr.length)return'<b>لا توجد بيانات كافية لإظهار ترتيب لهذا الطلب.</b>';
  const show=arr.slice(0,spec.limit||5),mName=spec.metric==='recur_after_supply'?'تكرار بعد التغذية':metricName(spec.metric);
  let h=`<b>${spec.riskBy==='lost'?'الأعلى حسب الفرص الضائعة':'الترتيب حسب '+mName}</b><div class="mut" style="margin-top:6px">الفترة: ${esc(periodLabel(spec.period))}${spec.section?` | القسم: ${esc(spec.section)}`:''}</div><div style="margin-top:9px">`;
  h+=show.map((x,i)=>`<div class="task"><b>${i+1}. ${esc(x.label)}</b><div class="mut" style="margin-top:5px">${esc(mName)}: <b>${fmt(spec.metric==='recur_after_supply'?x.value:metricValue(x,spec.metric))}</b>${spec.metric!=='lost'&&x.lost?` | الفرص الضائعة: ${fmt(x.lost)}`:''}${spec.metric!=='requested'&&x.requested?` | الكمية المطلوبة: ${fmt(x.requested)}`:''}</div></div>`).join('');
  h+='</div>';if(spec.riskBy==='lost')h+='<div class="notice" style="margin-top:8px">فسرت «الأخطر» بالمقياس المباشر المسجل في ركيزة: أعلى فرص ضائعة، بدون اختراع درجة خطورة غير معتمدة.</div>';
  let focus=null;if(show[0]){if(spec.groupBy==='section')focus={type:'section',key:show[0].label,label:show[0].label};else if(show[0].rows?.[0])focus={type:'item',key:itemLabel(show[0].rows[0]),label:itemLabel(show[0].rows[0]),section:rowSection(show[0].rows[0])}}
  return{html:h,focus};
}
function metricHtml(rows,spec){
  if(spec.metric==='age'){
    if(!rows.length)return'<b>لا توجد حالة مطابقة لحساب مدة النقص.</b>';
    const show=rows.slice().sort((a,b)=>String(a.first_detected_date||'').localeCompare(String(b.first_detected_date||''))).slice(0,10),today=baseDate();
    return `<b>مدة النقص</b><div style="margin-top:9px">${show.map(r=>{const done=['supplied','closed'].includes(statusKind(r)),end=done?(r.supplied_date||r.closed_date||String(r.closed_at||r.updated_at||'').slice(0,10)||today):today,label=done?'حتى التغذية/الإغلاق':'حتى اليوم';return `${esc(rowSection(r))} — <b>${esc(itemLabel(r))}</b>: ${fmt(daysBetween(r.first_detected_date,end))} يوم ${label} (أول رصد ${esc(r.first_detected_date||'—')})`}).join('<br>')}</div>`;
  }
  const total=spec.metric==='lost'?rows.reduce((s,r)=>s+num(r.lost_opportunities),0):spec.metric==='requested'?rows.reduce((s,r)=>s+num(r.requested_qty),0):spec.metric==='current'?rows.reduce((s,r)=>s+num(r.current_qty),0):rows.length;
  return `<b>${esc(metricName(spec.metric))}: ${fmt(total)}</b><div class="mut" style="margin-top:6px">من ${fmt(rows.length)} حالة مطابقة | الفترة: ${esc(periodLabel(spec.period))}${spec.section?` | القسم: ${esc(spec.section)}`:''}</div>`;
}
function compareHtml(rows,spec){
  const periods=spec.period?.type==='compare'?spec.period.periods:null;
  if(!periods||periods.length<2)return'<b>فهمت أنك تريد مقارنة، لكن أحتاج فترتين واضحتين مثل: «قارن أغسطس بسبتمبر».</b>';
  const parts=periods.map(p=>{let r=rows.filter(x=>inPeriod(x.first_detected_date,p));if(spec.section)r=r.filter(x=>norm(rowSection(x))===norm(spec.section));return{p,m:metrics(r)}});
  const [a,b]=parts;
  return `<b>مقارنة النواقص: ${esc(periodLabel(a.p))} مقابل ${esc(periodLabel(b.p))}</b><div class="scroll" style="margin-top:10px"><table><thead><tr><th>المؤشر</th><th>${esc(periodLabel(a.p))}</th><th>${esc(periodLabel(b.p))}</th></tr></thead><tbody><tr><td>حالات النقص</td><td>${fmt(a.m.records)}</td><td>${fmt(b.m.records)}</td></tr><tr><td>الكمية المطلوبة</td><td>${fmt(a.m.requested)}</td><td>${fmt(b.m.requested)}</td></tr><tr><td>الفرص الضائعة</td><td>${fmt(a.m.lost)}</td><td>${fmt(b.m.lost)}</td></tr><tr><td>أصناف تكرر تسجيلها</td><td>${fmt(a.m.repeatGroups)}</td><td>${fmt(b.m.repeatGroups)}</td></tr><tr><td>تم الطلب — متابعة</td><td>${fmt(a.m.ordered)}</td><td>${fmt(b.m.ordered)}</td></tr><tr><td>تمت التغذية/الإغلاق</td><td>${fmt(a.m.supplied)}</td><td>${fmt(b.m.supplied)}</td></tr></tbody></table></div>`;
}

async function exportHtml(spec){
  if(typeof window.exportShortagesExcel!=='function')return'<b>تصدير ملف النواقص المعتمد غير متاح في هذه النسخة.</b>';
  const contextual=spec.follow&&RSI_STATE.last?.spec&&RSI_STATE.last.spec.task!=='export';
  if(contextual&&RSI_STATE.last?.spec?.status!=='open'&&RSI_STATE.last?.spec?.status!=='pending_export')return'<b>أفهم أنك تريد تصدير النتيجة السابقة.</b><div class="notice" style="margin-top:8px">التصدير المعتمد حاليًا في ملف النواقص هو «Excel للنواقص المفتوحة» فقط. تصدير نتائج التحليل المفلترة سنبنيه كوحدة مستقلة لاحقًا حتى لا أغيّر صيغة الملف المعتمدة.</div>';
  setTimeout(()=>window.exportShortagesExcel(),50);
  return'<b>سأستخدم ملف Excel المعتمد للنواقص المفتوحة.</b><div class="mut" style="margin-top:6px">سيتم تنفيذ نفس دورة التصدير الموجودة أصلًا في ملف النواقص، دون تغيير تصميم الملف أو منطق الطلب.</div>';
}

async function answer(text,analysis){
  const all=await api('shortages');if(!Array.isArray(all))throw Error('تعذر قراءة بيانات النواقص');
  const spec=detectSpec(text,analysis);
  if(spec.task==='export'){const html=await exportHtml(spec);RSI_STATE.last={text,spec,focus:RSI_STATE.last?.focus||null};return html}
  if(spec.task==='compare'){const html=compareHtml(all,spec);RSI_STATE.last={text,spec,focus:null};return html}
  const applied=applySpec(all,spec,text),rows=applied.rows;
  let html,focus=null;
  if(spec.task==='rank'){const r=rankHtml(rows,spec);if(typeof r==='string')html=r;else{html=r.html;focus=r.focus}}
  else if(spec.task==='metric')html=metricHtml(rows,spec);
  else if(spec.task==='list')html=listHtml(rows,spec);
  else html=summaryHtml(rows,spec);
  if(!focus&&spec.focus)focus=spec.focus;
  if(!focus&&applied.product&&rows[0])focus={type:'item',key:itemLabel(rows[0]),label:itemLabel(rows[0])};
  RSI_STATE.last={text,spec,focus,rowsCount:rows.length,product:applied.product};
  return html;
}

function updateBaseContext(text,analysis){
  if(!window.RakizaAI?.state)return;
  window.RakizaAI.state.context={intent:'shortages_intelligence',entities:{...(analysis?.entities||{}),domain:'shortages',shortages:RSI_STATE.last},lastMessage:text};
}

const baseAsk=window.askRakizaAssistant;
const baseOpen=window.openAssistant;
window.openAssistant=function(){
  if(typeof baseOpen==='function')baseOpen();
  setTimeout(()=>{
    const sec=document.getElementById('assistant'),notice=sec?.querySelector('.notice'),suggest=document.getElementById('assistantSuggestions'),input=document.getElementById('assistantInput');
    if(notice)notice.innerHTML='<b>ركيزة AI يعمل من داخل ركيزة.</b><div style="margin-top:5px">وحدة النواقص مرتبطة فعليًا ببيانات ملف النواقص وتفهم الصياغات المختلفة، التكرار، الفرص الضائعة، الحالات، الأقسام والفترات. بقية المجالات ما زالت تُبنى تدريجيًا.</div>';
    if(suggest)suggest.innerHTML=`<button class="mini" onclick="askAssistantQuick('وش أكثر صنف يتكرر نقصه؟')">أكثر نقص متكرر</button><button class="mini" onclick="askAssistantQuick('وش طلبناه وما وصل للحين؟')">بانتظار التغذية</button><button class="mini" onclick="askAssistantQuick('أي قسم خسرنا فيه فرص أكثر؟')">الفرص حسب القسم</button><button class="mini" onclick="askAssistantQuick('قارن أغسطس بسبتمبر في النواقص')">مقارنة شهرين</button>`;
    if(input)input.placeholder='مثال: وش أكثر صنف يتكرر نقصه؟ أو كم فرصة ضاعت من الفاخر هذا الشهر؟';
  },0);
};

window.askRakizaAssistant=async function(){
  const inp=document.getElementById('assistantInput'),q=inp?.value.trim();if(!q)return;
  let analysis=null;try{analysis=window.RakizaAI?.analyze?.(q)||null}catch{}
  if(!isShortageLanguage(q,analysis)){if(typeof baseAsk==='function')return baseAsk();return}
  if(RSI_STATE.busy)return;
  RSI_STATE.busy=true;if(inp)inp.value='';chat('user',esc(q));
  try{const html=await answer(q,analysis);updateBaseContext(q,analysis);chat('assistant',html)}
  catch(e){chat('assistant',`<div class="notice err"><b>تعذر تحليل النواقص.</b><div style="margin-top:5px">${esc(e.message||String(e))}</div></div>`)}
  finally{RSI_STATE.busy=false}
};

window.RakizaAI=window.RakizaAI||{};
window.RakizaAI.shortages={version:RSI_VERSION,state:RSI_STATE,detectSpec,detectSection,detectPeriod,isShortageLanguage};
})();