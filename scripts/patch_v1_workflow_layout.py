from pathlib import Path
import re

p=Path('index.html')
s=p.read_text(encoding='utf-8')

# 1) Home: بدء / إغلاق + خطة اليوم, remove standalone team tile.
s=s.replace('<div class="tile"><h3>بدء اليوم</h3><button class="btn" onclick="openOpening()">فتح</button></div><div class="tile"><h3>الفريق</h3><button class="btn" onclick="openTeam()">فتح</button></div><div class="tile"><h3>خطة اليوم</h3><button class="btn" onclick="openDayPlan()">فتح</button></div>', '<div class="tile"><h3>بدء / إغلاق</h3><button class="btn" onclick="openOpening()">فتح</button></div><div class="tile"><h3>خطة اليوم</h3><button class="btn" onclick="openDayPlan()">فتح</button></div>', 1)

# 2) Opening becomes one continuous page: readiness + inline start approval.
opening='''<section id="opening" class="view"><div class="top"><div><div class="brand">بدء / إغلاق</div><div class="sub">بدء اليوم</div></div><button class="btn ghost" onclick="home()">الرئيسية</button></div><div class="card" style="margin-top:14px"><div class="metrics"><div class="metric"><span class="mut">اليوم</span><strong id="quickDay">—</strong></div><div class="metric"><span class="mut">التاريخ</span><strong id="quickDate">—</strong></div><div class="metric"><span class="mut">مستهدف الشهر</span><strong id="quickMonthTarget">—</strong></div><div class="metric"><span class="mut">نسبة المحقق من الشهر</span><strong id="quickMonthAch">—</strong></div></div></div><div id="o2" class="card" style="margin-top:14px"><div class="title">الجاهزية التشغيلية — 100 درجة</div><div id="checks"></div></div><div id="o4" class="card" style="margin-top:14px"><div class="title">اعتماد بدء اليوم</div><div class="field" style="max-width:520px;margin-bottom:14px"><label>القائم على البدء</label><select id="openingBy"></select></div><div id="openingSummary"></div><div class="actions"><button class="btn ghost" onclick="home()">رجوع</button><button class="btn gold" onclick="approveOpening()">اعتماد بدء اليوم</button></div></div></section>'''
s,n=re.subn(r'<section id="opening" class="view">.*?</section>\n<section id="team"', opening+'\n<section id="team"', s, count=1, flags=re.S)
assert n==1

# 3) Remove standalone team section and append it under خطة اليوم.
team_match=re.search(r'<section id="team" class="view">(.*?)</section>\n<section id="dayplan"', s, flags=re.S)
assert team_match
team_inner=team_match.group(1)
s=re.sub(r'<section id="team" class="view">.*?</section>\n<section id="dayplan"', '<section id="dayplan"', s, count=1, flags=re.S)

# Replace dayplan section so tasks first, team presence second.
old_day=re.search(r'<section id="dayplan" class="view">.*?</section>\n<section id="roster"', s, flags=re.S)
assert old_day
new_day='''<section id="dayplan" class="view"><div class="top"><div><div class="brand">خطة اليوم</div><div class="sub">الخطة والتواجد اليومي</div></div><button class="btn ghost" onclick="home()">الرئيسية</button></div><div class="card" style="margin-top:14px"><div class="title">خطة اليوم</div><div id="planLock"></div><div class="field"><label>نوع اليوم</label><select id="dayType" onchange="dayTypeChanged()"><option value="">اختر</option><option>يوم بيعي فقط</option><option>يوم تشغيلي</option></select></div><div id="operationalTasks" class="hidden"><h3>الترتيب والتعبئة</h3><div class="compact" id="sectionChoices"></div><div id="arrangementTasks"></div><h3>الاستلام والتحويل</h3><div class="fields"><div class="field"><label><input type="checkbox" id="receiveOn" onchange="renderSpecialTasks()"> استلام</label></div><div class="field"><label><input type="checkbox" id="transferOn" onchange="renderSpecialTasks()"> تحويل</label></div></div><div id="specialTasks"></div><div id="vmBox"></div></div><div class="actions"><button class="btn ghost" onclick="home()">رجوع</button><button class="btn gold" onclick="approvePlan()">اعتماد خطة اليوم</button></div></div><div class="card" style="margin-top:14px"><div class="title">تواجد الفريق</div><div id="rosterWarn"></div><div class="metrics" id="teamMetrics"></div><div class="scroll"><table><thead><tr><th>الموظف</th><th>الخطة الأصلية</th><th>الخطة الحالية</th><th>مرات التغيير</th><th>الحضور الفعلي</th><th>وقت الحضور</th><th>الزي</th><th>البطاقة</th><th>المظهر</th><th>الجاهزية</th></tr></thead><tbody id="attendanceRows"></tbody></table></div><div class="actions"><span></span><button class="btn gold" onclick="saveTeam()">حفظ تواجد الفريق</button></div></div></section>\n<section id="roster"'''
s=s[:old_day.start()] + new_day + s[old_day.end():]

# 4) Opening rendering: single page, no steps/panes.
s,n=re.subn(r'function renderOpening\(\)\{.*?\}function salesWorkDate', "function renderOpening(){renderOpeningQuick();$('openingBy').innerHTML=empOptions(app.day?.opening_by_employee_id);renderChecks();renderOpeningSummary()}function salesWorkDate", s, count=1, flags=re.S)
assert n==1

# 5) ostep no longer needed for opening; keep safe no-op compatibility.
s,n=re.subn(r'function ostep\(n\)\{.*?\}function renderChecks', "function ostep(n){if(n===4)renderOpeningSummary()}function renderChecks", s, count=1, flags=re.S)
assert n==1

# 6) Plan page also renders team presence.
s=s.replace("function openDayPlan(){if(!app.day)return alert('ابدأ يوم التشغيل أولًا');if(!app.day.opening_approved_at)return alert('اعتمد الافتتاح أولًا');show('dayplan');renderPlan()}", "function openDayPlan(){if(!app.day)return alert('ابدأ يوم التشغيل أولًا');if(!app.day.opening_approved_at)return alert('اعتمد بدء اليوم أولًا');show('dayplan');renderPlan();renderAttendance()}", 1)

# 7) Team save stays on dayplan after refresh.
s=s.replace("await refresh();show('team');renderAttendance();alert('تم حفظ حالة الفريق')", "await refresh();show('dayplan');renderPlan();renderAttendance();alert('تم حفظ تواجد الفريق')", 1)

# 8) Start approval returns home; wording only.
s=s.replace("alert('تم اعتماد الافتتاح وحفظه')", "alert('تم اعتماد بدء اليوم وحفظه')", 1)

p.write_text(s, encoding='utf-8')
