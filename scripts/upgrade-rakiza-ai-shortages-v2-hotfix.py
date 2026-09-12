from pathlib import Path
p=Path('rakiza-ai-shortages.js')
s=p.read_text(encoding='utf-8')
old="const exportCommand=/(?:^| )(?:صدر|تصدير) (?:لي|لنا|النواقص|النتيجه)|^(?:صدرها|صدرهم)(?: لي)?$|(?:سوي|جهز|طلع|اعمل|انشي).*اكسل|(?:ابي|ابغي|ابغا|اريد).*اكسل/.test(n);"
new="const exportCommand=/(?:^| )(?:صدر|تصدير) (?:لي|لنا|النواقص|النتيجه)|(?:^| )(?:صدرها|صدرهم)(?: لي)?(?:$| )|(?:سوي|جهز|طلع|اعمل|انشي).*اكسل|(?:ابي|ابغي|ابغا|اريد).*اكسل/.test(n);"
if old not in s: raise SystemExit('export command patch target missing')
p.write_text(s.replace(old,new,1),encoding='utf-8')
