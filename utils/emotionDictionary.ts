export type EmotionCategory = "happy" | "sad" | "anxious" | "calm" | "angry";

export type EmotionProfile = {
  words: string[];
  color: string;
  speed: number;
  turbulence: number;
};

export const emotionKeywords: Record<EmotionCategory, EmotionProfile> = {
  happy: {
    words: [
      "开心",
      "高兴",
      "快乐",
      "棒",
      "哈哈",
      "美食",
      "爱",
      "顺利",
      "兴奋",
      "期待",
      "幸福",
      "满足",
      "惊喜",
    ],
    color: "#f97316",
    speed: 0.85,
    turbulence: 0.3,
  },
  sad: {
    words: [
      "低落",
      "难过",
      "悲伤",
      "失落",
      "孤独",
      "想哭",
      "空虚",
      "无助",
      "沮丧",
      "心碎",
      "遗憾",
      "疲惫",
    ],
    color: "#1e3a8a",
    speed: 0.15,
    turbulence: 0.4,
  },
  anxious: {
    words: [
      "焦虑",
      "紧张",
      "担心",
      "压力",
      "烦躁",
      "不安",
      "内耗",
      "失眠",
      "纠结",
      "害怕",
      "迷茫",
      "恐慌",
    ],
    color: "#ef4444",
    speed: 0.75,
    turbulence: 0.85,
  },
  calm: {
    words: [
      "平静",
      "放松",
      "安静",
      "温柔",
      "治愈",
      "舒服",
      "释然",
      "踏实",
      "惬意",
      "安宁",
      "舒缓",
      "从容",
    ],
    color: "#10b981",
    speed: 0.35,
    turbulence: 0.15,
  },
  angry: {
    words: [
      "愤怒",
      "生气",
      "火大",
      "崩溃",
      "讨厌",
      "烦死",
      "恼火",
      "暴怒",
      "不爽",
      "抓狂",
      "怨恨",
      "争执",
    ],
    color: "#a855f7",
    speed: 0.9,
    turbulence: 0.95,
  },
};
