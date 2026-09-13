(()=>{
'use strict';

/*
 * Browser entrypoint for Rakiza AI reasoning.
 * The original shared reasoning implementation is preserved verbatim in
 * rakiza-ai-reasoning-core.js. Store Intelligence is intentionally loaded
 * after it so the store-level assistant becomes the outer conversational
 * layer while single-domain questions still fall through to the existing
 * specialist chain.
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
    loadScript('rakiza-ai-store-reasoning-bridge.js');
  });
});
})();
