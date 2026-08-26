const SHORT_EXPORT_API='https://fvkzsmtadppclzexaktz.supabase.co/functions/v1/rakiza-shortage-exported';

function loadExcelJs(){
  if(window.ExcelJS)return Promise.resolve();
  return new Promise((resolve,reject)=>{
    const existing=document.querySelector('script[data-rakiza-exceljs]');
    if(existing){existing.addEventListener('load',()=>resolve(),{once:true});existing.addEventListener('error',()=>reject(new Error('تعذر تحميل محرك Excel')),{once:true});return}
    const s=document.createElement('script');
    s.dataset.rakizaExceljs='1';
    s.src='https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js';
    s.onload=()=>resolve();
    s.onerror=()=>{
      const u=document.createElement('script');
      u.src='https://unpkg.com/exceljs@4.4.0/dist/exceljs.min.js';
      u.onload=()=>resolve();u.onerror=()=>reject(new Error('تعذر تحميل محرك Excel'));
      document.head.appendChild(u);
    };
    document.head.appendChild(s);
  });
}

const XLS_DARK='FF333F50',XLS_GOLD='FFFFD966',XLS_BLUE='FF2F5597',XLS_GRID='FFA6A6A6';
function xlsBorder(style='thin'){return {top:{style,color:{argb:XLS_GRID}},bottom:{style,color:{argb:XLS_GRID}},left:{style:'thin',color:{argb:XLS_GRID}},right:{style:'thin',color:{argb:XLS_GRID}}}}
function styleSheet(ws,widths,qtyCols=[]){
  ws.views=[{state:'frozen',ySplit:2}];
  ws.getRow(1).height=20;ws.getRow(2).height=22;
  ws.getRow(1).eachCell({includeEmpty:true},c=>{c.fill={type:'pattern',pattern:'solid',fgColor:{argb:XLS_DARK}};c.font={name:'Arial',size:11,color:{argb:'FFFFFFFF'}};c.alignment={horizontal:'center',vertical:'middle'};c.border=xlsBorder()});
  ws.getRow(2).eachCell({includeEmpty:true},c=>{c.fill={type:'pattern',pattern:'solid',fgColor:{argb:XLS_GOLD}};c.font={name:'Arial',size:11,bold:true,color:{argb:XLS_BLUE}};c.alignment={horizontal:'center',vertical:'middle'};c.border=xlsBorder()});
  ws.eachRow((row,n)=>{if(n<3)return;row.eachCell({includeEmpty:true},c=>{c.font={name:'Arial',size:11};c.alignment={vertical:'middle'};c.border=xlsBorder('dotted')})});
  widths.forEach((w,i)=>ws.getColumn(i+1).width=w);
  qtyCols.forEach(i=>ws.getColumn(i).numFmt='0');
}
function addRows(ws,rows){rows.forEach(r=>ws.addRow(r))}
function parseParts(s){return String(s||'').split('—').map(x=>x.trim()).filter(Boolean)}
function sizeGen(size){let m=String(size||'').match(/^(\d+)/),n=m?Number(m[1]):0;if(n&&n<=30)return'Child';if(n<=40&&n)return'Boys';if(n<=52&&n)return'Youth';return'Men'}
function openShortages(){return shortagesData.filter(x=>x.shortage_status==='مفتوح')}
function bySection(name){return openShortages().filter(x=>x.sections?.name===name)}
function q(x){return Number(x.requested_qty||0)}

