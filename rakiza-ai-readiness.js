(()=>{
'use strict';

const RRI_VERSION='0.1.0';
const READY_STATE={last:null,busy:false,dayCache:new Map()};

function basicNorm(v){return String(v??'').toLowerCase().replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[\u064B-\u065F\u0670]/g,'').replace(/ـ/g,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/ؤ/g,'و').replace(/ئ/g,'ي').replace(/[،,:;؛!?؟.()\[\]{}"']/g,' ').replace(/\s+/g,' ').trim()}
function norm(v){return window.RakizaAI?.normalize?window.RakizaAI.normalize(v):basicNorm(v)}
function esc(v){return String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]))}
function num(v){const n=Number(v);return Number.isFinite(n)?n:0}
function pct(v){return Number.isFinite(Number(v))?`${Number(v).toFixed(1)}%`:'—'}
function getApp(){try{return app}catch{return window.app||{}}}
function callApi(name,o={}){const fn=typeof window.api==='function'?window.api:(typeof api==='function'?api:null);if(!fn)throw Error('واجهة بيانات ركيزة غير متاحة');return fn(name,o)}
function baseDate(){const a=getApp();return String(a.calendarDate||a.day?.work_date||a.date||new Date().toISOString().slice(0,10)).slice(0,10)}
function dObj(v){return new Date(String(v)+'T12:00:00')}
function iso(d){return d.toISOString().slice(0,10)}
function addDays(v,n){const d=dObj(v);d.setDate(d.getDate()+n);return iso(d)}
function monthKey(v){return String(v||'').slice(0,7)}
function previousMonth(k){const m=String(k||'').match(/^(20\d{2})-(\d{2})$/);if(!m)return null;const d=new Date(Number(m[1]),Number(m[2])-2,1);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`}
function sunday(v){const d=dObj(v);d.setDate(d.getDate()-d.getDay());return iso(d)}
function fuzzy(a,b){a=norm(a);b=norm(b);if(a===b)return true;if(a.length<4||b.length<4)return false;const p=Array.from({length:b.length+1},(_,i)=>i),c=new Array(b.length+1);for(let i=1;i<=a.length;i++){c[0]=i;for(let j=1;j<=b.length;j++)c[j]=Math.min(c[j-1]+1,p[j]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));for(let j=0;j<=b.length;j++)p[j]=c[j]}return p[b.length]<=(Math.max(a.length,b.length)>=8?2:1)}
function fuzzyAny(text,words){const n=norm(text),ts=n.split(' ').filter(Boolean);return words.some(w=>{const nw=norm(w);return n.includes(nw)||(!nw.includes(' ')&&ts.some(t=>fuzzy(t,nw)))})}
function chat(role,html){const c=document.getElementById('assistantChat');if(!c)return;const mine=role==='user';c.insertAdjacentHTML('beforeend',`<div style="display:flex;justify-content:${mine?'flex-start':'flex-end'}"><div class="task" style="max-width:88%;margin:0;background:${mine?'#eef3f8':'#fff'};border-color:${mine?'#d6e0ea':'#e3e7ec'}">${html}</div></div>`);c.lastElementChild?.scrollIntoView?.({behavior:'smooth',block:'nearest'})}

const CATEGORY_ALIASES=[
  {key:'النظافة والجاهزية العامة',a:['النظافه','النظافة','جاهزيه عامه','جاهزية عامة','الصاله','الصالة','الواجهات','غرف القياس','المستودع','المدخل']},
  {key:'المعروضات',a:['المعروضات','المعروض','العرض','عرض المنتجات','اكتمال المعروض','ترتيب المعروض','الفئات','المقاسات']},
  {key:'جاهزية النقدية',a:['جاهزيه النقديه','جاهزية النقدية','النقديه','النقدية','الصرف','فئات الصرف','مبلغ الصرف','الايداع','الإيداع']},
  {key:'الأجهزة والأنظمة',a:['الاجهزه والانظمه','الأجهزة والأنظمة','الاجهزه','الأجهزة','الانظمه','الأنظمة','الكمبيوتر','برنامج البيع','نقاط البيع','الشبكه','الشبكة']},
  {key:'مستلزمات التشغيل',a:['مستلزمات التشغيل','المستلزمات','اكياس','أكياس','رول فواتير','اوراق طباعه','أوراق طباعة','حبر','سلات']},
  {key:'مرافق وصيانة',a:['مرافق وصيانه','مرافق وصيانة','المرافق','اناره','إنارة','المكيف','المكيفات','الباب','بحاجه لصيانه','بحاجة لصيانة']},
  {key:'السلامة التشغيلية',a:['السلامه التشغيليه','السلامة التشغيلية','السلامه','السلامة','مخارج الطوارئ','طفايات','مخاطر','اسعافات','إسعافات']}
];
const ITEM_ALIASES={
  'صالة':['الصاله','الصالة','صاله'],
  'واجهات':['الواجهات','واجهه','واجهة','واجهات'],
  'كاشير':['الكاشير','كاشير'],
  'منتجات العرض':['منتجات العرض','منتج العرض'],
  'غرف القياس':['غرف القياس','غرفه القياس','غرفة القياس'],
  'المستودع':['المستودع','مستودع'],
  'المدخل':['المدخل','مدخل'],
  'اكتمال':['اكتمال','اكتمال المعروض','اكتمال العرض'],
  'ترتيب':['ترتيب','ترتيب المعروض','ترتيب العرض'],
  'حسب الفئات':['حسب الفئات','الفئات'],
  'حسب المقاسات':['حسب المقاسات','المقاسات'],
  'فئات الصرف':['فئات الصرف','صرف كاش','فكه','فكة'],
  'مبلغ الصرف':['مبلغ الصرف','رصيد الصرف'],
  'الإيداع النقدي':['الايداع النقدي','الإيداع النقدي','الايداع','الإيداع'],
  'الكمبيوتر':['الكمبيوتر','كمبيوتر','الحاسب'],
  'برنامج البيع':['برنامج البيع','نظام البيع','x store','xstore'],
  'نقاط البيع':['نقاط البيع','نقطه البيع','نقطة البيع','pos'],
  'الشبكة':['الشبكه','الشبكة','النت','الانترنت','الإنترنت'],
  'أكياس':['اكياس','أكياس','الاكياس'],
  'رول فواتير':['رول فواتير','رول الفواتير','رول'],
  'أوراق طباعة':['اوراق طباعه','أوراق طباعة','ورق طباعه','ورق طباعة'],
  'حبر':['الحبر','حبر'],
  'سلات':['السلات','سلات'],
  'إنارة داخلية':['اناره داخليه','إنارة داخلية','الاناره الداخليه'],
  'خارجية ولوحة':['اناره خارجيه','إنارة خارجية','اللوحه','اللوحة','خارجيه ولوحه'],
  'مكيفات':['المكيفات','مكيفات','المكيف'],
  'باب':['الباب','باب'],
  'أقسام بحاجة لصيانة':['اقسام بحاجه لصيانه','أقسام بحاجة لصيانة','بحاجه لصيانه','بحاجة لصيانة'],
  'مخارج طوارئ':['مخارج طوارئ','مخرج طوارئ','الطوارئ'],
  'طفايات':['طفايات','الطفايات','طفايه','طفاية'],
  'لا مخاطر بارزة':['مخاطر بارزه','مخاطر بارزة','مخاطر','خطر'],
  'إسعافات أولية':['اسعافات اوليه','إسعافات أولية','الاسعافات','الإسعافات']
};

function appItems(){return Array.isArray(getApp().items)?getApp().items:[]}
function canonicalCategory(name){const n=norm(name);const direct=appItems().find(i=>norm(i.category_name_ar)===n)?.category_name_ar;if(direct)return direct;for(const c of CATEGORY_ALIASES){if(norm(c.key)===n||c.a.some(a=>norm(a)===n))return appItems().find(i=>norm(i.category_name_ar)===norm(c.key))?.category_name_ar||c.key}return name}
function detectCategory(text){const n=norm(text);for(const row of CATEGORY_ALIASES){const actual=appItems().find(i=>norm(i.category_name_ar)===norm(row.key))?.category_name_ar||row.key;if(n.includes(norm(row.key))||row.a.some(a=>n.includes(norm(a))))return actual}const cats=[...new Set(appItems().map(i=>i.category_name_ar).filter(Boolean))];for(const c of cats)if(n.includes(norm(c)))return c;return null}
function itemAliases(item){const name=String(item?.item_name_ar||'');let out=[name];for(const [k,a] of Object.entries(ITEM_ALIASES)){const nk=norm(k),nn=norm(name);if(nn.includes(nk)||nk.includes(nn)||a.some(x=>nn.includes(norm(x))||norm(x).includes(nn)))out.push(k,...a)}return [...new Set(out)]}
function detectItem(text){const n=norm(text),items=appItems();let best=null,bestLen=0;for(const i of items){for(const a of itemAliases(i)){const na=norm(a);if(na&&n.includes(na)&&na.length>bestLen){best=i;bestLen=na.length}}}if(best)return best;const tokens=n.split(' ').filter(x=>x.length>=4);for(const i of items){for(const a of itemAliases(i)){const na=norm(a);if(tokens.some(t=>fuzzy(t,na))||(!na.includes(' ')&&tokens.some(t=>fuzzy(t,na))))return i}}return null}
function itemById(id,nested){return appItems().find(i=>String(i.id)===String(id))||nested||null}

const MONTHS=[['يناير',1],['فبراير',2],['مارس',3],['ابريل',4],['مايو',5],['يونيو',6],['يوليو',7],['اغسطس',8],['سبتمبر',9],['اكتوبر',10],['نوفمبر',11],['ديسمبر',12]];
const DOW=[['الاحد',0],['احد',0],['الاثنين',1],['اثنين',1],['الثلاثاء',2],['ثلاثاء',2],['ثلوث',2],['الاربعاء',3],['اربعاء',3],['ربوع',3],['الخميس',4],['خميس',4],['الجمعه',5],['الجمعة',5],['جمعه',5],['جمعة',5],['السبت',6],['سبت',6]];
function namedMonths(text){const n=norm(text),baseYear=dObj(baseDate()).getFullYear(),out=[];for(const [name,m] of MONTHS){let pos=0,i;while((i=n.indexOf(norm(name),pos))>=0){const after=n.slice(i+norm(name).length,i+norm(name).length+12),ym=after.match(/^\s*(20\d{2})/),year=ym?Number(ym[1]):baseYear;out.push({type:'month',month:`${year}-${String(m).padStart(2,'0')}`,label:`${name}${ym?` ${year}`:''}`,index:i});pos=i+norm(name).length}}return out.sort((a,b)=>a.index-b.index)}
function explicitDate(text){const n=norm(text);let m=n.match(/\b(20\d{2})[-\/]([01]?\d)[-\/]([0-3]?\d)\b/);if(m)return`${m[1]}-${String(Number(m[2])).padStart(2,'0')}-${String(Number(m[3])).padStart(2,'0')}`;m=n.match(/\b([0-3]?\d)[-\/]([01]?\d)[-\/](20\d{2})\b/);if(m)return`${m[3]}-${String(Number(m[2])).padStart(2,'0')}-${String(Number(m[1])).padStart(2,'0')}`;return null}
function weekdayPeriod(text){const n=norm(text),base=baseDate(),current=dObj(base).getDay();for(const [name,idx] of DOW){if(!n.includes(norm(name)))continue;let diff;if(/الجاي|القادم|المقبل/.test(n)){diff=(idx-current+7)%7;if(diff===0)diff=7;return{type:'date',date:addDays(base,diff),label:name}}if(/الماضي|السابق|اللي فات|الي فات/.test(n)){diff=(current-idx+7)%7;if(diff===0)diff=7;return{type:'date',date:addDays(base,-diff),label:name}}diff=(current-idx+7)%7;return{type:'date',date:addDays(base,-diff),label:name}}return null}
function fallbackPeriod(text,prior=null){const n=norm(text),base=baseDate(),m=monthKey(base),explicit=explicitDate(text),named=namedMonths(text);if(explicit)return{type:'date',date:explicit,label:explicit};if(named.length>=2)return{type:'compare',periods:named.slice(0,2)};if(/قارن/.test(n)&&/هذا الشهر|هالشهر|الشهر الحالي/.test(n)&&/الشهر الماضي|الشهر اللي فات|الشهر الي فات/.test(n))return{type:'compare',periods:[{type:'month',month:m,label:'هذا الشهر'},{type:'month',month:previousMonth(m),label:'الشهر الماضي'}]};if(/قارن/.test(n)&&/هذا الاسبوع|هالاسبوع|الاسبوع ذا/.test(n)&&/الاسبوع الماضي|الاسبوع اللي فات|الاسبوع الي فات/.test(n)){const s=sunday(base),p=addDays(s,-7);return{type:'compare',periods:[{type:'range',start:s,end:addDays(s,6),label:'هذا الأسبوع'},{type:'range',start:p,end:addDays(p,6),label:'الأسبوع الماضي'}]}}if(named.length===1)return named[0];if(/هذا الشهر|هالشهر|الشهر الحالي|من بدايه الشهر|من اول الشهر/.test(n))return{type:'month',month:m,label:'هذا الشهر'};if(/الشهر الماضي|الشهر اللي فات|الشهر الي فات/.test(n))return{type:'month',month:previousMonth(m),label:'الشهر الماضي'};if(prior?.type==='month'&&/الشهر (?:اللي|الي) قبله|الشهر قبله/.test(n)){const pm=previousMonth(prior.month);return{type:'month',month:pm,label:'الشهر اللي قبله'}}if(/هذا الاسبوع|هالاسبوع|الاسبوع ذا/.test(n)){const s=sunday(base);return{type:'range',start:s,end:addDays(s,6),label:'هذا الأسبوع'}}if(/الاسبوع الماضي|الاسبوع اللي فات|الاسبوع الي فات/.test(n)){const s=addDays(sunday(base),-7);return{type:'range',start:s,end:addDays(s,6),label:'الأسبوع الماضي'}}if(/اليوم/.test(n))return{type:'date',date:base,label:'اليوم'};if(/امس|البارح/.test(n))return{type:'date',date:addDays(base,-1),label:'أمس'};return weekdayPeriod(text)}
function detectPeriod(text,prior=null){let p=null;try{p=window.RakizaAI?.sales?.detectPeriod?.(text,prior)||null}catch{}if(!p)p=fallbackPeriod(text,prior);const n=norm(text);if(/قارن/.test(n)&&prior&&p&&p.type!=='compare'){return{type:'compare',periods:[prior,p]}}return p}
function periodLabel(p){if(!p)return'كل الأيام المسجلة';if(p.type==='date')return p.label||p.date;if(p.type==='month')return p.label||p.month;if(p.type==='range')return p.label||`${p.start} إلى ${p.end}`;if(p.type==='compare')return p.periods.map(periodLabel).join(' مقابل ');return'الفترة المحددة'}
function inPeriod(date,p){if(!p)return true;const d=String(date||'').slice(0,10);if(!d)return false;if(p.type==='date')return d===p.date;if(p.type==='month')return d.slice(0,7)===p.month;if(p.type==='range')return d>=p.start&&d<=p.end;return true}

function isExportCommand(n){return/(?:صدر|تصدير|نزل|حمل|طلع)\s*(?:لي|لنا|ها)?[^\n]{0,30}(?:اكسل|excel|xlsx|pdf)|(?:اكسل|excel|xlsx|pdf)\s*(?:للجاهزيه|جاهزيه)/.test(n)}
function detectColor(n){if(/اخضر|خضراء|الخضراء|الخضر/.test(n))return'أخضر';if(/اصفر|صفراء|الصفراء|الصفر/.test(n))return'أصفر';if(/احمر|حمراء|الحمراء|الحمر/.test(n))return'أحمر';return null}
function hasRank(n){return/اكثر|اعلى|اقل|ادنى|افضل|اسوا|يتكرر|تكرر|متكرر|رتب/.test(n)}
function hasReadinessWord(n){return/جاهزيه|جاهز|غير جاهز|الاستعداد|تقييم التشغيل|تشغيليه/.test(n)}
function detectSpec(text,analysis={}){const n=norm(text),prior=READY_STATE.last?.spec||null;let period=detectPeriod(text,prior?.period||null),item=detectItem(text),category=detectCategory(text),color=detectColor(n),task='metric',metric='score',groupBy=null,criticalOnly=false,status=null,rank={direction:'desc'};
  if(isExportCommand(n))task='export';
  else if(period?.type==='compare'||/قارن|مقارنه|مقارنة/.test(n))task='compare';
  else if(/حلل|تحليل|شخص|شخّص|قيم الوضع|قيّم الوضع|كيف وضع|وش وضع|ملخص|خلاصه/.test(n))task='analysis';
  if(/حرج/.test(n))criticalOnly=true;
  if(/عولج فورا|تعالج فورا|معالجه فوريه|معالجة فورية/.test(n)){metric='resolved_immediate';status='resolved'}
  else if(/مفتوح|يحتاج متابعه|ما تعالج|غير معالج/.test(n)&&/ملاحظ|ملاحظه|مشكل|مشكله|بند|جاهزيه|حرج/.test(n)){metric=criticalOnly?'critical_open':'open_issues';status='open'}
  else if(/كم مره.*حرج|عدد.*حرج|حرج.*كم مره/.test(n)){metric='critical_fail_count'}
  else if(color&&/كم يوم|عدد الايام|ايام/.test(n)){metric='color_days'}
  else if(/متوسط.*جاهزي|متوسط.*تقييم|متوسط.*درجه/.test(n)){metric='average_score'}
  else if(/اقل يوم|ادنى يوم|اسوا يوم/.test(n)){task='rank';metric='score';groupBy='day';rank.direction='asc'}
  else if(/افضل يوم|اعلى يوم/.test(n)){task='rank';metric='score';groupBy='day';rank.direction='desc'}
  else if(/اكثر قسم.*(?:خصم|خسر|نقص)|قسم.*(?:خصم|خسر).*اكثر/.test(n)){task='rank';metric='lost_weight';groupBy='category'}
  else if(/اكثر بند.*(?:خصم|خسر|نقص)|بند.*(?:خصم|خسر).*اكثر/.test(n)){task='rank';metric='lost_weight';groupBy='item'}
  else if(/اكثر قسم|اي قسم.*اكثر|وش القسم.*اكثر/.test(n)&&/فشل|غير جاهز|مشكل|يتكرر|تكرر/.test(n)){task='rank';metric='fail_count';groupBy='category'}
  else if(/اكثر بند|اي بند.*اكثر|وش البند.*اكثر|مشكله تشغيليه.*تكرر|مشكله.*تكرر/.test(n)&&/فشل|غير جاهز|مشكل|يتكرر|تكرر/.test(n)){task='rank';metric=criticalOnly?'critical_fail_count':'fail_count';groupBy='item'}
  else if(/البنود.*حرج.*تكرر|حرج.*تكرر/.test(n)){task='rank';metric='critical_fail_count';groupBy='item';criticalOnly=true}
  else if(/البنود .*غير .*جاهز|البنود غير الجاهز|وش فشل|ايش فشل|وش اللي مو جاهز|وش غير جاهز|المشاكل اليوم/.test(n)){metric='failed_items'}
  else if(/درجه الجاهزي|نسبه الجاهزي|تقييم الجاهزي|كم الجاهزي|الجاهزيه كم/.test(n)){metric='score'}
  if(hasRank(n)&&task==='metric'&&(item||category)&&/فشل|تكرر|غير جاهز/.test(n)){task='rank';metric='fail_count';groupBy=item?'item':'category'}
  if(item&&task==='metric'&&/كم مره|تكرر|فشل|غير جاهز/.test(n))metric=criticalOnly?'critical_fail_count':'fail_count';
  if(category&&task==='metric'&&/كم مره|تكرر|فشل|غير جاهز/.test(n))metric='fail_count';
  const shortFollow=/^(طيب|تمام|و|وال|طب|زين|اوكي|اوك|نفسها|منه|منها)/.test(n)||n.split(' ').length<=4;
  if(prior&&shortFollow){
    if(!period&&/(طيب|وال|و|نفس|منه|منها)/.test(n))period=prior.period;
    if(!item&&prior.item&&!/قسم/.test(n))item=prior.item;
    if(!category&&prior.category&&!/بند/.test(n))category=prior.category;
    if(!color&&prior.color&&/كم يوم|نفس/.test(n))color=prior.color;
    if(task==='metric'&&metric==='score'&&!/جاهزي|درجه|نسبه|تقييم/.test(n)){metric=prior.metric;groupBy=prior.groupBy;criticalOnly=criticalOnly||prior.criticalOnly}
    if(/وش اكثر قسم|اي قسم/.test(n)){task='rank';groupBy='category';metric=prior.metric==='lost_weight'?'lost_weight':'fail_count';item=null}
    if(/وش اكثر بند|اي بند/.test(n)){task='rank';groupBy='item';metric=prior.metric==='lost_weight'?'lost_weight':'fail_count'}
    if(/كم مره/.test(n)&&item){task='metric';metric=criticalOnly?'critical_fail_count':'fail_count'}
  }
  if(!period&&task==='metric'&&['score','failed_items','open_issues','critical_open','resolved_immediate'].includes(metric))period={type:'latest',label:'أحدث جاهزية مسجلة'};
  const itemOut=item?(item.name?{id:item.id,name:item.name,category:item.category,weight:num(item.weight),critical:!!item.critical}:{id:item.id,name:item.item_name_ar,category:item.category_name_ar,weight:num(item.weight),critical:!!item.critical}):null;
  return{domain:'readiness',task,metric,groupBy,period,item:itemOut,category,color,criticalOnly,status,rank,analysis};
}

function isReadinessLanguage(text,analysis={}){const n=norm(text);const team=/فريق|موظف|موظفين|متواجد|زي رسمي|الزي|بطاقه|بطاقة|المظهر|حضور|غياب|متاخر|متأخر/.test(n);if(team&&/جاهزيه/.test(n)&&!/جاهزيه المعرض|الجاهزيه التشغيليه/.test(n))return false;
  const otherStrong=/نواقص|نقص صنف|مبيعات|تارقت|تارجت|target|خطة التواجد|شفت|مهام اليوم|تنفيذ المهام/.test(n);const strong=/جاهزيه المعرض|الجاهزيه التشغيليه|جاهزيه تشغيليه|بند حرج|بنود حرجه|البنود الحرجه|حرجه مفتوح|غير جاهز|عولج فورا|تعالج فورا|ملاحظات الجاهزيه|تقييم الجاهزيه|درجه الجاهزيه|نسبه الجاهزيه|مشكله تشغيليه/.test(n);if(strong)return true;if(otherStrong)return false;
  if(analysis?.entities?.domain==='readiness')return true;
  if(hasReadinessWord(n)&&!team)return true;
  const item=detectItem(text),cat=detectCategory(text);if((item||cat)&&/فشل|تعطل|خربان|مو جاهز|غير جاهز|كم مره|تكرر|مشكله|جاهز/.test(n))return true;
  if(READY_STATE.last&&/^(طيب|و|وال|طب|كم مره|والشهر|والاسبوع|نفسها|منها)/.test(n))return true;
  return false}

function dayRows(){const a=getApp(),m=new Map();for(const r of (a.recent||[])){if(r?.work_date)m.set(String(r.work_date).slice(0,10),r)}if(a.day?.work_date&&!m.has(String(a.day.work_date).slice(0,10)))m.set(String(a.day.work_date).slice(0,10),a.day);return [...m.values()].sort((x,y)=>String(x.work_date).localeCompare(String(y.work_date)))}
function rowScore(r){const v=r?.operational_readiness;return v===null||v===undefined||v===''?null:Number(v)}
function filterRows(p){let rows=dayRows();if(p?.type==='latest'){const withScore=rows.filter(r=>rowScore(r)!==null);return withScore.length?[withScore[withScore.length-1]]:(rows.length?[rows[rows.length-1]]:[])}return rows.filter(r=>inPeriod(r.work_date,p)&&(rowScore(r)!==null||r.id))}
async function detailForRow(row){const key=String(row?.id||row?.work_date||'');if(READY_STATE.dayCache.has(key))return READY_STATE.dayCache.get(key);const a=getApp();if(a.day&&String(a.day.id)===String(row?.id)&&Array.isArray(a.checks)&&a.checks.length){const d={day:a.day,checks:a.checks};READY_STATE.dayCache.set(key,d);return d}if(!row?.id)return{day:row,checks:[]};const d=await callApi('day',{q:{id:row.id}});READY_STATE.dayCache.set(key,d);return d}
function normalizeCheck(c){const nested=c.opening_check_items||c.item||null,i=itemById(c.item_id,nested)||{},status=String(c.readiness_status||'');return{item_id:c.item_id||i.id,item_name_ar:i.item_name_ar||c.item_name_ar||'بند غير معروف',category_name_ar:i.category_name_ar||c.category_name_ar||'غير مصنف',weight:num(i.weight??c.weight),critical:Boolean(i.critical??c.critical),status,note:c.note||'',resolution_status:c.resolution_status||'',action_text:c.action_text||'',numeric_value:c.numeric_value}}
function calcDetail(detail,row){const checks=(detail?.checks||[]).map(normalizeCheck),items=appItems(),evaluated=checks.filter(c=>c.status==='جاهز'||c.status==='غير جاهز'),score=evaluated.reduce((s,c)=>s+(c.status==='جاهز'?c.weight:0),0),complete=items.length?evaluated.length>=items.length:evaluated.length>0,failed=evaluated.filter(c=>c.status==='غير جاهز'),resolved=failed.filter(c=>c.resolution_status==='عولج فورًا'),open=failed.filter(c=>c.resolution_status!=='عولج فورًا'),criticalOpen=open.filter(c=>c.critical),criticalFailed=failed.filter(c=>c.critical);let finalScore=rowScore(row);if(finalScore===null&&evaluated.length)finalScore=score;let color=finalScore===null?null:finalScore>=90?'أخضر':finalScore>=70?'أصفر':'أحمر';if(criticalOpen.length&&color==='أخضر')color='أحمر';return{row,checks,evaluated,score:finalScore,computedScore:score,complete,failed,resolved,open,criticalOpen,criticalFailed,color,lostWeight:failed.reduce((s,c)=>s+c.weight,0)}}
async function detailsForPeriod(p){const rows=filterRows(p);const out=[];for(const r of rows){try{out.push(calcDetail(await detailForRow(r),r))}catch{out.push(calcDetail({checks:[]},r))}}return out}
function statsFromRows(rows,p){const vals=rows.map(rowScore).filter(v=>v!==null&&Number.isFinite(v));return{period:p,rows,values:vals,count:vals.length,average:vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null,min:vals.length?Math.min(...vals):null,max:vals.length?Math.max(...vals):null}}
async function periodStats(p,needDetails=false){const rows=filterRows(p),base=statsFromRows(rows,p);if(!needDetails)return base;const details=await detailsForPeriod(p);const vals=details.map(x=>x.score).filter(v=>v!==null&&Number.isFinite(v));return{...base,details,values:vals,count:vals.length,average:vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null,min:vals.length?Math.min(...vals):null,max:vals.length?Math.max(...vals):null,failed:details.reduce((s,d)=>s+d.failed.length,0),open:details.reduce((s,d)=>s+d.open.length,0),resolved:details.reduce((s,d)=>s+d.resolved.length,0),criticalOpen:details.reduce((s,d)=>s+d.criticalOpen.length,0),criticalFailed:details.reduce((s,d)=>s+d.criticalFailed.length,0)}}
function noData(p){return`<div class="notice">لا توجد بيانات جاهزية مسجلة للفترة: <b>${esc(periodLabel(p))}</b>.</div>`}
function findCheckMatches(details,spec){let arr=[];for(const d of details)for(const c of d.failed){if(spec.item&&String(c.item_id)!==String(spec.item.id))continue;if(spec.category&&norm(c.category_name_ar)!==norm(spec.category))continue;if(spec.criticalOnly&&!c.critical)continue;arr.push({d,c})}return arr}
function groupFailures(details,spec){const m=new Map();for(const d of details){for(const c of d.failed){if(spec.criticalOnly&&!c.critical)continue;if(spec.item&&String(c.item_id)!==String(spec.item.id))continue;if(spec.category&&norm(c.category_name_ar)!==norm(spec.category))continue;const key=spec.groupBy==='category'?c.category_name_ar:String(c.item_id||c.item_name_ar),label=spec.groupBy==='category'?c.category_name_ar:c.item_name_ar;if(!m.has(key))m.set(key,{key,label,category:c.category_name_ar,count:0,lostWeight:0,criticalCount:0,openCount:0,dates:new Set()});const g=m.get(key);g.count++;g.lostWeight+=c.weight;if(c.critical)g.criticalCount++;if(c.resolution_status!=='عولج فورًا')g.openCount++;g.dates.add(d.row.work_date)}}return [...m.values()]}
function latestPeriodFromSpec(spec){if(spec.period?.type!=='latest')return spec.period;return spec.period}

async function metricHtml(spec){const needDetails=!['score','average_score','color_days'].includes(spec.metric)||!!spec.item||!!spec.category||spec.color;const st=await periodStats(spec.period,needDetails);if(!st.rows.length)return noData(spec.period);
  if(spec.metric==='score'){
    if(spec.item||spec.category){const ds=needDetails?st.details:await detailsForPeriod(spec.period),matches=findCheckMatches(ds,spec);const label=spec.item?.name||spec.category;return`<b>${esc(label)}</b><div class="mut" style="margin-top:6px">${esc(periodLabel(spec.period))}</div><div style="margin-top:8px">مرات عدم الجاهزية: <b>${matches.length}</b>${spec.item?` | وزن البند: <b>${spec.item.weight}</b> نقطة`:''}</div>`}
    const r=st.rows[st.rows.length-1],score=rowScore(r);if(score===null){const d=(await detailsForPeriod(spec.period))[0];if(!d||d.score===null)return noData(spec.period);return`<b>الجاهزية التشغيلية: ${pct(d.score)}</b><div class="mut" style="margin-top:6px">${esc(r.work_date)} · التصنيف: ${esc(d.color||'—')}</div>`}return`<b>الجاهزية التشغيلية: ${pct(score)}</b><div class="mut" style="margin-top:6px">${esc(r.work_date)}</div>`}
  if(spec.metric==='average_score')return st.average===null?noData(spec.period):`<b>متوسط الجاهزية التشغيلية: ${pct(st.average)}</b><div class="mut" style="margin-top:6px">على ${st.count} يوم جاهزية مسجل · ${esc(periodLabel(spec.period))}</div>`;
  if(spec.metric==='color_days'){const ds=await detailsForPeriod(spec.period),count=ds.filter(d=>d.color===spec.color).length;return`<b>أيام التصنيف ${esc(spec.color)}: ${count}</b><div class="mut" style="margin-top:6px">${esc(periodLabel(spec.period))} · التصنيف مطابق لمنطق ركيزة الحالي.</div>`}
  const ds=st.details||await detailsForPeriod(spec.period),matches=findCheckMatches(ds,spec);
  if(spec.metric==='fail_count'){const label=spec.item?.name||spec.category||'البنود';return`<b>مرات عدم الجاهزية — ${esc(label)}: ${matches.length}</b><div class="mut" style="margin-top:6px">${esc(periodLabel(spec.period))}</div>${matches.length?`<div style="margin-top:8px">الأيام: ${[...new Set(matches.map(x=>x.d.row.work_date))].join('، ')}</div>`:''}`}
  if(spec.metric==='critical_fail_count'){const cr=matches.filter(x=>x.c.critical);return`<b>مرات فشل البنود الحرجة: ${cr.length}</b><div class="mut" style="margin-top:6px">${esc(periodLabel(spec.period))}${spec.item?` · ${esc(spec.item.name)}`:''}</div>`}
  let list=[];if(spec.metric==='failed_items')list=ds.flatMap(d=>d.failed.map(c=>({d,c})));else if(spec.metric==='open_issues'||spec.metric==='critical_open')list=ds.flatMap(d=>(spec.metric==='critical_open'?d.criticalOpen:d.open).map(c=>({d,c})));else if(spec.metric==='resolved_immediate')list=ds.flatMap(d=>d.resolved.map(c=>({d,c})));
  if(spec.item)list=list.filter(x=>String(x.c.item_id)===String(spec.item.id));if(spec.category)list=list.filter(x=>norm(x.c.category_name_ar)===norm(spec.category));if(spec.criticalOnly)list=list.filter(x=>x.c.critical);
  const titles={failed_items:'البنود غير الجاهزة',open_issues:'الملاحظات المفتوحة',critical_open:'البنود الحرجة المفتوحة',resolved_immediate:'ما عولج فورًا'};if(!list.length)return`<b>${titles[spec.metric]||'النتيجة'}: لا يوجد</b><div class="mut" style="margin-top:6px">${esc(periodLabel(spec.period))}</div>`;return`<b>${titles[spec.metric]||'النتيجة'} — ${esc(periodLabel(spec.period))}</b><div style="margin-top:9px">${list.slice(0,20).map(x=>`<div class="task"><b>${esc(x.c.item_name_ar)}</b> <span class="chip">${esc(x.c.category_name_ar)}</span>${x.c.critical?' <span class="critical">حرج</span>':''}<div class="mut" style="margin-top:4px">${esc(x.d.row.work_date)} · ${x.c.weight} نقطة${x.c.note?` · ${esc(x.c.note)}`:''}${x.c.resolution_status?` · ${esc(x.c.resolution_status)}`:''}</div></div>`).join('')}</div>${list.length>20?`<div class="mut">تم عرض أول 20 من ${list.length}.</div>`:''}`
}
async function rankHtml(spec){if(spec.groupBy==='day'){const st=await periodStats(spec.period,false);if(!st.values.length)return noData(spec.period);const rows=st.rows.filter(r=>rowScore(r)!==null).sort((a,b)=>spec.rank.direction==='asc'?rowScore(a)-rowScore(b):rowScore(b)-rowScore(a)).slice(0,5);return`<b>${spec.rank.direction==='asc'?'أقل':'أفضل'} أيام الجاهزية — ${esc(periodLabel(spec.period))}</b><div style="margin-top:9px">${rows.map((r,i)=>`<div class="task"><b>${i+1}. ${esc(r.work_date)}</b><div class="mut">الجاهزية: ${pct(rowScore(r))}</div></div>`).join('')}</div>`}
  const st=await periodStats(spec.period,true);if(!st.details.length)return noData(spec.period);let groups=groupFailures(st.details,spec),metric=spec.metric==='lost_weight'?'lostWeight':spec.metric==='critical_fail_count'?'criticalCount':'count';groups.sort((a,b)=>b[metric]-a[metric]);const show=groups.filter(g=>g[metric]>0).slice(0,5);if(!show.length)return`<b>لا توجد حالات مطابقة — ${esc(periodLabel(spec.period))}</b>`;const title=spec.groupBy==='category'?'الأقسام':'البنود';const what=metric==='lostWeight'?'النقاط المفقودة':metric==='criticalCount'?'تكرار الفشل الحرج':'مرات عدم الجاهزية';return`<b>أكثر ${title} حسب ${what}</b><div class="mut" style="margin-top:6px">${esc(periodLabel(spec.period))}</div><div style="margin-top:9px">${show.map((g,i)=>`<div class="task"><b>${i+1}. ${esc(g.label)}</b>${spec.groupBy==='item'?` <span class="chip">${esc(g.category)}</span>`:''}<div class="mut" style="margin-top:4px">مرات الفشل: ${g.count} | النقاط المفقودة: ${g.lostWeight}${g.criticalCount?` | حرجة: ${g.criticalCount}`:''} | مفتوحة: ${g.openCount}</div></div>`).join('')}</div>`}
async function analysisHtml(spec){const st=await periodStats(spec.period,true);if(!st.details.length&&!st.values.length)return noData(spec.period);const groups=groupFailures(st.details,{...spec,groupBy:'item',item:null,category:null,criticalOnly:false}).sort((a,b)=>b.count-a.count),top=groups[0],colors={أخضر:0,أصفر:0,أحمر:0};st.details.forEach(d=>{if(d.color)colors[d.color]++});let h=`<b>تحليل الجاهزية التشغيلية — ${esc(periodLabel(spec.period))}</b><div class="metrics" style="margin-top:10px"><div class="metric"><span class="mut">متوسط الجاهزية</span><strong>${st.average===null?'—':pct(st.average)}</strong></div><div class="metric"><span class="mut">أقل درجة</span><strong>${st.min===null?'—':pct(st.min)}</strong></div><div class="metric"><span class="mut">ملاحظات مفتوحة</span><strong>${st.open||0}</strong></div><div class="metric"><span class="mut">حرجة مفتوحة</span><strong>${st.criticalOpen||0}</strong></div></div>`;h+=`<div style="margin-top:10px">التصنيف: أخضر <b>${colors['أخضر']}</b> | أصفر <b>${colors['أصفر']}</b> | أحمر <b>${colors['أحمر']}</b>.${top?`<br>أكثر بند تكرر عدم جاهزيته: <b>${esc(top.label)}</b> (${top.count} مرة).`:''}</div>`;if(st.criticalOpen)h+=`<div class="notice err" style="margin-top:9px">يوجد ${st.criticalOpen} تسجيل لبند حرج مفتوح ضمن الفترة.</div>`;return h}
async function compareHtml(spec){const ps=spec.period?.type==='compare'?spec.period.periods:null;if(!ps||ps.length<2)return'<b>أحتاج فترتين واضحتين للمقارنة.</b>';const a=await periodStats(ps[0],true),b=await periodStats(ps[1],true);const v=x=>x===null?'—':pct(x);return`<b>مقارنة الجاهزية التشغيلية: ${esc(periodLabel(ps[0]))} مقابل ${esc(periodLabel(ps[1]))}</b><div class="scroll" style="margin-top:10px"><table><thead><tr><th>المؤشر</th><th>${esc(periodLabel(ps[0]))}</th><th>${esc(periodLabel(ps[1]))}</th></tr></thead><tbody><tr><td>متوسط الجاهزية</td><td>${v(a.average)}</td><td>${v(b.average)}</td></tr><tr><td>أقل درجة</td><td>${v(a.min)}</td><td>${v(b.min)}</td></tr><tr><td>أيام مسجلة</td><td>${a.count}</td><td>${b.count}</td></tr><tr><td>مرات عدم الجاهزية</td><td>${a.failed||0}</td><td>${b.failed||0}</td></tr><tr><td>ملاحظات مفتوحة</td><td>${a.open||0}</td><td>${b.open||0}</td></tr><tr><td>حرجة مفتوحة</td><td>${a.criticalOpen||0}</td><td>${b.criticalOpen||0}</td></tr></tbody></table></div>`}
function exportHtml(){return'<b>فهمت أنك تريد تصدير تقرير الجاهزية.</b><div class="notice" style="margin-top:8px">لم نعتمد قالب تصدير للجاهزية داخل ركيزة AI حتى الآن، لذلك لن أنشئ ملفًا غير معتمد. القراءة والتحليل والمقارنة تعمل الآن.</div>'}
async function answer(text,analysis){const spec=detectSpec(text,analysis);let html;if(spec.task==='export')html=exportHtml();else if(spec.task==='compare')html=await compareHtml(spec);else if(spec.task==='rank')html=await rankHtml(spec);else if(spec.task==='analysis')html=await analysisHtml(spec);else html=await metricHtml(spec);READY_STATE.last={text,spec};if(window.RakizaAI?.state)window.RakizaAI.state.context={intent:'readiness_intelligence',entities:{domain:'readiness',readiness:READY_STATE.last},lastMessage:text};return html}

const baseAsk=window.askRakizaAssistant;
window.askRakizaAssistant=async function(){const inp=document.getElementById('assistantInput'),q=inp?.value?.trim();if(!q)return;let analysis={};try{analysis=window.RakizaAI?.analyze?.(q)||{}}catch{}if(!isReadinessLanguage(q,analysis)){if(typeof baseAsk==='function')return baseAsk();return}if(READY_STATE.busy)return;READY_STATE.busy=true;if(inp)inp.value='';chat('user',esc(q));try{chat('assistant',await answer(q,analysis))}catch(e){chat('assistant',`<div class="notice err">تعذر تحليل الجاهزية: ${esc(e.message||String(e))}</div>`)}finally{READY_STATE.busy=false}}

window.RakizaAI=window.RakizaAI||{};
window.RakizaAI.readiness={version:RRI_VERSION,state:READY_STATE,isReadinessLanguage,detectCategory,detectItem,detectPeriod,detectSpec,dayRows,periodStats,detailsForPeriod,answer};
})();
