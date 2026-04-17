package com.gizmolandia.api.service;

import java.util.List;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import com.gizmolandia.api.dto.ChatAvatarContentDTO;
import com.gizmolandia.api.dto.ChatJoinResponseDTO;
import com.gizmolandia.api.dto.ChatMediaUploadResponseDTO;
import com.gizmolandia.api.dto.ChatMessageRequestDTO;
import com.gizmolandia.api.dto.ChatMessageResponseDTO;
import com.gizmolandia.api.dto.ChatScoreOptionDTO;

public interface ChatService {

    ChatJoinResponseDTO joinRoom(String roomType, Long usuarioId);

    ChatJoinResponseDTO leaveRoom(String roomType, Long usuarioId);

    List<ChatMessageResponseDTO> listMessages(String roomType, Integer limit, Long afterId);

    ChatMessageResponseDTO sendMessage(ChatMessageRequestDTO dto);

    ChatMediaUploadResponseDTO uploadMedia(MultipartFile file);

    Resource loadMedia(String fileName);

    ChatAvatarContentDTO loadAvatar(Long usuarioId);

    List<ChatScoreOptionDTO> listScoreOptions(Long usuarioId);
}
