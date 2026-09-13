(()=>{
'use strict';

/*
 * Browser entrypoint for Rakiza AI reasoning.
 * Production integration: Rakiza AI Conversation Intelligence v1.0.0.
 * The original shared reasoning implementation is preserved verbatim in
 * rakiza-ai-reasoning-core.js. Store Intelligence is loaded after it, then
 * the store reasoning bridge, and finally the central conversation layer.
 * This makes conversation understanding the outer language layer while all
 * approved specialist logic remains underneath it.
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
      loadScript('rakiza-ai-conversation.js');
    });
  });
});
})();
