
const BASE_URL = 'http://localhost:5000/api/v1';

async function testRateLimiting() {
    console.log('🚀 Testing Rate Limiting...');
    try {
        const res = await fetch(`${BASE_URL.replace('/api/v1', '')}/health`);
        const ratelimitHeader = res.headers.get('ratelimit');
        console.log(`✅ Rate Limit Header (Draft-7): ${ratelimitHeader}`);
    } catch (err) {
        console.log('❌ Rate Limit Check Failed:', err.message);
    }
}

async function testNoSQLInjection() {
    console.log('\n🛡️ Testing NoSQL Injection (Payload: {"$gt": ""})...');
    try {
        // Attempting to send a dangerous object key
        const res = await fetch(`${BASE_URL}/products?category[$gt]=`);
        console.log('✅ Response Status:', res.status);
        console.log('💡 Note: If mongoSanitize is working, the $[gt] will be stripped or ignored by the query engine.');
    } catch (err) {
        console.log('❌ Request failed:', err.message);
    }
}

async function testSecurityHeaders() {
    console.log('\n🛡️ Checking Security Headers (Helmet)...');
    try {
        const res = await fetch(`${BASE_URL}/products`);
        console.log('✅ Security Headers Found:');
        console.log('  - X-Content-Type-Options:', res.headers.get('x-content-type-options'));
        console.log('  - X-Frame-Options:', res.headers.get('x-frame-options'));
        console.log('  - Strict-Transport-Security:', res.headers.get('strict-transport-security'));
        console.log('  - X-Permitted-Cross-Domain-Policies:', res.headers.get('x-permitted-cross-domain-policies'));
    } catch (err) {
        console.log('❌ Header check failed:', err.message);
    }
}

async function testAuthShield() {
    console.log('\n🛡️ Testing Authentication Shield...');
    try {
        const res = await fetch(`${BASE_URL}/profile/me`);
        console.log('✅ Protected Route Check status:', res.status);
        if (res.status === 401 || res.status === 403) {
            console.log('  - Result: Access Denied (Correct)');
        } else {
            console.log('  - Result: POTENTIAL VULNERABILITY (Access Granted/Other)');
        }
    } catch (err) {
        console.log('❌ Auth check failed:', err.message);
    }
}

async function runAudit() {
    console.log('=== STARTING SECURITY AUDIT ===\n');
    await testRateLimiting();
    await testNoSQLInjection();
    await testSecurityHeaders();
    await testAuthShield();
    console.log('\n=== AUDIT COMPLETE ===');
}

runAudit();
