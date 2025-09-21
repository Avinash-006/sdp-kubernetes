package com.klef.sdp.model;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {
    @Id

    @SequenceGenerator(
            name = "user_seq",
            sequenceName = "user_sequence",
            allocationSize = 1
    )
    @GeneratedValue(
            strategy = GenerationType.SEQUENCE,
            generator = "user_seq"
    )
    private int id;


    @Column
    private String username;
    @Column
    private String email;
    @Column
    private String password;

    @Lob
    @Column(name = "profile_picture", nullable = true)
    private byte[] profilePicture;

    @Column(name = "profile_picture_type", nullable = true)
    private String profilePictureType;

    @Column(name = "is_admin", nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    private boolean isAdmin = false;

    public User() {}

    public User(String username, String email, String password) {
        this.username = username;
        this.email = email;
        this.password = password;
        this.isAdmin = false;
    }

    public User(String username, String email, String password, byte[] profilePicture, String profilePictureType) {
        this.username = username;
        this.email = email;
        this.password = password;
        this.profilePicture = profilePicture;
        this.profilePictureType = profilePictureType;
        this.isAdmin = false;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public byte[] getProfilePicture() {
        return profilePicture;
    }

    public void setProfilePicture(byte[] profilePicture) {
        this.profilePicture = profilePicture;
    }

    public String getProfilePictureType() {
        return profilePictureType;
    }

    public void setProfilePictureType(String profilePictureType) {
        this.profilePictureType = profilePictureType;
    }

    public boolean isAdmin() {
        return isAdmin;
    }

    public void setAdmin(boolean admin) {
        isAdmin = admin;
    }

    @Override
    public String toString() {
        return "User{id=" + id + ", username='" + username + "', email='" + email +
                "', profilePicture=" + (profilePicture != null ? "present" : "null") +
                ", profilePictureType='" + profilePictureType + "', isAdmin=" + isAdmin + "}";
    }
}