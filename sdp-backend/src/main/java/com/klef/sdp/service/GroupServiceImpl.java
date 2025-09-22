package com.klef.sdp.service;

import com.klef.sdp.model.FileDTO;
import com.klef.sdp.model.FileEntity;
import com.klef.sdp.model.Group;
import com.klef.sdp.model.Message;
import com.klef.sdp.repository.GroupRepository;
import com.klef.sdp.repository.MessageRepository;
import com.klef.sdp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
public class GroupServiceImpl implements GroupService {
    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private FileService fileService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Override
    public Group createGroup(String name, String password, String creatorUsername) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Group name is required");
        }
        if (password == null || password.trim().isEmpty()) {
            throw new IllegalArgumentException("Group password is required");
        }
        if (creatorUsername == null || creatorUsername.trim().isEmpty()) {
            throw new IllegalArgumentException("Creator username is required");
        }

        Group group = new Group();
        group.setName(name);
        group.setPassword(password);
        List<String> usernames = new ArrayList<>();
        usernames.add(creatorUsername);
        group.setUsernames(usernames);
        return groupRepository.save(group);
    }

    @Override
    public Group joinGroup(String groupId, String password, String username) {
        if (groupId == null || groupId.trim().isEmpty()) {
            throw new IllegalArgumentException("Group ID is required");
        }
        if (password == null || password.trim().isEmpty()) {
            throw new IllegalArgumentException("Password is required");
        }
        if (username == null || username.trim().isEmpty()) {
            throw new IllegalArgumentException("Username is required");
        }

        Optional<Group> groupOpt = groupRepository.findById(groupId);
        if (!groupOpt.isPresent()) {
            throw new RuntimeException("Group not found");
        }
        Group group = groupOpt.get();
        if (!group.getPassword().equals(password)) {
            throw new RuntimeException("Incorrect password");
        }
        List<String> usernames = group.getUsernames();
        if (!usernames.contains(username)) {
            usernames.add(username);
            group.setUsernames(usernames);
            groupRepository.save(group);
        }
        return group;
    }

    @Override
    public String leaveGroup(String groupId, String username) {
        if (groupId == null || groupId.trim().isEmpty()) {
            throw new IllegalArgumentException("Group ID is required");
        }
        if (username == null || username.trim().isEmpty()) {
            throw new IllegalArgumentException("Username is required");
        }

        Optional<Group> groupOpt = groupRepository.findById(groupId);
        if (!groupOpt.isPresent()) {
            throw new RuntimeException("Group not found");
        }
        Group group = groupOpt.get();
        List<String> usernames = group.getUsernames();
        if (!usernames.contains(username)) {
            throw new RuntimeException("User is not a member of this group");
        }
        usernames.remove(username);
        group.setUsernames(usernames);
        if (usernames.isEmpty()) {
            groupRepository.delete(group);
            return "Group deleted as it has no members";
        } else {
            groupRepository.save(group);
            return "Successfully left the group";
        }
    }

    @Override
    public List<Group> getUserGroups(String username) {
        if (username == null || username.trim().isEmpty()) {
            throw new IllegalArgumentException("Username is required");
        }
        List<Group> groups = groupRepository.findByUsernamesContaining(username);
        return groups != null ? groups : new ArrayList<>();
    }

    @Override
    public Message sendMessage(String groupId, String senderUsername, String content, String type) {
        if (groupId == null || groupId.trim().isEmpty()) {
            throw new IllegalArgumentException("Group ID is required");
        }
        if (senderUsername == null || senderUsername.trim().isEmpty()) {
            throw new IllegalArgumentException("Sender username is required");
        }
        if (content == null || content.trim().isEmpty()) {
            throw new IllegalArgumentException("Message content is required");
        }
        if (type == null || type.trim().isEmpty()) {
            throw new IllegalArgumentException("Message type is required");
        }

        if (!groupRepository.existsById(groupId)) {
            throw new RuntimeException("Group not found");
        }
        Message message = new Message();
        message.setGroupId(groupId);
        message.setSenderUsername(senderUsername);
        message.setContent(content);
        message.setType(type);
        message.setTimestamp(new Date());
        Message savedMessage = messageRepository.save(message);
        broadcastMessage(groupId, savedMessage);
        return savedMessage;
    }

    @Override
    public List<Message> getGroupMessages(String groupId) {
        if (groupId == null || groupId.trim().isEmpty()) {
            throw new IllegalArgumentException("Group ID is required");
        }
        List<Message> messages = messageRepository.findByGroupId(groupId);
        return messages != null ? messages : new ArrayList<>();
    }

    @Override
    public List<FileDTO> getSharedFiles(String username) {
        if (username == null || username.trim().isEmpty()) {
            throw new IllegalArgumentException("Username is required");
        }

        List<Group> userGroups = getUserGroups(username);
        if (userGroups.isEmpty()) {
            return new ArrayList<>();
        }
        List<String> groupIds = userGroups.stream()
                .map(Group::getId)
                .toList();
        List<Message> messages = messageRepository.findAll().stream()
                .filter(message -> groupIds.contains(message.getGroupId()))
                .filter(message -> "file".equals(message.getType()))
                .toList();
        List<FileDTO> sharedFiles = new ArrayList<>();
        for (Message message : messages) {
            try {
                Long fileId = Long.parseLong(message.getContent());
                FileEntity file = fileService.getFile(fileId);
                if (file != null) {
                    FileDTO fileDTO = new FileDTO(file);
                    Optional<Group> groupOpt = groupRepository.findById(message.getGroupId());
                    if (groupOpt.isPresent()) {
                        fileDTO.setGroupName(groupOpt.get().getName());
                    } else {
                        fileDTO.setGroupName("Unknown Group");
                    }
                    sharedFiles.add(fileDTO);
                }
            } catch (NumberFormatException e) {
                System.err.println("Invalid file ID in message content: " + message.getContent());
            }
        }
        return sharedFiles;
    }

    @Override
    public void broadcastMessage(String groupId, Message message) {
        if (groupId == null || groupId.trim().isEmpty()) {
            throw new IllegalArgumentException("Group ID is required");
        }
        if (message == null) {
            throw new IllegalArgumentException("Message is required");
        }
        messagingTemplate.convertAndSend("/topic/group/" + groupId, message);
    }

    @Override
    public List<Group> viewAllGroups() {
        return groupRepository.findAll();
    }

    @Override
    public String deleteGroup(Long adminId, String groupId) {
        if (adminId == null) {
            throw new IllegalArgumentException("Admin ID is required");
        }
        if (groupId == null || groupId.trim().isEmpty()) {
            throw new IllegalArgumentException("Group ID is required");
        }

        return userRepository.findById(Math.toIntExact(adminId))
                .map(admin -> {
                    if (!admin.isAdmin()) {
                        throw new RuntimeException("Unauthorized: Only admins can delete groups");
                    }
                    return groupRepository.findById(groupId)
                            .map(group -> {
                                groupRepository.delete(group);
                                return "Group deleted successfully";
                            })
                            .orElse("Group not found");
                })
                .orElse("Admin not found");
    }
}