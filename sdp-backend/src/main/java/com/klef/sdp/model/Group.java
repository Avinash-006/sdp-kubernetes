package com.klef.sdp.model;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "`groups`", schema = "public")
public class Group {
    @Id
    private String id;

    private String name;

    private String password;

    @ElementCollection
    @CollectionTable(name = "group_usernames", joinColumns = @JoinColumn(name = "group_id"))
    @Column(name = "username")
    private List<String> usernames;

    // Constructors
    public Group() {
        this.id = UUID.randomUUID().toString();
        this.usernames = new ArrayList<>();
    }

    public Group(String name, String password, List<String> usernames) {
        this.id = UUID.randomUUID().toString();
        this.name = name;
        this.password = password;
        this.usernames = (usernames != null) ? usernames : new ArrayList<>();
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public List<String> getUsernames() {
        return usernames;
    }

    public void setUsernames(List<String> usernames) {
        this.usernames = (usernames != null) ? usernames : new ArrayList<>();
    }

    @Override
    public String toString() {
        return "Group{id='" + id + "', name='" + name + "', usernames=" + usernames + "}";
    }
}