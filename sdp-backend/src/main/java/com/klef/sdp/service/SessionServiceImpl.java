package com.klef.sdp.service;

import com.klef.sdp.model.FileEntity;
import com.klef.sdp.model.Session;
import com.klef.sdp.model.User;
import com.klef.sdp.repository.FileRepository;
import com.klef.sdp.repository.SessionRepository;
import com.klef.sdp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Service
public class SessionServiceImpl implements SessionService {
    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private FileRepository fileRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Override
    public Session createSession(String passkey, String creatorUsername) {
        if (sessionRepository.findByPasskey(passkey) != null) {
            throw new RuntimeException("Passkey already in use");
        }
        Session session = new Session();
        session.setPasskey(passkey);
        List<String> usernames = new ArrayList<>();
        usernames.add(creatorUsername);
        session.setUsernames(usernames);
        return sessionRepository.save(session);
    }

    @Override
    public Session joinSession(String passkey, String username) {
        Session session = sessionRepository.findByPasskey(passkey);
        if (session == null) {
            throw new RuntimeException("Invalid passkey");
        }
        if (session.getExpiresAt().before(new Date())) {
            throw new RuntimeException("Session has expired");
        }
        List<String> usernames = session.getUsernames();
        if (!usernames.contains(username)) {
            usernames.add(username);
            session.setUsernames(usernames);
            sessionRepository.save(session);
        }
        return session;
    }

    @Override
    public FileEntity uploadFile(int userId, String passkey, MultipartFile file) throws IOException {
        Session session = sessionRepository.findByPasskey(passkey);
        if (session == null) {
            throw new RuntimeException("Invalid passkey");
        }
        if (session.getExpiresAt().before(new Date())) {
            throw new RuntimeException("Session has expired");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        FileEntity fileEntity = new FileEntity();
        fileEntity.setFileName(file.getOriginalFilename());
        fileEntity.setFileType(file.getContentType());
        fileEntity.setFileData(file.getBytes());
        fileEntity.setUser(user);
        fileEntity.setSession(session);
        FileEntity savedFile = fileRepository.save(fileEntity);

        // Broadcast file upload to session participants
        messagingTemplate.convertAndSend("/topic/session/" + passkey, savedFile.getId());
        return savedFile;
    }

    @Override
    public List<FileEntity> getSessionFiles(String passkey) {
        Session session = sessionRepository.findByPasskey(passkey);
        if (session == null) {
            throw new RuntimeException("Invalid passkey");
        }
        if (session.getExpiresAt().before(new Date())) {
            throw new RuntimeException("Session has expired");
        }
        return fileRepository.findBySessionId(session.getId());
    }
}