const API_BASE_URL = '/api/v1';

/**
 * PathDB API Service
 */
export const api = {
    /**
     * Common headers for all requests
     */
    getHeaders() {
        return {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/plain, */*'
        };
    },

    /**
     * Authenticates user and returns a login token.
     */
    async login(username, password) {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ username, password })
        });
        const result = await response.json();
        if (!result.success) throw new Error('Login failed');
        return result.data; // loginToken
    },

    /**
     * Opens a session using a login token.
     */
    async openSession(loginToken) {
        const response = await fetch(`${API_BASE_URL}/auth/session`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ loginToken })
        });
        const result = await response.json();
        if (!result.success) throw new Error('Failed to open session');
        return result.data; // sessionToken
    },

    /**
     * Executes a PathDB query.
     */
    async executeQuery(query, loginToken, sessionToken) {

        const response = await fetch(`${API_BASE_URL}/query/execute`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ query, loginToken, sessionToken })
        });

        let result;
        try {
            result = await response.json();
        } catch (e) {
            const text = await response.text();

            throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }

        if (!result.success) throw new Error(result.message || 'Query execution failed');
        return result;
    },

    /**
     * Gets the logical plan (query tree) for a query.
     */
    async getQueryTree(query, loginToken, sessionToken) {

        const response = await fetch(`${API_BASE_URL}/query/querytree`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ query, loginToken, sessionToken })
        });
        const result = await response.json();
        if (!result.success) throw new Error(result.message || 'Failed to fetch query tree');
        return result.data; // Logical plan
    },

    /**
     * Gets the raw query tree for a query.
     */
    async getRawQueryTree(query, loginToken, sessionToken) {
        const response = await fetch(`${API_BASE_URL}/query/rawquerytree`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ query, loginToken, sessionToken })
        });
        const result = await response.json();
        if (!result.success) throw new Error(result.message || 'Failed to fetch raw query tree');
        return result.data; // Raw query tree
    },

    /**
     * Searches for nodes or edges by label and properties.
     */
    async search(params) {
        const { type, label, properties, limit, loginToken, sessionToken } = params;
        const response = await fetch(`${API_BASE_URL}/query/search`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({
                type,
                label: label || null,
                properties: properties || {},
                limit: limit || 100,
                loginToken,
                sessionToken
            })
        });
        const result = await response.json();
        if (!result.success) throw new Error(result.message || 'Search failed');
        return result;
    }
};
