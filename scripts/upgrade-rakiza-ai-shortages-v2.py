from pathlib import Path
import re

p=Path('rakiza-ai-shortages.js')
s=p.read_text(encoding='utf-8')
s=s.replace("const RSI_VERSION='0.1.0';","const RSI_VERSION='0.2.0';",1)
s=s.replace("'الجلابيات والبيجامات':['الجلابيات والبيجامات','جلابيات','جلابية','جلابيه','بيجامات','بيجامة','بيجامه','nightrobe','pajama','pigama'],",
            "'الجلابيات والبيجامات':['الجلابيات والبيجامات','جلابيات','جلابية','جلابيه','بيجامات','بيجامة','بيجامه','بيجاما','البيجاما','nightrobe','pajama','pigama'],",1)

def repl_between(start, end, new):
    global s
    pattern=re.escape(start)+r'.*?(?='+re.escape(end)+r')'
    ns,n=re.subn(pattern,lambda _m:new+'\n',s,count=1,flags=re.S)
    if n!=1:
        raise SystemExit(f'Could not patch block: {start}')
    s=ns

repl_between('function detectNamedMonths(text){','function detectPeriod(text){',r'''function detectNamedMonths(text){
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
}''')

repl_between('function detectPeriod(text){','function inPeriod(date,p){',r'''function detectPeriod(text){
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
}''')

repl_between('function detectSpec(text,analysis){','function isShortageLanguage(text,analysis){',r'''function detectSpec(text,analysis){
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

  const exportCommand=/(?:^| )(?:صدر|تصدير) (?:لي|لنا|النواقص|النتيجه)|^(?:صدرها|صدرهم)(?: لي)?$|(?:سوي|جهز|طلع|اعمل|انشي).*اكسل|(?:ابي|ابغي|ابغا|اريد).*اكسل/.test(n);
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
}''')

repl_between('function isShortageLanguage(text,analysis){','function detectStrongProduct(text,rows,spec){',r'''function isShortageLanguage(text,analysis){
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
}''')

repl_between('function applySpec(rows,spec,text){','function aggregate(rows,groupBy,metric){',r'''function applySpec(rows,spec,text){
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
}''')

repl_between('function aggregate(rows,groupBy,metric){','function recurAfterSupply(rows){',r'''function aggregate(rows,groupBy,metric){
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
}''')

repl_between('function rankHtml(rows,spec){','function metricHtml(rows,spec){',r'''function rankHtml(rows,spec){
  let arr;if(spec.metric==='recur_after_supply')arr=recurAfterSupply(rows);else arr=aggregate(rows,spec.groupBy||'item',spec.metric);
  if(!arr.length)return'<b>لا توجد بيانات كافية لإظهار ترتيب لهذا الطلب.</b>';
  const show=arr.slice(0,spec.limit||5),mName=spec.metric==='recur_after_supply'?'تكرار بعد التغذية':metricName(spec.metric);
  let h=`<b>${spec.riskBy==='lost'?'الأعلى حسب الفرص الضائعة':'الترتيب حسب '+mName}</b><div class="mut" style="margin-top:6px">الفترة: ${esc(periodLabel(spec.period))}${spec.section?` | القسم: ${esc(spec.section)}`:''}</div><div style="margin-top:9px">`;
  h+=show.map((x,i)=>`<div class="task"><b>${i+1}. ${esc(x.label)}</b><div class="mut" style="margin-top:5px">${esc(mName)}: <b>${fmt(spec.metric==='recur_after_supply'?x.value:metricValue(x,spec.metric))}</b>${spec.metric!=='lost'&&x.lost?` | الفرص الضائعة: ${fmt(x.lost)}`:''}${spec.metric!=='requested'&&x.requested?` | الكمية المطلوبة: ${fmt(x.requested)}`:''}</div></div>`).join('');
  h+='</div>';if(spec.riskBy==='lost')h+='<div class="notice" style="margin-top:8px">فسرت «الأخطر» بالمقياس المباشر المسجل في ركيزة: أعلى فرص ضائعة، بدون اختراع درجة خطورة غير معتمدة.</div>';
  let focus=null;if(show[0]){if(spec.groupBy==='section')focus={type:'section',key:show[0].label,label:show[0].label};else if(show[0].rows?.[0])focus={type:'item',key:itemLabel(show[0].rows[0]),label:itemLabel(show[0].rows[0]),section:rowSection(show[0].rows[0])}}
  return{html:h,focus};
}''')

