# Sửa lỗi SecurityConfig cho WebSocket

## Vấn đề

Log backend cho thấy:
```
Securing GET /ws/info?token=...
Set SecurityContextHolder to anonymous SecurityContext
```

Điều này có nghĩa là Spring Security vẫn đang xử lý request `/ws/info` và set nó thành anonymous, mặc dù đã có `.requestMatchers("/education/ws/**").permitAll()`.

## Nguyên nhân

**Spring Security tự động strip context-path (`/education`) trước khi match pattern!**

- Request thực tế: `http://localhost:8080/education/ws/info`
- Path mà Spring Security nhận được: `/ws/info` (đã strip `/education`)
- Pattern hiện tại: `/education/ws/**` ❌ (không bao giờ match)
- Pattern đúng: `/ws/**` ✅

## Giải pháp

Sửa `SecurityConfig` của bạn:

### ❌ SAI (hiện tại):
```java
.requestMatchers("/education/ws/**").permitAll()
.ignoringRequestMatchers("/education/ws/**")
```

### ✅ ĐÚNG (cần sửa thành):
```java
.requestMatchers("/ws/**").permitAll()
.ignoringRequestMatchers("/ws/**")
```

## Code đầy đủ cần sửa

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity httpSecurity)
        throws Exception {
    httpSecurity.authorizeHttpRequests(authorize ->
            authorize
                    .requestMatchers(
                            "/swagger-ui/**",
                            "/v3/api-docs/**",
                            "/swagger-resources/**",
                            "/webjars/**"
                    ).permitAll()
                    .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                    .requestMatchers(HttpMethod.POST, PUBLIC_POST_ENDPOINTS).permitAll()
                    .requestMatchers(HttpMethod.GET, PUBLIC_GET_ENDPOINTS).permitAll()
                    .requestMatchers("/ws/**").permitAll()  // ✅ SỬA TỪ /education/ws/** THÀNH /ws/**
                    .anyRequest()
                    .authenticated());
    
    // ... rest of config
    return httpSecurity.build();
}
```

## Kiểm tra

Sau khi sửa, log backend sẽ không còn:
- `Securing GET /ws/info` (hoặc sẽ pass qua permitAll)
- `Set SecurityContextHolder to anonymous`

Và request `/ws/info` sẽ được cho phép mà không cần authentication.

