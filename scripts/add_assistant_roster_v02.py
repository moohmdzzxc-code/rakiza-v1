from pathlib import Path

p=Path('index.html')
s=p.read_text(encoding='utf-8')

s=s.replace('<!-- pages-publish: assistant-v01-2026-09-05 -->','<!-- pages-publish: assistant-v02-roster-2026-09-09 -->',1)

old_btn='<button class="mini" onclick="askAssistantQuick(\'صدر لي مبيعات الشهر الماضي مع التارقت Excel\')">مبيعات الشهر الماضي Excel</button>'
new_btn=old_btn+'<button class="mini" onclick="askAssistantQuick(\'أنشئ خطة تواجد للأسبوع القادم\')">إنشاء خطة تواجد</button>'
assert old_btn in s, 'assistant sales suggestion not found'
s=s.replace(old_btn,new_btn,1)

old_intro='<b>أهلًا، أنا مساعد ركيزة التجريبي.</b><div class="mut" style="margin-top:6px">اسألني عن المبيعات، النواقص، المشكلات المسجلة أو الإجراءات المفتوحة. وأقدر أجهز مبيعات شهر في ملف Excel.</div>'
new_intro='<b>أهلًا، أنا مساعد ركيزة التجريبي.</b><div class="mut" style="margin-top:6px">اسألني عن بيانات التشغيل أو اطلب مني تنفيذ مهمة. أقدر أحلل المبيعات والنواقص والإجراءات، أجهز Excel، وأبني لك مسودة خطة تواجد قابلة للمراجعة قبل الحفظ.</div>'
assert old_intro in s, 'assistant intro not found'
s=s.replace(old_intro,new_intro,1)

old_state='let assistantReady=false,assistantLastSales=null;'
new_state='let assistantReady=false,assistantLastSales=null,assistantRosterDraft=null;'
assert old_state in s, 'assistant state not found'
s=s.replace(old_state,new_state,1)

anchor='async function askRakizaAssistant(){'
assert anchor in s, 'assistant handler anchor not found'

