/** Generate a sample experiment CSV for demo purposes. */
export function generateSampleCSV(): File {
  const lines = ["subject_id,group,score,age,gender,pre_score,post_score"];

  // Simple seeded PRNG
  let seed = 42;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const randn = () => {
    const u1 = rand(), u2 = rand();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  };

  const genders = ["male", "female"];

  for (let i = 1; i <= 150; i++) {
    const isT = i <= 75;
    const group = isT ? "treatment" : "control";
    const score = (isT ? 78 + 12 * randn() : 72 + 12 * randn()).toFixed(1);
    const age = Math.floor(18 + rand() * 27);
    const gender = genders[Math.floor(rand() * 2)];
    const pre = (65 + 10 * randn()).toFixed(1);
    const post = (Number(pre) + (isT ? 8 : 2) + 5 * randn()).toFixed(1);

    // Add 2 missing values
    const scoreVal = i === 11 || i === 105 ? "" : score;

    lines.push(`${i},${group},${scoreVal},${age},${gender},${pre},${post}`);
  }

  return new File([lines.join("\n")], "experiment.csv", { type: "text/csv" });
}
