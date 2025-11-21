# Hướng dẫn cấu hình WebSocket cho Classroom

## ⚠️ QUAN TRỌNG: Context Path

Backend có **context-path là `/education`**, nên tất cả các endpoint phải có prefix này:
- WebSocket endpoint: `/education/ws`
- SockJS info endpoint: `/education/ws/info`

## Vấn đề hiện tại

Khi vào trang classroom, gặp lỗi:
- `Access to XMLHttpRequest at 'http://localhost:8080/education/ws/info?t=...' has been blocked by CORS policy`
- `GET http://localhost:8080/education/ws/info?t=... net::ERR_FAILED 404 (Not Found)`

## Nguyên nhân

1. **SockJS tự động gọi endpoint `/education/ws/info`** để kiểm tra server trước khi kết nối WebSocket
2. Backend chưa có endpoint `/education/ws/info` hoặc chưa config CORS cho WebSocket endpoint
3. Frontend đã được cập nhật để tự động thêm `/education` vào URL nếu thiếu

## Giải pháp cho Backend (Spring Boot)

### 1. Cấu hình CORS cho WebSocket

Thêm vào `WebSocketConfig` hoặc `CorsConfig`:

```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic");
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Đăng ký endpoint SockJS
        // LƯU Ý: Với context-path /education, endpoint sẽ là /education/ws
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*") // Hoặc chỉ định origin cụ thể: "http://localhost:3000"
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
                    // Xử lý authentication nếu cần
                    String authToken = accessor.getFirstNativeHeader("Authorization");
                    // Validate token...
                }
                return message;
            }
        });
    }
}
```

### 2. Cấu hình CORS cho SockJS Info Endpoint

SockJS cần endpoint `/education/ws/info` để kiểm tra server. Đảm bảo:

1. **Endpoint `/ws` được đăng ký với SockJS** (như trên) - Spring sẽ tự động thêm context-path
2. **CORS được config cho tất cả các request đến `/education/ws/**`**

