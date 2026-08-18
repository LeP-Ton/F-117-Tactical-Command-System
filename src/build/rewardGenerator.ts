import { SeededRandom } from "../core/SeededRandom";
import { tacticalModules } from "./moduleRegistry";

export function generateRewardChoices(seed: string, ownedModuleIds: string[], rewardIndex: number): string[] {
  const random = new SeededRandom(`${seed}:REWARD:${rewardIndex}`);
  const pool = tacticalModules.filter((module) => !ownedModuleIds.includes(module.id));
  const choices: string[] = [];
  while (pool.length > 0 && choices.length < 3) {
    const index = random.integer(0, pool.length - 1);
    const [module] = pool.splice(index, 1);
    if (module) choices.push(module.id);
  }
  return choices;
}
