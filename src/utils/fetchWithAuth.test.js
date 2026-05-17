import { fetchWithAuth } from './fetchWithAuth';

describe('fetchWithAuth', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('calls fetch with credentials: include by default', async () => {
    global.fetch.mockResolvedValueOnce({ status: 200, ok: true });

    await fetchWithAuth('http://localhost:3001/api/data');

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/api/data', {
      credentials: 'include',
    });
  });

  test('passes through non-401 responses unchanged', async () => {
    const mockResponse = { status: 200, ok: true, json: async () => ({ data: 'test' }) };
    global.fetch.mockResolvedValueOnce(mockResponse);

    const response = await fetchWithAuth('http://localhost:3001/api/data');

    expect(response).toBe(mockResponse);
    expect(response.status).toBe(200);
  });

  test('calls onSessionExpired callback when response is 401', async () => {
    const onSessionExpired = jest.fn();
    global.fetch.mockResolvedValueOnce({ status: 401, ok: false });

    await fetchWithAuth('http://localhost:3001/api/data', {}, { onSessionExpired });

    expect(onSessionExpired).toHaveBeenCalled();
  });

  test('does not call onSessionExpired when response is 200', async () => {
    const onSessionExpired = jest.fn();
    global.fetch.mockResolvedValueOnce({ status: 200, ok: true });

    await fetchWithAuth('http://localhost:3001/api/data', {}, { onSessionExpired });

    expect(onSessionExpired).not.toHaveBeenCalled();
  });

  test('does not call onSessionExpired when response is 500', async () => {
    const onSessionExpired = jest.fn();
    global.fetch.mockResolvedValueOnce({ status: 500, ok: false });

    await fetchWithAuth('http://localhost:3001/api/data', {}, { onSessionExpired });

    expect(onSessionExpired).not.toHaveBeenCalled();
  });

  test('does not throw when onSessionExpired is not provided and 401 is received', async () => {
    global.fetch.mockResolvedValueOnce({ status: 401, ok: false });

    const response = await fetchWithAuth('http://localhost:3001/api/data');

    expect(response.status).toBe(401);
  });

  test('merges caller-supplied options with default credentials', async () => {
    global.fetch.mockResolvedValueOnce({ status: 200, ok: true });

    await fetchWithAuth('http://localhost:3001/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/api/data', {
      credentials: 'include',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
  });
});
