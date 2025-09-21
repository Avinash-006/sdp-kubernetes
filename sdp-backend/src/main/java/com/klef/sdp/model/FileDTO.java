package com.klef.sdp.model;

public class FileDTO {
    private Long id;
    private String fileName;
    private String fileType;
    private boolean isFavourite;
    private String groupName;

    
    public FileDTO() {}

    
    public FileDTO(FileEntity fileEntity) {
        this.id = fileEntity.getId();
        this.fileName = fileEntity.getFileName();
        this.fileType = fileEntity.getFileType();
        this.isFavourite = fileEntity.getIsFavourite();
    }

    
    public FileDTO(long id, String fileName, String groupName) {
        this.id = id;
        this.fileName = fileName;
        this.groupName = groupName;
        this.isFavourite = false; 
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

    public boolean getIsFavourite() {
        return isFavourite;
    }

    public void setIsFavourite(boolean isFavourite) {
        this.isFavourite = isFavourite;
    }

    public String getGroupName() {
        return groupName;
    }

    public void setGroupName(String groupName) {
        this.groupName = groupName;
    }

    @Override
    public String toString() {
        return "FileDTO{id=" + id + ", fileName='" + fileName + "', fileType='" + fileType + "', isFavourite=" + isFavourite + ", groupName='" + groupName + "'}";
    }
}
