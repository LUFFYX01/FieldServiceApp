package com.KeyStone.Field.Configuration;

import com.KeyStone.Field.Security.JwtAuthenticationFilter;
import com.KeyStone.Field.Service.CustomUserDetailsService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
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
import org.springframework.http.HttpMethod;
import com.KeyStone.Field.enums.Permission;

@Configuration
@EnableMethodSecurity
public class SecurityConfiguration {

    private final CustomUserDetailsService customUserDetailsService;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;



    public SecurityConfiguration(CustomUserDetailsService customUserDetailsService,
                                 JwtAuthenticationFilter jwtAuthenticationFilter){
        this.customUserDetailsService = customUserDetailsService;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                .csrf(csrf -> csrf.disable())

                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                .authorizeHttpRequests(auth -> auth

                        .requestMatchers("/api/auth/**").permitAll()

                        // Customer APIs
                        .requestMatchers(HttpMethod.POST, "/api/customers/**")
                        .hasAuthority(Permission.CUSTOMER_CREATE.name())

                        .requestMatchers(HttpMethod.GET, "/api/customers/**")
                        .hasAuthority(Permission.CUSTOMER_READ.name())

                        .requestMatchers(HttpMethod.PUT, "/api/customers/**")
                        .hasAuthority(Permission.CUSTOMER_UPDATE.name())

                        .requestMatchers(HttpMethod.DELETE, "/api/customers/**")
                        .hasAuthority(Permission.CUSTOMER_DELETE.name())

                        // Work order APIs
                        .requestMatchers(HttpMethod.PATCH, "/api/workorders/*/assign")
                        .hasAuthority(Permission.WORKORDER_ASSIGN.name())

                        // Site APIs
                        .requestMatchers(HttpMethod.POST, "/api/sites/**")
                        .hasAuthority(Permission.SITE_CREATE.name())

                        .requestMatchers(HttpMethod.GET, "/api/sites/**")
                        .hasAuthority(Permission.SITE_READ.name())

                        .requestMatchers(HttpMethod.PUT, "/api/sites/**")
                        .hasAuthority(Permission.SITE_UPDATE.name())

                        .requestMatchers(HttpMethod.DELETE, "/api/sites/**")
                        .hasAuthority(Permission.SITE_DELETE.name())

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
    public PasswordEncoder passwordEncoder(){
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {

        DaoAuthenticationProvider provider =
                new DaoAuthenticationProvider(customUserDetailsService);

        provider.setPasswordEncoder(passwordEncoder());

        return provider;
    }
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration)
            throws Exception {

        return configuration.getAuthenticationManager();
    }
}