const { User } = require('../../src/models');
const bcrypt = require('bcryptjs');

describe('User Model', () => {
    it('should create a user with valid data', async () => {
        const userData = {
            username: 'testu_chw',
            password: 'password123',
            role: 'chw',
            email: 'chw@example.com',
            full_name: 'Test CHW'
        };
        const user = await User.create(userData);
        expect(user.username).toBe(userData.username);
        expect(user.role).toBe(userData.role);
        expect(user.password).not.toBe(userData.password); // Should be hashed
    });

    it('should hash the password before saving', async () => {
        const user = await User.create({
            username: 'hasher',
            password: 'mypassword',
            role: 'admin'
        });
        const isValid = await bcrypt.compare('mypassword', user.password);
        expect(isValid).toBe(true);
    });

    it('should not allow duplicate usernames', async () => {
        await User.create({ username: 'dup', password: 'p1', role: 'chw' });
        await expect(User.create({ username: 'dup', password: 'p2', role: 'chw' }))
            .rejects.toThrow();
    });

    it('should allow identifying chw role', async () => {
        const user = await User.create({ username: 'chw1', password: 'p1', role: 'chw' });
        expect(user.role).toBe('chw');
    });

    it('should set default is_active to true', async () => {
        const user = await User.create({ username: 'active', password: 'p1', role: 'chw' });
        expect(user.is_active).toBe(true);
    });
});
