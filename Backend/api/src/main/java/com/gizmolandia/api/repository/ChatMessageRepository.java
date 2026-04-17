package com.gizmolandia.api.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.gizmolandia.api.model.ChatMessage;
import com.gizmolandia.api.model.ChatRoomType;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findTop100ByRoomTypeOrderByCreatedAtDesc(ChatRoomType roomType);
}