repl_between('function metricHtml(rows,spec){','function compareHtml(rows,spec){',r'''function metricHtml(rows,spec){
  if(spec.metric==='age'){
    if(!rows.length)return'<b>لا توجد حالة مطابقة لحساب مدة النقص.</b>';
    const show=rows.slice().sort((a,b)=>String(a.first_detected_date||'').localeCompare(String(b.first_detected_date||''))).slice(0,10),today=baseDate();
    return `<b>مدة النقص</b><div style="margin-top:9px">${show.map(r=>{const done=['supplied','closed'].includes(statusKind(r)),end=done?(r.supplied_date||r.closed_date||String(r.closed_at||r.updated_at||'').slice(0,10)||today):today,label=done?'حتى التغذية/الإغلاق':'حتى اليوم';return `${esc(rowSection(r))} — <b>${esc(itemLabel(r))}</b>: ${fmt(daysBetween(r.first_detected_date,end))} يوم ${label} (أول رصد ${esc(r.first_detected_date||'—')})`}).join('<br>')}</div>`;
  }
  const total=spec.metric==='lost'?rows.reduce((s,r)=>s+num(r.lost_opportunities),0):spec.metric==='requested'?rows.reduce((s,r)=>s+num(r.requested_qty),0):spec.metric==='current'?rows.reduce((s,r)=>s+num(r.current_qty),0):rows.length;
  return `<b>${esc(metricName(spec.metric))}: ${fmt(total)}</b><div class="mut" style="margin-top:6px">من ${fmt(rows.length)} حالة مطابقة | الفترة: ${esc(periodLabel(spec.period))}${spec.section?` | القسم: ${esc(spec.section)}`:''}</div>`;
}''')

p.write_text(s,encoding='utf-8')

