import { db } from "./index";
import { moodEntries } from "./schema";

const now = new Date();
const daysAgo = (days: number) =>
  new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

const entries = [
  {
    createdAt: daysAgo(4),
    text: "项目终于顺利上线了，和团队一起吃了顿火锅，整个人都轻飘飘的。",
    primaryColor: "#FBBF24",
    secondaryColor: "#F97316",
    speed: 0.85,
    turbulence: 0.3,
    tags: JSON.stringify(["工作", "美食", "满足"]),
    echo: "忙碌后的热汤和笑声，是最好的奖励。",
  },
  {
    createdAt: daysAgo(3),
    text: "傍晚一个人去江边走了走，风很轻，心里的褶皱也被慢慢抚平。",
    primaryColor: "#10B981",
    secondaryColor: "#3B82F6",
    speed: 0.35,
    turbulence: 0.2,
    tags: JSON.stringify(["散步", "平静", "治愈"]),
    echo: "把脚步放慢，情绪也会跟着安静下来。",
  },
  {
    createdAt: daysAgo(2),
    text: "今天有点低落，想说的话到了嘴边又咽了回去，只想早点睡觉。",
    primaryColor: "#475569",
    secondaryColor: "#1E3A8A",
    speed: 0.15,
    turbulence: 0.45,
    tags: JSON.stringify(["独处", "疲惫", "想念"]),
    echo: "有些难过不必急着解释，先好好抱抱自己。",
  },
  {
    createdAt: daysAgo(1),
    text: "临时接到一堆需求，脑子乱成一团，深呼吸了好几次才缓过来。",
    primaryColor: "#EF4444",
    secondaryColor: "#7F1D1D",
    speed: 0.7,
    turbulence: 0.9,
    tags: JSON.stringify(["加班", "压力", "焦虑"]),
    echo: "事情没有想象中糟糕，一件一件来就好。",
  },
  {
    createdAt: daysAgo(0),
    text: "收到了朋友寄来的明信片，窗外刚好有晚霞，突然觉得生活很温柔。",
    primaryColor: "#EC4899",
    secondaryColor: "#A78BFA",
    speed: 0.5,
    turbulence: 0.35,
    tags: JSON.stringify(["朋友", "晚霞", "惊喜"]),
    echo: "被惦记的感觉，会在心里亮很久。",
  },
];

const result = db.insert(moodEntries).values(entries).run();

console.log(`已插入 ${result.changes} 条情绪日记 Mock 数据`);
