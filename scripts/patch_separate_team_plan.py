from pathlib import Path
import re

p=Path('index.html')
s=p.read_text(encoding='utf-8')

old_home='<div class="tile"><h3>بدء اليوم</h3><button class="btn" onclick="openOpening()">فتح</button></div><div class="tile"><h3>خطة التواجد</h3><button class="btn" onclick="openRoster()">فتح</button></div>'
new_home='<div class="tile"><h3>بدء اليوم</h3><button class="btn" onclick="openOpening()">فتح</button></div><div class="tile"><h3>الفريق</h3><button class="btn" onclick="openTeam()">فتح</button></div><div class="tile"><h3>خطة اليوم</h3><button class="btn" onclick="openDayPlan()">فتح</button></div><div class="tile"><h3>خطة التواجد</h3><button class="btn" onclick="openRoster()">فتح</button></div>'
assert old_home in s
s=s.replace(old_home,new_home,1)

opening='''<section id="opening" class="view"><div class="top"><div><div class="brand">بدء اليوم</div><div class="sub">افتتاح اليوم</div></div><button class="btn ghost" onclick="home()">الرئيسية</button></div><div class="steps"><span class="step on" data-s="2">1 الجاهزية</span><span class="step" data-s="4">2 اعتماد الافتتاح</span></div><div class="card" style="margin-bottom:14px"><div class="metrics"><div class="metric"><span class="mut">اليوم</span><strong id="quickDay">—</strong></div><div class="metric"><span class="mut">التاريخ</span><strong id="quickDate">—</strong></div><div class="metric"><span class="mut">مستهدف الشهر</span><strong id="quickMonthTarget">—</strong></div><div class="metric"><span class="mut">نسبة المحقق من الشهر</span><strong id="quickMonthAch">—</strong></div></div></div><div id="o2" class="pane card"><div class="title">الجاهزية التشغيلية — 100 درجة</div><div id="checks"></div><div class="actions"><button class="btn ghost" onclick="home()">رجوع</button><button class="btn" onclick="ostep(4)">التالي</button></div></div><div id="o4" class="pane card hidden"><div class="title">ملخص واعتماد الافتتاح</div><div class="field" style="max-width:520px;margin-bottom:14px"><label>القائم على الافتتاح</label><select id="openingBy"></select></div><div id="openingSummary"></div><div class="actions"><button class="btn ghost" onclick="ostep(2)">السابق</button><button class="btn gold" onclick="approveOpening()">اعتماد الافتتاح</button></div></div></section>
<section id="team" class="view"><div class="top"><div><div class="brand">الفريق</div><div class="sub">الحضور والجاهزية اليومية</div></div><button class="btn ghost" onclick="home()">الرئيسية</button></div><div class="card" style="margin-top:14px"><div class="title">جاهزية الفريق</div><div id="rosterWarn"></div><div class="metrics" id="teamMetrics"></div><div class="scroll"><table><thead><tr><th>الموظف</th><th>الخطة الأصلية</th><th>الخطة الحالية</th><th>مرات التغيير</th><th>الحضور الفعلي</th><th>وقت الحضور</th><th>الزي</th><th>البطاقة</th><th>المظهر</th><th>الجاهزية</th></tr></thead><tbody id="attendanceRows"></tbody></table></div><div class="actions"><button class="btn ghost" onclick="home()">رجوع</button><button class="btn gold" onclick="saveTeam()">حفظ الفريق</button></div></div></section>
<section id="dayplan" class="view"><div class="top"><div><div class="brand">خطة اليوم</div><div class="sub">OP‑T002</div></div><button class="btn ghost" onclick="home()">الرئيسية</button></div><div class="card" style="margin-top:14px"><div id="planLock"></div><div class="field"><label>نوع اليوم</label><select id="dayType" onchange="dayTypeChanged()"><option value="">اختر</option><option>يوم بيعي فقط</option><option>يوم تشغيلي</option></select></div><div id="operationalTasks" class="hidden"><h3>الترتيب والتعبئة</h3><div class="compact" id="sectionChoices"></div><div id="arrangementTasks"></div><h3>الاستلام والتحويل</h3><div class="fields"><div class="field"><label><input type="checkbox" id="receiveOn" onchange="renderSpecialTasks()"> استلام</label></div><div class="field"><label><input type="checkbox" id="transferOn" onchange="renderSpecialTasks()"> تحويل</label></div></div><div id="specialTasks"></div><div id="vmBox"></div></div><div class="actions"><button class="btn ghost" onclick="home()">رجوع</button><button class="btn gold" onclick="approvePlan()">اعتماد خطة اليوم</button></div></div></section>'''
s,n=re.subn(r'<section id="opening" class="view">.*?</section>\n<section id="roster"',opening+'\n<section id="roster"',s,count=1,flags=re.S)
assert n==1

