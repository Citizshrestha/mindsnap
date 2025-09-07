// src/data/hashtags.ts
export interface Hashtag {
  id: number;
  tag: string;
  postCount: number;
}

export const hashtagsData: Hashtag[] = [
  { id: 1, tag: "#Nature", postCount: 1500 },
  { id: 2, tag: "#Travel", postCount: 1200 },
  { id: 3, tag: "#Photography", postCount: 900 },
  { id: 4, tag: "#Adventure", postCount: 800 },
  { id: 5, tag: "#CityLife", postCount: 700 },
  { id: 6, tag: "#Sunset", postCount: 650 },
  { id: 7, tag: "#Beach", postCount: 600 },
  { id: 8, tag: "#Mountain", postCount: 550 },
  { id: 9, tag: "#Foodie", postCount: 500 },
  { id: 10, tag: "#Fitness", postCount: 450 },
  { id: 11, tag: "#Art", postCount: 400 },
  { id: 12, tag: "#Music", postCount: 350 },
  { id: 13, tag: "#Fashion", postCount: 300 },
  { id: 14, tag: "#Tech", postCount: 250 },
  { id: 15, tag: "#Gaming", postCount: 200 },
];