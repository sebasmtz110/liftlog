const HEIGHT = { 45: 64, 35: 56, 25: 48, 10: 36, 5: 28, 2.5: 22 };
const FILL = {
  45: "#1E4B8A",
  35: "#E2B000",
  25: "#1F7A45",
  10: "#F4F6F1",
  5: "#A33B32",
  2.5: "#1A211C",
};
const INK = { 35: "#1A211C", 10: "#1A211C" };

/** US commercial-gym plates on a 45 lb bar. Pairs, heaviest first. */
export function platesFor(pounds) {
  const total = Number(pounds);
  if (!Number.isFinite(total) || total <= 0) return { plates: [], remainder: 0, ready: false };
  if (total + 0.01 < 45) return { plates: [], remainder: total, ready: true };
  let side = (total - 45) / 2;
  const plates = [];
  for (const size of [45, 35, 25, 10, 5, 2.5]) {
    while (side >= size - 0.001 && plates.length < 8) {
      plates.push(size);
      side = Math.round((side - size) * 1000) / 1000;
    }
  }
  return { plates, remainder: side > 0.05 ? side : 0, ready: true };
}

export default function Plates({ pounds }) {
  const { plates, remainder, ready } = platesFor(pounds);
  if (!ready) return null;
  const side = plates.slice(0, 6);
  const label = side.length
    ? `45 lb bar, ${side.join(", ")} lb a side${remainder ? `, ${remainder} lb left over` : ""}`
    : "45 lb bar";
  return (
    <div className="plates" role="img" aria-label={label}>
      <span className="bar-sleeve" />
      {side.map((size, i) => (
        <span
          key={`${size}-${i}`}
          className="plate"
          style={{ height: HEIGHT[size], background: FILL[size], color: INK[size] || "#F4F6F1" }}
        >
          {size}
        </span>
      ))}
      {remainder > 0 && <span className="plate-left">{remainder} lb open</span>}
    </div>
  );
}
