import { describe, it, expect } from 'vitest';
import { mongoSanitize } from '../middleware/mongoSanitize.middleware.js';

describe('NoSQL Query Injection Sanitizer Middleware', () => {
  const makeMockReq = (body = {}, query = {}, params = {}) => ({
    body,
    query,
    params,
  });

  const makeMockRes = () => ({});
  const makeMockNext = () => () => {};

  it('should remove keys starting with $ or containing a dot in req.body, req.query, and req.params', () => {
    const req = makeMockReq(
      {
        username: 'normal_user',
        password: { $gt: '' },
        profile: {
          'nested.key': 'bad',
          safeKey: 'good',
        },
      },
      {
        sort: '-createdAt',
        '$where': 'function() {}',
        'filter.name': 'admin',
      },
      {
        id: '123',
        '$id': '456',
      }
    );

    mongoSanitize(req, makeMockRes(), makeMockNext());

    // Verify req.body
    expect(req.body.username).toBe('normal_user');
    expect(req.body.password.$gt).toBeUndefined();
    expect(req.body.profile['nested.key']).toBeUndefined();
    expect(req.body.profile.safeKey).toBe('good');

    // Verify req.query
    expect(req.query.sort).toBe('-createdAt');
    expect(req.query['$where']).toBeUndefined();
    expect(req.query['filter.name']).toBeUndefined();

    // Verify req.params
    expect(req.params.id).toBe('123');
    expect(req.params['$id']).toBeUndefined();
  });

  it('should handle nested arrays inside objects', () => {
    const req = makeMockReq({
      items: [
        { name: 'item1', price: { $ne: null } },
        { name: 'item2', 'meta.info': 'nested' },
      ],
    });

    mongoSanitize(req, makeMockRes(), makeMockNext());

    expect(req.body.items[0].name).toBe('item1');
    expect(req.body.items[0].price.$ne).toBeUndefined();
    expect(req.body.items[1].name).toBe('item2');
    expect(req.body.items[1]['meta.info']).toBeUndefined();
  });
});
