package com.klef.sdp.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // For subscriptions from clients
        config.enableSimpleBroker("/topic");
        // For messages sent from clients
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Register endpoint with SockJS support
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("http://localhost:5173", "http://10.46.2.12:5173", "http://localhost:30030","http://localhost:3000")
                .withSockJS(); // Enables SockJS fallback

        // Register the same endpoint for raw WebSocket connections
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("http://localhost:5173", "http://10.46.2.12:5173", "http://localhost:30030","http://localhost:3000");
    }
}
