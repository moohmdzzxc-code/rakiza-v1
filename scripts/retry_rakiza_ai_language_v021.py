from pathlib import Path
import runpy
runpy.run_path('scripts/upgrade_rakiza_ai_language_v021.py',run_name='__main__')
p=Path('rakiza-ai.js')
s=p.read_text(encoding='utf-8')
s=s.replace("imperativeArrange=/^(رتب|سوي|جهز|ابني|اعمل)\\b/.test(n);","imperativeArrange=/^(رتب|سوي|جهز|ابني|اعمل)(?:\\s|$)/.test(n);",1)
s=s.replace("(!questionLike&&/خطه\\s*(?:ال)?تواجد|تواجد\\s*(?:ال)?اسبوع|جدول\\s*(?:ال)?اسبوع/.test(n))","(!questionLike&&/(?:خطه|خطة|تواجد|دوام|شفت|جدول)/.test(n))",1)
p.write_text(s,encoding='utf-8')
