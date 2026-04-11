# Node.js to Spring Boot Migration Guide
### Project: Threads-Fashion E-Commerce Platform

---

## Table of Contents

1. [Migration Overview](#migration-overview)
2. [Phase 1 — Audit and Inventory](#phase-1--audit-and-inventory)
3. [Phase 2 — Project Setup](#phase-2--project-setup)
4. [Phase 3 — Data Layer](#phase-3--data-layer)
5. [Phase 4 — Auth and Security](#phase-4--auth-and-security)
6. [Phase 5 — REST Controllers](#phase-5--rest-controllers)
7. [Phase 6 — Service Layer and Business Logic](#phase-6--service-layer-and-business-logic)
8. [Phase 7 — Third-Party Integrations](#phase-7--third-party-integrations)
9. [Phase 8 — Testing and Cutover](#phase-8--testing-and-cutover)
10. [Quick Reference Translation Table](#quick-reference-translation-table)

---

## Migration Overview

**Objective:** Replace the legacy Node.js (Express + Mongoose + TypeScript) backend with a modern, robust Java Spring Boot implementation using Maven, while retaining MongoDB as the primary data store.

**Current Stack:**
- Node.js + Express + TypeScript
- Mongoose (MongoDB ODM)
- JWT + BCrypt + OTP (Twilio)
- Razorpay payments
- Pino logger
- Modular MVC architecture

**Target Stack:**
- Java 21 + Spring Boot 3.3.x + Maven
- Spring Data MongoDB
- Spring Security + JWT (jjwt)
- JavaMailSender + Twilio Java SDK
- Razorpay Java SDK
- SLF4J + Logback
- Modular package-per-feature architecture

---

## Phase 1 — Audit and Inventory

### Action
Before writing a single line of Java, document everything your Node.js backend does.

Create a spreadsheet with:
- Every Express route (`method`, `path`, `auth required`, `roles`)
- Every Mongoose model and its fields
- Every environment variable in `.env`
- Every middleware in the Express pipeline
- Every third-party service call

### Useful Audit Commands

```bash
# Extract all registered routes from TypeScript source
grep -r "router\." backend/src --include="*.ts"

# Extract all Mongoose schema definitions
grep -r "new Schema" backend/src --include="*.ts"

# List all environment variables referenced
grep -r "process.env\." backend/src --include="*.ts" | sort | uniq
```

### Models to Migrate

| Collection     | Key Fields                                            |
|----------------|-------------------------------------------------------|
| Users          | `email`, `password`, `role`, `isVerified`             |
| Products       | `name`, `price`, `category`, `stock`, `variants`      |
| Categories     | `name`, `slug`, `parentCategory`                      |
| Orders         | `user`, `items`, `totalAmount`, `status`, `paymentId` |
| Cart           | `user`, `items`                                       |
| Wishlist       | `user`, `products`                                    |
| Audit Logs     | `action`, `performedBy`, `timestamp`                  |
| OTP            | `email`, `code`, `expiresAt`                          |
| Admin Settings | `storeName`, `bannerSettings`, `contactInfo`          |

> **Senior Engineer Tip:** This phase is where most migrations fail silently. Developers start coding before they realise there are undocumented routes used only by the admin panel, or that the OTP model has a TTL index on MongoDB that needs to be replicated. Be exhaustive here.

---

## Phase 2 — Project Setup

### Action
Scaffold the Spring Boot application from [start.spring.io](https://start.spring.io) with the correct starters and Java version.

**Settings:**
- Project: Maven
- Language: Java
- Spring Boot: 3.3.x
- Java: 21 (LTS)
- Packaging: JAR

**Starters to select:**
- Spring Web
- Spring Data MongoDB
- Spring Security
- Validation
- Spring Boot DevTools
- Lombok

### Core `pom.xml`

```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.3.4</version>
</parent>

<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-mongodb</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-mail</artifactId>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-api</artifactId>
        <version>0.12.6</version>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-impl</artifactId>
        <version>0.12.6</version>
        <scope>runtime</scope>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-jackson</artifactId>
        <version>0.12.6</version>
        <scope>runtime</scope>
    </dependency>
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <optional>true</optional>
    </dependency>
    <dependency>
        <groupId>com.razorpay</groupId>
        <artifactId>razorpay-java</artifactId>
        <version>1.4.5</version>
    </dependency>
    <dependency>
        <groupId>com.twilio.sdk</groupId>
        <artifactId>twilio</artifactId>
        <version>9.14.0</version>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>de.flapdoodle.embed</groupId>
        <artifactId>de.flapdoodle.embed.mongo.spring31x</artifactId>
        <version>4.13.1</version>
        <scope>test</scope>
    </dependency>
</dependencies>
```

### Package Structure (mirrors Node.js modules)

```
com.threads/
├── catalog/
│   ├── controller/       ← Express controllers
│   ├── service/          ← Business logic services
│   ├── model/            ← Mongoose models → @Document classes
│   ├── repository/       ← Mongoose queries → MongoRepository
│   └── dto/              ← Request/Response DTOs
├── auth/
│   ├── controller/
│   ├── service/
│   ├── filter/           ← JWT middleware → OncePerRequestFilter
│   └── dto/
├── common/
│   ├── exception/        ← Custom exception classes
│   └── handler/          ← @RestControllerAdvice
└── config/               ← SecurityConfig, MongoConfig, etc.
```

### `application.yml`

```yaml
spring:
  data:
    mongodb:
      uri: ${MONGO_URI}
      database: threads-fashion
  mail:
    host: smtp.gmail.com
    port: 587
    username: ${MAIL_USER}
    password: ${MAIL_PASS}
    properties:
      mail.smtp.starttls.enable: true

jwt:
  secret: ${JWT_SECRET}
  expiration: 86400000   # 24 hours in ms

razorpay:
  key-id: ${RAZORPAY_KEY_ID}
  key-secret: ${RAZORPAY_KEY_SECRET}

twilio:
  account-sid: ${TWILIO_ACCOUNT_SID}
  auth-token: ${TWILIO_AUTH_TOKEN}
  from-number: ${TWILIO_FROM_NUMBER}

server:
  port: 8080

logging:
  level:
    com.threads: INFO
```

> **Senior Engineer Tip:** Use `application-dev.yml` and `application-prod.yml` with Spring profiles. Never hardcode any secret. Inject via environment variables and reference with `${VAR_NAME}` syntax. Use `@ConfigurationProperties` classes (not scattered `@Value` annotations) for groups of related config like Razorpay or Twilio credentials.

---

## Phase 3 — Data Layer

### Action
Convert Mongoose schemas to Spring Data MongoDB `@Document` classes. Your MongoDB collections stay exactly as-is — no data migration needed.

### Mongoose → Java `@Document` Example

**Node.js (Mongoose):**
```typescript
const ProductSchema = new Schema({
    name: { type: String, required: true },
    price: { type: Number },
    stock: { type: Number },
    categoryId: { type: ObjectId, ref: 'Category' }
});
```

**Spring Boot (Java):**
```java
@Document(collection = "products")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Product {

    @Id
    private String id;

    @NotBlank
    private String name;

    private Double price;
    private Integer stock;

    @DBRef
    private Category category;
}
```

### MongoRepository Interface

```java
public interface ProductRepository extends MongoRepository<Product, String> {
    List<Product> findByCategoryId(String categoryId);
    Optional<Product> findByNameIgnoreCase(String name);
    List<Product> findByPriceBetween(Double min, Double max);
    Page<Product> findAll(Pageable pageable);
}
```

### OTP Collection with TTL Index

```java
@Document(collection = "otps")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Otp {

    @Id
    private String id;

    private String email;
    private String code;

    @Indexed(expireAfterSeconds = 300)   // 5-minute TTL, same as Mongoose
    private LocalDateTime createdAt;
}
```

### User Model with Roles

```java
@Document(collection = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    private String id;

    @Indexed(unique = true)
    @Email
    private String email;

    private String password;

    @Builder.Default
    private String role = "ROLE_CUSTOMER";   // Spring Security convention

    @Builder.Default
    private boolean isVerified = false;
}
```

> **Senior Engineer Tip:** Avoid `@DBRef` on high-read collections like `OrderItem`. Instead, embed a snapshot of the product (name, price at time of order) directly in the order document. This is the MongoDB-native pattern and prevents phantom reads if a product is updated or deleted later. Use `@DBRef` only for admin relationships like `Product → Category`.

---

## Phase 4 — Auth and Security

### Action
Replace JWT + BCrypt middleware with Spring Security's stateless filter chain.

### JWT Service

```java
@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private long expiration;

    public String generateToken(UserDetails userDetails) {
        return Jwts.builder()
            .subject(userDetails.getUsername())
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + expiration))
            .signWith(getSignKey())
            .compact();
    }

    public String extractEmail(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        return extractEmail(token).equals(userDetails.getUsername()) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractClaim(token, Claims::getExpiration).before(new Date());
    }

    private <T> T extractClaim(String token, Function<Claims, T> resolver) {
        Claims claims = Jwts.parser()
            .verifyWith(getSignKey())
            .build()
            .parseSignedClaims(token)
            .getPayload();
        return resolver.apply(claims);
    }

    private SecretKey getSignKey() {
        byte[] bytes = Decoders.BASE64.decode(secret);
        return Keys.hmacShaKeyFor(bytes);
    }
}
```

### JWT Authentication Filter

```java
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest req,
                                    HttpServletResponse res,
                                    FilterChain chain) throws ServletException, IOException {
        String authHeader = req.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            chain.doFilter(req, res);
            return;
        }
        String token = authHeader.substring(7);
        String email = jwtService.extractEmail(token);
        if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails user = userDetailsService.loadUserByUsername(email);
            if (jwtService.isTokenValid(token, user)) {
                UsernamePasswordAuthenticationToken authToken =
                    new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(req));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }
        chain.doFilter(req, res);
    }
}
```

### Security Configuration

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final UserDetailsService userDetailsService;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:5173"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }
}
```

> **Senior Engineer Tip:** Use `@PreAuthorize("hasRole('ADMIN')")` directly on service or controller methods instead of defining all rules in one `authorizeHttpRequests` block. This co-locates the authorization rule with the business logic and scales much better as the API grows.

---

## Phase 5 — REST Controllers

### Action
Map every Express route to a `@RestController` method. Always use DTOs — never expose `@Document` models directly.

### Express Route → Spring Controller Example

**Node.js (Express):**
```typescript
router.get('/products', auth, ProductController.list);
router.post('/products', auth, isAdmin, ProductController.create);
router.get('/products/:id', ProductController.findById);
```

**Spring Boot (Java):**
```java
@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public ResponseEntity<Page<ProductDTO>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(productService.findAll(PageRequest.of(page, size)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductDTO> create(@Valid @RequestBody CreateProductRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.create(req));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductDTO> findById(@PathVariable String id) {
        return ResponseEntity.ok(productService.findById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductDTO> update(@PathVariable String id,
                                              @Valid @RequestBody UpdateProductRequest req) {
        return ResponseEntity.ok(productService.update(id, req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        productService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
```

### DTO Example with Validation

```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateProductRequest {

    @NotBlank(message = "Product name is required")
    private String name;

    @NotNull(message = "Price is required")
    @Min(value = 0, message = "Price cannot be negative")
    private Double price;

    @NotNull(message = "Stock is required")
    @Min(value = 0, message = "Stock cannot be negative")
    private Integer stock;

    @NotBlank(message = "Category ID is required")
    private String categoryId;
}
```

### Global Error Handler

This is the Spring Boot equivalent of Express error middleware.

```java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
        log.warn("Resource not found: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(new ErrorResponse("NOT_FOUND", ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        String msg = ex.getBindingResult().getFieldErrors().stream()
            .map(e -> e.getField() + ": " + e.getDefaultMessage())
            .collect(Collectors.joining(", "));
        return ResponseEntity.badRequest()
            .body(new ErrorResponse("VALIDATION_ERROR", msg));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(new ErrorResponse("FORBIDDEN", "Access denied"));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(Exception ex) {
        log.error("Unhandled exception", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(new ErrorResponse("INTERNAL_ERROR", "Something went wrong"));
    }
}
```

```java
@Data
@AllArgsConstructor
public class ErrorResponse {
    private String code;
    private String message;
    private Instant timestamp = Instant.now();

    public ErrorResponse(String code, String message) {
        this.code = code;
        this.message = message;
    }
}
```

---

## Phase 6 — Service Layer and Business Logic

### Action
Translate Node.js service logic into `@Service` classes. This is the most mechanical phase — the logic is the same, translated to Java's type system.

### Structure of a Service Class

```java
@Service
@Slf4j
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public Page<ProductDTO> findAll(Pageable pageable) {
        return productRepository.findAll(pageable)
            .map(this::toDTO);
    }

    public ProductDTO findById(String id) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));
        return toDTO(product);
    }

    public ProductDTO create(CreateProductRequest req) {
        Category category = categoryRepository.findById(req.getCategoryId())
            .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        Product product = Product.builder()
            .name(req.getName())
            .price(req.getPrice())
            .stock(req.getStock())
            .category(category)
            .build();

        Product saved = productRepository.save(product);
        log.info("Created product id={} name={}", saved.getId(), saved.getName());
        return toDTO(saved);
    }

    private ProductDTO toDTO(Product product) {
        return ProductDTO.builder()
            .id(product.getId())
            .name(product.getName())
            .price(product.getPrice())
            .stock(product.getStock())
            .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
            .build();
    }
}
```

### Order Service with Transaction Support

MongoDB multi-document transactions require a replica set. Enable `@Transactional` to atomically create an order and clear the cart.

```java
@Service
@Slf4j
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final ProductRepository productRepository;
    private final RazorpayService razorpayService;

    @Transactional
    public OrderDTO placeOrder(String userId, PlaceOrderRequest req) {
        log.info("Placing order for userId={}", userId);

        Cart cart = cartRepository.findByUserId(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Cart not found"));

        if (cart.getItems().isEmpty()) {
            throw new IllegalStateException("Cannot place order with empty cart");
        }

        // Build order items with price snapshot
        List<OrderItem> items = cart.getItems().stream()
            .map(cartItem -> OrderItem.builder()
                .productId(cartItem.getProductId())
                .productName(cartItem.getProductName())    // snapshot at order time
                .priceAtOrder(cartItem.getPrice())          // snapshot at order time
                .quantity(cartItem.getQuantity())
                .build())
            .toList();

        double total = items.stream()
            .mapToDouble(i -> i.getPriceAtOrder() * i.getQuantity())
            .sum();

        Order order = Order.builder()
            .userId(userId)
            .items(items)
            .totalAmount(total)
            .status(OrderStatus.PENDING)
            .shippingAddress(req.getShippingAddress())
            .build();

        Order saved = orderRepository.save(order);

        // Clear cart atomically
        cart.getItems().clear();
        cartRepository.save(cart);

        log.info("Order placed orderId={} total={}", saved.getId(), total);
        return toDTO(saved);
    }

    public OrderDTO updateStatus(String orderId, OrderStatus status) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));
        order.setStatus(status);
        return toDTO(orderRepository.save(order));
    }
}
```

### Logging with SLF4J (Pino Replacement)

Replace Pino logger with `@Slf4j` (from Lombok). Add the annotation to any class.

```java
@Service
@Slf4j
public class SomeService {

    public void doSomething(String userId) {
        log.info("Starting operation userId={}", userId);      // structured key=value
        log.warn("Something unusual happened id={}", userId);
        log.error("Operation failed userId={}", userId, exception);
    }
}
```

Configure JSON structured logging in `src/main/resources/logback-spring.xml` for production:

```xml
<configuration>
    <springProfile name="prod">
        <appender name="JSON" class="ch.qos.logback.core.ConsoleAppender">
            <encoder class="net.logstash.logback.encoder.LogstashEncoder"/>
        </appender>
        <root level="INFO"><appender-ref ref="JSON"/></root>
    </springProfile>

    <springProfile name="dev">
        <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
            <encoder>
                <pattern>%d{HH:mm:ss} %-5level %logger{36} - %msg%n</pattern>
            </encoder>
        </appender>
        <root level="DEBUG"><appender-ref ref="CONSOLE"/></root>
    </springProfile>
</configuration>
```

### Custom Exception Classes

```java
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}

public class DuplicateResourceException extends RuntimeException {
    public DuplicateResourceException(String message) {
        super(message);
    }
}

public class PaymentException extends RuntimeException {
    public PaymentException(String message, Throwable cause) {
        super(message, cause);
    }
}
```

### Audit Logging Service

Replicate the Node.js `AuditLog` model with a dedicated Spring service.

```java
@Service
@Slf4j
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public void log(String action, String performedBy, String details) {
        AuditLog entry = AuditLog.builder()
            .action(action)
            .performedBy(performedBy)
            .details(details)
            .timestamp(Instant.now())
            .build();
        auditLogRepository.save(entry);
        log.info("AUDIT action={} by={}", action, performedBy);
    }
}
```

> **Senior Engineer Tip:** Transactions in MongoDB require a replica set. For local development, start MongoDB with `--replSet rs0` or use a Docker Compose setup with `command: ["--replSet", "rs0"]`. In production, Atlas clusters are already replica sets. Use Spring's `@Transactional` on any service method that writes to more than one collection atomically (e.g., create order + clear cart + update stock).

---

## Phase 7 — Third-Party Integrations

### Action
Replace Node.js SDK calls with their Java equivalents.

### Razorpay Integration

```java
@Service
@Slf4j
public class RazorpayService {

    private final RazorpayClient client;

    public RazorpayService(@Value("${razorpay.key-id}") String keyId,
                           @Value("${razorpay.key-secret}") String keySecret) throws RazorpayException {
        this.client = new RazorpayClient(keyId, keySecret);
    }

    public String createOrder(double amount, String currency) {
        try {
            JSONObject options = new JSONObject();
            options.put("amount", (int)(amount * 100));   // Razorpay expects paise
            options.put("currency", currency);
            options.put("receipt", "rcpt_" + System.currentTimeMillis());
            com.razorpay.Order order = client.orders.create(options);
            log.info("Razorpay order created id={}", order.get("id").toString());
            return order.get("id").toString();
        } catch (RazorpayException e) {
            throw new PaymentException("Failed to create Razorpay order", e);
        }
    }

    public boolean verifySignature(String orderId, String paymentId, String signature) {
        try {
            JSONObject attributes = new JSONObject();
            attributes.put("razorpay_order_id", orderId);
            attributes.put("razorpay_payment_id", paymentId);
            attributes.put("razorpay_signature", signature);
            return Utils.verifyPaymentSignature(attributes, keySecret);
        } catch (RazorpayException e) {
            log.warn("Razorpay signature verification failed", e);
            return false;
        }
    }
}
```

### Email Service (Nodemailer Replacement)

```java
@Service
@Slf4j
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromAddress;

    public void sendOtp(String toEmail, String otpCode) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(toEmail);
        message.setSubject("Your Threads-Fashion OTP");
        message.setText("Your OTP is: " + otpCode + "\n\nThis code expires in 5 minutes.");
        mailSender.send(message);
        log.info("OTP email sent to={}", toEmail);
    }

    public void sendOrderConfirmation(String toEmail, String orderId, double total) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(toEmail);
        message.setSubject("Order Confirmed — #" + orderId);
        message.setText("Thank you for your order!\n\nOrder ID: " + orderId + "\nTotal: ₹" + total);
        mailSender.send(message);
    }
}
```

### Twilio OTP Service

```java
@Service
@Slf4j
public class SmsService {

    @Value("${twilio.from-number}")
    private String fromNumber;

    public SmsService(@Value("${twilio.account-sid}") String accountSid,
                      @Value("${twilio.auth-token}") String authToken) {
        Twilio.init(accountSid, authToken);
    }

    public void sendOtp(String toPhone, String code) {
        Message.creator(
            new PhoneNumber(toPhone),
            new PhoneNumber(fromNumber),
            "Your Threads-Fashion OTP is: " + code + ". Valid for 5 minutes."
        ).create();
        log.info("OTP SMS sent to phone ending in {}", toPhone.substring(toPhone.length() - 4));
    }
}
```

### OTP Service (full flow)

```java
@Service
@Slf4j
@RequiredArgsConstructor
public class OtpService {

    private final OtpRepository otpRepository;
    private final SmsService smsService;
    private final EmailService emailService;

    public void generateAndSend(String identifier, boolean viaSms) {
        String code = String.format("%06d", new Random().nextInt(999999));

        // Upsert — one active OTP per identifier at a time
        otpRepository.deleteByEmail(identifier);

        Otp otp = Otp.builder()
            .email(identifier)
            .code(code)
            .createdAt(LocalDateTime.now())
            .build();
        otpRepository.save(otp);

        if (viaSms) {
            smsService.sendOtp(identifier, code);
        } else {
            emailService.sendOtp(identifier, code);
        }
    }

    public boolean verify(String identifier, String code) {
        return otpRepository.findByEmailAndCode(identifier, code)
            .filter(otp -> otp.getCreatedAt().isAfter(LocalDateTime.now().minusMinutes(5)))
            .map(otp -> {
                otpRepository.delete(otp);
                return true;
            })
            .orElse(false);
    }
}
```

> **Senior Engineer Tip:** Wrap all third-party calls with Spring Retry. Add `spring-retry` to `pom.xml` and annotate Razorpay and Twilio methods with `@Retryable(retryFor = {RazorpayException.class}, maxAttempts = 3, backoff = @Backoff(delay = 500, multiplier = 2))`. A transient API timeout should not fail an order permanently. Also add `@EnableRetry` to your main application class.

---

## Phase 8 — Testing and Cutover

### Action
Build a test suite before cutting any production traffic to the new service.

### Unit Test — Service Layer (Mockito)

```java
@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private ProductService productService;

    @Test
    void findById_returnsProduct_whenExists() {
        Product product = Product.builder()
            .id("abc123")
            .name("Blue Shirt")
            .price(799.0)
            .build();
        when(productRepository.findById("abc123")).thenReturn(Optional.of(product));

        ProductDTO result = productService.findById("abc123");

        assertThat(result.getName()).isEqualTo("Blue Shirt");
        assertThat(result.getPrice()).isEqualTo(799.0);
    }

    @Test
    void findById_throws_whenNotFound() {
        when(productRepository.findById("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.findById("missing"))
            .isInstanceOf(ResourceNotFoundException.class);
    }
}
```

### Integration Test — Controller Layer

```java
@SpringBootTest
@AutoConfigureMockMvc
class ProductControllerTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ProductRepository productRepository;

    @Test
    void getProduct_returns200_withValidId() throws Exception {
        Product product = productRepository.save(
            Product.builder().name("Test Shirt").price(499.0).stock(10).build());

        mvc.perform(get("/api/products/{id}", product.getId())
                .header("Authorization", "Bearer " + generateTestToken()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("Test Shirt"));
    }

    @Test
    void createProduct_returns403_forNonAdmin() throws Exception {
        mvc.perform(post("/api/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Shirt\",\"price\":999.0,\"stock\":5,\"categoryId\":\"cat1\"}")
                .header("Authorization", "Bearer " + generateCustomerToken()))
            .andExpect(status().isForbidden());
    }
}
```

### Add Actuator for Health Monitoring

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health, info, metrics
  endpoint:
    health:
      show-details: when-authorized
```

This gives you `/actuator/health`, `/actuator/metrics`, and `/actuator/info` — essential during the parallel-run phase.

### Cutover Strategy

1. Deploy the Spring Boot service alongside the existing Node.js service.
2. Route **10% of traffic** to Spring Boot via Nginx or your load balancer.
3. Monitor logs, error rates, and response times for both services in parallel.
4. Compare API responses using a shadow-testing tool or manual spot checks.
5. Ramp to 50%, then 100% once parity is confirmed.
6. Keep the Node.js service running for 1 week post-cutover as a rollback option.
7. Decommission Node.js only after full stability is confirmed.

> **Senior Engineer Tip:** Run both backends simultaneously and cross-validate responses before you go live. The `backend-spring/` skeleton already coexists in your repo, so this parallel-run approach is natural. Never do a hard cut to a rewritten backend without validation under real traffic.

---

## Quick Reference Translation Table

| Node.js Concept         | Spring Boot Equivalent                        |
|-------------------------|-----------------------------------------------|
| `express.Router()`      | `@RestController` + `@RequestMapping`         |
| Express middleware      | `Filter` / `@Aspect`                          |
| `mongoose.model()`      | `@Document` + `MongoRepository`               |
| `bcrypt.hash()`         | `BCryptPasswordEncoder.encode()`              |
| `jwt.sign()`            | `Jwts.builder()` (jjwt)                       |
| `pino.info()`           | `@Slf4j` + `log.info()`                       |
| `.env` file             | `application.yml` + env vars                  |
| `process.env.X`         | `@Value("${x}")`                              |
| Custom error middleware | `@RestControllerAdvice`                       |
| `try/catch` middleware  | `@ExceptionHandler`                           |
| `nodemailer`            | `JavaMailSender`                              |
| Mongoose TTL index      | `@Indexed(expireAfterSeconds = N)`            |
| `router.use(auth)`      | `OncePerRequestFilter` in `SecurityFilterChain` |
| `isAdmin` middleware    | `@PreAuthorize("hasRole('ADMIN')")`           |
| Module-level exports    | Spring `@Bean` / `@Component`                 |
| `Promise.all()`         | `CompletableFuture.allOf()`                   |

---

*Migration guide for Threads-Fashion — Node.js to Spring Boot with Maven.*
*Generated April 2026.*
