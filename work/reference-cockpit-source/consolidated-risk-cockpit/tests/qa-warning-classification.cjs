const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const source=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
const listeners={},elements={};
const context=vm.createContext({console,structuredClone,localStorage:{getItem:()=>null,setItem:()=>{}},document:{addEventListener:(type,fn)=>(listeners[type]??=[]).push(fn),querySelector:selector=>elements[selector]||null,querySelectorAll:()=>[],hidden:false},window:{addEventListener:()=>{}},matchMedia:()=>({matches:true,addEventListener:()=>{}}),history:{replaceState:()=>{},pushState:()=>{}},location:{pathname:'/cockpit.html',search:''},setTimeout:()=>{},clearTimeout:()=>{},queueMicrotask:fn=>fn()});
new vm.Script(source.slice(0,source.indexOf('function clock()'))).runInContext(context);
const run=expression=>vm.runInContext(expression,context);
const data=expression=>JSON.parse(run(`JSON.stringify(${expression})`));
const columns=['机构','监测类型','指标类型','指标名称','预警日期','当前状态','处置状态','操作'];
let body=run("warningListDetail({severity:'yellow'}).body"),last=-1;
for(const label of columns){const index=body.indexOf(`<th scope="col">${label}</th>`);assert(index>last,`Missing or misplaced column: ${label}`);last=index}
assert.deepEqual(data('warningTableColumns'),columns);
const initial=data("snapshot('2026-08')");assert.equal(initial.yellow,11);assert.equal(initial.red,4);
const categories=['信用风险','市场风险','操作风险','流动性风险','声誉风险','集中度风险','战略风险','其他风险'];
assert.deepEqual(data('warningIndicatorTypes.map(x=>x[1])'),categories);
assert.deepEqual(data('warningMonitoringTypes.map(x=>x[1])'),['经营','资本','风险']);
for(const cat of ['compliance','it','unknown'])assert.equal(data(`classifyWarningIndicator({cat:'${cat}'}).indicatorLabel`),'其他风险');
assert.deepEqual(data("[classifyWarningIndicator({cat:'adequacy'}),classifyWarningIndicator({cat:'efficiency'})].map(x=>[x.monitoringLabel,x.indicatorLabel])"),[['资本','—'],['经营','—']]);
for(const period of ['2026-06','2026-07','2026-08']){
 run(`state.period='${period}'`);
 for(const severity of ['yellow','red']){
  const result=data(`warningListItems({severity:'${severity}'})`),count=data(`snapshot('${period}')['${severity}']`);
  assert.equal(result.length,count);assert.equal(new Set(result.map(x=>x.id)).size,count);
  assert(result.every(w=>w.severity===severity&&categories.includes(w.classification.indicatorLabel)));
  const order=result.map(w=>[data('orgOrder').indexOf(w.ind.org),['经营','资本','风险'].indexOf(w.classification.monitoringLabel),categories.indexOf(w.classification.indicatorLabel)]);
  for(let i=1;i<order.length;i++){let cmp=0;for(let j=0;j<3;j++){cmp=order[i][j]-order[i-1][j];if(cmp)break}assert(cmp>=0,JSON.stringify(order))}
  const markup=run(`warningListDetail({severity:'${severity}'}).body`);
  assert.equal(markup.split('data-warning-row=').length-1,count);
  for(const w of result){assert(markup.includes(`data-warning="${w.id}"`));assert(markup.includes(w.triggered));assert(markup.includes(w.ind.name))}
 }
}
run("state.period='2026-08'");
assert.equal(data("warningListItems({severity:'yellow',org:'amc'}).length"),4);
assert.equal(data("warningListItems({severity:'yellow',org:'amc',monitoring:'risk',indicatorType:'concentration'}).length"),1);
assert.equal(data("warningListItems({severity:'red',indicatorType:'market'}).length"),2);
assert.equal(data("warningListItems({severity:'yellow',monitoring:'capital'}).length"),0);
assert(run("warningListDetail({severity:'yellow',monitoring:'capital'}).body").includes('暂无符合分类条件的预警指标'));
const recovered=data("warningListItems({severity:'yellow'}).find(w=>w.recovered)");
assert.equal(recovered.ind.id,'a-debt');assert.equal(data("evaluate(getInd('a-debt'))"),'green');
assert(run("warningListResults({severity:'yellow',org:'amc'})").includes('已恢复'));
assert(run(`warningDetail({id:'${recovered.id}'}).body`).includes('核验后办结'));
run("dialogStack=[{type:'warningList',args:{severity:'yellow',indicatorType:'concentration'}}]");
for(const id of ['#warningResults','#warningIndicatorType','#warningOrg','#warningMonitoring'])elements[id]={innerHTML:'',value:'all',disabled:false,options:[{textContent:''}]};
for(const fn of listeners.change)fn({target:{id:'warningMonitoring',value:'capital',dataset:{}}});
assert.equal(data('dialogStack[0].args.monitoring'),'capital');assert.equal(data('dialogStack[0].args.indicatorType'),'all');assert(elements['#warningIndicatorType'].disabled);
assert(elements['#warningResults'].innerHTML.includes('暂无符合分类条件'));
for(const fn of listeners.change)fn({target:{id:'warningMonitoring',value:'risk',dataset:{}}});assert(!elements['#warningIndicatorType'].disabled);
for(const fn of listeners.change)fn({target:{id:'warningOrg',value:'amc',dataset:{}}});
for(const fn of listeners.change)fn({target:{id:'warningIndicatorType',value:'concentration',dataset:{}}});
assert.equal(elements['#warningResults'].innerHTML.split('data-warning-row=').length-1,1);
assert.deepEqual(data("snapshot('2026-08')"),initial);
assert.equal(data("getInd('a-client').metricType"),'control');
assert.equal(data("getInd('a-client').cat"),'concentration');
const report={result:'PASS',method:'Node VM: actual built page script, generated markup and change handlers; no live browser rendering',columns,checks:['8 columns in requested order','3 monitoring types, 8 risk types in requested order','institution/category grouping and filters','red/yellow counts unchanged in 3 periods','recovered status remains normal with pending review','filters update via existing change events','warning/detail links retained','capital/operation not mislabeled as risk','existing monitor/control metadata unchanged'],snapshot:initial};
fs.writeFileSync(path.join(__dirname,'qa-warning-classification.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
