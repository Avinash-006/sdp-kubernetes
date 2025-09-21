package com.klef.sdp.repository;

import com.klef.sdp.model.Session;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SessionRepository extends JpaRepository<Session, Long> {
    Session findByPasskey(String passkey);
}