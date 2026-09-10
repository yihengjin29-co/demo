'use strict';
const $=(q,root=document)=>root.querySelector(q), $$=(q,root=document)=>[...root.querySelectorAll(q)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ORGS={group:{name:'并表监测层',type:'独立计算口径 · 示例'},amc:{name:'国际AMC',type:'不良资产经营 · 手工填报'},ht:{name:'国泰海通',type:'证券业务 · 接口接入'},cpic:{name:'太保',type:'保险业务 · 接口接入（演示）'}};
const CATS=[['credit','信用'],['concentration','集中度'],['liquidity','流动性'],['market','市场'],['operational','操作'],['compliance','合规'],['reputation','声誉'],['it','信息科技'],['strategic','战略'],['adequacy','资本充足'],['efficiency','经营效率']];
const catName=id=>CATS.find(c=>c[0]===id)?.[1]||id;
const STATUS={red:'红灯',yellow:'黄灯',green:'正常',no_data:'缺数',overdue:'数据超期',none:'未配置'};
const color=s=>s==='no_data'||s==='overdue'||s==='none'?'gray':s;
const state={page:'overview',role:'shared',period:'2026-08',org:'all',severity:'all',category:'all',query:'',process:'all',sort:'status',tab:'risk',trend:'g-credit',windows:12};
const storageKey='siig-risk-cockpit-demo-v1';
let localData={};try{localData=JSON.parse(localStorage.getItem(storageKey)||'{}')}catch{}
let dialogStack=[],returnFocus=null,tickerIndex=0,tickerPaused=false,toastTimer;
const seeds=[
 ['g-credit','group','credit','资产拨备率',2.18,'%', 'low',2,1.5,'减值准备 / 相关资产余额 × 100%'],
 ['g-sector','group','concentration','最大行业风险暴露占比',28.6,'%', 'high',25,30,'同一行业风险暴露 / 全部风险暴露 × 100%'],
 ['g-liq','group','liquidity','未来30日现金覆盖倍数',1.32,'倍','low',1.2,1,'可动用现金流入 / 到期现金流出；受限资金不计入'],
 ['g-debt','group','liquidity','对外融资余额',486.2,'亿元','high',520,580,'范围内机构对外融资归集；内部融资单列抵消'],
 ['g-op','group','operational','重大操作风险事件数量',0,'件','high',1,2,'按统一事件ID去重统计，不累加重复报送'],
 ['g-case','group','compliance','重大合规事项数量',1,'件','high',1,2,'按事项ID及统一认定口径统计'],
 ['g-rep','group','reputation','已认定重大声誉事件数量',0,'件','high',1,2,'经人工核实认定的重大声誉事件，不等于负面舆情条数'],
 ['g-it','group','it','重大信息科技风险事件数量',0,'件','high',1,2,'按事件ID跨机构去重'],
 ['g-cap','group','adequacy','合格资本覆盖率',138.4,'%', 'low',130,110,'演示口径：抵消及调整后合格资本 / 最低资本要求 × 100%'],
 ['g-roe','group','efficiency','净资产收益率',6.2,'%', 'low',5,3,'同范围净利润 / 平均净资产 × 100%；不平均机构ROE'],
 ['g-profit','group','efficiency','净利润',52.8,'亿元','low',40,25,'示例监测口径，按同期间、同范围及调整规则计算'],
 ['g-leverage','group','adequacy','资产负债率',72.4,'%', 'high',75,82,'调整后负债 / 调整后资产 × 100%'],
 ['a-credit','amc','credit','逾期项目余额占比',8.4,'%', 'high',6,8,'逾期项目余额 / 存续项目余额；逾期按合同约定认定'],
 ['a-provision','amc','credit','资产拨备率',2.7,'%', 'low',2,1.5,'相关减值准备 / 对应资产余额 × 100%'],
 ['a-client','amc','concentration','最大单一客户风险暴露占比',12.6,'%', 'high',10,12,'统一客户ID归集的最大客户风险暴露 / 本机构全部风险暴露'],
 ['a-sector','amc','concentration','房地产业风险暴露占比',29.2,'%', 'high',25,32,'房地产业风险暴露 / 全部风险暴露 × 100%'],
 ['a-liq','amc','liquidity','未来30日现金覆盖倍数',1.08,'倍','low',1.2,1,'可动用现金流入 / 到期现金流出'],
 ['a-debt','amc','liquidity','短期融资占比',31.8,'%', 'high',35,45,'一年内到期融资 / 全部融资余额 × 100%'],
 ['a-op','amc','operational','重大操作风险事件数量',0,'件','high',1,2,'经确认且去重后的重大操作风险事件'],
 ['a-case','amc','compliance','重大合规事项数量',1,'件','high',1,2,'经业务认定的重大合规事项数量'],
 ['a-rep','amc','reputation','重大声誉风险事件数量',0,'件','high',1,2,'经人工核实并认定的重大声誉事件数量'],
 ['a-it','amc','it','重要系统异常中断时长',null,'小时','high',2,4,'重要系统异常中断累计时长'],
 ['a-cap','amc','adequacy','合格资本覆盖率',142.6,'%', 'low',130,110,'经确认的本机构合格资本 / 最低资本要求 × 100%'],
 ['a-leverage','amc','adequacy','资产负债率',68.5,'%', 'high',75,82,'本机构负债 / 资产 × 100%'],
 ['a-roe','amc','efficiency','净资产收益率',5.8,'%', 'low',5,3,'本机构净利润 / 平均净资产 × 100%'],
 ['a-cost','amc','efficiency','成本收入比',38.2,'%', 'high',40,50,'同口径营业费用 / 营业收入 × 100%'],
 ['h-credit','ht','credit','信用业务减值准备覆盖倍数',1.56,'倍','low',1.4,1.1,'对应减值准备 / 预期损失基数；演示内部管理指标'],
 ['h-client','ht','concentration','最大单一客户风险暴露占比',10.8,'%', 'high',10,12,'统一客户ID归集的最大客户风险暴露 / 本机构全部风险暴露'],
 ['h-sector','ht','concentration','房地产业风险暴露占比',23.4,'%', 'high',25,32,'房地产业风险暴露 / 全部风险暴露 × 100%'],
 ['h-liq','ht','liquidity','流动性覆盖率',138.2,'%', 'low',130,110,'优质流动性资产 / 未来30日现金净流出 × 100%'],
 ['h-market','ht','market','市场风险限额使用率',103.6,'%', 'high',85,100,'已占用市场风险限额 / 经审批限额 × 100%'],
 ['h-stress','ht','market','压力情景损失限额使用率',88.2,'%', 'high',85,100,'批准压力情景损失 / 内部压力损失限额 × 100%'],
 ['h-op','ht','operational','重大操作风险事件数量',0,'件','high',1,2,'经确认且去重后的重大操作风险事件'],
 ['h-case','ht','compliance','重大合规事项数量',0,'件','high',1,2,'经业务认定的重大合规事项数量'],
 ['h-rep','ht','reputation','重大声誉风险事件数量',0,'件','high',1,2,'经人工核实并认定的重大声誉事件数量'],
 ['h-it','ht','it','重要系统可用率',99.98,'%', 'low',99.9,99.5,'可用服务时间 / 应提供服务时间 × 100%'],
 ['h-strategy','ht','strategic','战略目标执行偏离度',8.2,'%', 'high',10,20,'目标与实际差异 / 目标；按年度目标映射监测'],
 ['h-netcapital','ht','adequacy','净资本',1284,'亿元', 'low',1100,900,'按风险看板演示口径归集的净资本'],
 ['h-cap','ht','adequacy','风险覆盖率',186.5,'%', 'low',150,120,'净资本 / 各项风险资本准备之和 × 100%'],
 ['h-roe','ht','efficiency','净资产收益率',7.6,'%', 'low',5,3,'本机构净利润 / 平均净资产 × 100%'],
 ['h-cost','ht','efficiency','成本收入比',42.1,'%', 'high',45,55,'同口径营业费用 / 营业收入 × 100%'],
 ['c-solvency','cpic','adequacy','综合偿付能力充足率',238.7,'%', 'low',180,150,'实际资本 / 最低资本 × 100%'],
 ['c-core-solvency','cpic','adequacy','核心偿付能力充足率',172.4,'%', 'low',120,100,'核心资本 / 最低资本 × 100%'],
 ['c-roe','cpic','efficiency','净资产收益率',12.6,'%', 'low',8,5,'本机构净利润 / 平均净资产 × 100%'],
 ['c-combined','cpic','efficiency','综合成本率',97.8,'%', 'high',100,103,'赔付率与费用率之和'],
 ['c-market','cpic','market','权益类资产风险敞口占比',18.4,'%', 'high',22,28,'权益类资产风险敞口 / 投资资产 × 100%'],
 ['c-liq','cpic','liquidity','流动性覆盖率',156.3,'%', 'low',130,110,'优质流动性资产 / 短期现金净流出 × 100%']
];
const indicators=seeds.map((s,i)=>{const [id,org,cat,name,current,unit,direction,yellow,red,formula]=s;return {id,org,cat,name,current,unit,direction,yellow,red,formula,version:'DEMO-R1.0',frequency:cat==='strategic'?'季':'月',stale:id==='h-strategy',seed:i,source:org==='amc'?'国际AMC手工填报 → 金控数仓':org==='group'?'金控数仓 → 专题计算结果':ORGS[org].name+'授权接口（演示） → 金控数仓',regulatory:null,history:Array.from({length:36},(_,j)=>{if(current===null)return null;if(unit==='件')return j===35?current:(j%9===i%9?1:0);if(j===35)return current;let factor=.9+.1*j/35+Math.sin(j*.7+i)*.036;if(id==='h-market')factor=.7+.3*j/35+Math.sin(j*.5)*.015;return +(current*factor).toFixed(unit==='倍'?2:2)})}});
const getInd=id=>indicators.find(i=>i.id===id);
const monthIndex=()=>35-({'2026-08':0,'2026-07':1,'2026-06':2}[state.period]||0);
const current=i=>i.stale?i.current:i.history[monthIndex()];
function evaluate(i,v=current(i)){if(v===null||!Number.isFinite(v))return 'no_data';if(i.stale)return 'overdue';if(i.direction==='low'){if(v<=i.red)return 'red';if(v<=i.yellow)return 'yellow'}else if(i.direction==='range'){if(v<i.red[0]||v>i.red[1])return 'red';if(v<i.yellow[0]||v>i.yellow[1])return 'yellow'}else{if(v>=i.red)return 'red';if(v>=i.yellow)return 'yellow'}return 'green'}
const num=(n,d=1)=>n===null?'—':Number(n).toLocaleString('zh-CN',{minimumFractionDigits:d,maximumFractionDigits:d});
const val=i=>num(current(i),i.unit==='件'?0:i.unit==='倍'?2:(i.unit==='%'?2:1));
const badge=s=>`<span class="tag ${color(s)}">${s==='yellow'?'△':s==='green'?'○':s==='red'?'●':'◇'} ${STATUS[s]||s}</span>`;
const institutional=()=>indicators.filter(i=>i.org!=='group'&&activeOrgs().includes(i.org)&&(state.org==='all'||i.org===state.org));
const baseIndicators=()=>indicators.filter(i=>(i.org==='group'||activeOrgs().includes(i.org))&&(state.org==='all'||i.org===state.org));
const warningInds=()=>institutional().filter(i=>['red','yellow'].includes(evaluate(i)));
const END=()=>monthEnd(state.period);
const stageNames=['触发识别','提示函下发','机构回函','整改执行','复核验证','办结归档'];
function warningList(){let list=warningInds().map((i,k)=>({id:'W-'+state.period+'-'+i.id,ind:i,severity:evaluate(i),stage:[3,1,2,3,2,1,3,2][k%8],due:END(),triggered:state.period+'-'+String(18+k).padStart(2,'0'),owner:i.org==='amc'?'国际AMC风险管理岗':'国泰海通风险管理岗',recovered:false}));if(state.org==='all'||state.org==='amc')list.push({id:'W-'+state.period+'-recovered',ind:getInd('a-debt'),severity:'yellow',stage:4,due:END(),triggered:state.period+'-12',owner:'国际AMC风险管理岗',recovered:true});list=list.map(w=>({...w,...localData[w.id],ind:w.ind}));return list}
const warningById=id=>warningList().find(w=>w.id===id);
function counts(){const all=institutional(),active=warningList();return {all:all.length,red:all.filter(i=>evaluate(i)==='red').length,yellow:all.filter(i=>evaluate(i)==='yellow').length,green:all.filter(i=>evaluate(i)==='green').length,gray:all.filter(i=>['no_data','overdue'].includes(evaluate(i))).length,open:active.filter(w=>w.stage<5).length,closed:active.filter(w=>w.stage===5).length,total:active.length}}
function save(){try{localStorage.setItem(storageKey,JSON.stringify(localData))}catch{toast('浏览器未允许本地保存，本次演示将在页面关闭后清除。')}}
function toast(t){$('#toast').textContent=t;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,3500)}

