package com.klef.sdp.model;

import jakarta.persistence.*;
import java.util.Base64;

@Entity
@Table(name = "files")
public class File {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fileName;

    @Column(nullable = false)
    private String fileType;

    @Column(columnDefinition = "BYTES",nullable = false)
    private byte[] fileData;

    @Column(name = "file_extension", length = 50)
    private String fileExtension;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    public File() {
    }

    public File(String fileName, String fileType, byte[] fileData, String fileExtension, User user) {
        this.fileName = fileName;
        this.fileType = fileType;
        this.fileData = fileData;
        this.fileExtension = fileExtension;
        this.user = user;
    }


    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getFileType() {
        return fileType;
    }

    public void setFileType(String fileType) {
        this.fileType = fileType;
    }

    public byte[] getFileData() {
        return fileData;
    }

    public void setFileData(byte[] fileData) {
        this.fileData = fileData;
    }

    public String getFileDataBase64() {
        return fileData != null ? Base64.getEncoder().encodeToString(fileData) : null;
    }

    public String getFileExtension() {
        return fileExtension;
    }

    public void setFileExtension(String fileExtension) {
        this.fileExtension = fileExtension;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }
}