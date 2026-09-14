global.window={};
window.RakizaAI={conversation:{state:{context:{domain:'sales'}}},conversationUniversal:{state:{lastRoute:'sales'}}};
require('../rakiza-ai-voice.js');
const V=window.RakizaAI.voice;
let pass=0;function ok(c,m,g){if(!c){console.error('FAIL',m,g||'');process.exit(1)}pass++}

ok(V.version==='1.1.0','voice version');
ok(V.profile==='professional-arabic-saudi','professional Arabic Saudi profile');
let out=V.present('<b>ملخص المبيعات</b><div>المبيعات 12,500 ريال</div>',{domain:'sales'});
ok(out.includes('البيانات المسجلة')||out.includes('ملخص المبيعات وفق'),'sales gets professional lead',out);
ok(out.includes('12,500 ريال'),'numbers preserved exactly',out);
ok(out.includes('<b>ملخص المبيعات</b>'),'specialist body preserved',out);

out=V.present('<b>فهمت طلبك وباقي عندي الاسم فقط.</b><div>اكتب الاسم الكامل فقط، وبكمل نفس الطلب بدون ما تعيده.</div>',{domain:'attendance'});
ok(out.includes('واضح المقصود، بقي فقط تحديد الموظف'),'clarification elevated professionally',out);
ok(!out.includes('فهمتك، وباقي'),'casual clarification removed',out);
ok(!out.includes('وضع الفريق حسب'),'clarification does not get data-summary lead',out);

out=V.present('<div class="notice err"><b>تعذر إكمال طلب المبيعات في هذه المحاولة.</b><div>عزلت الخطأ داخل هذه الوحدة فقط؛ ركيزة AI ما توقف، وتقدر تكمل بسؤالك أو تنتقل لأي جزء آخر.</div></div>',{domain:'sales'});
ok(out.includes('لم أتمكن من إكمال جزئية المبيعات حاليًا'),'error is professional and direct',out);
ok(out.includes('المشكلة محصورة في هذه الجزئية'),'error keeps continuity professionally',out);
ok(!out.includes('تقدر تكمل معي عادي'),'casual failure phrase removed',out);
ok(!out.includes('ركيزة AI ما توقف'),'technical failure phrase removed',out);

out=V.present('<b>لا توجد نتائج في خطة التواجد — اليوم.</b>',{domain:'attendance'});
ok(out.includes('لا توجد نتائج مطابقة في البيانات المسجلة'),'no-results phrase is professional',out);

out=V.present('<b>تمام، حصلتها.</b><div>آخر خطة محفوظة تبدأ 2026-09-06.</div>',{domain:'attendance'});
ok(out.includes('<b>وجدتها.</b>'),'casual found phrase elevated',out);
ok(!out.includes('rakiza-conversational-lead'),'already natural answer not prefixed again',out);

const c=V.clarify('تقصد هذا الأسبوع أو الأسبوع القادم؟','الخطة نفسها');
ok(c.includes('واضح لدي حتى الآن'),'clarify acknowledges known context professionally',c);
ok(c.includes('الخطة نفسها'),'clarify preserves known context',c);
ok(c.includes('هذا الأسبوع أو الأسبوع القادم'),'clarify asks one direct question',c);

out=V.naturalize('<b>فهمت المجال، وباقي أعرف وش تبي أسوي بالضبط.</b>');
ok(out.includes('المجال واضح، وبقي تحديد المطلوب'),'operation clarification elevated',out);
ok(out.includes('عرض المعلومات')&&out.includes('إعداد مسودة'),'operation choices remain clear',out);

out=V.naturalize('<b>تعذر توجيه الطلب في هذه المحاولة.</b>');
ok(out.includes('المقصود غير مكتمل لدي بعد'),'routing failure becomes a clarification invitation',out);

const before='المبيعات 8,750 من تارقت 10,000 بنسبة 87.5%';
out=V.naturalize(before);
ok(out===before,'plain factual text is not rewritten');

const store=V.present('<b>تحليل المعرض</b><div>هناك ضغط تشغيلي يحتاج متابعة.</div>',{domain:'store'});
ok(store.includes('الصورة العامة')||store.includes('جمع البيانات المتاحة'),'store analysis uses executive language',store);

const forbidden=['إي، هذا','هذا اللي طلع لي','ما لقيت نتائج','تقدر تكمل معي عادي','فهمتك، وباقي'];
for(const phrase of forbidden){ok(!V.naturalize(`<b>${phrase}</b>`).includes(phrase),'professional naturalizer avoids casual phrase: '+phrase,V.naturalize(`<b>${phrase}</b>`))}

V.reset();ok(V.state.turn===0&&V.state.lastLead===null,'voice state resets');
ok(!('chainOfThought' in V.state),'voice stores no chain of thought');
console.log('Rakiza AI voice tests passed:',pass);
