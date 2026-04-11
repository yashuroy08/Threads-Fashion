package com.threads;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.springframework.test.context.TestPropertySource;
import org.springframework.boot.test.mock.mockito.MockBean;
import com.threads.catalog.repository.*;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
    "spring.autoconfigure.exclude=de.flapdoodle.embed.mongo.spring.autoconfigure.EmbeddedMongoAutoConfiguration"
})
public class SystemSecurityAndLoadTests {

    @Autowired
    private MockMvc mockMvc;

    @MockBean private UserRepository userRepository;
    @MockBean private ProductRepository productRepository;
    @MockBean private OrderRepository orderRepository;
    @MockBean private CategoryRepository categoryRepository;
    @MockBean private CartRepository cartRepository;
    @MockBean private WishlistRepository wishlistRepository;
    @MockBean private OtpRepository otpRepository;
    @MockBean private AuditLogRepository auditLogRepository;
    @MockBean private AdminSettingsRepository adminSettingsRepository;
    
    @MockBean private com.mongodb.client.MongoClient mongoClient;

    // 1. SECURITY TEST: Ensure protected endpoints reject unauthorized requests
    @Test
    public void testUnauthorizedAccess() throws Exception {
        mockMvc.perform(get("/api/users/profile"))
               .andExpect(status().isForbidden());
    }

    // 2. INJECTION TEST: Ensure NoSQL injection payloads are handled
    @Test
    public void testNoSqlInjectionAttempt() throws Exception {
        String maliciousPayload = "{ \"email\": {\"$gt\": \"\"}, \"password\": \"password123\" }";
        
        mockMvc.perform(post("/api/auth/login")
               .contentType(MediaType.APPLICATION_JSON)
               .content(maliciousPayload))
               .andExpect(status().is4xxClientError());
    }

    // 3. CRASH TEST: Ensure malformed JSON doesn't crash the server, returns 400
    @Test
    public void testMalformedJsonCrashAttempt() throws Exception {
        String malformedJson = "{ \"email\": \"test@test.com\", \"password\": ";
        
        mockMvc.perform(post("/api/auth/login")
               .contentType(MediaType.APPLICATION_JSON)
               .content(malformedJson))
               .andExpect(status().isBadRequest());
    }

    // 4. LOAD TEST: Simulate concurrent requests
    @Test
    public void testConcurrentLoadAndStability() throws InterruptedException {
        int numberOfThreads = 50; 
        ExecutorService executorService = Executors.newFixedThreadPool(numberOfThreads);
        CountDownLatch latch = new CountDownLatch(numberOfThreads);
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger errorCount = new AtomicInteger(0);

        for (int i = 0; i < numberOfThreads; i++) {
            executorService.submit(() -> {
                try {
                    mockMvc.perform(get("/api/products/search?query=test"));
                    successCount.incrementAndGet();
                } catch (Exception e) {
                    errorCount.incrementAndGet();
                } finally {
                    latch.countDown();
                }
            });
        }
        
        latch.await(); 
        executorService.shutdown();
        assertTrue(errorCount.get() == 0, "Server failed under concurrent load");
    }

    // 5. XSS PROTECTION TEST
    @Test
    public void testXssAttackAttempt() throws Exception {
        String xssPayload = "<script>alert('XSS')</script>";
        
        mockMvc.perform(post("/api/auth/login")
               .contentType(MediaType.APPLICATION_JSON)
               .content("{ \"email\": \"" + xssPayload + "\", \"password\": \"password123\" }"))
               .andExpect(status().is4xxClientError()); 
    }

    // 6. SECURITY: Check Invalid Token rejection
    @Test
    public void testInvalidTokenAccess() throws Exception {
        mockMvc.perform(get("/api/users/profile")
               .header("Authorization", "Bearer invalid.token.here"))
               .andExpect(status().isForbidden());
    }

    // 7. SECURITY: Admin Role Restriction
    @Test
    public void testAdminEndpointRestriction() throws Exception {
        mockMvc.perform(get("/api/orders/admin/list"))
               .andExpect(status().isForbidden());
    }

    // 8. SECURITY: IDOR Probe
    @Test
    public void testIdorProbe() throws Exception {
        // Accessing an order by ID directly without owner verification context should fail
        mockMvc.perform(get("/api/orders/12345"))
               .andExpect(status().isForbidden()); 
    }
}
