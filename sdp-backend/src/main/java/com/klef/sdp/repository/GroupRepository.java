package com.klef.sdp.repository;

import com.klef.sdp.model.Group;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GroupRepository extends JpaRepository<Group, String> {
    @Query("SELECT g FROM Group g WHERE :username MEMBER OF g.usernames")
    List<Group> findByUsernamesContaining(String username);
}