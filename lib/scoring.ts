export interface Interaction {
  id: string;
  user_id: string;
  contact_id: string;
  direction: "sent" | "received";
  content: string;
  platform: string | null;
  logged_at: string;
}

export function calculateCharismaScore(interactions: Interaction[]): number {
  if (interactions.length === 0) return 50;

  let score = 100;

  // Sort by date descending
  const sorted = [...interactions].sort(
    (a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()
  );

  const lastInteraction = sorted[0];
  const now = new Date();
  const lastDate = new Date(lastInteraction.logged_at);
  const daysSince = Math.floor(
    (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Days since last interaction penalty
  if (daysSince <= 1) {
    score -= 0;
  } else if (daysSince <= 3) {
    score -= 10;
  } else if (daysSince <= 7) {
    score -= 20;
  } else if (daysSince <= 14) {
    score -= 35;
  } else {
    score -= 50;
  }

  // Direction bonuses/penalties
  if (lastInteraction.direction === "received") {
    score -= 15;
  } else {
    score += 5;
  }

  // Volume bonus: more than 5 interactions in last 7 days
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recentCount = interactions.filter(
    (i) => new Date(i.logged_at) >= sevenDaysAgo
  ).length;
  if (recentCount > 5) {
    score += 10;
  }

  // Clamp
  return Math.max(0, Math.min(100, score));
}

export function getDaysSinceLastInteraction(
  interactions: Interaction[]
): number {
  if (interactions.length === 0) return -1;
  const sorted = [...interactions].sort(
    (a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()
  );
  const now = new Date();
  const lastDate = new Date(sorted[0].logged_at);
  return Math.floor(
    (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
  );
}

export function getLastDirection(
  interactions: Interaction[]
): "sent" | "received" | null {
  if (interactions.length === 0) return null;
  const sorted = [...interactions].sort(
    (a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()
  );
  return sorted[0].direction;
}
