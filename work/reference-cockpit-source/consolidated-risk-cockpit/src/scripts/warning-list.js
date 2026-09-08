const warningTableColumns=['机构','监测类型','指标类型','指标名称','预警日期','当前状态','处置状态','操作'];
const warningMonitoringTypes=[['operation','经营'],['capital','资本'],['risk','风险']];
const warningIndicatorTypes=[['credit','信用风险'],['market','市场风险'],['operational','操作风险'],['liquidity','流动性风险'],['reputation','声誉风险'],['concentration','集中度风险'],['strategic','战略风险'],['other','其他风险']];
// Popup classification is separate from the monitor/control attribute and heatmap taxonomy.
function classifyWarningIndicator(i){
 const monitoring=i.cat==='efficiency'?'operation':i.cat==='adequacy'?'capital':'risk';
 const indicatorType=monitoring!=='risk'?'not_applicable':warningIndicatorTypes.some(([id])=>id===i.cat)?i.cat:'other';
 return {monitoring,monitoringLabel:warningMonitoringTypes.find(([id])=>id===monitoring)[1],indicatorType,indicatorLabel:warningIndicatorTypes.find(([id])=>id===indicatorType)?.[1]||'—'};
}
function warningListItems(args){
 const orgs=['group',...orgOrder],rank=(list,key)=>{const n=list.indexOf(key);return n<0?list.length:n};
 return warningList().filter(w=>w.severity===args.severity).map(w=>({...w,classification:classifyWarningIndicator(w.ind)}))
  .filter(w=>(!args.org||args.org==='all'||w.ind.org===args.org)&&(!args.monitoring||args.monitoring==='all'||w.classification.monitoring===args.monitoring)&&(!args.indicatorType||args.indicatorType==='all'||w.classification.indicatorType===args.indicatorType))
  .sort((a,b)=>rank(orgs,a.ind.org)-rank(orgs,b.ind.org)||rank(warningMonitoringTypes.map(x=>x[0]),a.classification.monitoring)-rank(warningMonitoringTypes.map(x=>x[0]),b.classification.monitoring)||rank(warningIndicatorTypes.map(x=>x[0]),a.classification.indicatorType)-rank(warningIndicatorTypes.map(x=>x[0]),b.classification.indicatorType)||b.triggered.localeCompare(a.triggered)||a.ind.name.localeCompare(b.ind.name,'zh-CN'));
}
function warningDisposition(w){if(w.stage===5)return '已办结';if(w.recovered&&w.stage===4)return '待复核';return ['待分派','提示函下发中','回函审核中','整改跟踪中','复核验证中'][w.stage]||'处理中'}
function warningListResults(args){
 const ws=warningListItems(args),total=warningList().filter(w=>w.severity===args.severity).length;
 const rows=ws.map((w,index)=>`<tr data-warning-row="${w.id}" class="${index&&ws[index-1].ind.org!==w.ind.org?'warning-group-start':''}"><td class="warning-org-cell">${ORGS[w.ind.org].name}</td><td>${w.classification.monitoringLabel}</td><td>${w.classification.indicatorLabel}</td><td class="warning-indicator-name">${w.ind.name}</td><td class="mono">${w.triggered}</td><td>${badge(evaluate(w.ind))}${w.recovered&&evaluate(w.ind)==='green'?'<small class="warning-recovered">已恢复</small>':''}</td><td>${warningDisposition(w)}</td><td><button class="bare cyan" data-warning="${w.id}">查看处置 ↗</button></td></tr>`).join('');
 return `<p class="warning-result-count">本月共 ${total} 项 · 当前显示 ${ws.length} 项</p><div class="table-scroll warning-table-scroll"><table class="data-table warning-table"><colgroup>${[11,9,12,24,11,11,12,10].map(width=>`<col style="width:${width}%">`).join('')}</colgroup><thead><tr>${warningTableColumns.map(label=>`<th scope="col">${label}</th>`).join('')}</tr></thead><tbody>${rows||'<tr><td colspan="8" class="warning-empty">暂无符合分类条件的预警指标，请调整筛选条件。</td></tr>'}</tbody></table></div>`;
}
function warningListDetail(args){
 const total=warningList().filter(w=>w.severity===args.severity).length,nonRisk=['operation','capital'].includes(args.monitoring);
 const options=(items,value)=>items.map(([id,name])=>`<option value="${id}" ${value===id?'selected':''}>${name}</option>`).join('');
 return {title:`本月${args.severity==='red'?'红灯':'黄灯'}预警 · ${total}项`,body:`<p class="dialog-summary">按机构、监测类型、指标类型归类排列，展示本月触发的具体预警指标。</p><div class="warning-filters"><label>机构<select id="warningOrg"><option value="all">全部机构</option>${options(activeOrgs().map(id=>[id,ORGS[id].name]),args.org)}</select></label><label>监测类型<select id="warningMonitoring"><option value="all">全部监测类型</option>${options(warningMonitoringTypes,args.monitoring)}</select></label><label>指标类型<select id="warningIndicatorType" ${nonRisk?'disabled':''}><option value="all">${nonRisk?'不适用风险分类':'全部指标类型'}</option>${options(warningIndicatorTypes,args.indicatorType)}</select></label></div><div id="warningResults">${warningListResults(args)}</div><p class="warning-classification-note">经营、资本类指标的“指标类型”显示为“—”；风险类按上述八类归集，合规及信息科技归入其他风险。本分类仅用于清单展示，不改变指标字典及监测／管控属性。</p><div class="case-note">本月清单按触发等级统计，包含触发后已恢复的事项；“当前状态”显示最新灯色，“处置状态”显示办理进度。指标恢复正常不等于事项已办结，仍需完成复核。</div>`};
}
function refreshWarningResults(){const args=dialogStack.at(-1).args,nonRisk=['operation','capital'].includes(args.monitoring);if(nonRisk)args.indicatorType='all';const filter=$('#warningIndicatorType');filter.disabled=nonRisk;filter.value=args.indicatorType||'all';filter.options[0].textContent=nonRisk?'不适用风险分类':'全部指标类型';$('#warningResults').innerHTML=warningListResults(args);syncNavigation()}
