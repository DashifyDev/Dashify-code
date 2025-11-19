export const rgbToHex = (rgb) => {
  if (!rgb || !rgb.startsWith("rgb")) return rgb;
  const result = /^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/.exec(rgb);
  if (!result) return rgb;
  const toHex = (c) => ("0" + parseInt(c, 10).toString(16)).slice(-2);
  return `#${toHex(result[1])}${toHex(result[2])}${toHex(result[3])}`;
};
