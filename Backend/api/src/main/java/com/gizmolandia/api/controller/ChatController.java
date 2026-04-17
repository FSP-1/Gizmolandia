package com.gizmolandia.api.controller;

import java.util.List;
import java.util.concurrent.TimeUnit;

import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;

import com.gizmolandia.api.dto.ChatJoinResponseDTO;
import com.gizmolandia.api.dto.ChatMediaUploadResponseDTO;
import com.gizmolandia.api.dto.ChatMessageRequestDTO;
import com.gizmolandia.api.dto.ChatMessageResponseDTO;
import com.gizmolandia.api.dto.ChatScoreOptionDTO;
import com.gizmolandia.api.service.ChatService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/{roomType}/join")
    public ResponseEntity<ChatJoinResponseDTO> joinRoom(
            @PathVariable String roomType,
            @RequestParam Long usuarioId
    ) {
        return ResponseEntity.ok(chatService.joinRoom(roomType, usuarioId));
    }

    @PostMapping("/{roomType}/leave")
    public ResponseEntity<ChatJoinResponseDTO> leaveRoom(
            @PathVariable String roomType,
            @RequestParam Long usuarioId
    ) {
        return ResponseEntity.ok(chatService.leaveRoom(roomType, usuarioId));
    }

    @GetMapping("/{roomType}/mensajes")
    public ResponseEntity<List<ChatMessageResponseDTO>> listMessages(
            @PathVariable String roomType,
            @RequestParam(defaultValue = "50") Integer limit
    ) {
        return ResponseEntity.ok(chatService.listMessages(roomType, limit));
    }

    @PostMapping("/mensajes")
    public ResponseEntity<ChatMessageResponseDTO> sendMessage(@Valid @RequestBody ChatMessageRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(chatService.sendMessage(dto));
    }

    @PostMapping(value = "/media/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ChatMediaUploadResponseDTO> uploadMedia(@RequestPart("file") org.springframework.web.multipart.MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED).body(chatService.uploadMedia(file));
    }

    @GetMapping("/media/{fileName:.+}")
    public ResponseEntity<Resource> loadMedia(@PathVariable String fileName) {
        Resource resource = chatService.loadMedia(fileName);
        MediaType mediaType = MediaTypeFactory.getMediaType(resource).orElse(MediaType.APPLICATION_OCTET_STREAM);
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(30, TimeUnit.DAYS).cachePublic().noTransform())
                .contentType(mediaType)
                .body(resource);
    }

    @GetMapping("/juegos/puntuaciones/{usuarioId}")
    public ResponseEntity<List<ChatScoreOptionDTO>> listScoreOptions(@PathVariable Long usuarioId) {
        return ResponseEntity.ok(chatService.listScoreOptions(usuarioId));
    }
}
