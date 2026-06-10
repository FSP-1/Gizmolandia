package com.gizmolandia.api.service.impl;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Base64;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.gizmolandia.api.dto.ChatAvatarContentDTO;
import com.gizmolandia.api.dto.ChatJoinResponseDTO;
import com.gizmolandia.api.dto.ChatMediaUploadResponseDTO;
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
    private static final int MAX_INLINE_AVATAR_LENGTH = 4096;
    private static final long MAX_MEDIA_BYTES = 30_000_000L; // 30MB
    private static final Path MEDIA_STORAGE_DIR = Paths.get("uploads", "chat-media");
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
    public List<ChatMessageResponseDTO> listMessages(String roomType, Integer limit, Long afterId) {
        ChatRoomType parsedRoom = ChatRoomType.from(roomType);

        int safeLimit = limit == null ? 50 : Math.max(1, Math.min(limit, MAX_FETCH_LIMIT));

        if (afterId != null && afterId > 0) {
            List<ChatMessage> incremental = chatMessageRepository
                    .findTop100ByRoomTypeAndIdGreaterThanOrderByIdAsc(parsedRoom, afterId);

            return incremental.stream()
                    .limit(safeLimit)
                    .map(this::toDTO)
                    .collect(Collectors.toList());
        }

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
                    .orElseThrow(
                            () -> new IllegalArgumentException("La puntuación seleccionada no pertenece al usuario"));
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
                        .build());

        return toDTO(saved);
    }

    @Override
    public ChatMediaUploadResponseDTO uploadMedia(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Debes seleccionar una imagen");
        }

        if (file.getSize() > MAX_MEDIA_BYTES) {
            throw new IllegalArgumentException("La imagen es demasiado grande");
        }

        ChatMediaType mediaType = resolveUploadedMediaType(file.getContentType(), file.getOriginalFilename());
        String extension = resolveUploadedExtension(file.getContentType(), file.getOriginalFilename());

        try {
            Files.createDirectories(MEDIA_STORAGE_DIR);

            String fileName = UUID.randomUUID() + extension;
            Path target = resolveMediaPath(fileName);

            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, target, StandardCopyOption.REPLACE_EXISTING);
            }

            String mediaUrl = ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path("/api/chat/media/")
                    .path(fileName)
                    .toUriString();

            return ChatMediaUploadResponseDTO.builder()
                    .mediaUrl(mediaUrl)
                    .mediaType(mediaType.name())
                    .fileName(fileName)
                    .build();
        } catch (IOException ex) {
            throw new IllegalStateException("No se pudo guardar la imagen", ex);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Resource loadMedia(String fileName) {
        Path target = resolveMediaPath(fileName);
        if (!Files.exists(target) || !Files.isRegularFile(target)) {
            throw new ResourceNotFoundException("Imagen no encontrada");
        }
        try {
            return new UrlResource(target.toUri());
        } catch (IOException ex) {
            throw new IllegalStateException("No se pudo leer la imagen", ex);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public ChatAvatarContentDTO loadAvatar(Long usuarioId) {
        Usuario usuario = findUsuarioOrThrow(usuarioId);
        String avatar = normalizeNullable(usuario.getFoto());

        if (avatar == null || !avatar.toLowerCase(Locale.ROOT).startsWith("data:")) {
            throw new ResourceNotFoundException("Avatar no disponible");
        }

        int commaIndex = avatar.indexOf(',');
        if (commaIndex <= 0) {
            throw new IllegalArgumentException("Avatar inválido");
        }

        String metadata = avatar.substring(5, commaIndex);
        String payload = avatar.substring(commaIndex + 1);

        if (!metadata.toLowerCase(Locale.ROOT).contains(";base64")) {
            throw new IllegalArgumentException("Avatar inválido");
        }

        int separatorIndex = metadata.indexOf(';');
        String contentType = separatorIndex > 0
                ? metadata.substring(0, separatorIndex)
                : "application/octet-stream";

        try {
            byte[] content = Base64.getDecoder().decode(payload);
            return ChatAvatarContentDTO.builder()
                    .content(content)
                    .contentType(contentType)
                    .build();
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Avatar inválido");
        }
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

    private ChatMediaType resolveUploadedMediaType(String contentType, String originalFilename) {
        String normalizedContentType = normalizeNullable(contentType);
        String normalizedFilename = normalizeNullable(originalFilename);

        if (isGifContent(normalizedContentType) || isGifFilename(normalizedFilename)) {
            return ChatMediaType.GIF;
        }

        if (isImageContent(normalizedContentType) || isImageFilename(normalizedFilename)) {
            return ChatMediaType.IMAGE;
        }

        throw new IllegalArgumentException("Solo se permite subir imagen normal o GIF");
    }

    private String resolveUploadedExtension(String contentType, String originalFilename) {
        String normalizedContentType = normalizeNullable(contentType);
        String normalizedFilename = normalizeNullable(originalFilename);

        if (isGifContent(normalizedContentType) || isGifFilename(normalizedFilename)) {
            return ".gif";
        }
        if (isPngContent(normalizedContentType) || isPngFilename(normalizedFilename)) {
            return ".png";
        }
        if (isJpegContent(normalizedContentType) || isJpegFilename(normalizedFilename)) {
            return ".jpg";
        }
        if (isWebpContent(normalizedContentType) || isWebpFilename(normalizedFilename)) {
            return ".webp";
        }

        throw new IllegalArgumentException("Solo se permite subir imagen normal o GIF");
    }

    private boolean isGifContent(String value) {
        return value != null && value.toLowerCase(Locale.ROOT).startsWith("image/gif");
    }

    private boolean isPngContent(String value) {
        return value != null && value.toLowerCase(Locale.ROOT).startsWith("image/png");
    }

    private boolean isJpegContent(String value) {
        if (value == null) {
            return false;
        }
        String lower = value.toLowerCase(Locale.ROOT);
        return lower.startsWith("image/jpeg") || lower.startsWith("image/jpg");
    }

    private boolean isWebpContent(String value) {
        return value != null && value.toLowerCase(Locale.ROOT).startsWith("image/webp");
    }

    private boolean isImageContent(String value) {
        return isPngContent(value) || isJpegContent(value) || isWebpContent(value);
    }

    private boolean isGifFilename(String value) {
        return value != null && value.toLowerCase(Locale.ROOT).endsWith(".gif");
    }

    private boolean isPngFilename(String value) {
        return value != null && value.toLowerCase(Locale.ROOT).endsWith(".png");
    }

    private boolean isJpegFilename(String value) {
        if (value == null) {
            return false;
        }
        String lower = value.toLowerCase(Locale.ROOT);
        return lower.endsWith(".jpg") || lower.endsWith(".jpeg");
    }

    private boolean isWebpFilename(String value) {
        return value != null && value.toLowerCase(Locale.ROOT).endsWith(".webp");
    }

    private boolean isImageFilename(String value) {
        return isPngFilename(value) || isJpegFilename(value) || isWebpFilename(value);
    }

    private Path resolveMediaPath(String fileName) {
        String safeFileName = Paths.get(fileName).getFileName().toString();
        Path baseDir = MEDIA_STORAGE_DIR.toAbsolutePath().normalize();
        Path resolved = baseDir.resolve(safeFileName).normalize();

        if (!resolved.startsWith(baseDir)) {
            throw new IllegalArgumentException("Nombre de archivo inválido");
        }

        return resolved;
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
        String fotoUsuario = normalizeChatAvatar(message.getUsuario().getId(), message.getUsuario().getFoto());
        return ChatMessageResponseDTO.builder()
                .id(message.getId())
                .roomType(message.getRoomType().name())
                .usuarioId(message.getUsuario().getId())
                .nombreUsuario(message.getUsuario().getNombre())
                .userProfile(message.getUsuario().getUserProfile())
                .fotoUsuario(fotoUsuario)
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

    private String normalizeChatAvatar(Long usuarioId, String avatar) {
        if (avatar == null) {
            return null;
        }

        String trimmed = avatar.trim();
        if (trimmed.isEmpty()) {
            return null;
        }

        String lower = trimmed.toLowerCase(Locale.ROOT);
        if (lower.startsWith("data:image/") && trimmed.length() > MAX_INLINE_AVATAR_LENGTH) {
            return ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path("/api/chat/avatars/")
                    .path(String.valueOf(usuarioId))
                    .queryParam("v", System.currentTimeMillis())
                    .toUriString();
        }

        return trimmed;
    }
}
