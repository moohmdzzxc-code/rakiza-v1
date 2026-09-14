global.window={};
window.RakizaAI={conversation:{state:{context:{domain:'sales'}}},conversationUniversal:{state:{lastRoute:'sales'}}};
require('../rakiza-ai-voice.js');
const V=window.RakizaAI.voice;
let pass=0;function ok(c,m,g){if(!c){console.error('FAIL',m,g||'');process.exit(1)}pass++}

ok(V.version==='1.0.0','voice version');
ok(V.profile==='arabic-white-saudi','Saudi white Arabic profile');
let out=V.present('<b>ملخص المبيعات</b><div>المبيعات 12,500 ريال</div>',{domain:'sales'});
ok(out.includes('وضع المبيعات')||out.includes('طلع لي من المبيعات'),'sales gets conversational lead',out);
ok(out.includes('12,500 ريال'),'numbers preserved exactly',out);
ok(out.includes('<b>ملخص المبيعات</b>'),'specialist body preserved',out);

out=V.present('<b>فهمت طلبك وباقي عندي الاسم فقط.</b><div>اكتب الاسم الكامل فقط، وبكمل نفس الطلب بدون ما تعيده.</div>',{domain:'attendance'});
ok(out.includes('فهمتك، وباقي أحدد الاسم بس'),'clarification naturalized',out);
ok(!out.includes('وضع الفريق حسب'),'clarification does not get data-summary lead',out);

out=V.present('<div class="notice err"><b>تعذر إكمال طلب المبيعات في هذه المحاولة.</b><div>عزلت الخطأ داخل هذه الوحدة فقط؛ ركيزة AI ما توقف، وتقدر تكمل بسؤالك أو تنتقل لأي جزء آخر.</div></div>',{domain:'sales'});
ok(out.includes('واضح وش تبي في المبيعات'),'error sounds conversational',out);
ok(out.includes('تقدر تكمل معي عادي'),'error keeps continuity',out);
ok(!out.includes('ركيزة AI ما توقف'),'technical failure phrase removed',out);

out=V.present('<b>لا توجد نتائج في خطة التواجد — اليوم.</b>',{domain:'attendance'});
ok(out.includes('ما لقيت نتائج'),'no-results phrase humanized',out);

out=V.present('<b>تمام، حصلتها.</b><div>آخر خطة محفوظة تبدأ 2026-09-06.</div>',{domain:'attendance'});
ok(!out.includes('rakiza-conversational-lead'),'already conversational answer not prefixed again',out);

const c=V.clarify('تقصد هذا الأسبوع أو الأسبوع الجاي؟','الخطة نفسها');
ok(c.includes('فهمتك إلى هنا'),'clarify acknowledges known context',c);
ok(c.includes('الخطة نفسها'),'clarify preserves known context',c);
ok(c.includes('هذا الأسبوع أو الأسبوع الجاي'),'clarify asks one direct question',c);

const before='المبيعات 8,750 من تارقت 10,000 بنسبة 87.5%';
out=V.naturalize(before);
ok(out===before,'plain factual text is not rewritten');

V.reset();ok(V.state.turn===0&&V.state.lastLead===null,'voice state resets');
ok(!('chainOfThought' in V.state),'voice stores no chain of thought');
console.log('Rakiza AI voice tests passed:',pass);
