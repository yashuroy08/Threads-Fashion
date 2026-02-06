const http = require('http');
const fs = require('fs');

const BASE_URL = 'http://localhost:5000/api/v1';
const CONCURRENCY = 50; // Increased concurrency
const USERS_TO_CREATE = 1000; // 1000 Users

// Utils
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Generate Random User
const generateUser = (index) => ({
    firstName: `LoadTest`,
    lastName: `User${index}`,
    email: `load_test_${Date.now()}_${index}@example.com`,
    password: 'Password123!',
    phoneNumber: `+91${randomInt(6000000000, 9999999999)}`,
    country: 'IN'
});

// Helper: HTTP Request (Native)
function apiCall(endpoint, method = 'GET', body = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(`${BASE_URL}${endpoint}`);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve({ status: res.statusCode, data: json });
                } catch (e) {
                    resolve({ status: res.statusCode, data });
                }
            });
        });

        req.on('error', (e) => {
            // console.error(`Request error: ${e.message}`); // Reduce noise
            resolve({ status: 500, error: e.message });
        });

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function runRefUser(index, products) {
    const user = generateUser(index);
    // console.log(`[User ${index}] Starting flow...`); 

    try {
        // 1. Register
        const regRes = await apiCall('/auth/register', 'POST', user);
        if (regRes.status !== 201) {
            fs.appendFileSync('load_test_error.log', `[User ${index}] Reg Fail: ${JSON.stringify(regRes.data)}\n`);
            return false;
        }

        const userId = regRes.data.userId;
        const otp = regRes.data.debugOtp; // Requires backend update

        if (!otp) {
            fs.appendFileSync('load_test_error.log', `[User ${index}] OTP missing (dev mode?)\n`);
            return false;
        }

        // 2. Verify OTP
        const verifyRes = await apiCall('/auth/otp/verify', 'POST', {
            userId,
            otp,
            type: 'registration'
        });

        if (verifyRes.status !== 200) {
            fs.appendFileSync('load_test_error.log', `[User ${index}] Verify Fail: ${JSON.stringify(verifyRes.data)}\n`);
            return false;
        }

        // 3. Login
        const loginRes = await apiCall('/auth/login', 'POST', {
            email: user.email,
            password: user.password
        });

        if (loginRes.status !== 200) {
            fs.appendFileSync('load_test_error.log', `[User ${index}] Login Fail: ${JSON.stringify(loginRes.data)}\n`);
            return false;
        }

        const token = loginRes.data.token;

        // 4. Place Order
        // Randomly verify phone sometimes? No, skip for speed. Just place order.

        const numItems = randomInt(1, 3);
        const orderItems = [];

        for (let i = 0; i < numItems; i++) {
            const product = products[randomInt(0, products.length - 1)];
            orderItems.push({
                productId: product._id || product.id,
                quantity: randomInt(1, 3)
            });
        }

        const orderPayload = {
            items: orderItems,
            shippingAddress: {
                street: `Load Street ${index}`,
                city: 'Load City',
                state: 'Load State',
                zipCode: '50005'
            },
            paymentMethod: 'card',
            paymentDetails: { token: 'tok_visa' } // Mock token
        };

        const orderRes = await apiCall('/orders/checkout', 'POST', orderPayload, token);

        if (orderRes.status === 201) {
            // Success
            return true;
        } else {
            fs.appendFileSync('load_test_error.log', `[User ${index}] Order Fail: ${JSON.stringify(orderRes.data)}\n`);
            return false;
        }

    } catch (err) {
        fs.appendFileSync('load_test_error.log', `[User ${index}] CRASH: ${err.message}\n`);
        return false;
    }
}

async function main() {
    console.log(`🚀 Starting Load Test: ${USERS_TO_CREATE} users, ${CONCURRENCY} concurrency`);
    console.log(`Base URL: ${BASE_URL}`);

    // Pre-flight: Fetch products
    const prodRes = await apiCall('/products');
    if (!prodRes.data.items || prodRes.data.items.length === 0) {
        console.error('No products found. Please seed DB.');
        process.exit(1);
    }
    const products = prodRes.data.items;
    console.log(`Found ${products.length} products available for ordering.`);

    let successCount = 0;
    let failCount = 0;
    let processed = 0;

    const startTime = Date.now();

    // Run in batches
    for (let i = 0; i < USERS_TO_CREATE; i += CONCURRENCY) {
        const batchParams = [];
        for (let j = 0; j < CONCURRENCY && (i + j) < USERS_TO_CREATE; j++) {
            batchParams.push(i + j + 1);
        }

        process.stdout.write(`\rProcessing batch ${Math.ceil((i + 1) / CONCURRENCY)}/${Math.ceil(USERS_TO_CREATE / CONCURRENCY)} (Total: ${successCount} success, ${failCount} fail)`);

        const promises = batchParams.map(idx => runRefUser(idx, products));
        const results = await Promise.all(promises);

        results.forEach(r => r ? successCount++ : failCount++);
        processed += results.length;

        await delay(500); // Slight delay to prevent local port exhaustion
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n\n========================================');
    console.log(`🏁 Load Test Completed in ${duration}s`);
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Failures: ${failCount}`);
    console.log('See load_test_error.log for failure details.');
    console.log('========================================');
}

main();
