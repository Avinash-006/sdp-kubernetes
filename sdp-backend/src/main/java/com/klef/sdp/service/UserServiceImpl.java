package com.klef.sdp.service;

import com.klef.sdp.model.FileDTO;
import com.klef.sdp.model.User;
import com.klef.sdp.repository.FileRepository;
import com.klef.sdp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl implements UserService {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FileRepository fileRepository;

    @Autowired
    private JavaMailSender mailSender;

    // Use application mail username as from address
    @Value("${spring.mail.username}")
    private String fromAddress;

    // Store OTP temporarily (in production, use Redis or database)
    private Map<String, OTPData> otpStorage = new HashMap<>();

    private static class OTPData {
        String otp;
        LocalDateTime expiryTime;
        String email;

        OTPData(String otp, LocalDateTime expiryTime, String email) {
            this.otp = otp;
            this.expiryTime = expiryTime;
            this.email = email;
        }
    }

    @Override
    public String adduser(User u) {
        if (usernameExists(u.getUsername())) {
            throw new RuntimeException("Username already taken");
        }
        if (emailExists(u.getEmail())) {
            throw new RuntimeException("Email already taken");
        }
        User savedUser = userRepository.save(u);
        return "User added successfully with ID: " + savedUser.getId();
    }

    @Override
    public String update(User u) {
        return userRepository.findById(u.getId())
                .map(user -> {
                    user.setUsername(u.getUsername());
                    user.setEmail(u.getEmail());
                    user.setPassword(u.getPassword());
                    user.setAdmin(u.isAdmin());
                    userRepository.save(user);
                    return "Updated Successfully";
                })
                .orElse("Cannot Update");
    }

    @Override
    public String delete(int id) {
        return userRepository.findById(id)
                .map(user -> {
                    userRepository.delete(user);
                    return "Deleted Successfully";
                })
                .orElse("Cannot Delete");
    }

    @Override
    public List<User> viewall() {
        return userRepository.findAll();
    }

    @Override
    public User viewbyid(int id) {
        return userRepository.findById(id).orElse(null);
    }

    @Override
    public User loginUser(User user) {
        User existingUser = null;
        if (user.getUsername() != null && !user.getUsername().isEmpty()) {
            existingUser = userRepository.findByUsername(user.getUsername());
        }
        if (existingUser == null && user.getEmail() != null && !user.getEmail().isEmpty()) {
            existingUser = userRepository.findByEmail(user.getEmail());
        }
        if (existingUser != null && existingUser.getPassword().equals(user.getPassword())) {
            System.out.println("Login successful for user: " + existingUser.getUsername());
            return existingUser;
        }
        System.out.println("Login failed for user: " + user.getUsername() + " or email: " + user.getEmail());
        throw new RuntimeException("Invalid credentials");
    }

    @Override
    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    @Override
    public String updateFavouriteStatus(Long fileId, Boolean isFavourite) {
        return fileRepository.findById(fileId)
                .map(file -> {
                    file.setIsFavourite(isFavourite);
                    fileRepository.save(file);
                    return "Favourite status updated";
                })
                .orElse("Cannot update favourite status");
    }

    @Override
    public List<FileDTO> getFavouriteFiles(String username) {
        User user = userRepository.findByUsername(username);
        if (user == null) {
            throw new RuntimeException("User not found: " + username);
        }
        return fileRepository.findByUserIdAndIsFavouriteTrue(user.getId())
                .stream()
                .map(FileDTO::new)
                .collect(Collectors.toList());
    }

    @Override
    public boolean usernameExists(String username) {
        return userRepository.findByUsername(username) != null;
    }

    @Override
    public boolean emailExists(String email) {
        return userRepository.findByEmail(email) != null;
    }

    @Override
    public String updateProfilePicture(int userId, MultipartFile profilePicture) {
        return userRepository.findById(userId)
                .map(user -> {
                    try {
                        user.setProfilePicture(profilePicture.getBytes());
                        user.setProfilePictureType(profilePicture.getContentType());
                        userRepository.save(user);
                        return "Profile picture updated successfully";
                    } catch (IOException e) {
                        throw new RuntimeException("Failed to upload profile picture: " + e.getMessage());
                    }
                })
                .orElse("User not found");
    }

    @Override
    public byte[] getProfilePicture(int userId) {
        return userRepository.findById(userId)
                .map(User::getProfilePicture)
                .orElse(null);
    }

    @Override
    public String deleteUser(int adminId, int userId) {
        return userRepository.findById(adminId)
                .map(admin -> {
                    if (!admin.isAdmin()) {
                        throw new RuntimeException("Unauthorized: Only admins can delete users");
                    }
                    return userRepository.findById(userId)
                            .map(user -> {
                                userRepository.delete(user);
                                return "User deleted successfully";
                            })
                            .orElse("User not found");
                })
                .orElse("Admin not found");
    }

    @Override
    public String initiatePasswordReset(String email) {
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new RuntimeException("No account found with this email address");
        }

        // Generate 6-digit OTP
        String otp = generateOTP();

        // Store OTP with 10 minutes expiry
        LocalDateTime expiryTime = LocalDateTime.now().plusMinutes(10);
        otpStorage.put(email, new OTPData(otp, expiryTime, email));

        // Send email
        try {
            sendOTPEmail(email, otp, user.getUsername());
            return "Password reset OTP sent to your email address";
        } catch (Exception e) {
            throw new RuntimeException("Failed to send OTP email: " + e.getMessage(), e);
        }
    }

    @Override
    public String verifyOTPAndResetPassword(String email, String otp, String newPassword) {
        OTPData storedOTP = otpStorage.get(email);

        if (storedOTP == null) {
            throw new RuntimeException("No OTP found. Please request a new password reset");
        }

        if (LocalDateTime.now().isAfter(storedOTP.expiryTime)) {
            otpStorage.remove(email);
            throw new RuntimeException("OTP has expired. Please request a new password reset");
        }

        if (!storedOTP.otp.equals(otp)) {
            throw new RuntimeException("Invalid OTP. Please check and try again");
        }

        // OTP is valid, reset password
        User user = userRepository.findByEmail(email);
        if (user != null) {
            user.setPassword(newPassword);
            userRepository.save(user);

            // Remove OTP from storage
            otpStorage.remove(email);

            return "Password reset successfully";
        } else {
            throw new RuntimeException("User not found");
        }
    }

    @Override
    public String resendOTP(String email) {
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new RuntimeException("No account found with this email address");
        }

        // Generate new OTP
        String otp = generateOTP();

        // Update OTP with new expiry time
        LocalDateTime expiryTime = LocalDateTime.now().plusMinutes(10);
        otpStorage.put(email, new OTPData(otp, expiryTime, email));

        // Send email
        try {
            sendOTPEmail(email, otp, user.getUsername());
            return "New OTP sent to your email address";
        } catch (Exception e) {
            throw new RuntimeException("Failed to send OTP email: " + e.getMessage(), e);
        }
    }

    private String generateOTP() {
        Random random = new Random();
        int otp = 100000 + random.nextInt(900000);
        return String.valueOf(otp);
    }

    /**
     * Sends a minimalistic, clean HTML OTP email.
     * Uses inline CSS for maximum compatibility across mail clients.
     */
    private void sendOTPEmail(String email, String otp, String username) {
        MimeMessage mimeMessage = mailSender.createMimeMessage();

        try {
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setTo(email);
            helper.setFrom(fromAddress);
            helper.setSubject("Your OTP for password reset");

            // Build HTML content (minimalistic, clean UI)
            String html = buildOtpHtml(otp, username);

            helper.setText(html, true); // true = HTML
            mailSender.send(mimeMessage);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to create/send OTP email: " + e.getMessage(), e);
        }
    }

    /**
     * Returns a clean minimalistic HTML email template with inline CSS.
     * Keep template simple and compatible with most mail clients.
     */
    private String buildOtpHtml(String otp, String username) {
        // Inline CSS for better compatibility with email clients
        // Minimalistic card centered layout, large OTP digits
        String html = "<!doctype html>"
                + "<html>"
                + "<head>"
                + "  <meta charset='utf-8'/>"
                + "  <meta name='viewport' content='width=device-width, initial-scale=1.0'/>"
                + "</head>"
                + "<body style='margin:0;padding:0;background-color:#f5f7fa;font-family:Arial,Helvetica,sans-serif;'>"
                + "  <table role='presentation' width='100%' cellpadding='0' cellspacing='0'>"
                + "    <tr>"
                + "      <td align='center' style='padding:30px 10px;'>"
                + "        <table role='presentation' width='600' cellpadding='0' cellspacing='0' style='max-width:600px;'>"
                + "          <tr>"
                + "            <td style='background:#ffffff;border-radius:12px;padding:36px;box-shadow:0 4px 18px rgba(21,28,40,0.08);'>"
                + "              <div style='text-align:center;'>"
                + "                <!-- Optional logo area -->"
                + "                <div style='margin-bottom:18px;'>"
                + "                  <img src='https://via.placeholder.com/120x36?text=Logo' alt='Logo' width='120' style='display:block;margin:0 auto;'>"
                + "                </div>"
                + "                <h2 style='margin:0 0 8px;font-size:20px;color:#111827;font-weight:600;'>Password Reset</h2>"
                + "                <p style='margin:0 0 22px;font-size:14px;color:#6b7280;'>Hi " + escapeHtml(username) + ", use the code below to reset your password. It expires in 10 minutes.</p>"
                + "                <div style='display:inline-block;padding:18px 26px;border-radius:10px;background:linear-gradient(180deg,#fbfbfd,#f7f9fb);box-shadow:0 2px 6px rgba(16,24,40,0.04);margin-bottom:18px;'>"
                + "                  <span style='font-size:28px;letter-spacing:4px;font-weight:700;color:#0f172a;'>" + otp + "</span>"
                + "                </div>"
                + "                <div style='font-size:13px;color:#6b7280;margin-top:8px;'>"
                + "                  <p style='margin:6px 0;'>If you didn't request this, you can safely ignore this email.</p>"
                + "                </div>"
                + "              </div>"
                + "              <div style='border-top:1px solid #eef2f7;margin-top:20px;padding-top:18px;text-align:center;'>"
                + "                <small style='color:#9ca3af;font-size:12px;'>© " + LocalDateTime.now().getYear() + " Your Application. All rights reserved.</small>"
                + "              </div>"
                + "            </td>"
                + "          </tr>"
                + "          <tr><td style='height:18px;line-height:18px;'>&nbsp;</td></tr>"
                + "        </table>"
                + "      </td>"
                + "    </tr>"
                + "  </table>"
                + "</body>"
                + "</html>";

        return html;
    }

    /**
     * Simple HTML-escape for a name/email piece used inside the template.
     * Keeps it minimal (not a full htmlspecialchars implementation).
     */
    private String escapeHtml(String input) {
        if (input == null) return "";
        return input.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#x27;");
    }
}