Thêm vào `CorsConfig` hoặc `SecurityConfig`:

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // LƯU Ý: WebMvcConfigurer không strip context-path, nên dùng /education/ws/**
        // Nhưng nếu dùng Spring Security, pattern phải là /ws/**
        registry.addMapping("/education/ws/**")
                .allowedOriginPatterns("*") // Hoặc "http://localhost:3000"
                .allowedMethods("GET", "POST", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
```

### 3. Nếu dùng Spring Security

**⚠️ QUAN TRỌNG**: Spring Security tự động **strip context-path** (`/education`) trước khi match pattern. Vì vậy, pattern phải là `/ws/**` chứ KHÔNG phải `/education/ws/**`.

Thêm vào `SecurityConfig`:

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf
                .ignoringRequestMatchers("/ws/**") // Disable CSRF cho WebSocket
                // LƯU Ý: Không dùng /education/ws/** vì Spring đã strip context-path
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/ws/info").permitAll() // Cho phép không cần auth
                .requestMatchers("/ws/**").permitAll() // Hoặc authenticate
                // LƯU Ý: Pattern là /ws/** chứ không phải /education/ws/**
                // ... other configs
            );
        return http.build();
    }
    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(Arrays.asList("*")); // Hoặc "http://localhost:3000"
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        // LƯU Ý: Pattern là /ws/** chứ không phải /education/ws/**
        source.registerCorsConfiguration("/ws/**", configuration);
        return source;
    }
}
```

**Giải thích**: 
- Request thực tế từ client: `http://localhost:8080/education/ws/info`
- Spring Security nhận được path sau khi strip context-path: `/ws/info`
- Pattern phải match với path đã strip: `/ws/**` ✅
- Pattern sai: `/education/ws/**` ❌ (không bao giờ match vì Spring đã strip `/education` rồi)

### 4. Kiểm tra `signalingUrl` từ API

Đảm bảo API `/rooms/{roomCode}/join` trả về `signalingUrl` đúng format:

```json
{
  "code": 1000,
  "result": {
    "signalingUrl": "http://localhost:8080/education/ws",
    "roomId": 1,
    "userId": 1,
    "userRole": "TEACHER",
    "token": "...",
    "iceServers": [...]
  }
}
```

**Lưu ý**: 
- `signalingUrl` phải là base URL của WebSocket endpoint (không có `/info`)
- **PHẢI có context-path `/education`** trong URL
- Ví dụ:
  - ✅ Đúng: `http://localhost:8080/education/ws`
  - ✅ Đúng: `http://localhost:8080/education/ws/` (có trailing slash cũng OK, frontend sẽ normalize)
  - ❌ Sai: `http://localhost:8080/ws` (thiếu `/education`)
  - ❌ Sai: `http://localhost:8080/education/ws/info` (không được có `/info`)
  
**Frontend đã được cập nhật** để tự động thêm `/education` vào URL nếu `signalingUrl` từ API thiếu context-path.

## Kiểm tra

Sau khi config xong, kiểm tra:

1. Truy cập `http://localhost:8080/education/ws/info` trong browser - phải trả về JSON response
2. Kiểm tra Network tab trong DevTools - request đến `/education/ws/info` không bị block bởi CORS
3. Console không còn lỗi CORS hoặc 404
4. Console log sẽ hiển thị: "Normalized WebSocket URL" và "Expected endpoint: /education/ws/info"

## Troubleshooting

- **Lỗi 404**: 
  - Endpoint `/ws` chưa được đăng ký với SockJS trong Spring
  - Hoặc context-path `/education` chưa được config đúng
  - Kiểm tra: `http://localhost:8080/education/ws/info` có trả về JSON không
  
- **Lỗi CORS**: 
  - Chưa config CORS cho `/education/ws/**` 
  - Hoặc origin không match (phải cho phép `http://localhost:3000`)
  
- **Connection timeout**: 
  - Kiểm tra firewall hoặc network
  - Kiểm tra backend có đang chạy không
  
- **401 Unauthorized cho `/ws/info`**: 
  - SockJS tự động gọi `/ws/info` là HTTP GET request, không phải STOMP message
  - Request này **KHÔNG đi qua** `configureClientInboundChannel` (chỉ xử lý STOMP messages)
  - **Frontend KHÔNG gửi token trong query parameter** (token chỉ gửi trong header khi STOMP CONNECT)
  - **Backend PHẢI cho phép `/ws/info` không cần authentication** (dùng `permitAll()`)

### 5. Xử lý Authentication cho SockJS Info Endpoint

**Vấn đề**: SockJS gọi `/education/ws/info` là HTTP GET request, không phải STOMP CONNECT message, nên không đi qua `configureClientInboundChannel`.

**Giải pháp (Khuyến nghị)**: Cho phép `/ws/info` không cần authentication vì:
- SockJS không thể gửi custom headers trong request `/ws/info`
- Token chỉ được gửi trong header `Authorization` khi STOMP CONNECT
- `/ws/info` chỉ là endpoint để kiểm tra server capabilities, không phải endpoint thực sự của ứng dụng

**Cách 1 (Đơn giản nhất - Khuyến nghị)**: Cho phép `/ws/info` không cần auth:

```java
.authorizeHttpRequests(auth -> auth
    .requestMatchers("/ws/info").permitAll() // Cho phép không cần auth
    .requestMatchers("/ws/**").authenticated() // Các request khác cần auth
    // ... other configs
)
```

**Cách 2 (Nếu muốn yêu cầu auth)**: Tạo Filter/Interceptor để xử lý token từ query parameter (KHÔNG khuyến nghị vì phức tạp và không cần thiết):

```java
@Component
@Slf4j
public class SockJSInfoAuthFilter implements Filter {
    
    private final JwtUtils jwtUtils;
    
    public SockJSInfoAuthFilter(JwtUtils jwtUtils) {
        this.jwtUtils = jwtUtils;
    }
    
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        String requestPath = httpRequest.getRequestURI();
        
        // Chỉ xử lý request đến /ws/info
        if (requestPath != null && requestPath.endsWith("/ws/info")) {
            String token = httpRequest.getParameter("token");
            
            if (token != null && !token.isEmpty()) {
                try {
                    // Validate token
                    if (jwtUtils.validateToken(token)) {
                        // Token hợp lệ, cho phép request tiếp tục
                        log.debug("SockJS info request authenticated with token");
                        chain.doFilter(request, response);
                        return;
                    } else {
                        log.warn("Invalid token in SockJS info request");
                    }
                } catch (Exception e) {
                    log.error("Token validation failed for SockJS info: {}", e.getMessage());
                }
            } else {
                log.warn("SockJS info request without token");
            }
            
            // Token không hợp lệ hoặc không có → trả về 401
            HttpServletResponse httpResponse = (HttpServletResponse) response;
            httpResponse.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            httpResponse.setContentType("application/json");
            httpResponse.getWriter().write("{\"error\":\"Unauthorized\"}");
            return;
        }
        
        // Các request khác, cho qua bình thường
        chain.doFilter(request, response);
    }
}
```

**Đăng ký Filter trong SecurityConfig**:

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    private final SockJSInfoAuthFilter sockJSInfoAuthFilter;
    
    public SecurityConfig(SockJSInfoAuthFilter sockJSInfoAuthFilter) {
        this.sockJSInfoAuthFilter = sockJSInfoAuthFilter;
    }
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .addFilterBefore(sockJSInfoAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf
                .ignoringRequestMatchers("/education/ws/**")
            )
            .authorizeHttpRequests(auth -> auth
                // Cho phép /ws/info không cần auth (khuyến nghị - đơn giản nhất)
                .requestMatchers("/ws/info").permitAll() // Không cần auth vì không thể gửi token trong /ws/info
                .requestMatchers("/ws/**").permitAll() // Hoặc authenticate
                // LƯU Ý: Pattern là /ws/** chứ không phải /education/ws/**
                // LƯU Ý: Token chỉ được gửi trong header khi STOMP CONNECT, không phải trong /ws/info
                // ... other configs
            );
        return http.build();
    }
    
    // ... rest of config
}
```

**Hoặc đơn giản hơn**: Cho phép `/ws/info` không cần authentication (vì nó chỉ là endpoint để kiểm tra server capabilities), và chỉ yêu cầu authentication khi STOMP CONNECT:

```java
.authorizeHttpRequests(auth -> auth
    .requestMatchers("/ws/info").permitAll() // Cho phép không cần auth
    .requestMatchers("/ws/**").authenticated() // Các request khác cần auth
    // LƯU Ý: Pattern là /ws/** chứ không phải /education/ws/**
    // ... other configs
)
```

**Lưu ý**: 
- **Frontend KHÔNG gửi token trong query parameter** của `/ws/info` request
- Token chỉ được gửi trong header `Authorization: Bearer <token>` khi STOMP CONNECT
- Backend cần cho phép `/ws/info` không cần authentication (dùng `permitAll()`)
- Authentication thực sự chỉ xảy ra khi STOMP CONNECT, được xử lý trong `configureClientInboundChannel`

