package com.klef.sdp.controller;

import com.klef.sdp.model.FileDTO;
import com.klef.sdp.model.Group;
import com.klef.sdp.model.Message;
import com.klef.sdp.service.GroupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/groups")
public class GroupController {
    @Autowired
    private GroupService groupService;

    @PostMapping("/create")
    public ResponseEntity<?> createGroup(@RequestBody GroupRequest groupRequest) {
        try {
            if (groupRequest.getName() == null || groupRequest.getName().trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Group name is required");
            }
            if (groupRequest.getPassword() == null || groupRequest.getPassword().trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Group password is required");
            }
            if (groupRequest.getCreatorUsername() == null || groupRequest.getCreatorUsername().trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Creator username is required");
            }

            System.out.println("Creating group with name: " + groupRequest.getName() + ", creator: " + groupRequest.getCreatorUsername());
            Group createdGroup = groupService.createGroup(
                    groupRequest.getName(),
                    groupRequest.getPassword(),
                    groupRequest.getCreatorUsername()
            );
            System.out.println("Group created: " + createdGroup);
            return ResponseEntity.ok(createdGroup);
        } catch (Exception e) {
            System.err.println("Error creating group: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to create group: " + e.getMessage() + " | Cause: " + (e.getCause() != null ? e.getCause().getMessage() : "Unknown"));
        }
    }

    @PostMapping("/join/{groupId}")
    public ResponseEntity<?> joinGroup(@PathVariable String groupId, @RequestBody JoinGroupRequest joinDetails) {
        try {
            System.out.println("User " + joinDetails.getUsername() + " joining group ID: " + groupId);
            Group group = groupService.joinGroup(groupId, joinDetails.getPassword(), joinDetails.getUsername());
            System.out.println("User joined group: " + group);
            return ResponseEntity.ok(group);
        } catch (RuntimeException e) {
            System.err.println("Error joining group: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PostMapping("/leave/{groupId}")
    public ResponseEntity<?> leaveGroup(@PathVariable String groupId, @RequestBody LeaveGroupRequest request) {
        try {
            System.out.println("User " + request.getUsername() + " leaving group ID: " + groupId);
            String result = groupService.leaveGroup(groupId, request.getUsername());
            System.out.println("Leave group result: " + result);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            System.err.println("Error leaving group: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping("/user/{username}")
    public ResponseEntity<?> getUserGroups(@PathVariable String username) {
        try {
            System.out.println("Fetching groups for username: " + username);
            List<Group> groups = groupService.getUserGroups(username);
            System.out.println("Groups retrieved: " + groups);
            return ResponseEntity.ok(groups);
        } catch (Exception e) {
            System.err.println("Error fetching groups for username " + username + ": " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error fetching groups: " + e.getMessage());
        }
    }

    @PostMapping("/message/{groupId}")
    public ResponseEntity<?> sendMessage(@PathVariable String groupId, @RequestBody Message message) {
        try {
            System.out.println("Sending message to group ID: " + groupId + " by " + message.getSenderUsername());
            Message savedMessage = groupService.sendMessage(groupId, message.getSenderUsername(), message.getContent(), message.getType());
            System.out.println("Message sent: " + savedMessage);
            return ResponseEntity.ok(savedMessage);
        } catch (RuntimeException e) {
            System.err.println("Error sending message: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping("/messages/{groupId}")
    public ResponseEntity<?> getGroupMessages(@PathVariable String groupId) {
        try {
            System.out.println("Fetching messages for groupId: " + groupId);
            List<Message> messages = groupService.getGroupMessages(groupId);
            System.out.println("Messages retrieved: " + messages);
            return ResponseEntity.ok(messages);
        } catch (Exception e) {
            System.err.println("Error fetching messages for groupId " + groupId + ": " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error fetching messages: " + e.getMessage());
        }
    }

    @GetMapping("/shared-files/{username}")
    public ResponseEntity<?> getSharedFiles(@PathVariable String username) {
        try {
            System.out.println("Fetching shared files for username: " + username);
            List<FileDTO> sharedFiles = groupService.getSharedFiles(username);
            System.out.println("Shared files retrieved: " + sharedFiles);
            return ResponseEntity.ok(sharedFiles);
        } catch (Exception e) {
            System.err.println("Error fetching shared files for username " + username + ": " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error fetching shared files: " + e.getMessage());
        }
    }

    @GetMapping("/viewall")
    public ResponseEntity<?> viewAllGroups() {
        try {
            System.out.println("Fetching all groups");
            List<Group> groups = groupService.viewAllGroups();
            System.out.println("Groups retrieved: " + groups);
            return ResponseEntity.ok(groups);
        } catch (Exception e) {
            System.err.println("Error fetching all groups: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error fetching groups: " + e.getMessage());
        }
    }

    @DeleteMapping("/admin/delete/{adminId}/{groupId}")
    public ResponseEntity<?> deleteGroup(@PathVariable Long adminId, @PathVariable String groupId) {
        try {
            System.out.println("Admin " + adminId + " attempting to delete group ID: " + groupId);
            String result = groupService.deleteGroup(adminId, groupId);
            System.out.println("Delete group result: " + result);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            System.err.println("Error deleting group: " + e.getMessage());
            if (e.getMessage().equals("Unauthorized: Only admins can delete groups")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
            } else if (e.getMessage().equals("Group not found") || e.getMessage().equals("Admin not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("An error occurred while deleting the group");
            }
        }
    }
}

// DTO for create group request
class GroupRequest {
    private String name;
    private String password;
    private String creatorUsername;

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

    public String getCreatorUsername() {
        return creatorUsername;
    }

    public void setCreatorUsername(String creatorUsername) {
        this.creatorUsername = creatorUsername;
    }
}

// DTO for join group request
class JoinGroupRequest {
    private String username;
    private String password;

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}

// DTO for leave group request
class LeaveGroupRequest {
    private String username;

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }
}
