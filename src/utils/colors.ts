export function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 245, g: 158, b: 11 }; // fallback to amber-500
}

function mix(color1: {r: number, g: number, b: number}, color2: {r: number, g: number, b: number}, weight: number) {
  return {
    r: Math.round(color1.r * weight + color2.r * (1 - weight)),
    g: Math.round(color1.g * weight + color2.g * (1 - weight)),
    b: Math.round(color1.b * weight + color2.b * (1 - weight))
  };
}

export function generatePalette(baseHex: string) {
  const base = hexToRgb(baseHex);
  const white = { r: 255, g: 255, b: 255 };
  const black = { r: 0, g: 0, b: 0 };
  
  return {
    50: mix(white, base, 0.9),
    100: mix(white, base, 0.8),
    200: mix(white, base, 0.6),
    300: mix(white, base, 0.4),
    400: mix(white, base, 0.2),
    500: base,
    600: mix(black, base, 0.9),
    700: mix(black, base, 0.7),
    800: mix(black, base, 0.5),
    900: mix(black, base, 0.3),
    950: mix(black, base, 0.15),
  };
}

export function getThemeStyles(hex: string) {
  const palette = generatePalette(hex);
  return `
    :root {
      --theme-50: rgb(${palette[50].r}, ${palette[50].g}, ${palette[50].b});
      --theme-100: rgb(${palette[100].r}, ${palette[100].g}, ${palette[100].b});
      --theme-200: rgb(${palette[200].r}, ${palette[200].g}, ${palette[200].b});
      --theme-300: rgb(${palette[300].r}, ${palette[300].g}, ${palette[300].b});
      --theme-400: rgb(${palette[400].r}, ${palette[400].g}, ${palette[400].b});
      --theme-500: rgb(${palette[500].r}, ${palette[500].g}, ${palette[500].b});
      --theme-600: rgb(${palette[600].r}, ${palette[600].g}, ${palette[600].b});
      --theme-700: rgb(${palette[700].r}, ${palette[700].g}, ${palette[700].b});
      --theme-800: rgb(${palette[800].r}, ${palette[800].g}, ${palette[800].b});
      --theme-900: rgb(${palette[900].r}, ${palette[900].g}, ${palette[900].b});
      --theme-950: rgb(${palette[950].r}, ${palette[950].g}, ${palette[950].b});
    }
  `;
}
