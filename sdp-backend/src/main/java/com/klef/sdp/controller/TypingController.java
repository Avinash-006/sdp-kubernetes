package com.klef.sdp.controller;

import com.klef.sdp.model.TypingMessage;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class TypingController {
    @MessageMapping("/group/{groupId}/typing")
    @SendTo("/topic/group/{groupId}/typing")
    public TypingMessage handleTyping(@DestinationVariable Long groupId, TypingMessage message) {
        return message;
    }
}
