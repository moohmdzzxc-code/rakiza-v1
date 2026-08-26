from pathlib import Path
p=Path('shortage-export.js')
s=p.read_text(encoding='utf-8')
s=s.replace("const ws=wb.addWorksheet('Summary');","const ws=wb.getWorksheet('Summary')||wb.addWorksheet('Summary');",1)
s=s.replace("const wb=new ExcelJS.Workbook();wb.creator='Rakiza';wb.created=new Date();\n    const totals={};","const wb=new ExcelJS.Workbook();wb.creator='Rakiza';wb.created=new Date();wb.addWorksheet('Summary');\n    const totals={};",1)
s=s.replace("    buildSummary(wb,totals);\n    const sum=wb.getWorksheet('Summary');wb._worksheets.splice(wb._worksheets.indexOf(sum),1);wb._worksheets.splice(1,0,sum);","    buildSummary(wb,totals);",1)
p.write_text(s,encoding='utf-8')
