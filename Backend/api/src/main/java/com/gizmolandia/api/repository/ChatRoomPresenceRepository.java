package com.gizmolandia.api.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.gizmolandia.api.model.ChatRoomPresence;
import com.gizmolandia.api.model.ChatRoomType;

@Repository
public interface ChatRoomPresenceRepository extends JpaRepository<ChatRoomPresence, Long> {

    long countByRoomTypeAndActiveIsTrue(ChatRoomType roomType);

    Optional<ChatRoomPresence> findByRoomTypeAndUsuarioId(ChatRoomType roomType, Long usuarioId);
}
