const http = require('http');
const fs = require('fs');

const BASE_URL = 'http://localhost:5000/api/v1';
const CONCURRENCY = 5;
const USERS_TO_CREATE = 10;

// Utils
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Generate Random User
const generateUser = (index) => ({
    firstName: `Stress`,
    lastName: `Test${index}`,
    email: `stress_test_${Date.now()}_${index}@example.com`,
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
            console.error(`Request error: ${e.message}`);
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
    console.log(`[User ${index}] Starting flow for ${user.email}...`);

    try {
        // 1. Register
        const regRes = await apiCall('/auth/register', 'POST', user);
        if (regRes.status !== 201) {
            throw new Error(`Registration failed: ${JSON.stringify(regRes.data)}`);
        }

        const userId = regRes.data.userId;
        const otp = regRes.data.debugOtp;

        if (!otp) throw new Error('Debug OTP not found! Check backend configuration.');

        // 2. Verify OTP
        const verifyRes = await apiCall('/auth/otp/verify', 'POST', {
            userId,
            otp,
            type: 'registration'
        });

        if (verifyRes.status !== 200) {
            throw new Error(`Verification failed: ${JSON.stringify(verifyRes.data)}`);
        }

        // 3. Login
        const loginRes = await apiCall('/auth/login', 'POST', {
            email: user.email,
            password: user.password
        });

        if (loginRes.status !== 200) {
            throw new Error(`Login failed: ${JSON.stringify(loginRes.data)}`);
        }

        const token = loginRes.data.token;

        // 4. Place Order
        const numItems = randomInt(1, 3);
        const orderItems = [];

        for (let i = 0; i < numItems; i++) {
            const product = products[randomInt(0, products.length - 1)];
            orderItems.push({
                productId: product._id || product.id,
                quantity: randomInt(1, 2)
            });
        }

        const orderPayload = {
            items: orderItems,
            shippingAddress: {
                street: `Test Street ${index}`,
                city: 'Test City',
                state: 'Test State',
                zipCode: '10001'
            },
            paymentMethod: 'card',
            paymentDetails: { token: 'tok_visa' }
        };

        const orderRes = await apiCall('/orders/checkout', 'POST', orderPayload, token);

        if (orderRes.status === 201) {
            console.log(`[User ${index}] ✅ Order Placed! ID: ${orderRes.data.orderId} | Total: ₹${orderRes.data.total / 100}`);
            return true;
        } else {
            const errorMsg = `[User ${index}] ❌ Order Failed: ${JSON.stringify(orderRes.data)}\n`;
            console.error(errorMsg);
            fs.appendFileSync('stress_error.log', errorMsg);
            return false;
        }

    } catch (err) {
        const crashMsg = `[User ${index}] 💥 CRASH: ${err.message}\n`;
        console.error(crashMsg);
        fs.appendFileSync('stress_error.log', crashMsg);
        return false;
    }
}

async function main() {
    console.log('🚀 Starting Stress Test (Native HTTP)...');
    console.log(`Base URL: ${BASE_URL}`);

    // Pre-flight: Fetch products
    console.log('Fetching products catalog...');
    const prodRes = await apiCall('/products');
    if (!prodRes.data.items || prodRes.data.items.length === 0) {
        console.error('No products found. Please seed DB.');
        process.exit(1);
    }
    const products = prodRes.data.items;
    console.log(`Found ${products.length} products.`);

    let successCount = 0;
    let failCount = 0;

    // Run in batches
    for (let i = 0; i < USERS_TO_CREATE; i += CONCURRENCY) {
        const batchParams = [];
        for (let j = 0; j < CONCURRENCY && (i + j) < USERS_TO_CREATE; j++) {
            batchParams.push(i + j + 1);
        }

        console.log(`\n--- Running Batch ${Math.floor(i / CONCURRENCY) + 1} ---`);

        const promises = batchParams.map(idx => runRefUser(idx, products));
        const results = await Promise.all(promises);

        results.forEach(r => r ? successCount++ : failCount++);
        await delay(1000); // Cool down between batches
    }

    console.log('\n========================================');
    console.log(`🏁 Test Completed.`);
    console.log(`✅ Unique Users Created & Verified: ${successCount}`);
    console.log(`✅ Orders Placed: ${successCount}`);
    console.log(`❌ Failures: ${failCount}`);
    console.log('========================================');
}

main();
