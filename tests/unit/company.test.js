import { getCompanyBrand, getCompanyCif } from '../../company.js';

describe('Company Module', () => {
  test('getCompanyBrand returns Lateral Group', () => {
    expect(getCompanyBrand()).toBe('Lateral Group');
  });

  test('getCompanyCif returns 23067611', () => {
    expect(getCompanyCif()).toBe('23067611');
  });
});
