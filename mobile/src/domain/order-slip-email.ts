/**
 * The order slip email sent to the account holder when the child presses
 * "Send to Mum & Dad" (brief §6.1). Pure: the backend sends it.
 *
 * Email clients are hostile to modern CSS (Outlook ignores much of it, Gmail strips
 * <style> blocks), so this uses tables, inline styles and web-safe fonts only.
 */
import type { ListSettings, Product, Stars } from './types';
import { formatMoney } from './wishlist';

export interface OrderSlipInput {
  settings: ListSettings;
  wishes: { product: Product; stars: Stars }[];
  /** "Your number is 47." */
  queueNumber: number;
  sentAt: Date;
  /** Where the parent manages the list, e.g. the app or the Giver link. */
  listUrl: string;
  locale?: string;
}

export interface Email {
  subject: string;
  /** Short preview text that inboxes show next to the subject. */
  preheader: string;
  html: string;
  text: string;
}

const C = { red: '#d8141c', ink: '#15161a', soft: '#5a5f6b', paper: '#fbfaf4', blue: '#0b3c9c', biro: '#1d3fc4', bg: '#072a6e' };

export function renderOrderSlipEmail(input: OrderSlipInput): Email {
  const { settings, wishes, queueNumber, sentAt, listUrl, locale = 'en-GB' } = input;
  const name = settings.circlerName || 'Your child';
  const totalMinor = wishes.reduce((sum, w) => sum + w.product.priceMinor, 0);
  const money = (minor: number) => formatMoney(minor, settings.currency, locale);
  const when = sentAt.toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' });
  const count = wishes.length === 1 ? '1 item' : `${wishes.length} items`;

  const subject = `${name} has sent their ${settings.template === 'christmas' ? 'Christmas ' : ''}list! (${count})`;
  const preheader = `${count} circled, ${money(totalMinor)} in total. Your number is ${queueNumber}.`;

  const rows = wishes
    .map(
      ({ product, stars }) => `
        <tr>
          <td style="padding:6px 8px 6px 0;font:13px 'Courier New',Courier,monospace;color:${C.ink};vertical-align:top;white-space:nowrap">${esc(product.catalogueNo || 'YOURS')}</td>
          <td style="padding:6px 8px;font:13px 'Courier New',Courier,monospace;color:${C.ink};vertical-align:top">
            <a href="${esc(product.url)}" style="color:${C.ink};text-decoration:none">${esc(product.title)}</a><br>
            <span style="color:${C.biro};font-size:15px" aria-label="${stars} star${stars > 1 ? 's' : ''}">${'★'.repeat(stars)}</span>
            <span style="color:${C.soft};font-size:11px">${esc(product.retailer)}</span>
          </td>
          <td align="right" style="padding:6px 0 6px 8px;font:13px 'Courier New',Courier,monospace;color:${C.ink};vertical-align:top;white-space:nowrap">${esc(money(product.priceMinor))}</td>
        </tr>`,
    )
    .join('');

  const rule = `<tr><td colspan="3" style="padding:8px 0;font:13px 'Courier New',Courier,monospace;color:#9aa0aa;text-align:center">- - - - - - - - - - - - - - - - -</td></tr>`;

  const html = `<!doctype html>
<html lang="${esc(locale.split('-')[0])}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>${esc(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${C.bg}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg}">
  <tr><td align="center" style="padding:24px 12px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:440px">
      <tr><td style="background:#20242e;border-radius:12px 12px 0 0;padding:12px 16px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="font:bold 12px Arial,Helvetica,sans-serif;letter-spacing:1px;color:#cfd6e6">BIRO · COUNTER 3</td>
          <td align="right"><span style="display:inline-block;background:#9fd36b;color:#17310a;font:bold 16px 'Courier New',Courier,monospace;padding:2px 8px">${esc(money(totalMinor))}</span></td>
        </tr></table>
      </td></tr>
      <tr><td style="background:${C.paper};padding:20px 18px 24px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td colspan="3" align="center" style="font:900 22px 'Arial Black',Arial,Helvetica,sans-serif;color:${C.red};letter-spacing:1px">ORDER SLIP</td></tr>
          <tr><td colspan="3" align="center" style="padding-top:4px;font:13px 'Courier New',Courier,monospace;color:${C.ink}">${esc(settings.title)}<br>${esc(when)}</td></tr>
          ${rule}
          ${rows || `<tr><td colspan="3" align="center" style="font:13px 'Courier New',Courier,monospace;color:${C.ink}">Nothing circled this time!</td></tr>`}
          ${rule}
          <tr>
            <td colspan="2" style="font:bold 15px 'Courier New',Courier,monospace;color:${C.ink}">${esc(count.toUpperCase())}</td>
            <td align="right" style="font:bold 15px 'Courier New',Courier,monospace;color:${C.ink};white-space:nowrap">${esc(money(totalMinor))}</td>
          </tr>
          <tr><td colspan="3" style="padding-top:16px">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:3px solid ${C.ink}">
              <tr><td align="center" style="padding:10px;font:13px 'Courier New',Courier,monospace;color:${C.ink}">
                YOUR NUMBER IS<br>
                <span style="font:900 44px 'Arial Black',Arial,Helvetica,sans-serif;color:${C.red};line-height:1.1">${queueNumber}</span><br>
                PLEASE WAIT FOR CHRISTMAS
              </td></tr>
            </table>
          </td></tr>
          <tr><td colspan="3" align="center" style="padding-top:20px">
            <a href="${esc(listUrl)}" style="display:inline-block;background:${C.red};color:#ffffff;font:bold 16px Arial,Helvetica,sans-serif;text-decoration:none;padding:12px 22px;border-radius:10px">See the list</a>
          </td></tr>
        </table>
      </td></tr>
      <tr><td align="center" style="padding:16px 8px;font:12px Arial,Helvetica,sans-serif;color:#b9c8ee;line-height:1.5">
        You're getting this because you set up ${esc(name)}'s list on Biro.<br>
        Share the list with family from the app, and the surprise stays a surprise.
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  const width = 44;
  const line = '-'.repeat(width);
  const text = [
    'ORDER SLIP',
    settings.title,
    when,
    line,
    ...(wishes.length
      ? wishes.map(({ product, stars }) =>
          `${(product.catalogueNo || 'YOURS').padEnd(9)} ${product.title} ${'*'.repeat(stars)}\n${' '.repeat(10)}${money(product.priceMinor)}  ${product.url}`,
        )
      : ['Nothing circled this time!']),
    line,
    `${count.toUpperCase()}`.padEnd(width - money(totalMinor).length) + money(totalMinor),
    '',
    `YOUR NUMBER IS ${queueNumber}. PLEASE WAIT FOR CHRISTMAS.`,
    '',
    `See the list: ${listUrl}`,
  ].join('\n');

  return { subject, preheader, html, text };
}

function esc(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
