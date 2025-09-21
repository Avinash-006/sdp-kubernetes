package com.klef.sdp.service;

import com.klef.sdp.model.FileDTO;
import com.klef.sdp.model.User;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface UserService {
    String adduser(User u);
    String update(User u);
    String delete(int id);
    List<User> viewall();
    User viewbyid(int id);
    User loginUser(User user);
    User getUserByUsername(String username);
    String updateFavouriteStatus(Long fileId, Boolean isFavourite);
    List<FileDTO> getFavouriteFiles(String username);
    boolean usernameExists(String username);
    boolean emailExists(String email);
    String updateProfilePicture(int userId, MultipartFile profilePicture);
    byte[] getProfilePicture(int userId);
    String deleteUser(int adminId, int userId);

    // Password reset methods
    String initiatePasswordReset(String email);
    String verifyOTPAndResetPassword(String email, String otp, String newPassword);
    String resendOTP(String email);
}