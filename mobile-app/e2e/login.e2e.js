describe('MedField Login Flow', () => {
    beforeAll(async () => {
        await device.launchApp();
    });

    beforeEach(async () => {
        await device.reloadReactNative();
    });

    it('should show the login screen', async () => {
        await expect(element(by.text('Login'))).toBeVisible();
    });

    it('should allow a CHW to login', async () => {
        await element(by.id('username-input')).typeText('chw_user');
        await element(by.id('password-input')).typeText('password123');
        await element(by.id('login-button')).tap();

        await expect(element(by.text('Dashboard'))).toBeVisible();
    });
});
