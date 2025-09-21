package com.klef.sdp.service;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;
import com.klef.sdp.model.FileDTO;
import com.klef.sdp.model.FileEntity;
import com.klef.sdp.model.User;
import com.klef.sdp.repository.FileRepository;
import com.klef.sdp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FileServiceImpl implements FileService {
    @Autowired
    private FileRepository fileRepository;

    @Autowired
    private UserRepository userRepository;

    @Override
    public FileEntity addFile(int userId, MultipartFile f) throws IOException {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        FileEntity fileEntity = new FileEntity();
        fileEntity.setFileName(f.getOriginalFilename());
        fileEntity.setFileType(f.getContentType());
        fileEntity.setData(f.getBytes());
        fileEntity.setUser(user);
        return fileRepository.save(fileEntity);
    }

    @Override
    public FileEntity getFile(Long id) {
        return fileRepository.findById(id).orElse(null);
    }

    @Override
    public List<FileDTO> getUserFiles(String username) {
        System.out.println("Fetching files for username: " + username);
        User user = userRepository.findByUsername(username);
        if (user == null) {
            throw new RuntimeException("User not found: " + username);
        }
        List<FileEntity> files = fileRepository.findByUserId(user.getId());
        System.out.println("Found " + files.size() + " files for username: " + username);
        return files.stream()
                    .map(FileDTO::new) // Now works because FileDTO has a constructor accepting FileEntity
                    .collect(Collectors.toList());
    }

    @Override
    public String delete(Long id) {
        return fileRepository.findById(id)
            .map(file -> {
                fileRepository.delete(file);
                return "Deleted Successfully";
            })
            .orElse("Cannot Delete");
    }
}