import { describe, expect, it } from '@jest/globals';

import { redirectSystemPath } from '../../app/+native-intent';
import { FEEDBACK_EMAIL, feedbackUrl } from '../feedback';
import { toVoiceError } from '../voice';

describe('voice search on phones', () => {
  it('tells a parent when the microphone is blocked', () => {
    expect(toVoiceError('not-allowed')).toBe('denied');
    expect(toVoiceError('service-not-allowed')).toBe('denied');
  });

  it('treats silence as "didn\'t catch that"', () => {
    expect(toVoiceError('no-speech')).toBe('no-speech');
    expect(toVoiceError('speech-timeout')).toBe('no-speech');
  });

  it('treats anything else as a failure', () => {
    expect(toVoiceError('network')).toBe('failed');
  });
});

describe('opening Biro from the share sheet', () => {
  it('sends the iPhone share link to the catalogue', () => {
    expect(redirectSystemPath({ path: 'biro://dataUrl=biroShareKey', initial: true })).toBe('/');
  });

  it('leaves every other link alone', () => {
    expect(redirectSystemPath({ path: '/g/abc123', initial: true })).toBe('/g/abc123');
  });
});

describe('telling Luke something is wrong', () => {
  it('opens an email to the beta organiser with the details filled in', () => {
    const url = feedbackUrl('Biro beta: something not right', 'What happened?', 'Family link');
    expect(url.startsWith(`mailto:${FEEDBACK_EMAIL}?subject=Biro%20beta`)).toBe(true);
    const body = decodeURIComponent(url.split('&body=')[1]);
    expect(body).toContain('What happened?');
    expect(body).toContain('Family link · Biro ');
  });
});
