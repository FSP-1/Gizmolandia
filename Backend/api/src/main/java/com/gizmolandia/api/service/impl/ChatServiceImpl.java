package com.gizmolandia.api.service.impl;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gizmolandia.api.dto.ChatJoinResponseDTO;
import com.gizmolandia.api.dto.ChatMessageRequestDTO;
import com.gizmolandia.api.dto.ChatMessageResponseDTO;
import com.gizmolandia.api.dto.ChatScoreOptionDTO;
import com.gizmolandia.api.exception.ResourceNotFoundException;
import com.gizmolandia.api.model.ChatMediaType;
import com.gizmolandia.api.model.ChatMessage;
import com.gizmolandia.api.model.ChatRoomPresence;
import com.gizmolandia.api.model.ChatRoomType;
import com.gizmolandia.api.model.Puntuacion;
import com.gizmolandia.api.model.Usuario;
import com.gizmolandia.api.repository.ChatMessageRepository;
import com.gizmolandia.api.repository.ChatRoomPresenceRepository;
import com.gizmolandia.api.repository.PuntuacionRepository;
import com.gizmolandia.api.repository.UsuarioRepository;
import com.gizmolandia.api.service.ChatService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class ChatServiceImpl implements ChatService {

    private static final int MAX_USERS_PER_ROOM = 10;
    private static final int MAX_WORDS_PER_MESSAGE = 500;
    private static final int MAX_FETCH_LIMIT = 100;
    private static final Pattern WHITESPACE_PATTERN = Pattern.compile("\\s+");

    private final ChatMessageRepository chatMessageRepository;
    private final ChatRoomPresenceRepository chatRoomPresenceRepository;
    private final UsuarioRepository usuarioRepository;
    private final PuntuacionRepository puntuacionRepository;

    @Override
    public ChatJoinResponseDTO joinRoom(String roomType, Long usuarioId) {
        ChatRoomType parsedRoom = ChatRoomType.from(roomType);
        Usuario usuario = findUsuarioOrThrow(usuarioId);

        ChatRoomPresence presence = chatRoomPresenceRepository
                .findByRoomTypeAndUsuarioId(parsedRoom, usuario.getId())
                .orElse(null);

        if (presence == null || !presence.isActive()) {
            long currentActive = chatRoomPresenceRepository.countByRoomTypeAndActiveIsTrue(parsedRoom);
            if (currentActive >= MAX_USERS_PER_ROOM) {
                throw new IllegalArgumentException("La sala está llena. Máximo 10 personas por chat");
            }

            if (presence == null) {
                presence = ChatRoomPresence.builder()
                        .roomType(parsedRoom)
                        .usuario(usuario)
                        .active(true)
                        .build();
            } else {
                presence.setActive(true);
            }
            chatRoomPresenceRepository.save(presence);
        }

        int activeUsers = (int) chatRoomPresenceRepository.countByRoomTypeAndActiveIsTrue(parsedRoom);
        return ChatJoinResponseDTO.builder()
                .roomType(parsedRoom.name())
                .usuarioId(usuarioId)
                .activeUsers(activeUsers)
                .maxUsers(MAX_USERS_PER_ROOM)
                .joined(true)
                .build();
    }

    @Override
    public ChatJoinResponseDTO leaveRoom(String roomType, Long usuarioId) {
        ChatRoomType parsedRoom = ChatRoomType.from(roomType);
        findUsuarioOrThrow(usuarioId);

        chatRoomPresenceRepository.findByRoomTypeAndUsuarioId(parsedRoom, usuarioId).ifPresent(p -> {
            p.setActive(false);
            chatRoomPresenceRepository.save(p);
        });

        int activeUsers = (int) chatRoomPresenceRepository.countByRoomTypeAndActiveIsTrue(parsedRoom);
        return ChatJoinResponseDTO.builder()
                .roomType(parsedRoom.name())
                .usuarioId(usuarioId)
                .activeUsers(activeUsers)
                .maxUsers(MAX_USERS_PER_ROOM)
                .joined(false)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatMessageResponseDTO> listMessages(String roomType, Integer limit) {
        ChatRoomType parsedRoom = ChatRoomType.from(roomType);

        int safeLimit = limit == null ? 50 : Math.max(1, Math.min(limit, MAX_FETCH_LIMIT));

        List<ChatMessage> ordered = chatMessageRepository.findTop100ByRoomTypeOrderByCreatedAtDesc(parsedRoom)
                .stream()
                .sorted(Comparator.comparing(ChatMessage::getCreatedAt))
                .collect(Collectors.toList());

        int startIndex = Math.max(0, ordered.size() - safeLimit);
        return ordered.subList(startIndex, ordered.size()).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public ChatMessageResponseDTO sendMessage(ChatMessageRequestDTO dto) {
        ChatRoomType parsedRoom = ChatRoomType.from(dto.getRoomType());
        Usuario usuario = findUsuarioOrThrow(dto.getUsuarioId());

        ensureUserInRoom(parsedRoom, usuario.getId());

        String normalizedComment = normalizeComment(dto.getCommentText());
        int wordCount = countWords(normalizedComment);
        if (wordCount == 0) {
            throw new IllegalArgumentException("El comentario no puede estar vacío");
        }
        if (wordCount > MAX_WORDS_PER_MESSAGE) {
            throw new IllegalArgumentException("El comentario excede 500 palabras");
        }

        String mediaUrl = normalizeNullable(dto.getMediaUrl());
        ChatMediaType mediaType = resolveAndValidateMediaType(mediaUrl);

        Puntuacion score = null;
        String scoreGame = null;
        Integer scoreValue = null;

        if (parsedRoom == ChatRoomType.JUEGOS) {
            if (dto.getPuntuacionId() == null) {
                throw new IllegalArgumentException("En la sala JUEGOS debes seleccionar una puntuación jugada");
            }
            score = puntuacionRepository.findByIdAndUsuarioId(dto.getPuntuacionId(), usuario.getId())
                    .orElseThrow(() -> new IllegalArgumentException("La puntuación seleccionada no pertenece al usuario"));
            scoreGame = score.getJuego();
            scoreValue = score.getPuntuacion();
        }

        ChatMessage saved = chatMessageRepository.save(
                ChatMessage.builder()
                        .roomType(parsedRoom)
                        .usuario(usuario)
                        .commentText(normalizedComment)
                        .wordCount(wordCount)
                        .mediaUrl(mediaUrl)
                        .mediaType(mediaType)
                        .puntuacion(score)
                        .scoreGame(scoreGame)
                        .scoreValue(scoreValue)
                        .build()
        );

        return toDTO(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatScoreOptionDTO> listScoreOptions(Long usuarioId) {
        findUsuarioOrThrow(usuarioId);
        return puntuacionRepository.findTop100ByUsuarioIdOrderByFechaPartidaDesc(usuarioId)
                .stream()
                .map(p -> ChatScoreOptionDTO.builder()
                .puntuacionId(p.getId())
                .juego(p.getJuego())
                .puntuacion(p.getPuntuacion())
                .fechaPartida(p.getFechaPartida())
                .build())
                .collect(Collectors.toList());
    }

    private void ensureUserInRoom(ChatRoomType roomType, Long usuarioId) {
        ChatRoomPresence presence = chatRoomPresenceRepository
                .findByRoomTypeAndUsuarioId(roomType, usuarioId)
                .orElseThrow(() -> new IllegalArgumentException("Debes unirte a la sala antes de enviar mensajes"));

        if (!presence.isActive()) {
            throw new IllegalArgumentException("Debes unirte a la sala antes de enviar mensajes");
        }
    }

    private ChatMediaType resolveAndValidateMediaType(String mediaUrl) {
        if (mediaUrl == null || mediaUrl.isBlank()) {
            return null;
        }

        String normalized = mediaUrl.trim().toLowerCase(Locale.ROOT);

        if (normalized.startsWith("data:image/")) {
            if (normalized.startsWith("data:image/gif")) {
                return ChatMediaType.GIF;
            }
            if (normalized.startsWith("data:image/png")
                    || normalized.startsWith("data:image/jpg")
                    || normalized.startsWith("data:image/jpeg")
                    || normalized.startsWith("data:image/webp")) {
                return ChatMediaType.IMAGE;
            }
            throw new IllegalArgumentException("Solo se permite subir imagen normal o GIF");
        }

        String cleanUrl = normalized.split("\\?")[0].split("#")[0];

        if (cleanUrl.endsWith(".gif")) {
            return ChatMediaType.GIF;
        }
        if (cleanUrl.endsWith(".png")
                || cleanUrl.endsWith(".jpg")
                || cleanUrl.endsWith(".jpeg")
                || cleanUrl.endsWith(".webp")) {
            return ChatMediaType.IMAGE;
        }

        throw new IllegalArgumentException("Solo se permite subir imagen normal o GIF");
    }

    private String normalizeComment(String value) {
        return value == null ? "" : value.trim();
    }

    private String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private int countWords(String text) {
        String trimmed = text == null ? "" : text.trim();
        if (trimmed.isEmpty()) {
            return 0;
        }
        return WHITESPACE_PATTERN.split(trimmed).length;
    }

    private Usuario findUsuarioOrThrow(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con id: " + id));
    }

    private ChatMessageResponseDTO toDTO(ChatMessage message) {
        return ChatMessageResponseDTO.builder()
                .id(message.getId())
                .roomType(message.getRoomType().name())
                .usuarioId(message.getUsuario().getId())
                .nombreUsuario(message.getUsuario().getNombre())
                .userProfile(message.getUsuario().getUserProfile())
                .fotoUsuario(message.getUsuario().getFoto())
                .commentText(message.getCommentText())
                .wordCount(message.getWordCount())
                .mediaUrl(message.getMediaUrl())
                .mediaType(Optional.ofNullable(message.getMediaType()).map(Enum::name).orElse(null))
                .puntuacionId(Optional.ofNullable(message.getPuntuacion()).map(Puntuacion::getId).orElse(null))
                .scoreGame(message.getScoreGame())
                .scoreValue(message.getScoreValue())
                .createdAt(message.getCreatedAt())
                .build();
    }
}
