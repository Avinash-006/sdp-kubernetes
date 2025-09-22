package com.klef.sdp.model;

import jakarta.persistence.*;

@Entity
@Table(name = "files")
public class FileEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fileName;

    @Column(nullable = false, length = 100)
    private String fileType;

    // Explicitly force Hibernate to create LONGBLOB in MySQL
    @Lob
    @Column(name = "file_data", columnDefinition = "LONGBLOB", nullable = false)
    private byte[] fileData;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "session_id", nullable = true)
    private Session session; // Associate with session

    @Column(name = "is_favourite", nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    private boolean isFavourite;

    public FileEntity() {
        this.isFavourite = false;
    }

    // ---------------- Getters and Setters ----------------

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

    public User getUser() { 
        return user; 
    }
    public void setUser(User user) { 
        this.user = user; 
    }

    public Session getSession() { 
        return session; 
    }
    public void setSession(Session session) { 
        this.session = session; 
    }

    public boolean getIsFavourite() { 
        return isFavourite; 
    }
    public void setIsFavourite(boolean isFavourite) { 
        this.isFavourite = isFavourite; 
    }
}
