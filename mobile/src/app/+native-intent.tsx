/**
 * The iPhone share sheet opens Biro with a link like `biro://dataUrl=biroShareKey`, which
 * isn't a page. Send it to the catalogue; SharedLinkOpener then opens "Add from a link".
 */
export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  return path.includes('dataUrl=') ? '/' : path;
}