function buildSummary(wb, totals){
  const ws=wb.addWorksheet('Summary');
  ws.addRow(['',Object.values(totals).reduce((a,b)=>a+b,0),'']);
  ws.addRow(['Category','Required Qty','Details']);
  const items=[['U.W','U.W'],['Classic','Classic'],['School','School'],['Business','Business'],['Fakher','Fakher'],['Zakhrafat','Zakhrafat'],['Rethobe','Rethobe'],['Summer','Summer'],['Winter','Winter'],['Egal , Hat','Egal , Hat'],['Shumagh , Ghutra','Shumagh , Ghutra'],['Nightrobe , Pigama','Nightrobe , Pigama'],['Acc, Socks','Acc, Socks']];
  items.forEach(([k,d])=>ws.addRow([k,totals[k]||0,d]));
  styleSheet(ws,[19,18,21],[2]);
}
function buildSimpleColorSheet(wb,name,section,subcategory){
  const ws=wb.addWorksheet(name);let rows=bySection(section),out=[];
  rows.forEach(x=>{let p=parseParts(x.size),size=p[0],color=p[1]||'';out.push([subcategory,'Men',size,color==='أبيض'?q(x):0,(color==='سكري'||color==='كريمي')?q(x):0])});
  ws.addRow(['','','',out.reduce((s,r)=>s+r[3],0),out.reduce((s,r)=>s+r[4],0)]);ws.addRow(['Sub-Category','Generation','Size','White','Cream']);addRows(ws,out);styleSheet(ws,[13,12,10,11,11],[4,5]);return rows.reduce((s,x)=>s+q(x),0)
}
function buildSchool(wb){const ws=wb.addWorksheet('School'),rows=bySection('الحركات'),out=[];rows.forEach(x=>{let p=parseParts(x.size);out.push(['School',p[1]||sizeGen(p[0]),p[0],q(x)])});ws.addRow(['','','',rows.reduce((s,x)=>s+q(x),0)]);ws.addRow(['Sub-Category','Generation','Size','White']);addRows(ws,out);styleSheet(ws,[13,12,10,11],[4]);return rows.reduce((s,x)=>s+q(x),0)}
function buildClassic(wb){const ws=wb.addWorksheet('Classic'),rows=bySection('الكلاسيك'),out=[];rows.forEach(x=>{let p=parseParts(x.size),size=p[0],type=p[1]||'',color=p[2]||'';out.push(['Classic',type,sizeGen(size),size,color==='أبيض'?q(x):0,color==='كريمي'?q(x):0])});ws.addRow(['','','','',out.reduce((s,r)=>s+r[4],0),out.reduce((s,r)=>s+r[5],0)]);ws.addRow(['Sub-Category','Type','Generation','Size','White','Cream']);addRows(ws,out);styleSheet(ws,[13,11,12,10,11,11],[5,6]);return rows.reduce((s,x)=>s+q(x),0)}
function buildVariable(wb,sheet,section,label,kind){const ws=wb.addWorksheet(sheet),rows=bySection(section),out=[];rows.forEach(x=>{let p=parseParts(x.size),size=p[0],v=(p[1]||'').replace(/^موديل\s*/,'');out.push([label,sizeGen(size),size,v,q(x),'',0,'',0])});ws.addRow(['','','','',out.reduce((s,r)=>s+r[4],0),'',0,'',0]);ws.addRow(['Sub-Category','Generation','Size',kind+' 1','Qty 1',kind+' 2','Qty 2',kind+' 3','Qty 3']);addRows(ws,out);styleSheet(ws,[13,12,10,15,9,15,9,15,9],[5,7,9]);return rows.reduce((s,x)=>s+q(x),0)}
function buildShumagh(wb){const ws=wb.addWorksheet('Shumagh , Ghutra'),rows=bySection('الأشمغة'),out=[];rows.forEach(x=>{let p=parseParts(x.size);out.push([p[1]==='غترة'?'Ghutra':'Shumagh',p[0],p[1]==='غترة'?'White':(p[2]==='أحمر'?'Red':'White'),p[3]||'',p[4]||'',q(x)])});ws.addRow(['','','','','',rows.reduce((s,x)=>s+q(x),0)]);ws.addRow(['Item Type','Size','Color','Type / النوع','Material / الخامة','Required Qty']);addRows(ws,out);styleSheet(ws,[14,10,11,18,18,13],[6]);return rows.reduce((s,x)=>s+q(x),0)}
function buildEgal(wb){const ws=wb.addWorksheet('Egal , Hat'),rows=bySection('العقال والطاقية'),out=[];rows.forEach(x=>{let p=parseParts(x.size);if(p[0]==='طاقية')out.push(['Hat','All',p.slice(1).join(' — '),'F.S',q(x)]);else out.push(['Egal',p[1]==='رجالي'?'Men':'Boys',p[0]+' '+p[1],p[2]||'',q(x)])});ws.addRow(['','','','',rows.reduce((s,x)=>s+q(x),0)]);ws.addRow(['Item Type','Generation','Dec','Size','Required Qty']);addRows(ws,out);styleSheet(ws,[12,12,22,12,13],[5]);return rows.reduce((s,x)=>s+q(x),0)}
function buildNight(wb){const ws=wb.addWorksheet('Nightrobe , Pigama'),rows=bySection('الجلابيات والبيجامات'),out=[];rows.forEach(x=>{let p=parseParts(x.size),t=p[0]||'',sz=p[1]||'',mat=(p[2]||'').replace(/^خامة\s*/,'');let item=t.startsWith('جلابية')?'Nightrobe':'Pigama',gen=t.includes('ولادي')?'Boys':t.includes('شبابي')?'Youth':'Men';out.push([item,gen,t,t,sz,mat,q(x)])});ws.addRow(['','','','','','',rows.reduce((s,x)=>s+q(x),0)]);ws.addRow(['Item Type','Generation','Primary Style','Dec','Size','Material No.','Required Qty']);addRows(ws,out);styleSheet(ws,[15,12,25,27,11,14,13],[7]);return rows.reduce((s,x)=>s+q(x),0)}
function buildAcc(wb){const ws=wb.addWorksheet('Acc, Socks'),rows=bySection('الإكسسوارات والجوارب'),out=[];rows.forEach(x=>{let p=parseParts(x.size);out.push([p[0]||'',p.slice(1).join(' — '),q(x)])});ws.addRow(['','',rows.reduce((s,x)=>s+q(x),0)]);ws.addRow(['Category','Item Type / نوع الصنف','Required Qty']);addRows(ws,out);styleSheet(ws,[14,28,13],[3]);return rows.reduce((s,x)=>s+q(x),0)}
function buildUW(wb){const ws=wb.addWorksheet('U.W'),rows=bySection('الداخليات'),out=[];rows.forEach(x=>{let p=parseParts(x.size),genAr=p[0],style=p[1],prod=p[2],size=p[3],gen=genAr==='رجالي'?'Men':genAr==='شبابي'?'Youth':'Boys';out.push([prod,gen,size,style==='ستاندر'?q(x):0,style==='فرزاتشي'?q(x):0])});ws.addRow(['','','',out.reduce((s,r)=>s+r[3],0),out.reduce((s,r)=>s+r[4],0)]);ws.addRow([' Primary Style','Generation','Size','Standard','Versace / فرزاتشي']);addRows(ws,out);styleSheet(ws,[23,12,11,11,19],[4,5]);return rows.reduce((s,x)=>s+q(x),0)}

