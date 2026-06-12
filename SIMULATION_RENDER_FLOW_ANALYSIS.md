# 生态系统模拟器：从主循环到3D渲染的完整数据流分析

## 一、项目架构概览

本项目是一个基于 React + Three.js (@react-three/fiber) + Zustand 的生态系统模拟应用。核心数据流遵循 **"模拟驱动状态，状态驱动渲染"** 的分离架构，模拟逻辑与渲染逻辑完全解耦，通过 Zustand 状态管理作为中间桥梁。

---

## 二、各模块实现原理深度分析

### 2.1 模拟主循环驱动层：`useEcosystemSimulation` Hook

**核心文件**: [useEcosystemSimulation.ts](file:///Users/tog/Desktop/code/solo/xyj-122/src/hooks/useEcosystemSimulation.ts)

#### 实现原理
采用 `requestAnimationFrame` (rAF) 构建的 **固定时间步长模拟循环**，关键特征：

```
┌─────────────────────────────────────────────────────────────────┐
│  useEffect 注册 rAF 循环                                        │
│  ├─ tick 函数每帧被浏览器调用 (~60fps)                          │
│  ├─ 节流判断：time - lastTime > 60ms → 约16.6fps 模拟速率       │
│  │   (注意：60ms间隔而非逐帧，实现渲染60fps / 模拟~16fps 解耦)   │
│  └─ 循环内按顺序执行：事件系统 → 昼夜循环 → 生物模拟 → 状态更新 │
└─────────────────────────────────────────────────────────────────┘
```

**关键机制** (见 [L202-L363](file:///Users/tog/Desktop/code/solo/xyj-122/src/hooks/useEcosystemSimulation.ts#L202-L363))：
- **双速率解耦**：浏览器以60fps调用rAF，但模拟逻辑每60ms才执行一次，避免生物模拟过于频繁
- **引用追踪**: 使用 `useRef` 存储 `isRunning`、`isRewinding` 等开关状态，避免因依赖变化导致 rAF 循环重建
- **事件系统**: 每帧尝试随机触发 `red_tide`、`invasive_species`、`water_purification` 三类生态事件（概率0.06%~0.08%）
- **快照系统**: 每5个模拟步长（`SNAPSHOT_INTERVAL=5`）调用 `recordSnapshot()` 记录历史状态，最多保留 1800 条（约2.5小时模拟）

---

### 2.2 核心模拟计算层：`ecosystemSimulator`

**核心文件**: [ecosystemSimulator.ts](file:///Users/tog/Desktop/code/solo/xyj-122/src/utils/ecosystemSimulator.ts)

#### 实现原理
纯函数式的 **逐生物模拟引擎**，输入当前生物数组 + 环境参数，输出增量变更集（而非全量替换）：

**模拟流程** (见 [simulateStep](file:///Users/tog/Desktop/code/solo/xyj-122/src/utils/ecosystemSimulator.ts#L135-L381))：

| 阶段 | 操作 | 复杂度 |
|------|------|--------|
| 环境适应度计算 | 为每个物种计算温度/光照偏离度，得到适应度因子 `overallFitness` | O(N) |
| 死亡判定 | 年龄超过寿命 × 适应度，或能量 ≤ 0 → 加入 `toRemove` | O(N) |
| 能量消耗 | 基础消耗 `0.05 + size × 0.02`，乘以 `(1 + (1 - fitness) × 1.5)` | O(N) |
| AI行为决策 | 按营养级分流：生产者/分解者/消费者 三套逻辑 | O(N × M) |
| 位置更新 | 速度叠加 → 边界碰撞检测 → 反射反弹 | O(N) |
| 繁殖判定 | 能量 > 80% 阈值 && 随机概率 < 繁殖率 × 适应度 | O(N) |

**AI行为分支**：
- **生产者 (Producer)**: 仅白天光合作用获得能量，夜间休眠消耗（[L329-L341](file:///Users/tog/Desktop/code/solo/xyj-122/src/utils/ecosystemSimulator.ts#L329-L341)）
- **消费者 (Herbivore/Carnivore/Omnivore)**: 威胁检测 → 捕食/逃跑/漫游三态机（[L256-L328](file:///Users/tog/Desktop/code/solo/xyj-122/src/utils/ecosystemSimulator.ts#L256-L328)）
- **分解者 (Decomposer)**: 寻找到 `toRemove` 集合中的死亡个体，接近后分解获取能量（[L192-L255](file:///Users/tog/Desktop/code/solo/xyj-122/src/utils/ecosystemSimulator.ts#L192-L255)）

**空间邻近查询**：
- `findNearestPrey` / `findNearestPredator` / `findNearestDead` 均采用 **暴力线性扫描**
- 距离阈值截断：猎物 3.0 / 捕食者 2.5 / 尸体 3.0

---

### 2.3 状态管理层：Zustand Store

**核心文件**: [useEcosystemStore.ts](file:///Users/tog/Desktop/code/solo/xyj-122/src/store/useEcosystemStore.ts)

#### 实现原理
Zustand 作为 **不可变状态容器**，模拟层输出的增量变更通过批量操作合并进 Store：

**核心状态**（[L67-L138](file:///Users/tog/Desktop/code/solo/xyj-122/src/store/useEcosystemStore.ts#L67-L138)）：
- `organisms: Organism[]` — 生物数组（核心渲染源）
- `simulationTime` / `stableSimulationTime` — 模拟时钟
- `waterTemperature` / `lightIntensity` — 环境参数
- `dayNightCycle` — 昼夜循环状态（含 `lightFactor` 光照系数）
- `activeEvent` — 当前生态事件
- `history: HistorySnapshot[]` — 历史快照（倒放功能）

**批量更新接口**（关键设计）：
- `batchUpdateOrganisms` ( [L329-L340](file:///Users/tog/Desktop/code/solo/xyj-122/src/store/useEcosystemStore.ts#L329-L340) ): 用 `Map` 构建查找表，单次 `.map()` 遍历合并所有更新
- `batchRemoveOrganisms` ( [L342-L352](file:///Users/tog/Desktop/code/solo/xyj-122/src/store/useEcosystemStore.ts#L342-L352) ): 用 `Set` 构建排除集，单次 `.filter()` 完成删除

**派生计算**：
- `getStats()` ( [L598-L635](file:///Users/tog/Desktop/code/solo/xyj-122/src/store/useEcosystemStore.ts#L598-L635) ): 每次调用实时计算 `balanceIndex`（生态平衡指数），按理想比例 `45:25:10:10:10` 对比实际分布

---

### 2.4 3D场景容器层：`Aquarium3D`

**核心文件**: [Aquarium.tsx](file:///Users/tog/Desktop/code/solo/xyj-122/src/components/Aquarium3D/Aquarium.tsx)

#### 实现原理
基于 `@react-three/fiber` 的声明式 3D 场景 + `@react-three/postprocessing` 后处理：

**场景结构** (见 [L470-L523](file:///Users/tog/Desktop/code/solo/xyj-122/src/components/Aquarium3D/Aquarium.tsx#L470-L523))：
```
Canvas (shadows, antialias, fov=50)
├── <color background=0x0a1628> + <fog near=10 far=20>
├── SceneEnvironment
│   ├── ambientLight (动态强度)
│   ├── directionalLight (阴影贴图 1024²，随昼夜移动位置)
│   └── moonPointLight (仅夜晚激活)
├── DynamicPointLights (2个点光源，强度随昼夜变化)
├── Water (水体box，颜色随事件/昼夜动态变化)
├── Glass (5面玻璃墙，meshPhysicalMaterial transmission=0.95)
├── Substrate (800个沙子粒子点云)
├── LightRays (5个锥形光柱，缓慢旋转)
├── Bubbles (50个气泡点云，useFrame逐帧上升+重置)
├── organisms.map → <Organism3D /> (核心渲染对象)
├── ClickableArea (透明碰撞盒，接收点击放置生物)
├── EffectComposer → Bloom (辉光后处理，height=300)
├── TrackingCameraController (useFrame 相机追踪插值)
└── OrbitControls (交互相机控制)
```

**关键渲染特性**：
- **后处理管线**: `EffectComposer + Bloom` 实现辉光效果，降低分辨率到 `height=300` 以节省性能
- **水体着色**: `meshPhysicalMaterial` 开启 `transmission` 透射，模拟半透明水体（[L113-L122](file:///Users/tog/Desktop/code/solo/xyj-122/src/components/Aquarium3D/Aquarium.tsx#L113-L122)）
- **昼夜过渡**: `SceneEnvironment` 的 `useFrame` 以插值系数 0.03 缓慢过渡背景色和光照（[L419-L446](file:///Users/tog/Desktop/code/solo/xyj-122/src/components/Aquarium3D/Aquarium.tsx#L419-L446)）

---

### 2.5 个体生物渲染层：`Organism3D`

**核心文件**: [Organism.tsx](file:///Users/tog/Desktop/code/solo/xyj-122/src/components/Organisms/Organism.tsx)

#### 实现原理
**声明式组件 × 逐帧动画指令** 混合模式：每个生物一个 React 组件实例，内部通过 `useFrame` 读取 `organism.position/rotation/scale` 并写入 Three.js Object3D：

**数据映射关系** (见 [useFrame L52-L133](file:///Users/tog/Desktop/code/solo/xyj-122/src/components/Organisms/Organism.tsx#L52-L133))：

| Store 数据 | → | Three.js 属性 | 插值方式 |
|------------|---|---------------|----------|
| `organism.position` | → | `groupRef.position` | 直接 copy（模拟层已做移动） |
| `organism.rotation` | → | `groupRef.rotation.y` | `lerp(0.1)` 平滑 |
| `organism.scale` × highlight × sleep | → | `groupRef.scale` | `lerp(0.15)` 平滑 |
| `organism.state === 'sleeping'` | → | 尺寸×0.92 + 轻微上下浮动 | 正弦函数 |
| `species.trophicLevel` | → | 生产者摇摆 / 消费者游动摆动 | 正弦函数 × elapsedTime |

**视觉效果叠加**（条件渲染）：
- **生物发光** (`isBioluminescent`): 反向球体 + `meshBasicMaterial`，仅夜晚可见（`opacity = nightFactor × pulseGlow`）
- **选中/追踪光环**: 3层环形几何体 + 24粒子环绕点云（仅追踪时启用）
- **HTML 标签**: `@react-three/drei` 的 `<Html>` 组件，2D DOM 叠加在 3D 空间上方

**具体模型**（生产者/草食/肉食/分解者 四套）：
- 采用 **基础几何体组合** (Sphere/Cone/Cylinder) 而非外部模型，避免加载开销
- 每个模型自带独立 `useFrame` 做细节动画（尾巴摆动、叶片摇曳等）
- 每个模型含一个微型 `pointLight` (intensity 0.2~0.3) 提供局部照明

---

## 三、完整数据流图（文字版）

```
╔═══════════════════════════════════════════════════════════════════════════════════════╗
║                         模拟主循环 → 3D渲染 完整数据流图                               ║
╠═══════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                       ║
║  ┌──────────────────────┐                                                            ║
║  │  Browser rAF (60fps) │  ◄── 浏览器原生调度                                          ║
║  └──────────┬───────────┘                                                            ║
║             │ requestAnimationFrame(tick)                                             ║
║             ▼                                                                        ║
║  ┌─────────────────────────────────────────────────────────────┐                      ║
║  │  useEcosystemSimulation :: tick()  [每~60ms执行一次模拟]      │                      ║
║  │  ┌─────────────────────────────────────────────────────────┐│                      ║
║  │  │ 1. 事件系统                                            ││                      ║
║  │  │    ├─ createRandomEvent(): 低概率生成新事件             ││                      ║
║  │  │    └─ applyEventEffects(): 生成额外 updates/toRemove/  ││                      ║
║  │  │                        toAdd / 修改 waterColor        ││                      ║
║  │  ├─────────────────────────────────────────────────────────┤│                      ║
║  │  │ 2. 昼夜循环 updateDayNightCycle()                      ││                      ║
║  │  │    └─ 更新 timeOfDay → dayPhase → lightFactor         ││                      ║
║  │  ├─────────────────────────────────────────────────────────┤│                      ║
║  │  │ 3. 调用 simulateStep(organisms, temp, light, ...)      ││                      ║
║  │  └─────────────────────────────────────────────────────────┘│                      ║
║  └──────────────────────────┬──────────────────────────────────┘                      ║
║                             │ 返回 { updates[], toRemove[], toAdd[] }                   ║
║                             │ 合并事件额外效果后，批量写入 Zustand                       ║
║                             ▼                                                        ║
║  ╔════════════════════════════════════════════════════════════════════╗                 ║
║  ║  Zustand Store (不可变状态容器)                                     ║                 ║
║  ║  ┌──────────────────────────────────────────────────────────────┐ ║                 ║
║  ║  │ batchUpdateOrganisms(updates)                                │ ║                 ║
║  ║  │   └─ Map → organisms.map(o => ({...o, ...update}))          │ ║                 ║
║  ║  ├──────────────────────────────────────────────────────────────┤ ║                 ║
║  ║  │ batchRemoveOrganisms(ids)                                    │ ║                 ║
║  ║  │   └─ Set → organisms.filter(o => !idSet.has(o.id))          │ ║                 ║
║  ║  ├──────────────────────────────────────────────────────────────┤ ║                 ║
║  ║  │ toAdd.forEach → addOrganism(speciesId, position)            │ ║                 ║
║  ║  │   └─ createOrganism() 生成 id/随机速度/能量/年龄            │ ║                 ║
║  ║  ├──────────────────────────────────────────────────────────────┤ ║                 ║
║  ║  │ incrementTime() / checkChallenges() / recordSnapshot()      │ ║                 ║
║  ║  └──────────────────────────────────────────────────────────────┘ ║                 ║
║  ║                                                                      ║                 ║
║  ║  核心状态:                                                           ║                 ║
║  ║  ┌────────────┐  ┌──────────────────┐  ┌───────────────┐           ║                 ║
║  ║  │ organisms[]│  │ simulationTime   │  │ waterColor    │           ║                 ║
║  ║  └─────┬──────┘  └────────┬─────────┘  └──────┬────────┘           ║                 ║
║  ╚════════╪══════════════════╪════════════════════╪════════════════════╝                 ║
║           │                  │                    │                                     ║
║           │ useEcosystemStore(state => state.organisms)                                ║
║           │ useEcosystemStore(state => state.dayNightCycle)                             ║
║           ▼                  ▼                    ▼                                     ║
║  ╔════════════════════════════════════════════════════════════════════╗                 ║
║  ║  React Re-render 触发区                                             ║                 ║
║  ╠════════════════════════════════════════════════════════════════════╣                 ║
║  ║                                                                    ║                 ║
║  ║  ┌───────────────────────────────┐   ┌────────────────────────┐  ║                 ║
║  ║  │ Aquarium3D 父组件             │   │ 各 UI 面板组件         │  ║                 ║
║  ║  │ organisms.map → Organism3D   │   │ (EcosystemStats,       │  ║                 ║
║  ║  │   key={organism.id}          │   │  FoodWebPanel, ...)    │  ║                 ║
║  ║  └───────────────┬───────────────┘   └────────────────────────┘  ║                 ║
║  ╚══════════════════╪════════════════════════════════════════════════╝                 ║
║                     │                                                                   ║
║                     │ 每个生物创建/更新一个 Organism3D 组件实例                           ║
║                     ▼                                                                   ║
║  ╔════════════════════════════════════════════════════════════════════╗                 ║
║  ║  Organism3D 组件 × N (N = 生物数量)                                 ║                 ║
║  ╠════════════════════════════════════════════════════════════════════╣                 ║
║  ║                                                                    ║                 ║
║  ║  ┌─ React 声明部分:                                                ║                 ║
║  ║  │   <group ref=groupRef>                                          ║                 ║
║  ║  │     ├─ 生物模型 Producer/Herbivore/Carnivore/Decomposer        ║                 ║
║  ║  │     ├─ (可选) glow mesh / 选中rings / particles / Html标签     ║                 ║
║  ║  │   </group>                                                     ║                 ║
║  ║  │                                                                ║                 ║
║  ║  └─ useFrame 指令部分 (每帧执行 ~60fps):                           ║                 ║
║  ║      ┌──────────────────────────────────────────────────────┐    ║                 ║
║  ║      │ group.position.copy(organism.position)               │    ║                 ║
║  ║      │ group.rotation.y = lerp(..., organism.rotation, 0.1)│    ║                 ║
║  ║      │ group.scale.lerp(organism.scale × highlight, 0.15)  │    ║                 ║
║  ║      │ 附加: 游泳摆动 / 睡眠浮动 / 发光脉冲 / 光环动画       │    ║                 ║
║  ║      └──────────────────────────────────────────────────────┘    ║                 ║
║  ╚══════════════════════════════╤═════════════════════════════════════╝                 ║
║                                 │                                                       ║
║                                 │ Fiber → Three.js Scene Graph 更新                     ║
║                                 ▼                                                       ║
║  ╔════════════════════════════════════════════════════════════════════╗                 ║
║  ║  Three.js 渲染管线 (WebGL)                                         ║                 ║
║  ╠════════════════════════════════════════════════════════════════════╣                 ║
║  ║                                                                    ║                 ║
║  ║  1. Scene traversal → 收集可见 mesh / lights / cameras            ║                 ║
║  ║  2. Frustum culling / occlusion (Three.js 内部)                    ║                 ║
║  ║  3. Shadow map 生成 (directionalLight 1024×1024)                   ║                 ║
║  ║  4. 每个 mesh: material uniforms 更新 → draw call                  ║                 ║
║  ║  5. 后处理: EffectComposer → Bloom (降分辨率渲染)                   ║                 ║
║  ║  6. 最终输出到 Canvas                                              ║                 ║
║  ║                                                                    ║                 ║
║  ╚════════════════════════════════════════════════════════════════════╝                 ║
║                                                                                       ║
╚═══════════════════════════════════════════════════════════════════════════════════════╝
```

---

## 四、性能热点分析

### 4.1 模拟计算侧热点

| 热点位置 | 问题描述 | 触发条件 | 预估开销占比 |
|----------|----------|----------|------------|
| **`findNearestPrey/Predator/Dead`** ([L63-L133](file:///Users/tog/Desktop/code/solo/xyj-122/src/utils/ecosystemSimulator.ts#L63-L133)) | **O(N²) 暴力邻近搜索**：每个消费者遍历全量生物，距离计算含开平方 | 生物数 > 50 且多为消费者时 | ~40-60% (模拟CPU) |
| **`simulateStep` 整体循环** ([L155-L371](file:///Users/tog/Desktop/code/solo/xyj-122/src/utils/ecosystemSimulator.ts#L155-L371)) | 每个生物3~5次 `getSpeciesById()` 线性查找（`SPECIES.find()`）；大量临时 `THREE.Vector3` 对象创建 | 任意生物数 | ~15-20% |
| **`getStats()` 重复计算** ([L381-L416](file:///Users/tog/Desktop/code/solo/xyj-122/src/store/useEcosystemStore.ts#L381-L416) + [L598-L635](file:///Users/tog/Desktop/code/solo/xyj-122/src/store/useEcosystemStore.ts#L598-L635) + [L637-L684](file:///Users/tog/Desktop/code/solo/xyj-122/src/store/useEcosystemStore.ts#L637-L684)) | `incrementTime` → `getStats`；`recordSnapshot` → 再算一遍；`checkChallenges` → `getStats` + `computeLongestFoodChain`。**同帧内 balanceIndex 计算3+次** | 每次模拟tick | ~10-15% |
| **`recordSnapshot()` 序列化** ([L637-L684](file:///Users/tog/Desktop/code/solo/xyj-122/src/store/useEcosystemStore.ts#L637-L684)) | 每5帧全量 `serializeOrganism` (含 Vector3 → plain object)，数组拷贝，历史数组超出时头部删除（splice O(N)） | 生物数 > 100 | ~5-10% |

### 4.2 React / Fiber 侧热点

| 热点位置 | 问题描述 | 预估开销占比 |
|----------|----------|------------|
| **Store selector 过度订阅** | 多个UI组件通过 `useEcosystemStore(s => s.organisms)` 订阅全量数组，每次 `batchUpdateOrganisms` 生成新数组引用后，**所有订阅者全量 re-render** | UI面板: ~20-30% JS时间 |
| **`organisms.map` 整体重渲染** | Aquarium3D 订阅全量 organisms → 每次模拟后 N 个 Organism3D 组件 **全部 React reconciliation**（即使 Fiber diff 会复用 Three.js 对象，但函数组件函数体仍执行） | 生物 > 100: ~15-25% JS时间 |
| **每个 Organism3D 内部状态** | `useState(hovered)` + `useRef` ×7 + `useMemo(trackingParticles)` + `useFrame` 注册回调。**100个生物 = 100个useFrame** = 每帧100次 JS→Wasm边界穿越 | 生物 > 100: ~30-40% JS时间 |

### 4.3 GPU / Three.js 渲染热点

| 热点位置 | 问题描述 | 预估开销占比 |
|----------|----------|------------|
| **Draw Call 爆炸** | 每个生物平均 5~10 个 mesh（身体+眼睛+鳍+点光源+光环+粒子...），100个生物 = **~500-1000 draw calls/帧**。加上后处理 = 大量提交开销 | GPU: ~30-40% |
| **Shadow Map 重算** | `directionalLight.castShadow` + 生物模型 `castShadow`（默认开启？需要确认）。阴影贴图每帧重渲染 | GPU: ~15-25% |
| **每生物一个 PointLight** | [Producer L60](file:///Users/tog/Desktop/code/solo/xyj-122/src/components/Organisms/Producer.tsx#L60) / [Herbivore L137](file:///Users/tog/Desktop/code/solo/xyj-122/src/components/Organisms/Herbivore.tsx#L137)。点光源 = 延迟渲染/前向渲染额外pass。**100生物 = 100动态光源**，远超 WebGL 常见上限（通常8~16个） | GPU: ~25-35% |
| **后处理分辨率** | Bloom `height=300` 已是降采样，但 `EffectComposer` 的 render target 切换 + ping-pong buffer 仍有固定开销 | GPU: ~5-10% |

---

## 五、性能优化建议方向（3条核心方向）

### 方向一：空间索引 + 模拟降维（解决 O(N²) 邻近搜索）

**优化目标**: 将模拟计算开销降低 50%-70%

**具体措施**:

1. **统一网格空间划分 (Spatial Grid)**
   - 在 `simulateStep` 入口按 `cellSize = 3.0`（与捕食者/猎物距离阈值相同）建立 `Map<cellKey, Organism[]>`
   - 每个生物查询时只检查自身所在 cell + 周围 26 个相邻 cell
   - 理论复杂度从 O(N²) 降至 O(N × K)，K 为 cell 内平均数量（预期 5~15）
   - **代码落点**: 在 [ecosystemSimulator.ts L155](file:///Users/tog/Desktop/code/solo/xyj-122/src/utils/ecosystemSimulator.ts#L155) 前插入网格构建，`findNearestPrey/Predator/Dead` 改用网格查询

2. **距离计算平方化 + 懒开方**
   - 当前 `THREE.Vector3.distanceTo()` 内部含 `Math.sqrt`
   - 先比较 `distanceSq` 与 `thresholdSq`，需要实际距离值时才开平方

3. **物种配置缓存（消除重复 `find`）**
   - 在 `simulateStep` 入口构建一次 `Map<speciesId, Species>` 缓存
   - 循环内 `getSpeciesById` 改为 `speciesCache.get(organism.speciesId)`
   - 额外收益：`environmentalEffects` 去重 `seenSpecies` 也可基于 Map 优化

4. **`getStats` 计算合并**
   - `incrementTime` / `recordSnapshot` / `checkChallenges` 三处各自计算一遍 `balanceIndex`
   - 改为在模拟 tick 中 **计算1次** 存入 Store 的临时字段 `_lastStats`，三处复用结果
   - 预计减少重复遍历 2~3 次全量 organisms

---

### 方向二：渲染批处理 + 场景图优化（解决 Draw Call / 光源爆炸）

**优化目标**: 把 Draw Call 数压缩至 1/3~1/5，GPU 时间降低 40%+

**具体措施**:

1. **移除每生物 PointLight，改用烘焙光照贴图 / 全局探针**
   - 当前 100 生物 ≈ 100 动态光源是最大 GPU 瓶颈
   - 方案A（保守）: 仅保留前 N 个（如4~8个）距离相机最近的生物光源，其余关闭
   - 方案B（推荐）: 删除所有生物级 `pointLight`，用 `emissive` 自发光 + 环境光烘焙模拟局部照明效果；Water 体积增加内部泛光
   - **代码落点**: [Producer.tsx L60](file:///Users/tog/Desktop/code/solo/xyj-122/src/components/Organisms/Producer.tsx#L60), [Herbivore.tsx L137](file:///Users/tog/Desktop/code/solo/xyj-122/src/components/Organisms/Herbivore.tsx#L137) 及其他生物模型同理

2. **InstancedMesh 合并同类生物几何**
   - 对同一物种的多个实例，使用 `THREE.InstancedMesh` 共享 Geometry + Material
   - 每个物种 1 个 draw call，替换 N 个 draw call
   - 动画方案：在 `useFrame` 中通过 `instanceMatrix.setMatrixAt(i, matrix)` 更新每个实例的 position/rotation/scale，最后 `needsUpdate = true`
   - 迁移路径：新建 `SpeciesInstancedGroup` 组件，在 Aquarium3D 中按 speciesId 分组而非每个生物单独组件
   - 代价：选中/追踪光环、生物发光、hover 高亮等 per-instance 差异化效果需改用 shader attributes 实现（颜色/发光强度写进 InstancedBufferAttribute）

3. **阴影优化**
   - 缩小 shadow map: 1024² → 512²（视觉损失很小，但带宽减 75%）
   - **关闭生物级 `castShadow`**：小鱼/海草投射的阴影在有水雾散射时几乎不可见，巨大地浪费了 shadow map 生成时间
   - 只保留 `directionalLight` 的阴影用于地面投影
   - 开启 `shadow.autoUpdate = false` + 定时每 2~3 帧更新一次（场景中慢物体可接受）

---

### 方向三：React 订阅颗粒化 + 动画集中调度（解决 JS 主线程开销）

**优化目标**: 模拟后 re-render 时间降低 60%+，useFrame JS 回调减少 80%

**具体措施**:

1. **Zustand selector 精细化 + shallow 比较**
   - **EcosystemStats 面板**: 不订阅全量 `organisms`，改为在 Store 中增加 `derivedStats` 字段，模拟 tick 末尾更新一次；UI 仅订阅该字段
   - **FoodWebPanel**: 只订阅 `getPresentSpecies(organisms)` 的 Set，使用 `useEcosystemStore(s => getPresentSpecies(s.organisms), shallow)` 避免无变化时触发
   - **PopulationTrendChart**: 直接消费 `history` 数组快照，不订阅实时 `organisms`

2. **集中式 useFrame 管理器（单回调驱动 N 生物）**
   - 当前架构 = N 生物 × 独立 `useFrame` = N 次 Fiber 内部回调列表遍历
   - 新架构：建立 1 个全局 `useFrame`（放在 Aquarium3D 根下），维护 `Map<organismId, updateFn>` 注册表
   - 生物组件 mount 时注册 updateFn，unmount 时注销
   - 每帧在 **一次 JS 函数调用** 内批量执行所有 updateFn，减少 React Fiber 调度开销
   - 进一步：结合 InstancedMesh 方案，把位置/旋转矩阵更新直接写入 instanceMatrix，完全绕过 per-organism 组件

3. **模拟循环与 React 解耦（Web Worker 迁移）**
   - **终极方案**: 将整个 `simulateStep` + 事件系统 + 历史快照 迁移至 `Web Worker`
   - 主线程 ↔ Worker 通信协议：
     - 主线程发送: `{ type: 'ENV_UPDATE', waterTemperature, lightIntensity, ... }`
     - Worker 每60ms发送: `{ type: 'SIM_RESULT', updates, toRemove, toAdd, stats }`
   - 转移 ~50%+ JS CPU 负载离主线程，保证渲染帧率稳定
   - 注意：`THREE.Vector3` 需结构克隆（可直接用 `[x,y,z]` 数组传输减少序列化成本）
   - 与方向一的空间索引组合后，Worker 可支持 500+ 生物规模

---

## 六、总结

| 维度 | 当前架构 | 优化后预期 |
|------|---------|-----------|
| 模拟复杂度 | O(N²) 邻近搜索 | O(N) 网格划分，支持 3× 生物数 |
| JS 主线程 | 模拟 + UI + 动画混合 | 方向三 Worker 剥离后帧率稳定 60fps |
| GPU Draw Call | ~100生物 ≈ 800~1200 draw | 方向二 Instancing 后降至 ~100 以内 |
| 实时动态光源 | 每生物1个 (100+) | ≤ 8 个全局光源 |
| React re-render | 全量订阅爆炸 | selector 细化后 re-render 次数 ↓60% |

三条优化方向可并行实施无依赖：方向一最先落地（纯算法，不涉及架构变动），方向二其次（收益最大但需要重构渲染层），方向三压轴（解决终极扩展性）。
