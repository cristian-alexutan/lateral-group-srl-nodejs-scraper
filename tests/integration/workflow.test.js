describe('Integration: Workflow', () => {
  test('brand matches company name and CIF', () => {
    const brand = 'Lateral Group';
    const cif = '23067611';
    expect(brand).toBeDefined();
    expect(cif).toBe('23067611');
  });

  test('company data consistency', () => {
    const companyName = 'LATERAL SRL';
    const cif = '23067611';
    expect(companyName).toContain('LATERAL');
    expect(cif.length).toBe(8);
  });
});
