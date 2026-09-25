(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.RakizaWeeklyPerformanceCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const number=v=>{const n=Number(v);return Number.isFinite(n)?n:null};
  function storeMetrics(sales,transactions,units){
    const s=number(sales),t=number(transactions),u=number(units);
    return {
      atv:s!==null&&t>0?s/t:null,
      upt:u!==null&&t>0?u/t:null
    };
  }
  function employeeMetrics(sales,invoices,units,storeSales){
    const s=number(sales),i=number(invoices),u=number(units),ss=number(storeSales);
    return {
      atv:s!==null&&i>0?s/i:null,
      upt:u!==null&&i>0?u/i:null,
      contribution:s!==null&&ss>0?s/ss*100:null
    };
  }
  function salesSummary(target,sales,complete=true){
    const t=number(target),s=number(sales);
    return {
      achievement:complete&&t>0&&s!==null?s/t*100:null,
      gap:complete&&t!==null&&s!==null?s-t:null
    };
  }
  function star(employees){
    const rows=(employees||[]).map(x=>({id:x.id,name:x.name,sales:number(x.sales)})).filter(x=>x.sales!==null&&x.sales>0).sort((a,b)=>b.sales-a.sales);
    if(!rows.length)return null;
    const top=rows[0].sales,ties=rows.filter(x=>x.sales===top);
    return {sales:top,tie:ties.length>1,employees:ties};
  }
  function taskSummary(rows){
    const r=rows||[],assigned=r.length,completed=r.filter(x=>x.status==='مكتملة').length;
    return {assigned,completed,pending:assigned-completed,completion:assigned?completed/assigned*100:null};
  }
  return {storeMetrics,employeeMetrics,salesSummary,star,taskSummary};
});