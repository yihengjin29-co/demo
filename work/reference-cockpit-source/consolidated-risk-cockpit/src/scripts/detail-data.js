// Reporting scope, dates, values and rules are synthetic prototype fixtures.
Object.assign(ORGS,{spdb:{name:'浦发银行',type:'银行业务 · 接口接入（演示）'},srcb:{name:'沪农商银行',type:'银行业务 · 接口接入（演示）'}});
const orgScope={amc:'2026-01',ht:'2026-01',cpic:'2026-01',spdb:'2026-07',srcb:'2026-08'};
const orgOrder=['amc','ht','cpic','spdb','srcb'];
function activeOrgs(period=state.period){return orgOrder.filter(org=>orgScope[org]<=period)}
function previousMonth(period){const [y,m]=period.split('-').map(Number),d=new Date(y,m-2,1);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')}
function monthEnd(period){const [y,m]=period.split('-').map(Number);return period+'-'+new Date(y,m,0).getDate()}
function historyIndex(period){const [y,m]=period.split('-').map(Number);return (y-2023)*12+m-9}
function valueAt(i,period){return i.history[historyIndex(period)]??null}
function statusAt(i,period){return evaluate(i,valueAt(i,period))}
const bankTemplates=[
 ['npl','credit','不良贷款率','%','high',1.5,2,1.67,1.42,'不良贷款余额 / 各项贷款余额 × 100%'],
 ['overdue','credit','逾期贷款率','%','high',2,3,1.93,1.81,'逾期贷款余额 / 各项贷款余额 × 100%'],
 ['coverage','credit','拨备覆盖率','%','low',180,150,218.5,236.7,'贷款损失准备 / 不良贷款余额 × 100%'],
 ['provision','credit','贷款拨备率','%','low',2.5,2,3.2,3.6,'贷款损失准备 / 各项贷款余额 × 100%'],
 ['client','concentration','最大单一客户风险暴露占比','%','high',10,12,8.6,11.4,'最大单一客户风险暴露 / 资本净额 × 100%'],
 ['clientgroup','concentration','最大集团客户风险暴露占比','%','high',15,20,13.4,12.9,'最大集团客户风险暴露 / 资本净额 × 100%'],
 ['sector','concentration','最大行业风险暴露占比','%','high',25,30,28.2,22.6,'同一行业风险暴露 / 全部风险暴露 × 100%'],
 ['liq','liquidity','流动性覆盖率','%','low',120,100,114.6,136.8,'合格优质流动性资产 / 未来30天现金净流出 × 100%'],
 ['nsfr','liquidity','净稳定资金比例','%','low',110,100,126.3,119.4,'可用稳定资金 / 所需稳定资金 × 100%'],
 ['market','market','市场风险限额使用率','%','high',90,100,78.6,102.4,'市场风险计量结果 / 已审批内部限额 × 100%'],
 ['op','operational','重大操作风险事件数量','件','high',1,2,0,0,'本机构当月已认定重大操作风险事件数'],
 ['case','compliance','重大合规事项数量','件','high',1,2,0,1,'本机构当月已认定重大合规事项数'],
 ['rep','reputation','重大声誉风险事件数量','件','high',1,2,0,0,'本机构当月已认定重大声誉风险事件数'],
 ['it','it','关键系统可用率','%','low',99.9,99.5,99.98,99.97,'可用运行时长 / 计划运行时长 × 100%'],
 ['strategy','strategic','年度经营目标偏离度','%','high',10,20,6.8,8.1,'实际经营结果较阶段目标的负向偏离幅度'],
 ['cap','adequacy','资本充足率','%','low',12,10,14.8,16.2,'资本净额 / 风险加权资产 × 100%'],
 ['tier1','adequacy','一级资本充足率','%','low',10,8.5,12.5,13.4,'一级资本净额 / 风险加权资产 × 100%'],
 ['cet1','adequacy','核心一级资本充足率','%','low',9,7.5,11.3,12.7,'核心一级资本净额 / 风险加权资产 × 100%'],
 ['roe','efficiency','净资产收益率','%','low',6,4,8.7,9.1,'净利润 / 平均净资产 × 100%'],
 ['cost','efficiency','成本收入比','%','high',40,50,32.6,35.8,'营业费用 / 营业收入 × 100%'],
 ['profit','efficiency','净利润','亿元','low',20,10,42.8,28.5,'本机构本期净利润'],
 ['income','efficiency','营业收入','亿元','low',50,30,126.8,86.4,'本机构本期营业收入']
];
for(const [org,prefix,index] of [['spdb','p',7],['srcb','s',8]])bankTemplates.forEach((t,k)=>{const [suffix,cat,name,unit,direction,yellow,red]=t,v=t[index],id=prefix+'-'+suffix;const history=Array.from({length:36},(_,j)=>{if(j===35)return v;if(unit==='件')return 0;if(suffix==='it')return +(99.95+Math.sin(j*.3)*.03).toFixed(2);return +(v*(.9+.1*j/35+Math.sin(j*.45+k)*.018)).toFixed(2)});indicators.push({id,org,cat,name,current:v,unit,direction,yellow,red,formula:t[9],history,frequency:'月',version:'DEMO-R1.0',source:ORGS[org].name+'授权接口（演示） → 金控数仓',regulatory:null,stale:false})});
const rawMajorEvents=[
 {id:'E-001',title:'共同客户A流动性风险排查',orgs:['amc','ht'],cat:'liquidity',level:'高',status:'整改跟踪中',stage:3,since:'2026-05',subject:'A',day:26,summary:'针对示例客户A的融资展期信号，核对集团范围内相关债权、债券投资及到期回款安排，跟踪风险缓释措施。尚未作出损失认定。'},
 {id:'E-002',title:'市场风险限额超限处置',orgs:['ht'],cat:'market',level:'高',status:'方案执行中',stage:3,since:'2026-05',subject:null,day:25,summary:'示例市场风险计量触发机构内部红灯，已组织限额核对及压降方案。内部红灯不自动等同于违反监管规定。'},
 {id:'E-003',title:'存量项目B回款异常核查',orgs:['amc'],cat:'credit',level:'中',status:'待补充说明',stage:2,since:'2026-07',subject:'B',day:24,summary:'核对示例项目B的回款安排、担保措施和处置进展，机构正在补充说明材料。'},
 {id:'E-004',title:'客户D授信资产质量专项排查',orgs:['spdb'],cat:'credit',level:'中',status:'核验评估中',stage:2,since:'2026-07',subject:'D',day:23,summary:'结合示例客户D经营信息，对相关授信和投资资产开展事实核验，尚未认定损失。'},
 {id:'E-005',title:'市场风险敞口调整专项事项',orgs:['srcb'],cat:'market',level:'高',status:'方案执行中',stage:3,since:'2026-08',subject:null,day:22,summary:'对内部市场风险限额触发事项实施敞口调整，持续监测执行效果及剩余风险。'},
 {id:'E-006',title:'共同客户集中度复核事项',orgs:['ht','srcb'],cat:'concentration',level:'中',status:'复核验证中',stage:4,since:'2026-08',subject:'C',day:21,summary:'以统一主体标识核对共同客户C的跨机构投资敞口，确认重复记录、资产范围及集中度计算口径。'}
];
function eventsFor(period){return rawMajorEvents.filter(e=>e.since<=period&&e.orgs.every(o=>activeOrgs(period).includes(o))).map(e=>({...e,date:period+'-'+e.day,reportTime:period+'-'+e.day+' 10:30',period,id:e.id+'-'+period}))}
function eventsData(){return eventsFor(state.period)}
const sentimentRecords=[
 {id:'S-01',title:'示例客户A融资展期信息待核查',orgs:['amc'],tone:'负面',importance:5,subject:'A',source:'公开资讯样例',day:26,time:'09:10',body:'本条资讯仅对应示例客户A，所属机构为国际AMC。模拟信息提及该客户融资展期，需核实信息及回款安排。下方汇总集团范围内对同一主体的投资，不因此增加本条资讯的所属机构标签。'},
 {id:'S-02',title:'示例客户F经营信息持续跟踪',orgs:['ht'],tone:'中性',importance:3,subject:'F',source:'经营观察样例',day:26,time:'08:45',body:'本条资讯仅对应示例客户F，所属机构为国泰海通。核对该客户经营信息、现金流与存续债券投资情况，不自动改变客户评级或指标灯色。'},
 {id:'S-03',title:'示例项目B资产处置进展更新',orgs:['amc'],tone:'中性',importance:3,subject:'B',source:'项目动态样例',day:25,time:'16:20',body:'示例项目B公开信息出现资产处置进展。需与回款台账、处置协议和实际到账情况核对后再更新管理结论。'},
 {id:'S-04',title:'示例客户C经营改善信息跟踪',orgs:['ht'],tone:'正面',importance:2,subject:'C',source:'公开资讯样例',day:25,time:'14:00',body:'模拟公开信息反映客户C经营改善。正面信息仅供辅助判断，不替代风险复核，也不直接关闭整改事项。'},
 {id:'S-05',title:'示例客户D经营承压信息核查',orgs:['spdb'],tone:'负面',importance:4,subject:'D',source:'公开资讯样例',day:24,time:'11:35',body:'示例客户D经营信息出现不利变化。需核实信息时效与主体匹配结果，分别核对投资资产和授信业务，不将授信额度直接当作投资敞口。'},
 {id:'S-06',title:'示例客户E订单增长信息跟踪',orgs:['srcb'],tone:'正面',importance:2,subject:'E',source:'公开资讯样例',day:24,time:'10:15',body:'模拟信息显示客户E新增订单，持续核对订单履约、现金流和相关投资资产情况。'}
];
function sentimentData(){return sentimentRecords.filter(s=>s.orgs.every(o=>activeOrgs().includes(o))).map(s=>({...s,publishedAt:state.period+'-'+s.day+' '+s.time}))}
const subjects={
 A:{name:'示例客户A',id:'DEMO-CUST-A',kind:'客户',holdings:[['amc','债权投资','A-AMC-01',12.8],['ht','债券投资','A-HT-01',8.6]]},
 B:{name:'示例项目B主体',id:'DEMO-CUST-B',kind:'客户',holdings:[['amc','债权投资','B-AMC-01',6.2]]},
 C:{name:'示例客户C',id:'DEMO-CUST-C',kind:'客户',holdings:[['ht','债券投资','C-HT-01',5.4],['srcb','债券投资','C-SRCB-01',3.1]]},
 D:{name:'示例客户D',id:'DEMO-CUST-D',kind:'客户',holdings:[['group','直接股权投资','D-GROUP-01',.4],['spdb','债券投资','D-SPDB-01',4.8]]},
 E:{name:'示例客户E',id:'DEMO-CUST-E',kind:'客户',holdings:[['srcb','债券投资','E-SRCB-01',2.6]]},
 F:{name:'示例客户F',id:'DEMO-CUST-F',kind:'客户',holdings:[['ht','债券投资','F-HT-01',4.1]]},
 industry:{name:'房地产行业（示例范围）',id:'DEMO-IND-RE',kind:'行业',holdings:[['amc','行业债权投资汇总','IND-AMC',22.8],['ht','行业债券投资汇总','IND-HT',12.1],['spdb','行业债券投资汇总','IND-SPDB',7.2],['srcb','行业债券投资汇总','IND-SRCB',4.3]]}
};
function exposureFor(id,period=state.period){const subject=subjects[id],factor=1-(35-historyIndex(period))*.025,rows=subject.holdings.filter(r=>r[0]==='group'||activeOrgs(period).includes(r[0])).map(([org,type,asset,amount])=>({org,type,asset,amount:+(amount*factor).toFixed(2)})),amount=+rows.reduce((a,r)=>a+r.amount,0).toFixed(2),denominator=+(500*factor).toFixed(2);const ranked=Object.entries(subjects).filter(([,v])=>v.kind==='客户').map(([key,s])=>({key,total:s.holdings.filter(r=>r[0]==='group'||activeOrgs(period).includes(r[0])).reduce((a,r)=>a+ +(r[3]*factor).toFixed(2),0)})).sort((a,b)=>b.total-a.total);return {...subject,rows,amount,denominator,ratio:amount/denominator*100,rank:subject.kind==='客户'?ranked.findIndex(r=>r.key===id)+1:null}}
function warningsFor(period){const active=activeOrgs(period),xs=indicators.filter(i=>active.includes(i.org)&&['red','yellow'].includes(statusAt(i,period)));const out=xs.map((i,k)=>({id:'W-'+period+'-'+i.id,ind:i,severity:statusAt(i,period),stage:[3,1,2,3][k%4],due:monthEnd(period),triggered:period+'-'+String(16+k%12).padStart(2,'0'),owner:ORGS[i.org].name+'风险管理岗',recovered:false}));if(period>='2026-08')out.push({id:'W-'+period+'-recovered',ind:getInd('a-debt'),severity:'yellow',stage:4,due:monthEnd(period),triggered:period+'-12',owner:'国际AMC风险管理岗',recovered:true});return out}
function warningList(){return warningsFor(state.period)}
function snapshot(period){const warnings=warningsFor(period);return {orgs:activeOrgs(period).length,yellow:warnings.filter(w=>w.severity==='yellow').length,red:warnings.filter(w=>w.severity==='red').length,events:eventsFor(period).length}}
