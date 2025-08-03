export const moodSongs = {
  happy: Array.from({ length: 100 }, (_, i) => ({
    title: `Happy Vibes ${i + 1}`,
    url: `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${(i % 3) + 1}.mp3`,
  })),
  sad: Array.from({ length: 100 }, (_, i) => ({
    title: `Rainy Days ${i + 1}`,
    url: `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${(i % 3) + 1}.mp3`,
  })),
  angry: Array.from({ length: 100 }, (_, i) => ({
    title: `Firestorm ${i + 1}`,
    url: `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${(i % 3) + 1}.mp3`,
  })),
};