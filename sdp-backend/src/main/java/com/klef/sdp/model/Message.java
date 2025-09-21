package com.klef.sdp.model;

import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "messages")
public class Message {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "group_id")
    private String groupId; // Changed from Long to String

    private String senderUsername;

    private String content;

    private String type;

    @Temporal(TemporalType.TIMESTAMP)
    private Date timestamp;

    // Constructors
    public Message() {
        this.timestamp = new Date();
    }

    public Message(String groupId, String senderUsername, String content, String type, Date timestamp) {
        this.groupId = groupId;
        this.senderUsername = senderUsername;
        this.content = content;
        this.type = type;
        this.timestamp = timestamp != null ? timestamp : new Date();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getGroupId() {
        return groupId;
    }

    public void setGroupId(String groupId) {
        this.groupId = groupId;
    }

    public String getSenderUsername() {
        return senderUsername;
    }

    public void setSenderUsername(String senderUsername) {
        this.senderUsername = senderUsername;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Date getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Date timestamp) {
        this.timestamp = timestamp;
    }

    @Override
    public String toString() {
        return "Message{id=" + id + ", groupId='" + groupId + "', senderUsername='" + senderUsername + "', content='" + content + "', type='" + type + "', timestamp=" + timestamp + "}";
    }
}