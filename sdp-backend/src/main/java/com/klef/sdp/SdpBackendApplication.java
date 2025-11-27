package com.klef.sdp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.Bean;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@SpringBootApplication
@EntityScan(basePackages = "com.klef.sdp.model")
@EnableJpaRepositories(basePackages = "com.klef.sdp.repository")
public class SdpBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(SdpBackendApplication.class, args);
        System.out.println("Backend is running...");
    }

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**") // allow all endpoints
                        .allowedOriginPatterns("*") // <-- instead of allowedOrigins("*")
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
                        .allowedHeaders("*")
                        .exposedHeaders("*")
                        .allowCredentials(false) // Set to false when using wildcard patterns
                        .maxAge(3600);
            }
        };
    }
}
