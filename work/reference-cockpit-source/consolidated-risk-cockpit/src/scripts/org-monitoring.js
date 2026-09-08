function orgRiskSummary(org){
 const xs=indicators.filter(i=>i.org===org),monthlyIds=new Set(warningList().filter(w=>w.ind.org===org).map(w=>w.ind.id));
 const groups=[{monitoring:'capital',category:'all',name:'资本指标'},...warningIndicatorTypes.map(([category,name])=>({monitoring:'risk',category,name}))];
 return groups.map(group=>{
  const items=xs.filter(i=>{const c=classifyWarningIndicator(i);return c.monitoring===group.monitoring&&(group.category==='all'||c.indicatorType===group.category)});
  const row={...group,total:items.length,monthly:items.filter(i=>monthlyIds.has(i.id)).length,red:0,yellow:0,green:0,no_data:0,overdue:0,none:0};
  items.forEach(i=>row[evaluate(i)]++);return row;
 });
}
function orgSummaryHTML(org){
 const rows=orgRiskSummary(org),counter=(row,key,tone='')=>`<button class="summary-count ${tone}" data-org-summary="${row.monitoring}:${row.category}:${key}" aria-label="查看${row.name}${({all:'全部',monthly:'本月曾预警',yellow:'当前黄灯',red:'当前红灯',green:'当前正常',quality:'缺数或超期'})[key]}指标">${key==='all'?row.total:key==='quality'?row.no_data+row.overdue+row.none:row[key]}</button>`;
 const totals=['capital','risk'].map(type=>{const xs=rows.filter(r=>r.monitoring===type),sum=key=>xs.reduce((n,r)=>n+r[key],0);return `<div><span>${type==='capital'?'资本':'风险'}指标</span><strong>${sum('total')}<small>项</small></strong><span>本月曾预警 <b>${sum('monthly')}</b> 项</span><span class="yellow">黄 ${sum('yellow')}</span><span class="red">红 ${sum('red')}</span><span class="green">正常 ${sum('green')}</span></div>`}).join('');
 return `<section class="org-summary" aria-label="本月资本与风险指标概览"><h3 class="section-label">本月资本与风险指标概览</h3><div class="org-summary-totals">${totals}</div><div class="table-scroll"><table class="data-table org-summary-table"><thead><tr><th scope="col">监测类型</th><th scope="col">指标类型</th><th scope="col">指标总数</th><th scope="col">本月曾预警</th><th scope="col" class="yellow">当前黄灯</th><th scope="col" class="red">当前红灯</th><th scope="col" class="green">当前正常</th><th scope="col">缺数 / 超期</th></tr></thead><tbody>${rows.map(r=>`<tr data-org-summary-row="${r.monitoring}:${r.category}"><td>${r.monitoring==='capital'?'资本':'风险'}</td><td>${r.name}${r.total?'':'<small class="muted"> · 未配置</small>'}</td><td>${counter(r,'all')}</td><td>${counter(r,'monthly','cyan')}</td><td>${counter(r,'yellow','yellow')}</td><td>${counter(r,'red','red')}</td><td>${counter(r,'green','green')}</td><td>${counter(r,'quality','muted')}</td></tr>`).join('')}</tbody></table></div><p class="summary-footnote">按指标去重。本月曾预警包含已恢复指标；灯色为当前状态，缺数、超期不计为正常。点击数字筛选下方明细。合规、信息科技归入其他风险；经营指标保留在下方清单。</p></section>`;
}
function orgItems(type,args){
 const query=(args.query||'').toLowerCase(),warned=new Set(warningList().map(w=>w.ind.id));
 return indicators.filter(i=>{
  const c=classifyWarningIndicator(i),status=evaluate(i);
  return i.org===args.org&&(type!=='cell'||i.cat===args.cat)&&(type!=='cell'||args.showAll||['red','yellow'].includes(status))
   &&(!args.monitoring||args.monitoring==='all'||c.monitoring===args.monitoring)
   &&(!args.category||args.category==='all'||(type==='cell'?i.cat===args.category:c.indicatorType===args.category))
   &&(!args.status||args.status==='all'||(args.status==='quality'?['no_data','overdue','none'].includes(status):status===args.status))
   &&(!args.periodWarnings||warned.has(i.id))&&i.name.toLowerCase().includes(query);
 }).sort((a,b)=>{
  if(args.sort==='name')return a.name.localeCompare(b.name,'zh-CN');
  const ca=classifyWarningIndicator(a),cb=classifyWarningIndicator(b),types=['capital','risk','operation'];
  return types.indexOf(ca.monitoring)-types.indexOf(cb.monitoring)||warningIndicatorTypes.findIndex(c=>c[0]===ca.indicatorType)-warningIndicatorTypes.findIndex(c=>c[0]===cb.indicatorType)||['red','yellow','no_data','overdue','green'].indexOf(evaluate(a))-['red','yellow','no_data','overdue','green'].indexOf(evaluate(b));
 });
}
function orgThreshold(i,color){const boundary=i[color];if(boundary===null||boundary===undefined)return '未配置';return i.direction==='range'?`＜ ${boundary[0]} 或 ＞ ${boundary[1]}${i.unit}`:`${i.direction==='low'?'≤':'≥'} ${boundary}${i.unit}`}
function tableForOrg(xs){
 const warnings=warningList();
 return `<div class="table-scroll"><table class="data-table org-indicator-table"><thead><tr><th scope="col">监测类型</th><th scope="col">指标类型</th><th scope="col"><button class="bare" data-org-sort>指标名称 ↕</button></th><th scope="col">当月值</th><th scope="col">黄灯阈值</th><th scope="col">红灯阈值</th><th scope="col">当前状态</th><th scope="col">处置状态</th><th scope="col">操作</th></tr></thead><tbody>${xs.map(i=>{const c=classifyWarningIndicator(i),w=warnings.filter(w=>w.ind.id===i.id).sort((a,b)=>b.triggered.localeCompare(a.triggered))[0];return `<tr data-org-indicator="${i.id}"><td>${c.monitoringLabel}</td><td>${c.indicatorLabel}</td><td>${i.name}</td><td class="mono">${val(i)} ${i.unit}</td><td class="yellow" data-threshold="yellow">${orgThreshold(i,'yellow')}</td><td class="red" data-threshold="red">${orgThreshold(i,'red')}</td><td>${badge(evaluate(i))}${w?.recovered?'<small class="warning-recovered">本月预警后恢复</small>':''}</td><td>${w?warningDisposition(w):['red','yellow'].includes(evaluate(i))?'待核对处置记录':'—'}</td><td><div class="org-row-actions"><button class="bare cyan" data-indicator="${i.id}">指标详情 ↗</button>${w?`<button class="bare cyan" data-warning="${w.id}">查看处置 ↗</button>`:''}</div></td></tr>`}).join('')}</tbody></table></div>`;
}
function orgResults(type,args){
 const xs=orgItems(type,args),pages=Math.max(1,Math.ceil(xs.length/20));args.page=Math.max(0,Math.min(args.page||0,pages-1));
 return `${xs.length?tableForOrg(xs.slice(args.page*20,args.page*20+20)):'<div class="empty">暂无符合条件的指标。可调整监测类型、指标类型、当前状态或预警范围。</div>'}<div class="dialog-pagination"><span>共 ${xs.length} 项${args.periodWarnings?' · 本月曾预警指标':''}${type==='cell'&&!args.showAll?' · 当前红黄灯':''}</span><div class="pager"><button data-org-page="-1" ${args.page===0?'disabled':''} aria-label="上一页机构指标">‹</button><span>${args.page+1} / ${pages}</span><button data-org-page="1" ${args.page===pages-1?'disabled':''} aria-label="下一页机构指标">›</button></div></div>`;
}
function orgDetail(type,args){
 const cell=type==='cell',title=ORGS[args.org].name+' · '+(cell?catName(args.cat)+'风险 · '+(args.showAll?'全部指标':'已预警指标'):'资本与风险监测'),options=(list,value)=>list.map(([id,label])=>`<option value="${id}" ${id===value?'selected':''}>${label}</option>`).join('');
 return {title,crumb:ORGS[args.org].name+' / '+(cell?catName(args.cat)+'风险':'资本与风险监测'),body:`<p class="dialog-summary">${ORGS[args.org].type} · 数据所属月 ${state.period} · 截至 ${END()}</p>${cell?'':orgSummaryHTML(args.org)}<section id="orgIndicatorSection" tabindex="-1"><h3 class="section-label">${cell?'指标预警明细':'分类指标明细'}</h3><div class="dialog-toolbar org-detail-filters"><input id="orgSearch" placeholder="搜索指标名称" aria-label="搜索机构指标" value="${esc(args.query||'')}">${cell?`<button class="btn" data-cell-toggle>${args.showAll?'只看已预警指标':'查看该类别全部指标'}</button>`:`<select id="orgMonitoring" aria-label="筛选监测类型"><option value="all">全部监测类型</option>${options([['capital','资本'],['risk','风险'],['operation','经营']],args.monitoring)}</select><select id="orgCategory" aria-label="筛选指标类型"><option value="all">全部指标类型</option>${options(warningIndicatorTypes,args.category)}</select><select id="orgStatus" aria-label="筛选当前状态"><option value="all">全部当前状态</option>${options([['yellow','黄灯'],['red','红灯'],['green','正常'],['no_data','缺数'],['overdue','超期'],['quality','缺数 / 超期']],args.status)}</select><select id="orgWarningScope" aria-label="筛选预警范围"><option value="all">全部指标</option><option value="monthly" ${args.periodWarnings?'selected':''}>本月曾预警指标</option></select>`}</div><div id="orgResults">${orgResults(type,args)}</div></section>${cell?'<div class="case-note">默认只列示该机构、该类别当前红黄灯指标；切换到全部指标可查看正常、缺数和超期情况。</div>':''}`};
}
function selectOrgSummary(value){
 const [monitoring,category,status]=value.split(':'),args=dialogStack.at(-1).args;
 Object.assign(args,{monitoring,category,status:['all','monthly'].includes(status)?'all':status,periodWarnings:status==='monthly',query:'',page:0});
 for(const [id,v] of Object.entries({orgMonitoring:monitoring,orgCategory:category,orgStatus:args.status,orgWarningScope:args.periodWarnings?'monthly':'all',orgSearch:''}))if($('#'+id))$('#'+id).value=v;
 refreshOrgResults();$('#orgIndicatorSection')?.scrollIntoView({block:'start',behavior:'instant'});$('#orgIndicatorSection')?.focus({preventScroll:true});
}
