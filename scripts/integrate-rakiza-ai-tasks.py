from pathlib import Path


def replace_once(text, old, new, label):
    if new in text:
        return text
    if old not in text:
        raise SystemExit(f'{label} anchor not found')
    return text.replace(old, new, 1)

# --- Tasks specialist patches ---
p = Path('rakiza-ai-tasks.js')
s = p.read_text(encoding='utf-8')

s = replace_once(
    s,
    "if(ctx.employee&&/مهام|مهمه|مهمة|وش عليه|وش عنده/.test(n))return'assignments';return'list'}",
    "if(ctx.employee&&/مهام|مهمه|مهمة|وش عليه|وش عنده/.test(n))return'assignments';return ctx.task||'list'}",
    'detectTask context'
)

s = replace_once(
    s,
    "if(STATE.last&&isFollow(n)&&!x.sales&&!x.shortages&&!x.readiness&&!x.attendance&&!x.actions)return true;return false}",
    "if(STATE.last&&(isFollow(n)||/^(?:قارن|حللها|حلله|وش عنها)/.test(n))&&!x.sales&&!x.shortages&&!x.readiness&&!x.attendance&&!x.actions)return true;return false}",
    'task router context'
)

old_spec = "function detectSpec(text,analysis={}){const n=norm(text),prior=STATE.last?.spec||{},follow=isFollow(n),ctx=follow?prior:{},period=detectPeriod(text,ctx.period)||ctx.period||null,employee=detectEmployee(text,ctx.employee),category=detectCategory(text,ctx.category),section=detectSection(text,ctx.section),execution=detectExec(text,ctx.execution),task=detectTask(text,{...ctx,employee});return{task,period,employee,category,section,execution,limit:detectLimit(text),text:n}}"
new_spec = "function detectSpec(text,analysis={}){const n=norm(text),prior=STATE.last?.spec||{},follow=isFollow(n)||/^(?:قارن|حللها|حلله|وش عنها)/.test(n),ctx=follow?prior:{},period=detectPeriod(text,ctx.period)||ctx.period||null,employee=detectEmployee(text,ctx.employee),category=detectCategory(text,ctx.category),section=detectSection(text,ctx.section),execution=detectExec(text,ctx.execution),task=detectTask(text,{...ctx,employee}),groupBy=/قسم|اقسام|أقسام/.test(n)?'section':(/موظف|الفريق|مين/.test(n)&&task==='rank_noncompletion'?'employee':'category');return{task,period,employee,category,section,execution,groupBy,limit:detectLimit(text),text:n}}"
s = replace_once(s, old_spec, new_spec, 'detectSpec')

old_list = "async function listHtml(spec){const p=spec.period||{type:'date',date:baseDate(),label:'اليوم'},data=await buildPeriod(p),rows=applySpec(data.tasks,spec);if(!rows.length){const salesOnly=data.days.find(d=>d.day_type==='يوم بيعي فقط');if(salesOnly)return`<b>${esc(periodLabel(p))}: يوم بيعي فقط.</b><div class=\"mut\">لا توجد مهام تشغيلية معتمدة لهذا اليوم.</div>`;return noData(p)}"
new_list = "async function listHtml(spec){const p=spec.period||{type:'date',date:baseDate(),label:'اليوم'},data=await buildPeriod(p),rows=applySpec(data.tasks,spec);if(!rows.length){const salesOnly=data.days.length===1&&data.days[0].day_type==='يوم بيعي فقط';if(salesOnly)return`<b>${esc(periodLabel(p))}: يوم بيعي فقط.</b><div class=\"mut\">لا توجد مهام تشغيلية معتمدة لهذا اليوم.</div>`;return noData(p)}"
s = replace_once(s, old_list, new_list, 'single sales-only day')

new_rank = """async function rankNoncompletionHtml(spec){const p=spec.period||{type:'month',month:monthKey(baseDate()),label:'هذا الشهر'},data=await buildPeriod(p),rows=applySpec(data.tasks,{...spec,execution:null}).filter(r=>r.execution_final&&['partial','not_done'].includes(r.execution_kind));if(!rows.length)return`<b>لا توجد مهام غير مكتملة مسجلة — ${esc(periodLabel(p))}</b>`;const m=new Map();for(const r of rows){if(spec.groupBy==='employee'){for(const a of r.assignments){const key=String(a.employee_id),label=employeeName(a.employee)||'غير محدد',x=m.get(key)||{label,count:0,partial:0,notDone:0};x.count++;if(r.execution_kind==='partial')x.partial++;if(r.execution_kind==='not_done')x.notDone++;m.set(key,x)}}else{const label=spec.groupBy==='section'?(r.section||r.task.task_detail||'غير محدد'):r.category,x=m.get(label)||{label,count:0,partial:0,notDone:0};x.count++;if(r.execution_kind==='partial')x.partial++;if(r.execution_kind==='not_done')x.notDone++;m.set(label,x)}}const g=[...m.values()].sort((a,b)=>b.count-a.count).slice(0,spec.limit),title=spec.groupBy==='employee'?'الموظفين المكلفين بمهام غير مكتملة':spec.groupBy==='section'?'الأقسام الأكثر تعثرًا':'أنواع المهام الأكثر تعثرًا';return`<b>${title} — ${esc(periodLabel(p))}</b><div style=\"margin-top:9px\">${g.map((x,i)=>`<div class=\"task\"><b>${i+1}. ${esc(x.label)}</b><div class=\"mut\">مهام غير مكتملة: ${x.count} | جزئية: ${x.partial} | لم تنفذ: ${x.notDone}</div></div>`).join('')}</div>${spec.groupBy==='employee'?'<div class=\"mut\">العد هنا للمهام التي كان الموظف مكلفًا بها، ولا يعني أنه تسبب في عدم الإكمال.</div>':''}`}
"""
if "الموظفين المكلفين بمهام غير مكتملة" not in s:
    start = s.index('async function rankNoncompletionHtml(spec)')
    end = s.index('async function rankAssignmentsHtml(spec)', start)
    s = s[:start] + new_rank + s[end:]

