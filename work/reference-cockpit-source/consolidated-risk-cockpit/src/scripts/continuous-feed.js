// The same ordered DOM moves continuously; the second batch makes the loop seamless.
const marqueePlayers=new Map();
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const feedSpeed=14;
function marqueeMarkup(kind,html){return `<div class="stream-feed continuous-viewport" id="${kind==='news'?'newsRows':'eventRows'}" aria-label="${kind==='news'?'舆情':'重大事件'}连续滚动列表"><div class="stream-track"><div class="stream-batch">${html}</div></div></div>`}
function captureFeedPositions(){for(const [kind,player] of marqueePlayers){feedState[kind].phase=player.period===state.period?((Number(player.animation.currentTime)||0)%player.duration)/player.duration:0}}
function syncAllFeeds(){for(const [kind,player] of marqueePlayers){const pause=feedState[kind].paused||reducedMotion.matches||document.hidden||dialogStack.length>0||player.root.matches(':hover')||player.root.contains(document.activeElement);if(pause)player.animation.pause();else player.animation.play()}}
function mountFeeds(){
 for(const player of marqueePlayers.values())player.animation.cancel();
 marqueePlayers.clear();
 for(const kind of ['news','events']){
  const root=$(kind==='news'?'#sentimentFeed':'#eventFeed'),viewport=$('.continuous-viewport',root),track=$('.stream-track',root),batch=$('.stream-batch',track);
  const rows=$$('.stream-row',batch);if(!rows.length)continue;
  const rowHeight=viewport.clientHeight/2;
  track.style.setProperty('--stream-row-height',rowHeight+'px');
  let copy=$('.stream-batch-copy',track);
  if(!copy){copy=batch.cloneNode(true);copy.classList.add('stream-batch-copy');copy.setAttribute('aria-hidden','true');$$('button',copy).forEach(button=>button.tabIndex=-1);track.append(copy)}
  const distance=parseFloat(getComputedStyle(batch).height),duration=distance/feedSpeed*1000;
  const animation=track.animate([{transform:'translateY(0px)'},{transform:`translateY(-${distance}px)`}],{duration,iterations:Infinity,easing:'linear'});
  animation.pause();animation.currentTime=duration*feedState[kind].phase;
  marqueePlayers.set(kind,{root,viewport,track,batch,copy,animation,duration,distance,rowHeight,period:state.period});
  if(!root.dataset.marqueeBound){
   root.dataset.marqueeBound='true';
   root.addEventListener('mouseenter',syncAllFeeds);root.addEventListener('mouseleave',syncAllFeeds);
   root.addEventListener('focusin',ev=>{
    const p=marqueePlayers.get(kind),button=ev.target.closest('.stream-row');
    if(button&&!button.closest('.stream-batch-copy')){
     const r=button.getBoundingClientRect(),v=p.viewport.getBoundingClientRect();
     if(r.top<v.top||r.bottom>v.bottom){const index=$$('.stream-row',p.batch).indexOf(button);p.animation.currentTime=index*p.rowHeight/feedSpeed*1000;p.viewport.scrollTop=0}
    }
    syncAllFeeds();
   });
   root.addEventListener('focusout',()=>queueMicrotask(syncAllFeeds));
   root.addEventListener('mousedown',ev=>{if(ev.target.closest('.stream-batch-copy'))ev.preventDefault()});
  }
 }
 syncAllFeeds();
}
function advanceFeed(kind,step=1){const p=marqueePlayers.get(kind);if(!p)return;const time=Number(p.animation.currentTime)||0;p.animation.currentTime=(time+step*p.rowHeight/feedSpeed*1000+p.duration)%p.duration;feedState[kind].phase=p.animation.currentTime/p.duration;syncAllFeeds()}
document.addEventListener('visibilitychange',syncAllFeeds);
reducedMotion.addEventListener('change',syncAllFeeds);
