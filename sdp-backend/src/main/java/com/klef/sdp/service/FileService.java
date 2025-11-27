package com.klef.sdp.service;


import com.klef.sdp.model.FileDTO;
import com.klef.sdp.model.FileEntity;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

public interface FileService {
    FileEntity addFile(int userId, MultipartFile file) throws IOException;
    FileEntity getFile(Long id);
    List<FileDTO> getUserFiles(String username);
    String delete(Long id);
    FileEntity copyFileToDrive(Long fileId, int userId) throws IOException;
}