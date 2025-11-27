package com.klef.sdp.model;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Entity
@Table(name = "sessions")
public class Session {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String passkey;

    @Column(nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;

    @Column(nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date expiresAt;

    @ElementCollection
    @CollectionTable(name = "session_usernames", joinColumns = @JoinColumn(name = "session_id"))
    @Column(name = "username")
    private List<String> usernames = new ArrayList<>();

    public Session() {
        this.createdAt = new Date();
        this.expiresAt = new Date(createdAt.getTime() + 10 * 60 * 1000); // 10 minutes
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getPasskey() { return passkey; }
    public void setPasskey(String passkey) { this.passkey = passkey; }
    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }
    public Date getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Date expiresAt) { this.expiresAt = expiresAt; }
    public List<String> getUsernames() { return usernames; }
    public void setUsernames(List<String> usernames) { this.usernames = usernames; }
}