export default function number2RBG(num: number) {
  num *= 22041998;
  let b = num & 0xFF,
      g = (num & 0xFF00) >>> 8,
      r = (num & 0xFF0000) >>> 16;
  return "rgb(" + [r, g, b].join(",") + ")";
}