tests=Path('tests');tests.mkdir(exist_ok=True)
Path('tests/rakiza-ai-shortages.test.js').write_text(r'''global.window={RakizaAI:{normalize:null,state:{}}};
global.app={calendarDate:'2026-09-13',date:'2026-09-13',sections:[
{id:'f',name:'الفاخر'},{id:'b',name:'الأعمال'},{id:'c',name:'الكلاسيك'},{id:'u',name:'الداخليات'},{id:'s',name:'الأشمغة'},{id:'m',name:'الحركات'},{id:'z',name:'الزخرفات'},{id:'r',name:'ري ثوب'},{id:'su',name:'الصيفي'},{id:'w',name:'الشتوي'},{id:'e',name:'العقال والطاقية'},{id:'n',name:'الجلابيات والبيجامات'},{id:'a',name:'الإكسسوارات والجوارب'}]};
const els={assistantInput:{value:''},assistantChat:{html:'',insertAdjacentHTML(_p,h){this.html+=h},lastElementChild:{scrollIntoView(){}}}};
global.document={getElementById(id){return els[id]||null}};
global.api=async()=>[];
require('../rakiza-ai-shortages.js');
const S=window.RakizaAI.shortages;let pass=0;
function ok(c,m,g){if(!c){console.error('FAIL',m,g||'');process.exit(1)}pass++}
function sp(q,pred){const x=S.detectSpec(q,{});ok(pred(x),q,x);return x}
function rt(q,e){const x=S.isShortageLanguage(q,{});ok(x===e,q,x)}
function sec(q,e){const x=S.detectSection(q);ok(x===e,q,x)}
function per(q,pred){const x=S.detectPeriod(q);ok(pred(x),q,x)}

sp('وش أكثر صنف يتكرر نقصه؟',x=>x.task==='rank'&&x.metric==='recurrence'&&x.groupBy==='item');
sp('أي منتج يتكرر عندي أكثر؟',x=>x.metric==='recurrence');
sp('وش المقاس اللي دايم يرجع ناقص؟',x=>x.metric==='recurrence');
sp('ايش المنتج اللي كل شوي ينقص؟',x=>x.task==='rank'&&x.metric==='recurrence');
sp('اكثر شي ينقطع عندي',x=>x.task==='rank'&&x.metric==='recurrence');
sp('وش أكثر نقص ضيع علينا فرص؟',x=>x.metric==='lost');
sp('أي قسم خسرنا فيه فرص أكثر؟',x=>x.metric==='lost'&&x.groupBy==='section');
sp('وين راحت علينا فرص أكثر؟',x=>x.metric==='lost'&&x.groupBy==='section');
sp('كم فرصة ضاعت من الفاخر هذا الشهر؟',x=>x.task==='metric'&&x.metric==='lost'&&x.section==='الفاخر'&&x.period?.month==='2026-09');
sp('كم كمية طلبناها من الفاخر؟',x=>x.metric==='requested'&&x.section==='الفاخر'&&!x.status);
sp('كم حبة طلبنا من الأعمال؟',x=>x.metric==='requested'&&x.section==='الأعمال');
sp('كم باقي موجود من 60L؟',x=>x.metric==='current');
sp('صار له كم يوم ناقص؟',x=>x.metric==='age');
sp('قد ايش له ناقص؟',x=>x.task==='metric'&&x.metric==='age');
sp('وش طلبناه وما وصل للحين؟',x=>x.status==='ordered');
sp('وش اللي طلبناه ولسه ما جانا؟',x=>x.status==='ordered');
sp('وش عندنا بانتظار الاكسل؟',x=>x.status==='pending_export'&&x.task!=='export');
sp('وش اللي لسه ما صدرناه؟',x=>x.status==='pending_export');
sp('وش صدرنا ولسه ما طلبنا؟',x=>x.status==='exported_waiting_order'&&x.task!=='export');
sp('صدر لي النواقص اكسل',x=>x.task==='export');
sp('طيب صدرها',x=>x.task==='export');
sp('وش تم تغذيته هذا الشهر؟',x=>x.status==='supplied');
sp('وش باقي ناقص للحين؟',x=>x.status==='unresolved');
per('هذا الشهر',x=>x?.month==='2026-09');
per('من بداية الشهر',x=>x?.month==='2026-09');
per('الشهر اللي فات',x=>x?.month==='2026-08');
per('هالأسبوع',x=>x?.type==='range');
per('الأسبوع ذا',x=>x?.type==='range');
per('آخر ٧ أيام',x=>x?.type==='range');
per('قارن أغسطس بسبتمبر',x=>x?.type==='compare'&&x.periods[0].month==='2026-08'&&x.periods[1].month==='2026-09');
per('قارن أغسطس 2025 بأغسطس 2026',x=>x?.type==='compare'&&x.periods[0].month==='2025-08'&&x.periods[1].month==='2026-08');
sec('وش ناقص في الفاخر؟','الفاخر');sec('نواقص business','الأعمال');sec('وش ناقص في U.W؟','الداخليات');sec('وش ناقص في الداخلي؟','الداخليات');sec('وش وضع الشماغ؟','الأشمغة');sec('وش ناقص بالبيجاما؟','الجلابيات والبيجامات');
rt('وش أكثر صنف ناقص؟',true);rt('كم مبيعات اليوم؟',false);rt('مين ناقص من الفريق اليوم؟',false);rt('كم موظف ناقص اليوم؟',false);rt('وش ناقص في الجاهزية؟',false);rt('وش ناقص من مهام اليوم؟',false);rt('وش المطلوب اليوم؟',false);rt('وش طلبناه وما وصل للحين؟',true);rt('وش عندنا بانتظار الاكسل؟',true);
sp('عطني أعلى 3 نواقص حسب الفرص',x=>x.task==='rank'&&x.metric==='lost'&&x.limit===3);
sp('عطني أخطر 10 نواقص',x=>x.task==='rank'&&x.limit===10&&x.metric==='lost');
S.state.last={spec:{task:'rank',metric:'recurrence',groupBy:'item',section:'الفاخر',period:{type:'month',month:'2026-09',label:'هذا الشهر'}},focus:{type:'item',key:'60L',label:'60L',section:'الفاخر'}};
sp('طيب كم فرصة ضاعت منه؟',x=>x.task==='metric'&&x.metric==='lost'&&x.focus?.key==='60L'&&x.section==='الفاخر');
sp('وكم طلبنا منه؟',x=>x.task==='metric'&&x.metric==='requested'&&x.focus?.key==='60L'&&!x.status);
sp('طيب الشهر الماضي؟',x=>x.period?.month==='2026-08'&&x.focus?.key==='60L'&&x.metric==='recurrence');
S.state.last={spec:{task:'rank',metric:'recurrence',groupBy:'item',section:'الفاخر',period:{type:'month',month:'2026-08',label:'الشهر الماضي'}},focus:{type:'item',key:'60L',label:'60L',section:'الفاخر'}};
sp('والشهر اللي قبله؟',x=>x.period?.month==='2026-07'&&x.focus?.key==='60L'&&x.metric==='recurrence');

const sample=[
{id:'1',section_id:'f',sections:{name:'الفاخر'},size:'60L',current_qty:0,requested_qty:8,lost_opportunities:8,first_detected_date:'2026-08-01',ordered_date:'2026-08-02',supplied_date:'2026-08-05',shortage_status:'تمت التغذية'},
{id:'2',section_id:'f',sections:{name:'الفاخر'},size:'60L',current_qty:0,requested_qty:2,lost_opportunities:4,first_detected_date:'2026-09-01',ordered_date:'2026-09-02',supplied_date:null,shortage_status:'تم الطلب'},
{id:'3',section_id:'b',sections:{name:'الأعمال'},size:'60L',current_qty:0,requested_qty:4,lost_opportunities:1,first_detected_date:'2026-09-03',ordered_date:null,supplied_date:null,shortage_status:'مفتوح',excel_exported_at:null},
{id:'4',section_id:'u',sections:{name:'الداخليات'},size:'رجالي — فرزاتشي — فنيلة — S',current_qty:0,requested_qty:8,lost_opportunities:3,first_detected_date:'2026-09-04',ordered_date:null,supplied_date:null,shortage_status:'مفتوح',excel_exported_at:null},
{id:'5',section_id:'c',sections:{name:'الكلاسيك'},size:'58XXL — أبيض',current_qty:0,requested_qty:4,lost_opportunities:2,first_detected_date:'2026-09-05',ordered_date:'2026-09-06',supplied_date:null,shortage_status:'تم الطلب'}];
global.api=async path=>path==='shortages'?sample:[];
async function ask(q){S.state.busy=false;els.assistantChat.html='';els.assistantInput.value=q;await window.askRakizaAssistant();return els.assistantChat.html}
(async()=>{
S.state.last=null;let h=await ask('وش أكثر صنف يتكرر نقصه؟');ok(/60L/.test(h),'recurrence output',h);ok(!/3 مرة/.test(h),'must not merge 60L across sections',h);
S.state.last=null;h=await ask('كم فرصة ضاعت من الفاخر في سبتمبر؟');ok(/4/.test(h),'lost opportunities = 4',h);
S.state.last=null;h=await ask('وش طلبناه وما وصل للحين؟');ok(/60L/.test(h)&&/58XXL/.test(h),'ordered not supplied lists rows',h);
S.state.last=null;h=await ask('من متى كان 60L في الفاخر ناقص وتمت التغذية؟');ok(/4 يوم/.test(h),'supplied age ends at supplied date',h);
console.log('Rakiza AI shortages tests passed:',pass);
})().catch(e=>{console.error(e);process.exit(1)});
''',encoding='utf-8')
