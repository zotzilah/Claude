import { describe, expect, it } from '@jest/globals';

import { extractUrl, parsePrice, parseProductPage } from '../product-page';

const URL_ = 'https://www.toyshop.example/p/unicorn-lamp';

describe('extractUrl', () => {
  it('finds a link inside shared text and trims trailing punctuation', () => {
    expect(extractUrl('Look at this!! https://shop.example/lamp?ref=1.')).toBe('https://shop.example/lamp?ref=1');
  });

  it('adds https:// to bare addresses', () => {
    expect(extractUrl('shop.example/lamp')).toBe('https://shop.example/lamp');
  });

  it.each(['', 'unicorn lamp', 'javascript:alert(1)', 'ftp://shop.example/x', 'https://localhost/x'])('rejects %p', (input) => {
    expect(extractUrl(input)).toBeNull();
  });
});

describe('parsePrice', () => {
  it.each([
    ['12.99', 1299],
    ['£1,299.00', 129900],
    ['1.299,00', 129900],
    [24.5, 2450],
    ['15', 1500],
    ['£ 7.50', 750],
  ])('reads %p as %p', (input, expected) => {
    expect(parsePrice(input)).toBe(expected);
  });

  it.each([null, undefined, '', 'free', -3, NaN])('rejects %p', (input) => {
    expect(parsePrice(input)).toBeNull();
  });
});

describe('parseProductPage', () => {
  it('reads schema.org Product JSON-LD', () => {
    const html = `<html><head><title>Unicorn Lamp | Toy Shop</title>
      <script type="application/ld+json">{"@context":"https://schema.org","@type":"Product","name":"Glitter Unicorn Lamp",
        "image":["https://cdn.toyshop.example/lamp.jpg"],"offers":{"@type":"Offer","price":"24.99","priceCurrency":"gbp"}}</script>
      </head></html>`;
    expect(parseProductPage(html, URL_)).toEqual({
      title: 'Glitter Unicorn Lamp',
      priceMinor: 2499,
      currency: 'GBP',
      imageUrl: 'https://cdn.toyshop.example/lamp.jpg',
      retailer: 'toyshop.example',
      url: URL_,
    });
  });

  it('finds the Product inside an @graph and an AggregateOffer', () => {
    const html = `<script type="application/ld+json">{"@graph":[{"@type":"WebPage"},{"@type":["Product","Thing"],"name":"Kite",
      "image":{"url":"/img/kite.png"},"offers":{"@type":"AggregateOffer","lowPrice":8.99,"priceCurrency":"EUR"}}]}</script>`;
    const details = parseProductPage(html, URL_);
    expect(details).toMatchObject({ title: 'Kite', priceMinor: 899, currency: 'EUR', imageUrl: 'https://www.toyshop.example/img/kite.png' });
  });

  it('falls back to Open Graph and product meta tags', () => {
    const html = `<meta property="og:title" content="Rock &amp; Roll Guitar &#8211; Kids">
      <meta property="og:site_name" content="Music Mart">
      <meta property="og:image" content="https://m.example/g.jpg">
      <meta property="product:price:amount" content="39.00">
      <meta property="product:price:currency" content="GBP">`;
    expect(parseProductPage(html, URL_)).toMatchObject({
      title: 'Rock & Roll Guitar',
      priceMinor: 3900,
      currency: 'GBP',
      imageUrl: 'https://m.example/g.jpg',
      retailer: 'Music Mart',
    });
  });

  it('copes with broken JSON-LD and missing prices', () => {
    const html = `<script type="application/ld+json">{ not json </script><title>Mystery Box - Buy Online</title>`;
    expect(parseProductPage(html, URL_)).toMatchObject({ title: 'Mystery Box', priceMinor: null, currency: null, imageUrl: null });
  });

  it('ignores unsafe image links', () => {
    const html = `<meta property="og:image" content="javascript:alert(1)"><meta property="og:title" content="X">`;
    expect(parseProductPage(html, URL_).imageUrl).toBeNull();
  });
});