async function exportShortagesExcel(){
  try{
    const rows=openShortages();
    if(!rows.length)throw new Error('لا توجد نواقص مفتوحة لتصديرها');
    const btn=$('shortExportBtn');if(btn){btn.disabled=true;btn.textContent='جاري تجهيز Excel...'}
    await loadExcelJs();
    const wb=new ExcelJS.Workbook();wb.creator='Rakiza';wb.created=new Date();
    const totals={};
    totals['U.W']=buildUW(wb);totals['Classic']=buildClassic(wb);totals['School']=buildSchool(wb);totals['Business']=buildSimpleColorSheet(wb,'Business','الأعمال','Business');totals['Fakher']=buildSimpleColorSheet(wb,'Fakher','الفاخر','Fakher');
    totals['Zakhrafat']=buildVariable(wb,'Zakhrafat','الزخرفات','Zakhrafat','Model No.');totals['Rethobe']=buildVariable(wb,'Rethobe','ري ثوب','Rethobe','Model No.');totals['Summer']=buildVariable(wb,'Summer','الصيفي','Summer','Color');totals['Winter']=buildVariable(wb,'Winter','الشتوي','Winter','Model No.');
    totals['Egal , Hat']=buildEgal(wb);totals['Shumagh , Ghutra']=buildShumagh(wb);totals['Nightrobe , Pigama']=buildNight(wb);totals['Acc, Socks']=buildAcc(wb);
    buildSummary(wb,totals);
    const sum=wb.getWorksheet('Summary');wb._worksheets.splice(wb._worksheets.indexOf(sum),1);wb._worksheets.splice(1,0,sum);
    const buffer=await wb.xlsx.writeBuffer();
    const blob=new Blob([buffer],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    const d=app.calendarDate||app.date||new Date().toISOString().slice(0,10);a.href=url;a.download=`نواقص معرض شهار - ${d}.xlsx`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
    const r=await fetch(SHORT_EXPORT_API+'?k='+encodeURIComponent(TOKEN),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({ids:rows.map(x=>x.id)})}),j=await r.json();
    if(!r.ok)throw new Error(j.error||'تم إنشاء الملف لكن تعذر تسجيل التصدير داخل ركيزة');
    shortagesData=await api('shortages');renderShortages();
    alert('تم تنزيل ملف Excel. أصبح زر «تم الطلب» متاحًا للنواقص التي دخلت في الملف.');
  }catch(e){alert(e.message)}finally{let btn=$('shortExportBtn');if(btn){btn.disabled=false;btn.textContent='تصدير Excel للنواقص المفتوحة'}}
}