function chart(i,n=12,large=false){const end=monthIndex();const start=Math.max(0,end-n+1);const data=i.history.slice(start,end+1);const w=large?900:430,h=large?235:150;let vals=data.filter(x=>x!==null);if(!vals.length)return '<div class="empty">暂无可用历史数据，不能判定为正常。</div>';const min=Math.max(0,Math.min(...vals,i.yellow,i.red)*.8),max=Math.max(...vals,i.yellow,i.red)*1.12;const left=large?45:33,right=12,top=10,bottom=25;const x=j=>left+j/(data.length-1)*(w-left-right),y=v=>h-bottom-(v-min)/(max-min||1)*(h-top-bottom);const d=data.map((v,j)=>`${j?'L':'M'}${x(j).toFixed(2)} ${y(v).toFixed(2)}`).join(' ');const uid='grad-'+i.id+(large?'l':'s');return `<svg class="chart-svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" aria-label="${i.name}最近${n}个月趋势及阈值"><defs><linearGradient id="${uid}" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#43cbef" stop-opacity=".25"/><stop offset="1" stop-color="#43cbef" stop-opacity="0"/></linearGradient></defs>${[0,1,2].map(j=>{const v=min+(max-min)*j/2;return `<path d="M${left} ${y(v)}H${w-right}" stroke="#21415b" stroke-dasharray="2 5"/><text x="${left-6}" y="${y(v)+3}" text-anchor="end" font-size="8" fill="#7898b6">${num(v,(max-min)<10?1:0)}</text>`}).join('')}${[['yellow',i.yellow],['red',i.red]].map(([s,v])=>`<path d="M${left} ${y(v)}H${w-right}" stroke="var(--${s})" stroke-opacity=".65" stroke-dasharray="5 5" stroke-width=".8"/>`).join('')}<path d="${d}L${x(data.length-1)} ${h-bottom}L${left} ${h-bottom}Z" fill="url(#${uid})"/><path d="${d}" stroke="#5ad9f6" stroke-width="2" fill="none"/>${data.map((v,j)=>{const date=new Date(2023,8+start+j,1),period=date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0');return `<circle class="chart-point" cx="${x(j)}" cy="${y(v)}" r="${j===data.length-1?3.7:2.3}" fill="#78edff" data-point="${esc(period+' · '+num(v,2)+i.unit+' · DEMO-R1.0')}" tabindex="0" role="button" aria-label="${period} ${num(v,2)}${i.unit}"/>${j===0||j===data.length-1||j===Math.floor(data.length/2)?`<text x="${x(j)}" y="${h-5}" font-size="8" text-anchor="${j===0?'start':j===data.length-1?'end':'middle'}" fill="#749ab9">${period}</text>`:''}`}).join('')}</svg>`}
function indicatorRows(items){return items.map(i=>`<tr><td>${ORGS[i.org].name}</td><td>${esc(i.name)}</td><td>${catName(i.cat)}</td><td class="mono">${val(i)} ${i.unit}</td><td>${i.direction==='low'?'≤':'≥'} ${i.yellow}${i.unit}</td><td class="red">${i.direction==='low'?'≤':'≥'} ${i.red}${i.unit}</td><td>${badge(evaluate(i))}</td><td><button class="bare cyan" data-indicator="${i.id}">穿透查看 ↗</button></td></tr>`).join('')}
function indicatorTable(items){return items.length?`<div class="table-scroll"><table class="data-table"><thead><tr><th>所属机构 / 范围</th><th><button class="bare" data-action="sort">指标名称 ↕</button></th><th>风险 / 辅助维度</th><th>当期值</th><th>黄灯阈值</th><th>红灯阈值</th><th>监测状态</th><th>操作</th></tr></thead><tbody>${indicatorRows(items)}</tbody></table></div>`:'<div class="empty">当前筛选下暂无指标。可清空筛选或查看全部指标。</div>'}
function baseIndicatorDetail({id,window:win=12,caliber='managed'}){const i=getInd(id),s=evaluate(i),op=i.direction==='low'?'≤':'≥',v=current(i);const stale=i.stale?'2026-05-31':END();return {title:i.name,crumb:ORGS[i.org].name+' / '+catName(i.cat)+' / 指标详情',body:`<div class="detail-lead"><div><div class="flex">${badge(s)}<span class="tag">${ORGS[i.org].name}</span></div><div class="detail-value ${color(s)}">${val(i)}<small>${i.unit}</small></div><div class="detail-sub">数据所属期 ${state.period}　数据截止 ${stale}　规则 ${i.version}</div></div><div><label class="small muted" for="detailCaliber">指标展示口径</label><br><select id="detailCaliber" data-id="${id}" style="padding:7px;margin-top:7px"><option value="managed" ${caliber==='managed'?'selected':''}>${i.org==='group'?'集团管理监测':'机构单体监测'}</option><option value="regulatory" ${caliber==='regulatory'?'selected':''}>监管口径（待配置）</option></select></div></div>${caliber==='regulatory'?'<div class="callout">监管口径的适用机构、公式、监管值及生效版本尚未配置。下方保留管理监测样例供比较，不将其转换为监管结论。</div>':''}${s==='overdue'||s==='no_data'?'<div class="callout">数据缺失或超过本指标报送期限。当前值仅作历史参考，暂停本期红黄绿判定并进入质量处理队列。</div>':''}<div class="thresholds"><div><span>内部黄灯边界</span><b class="yellow">${op} ${i.yellow} ${i.unit}</b></div><div><span>内部红灯边界</span><b class="red">${op} ${i.red} ${i.unit}</b></div><div><span>监管约束</span><b class="muted" style="font-size:15px">待确认 / 不作判定</b></div></div><div class="flex between"><h3 class="section-label" style="margin:0">历史趋势与边界</h3><div class="seg">${[12,24,36].map(n=>`<button data-window="${n}" data-id="${id}" class="${n===win?'active':''}">${n}个月</button>`).join('')}</div></div><div class="detail-chart">${chart(i,win,true)}</div><div class="legend"><span class="cyan">— 当期值</span><span class="yellow">┄ 黄灯边界</span><span class="red">┄ 红灯边界</span><span>全部历史使用同一演示规则版本；点击节点查看时点值</span></div><h3 class="section-label">指标定义与计算依据</h3><dl class="key-values"><dt>计算口径</dt><dd>${esc(i.formula)}</dd><dt>规则说明</dt><dd>${i.direction==='low'?'低值触发型；先判断红灯，再判断黄灯。':'高值触发型；先判断红灯，再判断黄灯。'}等于边界视为触发；趋势恶化仅作提示，不自动升级灯色。</dd><dt>数据来源</dt><dd>${i.source} → 指标服务 → 当前视图（路径为设计示意）</dd><dt>监测频率</dt><dd>${i.frequency}度；实际时效按报送日历及数据截止期判断</dd><dt>版本与批次</dt><dd>${i.version} · 示例生效日 2023-09-01 · BATCH-${state.period.replace('-','')}-${i.org.toUpperCase()}</dd><dt>穿透关系</dt><dd>管理结果 → 指标公式 / 规则 → 加工明细 → 来源批次 → 业务资产${i.cat==='concentration'?' → 统一客户 / 最终交易对手':''}</dd></dl><div class="flex wrap"><button class="btn" data-action="quality">查看数据质量</button><button class="btn" data-lineage="${i.id}">核对计算与来源批次</button>${i.cat==='concentration'?'<button class="btn" data-action="penetration">穿透共同客户敞口</button>':''}${warningList().find(w=>w.ind.id===id)?`<button class="btn primary" data-warning="${warningList().find(w=>w.ind.id===id).id}">进入处置事项</button>`:''}</div>`}}
function lineageDetail({id}){const i=getInd(id),v=current(i),ratio=i.unit==='%'||i.unit==='倍',denominator=100,numerator=v===null?null:ratio?(i.unit==='%'?v:v*100):v;return {title:'计算核对与来源追溯 · '+i.name,crumb:ORGS[i.org].name+' / '+i.name+' / 来源批次',body:`<div class="callout">以下为与展示值一致的演示计算基准，用于说明对账路径。没有读取机构真实明细，不能作为实际会计、风险或监管计算凭据。</div><div class="penetration"><div class="pen-node"><strong>供数机构 / 源系统</strong><span>${i.org==='amc'?'受控手工填报':i.org==='ht'?'接口采集':'授权数据服务'}</span></div><span class="pen-arrow">→</span><div class="pen-node"><strong>金控数仓与专题加工</strong><span>校验 · 口径映射 · 批次留痕</span></div><span class="pen-arrow">→</span><div class="pen-node"><strong>指标计算及展示</strong><span>${i.version} / ${val(i)} ${i.unit}</span></div></div><div class="table-scroll"><table class="data-table"><thead><tr><th>核对步骤</th><th>演示基准</th><th>核验结果</th></tr></thead><tbody><tr><td>${ratio?'分子基准':'基础值'}</td><td class="mono">${num(numerator,2)}</td><td>${v===null?'待补齐源数据':'与演示批次一致'}</td></tr>${ratio?`<tr><td>分母基准</td><td class="mono">${denominator.toFixed(2)}</td><td>与分子采用一致范围、期间与计量单位</td></tr>`:''}<tr><td>计算结果</td><td class="mono">${v===null?'—':ratio?`${num(numerator,2)} / ${denominator}${i.unit==='%'?' × 100%':''} = ${val(i)}${i.unit}`:`${val(i)} ${i.unit}`}</td><td>${badge(evaluate(i))}</td></tr></tbody></table></div><dl class="key-values"><dt>来源批次</dt><dd>BATCH-${state.period.replace('-','')}-${i.org.toUpperCase()}</dd><dt>数据行标识</dt><dd>DEMO-${i.id.toUpperCase()}；正式建设需保留机构主键及明细行ID</dd><dt>计算定义</dt><dd>${esc(i.formula)}</dd><dt>校验要求</dt><dd>统一期间、币种、单位与范围；分母为零时不计算比率，转入异常处理；内部抵消与重复数据去重分别留痕。</dd></dl>`}}
function download(name,text,type='text/plain;charset=utf-8'){const b=new Blob(['\ufeff'+text],{type});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1500)}
