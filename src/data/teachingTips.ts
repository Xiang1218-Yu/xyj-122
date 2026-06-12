import type { TeachingTip } from '@/types/ecosystem';

export const TEACHING_TIPS: TeachingTip[] = [
  {
    id: 'first_organism_added',
    trigger: 'first_organism_added',
    title: '添加了第一个生物！',
    emoji: '🔬',
    content:
      '在真实的生态系统中，每个物种的引入都会改变整个系统的动态平衡。生物的生存依赖能量流动——从生产者通过光合作用固定太阳能，到消费者逐级传递，这被称为"食物链"。能量在每次传递中会损失约90%，因此高级捕食者的数量远少于初级消费者。',
    color: '#22D3EE',
  },
  {
    id: 'first_producer_added',
    trigger: 'first_producer_added',
    title: '生产者：生态系统的基石',
    emoji: '🌿',
    content:
      '生产者（如藻类、水草）是生态系统的基石。它们通过光合作用将太阳能转化为化学能，将无机物合成为有机物，是一切食物链的起点。没有生产者，整个生态系统将无法运转。它们还释放氧气，维持水体中的溶解氧水平。',
    color: '#4ADE80',
  },
  {
    id: 'first_herbivore_added',
    trigger: 'first_herbivore_added',
    title: '初级消费者：连接生产者与捕食者',
    emoji: '🐟',
    content:
      '草食动物是初级消费者，它们以植物为食，将植物中的能量传递给更高营养级。在生态学中，草食作用是能量从第一营养级流向第二营养级的关键环节。草食动物的取食行为也会影响植物的分布和生长形态，这种现象称为"自上而下"的生态调控。',
    color: '#22D3EE',
  },
  {
    id: 'first_carnivore_added',
    trigger: 'first_carnivore_added',
    title: '顶级捕食者：关键的调控力量',
    emoji: '🐠',
    content:
      '肉食动物作为顶级捕食者，对维持生态平衡至关重要。它们的捕食行为可以控制草食动物的数量，防止过度啃食导致植被退化。这种"级联效应"是生态学中的核心概念——移除顶级捕食者往往会导致整个生态系统结构的剧烈变化。',
    color: '#F472B6',
  },
  {
    id: 'first_decomposer_added',
    trigger: 'first_decomposer_added',
    title: '分解者：大自然的回收站',
    emoji: '🦠',
    content:
      '分解者（细菌、真菌等）是生态系统中不可或缺的"回收者"。它们将死亡的有机体和排泄物分解为无机物，使养分重新回到环境中供生产者利用，完成物质循环。没有分解者，营养物质将被锁定在死亡组织中，生态系统将陷入停滞。',
    color: '#C084FC',
  },
  {
    id: 'first_preset_loaded',
    trigger: 'first_preset_loaded',
    title: '预设生态系统已启动',
    emoji: '🌍',
    content:
      '每个预设场景模拟了一个真实的生态群落。群落中的物种经过长期协同进化，形成了复杂的相互依赖关系。注意观察不同物种之间的捕食、竞争和共生关系——这正是生态学家所说的"群落结构"。',
    color: '#FBBF24',
  },
  {
    id: 'first_event_occurred',
    trigger: 'first_event_occurred',
    title: '生态事件发生了！',
    emoji: '⚡',
    content:
      '自然界的生态系统经常遭受突发事件的干扰——赤潮、物种入侵、洪水等。这些干扰在生态学中被称为"扰动"。适度扰动可以增加生物多样性（中度干扰假说），但过度扰动可能导致生态系统崩溃。生态系统的恢复能力称为"生态弹性"。',
    color: '#EF4444',
  },
  {
    id: 'first_red_tide',
    trigger: 'first_red_tide',
    title: '赤潮：富营养化的警示',
    emoji: '🌊',
    content:
      '赤潮是由甲藻等有害藻类大量繁殖引起的生态灾害。当水体中氮磷等营养物质过多时（富营养化），藻类会疯狂增殖。赤潮不仅使水体变色，其产生的毒素还会导致鱼类大量死亡，破坏水产养殖，严重威胁海洋生态安全。',
    color: '#DC2626',
  },
  {
    id: 'first_invasive_species',
    trigger: 'first_invasive_species',
    title: '外来物种入侵',
    emoji: '🦑',
    content:
      '外来入侵物种是威胁全球生物多样性的主要因素之一。它们在新的环境中缺乏天敌，往往能迅速繁殖扩张，挤压本地物种的生存空间。著名的案例包括水葫芦入侵中国南方水域、福寿螺危害水稻田等。预防入侵比事后治理要有效得多。',
    color: '#F97316',
  },
  {
    id: 'first_water_purification',
    trigger: 'first_water_purification',
    title: '水质净化：生态自修复',
    emoji: '✨',
    content:
      '生态系统具有自我修复能力。当条件改善时，有益微生物会加速分解污染物，水质逐渐恢复。这就是"生态自净"作用。在人工湿地污水处理中，正是利用植物和微生物的协同作用来净化水质——这是仿生学的精彩应用。',
    color: '#06B6D4',
  },
  {
    id: 'first_temperature_change',
    trigger: 'first_temperature_change',
    title: '温度影响生物代谢',
    emoji: '🌡️',
    content:
      '温度是影响生物代谢速率的关键因素。根据范霍夫定律，温度每升高10°C，变温动物的代谢率大约增加2-3倍。但超过耐受上限，蛋白质会变性导致死亡。全球变暖正使许多物种的适生区向高纬度、高海拔迁移，而迁移速度跟不上变暖速度的物种将面临灭绝风险。',
    color: '#FBBF24',
  },
  {
    id: 'first_light_change',
    trigger: 'first_light_change',
    title: '光照驱动光合作用',
    emoji: '☀️',
    content:
      '光照是驱动光合作用的能量来源。光合作用速率随光照增强而提高，但存在"光饱和点"——超过该点后光合速率不再增加。过强的光照甚至会导致"光抑制"，损伤光合器官。水体的透明度决定了"透光层"的深度，直接影响水生植物的分布。',
    color: '#FEF3C7',
  },
  {
    id: 'first_species_extinction',
    trigger: 'first_species_extinction',
    title: '物种灭绝：不可逆的损失',
    emoji: '💀',
    content:
      '当一个物种的所有个体都消失时，就意味着灭绝——这是不可逆的。每个物种在生态系统中都扮演着独特角色，灭绝会引发连锁反应。生态学家用"关键种"来形容那些对维持生态系统功能至关重要的物种——失去它们，整个系统可能重组甚至崩溃。',
    color: '#EF4444',
  },
  {
    id: 'first_reproduction',
    trigger: 'first_reproduction',
    title: '繁殖：种群延续的关键',
    emoji: '🥚',
    content:
      '繁殖是种群延续的基础。r策略物种（如浮游生物）产生大量后代但很少照顾，依靠数量取胜；K策略物种（如大型哺乳动物）产仔少但投入大量抚育。在有限资源环境中，种群增长最终会受环境容纳量（K值）的限制，形成S型增长曲线。',
    color: '#A3E635',
  },
  {
    id: 'first_balance_achieved',
    trigger: 'first_balance_achieved',
    title: '生态平衡达到了！',
    emoji: '⚖️',
    content:
      '生态平衡是指生态系统中各物种的数量和比例保持相对稳定的状态。这种平衡是动态的——各物种种群始终在波动，但围绕一个均值上下振荡。这种"动态平衡"依赖于负反馈调节：当某物种种群增长过快，资源减少和捕食压力增加会使其回落。',
    color: '#22C55E',
  },
  {
    id: 'food_chain_formed',
    trigger: 'food_chain_formed',
    title: '食物链形成了！',
    emoji: '🔗',
    content:
      '食物链描述了能量从生产者到顶级消费者的传递路径。但在真实生态系统中，食物关系远比线性链复杂——多条食物链交织形成"食物网"。能量沿食物链传递时，每个营养级仅保留约10%的能量（十分之一定律），因此食物链通常不超过4-5个营养级。',
    color: '#818CF8',
  },
];

export function getTipByTrigger(trigger: string): TeachingTip | undefined {
  return TEACHING_TIPS.find((tip) => tip.trigger === trigger);
}
