import type { Institution, InstitutionIndicator } from '../types';

const indicatorsFor = (type: string, offset: number): InstitutionIndicator[] => {
  const banking = ['资本充足率', '不良贷款率', '流动性覆盖率', '拨备覆盖率', '单一客户集中度', '净稳定资金率'];
  const insurance = ['综合偿付能力充足率', '核心偿付能力充足率', '综合成本率', '保险风险最低资本', '流动性覆盖率', '关联交易占比'];
  const asset = ['资本充足率', '不良资产率', '资产负债率', '现金流覆盖率', '客户集中度', '风险资产收益率'];
  const securities = ['净资本', '风险覆盖率', '流动性覆盖率', '净稳定资金率', '自营权益集中度', '融资业务履约保障比例'];
  const names = type.includes('保险') ? insurance : type.includes('资产') ? asset : type.includes('证券') ? securities : banking;
  return names.map((name, index) => ({
    name,
    unit: name.includes('净资本') ? '亿元' : '%',
    current: name.includes('净资本') ? String(185 + offset * 7) : `${(12.4 + offset + index * 3.17).toFixed(2)}%`,
    lastYear: name.includes('净资本') ? String(176 + offset * 6) : `${(11.8 + offset + index * 3.06).toFixed(2)}%`,
    yearOnYear: index === 1 ? '-0.18%' : `+${(0.32 + index * 0.11).toFixed(2)}%`,
    previous: name.includes('净资本') ? String(181 + offset * 6) : `${(12.1 + offset + index * 3.1).toFixed(2)}%`,
    monthOnMonth: index === 4 ? '-0.06%' : `+${(0.12 + index * 0.05).toFixed(2)}%`,
    light: index === 1 ? '黄灯' : '绿灯',
  }));
};

const makeInstitution = (value: Omit<Institution, 'indicators' | 'concentrations' | 'relatedParties' | 'rating'>, index: number): Institution => ({
  ...value,
  indicators: indicatorsFor(value.type, index),
  rating: {
    regulatory: index % 2 ? '监管评级 2级' : '监管评级 2A',
    external: index === 1 ? '主体评级 AAA' : '主体评级 AA+',
    history: ['2022：AA+', '2023：AA+', `2024：${index === 1 ? 'AAA' : 'AA+'}`],
    marketRank: `同类型机构综合排名第 ${8 + index * 3} 位`,
    concerns: '持续关注资产质量、流动性储备、重点客户集中度和数字化运营风险。',
  },
  concentrations: [
    { category: '客户集中度', value: `${8.2 + index}%`, description: '前十大客户风险敞口占比保持在内部限额内。' },
    { category: '行业集中度', value: `${21.4 + index * 1.3}%`, description: '重点关注制造业、地产上下游及基础设施行业。' },
    { category: '区域集中度', value: `${36.8 + index * 2.1}%`, description: '主要业务集中于长三角区域。' },
    { category: '同业集中度', value: `${7.5 + index * .8}%`, description: '同业交易对手分布总体稳定。' },
    { category: '主要风险敞口', value: `${128 + index * 23} 亿元`, description: '已纳入集团统一限额和月度监测。' },
  ],
  relatedParties: [
    { name: '集团产业协同企业A', relation: '同一控制下企业', shareholding: '—', onBalanceExposure: `${8 + index}.6亿元`, offBalanceExposure: '1.2亿元', netAssetRatio: '1.8%' },
    { name: '区域金融服务企业B', relation: '联营企业', shareholding: '20.00%', onBalanceExposure: '3.4亿元', offBalanceExposure: '0.6亿元', netAssetRatio: '0.7%' },
  ],
});

export const seedInstitutions = (): Institution[] => [
  makeInstitution({ id: 'inst-spdb', name: '浦发银行', shortName: '浦发银行', type: '商业银行', establishedAt: '1992-08-28', registeredCapital: '293.52亿元', creditCode: '9131000013221158XC', ownership: '集团参股并实施并表风险管理', businessScope: '公司金融、零售金融、金融市场及资产管理等银行业务。', management: '董事会下设风险管理委员会，总行设全面风险管理部门。', branches: '境内外分支机构覆盖主要经济区域。', address: '上海市浦东新区', website: 'www.spdb.com.cn', emergencyContact: '陈经理', phone: '021-95528', includedAt: '2022-01-01', status: '已纳入', activeIndicatorCount: 38, warningCount: 1, overview: '全国性股份制商业银行，持续强化资本、流动性与资产质量管理。' }, 0),
  makeInstitution({ id: 'inst-amc', name: '国际AMC', shortName: '国际AMC', type: '资产管理公司', establishedAt: '2015-06-18', registeredCapital: '100.00亿元', creditCode: '91310000342188721X', ownership: '集团控股金融企业', businessScope: '不良资产收购处置、重组重整、特殊机会投资及咨询服务。', management: '设董事会风险委员会和独立风险管理部门。', branches: '设华东、华南及华北业务中心。', address: '上海市黄浦区', website: 'www.international-amc.example', emergencyContact: '王经理', phone: '021-60000001', includedAt: '2021-07-01', status: '已纳入', activeIndicatorCount: 31, warningCount: 2, overview: '专注特殊资产管理和风险化解，承担集团风险资产专业处置职能。' }, 1),
  makeInstitution({ id: 'inst-cpic', name: '太保集团', shortName: '太保', type: '保险集团', establishedAt: '1991-05-13', registeredCapital: '96.20亿元', creditCode: '91310000132211707B', ownership: '集团重要参股金融企业', businessScope: '保险控股、寿险、产险、健康险、养老及资产管理。', management: '集团统一风险管理架构覆盖各保险子公司。', branches: '全国性保险服务网络。', address: '上海市浦东新区', website: 'www.cpic.com.cn', emergencyContact: '赵经理', phone: '021-95500', includedAt: '2022-01-01', status: '已纳入', activeIndicatorCount: 35, warningCount: 0, overview: '综合性保险集团，重点监测偿付能力、投资风险及保险业务质量。' }, 2),
  makeInstitution({ id: 'inst-srcb', name: '上农商', shortName: '上农商', type: '商业银行', establishedAt: '2005-08-23', registeredCapital: '96.44亿元', creditCode: '91310000779328649T', ownership: '集团参股金融企业', businessScope: '公司银行、零售银行、普惠金融及金融市场业务。', management: '建立董事会、管理层和业务条线三级风险治理体系。', branches: '以上海地区网点为主并覆盖长三角。', address: '上海市黄浦区', website: 'www.shrcb.com', emergencyContact: '周经理', phone: '021-962999', includedAt: '2022-03-01', status: '已纳入', activeIndicatorCount: 33, warningCount: 1, overview: '立足上海、服务三农和中小企业的区域性商业银行。' }, 3),
  makeInstitution({ id: 'inst-guotai', name: '国泰海通', shortName: '国泰海通', type: '证券公司', establishedAt: '1999-08-18', registeredCapital: '176.29亿元', creditCode: '9131000063159284XQ', ownership: '集团重要参股金融企业', businessScope: '证券经纪、投资银行、资产管理、研究、交易及机构服务。', management: '设首席风险官和独立风险管理部门，覆盖各业务条线。', branches: '全国性分支机构及境外业务平台。', address: '上海市静安区', website: 'www.gtht.com', emergencyContact: '孙经理', phone: '021-95521', includedAt: '2023-01-01', status: '已纳入', activeIndicatorCount: 36, warningCount: 0, overview: '综合性证券金融服务机构，重点关注净资本、流动性与市场风险。' }, 4),
];
