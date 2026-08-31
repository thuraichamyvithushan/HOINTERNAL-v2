import { getRoleHomePath } from './utils/authHelpers';

describe('getRoleHomePath', () => {
  test('returns the AU influencer dashboard for Australian influencers', () => {
    expect(getRoleHomePath({ role: 'influencer', country: 'Australia' })).toBe('/influencer-page');
  });

  test('returns the NZ influencer dashboard for New Zealand influencers', () => {
    expect(getRoleHomePath({ role: 'influencer', country: 'New Zealand' })).toBe('/influencer-page-nz');
  });

  test('falls back to the default AU home route for unknown roles', () => {
    expect(getRoleHomePath({ role: 'unknown', country: 'Australia' })).toBe('/home');
  });
});
