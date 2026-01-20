export function formatBytesToMB(bytes: number, decimals = 2) {
  const mb = bytes / (1024 * 1024);

  return parseFloat(mb.toFixed(decimals)) + ' MB';
}

export function capitalize(str: string) {
  if (!str) {
    return str;
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}
