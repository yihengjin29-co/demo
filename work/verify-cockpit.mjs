import fs from 'node:fs';
const tabs=await (await fetch('http://127.0.0.1:9222/json')).json();
const ws=new WebSocket(tabs[0].webSocketDebuggerUrl); await new Promise(r=>ws.onopen=r);
let id=0; const pending=new Map(); ws.onmessage=e=>{const m=JSON.parse(e.data); if(m.id){pending.get(m.id)?.(m);pending.delete(m.id)}};
const send=(method,params={})=>new Promise(r=>{const n=++id;pending.set(n,r);ws.send(JSON.stringify({id:n,method,params}))});
const evaljs=async expression=>(await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true})).result?.result?.value;
await send('Emulation.setDeviceMetricsOverride',{width:1920,height:1080,deviceScaleFactor:1,mobile:false});
await send('Page.navigate',{url:'http://localhost:5173'}); await new Promise(r=>setTimeout(r,1000));
await evaljs("localStorage.setItem('demo-authenticated','true');localStorage.setItem('demo-role','集团');location.href='http://localhost:5173/dashboard'");
await new Promise(r=>setTimeout(r,600)); await send('Page.navigate',{url:'http://localhost:5173/dashboard'}); await new Promise(r=>setTimeout(r,1000));
console.log(await evaljs("JSON.stringify({url:location.href,title:document.querySelector('h1')?.innerText,screen:[innerWidth,innerHeight],body:[document.documentElement.scrollWidth,document.documentElement.scrollHeight],cards:document.querySelectorAll('.exec-summary').length,finance:document.querySelectorAll('.exec-finance').length,cells:document.querySelectorAll('.exec-heat-cell').length,panels:[...document.querySelectorAll('.exec-panel,.exec-finance-grid')].map(e=>({class:e.className,bottom:e.getBoundingClientRect().bottom,height:e.clientHeight,scroll:e.scrollHeight}))})"));
const shot=await send('Page.captureScreenshot',{format:'png'}); fs.writeFileSync('work/cockpit-1920.png',Buffer.from(shot.result.data,'base64'));
await evaljs("document.querySelector('.exec-heat-cell.red').click()");console.log('cell dialog',await evaljs("document.querySelector('[role=dialog]')?.getAttribute('aria-label')"));
await evaljs("document.querySelector('.v14-table tbody tr td:last-child button').click()");console.log('indicator dialog',await evaljs("document.querySelector('[role=dialog]')?.getAttribute('aria-label')"));
await send('Page.reload');await new Promise(r=>setTimeout(r,500));await evaljs("document.querySelector('.exec-event-item').click()");console.log('event dialog',await evaljs("document.querySelector('[role=dialog]')?.getAttribute('aria-label')"));
await send('Page.reload');await new Promise(r=>setTimeout(r,500));await evaljs("document.querySelector('.exec-org').click()");await new Promise(r=>setTimeout(r,500));console.log('institution',await evaljs("JSON.stringify({url:location.href,title:document.querySelector('h1')?.innerText})"));
await evaljs("localStorage.setItem('demo-role','金控公司');location.href='http://localhost:5173/dashboard'");await new Promise(r=>setTimeout(r,600));await send('Page.navigate',{url:'http://localhost:5173/dashboard'});await new Promise(r=>setTimeout(r,600));console.log('holding',await evaljs("JSON.stringify({title:document.querySelector('h1')?.innerText,cards:document.querySelectorAll('.exec-summary').length})"));
ws.close();


