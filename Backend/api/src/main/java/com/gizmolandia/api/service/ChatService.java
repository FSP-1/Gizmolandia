package com.gizmolandia.api.service;

import java.util.List;

import com.gizmolandia.api.dto.ChatJoinResponseDTO;
import com.gizmolandia.api.dto.ChatMessageRequestDTO;
import com.gizmolandia.api.dto.ChatMessageResponseDTO;
import com.gizmolandia.api.dto.ChatScoreOptionDTO;

public interface ChatService {

    ChatJoinResponseDTO joinRoom(String roomType, Long usuarioId);

    ChatJoinResponseDTO leaveRoom(String roomType, Long usuarioId);

    List<ChatMessageResponseDTO> listMessages(String roomType, Integer limit);

    ChatMessageResponseDTO sendMessage(ChatMessageRequestDTO dto);

    List<ChatScoreOptionDTO> listScoreOptions(Long usuarioId);
}
