// src/pkg/emojiCatalog.ts
export interface EmojiPack {
  id: string;            // 分组 id
  name: string;          // 分组名
  icon?: string;         // Tab 上的小图标（可用 emoji）
  keys: string[];        // 使用 EMOJI_MAP 中的 key
}

export const EMOJI_PACKS: EmojiPack[] = [
  {
    id: "gopher",
    name: "Gopher",
    icon: "🐹",
    keys: [
      "gopher_happy","gopher_wink","gopher_smiling","gopher_smiling_blushing",
      "gopher_smiling_sweat","gopher_heart","gopher_heart_eyes","gopher_thinking",
      "gopher_wondering","gopher_confused","gopher_not_sure_if","gopher_facepalm",
      "gopher_eyeroll","gopher_idea","gopher_mind_blown","gopher_trying_hard",
      "gopher_victorious","gopher_pirate","gopher_neutral","gopher_expressionless",
      "gopher_sleepy","gopher_sleeping","gopher_tired","gopher_sick",
      "gopher_sad","gopher_sad_sweat","gopher_crying","gopher_crying_river",
      "gopher_no_peeking","gopher_dead","gopher_insomnia",
    ],
  },
  // 以后新增：
  // { id: "cat", name: "Cat", icon: "🐱", keys: ["cat_happy", ...] },
  // { id: "meme", name: "Meme", icon: "😂", keys: ["meme_okay", ...] },
];
