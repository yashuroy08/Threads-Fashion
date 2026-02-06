
// Native fetch used

const BASE_URL = 'http://localhost:5000/api/v1';

async function runSecurityTests() {
    console.log('🛡️ Starting Security Tests...\n');

    // 1. Test NoSQL Injection on Login
    console.log('TEST 1: NoSQL Injection on Login');
    try {
        const payload = {
            email: { "$ne": null }, // Classic NoSQL injection payload
            password: { "$ne": null }
        };

        const response = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.status === 200 && data.token) {
            console.error('❌ VULNERABLE: NoSQL Injection succeeded! Logged in without credentials.');
        } else if (response.status >= 500) {
            console.error('⚠️ POTENTIAL ISSUE: Server crashed or error (DoS risk). Status:', response.status);
            console.error('Response Body:', JSON.stringify(data, null, 2));
        } else {
            console.log('✅ SECURE: Injection attempt failed safely. Status:', response.status);
        }
    } catch (error) {
        console.error('❌ ERROR: Request failed', error);
    }

    // 2. Test DoS via Parameter Pollution / Type Juggling
    console.log('\nTEST 2: DoS via Type Juggling (Search)');
    try {
        // Sending an object where a string is expected
        const params = new URLSearchParams();
        params.append('q', 'shoes');

        // This simulates ?q[gt]=0 which parses to object in some parsers, 
        // but here we want to test if backend handles non-string input if possible.
        // Since we can't easily force express to parse JSON body as query params for GET,
        // we'll try to POST to a search endpoint if one exists that accepts body, 
        // or just construct a query that might parse weirdly.
        // Actually, Express 'qs' library by default parses nested objects for query strings.
        // ?q[foo]=bar -> {q: {foo: 'bar'}}

        const url = `${BASE_URL}/products/search?q[foo]=bar`;
        const response = await fetch(url);

        if (response.status >= 500) {
            console.error('❌ VULNERABLE: Server crashed (DoS). Status:', response.status);
        } else {
            console.log('✅ SECURE: Server handled malformed query safely. Status:', response.status);
        }

    } catch (error) {
        console.error('❌ ERROR: Request failed', error);
    }

    // 3. Test Rate Limiting (Brute Force Simulation)
    console.log('\nTEST 3: Rate Limiting (Brute Force Simulation)');
    console.log('Sending 10 login requests in parallel...');
    try {
        const promises = [];
        for (let i = 0; i < 10; i++) {
            promises.push(fetch(`${BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: 'test@example.com', password: 'wrongpassword' })
            }).then(r => r.status));
        }

        const statuses = await Promise.all(promises);
        const rateLimited = statuses.some(s => s === 429);

        if (rateLimited) {
            console.log('✅ SECURE: Rate limiting active (429 Too Many Requests received).');
        } else {
            console.log(`ℹ️ INFO: No rate limiting triggered with 10 requests. Statuses: ${statuses.slice(0, 5)}...`);
        }
    } catch (error) {
        console.error('❌ ERROR: Rate limit test failed', error);
    }
}

runSecurityTests();
