package com.KeyStone.Field.Configuration;

import com.KeyStone.Field.Security.JwtAuthenticationFilter;
import com.KeyStone.Field.Service.CustomUserDetailsService;
import com.KeyStone.Field.enums.Permission;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.time.LocalDateTime;
import java.util.List;

@Configuration
@EnableMethodSecurity
public class SecurityConfiguration {

    private final CustomUserDetailsService customUserDetailsService;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfiguration(CustomUserDetailsService customUserDetailsService,
                                 JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.customUserDetailsService = customUserDetailsService;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setContentType("application/json");
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.getWriter().write("{\"timestamp\":\"" + LocalDateTime.now() + "\",\"status\":401,\"message\":\"Authentication required or token expired\",\"errors\":null}");
                        })
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            response.setContentType("application/json");
                            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                            response.getWriter().write("{\"timestamp\":\"" + LocalDateTime.now() + "\",\"status\":403,\"message\":\"Forbidden: Access denied\",\"errors\":null}");
                        })
                )

                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/auth/**", "/api/ping").permitAll()

                        // Customer APIs
                        .requestMatchers(HttpMethod.POST, "/api/customers/**").hasAuthority(Permission.CUSTOMER_CREATE.name())
                        .requestMatchers(HttpMethod.GET, "/api/customers/**").hasAuthority(Permission.CUSTOMER_READ.name())
                        .requestMatchers(HttpMethod.PUT, "/api/customers/**").hasAuthority(Permission.CUSTOMER_UPDATE.name())
                        .requestMatchers(HttpMethod.DELETE, "/api/customers/**").hasAuthority(Permission.CUSTOMER_DELETE.name())

                        // User APIs
                        .requestMatchers(HttpMethod.POST, "/api/users/*/change-password").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/users/**").hasAuthority(Permission.USER_CREATE.name())
                        .requestMatchers(HttpMethod.GET, "/api/users/**").hasAuthority(Permission.USER_READ.name())
                        .requestMatchers(HttpMethod.PUT, "/api/users/**").hasAuthority(Permission.USER_UPDATE.name())
                        .requestMatchers(HttpMethod.DELETE, "/api/users/**").hasAuthority(Permission.USER_DELETE.name())

                        // Work Order Technician Status
                        .requestMatchers(HttpMethod.PATCH, "/api/workorders/*/technician-status").hasAuthority(Permission.WORKORDER_UPDATE.name())
                        .requestMatchers(HttpMethod.PATCH, "/api/workorders/*/assign").hasAuthority(Permission.WORKORDER_ASSIGN.name())

                        // Work Order Part APIs
                        .requestMatchers(HttpMethod.POST, "/api/workorders/*/parts").hasAuthority(Permission.WORKORDER_PART_ADD.name())
                        .requestMatchers(HttpMethod.GET, "/api/workorders/*/parts").hasAuthority(Permission.WORKORDER_PART_READ.name())
                        .requestMatchers(HttpMethod.PUT, "/api/workorders/*/parts/*").hasAuthority(Permission.WORKORDER_PART_USE.name())
                        .requestMatchers(HttpMethod.PATCH, "/api/workorders/*/parts/*/required-quantity").hasAuthority(Permission.WORKORDER_PART_ADD.name())
                        .requestMatchers(HttpMethod.DELETE, "/api/workorders/*/parts/*").hasAuthority(Permission.WORKORDER_PART_ADD.name())

                        // Work Order APIs
                        .requestMatchers(HttpMethod.POST, "/api/workorders/**").hasAuthority(Permission.WORKORDER_CREATE.name())
                        .requestMatchers(HttpMethod.GET, "/api/workorders/**").hasAuthority(Permission.WORKORDER_READ.name())
                        .requestMatchers(HttpMethod.PUT, "/api/workorders/**").hasAuthority(Permission.WORKORDER_UPDATE.name())
                        .requestMatchers(HttpMethod.DELETE, "/api/workorders/**").hasAuthority(Permission.WORKORDER_DELETE.name())

                        // Site APIs
                        .requestMatchers(HttpMethod.POST, "/api/sites/**").hasAuthority(Permission.SITE_CREATE.name())
                        .requestMatchers(HttpMethod.GET, "/api/sites/**").hasAuthority(Permission.SITE_READ.name())
                        .requestMatchers(HttpMethod.PUT, "/api/sites/**").hasAuthority(Permission.SITE_UPDATE.name())
                        .requestMatchers(HttpMethod.DELETE, "/api/sites/**").hasAuthority(Permission.SITE_DELETE.name())

                        // Part APIs
                        .requestMatchers(HttpMethod.POST, "/api/parts/*/adjust-stock").hasAuthority(Permission.PART_UPDATE.name())
                        .requestMatchers(HttpMethod.POST, "/api/parts/**").hasAuthority(Permission.PART_CREATE.name())
                        .requestMatchers(HttpMethod.GET, "/api/parts/**").hasAuthority(Permission.PART_READ.name())
                        .requestMatchers(HttpMethod.PUT, "/api/parts/**").hasAuthority(Permission.PART_UPDATE.name())
                        .requestMatchers(HttpMethod.DELETE, "/api/parts/**").hasAuthority(Permission.PART_DELETE.name())

                        .anyRequest().authenticated()
                )

                .authenticationProvider(authenticationProvider())

                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(customUserDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:5173", "http://localhost:4173", "http://localhost:3000"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "X-Requested-With"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
