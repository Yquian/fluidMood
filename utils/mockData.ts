import { format, subDays } from "date-fns";

export type EmotionRecord = {
  /** 数据库记录 id；Mock 数据没有该字段 */
  id?: number;
  /** YYYY-MM-DD */
  date: string;
  primaryColor: string;
  secondaryColor: string;
  /** 用户写下的原始内容 */
  text?: string;
  echo: string;
  tags: string[];
};

// 情绪色系参考 moodEngine.txt 的色彩心理学映射：
// 暖色（开心/温暖）、自然色（平静/治愈）、冷暗色（悲伤/低落）、高对比色（焦虑/愤怒）
const PALETTES: Array<Pick<EmotionRecord, "primaryColor" | "secondaryColor">> = [
  // 开心 / 温暖
  { primaryColor: "#FBBF24", secondaryColor: "#F97316" },
  { primaryColor: "#F97316", secondaryColor: "#EC4899" },
  { primaryColor: "#EC4899", secondaryColor: "#FBBF24" },
  // 平静 / 治愈
  { primaryColor: "#10B981", secondaryColor: "#3B82F6" },
  { primaryColor: "#3B82F6", secondaryColor: "#A78BFA" },
  { primaryColor: "#10B981", secondaryColor: "#A78BFA" },
  // 悲伤 / 低落 / 孤独
  { primaryColor: "#475569", secondaryColor: "#1E3A8A" },
  { primaryColor: "#1E3A8A", secondaryColor: "#0F172A" },
  // 焦虑 / 愤怒 / 压力
  { primaryColor: "#EF4444", secondaryColor: "#7F1D1D" },
  { primaryColor: "#A855F7", secondaryColor: "#EF4444" },
  { primaryColor: "#7F1D1D", secondaryColor: "#A855F7" },
  // 情绪交叠：低落里透出一点柔软
  { primaryColor: "#475569", secondaryColor: "#A78BFA" },
];

const ENTRIES: Array<Pick<EmotionRecord, "echo" | "tags">> = [
  { echo: "今天的阳光刚好落在肩上，心里也亮了一块。", tags: ["生活", "小确幸"] },
  { echo: "忙碌里偷到一点甜，小确幸真的会发光。", tags: ["工作", "充实"] },
  { echo: "被晚风轻轻抱了一下，紧绷的情绪松开了。", tags: ["朋友", "陪伴"] },
  { echo: "有些事不必完美，今天已经很努力了。", tags: ["家人", "温暖"] },
  { echo: "和喜欢的人说了很多话，连沉默都很舒服。", tags: ["美食", "满足"] },
  { echo: "把烦恼写在纸上，再慢慢折成一只小船。", tags: ["散步", "放松"] },
  { echo: "雨声很轻，心里的褶皱也被熨平了一些。", tags: ["音乐", "治愈"] },
  { echo: "今天有点累，但依然值得被温柔对待。", tags: ["独处", "平静"] },
  { echo: "偶然抬头看见晚霞，觉得生活还藏着惊喜。", tags: ["阅读", "安静"] },
  { echo: "给自己泡了杯热茶，慢慢等心情回温。", tags: ["咖啡", "惬意"] },
  { echo: "把事情一件件做完，踏实感悄悄长出来。", tags: ["加班", "疲惫"] },
  { echo: "有些难过说不出口，就先好好抱抱自己。", tags: ["想念", "柔软"] },
  { echo: "走过熟悉的路口，忽然想起很久以前。", tags: ["雨天", "低气压"] },
  { echo: "深呼吸三次，世界重新变得宽阔。", tags: ["晚霞", "惊喜"] },
  { echo: "深夜的思绪有点吵，但天亮后会好一些。", tags: ["运动", "畅快"] },
  { echo: "一顿热乎乎的饭，把空落落的心填满了。", tags: ["旅行", "期待"] },
  { echo: "今天的自己很勇敢，接住了一次小崩溃。", tags: ["睡眠", "恢复"] },
  { echo: "把期待放低一点，反而收获了轻松。", tags: ["记录", "自省"] },
  { echo: "听见喜欢的歌，脚步都变得轻快起来。", tags: ["电影", "沉浸"] },
  { echo: "一个人待着也很好，安静里藏着力量。", tags: ["计划", "笃定"] },
  { echo: "和朋友聊到很晚，烦恼被分走了一半。", tags: ["阳光", "轻快"] },
  { echo: "走进阳光里，连影子都变得温柔。", tags: ["挑战", "勇敢"] },
  { echo: "事情没有想象中糟糕，先好好睡一觉。", tags: ["松弛", "释然"] },
  { echo: "今天完成了拖延很久的事，值得庆祝。", tags: ["深夜", "思绪"] },
  { echo: "在人群里有点局促，但也慢慢自在了。", tags: ["拥抱", "安心"] },
  { echo: "风把云吹散的时候，心也跟着敞亮了。", tags: ["成长", "坚定"] },
  { echo: "允许自己慢一点，花期本来就不一样。", tags: ["自然", "呼吸"] },
  { echo: "陌生人的一句谢谢，让今天变得柔软。", tags: ["整理", "秩序"] },
  { echo: "把手机放下，发现窗外夜色很温柔。", tags: ["感恩", "柔软"] },
  { echo: "无论今天如何，都认真生活过了。", tags: ["日常", "温柔"] },
];

/**
 * 生成过去 N 天的 Mock 情绪记录（含今天）。
 * 服务端组件调用可保证日期稳定，避免客户端水合不一致。
 */
export function createMockEmotionRecords(
  days = 30,
  reference: Date = new Date()
): EmotionRecord[] {
  return Array.from({ length: days }, (_, index) => {
    const date = format(subDays(reference, days - 1 - index), "yyyy-MM-dd");
    const palette = PALETTES[index % PALETTES.length];
    const entry = ENTRIES[index % ENTRIES.length];

    return { date, ...palette, ...entry };
  });
}

export const mockEmotionRecords = createMockEmotionRecords();
