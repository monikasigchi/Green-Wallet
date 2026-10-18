const envRate = (key, fallback) => {
  const value = Number(process.env[key]);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
};
export const REWARD_RATES = Object.freeze({
  paper: envRate("PAPER_POINTS_PER_KG", 10),
  newspapers: envRate("NEWSPAPERS_POINTS_PER_KG", 10),
  cardboard: envRate("CARDBOARD_POINTS_PER_KG", 8),
  metal: envRate("METAL_POINTS_PER_KG", 15),
  rigidPlastic: envRate("RIGID_PLASTIC_POINTS_PER_KG", 12),
  otherDry: envRate("OTHER_DRY_POINTS_PER_KG", 5)
});
export function calculateReward(weights) {
  const detail = Object.entries(weights).map(([category, kg]) => ({
    category, kg: Number(kg), rate: REWARD_RATES[category] ?? 0,
    points: Number(kg) * (REWARD_RATES[category] ?? 0)
  }));
  return { detail, points: Math.round(detail.reduce((sum, item) => sum + item.points, 0)) };
}
