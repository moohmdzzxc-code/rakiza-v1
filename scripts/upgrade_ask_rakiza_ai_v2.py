from pathlib import Path
import re

p=Path('index.html')
s=p.read_text(encoding='utf-8')

s=re.sub(r'<!-- pages-publish:[^>]+-->', '<!-- pages-publish: ask-rakiza-ai-v2-2026-09-11 -->', s, count=1)

s=s.replace('AI تجريبي — اسأل، حلّل، وأنشئ مسودات تشغيلية','AI تشغيلي — اسأل، حلّل، واطلب التنفيذ',1)
s=s.replace('يفهم تعليماتك باللغة الطبيعية ويستخدم بيانات ركيزة لبناء مسودات وتقارير. أي تغيير تشغيلي يبقى مسودة حتى تعتمدها بنفسك.','اسأل بطريقتك الطبيعية. مساعد ركيزة يختار البيانات والأداة المناسبة تلقائيًا، ويقدر يحلل ويصدر Excel وينشئ مسودات تشغيلية. التغييرات التشغيلية لا تُحفظ دون اعتمادك.',1)

old='async function askRakizaAssistant(){assistantInit();let inp=$(\'assistantInput\'),q=inp.value.trim();if(!q)return;'
assert old in s, 'legacy ask function not found'
s=s.replace(old,"async function askRakizaAssistantLegacy(){assistantInit();let inp=$('assistantInput'),q=inp.value.trim();if(!q)return;",1)

anchor='async function askRakizaAssistantLegacy(){'
assert anchor in s

new_js=r'''let assistantAiHistory=[];
function assistantFormatAiText(v){return assistantEscText(v).replace(/\n/g,'<br>')}
async function assistantExportGenericExcel(args){
  if(typeof ExcelJS==='undefined')throw Error('محرك Excel غير متاح حاليًا');
  let cols=Array.isArray(args?.columns)?args.columns:[],rows=Array.isArray(args?.rows)?args.rows:[];
  if(!cols.length)throw Error('لم يتم تجهيز أعمدة التقرير');
  let wb=new ExcelJS.Workbook();wb.creator='Rakiza AI';wb.created=new Date();
  let sheet=String(args?.sheet_name||'Report').replace(/[\\/*?:\[\]]/g,' ').slice(0,31)||'Report',ws=wb.addWorksheet(sheet);
  ws.addRow(cols);
  for(let r of rows)ws.addRow(Array.isArray(r)?r.slice(0,cols.length):[]);
  ws.views=[{state:'frozen',ySplit:1}];
  ws.getRow(1).eachCell(c=>{c.font={name:'Arial',size:11,bold:true,color:{argb:'FFFFFFFF'}};c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF17365D'}};c.alignment={horizontal:'center',vertical:'middle'};c.border=excelBorder()});
  for(let i=1;i<=cols.length;i++){
    let max=Math.max(String(cols[i-1]||'').length,...rows.slice(0,200).map(r=>String((r||[])[i-1]??'').length));
    ws.getColumn(i).width=Math.min(42,Math.max(12,max+3));
  }
  for(let r=2;r<=ws.rowCount;r++)ws.getRow(r).eachCell({includeEmpty:true},c=>{c.font={name:'Arial',size:11};c.alignment={vertical:'middle'};c.border=excelBorder()});
  let buf=await wb.xlsx.writeBuffer(),blob=new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  let fn=String(args?.filename||'تقرير ركيزة.xlsx').trim();if(!fn.toLowerCase().endsWith('.xlsx'))fn+='.xlsx';
  a.href=url;a.download=fn;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
}
function assistantNavigate(view){
  const map={home:home,opening:openOpening,dayplan:openDayPlan,roster:openRoster,sales:openSales,current:openCurrent,history:openHistory,shortages:openShortages,actions:openActions,assistant:openAssistant};
  if(map[view])map[view]();
}
function assistantPrefillAction(args){
  openActions();
  setTimeout(()=>{
    if($('actType'))$('actType').value=args?.action_type||'أخرى';
    if($('actSubject'))$('actSubject').value=args?.subject||'';
    if($('actDesc'))$('actDesc').value=args?.description||'';
    if($('actDate'))$('actDate').value=args?.request_date||app.calendarDate||app.date||'';
  },50);
}
async function assistantRunAiActions(actions){
  for(const a of Array.isArray(actions)?actions:[]){
    try{
      if(a.type==='export_excel'){await assistantExportGenericExcel(a.args||{});assistantAdd('assistant','<div class="notice ok">تم إنشاء ملف Excel وتنزيله ✅</div>')}
      else if(a.type==='export_shortages_template'){await exportShortagesExcel()}
      else if(a.type==='create_roster_draft'){await assistantGenerateRosterAI(String(a.args?.instruction||''))}
      else if(a.type==='navigate'){assistantNavigate(a.args?.view)}
      else if(a.type==='prefill_action'){assistantPrefillAction(a.args||{});assistantAdd('assistant','<div class="notice ok">جهزت مسودة الإجراء. راجعها ثم احفظها إذا كانت مناسبة.</div>')}
    }catch(e){assistantAdd('assistant',`<div class="notice err">تعذر تنفيذ الطلب: ${assistantEscText(e.message||String(e))}</div>`)}
  }
}
async function askRakizaAssistant(){
  assistantInit();let inp=$('assistantInput'),q=inp.value.trim();if(!q)return;inp.value='';
  assistantAdd('user',assistantEscText(q));
  const previous=assistantAiHistory.slice(-12);assistantAiHistory.push({role:'user',content:q});
  assistantAdd('assistant','<span class="mut">أفكر وأراجع بيانات ركيزة…</span>');let thinking=$('assistantChat')?.lastElementChild;
  try{
    let r=await fetch('https://fvkzsmtadppclzexaktz.supabase.co/functions/v1/rakiza-ai-assistant?k='+TOKEN,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({message:q,history:previous})}),j={};
    try{j=await r.json()}catch(_){j={}}
    thinking?.remove();
    if(!r.ok){
      if(j.error==='AI_NOT_CONFIGURED'){
        assistantAdd('assistant','<div class="notice err"><b>الذكاء الاصطناعي جاهز داخل ركيزة لكنه غير مفعّل على الخادم بعد.</b><div style="margin-top:6px">يلزم إضافة مفتاح OpenAI API إلى أسرار Supabase مرة واحدة، وبعدها يعمل «اسأل ركيزة» بشكل كامل.</div></div>');return
      }
      throw Error(j.message||j.error||'تعذر تشغيل اسأل ركيزة')
    }
    let reply=String(j.reply||'').trim()||'تم.';assistantAiHistory.push({role:'assistant',content:reply});
    assistantAdd('assistant',assistantFormatAiText(reply));
    await assistantRunAiActions(j.actions||[]);
  }catch(e){thinking?.remove();assistantAdd('assistant',`<div class="notice err">${assistantEscText(e.message||String(e))}</div>`)}
}
'''
s=s.replace(anchor,new_js+anchor,1)

p.write_text(s,encoding='utf-8')
