export class EvaluationGetByUserRESP {
  total: number;
  haha: number;
  love: number;
  wow: number;
  sad: number;
  angry: number;
  like: number;
  isReaction: boolean;
  isPurchased: boolean;

  static of(total: number, emoji: any, isReaction: boolean, isPurchased: boolean) {
    return {
      total,
      haha: emoji.Haha,
      love: emoji.Love,
      wow: emoji.Wow,
      sad: emoji.Sad,
      angry: emoji.Angry,
      like: emoji.like,
      isReaction,
      isPurchased,
    };
  }
}
