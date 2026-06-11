import type { PresetEcosystem } from '@/types/ecosystem';

export const PRESET_ECOSYSTEMS: PresetEcosystem[] = [
  {
    id: 'freshwater-lake',
    name: '淡水湖泊',
    emoji: '🏞️',
    description: '典型的淡水湖泊生态系统，清澈的水面下生长着丰富的水生植物和动物。',
    difficulty: 'easy',
    category: 'freshwater',
    backgroundGradient: 'from-[#0A1628] via-[#1E3A5F] to-[#0F766E]',
    waterColor: '#0EA5E9',
    ambientLightIntensity: 0.8,
    species: [
      { speciesId: 'seaweed', count: 8 },
      { speciesId: 'grass', count: 10 },
      { speciesId: 'lotus', count: 3 },
      { speciesId: 'duckweed', count: 6 },
      { speciesId: 'fish', count: 6 },
      { speciesId: 'snail', count: 5 },
      { speciesId: 'turtle', count: 2 },
      { speciesId: 'tadpole', count: 4 },
      { speciesId: 'frog', count: 2 },
      { speciesId: 'bacteria', count: 4 },
    ],
    educationalInfo: '淡水湖泊是陆地上重要的淡水生态系统，具有完整的食物链。生产者（植物）通过光合作用制造能量，草食动物吃植物，肉食动物捕食草食动物，分解者将死亡的生物分解成养分回归环境。',
    expectedObservations: [
      '观察水草和藻类如何成为小鱼和蝌蚪的食物',
      '注意青蛙如何捕食小鱼和田螺',
      '看看乌龟的长寿特性如何影响种群数量',
      '分解菌如何保持水质清洁',
    ],
  },
  {
    id: 'rainforest-mini',
    name: '热带雨林微缩',
    emoji: '🌴',
    description: '模拟热带雨林地表生态，展示潮湿环境中丰富的生物多样性。',
    difficulty: 'medium',
    category: 'rainforest',
    backgroundGradient: 'from-[#052E16] via-[#14532D] to-[#166534]',
    waterColor: '#22C55E',
    ambientLightIntensity: 0.6,
    species: [
      { speciesId: 'fern', count: 6 },
      { speciesId: 'orchid', count: 3 },
      { speciesId: 'moss', count: 8 },
      { speciesId: 'snail', count: 4 },
      { speciesId: 'beetle', count: 6 },
      { speciesId: 'ant', count: 10 },
      { speciesId: 'frog', count: 3 },
      { speciesId: 'lizard', count: 2 },
      { speciesId: 'earthworm', count: 5 },
    ],
    educationalInfo: '热带雨林是地球上生物多样性最丰富的生态系统。虽然这里模拟的是地表微缩环境，但你可以看到完整的食物网：植物为昆虫提供食物，昆虫成为两栖动物和爬行动物的猎物，分解者则负责清理森林地表。',
    expectedObservations: [
      '观察蚂蚁如何同时扮演清道夫和猎物的角色',
      '注意蜥蜴如何敏捷地捕食甲虫',
      '看看蕨类和兰花在阴暗潮湿环境中的生长',
      '蚯蚓如何改善"土壤"环境',
    ],
  },
  {
    id: 'polluted-water',
    name: '污染水域',
    emoji: '☠️',
    description: '展示富营养化污染的水域，只有耐污物种能够生存的极端环境。',
    difficulty: 'hard',
    category: 'polluted',
    backgroundGradient: 'from-[#1F2937] via-[#365314] to-[#3F3F46]',
    waterColor: '#65A30D',
    ambientLightIntensity: 0.4,
    species: [
      { speciesId: 'polluted_algae', count: 15 },
      { speciesId: 'tubifex', count: 8 },
      { speciesId: 'mosquito_larva', count: 10 },
      { speciesId: 'carp', count: 3 },
      { speciesId: 'bacteria', count: 6 },
    ],
    educationalInfo: '当水体受到污染、氮磷等营养物质过多时，会发生富营养化。藻类大量繁殖形成水华，消耗水中氧气，导致大多数生物死亡。只有像水蚯蚓、鲫鱼这样的耐污物种能够生存。这是一个警示性的生态演示。',
    expectedObservations: [
      '观察污染藻类如何迅速繁殖占据整个水域',
      '注意水蚯蚓如何在低氧环境中生存',
      '看看鲫鱼顽强的适应能力',
      '思考：如果停止污染，这个生态系统能恢复吗？',
    ],
  },
  {
    id: 'marine-coral',
    name: '珊瑚礁生态',
    emoji: '🪸',
    description: '海洋中的热带雨林，珊瑚礁孕育着极其丰富的海洋生物多样性。',
    difficulty: 'medium',
    category: 'marine',
    backgroundGradient: 'from-[#0C4A6E] via-[#0369A1] to-[#0891B2]',
    waterColor: '#06B6D4',
    ambientLightIntensity: 0.9,
    species: [
      { speciesId: 'coral', count: 5 },
      { speciesId: 'seaweed', count: 6 },
      { speciesId: 'fish', count: 8 },
      { speciesId: 'shrimp', count: 6 },
      { speciesId: 'bigfish', count: 2 },
      { speciesId: 'turtle', count: 2 },
      { speciesId: 'jellyfish', count: 3 },
      { speciesId: 'bacteria', count: 5 },
    ],
    educationalInfo: '珊瑚礁虽然只占海洋面积的不到0.1%，却孕育了25%的海洋生物。珊瑚本身是动物，但与藻类共生，通过光合作用获得能量。健康的珊瑚礁生态系统拥有复杂的食物网和极高的生物多样性。',
    expectedObservations: [
      '观察珊瑚如何成为许多海洋生物的家园',
      '注意水母透明的身体和独特的捕食方式',
      '看看小虾如何清理环境',
      '海龟如何优雅地在水中游动',
    ],
  },
  {
    id: 'balanced-aquarium',
    name: '平衡生态缸',
    emoji: '⚖️',
    description: '精心设计的平衡生态系统，各营养级比例恰当，适合观察稳定的生态循环。',
    difficulty: 'easy',
    category: 'freshwater',
    backgroundGradient: 'from-[#0A1628] via-[#0d1f3d] to-[#1E3A5F]',
    waterColor: '#22D3EE',
    ambientLightIntensity: 0.75,
    species: [
      { speciesId: 'seaweed', count: 6 },
      { speciesId: 'grass', count: 8 },
      { speciesId: 'fish', count: 5 },
      { speciesId: 'snail', count: 3 },
      { speciesId: 'frog', count: 2 },
      { speciesId: 'bigfish', count: 1 },
      { speciesId: 'bacteria', count: 4 },
    ],
    educationalInfo: '这是一个经典的平衡生态缸演示。理想的生态系统中，生产者约占45%，草食动物25%，杂食动物10%，肉食动物10%，分解者10%。各物种相互制约，种群数量动态平衡，整个系统能够长期稳定运转。',
    expectedObservations: [
      '观察各物种种群数量如何保持动态平衡',
      '注意大鱼作为顶级捕食者如何控制其他种群',
      '看看分解菌如何回收利用死亡生物的能量',
      '整个系统的平衡指数会保持在较高水平',
    ],
  },
  {
    id: 'predator-prey',
    name: '捕食者-猎物',
    emoji: '🦅',
    description: '专注观察捕食关系的动态变化，了解种群数量的周期性波动。',
    difficulty: 'medium',
    category: 'custom',
    backgroundGradient: 'from-[#1E1B4B] via-[#312E81] to-[#3730A3]',
    waterColor: '#6366F1',
    ambientLightIntensity: 0.7,
    species: [
      { speciesId: 'grass', count: 10 },
      { speciesId: 'seaweed', count: 6 },
      { speciesId: 'fish', count: 8 },
      { speciesId: 'snail', count: 4 },
      { speciesId: 'bigfish', count: 3 },
      { speciesId: 'bacteria', count: 3 },
    ],
    educationalInfo: '捕食者和猎物的种群数量通常呈现周期性波动。当猎物数量多时，捕食者有充足食物，数量增加；捕食者数量增加后，捕食更多猎物，导致猎物数量下降；猎物不足又导致捕食者数量减少，如此循环往复。',
    expectedObservations: [
      '密切关注小鱼和大鱼的数量变化',
      '当小鱼数量多时，大鱼数量是否会随后增加？',
      '大鱼数量增加后，小鱼数量会如何变化？',
      '植物数量如何影响整个食物链？',
    ],
  },
];

export const CATEGORY_LABELS: Record<string, string> = {
  freshwater: '淡水生态',
  rainforest: '雨林生态',
  polluted: '污染警示',
  marine: '海洋生态',
  custom: '教学演示',
};

export const CATEGORY_COLORS: Record<string, string> = {
  freshwater: '#0EA5E9',
  rainforest: '#22C55E',
  polluted: '#EAB308',
  marine: '#06B6D4',
  custom: '#8B5CF6',
};

export const DIFFICULTY_LABELS: Record<string, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
};

export const DIFFICULTY_COLORS: Record<string, string> = {
  easy: '#22C55E',
  medium: '#F59E0B',
  hard: '#EF4444',
};

export function getPresetById(id: string): PresetEcosystem | undefined {
  return PRESET_ECOSYSTEMS.find((p) => p.id === id);
}

export function getPresetsByCategory(category: string): PresetEcosystem[] {
  return PRESET_ECOSYSTEMS.filter((p) => p.category === category);
}
