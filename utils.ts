
export const formatNumber = (num: number): string => {
  if (num === Infinity) return "∞";
  if (num < 1000) return Math.floor(num).toString();

  const suffixes = [
    "", "k", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc", 
    "Ud", "Dd", "Td", "Qad", "Qid", "Sxd", "Spd", "Ocd", "Nod", "Vig"
  ];

  const suffixIndex = Math.floor(Math.log10(num) / 3);
  
  if (suffixIndex >= suffixes.length) {
    return num.toExponential(2);
  }

  const normalized = num / Math.pow(1000, suffixIndex);
  return normalized.toFixed(2) + suffixes[suffixIndex];
};

export const serializeSave = (data: any): string => {
  return btoa(JSON.stringify(data));
};

export const deserializeSave = (str: string): any => {
  try {
    return JSON.parse(atob(str));
  } catch (e) {
    console.error("Save file corruption detected", e);
    return null;
  }
};
