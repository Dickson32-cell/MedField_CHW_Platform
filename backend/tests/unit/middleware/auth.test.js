const jwt = require('jsonwebtoken');
const { auth, authorize } = require('../../../src/middleware/auth');
const { User } = require('../../../src/models');

jest.mock('../../../src/models', () => ({
    User: {
        findByPk: jest.fn()
    }
}));

jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            headers: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        next = jest.fn();
        process.env.JWT_SECRET = 'testsecret';
    });

    it('should call next if token is valid', async () => {
        req.headers.authorization = 'Bearer validtoken';
        jwt.verify.mockReturnValue({ userId: 1 });
        User.findByPk.mockResolvedValue({ id: 1, is_active: true, role: 'chw' });

        await auth(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.userId).toBe(1);
        expect(req.user.role).toBe('chw');
    });

    it('should return 401 if no auth header', async () => {
        await auth(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'No token provided' }));
    });

    it('should return 401 if token is expired', async () => {
        req.headers.authorization = 'Bearer expired';
        const error = new Error('Expired');
        error.name = 'TokenExpiredError';
        jwt.verify.mockImplementation(() => { throw error; });

        await auth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Token expired' }));
    });

    it('should return 401 if user not found', async () => {
        req.headers.authorization = 'Bearer token';
        jwt.verify.mockReturnValue({ userId: 999 });
        User.findByPk.mockResolvedValue(null);

        await auth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'User not found' }));
    });

    it('should return 401 if user is inactive', async () => {
        req.headers.authorization = 'Bearer token';
        jwt.verify.mockReturnValue({ userId: 1 });
        User.findByPk.mockResolvedValue({ id: 1, is_active: false });

        await auth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Account is deactivated' }));
    });
});

describe('Authorize Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = { user: { role: 'chw' } };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        next = jest.fn();
    });

    it('should allow access if role matches', () => {
        authorize('chw')(req, res, next);
        expect(next).toHaveBeenCalled();
    });

    it('should deny access if role does not match', () => {
        authorize('admin')(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Access denied' }));
    });
});