old_const=",SALES_API='https://fvkzsmtadppclzexaktz.supabase.co/functions/v1/rakiza-sales-save';let app={}"
new_const=",SALES_API='https://fvkzsmtadppclzexaktz.supabase.co/functions/v1/rakiza-sales-save',TEAM_API='https://fvkzsmtadppclzexaktz.supabase.co/functions/v1/rakiza-team-save',OPENING_APPROVE_API='https://fvkzsmtadppclzexaktz.supabase.co/functions/v1/rakiza-opening-approve';let app={}"
assert old_const in s
s=s.replace(old_const,new_const,1)

s,n=re.subn(r'function renderOpening\(\)\{.*?\}function salesWorkDate',"function renderOpening(){renderOpeningQuick();$('openingBy').innerHTML=empOptions(app.day?.opening_by_employee_id);renderChecks();ostep(app.day?.opening_approved_at?4:2)}function salesWorkDate",s,count=1,flags=re.S)
assert n==1

team_funcs="function openTeam(){if(!app.day)return alert('ابدأ يوم التشغيل أولًا');show('team');renderAttendance()}async function saveTeam(){try{let attendance=collectAttendance(),r=await fetch(TEAM_API+'?k='+TOKEN,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({work_date:app.day.work_date||app.date,attendance})}),j=await r.json();if(!r.ok)throw Error(j.error||'تعذر حفظ الفريق');await refresh();show('team');renderAttendance();alert('تم حفظ حالة الفريق')}catch(e){alert(e.message)}}function openDayPlan(){if(!app.day)return alert('ابدأ يوم التشغيل أولًا');if(!app.day.opening_approved_at)return alert('اعتمد الافتتاح أولًا');show('dayplan');renderPlan()}"
assert 'function ostep(n){' in s
s=s.replace('function ostep(n){',team_funcs+'function ostep(n){',1)

new_summary="function renderOpeningSummary(){let cs=collectChecks(),score=0,open=0,crit=0,res=0;cs.forEach(c=>{let el=document.querySelector(`.check[data-id=\"${c.item_id}\"]`);if(c.readiness_status==='جاهز')score+=Number(el.dataset.w);else if(c.readiness_status==='غير جاهز'){if(c.resolution_status==='عولج فورًا')res++;else{open++;if(el.dataset.cr==='true')crit++}}});let cl=score>=90?'أخضر':score>=70?'أصفر':'أحمر';if(crit&&cl==='أخضر')cl='أحمر';$('openingSummary').innerHTML=`<div class=\"metrics\"><div class=\"metric\"><span>الجاهزية التشغيلية</span><strong class=\"${statusClass(cl)}\">${score}%</strong></div><div class=\"metric\"><span>ملاحظات معالجة</span><strong>${res}</strong></div><div class=\"metric\"><span>ملاحظات مفتوحة</span><strong>${open}</strong></div><div class=\"metric\"><span>حرجة مفتوحة</span><strong class=\"${crit?'re':''}\">${crit}</strong></div></div>${crit?'<div class=\"notice err\">يوجد بند حرج غير معالج. يسمح بالاعتماد مع التحذير.</div>':''}`}async function approveOpening"
s,n=re.subn(r'function renderOpeningSummary\(\)\{.*?\}async function approveOpening',new_summary,s,count=1,flags=re.S)
assert n==1

new_approve="async function approveOpening(){try{let checks=collectChecks();if(!$('openingBy').value)throw Error('حدد القائم على الافتتاح');if(checks.some(c=>!c.readiness_status))throw Error('قيّم جميع بنود الجاهزية');let r=await fetch(OPENING_APPROVE_API+'?k='+TOKEN,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({work_date:app.day?.work_date||app.date,opening_by_employee_id:$('openingBy').value,checks})}),j=await r.json();if(!r.ok)throw Error(j.error||'تعذر اعتماد الافتتاح');await refresh();home();alert('تم اعتماد الافتتاح وحفظه')}catch(e){alert(e.message)}}function dayTypeChanged"
s,n=re.subn(r'async function approveOpening\(\)\{.*?\}function dayTypeChanged',new_approve,s,count=1,flags=re.S)
assert n==1

assert "prepared_by:$('openingBy').value" in s
s=s.replace("prepared_by:$('openingBy').value","prepared_by:app.day.opening_by_employee_id",1)
assert "await refresh();alert('تم اعتماد خطة اليوم وحفظها')" in s
s=s.replace("await refresh();alert('تم اعتماد خطة اليوم وحفظها')","await refresh();home();alert('تم اعتماد خطة اليوم وحفظها')",1)

p.write_text(s,encoding='utf-8')
