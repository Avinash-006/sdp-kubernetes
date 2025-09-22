package com.klef.sdp.controller;

import com.klef.sdp.model.FileEntity;
import com.klef.sdp.model.Session;
import com.klef.sdp.service.SessionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/sessions")
public class SessionController {
    @Autowired
    private SessionService sessionService;

    @PostMapping("/create")
    public ResponseEntity<?> createSession(@RequestBody SessionRequest request) {
        try {
            Session session = sessionService.createSession(request.getPasskey(), request.getUsername());
            return ResponseEntity.ok(session);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PostMapping("/join")
    public ResponseEntity<?> joinSession(@RequestBody SessionRequest request) {
        try {
            Session session = sessionService.joinSession(request.getPasskey(), request.getUsername());
            return ResponseEntity.ok(session);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PostMapping("/upload/{passkey}/{userId}")
    public ResponseEntity<?> uploadFile(
            @PathVariable String passkey,
            @PathVariable int userId,
            @RequestParam("file") MultipartFile file) {
        try {
            FileEntity fileEntity = sessionService.uploadFile(userId, passkey, file);
            return ResponseEntity.ok("File uploaded: " + fileEntity.getFileName());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping("/files/{passkey}")
    public ResponseEntity<?> getSessionFiles(@PathVariable String passkey) {
        try {
            List<FileEntity> files = sessionService.getSessionFiles(passkey);
            return ResponseEntity.ok(files);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
}

class SessionRequest {
    private String passkey;
    private String username;

    public String getPasskey() { return passkey; }
    public void setPasskey(String passkey) { this.passkey = passkey; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
}
