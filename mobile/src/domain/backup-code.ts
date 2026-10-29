// How backup codes (Settings → Account) are written down.

/** "k7pm qx4r-9dwn h3tb" → "K7PM-QX4R-9DWN-H3TB": how the code is shown, however it was typed. */
export function formatBackupCode(typed: string): string {
  const letters = typed.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return letters.match(/.{1,4}/g)?.join('-') ?? '';
}
