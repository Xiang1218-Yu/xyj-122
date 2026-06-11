import type { Challenge } from '@/types/ecosystem';

export const CHALLENGES: Challenge[] = [
  {
    id: 'survival_60',
    name: '初次探索',
    description: '让生态系统稳定运行 60 秒',
    type: 'survival_time',
    target: 60,
    difficulty: 'easy',
    hint: '添加一些基础物种，保持生态平衡。',
    badge: {
      id: 'badge_explorer',
      name: '探索者',
      emoji: '🌱',
      description: '成功让生态系统运行 60 秒',
      rarity: 'common',
      color: '#4ADE80',
    },
  },
  {
    id: 'survival_180',
    name: '稳步前进',
    description: '让生态系统稳定运行 180 秒',
    type: 'survival_time',
    target: 180,
    difficulty: 'medium',
    hint: '确保有完整的生产者和消费者层级。',
    badge: {
      id: 'badge_steward',
      name: '守护者',
      emoji: '🌿',
      description: '成功让生态系统运行 180 秒',
      rarity: 'rare',
      color: '#22D3EE',
    },
  },
  {
    id: 'survival_300',
    name: '生态大师',
    description: '让生态系统稳定运行 300 秒',
    type: 'survival_time',
    target: 300,
    difficulty: 'hard',
    hint: '构建完整的食物链，保持各物种数量平衡。',
    badge: {
      id: 'badge_master',
      name: '生态大师',
      emoji: '🏆',
      description: '成功让生态系统运行 300 秒',
      rarity: 'epic',
      color: '#F59E0B',
    },
  },
  {
    id: 'species_3',
    name: '小小世界',
    description: '同时存活 3 种以上物种',
    type: 'species_diversity',
    target: 3,
    difficulty: 'easy',
    hint: '尝试添加植物、草食动物和分解者。',
    badge: {
      id: 'badge_diversity_3',
      name: '多样性入门',
      emoji: '🌍',
      description: '同时拥有 3 种以上物种',
      rarity: 'common',
      color: '#A3E635',
    },
  },
  {
    id: 'species_5',
    name: '繁荣生态',
    description: '同时存活 5 种以上物种',
    type: 'species_diversity',
    target: 5,
    difficulty: 'medium',
    hint: '添加不同营养级的物种，确保食物来源充足。',
    badge: {
      id: 'badge_diversity_5',
      name: '生物多样性',
      emoji: '🌈',
      description: '同时拥有 5 种以上物种',
      rarity: 'rare',
      color: '#F472B6',
    },
  },
  {
    id: 'species_8',
    name: '万物共生',
    description: '同时存活 8 种以上物种',
    type: 'species_diversity',
    target: 8,
    difficulty: 'hard',
    hint: '需要精心平衡各物种数量，避免某一物种灭绝。',
    badge: {
      id: 'badge_diversity_8',
      name: '万物共生',
      emoji: '🦋',
      description: '同时拥有 8 种以上物种',
      rarity: 'epic',
      color: '#C084FC',
    },
  },
  {
    id: 'foodchain_3',
    name: '生命之链',
    description: '构建一条完整的三级食物链',
    type: 'food_chain_length',
    target: 3,
    difficulty: 'easy',
    hint: '生产者 → 草食动物 → 肉食动物。',
    badge: {
      id: 'badge_foodchain_3',
      name: '初级食物链',
      emoji: '🔗',
      description: '构建完整的三级食物链',
      rarity: 'common',
      color: '#34D399',
    },
  },
  {
    id: 'foodchain_4',
    name: '自然法则',
    description: '构建一条完整的四级食物链',
    type: 'food_chain_length',
    target: 4,
    difficulty: 'hard',
    hint: '生产者 → 初级消费者 → 次级消费者 → 顶级捕食者。',
    badge: {
      id: 'badge_foodchain_4',
      name: '顶级猎手',
      emoji: '👑',
      description: '构建完整的四级食物链',
      rarity: 'epic',
      color: '#EF4444',
    },
  },
  {
    id: 'population_20',
    name: '人丁兴旺',
    description: '总生物数量达到 20 只以上',
    type: 'total_population',
    target: 20,
    difficulty: 'easy',
    hint: '多添加一些繁殖能力强的物种。',
    badge: {
      id: 'badge_population_20',
      name: '生机勃勃',
      emoji: '🐾',
      description: '总生物数量达到 20 只',
      rarity: 'common',
      color: '#60A5FA',
    },
  },
  {
    id: 'balance_70',
    name: '和谐共处',
    description: '生态平衡指数达到 70 以上',
    type: 'balance_index',
    target: 70,
    difficulty: 'medium',
    hint: '保持各营养级物种的合理比例。',
    badge: {
      id: 'badge_balance_70',
      name: '平衡之美',
      emoji: '⚖️',
      description: '生态平衡指数达到 70',
      rarity: 'rare',
      color: '#818CF8',
    },
  },
  {
    id: 'trophic_all',
    name: '完美生态',
    description: '拥有全部五个营养级的物种',
    type: 'trophic_level_complete',
    target: 5,
    difficulty: 'hard',
    hint: '生产者、草食动物、杂食动物、肉食动物、分解者都要有。',
    badge: {
      id: 'badge_trophic_all',
      name: '完美生态',
      emoji: '🌟',
      description: '拥有全部五个营养级',
      rarity: 'legendary',
      color: '#FBBF24',
    },
  },
];

export const RARITY_LABELS: Record<string, string> = {
  common: '普通',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
};

export const RARITY_COLORS: Record<string, string> = {
  common: '#9CA3AF',
  rare: '#3B82F6',
  epic: '#A855F7',
  legendary: '#F59E0B',
};

export const DIFFICULTY_LABELS: Record<string, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
};

export const DIFFICULTY_COLORS: Record<string, string> = {
  easy: '#4ADE80',
  medium: '#FBBF24',
  hard: '#F87171',
};

export function getChallengeById(id: string): Challenge | undefined {
  return CHALLENGES.find((c) => c.id === id);
}

export function getChallengesByDifficulty(difficulty: string): Challenge[] {
  return CHALLENGES.filter((c) => c.difficulty === difficulty);
}

export function getCompletedChallenges(progress: Record<string, { completed: boolean }>): Challenge[] {
  return CHALLENGES.filter((c) => progress[c.id]?.completed);
}
