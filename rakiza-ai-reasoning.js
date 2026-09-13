(()=>{
'use strict';

/*
 * Browser entrypoint for Rakiza AI reasoning.
 * The original shared reasoning implementation is preserved verbatim in
 * rakiza-ai-reasoning-core.js. Store Intelligence is loaded after it, then
 * the Daily Smart Brief becomes the outer conversational layer for concise
 * manager summaries while all single-domain questions still fall through to
 * the existing specialist chain.
 */

if(typeof module!=='undefined'&&module.exports){
  require('./rakiza-ai-reasoning-core.js');
  return;
}

function loadScript(src,onload){
  const s=document.createElement('script');
  s.src=src;
  s.async=false;
  s.onload=onload||null;
  s.onerror=()=>console.error('Rakiza AI failed to load:',src);
  document.body.appendChild(s);
}

loadScript('rakiza-ai-reasoning-core.js',()=>{
  loadScript('rakiza-ai-store-intelligence.js',()=>{
    loadScript('rakiza-ai-store-reasoning-bridge.js',()=>{
      loadScript('rakiza-ai-daily-brief.js',()=>{
        loadScript('rakiza-ai-daily-brief-reasoning-bridge.js');
      });
    });
  });
});
})();