p.write_text(s, encoding='utf-8')

# --- Shared reasoning patches ---
p = Path('rakiza-ai-reasoning.js')
r = p.read_text(encoding='utf-8')

r = replace_once(
    r,
    "  operational_meaning:'لا تبحث عن الرقم فقط؛ اربط الرقم بمعناه التشغيلي دون تجاوز ما تثبته البيانات.'",
    "  task_execution_open_not_failure:'عدم وجود حالة تنفيذ نهائية لمهمة في يوم مفتوح لا يعني أنها لم تنفذ؛ التنفيذ النهائي يثبت عند إغلاق اليوم.',\n  operational_meaning:'لا تبحث عن الرقم فقط؛ اربط الرقم بمعناه التشغيلي دون تجاوز ما تثبته البيانات.'",
    'reasoning task principle'
)

r = replace_once(
    r,
    "  if(domain==='attendance')out.push('الخطة الأصلية تبقى محفوظة، والتغيير لا يمحوها.');\n  return out;",
    "  if(domain==='attendance')out.push('الخطة الأصلية تبقى محفوظة، والتغيير لا يمحوها.');\n  if(domain==='tasks'){out.push('اليوم المفتوح بلا حالة تنفيذ نهائية لا يُعامل كمهمة غير منفذة.');out.push('تعديل خطة اليوم لا يمحو النسخة السابقة، وأي تعديل معتمد يحتاج سببًا.');}\n  return out;",
    'reasoning task constraints'
)

old_focus = "  if(domain==='attendance'){\n    if(s.employee&&!s.employee.ambiguous)return{type:'employee',id:s.employee.id||null,label:s.employee.full_name||s.employee.name||null};\n    if(s.planStatus)return{type:'plan_status',label:s.planStatus};\n    if(s.attStatus)return{type:'attendance_status',label:s.attStatus};\n  }\n  return null;"
new_focus = "  if(domain==='attendance'){\n    if(s.employee&&!s.employee.ambiguous)return{type:'employee',id:s.employee.id||null,label:s.employee.full_name||s.employee.name||null};\n    if(s.planStatus)return{type:'plan_status',label:s.planStatus};\n    if(s.attStatus)return{type:'attendance_status',label:s.attStatus};\n  }\n  if(domain==='tasks'){\n    if(s.employee&&!s.employee.ambiguous)return{type:'employee',id:s.employee.id||null,label:s.employee.full_name||s.employee.name||null};\n    if(s.category)return{type:'task_category',label:s.category};\n    if(s.section)return{type:'section',label:s.section.name||s.section};\n    if(s.execution)return{type:'execution_status',label:s.execution};\n  }\n  return null;"
r = replace_once(r, old_focus, new_focus, 'reasoning task focus')

r = replace_once(
    r,
    "    attendance:['خطة التواجد والحضور الفعلي وسجل تغييرات الخطة']\n  }[domain]||['بيانات ركيزة المسجلة'];",
    "    attendance:['خطة التواجد والحضور الفعلي وسجل تغييرات الخطة'],\n    tasks:['خطة اليوم المعتمدة والمهام والتكليفات وحالات التنفيذ عند الإغلاق']\n  }[domain]||['بيانات ركيزة المسجلة'];",
    'reasoning task source'
)

r = replace_once(
    r,
    "    readiness:AI.readiness?.state?.last||null,\n    attendance:AI.attendance?.state?.last||null\n  };",
    "    readiness:AI.readiness?.state?.last||null,\n    attendance:AI.attendance?.state?.last||null,\n    tasks:AI.tasks?.state?.last||null\n  };",
    'reasoning snapshot tasks'
)

r = replace_once(
    r,
    "  for(const d of ['attendance','readiness','sales','shortages']){",
    "  for(const d of ['tasks','attendance','readiness','sales','shortages']){",
    'reasoning changed specialist tasks'
)

p.write_text(r, encoding='utf-8')

# --- Frontend load order ---
p = Path('index.html')
i = p.read_text(encoding='utf-8')
task_tag = '<script src="rakiza-ai-tasks.js"></script>'
reason_tag = '<script src="rakiza-ai-reasoning.js"></script>'
if task_tag not in i:
    if reason_tag not in i:
        raise SystemExit('reasoning script anchor missing')
    i = i.replace(reason_tag, task_tag + '\n' + reason_tag, 1)
if i.count(task_tag) != 1:
    raise SystemExit('tasks script must exist exactly once')
if i.index(task_tag) > i.index(reason_tag):
    raise SystemExit('tasks script must load before shared reasoning')
p.write_text(i, encoding='utf-8')

print('Rakiza AI tasks integration patch applied')
