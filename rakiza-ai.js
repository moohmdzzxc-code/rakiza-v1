(()=>{
'use strict';

const RAI_VERSION='0.1.0';
const RAI_NAME='ركيزة AI';
const RAI_STATE={
  initialized:false,
  history:[],
  context:{intent:null,entities:{},lastMessage:''},
  pendingDraft:null
};

const RAI_DAYS=[
  {index:0,name:'الأحد',aliases:['الاحد','احد','الأحد']},
  {index:1,name:'الاثنين',aliases:['الاثنين','اثنين','الإثنين']},
  {index:2,name:'الثلاثاء',aliases:['الثلاثاء','الثلاثا','ثلاثاء','ثلاثا','ثلوث','ثلثاء']},
  {index:3,name:'الأربعاء',aliases:['الاربعاء','الأربعاء','اربعاء','أربعاء','ربوع']},
  {index:4,name:'الخميس',aliases:['الخميس','خميس']},
  {index:5,name:'الجمعة',aliases:['الجمعه','الجمعة','جمعه','جمعة']},
  {index:6,name:'السبت',aliases:['السبت','سبت']}
];

const RAI_STATUS=[
  {value:'Morning',label:'صباحي',aliases:['صباح','صباحي','الصباح','صبحي']},
  {value:'Evening',label:'مسائي',aliases:['مساء','مسائي','المساء']},
  {value:'D/O',label:'إجازة أسبوعية',aliases:['اجازه','اجازة','إجازة','اوف','off','d/o','راحه','راحة']},
  {value:'A/L',label:'إجازة سنوية',aliases:['سنويه','سنوية','سنوي','a/l','annual']},
  {value:'S/L',label:'إجازة مرضية',aliases:['سكليف','مرضي','مرضيه','مرضية','s/l','sick']},
  {value:'تعويضي',label:'تعويضي',aliases:['تعويضي','تعويض']},
  {value:'مهمة عمل',label:'مهمة عمل',aliases:['مهمه عمل','مهمة عمل','مهمه','مهمة']}
];

const RAI_DOMAIN_WORDS={
  'تواجد':['تواجد','التواجد','توجد','التوجد','تواجذ','التواجذ'],
  'خطة':['خطه','خطة','الخطه','الخطة'],
  'مسودة':['مسوده','مسودة','مبدئي','مبدئيه','مبدئية'],
  'أسبوع':['اسبوع','أسبوع','الاسبوع','الأسبوع','اسبوعي','أسبوعي'],
  'دوام':['دوام','الدوام','دوم','الدوام'],
  'شفت':['شفت','شفتات','شفتات','شيفت','شيفتات'],
  'مبيعات':['مبيعات','المبيعات','مبيعاات','مبيعاتس'],
  'مستهدف':['مستهدف','المستهدف','تارقت','تارجت','target','تارغت'],
  'نواقص':['نواقص','النواقص','نقص','ناقص'],
  'إجراءات':['اجراء','اجراءات','إجراء','إجراءات','الاجراءات'],
  'متابعات':['متابعه','متابعة','متابعات','المتابعات'],
  'جاهزية':['جاهزيه','جاهزية','الجاهزيه','الجاهزية'],
  'تقرير':['تقرير','تقارير','التقرير'],
  'اكسل':['اكسل','إكسل','excel','xlsx'],
  'اليوم':['اليوم','يوم'],
  'بكرة':['بكره','بكرة','غدا','غداً'],
  'أمس':['امس','أمس','البارح'],
  'افتح':['افتح','فتح','ودني','روح','انتقل'],
  'أنشئ':['سوي','سو','سوى','جهز','جهّز','اعمل','ابني','بني','رتب','انشئ','أنشئ','ابي','ابغى','أبغى','احتاج']
};

function raiDigits(v){
  return String(v??'')
    .replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
}

function raiNorm(v){
  return raiDigits(v)
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g,'')
    .replace(/ـ/g,'')
    .replace(/[أإآٱ]/g,'ا')
    .replace(/ى/g,'ي')
    .replace(/ة/g,'ه')
    .replace(/ؤ/g,'و')
    .replace(/ئ/g,'ي')
    .replace(/[،,:;؛!?؟.()\[\]{}"']/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}

function raiEsc(v){
  if(typeof esc==='function')return esc(String(v??''));
  return String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
}

function raiDistance(a,b){
  a=String(a||'');b=String(b||'');
  if(a===b)return 0;
  if(!a.length)return b.length;if(!b.length)return a.length;
  const prev=Array.from({length:b.length+1},(_,i)=>i),cur=new Array(b.length+1);
  for(let i=1;i<=a.length;i++){
    cur[0]=i;
    for(let j=1;j<=b.length;j++)cur[j]=Math.min(cur[j-1]+1,prev[j]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));
    for(let j=0;j<=b.length;j++)prev[j]=cur[j];
  }
  return prev[b.length];
}

function raiCloseToken(token,target){
  token=raiNorm(token);target=raiNorm(target);
  if(token===target)return true;
  if(token.length<4||target.length<4)return false;
  const max=Math.max(token.length,target.length);
  const allowed=max>=8?2:1;
  return raiDistance(token,target)<=allowed;
}

function raiCanonicalTokens(text){
  const raw=raiNorm(text).split(' ').filter(Boolean),out=[];
  for(const token of raw){
    let canonical=token;
    outer:for(const [key,aliases] of Object.entries(RAI_DOMAIN_WORDS)){
      for(const a of aliases){
        const na=raiNorm(a);
        if(token===na||raiCloseToken(token,na)){canonical=raiNorm(key);break outer}
      }
    }
    out.push(canonical);
  }
  return out;
}

function raiHas(text,words){
  const n=raiNorm(text),tokens=raiCanonicalTokens(text);
  return words.some(w=>{
    const nw=raiNorm(w);
    return n.includes(nw)||tokens.includes(nw);
  });
}

function raiBaseDate(){
  return String(window.app?.calendarDate||window.app?.date||new Date().toISOString().slice(0,10)).slice(0,10);
}

function raiDateObj(iso){return new Date(String(iso)+'T12:00:00')}
function raiIso(d){return d.toISOString().slice(0,10)}
function raiAddDays(iso,n){const d=raiDateObj(iso);d.setDate(d.getDate()+n);return raiIso(d)}
function raiSunday(iso){const d=raiDateObj(iso);d.setDate(d.getDate()-d.getDay());return raiIso(d)}
function raiWeekDates(start){return Array.from({length:7},(_,i)=>raiAddDays(start,i))}

function raiWeekScope(text){
  const t=raiNorm(text);
  if(/(?:الاسبوع|اسبوع)\s*(?:الجاي|القادم|المقبل)|(?:الجاي|القادم|المقبل)\s*(?:الاسبوع|اسبوع)/.test(t))return'next';
  if(/(?:الاسبوع|اسبوع)\s*(?:الماضي|السابق|اللي فات|الفايت)|(?:الماضي|السابق)\s*(?:الاسبوع|اسبوع)/.test(t))return'previous';
  if(/(?:هذا|هال)\s*(?:الاسبوع|اسبوع)|(?:الاسبوع|اسبوع)\s*(?:هذا|الحالي)/.test(t))return'current';
  return null;
}

function raiWeekStart(scope){
  const cur=raiSunday(raiBaseDate());
  if(scope==='next')return raiAddDays(cur,7);
  if(scope==='previous')return raiAddDays(cur,-7);
  return cur;
}

function raiWordsWithPositions(text){
  const n=raiNorm(text),out=[];let m;
  const re=/\S+/g;
  while((m=re.exec(n)))out.push({word:m[0],start:m.index,end:m.index+m[0].length});
  return{normalized:n,tokens:out};
}

function raiMatchDayToken(token){
  for(const day of RAI_DAYS){
    for(const alias of day.aliases){if(raiCloseToken(token,alias))return day}
  }
  return null;
}

function raiDayMentions(text){
  const {normalized,tokens}=raiWordsWithPositions(text),out=[];
  for(const tk of tokens){const day=raiMatchDayToken(tk.word);if(day)out.push({...day,start:tk.start,end:tk.end,matched:tk.word})}
  return{normalized,mentions:out};
}

function raiStatusIn(text){
  const n=raiNorm(text),tokens=n.split(' ').filter(Boolean);
  for(const st of RAI_STATUS){
    for(const alias of st.aliases){
      const a=raiNorm(alias);
      if(n.includes(a))return st;
      if(tokens.some(t=>raiCloseToken(t,a)))return st;
    }
  }
  return null;
}

function raiResolveDayDate(day,text,scope=null){
  const base=raiBaseDate();
  if(scope){return raiWeekDates(raiWeekStart(scope))[day.index]}
  const n=raiNorm(text);
  const strictFuture=/(الجاي|القادم|المقبل)/.test(n);
  const d=raiDateObj(base),delta=(day.index-d.getDay()+7)%7;
  return raiAddDays(base,delta===0&&strictFuture?7:delta);
}

function raiExplicitDate(text){
  const t=raiDigits(text),base=raiDateObj(raiBaseDate());
  let m=t.match(/\b(20\d{2})[-\/.](\d{1,2})[-\/.](\d{1,2})\b/);
  if(m)return`${m[1]}-${String(Number(m[2])).padStart(2,'0')}-${String(Number(m[3])).padStart(2,'0')}`;
  m=t.match(/\b(\d{1,2})[-\/](\d{1,2})(?:[-\/](20\d{2}|\d{2}))?\b/);
  if(m){let y=m[3]?Number(m[3]):base.getFullYear();if(y<100)y+=2000;return`${y}-${String(Number(m[2])).padStart(2,'0')}-${String(Number(m[1])).padStart(2,'0')}`}
  return null;
}

function raiRelativeDate(text){
  const n=raiNorm(text),base=raiBaseDate();
  if(/بعد\s*(?:بكره|بكرة|غدا)/.test(n))return raiAddDays(base,2);
  if(/اول\s*امس/.test(n))return raiAddDays(base,-2);
  if(/\b(?:بكره|بكرة|غدا)\b/.test(n))return raiAddDays(base,1);
  if(/\b(?:امس|البارح)\b/.test(n))return raiAddDays(base,-1);
  if(/\bاليوم\b/.test(n))return base;
  return null;
}

function raiParseTemporal(text){
  const explicit=raiExplicitDate(text);if(explicit)return{type:'date',date:explicit,label:explicit};
  const rel=raiRelativeDate(text);if(rel)return{type:'date',date:rel,label:rel};
  const scope=raiWeekScope(text),dm=raiDayMentions(text).mentions;
  if(dm.length)return{type:'weekday',scope,days:dm.map(d=>({...d,date:raiResolveDayDate(d,text,scope)}))};
  if(scope){const start=raiWeekStart(scope);return{type:'week',scope,start,end:raiAddDays(start,6)}};
  return null;
}

function raiEmployeeMentions(text){
  const n=raiNorm(text),emps=(window.app?.employees||[]).filter(e=>e.active!==false),candidates=[];
  for(const e of emps){
    const full=raiNorm(e.full_name||''),parts=full.split(' ').filter(Boolean),aliases=[full,parts.slice(0,2).join(' '),parts[0]].filter(x=>x&&x.length>=2);
    let best=null;
    for(const alias of [...new Set(aliases)]){
      const re=new RegExp(`(^|\\s)${alias.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}(?=\\s|$)`);
      const m=n.match(re);if(m){const start=(m.index||0)+m[1].length;if(!best||alias.length>best.alias.length)best={employee:e,alias,start,end:start+alias.length,confidence:'exact'}}
    }
    if(best)candidates.push(best);
  }
  if(!candidates.length){
    const words=n.split(' ').filter(x=>x.length>=4);
    for(const w of words){
      const matched=emps.filter(e=>raiCloseToken(w,raiNorm(e.full_name||'').split(' ')[0]||''));
      if(matched.length===1)candidates.push({employee:matched[0],alias:w,start:n.indexOf(w),end:n.indexOf(w)+w.length,confidence:'fuzzy'});
    }
  }
  candidates.sort((a,b)=>a.start-b.start||(b.alias.length-a.alias.length));
  const out=[];for(const c of candidates)if(!out.some(x=>c.start<x.end&&c.end>x.start))out.push(c);
  return out;
}

function raiParseRosterConstraints(text,employees,temporal){
  const {normalized}=raiWordsWithPositions(text),days=raiDayMentions(text).mentions,rows=[];
  const emps=employees.length?employees:(RAI_STATE.context.intent==='roster_draft'?(RAI_STATE.context.entities.employees||[]):[]);
  for(let ei=0;ei<emps.length;ei++){
    const emp=emps[ei],segStart=employees.length?emp.end:0,segEnd=employees.length&&ei+1<emps.length?employees[ei+1].start:normalized.length,seg=normalized.slice(segStart,segEnd);
    const localDays=raiDayMentions(seg).mentions;
    for(let i=0;i<localDays.length;i++){
      const d=localDays[i],end=i+1<localDays.length?localDays[i+1].start:seg.length,after=seg.slice(d.end,end),status=raiStatusIn(after),scope=raiWeekScope(text)||(temporal?.scope||'next');
      rows.push({employee:emp.employee,day:d.name,dayIndex:d.index,date:raiResolveDayDate(d,text,scope),status:status?.value||null,statusLabel:status?.label||null});
    }
  }
  if(!rows.length&&employees.length===1&&days.length){
    for(let i=0;i<days.length;i++){
      const d=days[i],end=i+1<days.length?days[i+1].start:normalized.length,status=raiStatusIn(normalized.slice(d.end,end)),scope=raiWeekScope(text)||(temporal?.scope||'next');
      rows.push({employee:employees[0].employee,day:d.name,dayIndex:d.index,date:raiResolveDayDate(d,text,scope),status:status?.value||null,statusLabel:status?.label||null});
    }
  }
  return rows;
}

function raiDetectIntent(text,entities){
  const n=raiNorm(text),hasRoster=raiHas(text,['تواجد','دوام','شفت'])||(/خطه/.test(n)&&/(فريق|موظف|اسبوع)/.test(n));
  const navigate=raiHas(text,['افتح'])&&!raiHas(text,['أنشئ','مسودة']);
  const create=raiHas(text,['أنشئ','مسودة'])||/ابي|ابغى|احتاج/.test(n);
  if(hasRoster&&navigate)return'navigate_roster';
  if(hasRoster&&(create||!navigate))return'roster_draft';
  if(entities.employees.length&&entities.temporal&&entities.constraints.length)return'roster_draft';
  if((/متي|متى|تاريخ/.test(n)||/^وش\s+يوم/.test(n))&&entities.temporal)return'date_query';
  if(entities.temporal&&entities.temporal.type==='weekday'&&/(الجاي|القادم|المقبل)/.test(n))return'date_query';
  return'unknown';
}

function raiAnalyze(text){
  const temporal=raiParseTemporal(text),employees=raiEmployeeMentions(text),entities={temporal,employees,constraints:[]};
  entities.constraints=raiParseRosterConstraints(text,employees,temporal);
  const intent=raiDetectIntent(text,entities);
  return{raw:text,normalized:raiNorm(text),tokens:raiCanonicalTokens(text),intent,entities};
}

function raiAdd(role,html){
  const c=document.getElementById('assistantChat');if(!c)return;
  const mine=role==='user';
  c.insertAdjacentHTML('beforeend',`<div style="display:flex;justify-content:${mine?'flex-start':'flex-end'}"><div class="task" style="max-width:88%;margin:0;background:${mine?'#eef3f8':'#fff'};border-color:${mine?'#d6e0ea':'#e3e7ec'}">${html}</div></div>`);
  c.lastElementChild?.scrollIntoView({behavior:'smooth',block:'nearest'});
}

function raiInitUi(){
  const sec=document.getElementById('assistant');if(!sec)return;
  const brand=sec.querySelector('.top .brand'),sub=sec.querySelector('.top .sub'),notice=sec.querySelector('.notice'),suggest=document.getElementById('assistantSuggestions'),input=document.getElementById('assistantInput');
  if(brand)brand.textContent='ركيزة AI ✦';
  if(sub)sub.textContent='محرك ركيزة الداخلي — بدون API خارجي';
  if(notice)notice.innerHTML='<b>ركيزة AI يعمل من داخل ركيزة.</b><div style="margin-top:5px">المرحلة الحالية: فهم اللغة والسياق، الأيام والتواريخ، وتصنيف طلب خطة التواجد كمسودة. لن يتم حفظ أي تغيير تشغيلي دون اعتمادك.</div>';
  if(suggest)suggest.innerHTML=`<button class="mini" onclick="askAssistantQuick('سوي لي مسودة خطة تواجد الأسبوع الجاي')">مسودة تواجد الأسبوع الجاي</button><button class="mini" onclick="askAssistantQuick('عمار ثلوث إجازة وخميس مساء')">فهم تعليمات التواجد</button><button class="mini" onclick="askAssistantQuick('وش تاريخ ربوع الجاي؟')">فهم أسماء الأيام</button><button class="mini" onclick="askAssistantQuick('خطة التوجد الاسبوع الجاي')">تجاوز خطأ إملائي</button>`;
  if(input)input.placeholder='مثال: سوي خطة تواجد الأسبوع الجاي، عمار ثلوث إجازة';
}

function raiInit(){
  raiInitUi();
  if(RAI_STATE.initialized)return;
  RAI_STATE.initialized=true;
  raiAdd('assistant',`<b>${RAI_NAME} جاهز.</b><div class="mut" style="margin-top:6px">أنا الآن أعمل بمحرك ركيزة الداخلي. لا أرسل طلبك إلى OpenAI أو أي نموذج خارجي. اكتب بطريقتك الطبيعية.</div>`);
}

function raiTemporalLabel(t){
  if(!t)return'غير محدد';
  if(t.type==='date')return t.date;
  if(t.type==='week')return`${t.start} إلى ${t.end}`;
  if(t.type==='weekday')return t.days.map(d=>`${d.name} (${d.date})`).join('، ');
  return'غير محدد';
}

function raiRosterReply(a){
  const t=a.entities.temporal,scope=t?.scope||'next',start=raiWeekStart(scope),end=raiAddDays(start,6),constraints=a.entities.constraints;
  RAI_STATE.pendingDraft={type:'roster',week_start:start,week_end:end,constraints,created_at:new Date().toISOString()};
  let html=`<b>فهمت الطلب كمسودة خطة تواجد.</b><div style="margin-top:7px">الفترة: <b>${start}</b> إلى <b>${end}</b></div>`;
  if(constraints.length){html+='<div style="margin-top:9px"><b>التعليمات التي فهمتها:</b><br>'+constraints.map(c=>`${raiEsc(c.employee.full_name)} — ${c.day} ${c.date}${c.statusLabel?` — <b>${raiEsc(c.statusLabel)}</b>`:' — الحالة غير محددة'}`).join('<br>')+'</div>'}
  else html+='<div class="mut" style="margin-top:8px">لم تذكر قيودًا على موظفين أو أيام، لذلك سجلت المقصود كطلب مسودة فقط. منطق توزيع الفريق نفسه سنبنيه في وحدة التخطيط التالية.</div>';
  html+='<div class="notice" style="margin-top:10px">هذه مسودة فهم فقط ولم يتم حفظ أو تعديل خطة التواجد.</div>';
  return html;
}

function raiDateReply(a){
  const t=a.entities.temporal;if(!t)return'لم أستطع تحديد التاريخ المقصود.';
  if(t.type==='weekday'&&t.days.length){const d=t.days[0];return`المقصود <b>${d.name}</b>، وتاريخه حسب السياق الحالي هو <b>${d.date}</b>.`}
  if(t.type==='date')return`التاريخ المقصود هو <b>${t.date}</b> (${raiEsc(new Intl.DateTimeFormat('ar-SA',{weekday:'long'}).format(raiDateObj(t.date)))})`;
  if(t.type==='week')return`الفترة المقصودة من <b>${t.start}</b> إلى <b>${t.end}</b>.`;
  return`فهمت الفترة: ${raiTemporalLabel(t)}`;
}

function raiUnknownReply(a){
  const detected=[];
  if(a.entities.temporal)detected.push(`الوقت/التاريخ: ${raiTemporalLabel(a.entities.temporal)}`);
  if(a.entities.employees.length)detected.push(`الموظف: ${a.entities.employees.map(x=>x.employee.full_name).join('، ')}`);
  return `<b>فهمت النص لغويًا، لكن القدرة التشغيلية لهذا النوع لم نبنها بعد.</b>${detected.length?`<div class="mut" style="margin-top:7px">التقطت: ${raiEsc(detected.join(' | '))}</div>`:''}<div class="mut" style="margin-top:7px">نبني قدرات ركيزة AI واحدة واحدة حتى لا يتصرف باجتهاد غير معتمد.</div>`;
}

function raiRespond(a){
  if(a.intent==='navigate_roster')return'<b>فهمت أنك تريد فتح خطة التواجد، وليس إنشاء مسودة.</b><div style="margin-top:9px"><button class="mini" onclick="openRoster()">فتح خطة التواجد</button></div>';
  if(a.intent==='roster_draft')return raiRosterReply(a);
  if(a.intent==='date_query')return raiDateReply(a);
  return raiUnknownReply(a);
}

window.openAssistant=function(){
  show('assistant');raiInit();setTimeout(()=>document.getElementById('assistantInput')?.focus(),50);
};
window.askAssistantQuick=function(q){const i=document.getElementById('assistantInput');if(i)i.value=q;window.askRakizaAssistant()};
window.askRakizaAssistant=function(){
  raiInit();const inp=document.getElementById('assistantInput'),q=inp?.value.trim();if(!q)return;if(inp)inp.value='';
  raiAdd('user',raiEsc(q));
  try{
    const a=raiAnalyze(q),reply=raiRespond(a);
    RAI_STATE.history.push({role:'user',text:q,analysis:a},{role:'assistant',intent:a.intent});
    RAI_STATE.context={intent:a.intent,entities:a.entities,lastMessage:q};
    raiAdd('assistant',reply);
  }catch(e){raiAdd('assistant',`<div class="notice err">تعذر فهم الطلب: ${raiEsc(e.message||String(e))}</div>`)}
};

window.RakizaAI={
  version:RAI_VERSION,
  analyze:raiAnalyze,
  normalize:raiNorm,
  parseTemporal:raiParseTemporal,
  state:RAI_STATE,
  dictionaries:{days:RAI_DAYS,statuses:RAI_STATUS}
};

raiInitUi();
})();
