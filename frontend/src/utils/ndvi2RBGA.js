const colorRange = [
  [255, 0, 0],
  [0, 255, 0],
];
const value2Hex = [];
for (let value = 0; value <= 255; value++) {
  const hex = value.toString(16);
  value2Hex.push(hex.length == 1 ? "0" + hex : hex);
}

export default function ndvi2RBGA(ndvi) {
  if (ndvi < 0) return "#FFFFFF00";
  let rbg = "#";
  for (let i = 0; i < 3; i++) {
    const value = Math.floor(
      colorRange[0][i] * (1 - ndvi) + colorRange[1][i] * ndvi
    );
    rbg += value2Hex[value];
  }
  const rbga = rbg + "FF";
  return rbga;
}