roster_js=r'''const ASSISTANT_ROSTER_STATUSES=['Morning','Evening','D/O','A/L','S/L','تعويضي','مهمة عمل'];
function assistantIsoPlusDays(d,n){let x=new Date(d+'T12:00:00');x.setDate(x.getDate()+n);return x.toISOString().slice(0,10)}
function assistantRosterOptionHtml(v=''){return '<option value="">اختر</option>'+ASSISTANT_ROSTER_STATUSES.map(x=>`<option value="${x}" ${v===x?'selected':''}>${x}</option>`).join('')}
function assistantNextRosterWeek(){let base=app.calendarDate||app.date,cur=weekSunday(base);return assistantIsoPlusDays(cur,7)}
function assistantFallbackRoster(active,ds){let out={};active.forEach((e,ei)=>ds.forEach((d,di)=>{let off=(ei%7)===di;out[e.id+'|'+d]=off?'D/O':((ei+di)%2===0?'Morning':'Evening')}));return out}
async function assistantGenerateRosterNextWeek(){let ws=assistantNextRosterWeek(),ds=dates7(ws),target=await api('roster-get',{q:{week_start:ws}});if(target.header){assistantAdd('assistant',`خطة التواجد للأسبوع <b>${ws}</b> محفوظة أصلًا، لذلك لن أكتب فوقها.<div style="margin-top:9px"><button class="mini" onclick="openRoster()">فتح خطة التواجد</button></div>`);return}let source=assistantIsoPlusDays(ws,-7),src=await api('roster-get',{q:{week_start:source}}),active=app.employees.filter(e=>e.active),entries={},exceptional=0,sourceUsed=!!(src.header&&(src.entries||[]).length);if(sourceUsed){let sds=dates7(source),m=new Map((src.entries||[]).map(x=>[x.employee_id+'|'+x.work_date,x.planned_status]));active.forEach(e=>ds.forEach((d,i)=>{let v=m.get(e.id+'|'+sds[i])||'';if(['Morning','Evening','D/O'].includes(v))entries[e.id+'|'+d]=v;else{entries[e.id+'|'+d]='';if(v)exceptional++}}))}else entries=assistantFallbackRoster(active,ds);assistantRosterDraft={week_start:ws,week_end:ds[6],dates:ds,employees:active,entries,source_week:source,source_used:sourceUsed,exceptional};assistantRenderRosterDraft()}
function assistantRenderRosterDraft(){let d=assistantRosterDraft;if(!d)return;let days=['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'],note=d.source_used?`بنيت المسودة على خطة الأسبوع السابق <b>${d.source_week}</b>. تم ترحيل Morning / Evening / D/O فقط.`:'لا توجد خطة محفوظة للأسبوع السابق، لذلك أنشأت توزيعًا متوازنًا مبدئيًا كمسودة.';if(d.exceptional)note+=` <span class="re">وجدت ${d.exceptional} حالة استثنائية في الأسبوع السابق ولم أرحّلها تلقائيًا؛ أكملها قبل الاعتماد.</span>`;let html=`<b>مسودة خطة التواجد — ${d.week_start} إلى ${d.week_end}</b><div class="mut" style="margin-top:6px">${note}</div><div class="field" style="max-width:420px;margin-top:12px"><label>من أعد الخطة</label><select id="assistantRosterBy">${empOptions()}</select></div><div class="scroll" style="margin-top:12px"><table class="roster" id="assistantRosterDraftTable"><thead><tr><th>الموظف</th>${d.dates.map((x,i)=>`<th>${days[i]}<br><span class="mut">${x.slice(5)}</span></th>`).join('')}</tr></thead><tbody>${d.employees.map(e=>`<tr data-emp="${e.id}"><td><b>${assistantEscText(e.full_name)}</b></td>${d.dates.map(x=>`<td><select data-date="${x}" onchange="assistantRosterDraftChanged(this)">${assistantRosterOptionHtml(d.entries[e.id+'|'+x]||'')}</select></td>`).join('')}</tr>`).join('')}</tbody></table></div><div id="assistantRosterDraftTotals" style="margin-top:10px"></div><div class="actions" style="justify-content:flex-start;flex-wrap:wrap"><button class="btn gold" onclick="assistantApproveRosterDraft()">اعتماد الخطة</button><button class="btn ghost" onclick="assistantCancelRosterDraft()">إلغاء المسودة</button></div>`;assistantAdd('assistant',html);assistantRenderRosterDraftTotals()}
function assistantRosterDraftChanged(sel){let d=assistantRosterDraft,row=sel.closest('tr');if(!d||!row)return;d.entries[row.dataset.emp+'|'+sel.dataset.date]=sel.value;assistantRenderRosterDraftTotals()}
function assistantRenderRosterDraftTotals(){let d=assistantRosterDraft,box=$('assistantRosterDraftTotals');if(!d||!box)return;box.innerHTML='<div class="scroll"><table><thead><tr><th>اليوم</th>'+d.dates.map(x=>`<th>${x.slice(5)}</th>`).join('')+'</tr></thead><tbody>'+['Morning','Evening','إجمالي المداومين','غير محدد'].map(label=>`<tr><td>${label}</td>${d.dates.map(date=>{let vals=d.employees.map(e=>d.entries[e.id+'|'+date]||''),n=label==='Morning'?vals.filter(v=>v==='Morning').length:label==='Evening'?vals.filter(v=>v==='Evening').length:label==='إجمالي المداومين'?vals.filter(v=>['Morning','Evening'].includes(v)).length:vals.filter(v=>!v).length;return`<td>${n}</td>`}).join('')}</tr>`).join('')+'</tbody></table></div>'}
function assistantCancelRosterDraft(){assistantRosterDraft=null;assistantAdd('assistant','تم إلغاء مسودة خطة التواجد ولم يتم حفظ أي شيء.')}
async function assistantApproveRosterDraft(){try{let d=assistantRosterDraft;if(!d)throw Error('لا توجد مسودة خطة تواجد حالية');let prepared=$('assistantRosterBy')?.value;if(!prepared)throw Error('حدد من أعد الخطة قبل الاعتماد');let missing=[];d.employees.forEach(e=>d.dates.forEach(date=>{if(!d.entries[e.id+'|'+date])missing.push(e.full_name+' '+date)}));if(missing.length)throw Error(`أكمل الخطة أولًا. يوجد ${missing.length} خانة غير محددة.`);let check=await api('roster-get',{q:{week_start:d.week_start}});if(check.header)throw Error('تم حفظ خطة لهذا الأسبوع بالفعل. افتح خطة التواجد لمراجعتها.');if(!confirm(`اعتماد خطة التواجد للأسبوع ${d.week_start}؟ بعد الاعتماد تصبح الخطة الأصلية محفوظة، وأي تغيير لاحق يسجل كتغيير منفصل.`))return;let entries=[];d.employees.forEach(e=>d.dates.forEach(date=>entries.push({employee_id:e.id,work_date:date,planned_status:d.entries[e.id+'|'+date]})));await api('roster-save',{method:'POST',body:{week_start:d.week_start,week_end:d.week_end,prepared_by:prepared,entries}});let savedWeek=d.week_start;assistantRosterDraft=null;await refresh();assistantAdd('assistant',`تم اعتماد وحفظ خطة التواجد للأسبوع <b>${savedWeek}</b> ✅<div style="margin-top:9px"><button class="mini" onclick="openRoster()">فتح خطة التواجد</button></div>`)}catch(e){assistantAdd('assistant',`<span class="re">${assistantEscText(e.message)}</span>`)}}
'''
s=s.replace(anchor,roster_js+anchor,1)

old_try="let t=assistantNorm(q);try{if(t.includes('مبيعات')"
new_try="let t=assistantNorm(q);try{if(((t.includes('خطة')&&t.includes('تواجد'))||(t.includes('جدول')&&t.includes('دوام')))&&(t.includes('انش')||t.includes('جهز')||t.includes('سوي')||t.includes('انتج')||t.includes('اعمل')||t.includes('اسبوع'))){await assistantGenerateRosterNextWeek();return}\nif(t.includes('مبيعات')"
assert old_try in s, 'assistant dispatch anchor not found'
s=s.replace(old_try,new_try,1)

p.write_text(s,encoding='utf-8')
