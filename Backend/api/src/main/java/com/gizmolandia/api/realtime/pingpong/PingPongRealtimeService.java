package com.gizmolandia.api.realtime.pingpong;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gizmolandia.api.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.ArrayDeque;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class PingPongRealtimeService {

    private static final int TARGET_SCORE = 7;
    private static final int TOTAL_ROOMS = 10;
    private static final int MAX_QUEUE = 20;

    private static final double PADDLE_HALF_HEIGHT = 0.12;
    private static final double BALL_RADIUS = 0.015;
    private static final double LEFT_PADDLE_X = 0.03;
    private static final double RIGHT_PADDLE_X = 0.97;

    private final ObjectMapper objectMapper;
    private final UsuarioRepository usuarioRepository;

    private final Object matchmakingLock = new Object();
    private final Map<Integer, RoomState> rooms = new ConcurrentHashMap<>();
    private final ArrayDeque<QueuedPlayer> waitingQueue = new ArrayDeque<>();
    private final Map<String, SessionRef> sessionsById = new ConcurrentHashMap<>();
    private final Map<String, WebSocketSession> rawSessions = new ConcurrentHashMap<>();
    private final Map<String, Object> sendLocksBySessionId = new ConcurrentHashMap<>();
    private final Map<String, String> sessionIdByPlayerName = new ConcurrentHashMap<>();

    public void connect(WebSocketSession session, String playerName) {
        String normalizedPlayerName = normalizePlayerName(playerName);
        String normalizedPlayerPhoto = normalizePlayerPhoto(resolvePlayerPhoto(normalizedPlayerName));

        synchronized (matchmakingLock) {
            String previousSessionId = sessionIdByPlayerName.get(normalizedPlayerName);
            if (previousSessionId != null && !previousSessionId.equals(session.getId())) {
                // Kick the previous connection for this player and remove it from queue/rooms.
                sendSimple(previousSessionId, "kicked", Map.of("reason", "duplicate_login"));
                disconnectBySessionId(previousSessionId);
                closeSilently(previousSessionId);
            }

            rawSessions.put(session.getId(), session);
            sessionIdByPlayerName.put(normalizedPlayerName, session.getId());

            ensureRooms();
            if (!assignSessionToAvailableSlot(session.getId(), normalizedPlayerName, normalizedPlayerPhoto)) {
                if (waitingQueue.size() >= MAX_QUEUE) {
                    sendSimple(session.getId(), "queue_full", Map.of("maxQueue", MAX_QUEUE));
                    closeSilently(session.getId());
                    return;
                }

                waitingQueue.addLast(new QueuedPlayer(session.getId(), normalizedPlayerName, normalizedPlayerPhoto));
                sendQueuePosition(session.getId());
            }

            pushQueueUpdates();
            broadcastLobbyToAll();
        }
    }

    private void disconnectBySessionId(String sessionId) {
        if (removeQueuedSession(sessionId)) {
            sessionsById.remove(sessionId);
            rawSessions.remove(sessionId);
            sendLocksBySessionId.remove(sessionId);
            return;
        }

        SessionRef ref = sessionsById.remove(sessionId);
        if (ref == null) {
            rawSessions.remove(sessionId);
            sendLocksBySessionId.remove(sessionId);
            return;
        }

        RoomState room = rooms.get(ref.roomIndex());
        if (room != null) {
            removePlayerFromRoom(room, ref.side());
            fillEmptySlotsFromQueue();
            broadcastRoom(room.index);
        }

        rawSessions.remove(sessionId);
        sendLocksBySessionId.remove(sessionId);
        pushQueueUpdates();
        broadcastLobbyToAll();
    }

    private String resolvePlayerPhoto(String normalizedPlayerName) {
        if (normalizedPlayerName == null || normalizedPlayerName.isBlank()) {
            return "";
        }

        try {
            return usuarioRepository.findByNombre(normalizedPlayerName)
                    .map(u -> u.getFoto() == null ? "" : u.getFoto())
                    .orElse("");
        } catch (Exception ignored) {
            return "";
        }
    }

    public void disconnect(WebSocketSession session) {
        rawSessions.remove(session.getId());
        sendLocksBySessionId.remove(session.getId());

        // Remove reverse mapping if it points to this session.
        sessionIdByPlayerName.entrySet().removeIf(e -> e.getValue().equals(session.getId()));

        synchronized (matchmakingLock) {
            if (removeQueuedSession(session.getId())) {
                pushQueueUpdates();
                broadcastLobbyToAll();
                return;
            }

            SessionRef ref = sessionsById.remove(session.getId());
            if (ref == null) {
                broadcastLobbyToAll();
                return;
            }

            RoomState room = rooms.get(ref.roomIndex());
            if (room == null) {
                broadcastLobbyToAll();
                return;
            }

            removePlayerFromRoom(room, ref.side());
            fillEmptySlotsFromQueue();
            broadcastRoom(room.index);
            pushQueueUpdates();
            broadcastLobbyToAll();
        }
    }

    public void onPaddle(WebSocketSession session, double y) {
        SessionRef ref = sessionsById.get(session.getId());
        if (ref == null) {
            return;
        }

        RoomState room = rooms.get(ref.roomIndex());
        if (room == null) {
            return;
        }

        double clamped = clamp(y, PADDLE_HALF_HEIGHT, 1 - PADDLE_HALF_HEIGHT);

        synchronized (room.lock) {
            if (ref.side() == Side.LEFT) {
                room.leftPaddleY = clamped;
            } else {
                room.rightPaddleY = clamped;
            }
        }
    }

    public void onRematchDecision(WebSocketSession session, boolean accept) {
        SessionRef ref = sessionsById.get(session.getId());
        if (ref == null) {
            return;
        }

        synchronized (matchmakingLock) {
            RoomState room = rooms.get(ref.roomIndex());
            if (room == null) {
                return;
            }

            synchronized (room.lock) {
                if (!"FINISHED".equals(room.status)) {
                    return;
                }

                if (!accept) {
                    String kickedSessionId = ref.side() == Side.LEFT ? room.leftSessionId : room.rightSessionId;
                    removePlayerFromRoom(room, ref.side());
                    sendSimple(kickedSessionId, "kicked", Map.of("reason", "rematch_declined"));
                    closeSilently(kickedSessionId);
                    sessionsById.remove(kickedSessionId);
                } else {
                    if (ref.side() == Side.LEFT) {
                        room.leftRematch = true;
                    } else {
                        room.rightRematch = true;
                    }

                    if (Boolean.TRUE.equals(room.leftRematch) && Boolean.TRUE.equals(room.rightRematch)) {
                        startNewMatch(room);
                    }
                }
            }
        }
    }

    public void onPreviewDecision(WebSocketSession session, boolean accept) {
        SessionRef ref = sessionsById.get(session.getId());
        if (ref == null) {
            return;
        }

        synchronized (matchmakingLock) {
            RoomState room = rooms.get(ref.roomIndex());
            if (room == null) {
                return;
            }

            synchronized (room.lock) {
                if (!"PREVIEW".equals(room.status)) {
                    return;
                }

                // Register the player's decision
                if (ref.side() == Side.LEFT) {
                    room.previewLeftAccepted = accept;
                } else {
                    room.previewRightAccepted = accept;
                }

                // Check if either player rejected
                if (!accept) {
                    // Player rejected, remove them and put back in queue
                    String rejectedSessionId = ref.side() == Side.LEFT ? room.leftSessionId : room.rightSessionId;
                    removePlayerFromRoom(room, ref.side());
                    sessionsById.remove(rejectedSessionId);
                    closeSilently(rejectedSessionId);

                    // Put other player back in queue
                    String otherSessionId = ref.side() == Side.LEFT ? room.rightSessionId : room.leftSessionId;
                    String otherPlayerName = ref.side() == Side.LEFT ? room.rightPlayer : room.leftPlayer;
                    String otherPlayerPhoto = ref.side() == Side.LEFT ? room.rightPlayerPhoto : room.leftPlayerPhoto;
                    if (otherSessionId != null) {
                        removePlayerFromRoom(room, ref.side() == Side.LEFT ? Side.RIGHT : Side.LEFT);
                        sessionsById.remove(otherSessionId);
                        waitingQueue.addFirst(new QueuedPlayer(otherSessionId, otherPlayerName, otherPlayerPhoto));
                    }
                } else {
                    // Both players accepted - start the match
                    if (Boolean.TRUE.equals(room.previewLeftAccepted)
                            && Boolean.TRUE.equals(room.previewRightAccepted)) {
                        room.status = "PLAYING";
                        room.previewLeftAccepted = null;
                        room.previewRightAccepted = null;
                        resetBall(room, randomDirection());
                    }
                }
            }

            fillEmptySlotsFromQueue();
            broadcastRoom(room.index);
            pushQueueUpdates();
            broadcastLobbyToAll();
        }
    }

    @Scheduled(fixedRate = 16)
    public void tickRooms() {
        for (RoomState room : rooms.values()) {
            tickRoom(room);
            broadcastRoom(room.index);
        }
    }

    private void tickRoom(RoomState room) {
        synchronized (room.lock) {
            long now = System.nanoTime();
            double deltaSeconds = (now - room.lastTickNanos) / 1_000_000_000.0;
            room.lastTickNanos = now;
            if (deltaSeconds <= 0) {
                return;
            }
            if (deltaSeconds > 0.05) {
                deltaSeconds = 0.05;
            }

            if (!room.hasBothPlayers()) {
                room.status = "WAITING";
                room.winner = "";
                room.ballX = 0.5;
                room.ballY = 0.5;
                room.ballVX = 0;
                room.ballVY = 0;
                return;
            }

            // Handle preview timeout
            if ("PREVIEW".equals(room.status)) {
                long previewElapsedNanos = now - room.previewTimestampNanos;
                if (previewElapsedNanos > 10_000_000_000L) { // 10 seconds
                    // Timeout: auto-decline both players, put back in queue
                    if (room.leftSessionId != null) {
                        waitingQueue
                                .addLast(new QueuedPlayer(room.leftSessionId, room.leftPlayer, room.leftPlayerPhoto));
                    }
                    if (room.rightSessionId != null) {
                        waitingQueue.addLast(
                                new QueuedPlayer(room.rightSessionId, room.rightPlayer, room.rightPlayerPhoto));
                    }
                    removePlayerFromRoom(room, Side.LEFT);
                    removePlayerFromRoom(room, Side.RIGHT);
                    sessionsById.remove(room.leftSessionId);
                    sessionsById.remove(room.rightSessionId);
                    room.leftSessionId = null;
                    room.rightSessionId = null;
                }
                return;
            }

            if (!"PLAYING".equals(room.status)) {
                return;
            }

            room.ballX += room.ballVX * deltaSeconds;
            room.ballY += room.ballVY * deltaSeconds;

            if (room.ballY - BALL_RADIUS <= 0) {
                room.ballY = BALL_RADIUS;
                room.ballVY = Math.abs(room.ballVY);
            }
            if (room.ballY + BALL_RADIUS >= 1) {
                room.ballY = 1 - BALL_RADIUS;
                room.ballVY = -Math.abs(room.ballVY);
            }

            boolean leftCollision = room.ballVX < 0
                    && room.ballX - BALL_RADIUS <= LEFT_PADDLE_X
                    && Math.abs(room.ballY - room.leftPaddleY) <= PADDLE_HALF_HEIGHT;

            boolean rightCollision = room.ballVX > 0
                    && room.ballX + BALL_RADIUS >= RIGHT_PADDLE_X
                    && Math.abs(room.ballY - room.rightPaddleY) <= PADDLE_HALF_HEIGHT;

            if (leftCollision) {
                double impact = (room.ballY - room.leftPaddleY) / PADDLE_HALF_HEIGHT;
                room.ballX = LEFT_PADDLE_X + BALL_RADIUS;
                room.ballVX = Math.abs(room.ballVX) * 1.03;
                room.ballVY += impact * 0.22;
            }

            if (rightCollision) {
                double impact = (room.ballY - room.rightPaddleY) / PADDLE_HALF_HEIGHT;
                room.ballX = RIGHT_PADDLE_X - BALL_RADIUS;
                room.ballVX = -Math.abs(room.ballVX) * 1.03;
                room.ballVY += impact * 0.22;
            }

            if (room.ballX < -0.03) {
                room.rightScore += 1;
                handlePointEnd(room, -1);
            }

            if (room.ballX > 1.03) {
                room.leftScore += 1;
                handlePointEnd(room, 1);
            }
        }
    }

    private void handlePointEnd(RoomState room, int directionForServe) {
        if (room.leftScore >= TARGET_SCORE) {
            room.status = "FINISHED";
            room.winner = "LEFT";
            room.leftRematch = false;
            room.rightRematch = false;
            room.ballVX = 0;
            room.ballVY = 0;
            room.ballX = 0.5;
            room.ballY = 0.5;
            return;
        }

        if (room.rightScore >= TARGET_SCORE) {
            room.status = "FINISHED";
            room.winner = "RIGHT";
            room.leftRematch = false;
            room.rightRematch = false;
            room.ballVX = 0;
            room.ballVY = 0;
            room.ballX = 0.5;
            room.ballY = 0.5;
            return;
        }

        resetBall(room, directionForServe);
    }

    private void startNewMatch(RoomState room) {
        room.leftScore = 0;
        room.rightScore = 0;
        room.winner = "";
        room.leftRematch = null;
        room.rightRematch = null;
        room.previewLeftAccepted = null;
        room.previewRightAccepted = null;
        room.previewTimestampNanos = System.nanoTime();
        room.status = "PREVIEW";

        // Send preview events to both players
        sendMatchPreview(room.leftSessionId, room.rightPlayer, room.rightPlayerPhoto);
        sendMatchPreview(room.rightSessionId, room.leftPlayer, room.leftPlayerPhoto);
    }

    private void fillEmptySlotsFromQueue() {
        ensureRooms();
        while (!waitingQueue.isEmpty()) {
            QueuedPlayer next = waitingQueue.peekFirst();
            if (next == null || !rawSessionIsOpen(next.sessionId())) {
                waitingQueue.pollFirst();
                continue;
            }

            if (!assignSessionToAvailableSlot(next.sessionId(), next.playerName(), next.playerPhoto())) {
                break;
            }

            waitingQueue.pollFirst();
        }
    }

    private boolean assignSessionToAvailableSlot(String sessionId, String playerName, String playerPhoto) {
        RoomState room = findRoomWithSinglePlayer();
        if (room == null) {
            room = findEmptyRoom();
        }
        if (room == null) {
            return false;
        }

        synchronized (room.lock) {
            Side side;
            if (room.leftSessionId == null) {
                room.leftSessionId = sessionId;
                room.leftPlayer = playerName;
                room.leftPlayerPhoto = playerPhoto;
                side = Side.LEFT;
            } else if (room.rightSessionId == null) {
                room.rightSessionId = sessionId;
                room.rightPlayer = playerName;
                room.rightPlayerPhoto = playerPhoto;
                side = Side.RIGHT;
            } else {
                return false;
            }

            sessionsById.put(sessionId, new SessionRef(room.index, side));
            room.lastTickNanos = System.nanoTime();

            if (room.hasBothPlayers()) {
                startNewMatch(room);
            } else {
                room.status = "WAITING";
            }
        }

        return true;
    }

    private RoomState findRoomWithSinglePlayer() {
        for (int i = 1; i <= TOTAL_ROOMS; i++) {
            RoomState room = rooms.get(i);
            if (room == null) {
                continue;
            }
            synchronized (room.lock) {
                if (room.hasAnyPlayer() && !room.hasBothPlayers()) {
                    return room;
                }
            }
        }
        return null;
    }

    private RoomState findEmptyRoom() {
        for (int i = 1; i <= TOTAL_ROOMS; i++) {
            RoomState room = rooms.get(i);
            if (room == null) {
                continue;
            }
            synchronized (room.lock) {
                if (!room.hasAnyPlayer()) {
                    return room;
                }
            }
        }
        return null;
    }

    private void removePlayerFromRoom(RoomState room, Side side) {
        if (side == Side.LEFT) {
            room.leftSessionId = null;
            room.leftPlayer = "";
            room.leftPaddleY = 0.5;
            room.leftRematch = null;
        } else {
            room.rightSessionId = null;
            room.rightPlayer = "";
            room.rightPaddleY = 0.5;
            room.rightRematch = null;
        }

        room.status = "WAITING";
        room.winner = "";
        room.leftScore = 0;
        room.rightScore = 0;
        room.ballX = 0.5;
        room.ballY = 0.5;
        room.ballVX = 0;
        room.ballVY = 0;
    }

    private boolean removeQueuedSession(String sessionId) {
        return waitingQueue.removeIf(q -> q.sessionId().equals(sessionId));
    }

    private void sendMatchPreview(String sessionId, String opponentName, String opponentPhoto) {
        sendSimple(sessionId, "match_preview", Map.of(
                "opponentUsername", opponentName,
                "opponentPhoto", opponentPhoto == null ? "" : opponentPhoto,
                "timeoutSeconds", 10));
    }

    private void sendQueuePosition(String sessionId) {
        int position = 1;
        for (QueuedPlayer queued : waitingQueue) {
            if (queued.sessionId().equals(sessionId)) {
                sendSimple(sessionId, "queue", Map.of(
                        "position", position,
                        "queueSize", waitingQueue.size(),
                        "maxQueue", MAX_QUEUE));
                return;
            }
            position++;
        }
    }

    private void pushQueueUpdates() {
        int position = 1;
        for (QueuedPlayer queued : waitingQueue) {
            sendSimple(queued.sessionId(), "queue", Map.of(
                    "position", position,
                    "queueSize", waitingQueue.size(),
                    "maxQueue", MAX_QUEUE));
            position++;
        }
    }

    private void broadcastLobbyToAll() {
        int usedRooms = calculateUsedRooms();
        int queueSize = waitingQueue.size();

        Map<String, Object> payload = new HashMap<>();
        payload.put("type", "lobby");
        payload.put("usedRooms", usedRooms);
        payload.put("totalRooms", TOTAL_ROOMS);
        payload.put("queueSize", queueSize);
        payload.put("maxQueue", MAX_QUEUE);

        for (String sessionId : rawSessions.keySet()) {
            sendMessage(sessionId, payload);
        }
    }

    private int calculateUsedRooms() {
        int used = 0;
        for (RoomState room : rooms.values()) {
            synchronized (room.lock) {
                if (room.hasAnyPlayer()) {
                    used++;
                }
            }
        }
        return used;
    }

    private void broadcastRoom(int roomIndex) {
        RoomState room = rooms.get(roomIndex);
        if (room == null) {
            return;
        }

        String leftSession;
        String rightSession;
        Map<String, Object> baseState;

        synchronized (room.lock) {
            leftSession = room.leftSessionId;
            rightSession = room.rightSessionId;
            baseState = createBaseState(room);
        }

        if (leftSession != null) {
            Map<String, Object> leftPayload = new HashMap<>(baseState);
            leftPayload.put("yourSide", "LEFT");
            sendMessage(leftSession, leftPayload);
        }

        if (rightSession != null) {
            Map<String, Object> rightPayload = new HashMap<>(baseState);
            rightPayload.put("yourSide", "RIGHT");
            sendMessage(rightSession, rightPayload);
        }
    }

    private Map<String, Object> createBaseState(RoomState room) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("type", "state");
        payload.put("roomId", "ROOM-" + room.index);
        payload.put("status", room.status);
        payload.put("winner", room.winner);
        payload.put("targetScore", TARGET_SCORE);
        payload.put("playersConnected", room.playersConnected());
        payload.put("leftPlayer", room.leftPlayer);
        payload.put("rightPlayer", room.rightPlayer);
        payload.put("leftPlayerPhoto", room.leftPlayerPhoto);
        payload.put("rightPlayerPhoto", room.rightPlayerPhoto);
        payload.put("scoreLeft", room.leftScore);
        payload.put("scoreRight", room.rightScore);
        payload.put("leftPaddleY", room.leftPaddleY);
        payload.put("rightPaddleY", room.rightPaddleY);
        payload.put("ballX", room.ballX);
        payload.put("ballY", room.ballY);
        payload.put("leftRematch", room.leftRematch != null && room.leftRematch);
        payload.put("rightRematch", room.rightRematch != null && room.rightRematch);
        payload.put("usedRooms", calculateUsedRooms());
        payload.put("totalRooms", TOTAL_ROOMS);
        payload.put("queueSize", waitingQueue.size());
        payload.put("maxQueue", MAX_QUEUE);
        return payload;
    }

    private void sendSimple(String sessionId, String type, Map<String, Object> values) {
        Map<String, Object> payload = new HashMap<>(values);
        payload.put("type", type);
        sendMessage(sessionId, payload);
    }

    private void sendMessage(String sessionId, Map<String, Object> payload) {
        WebSocketSession session = rawSessions.get(sessionId);
        if (session == null || !session.isOpen()) {
            return;
        }

        Object lock = sendLocksBySessionId.computeIfAbsent(sessionId, ignored -> new Object());
        synchronized (lock) {
            // Re-check under lock: session may have been closed while waiting.
            WebSocketSession current = rawSessions.get(sessionId);
            if (current == null || !current.isOpen()) {
                return;
            }

            try {
                current.sendMessage(new TextMessage(objectMapper.writeValueAsString(payload)));
            } catch (JsonProcessingException ignored) {
                // Ignore serialization errors for transient events.
            } catch (IOException ignored) {
                // Ignore broken sockets.
            } catch (IllegalStateException ignored) {
                // Session can close between isOpen() and sendMessage() under load/ticks.
                rawSessions.remove(sessionId);
                sendLocksBySessionId.remove(sessionId);
            }
        }
    }

    private void closeSilently(String sessionId) {
        WebSocketSession session = rawSessions.get(sessionId);
        if (session == null) {
            return;
        }

        try {
            session.close();
        } catch (IOException ignored) {
            // Ignore close errors.
        } finally {
            rawSessions.remove(sessionId);
            sendLocksBySessionId.remove(sessionId);
        }
    }

    private boolean rawSessionIsOpen(String sessionId) {
        WebSocketSession session = rawSessions.get(sessionId);
        return session != null && session.isOpen();
    }

    private void resetBall(RoomState room, int xDirection) {
        room.ballX = 0.5;
        room.ballY = 0.5;
        room.ballVX = 0.42 * xDirection;
        room.ballVY = ThreadLocalRandom.current().nextDouble(-0.18, 0.18);
        room.leftPaddleY = clamp(room.leftPaddleY, PADDLE_HALF_HEIGHT, 1 - PADDLE_HALF_HEIGHT);
        room.rightPaddleY = clamp(room.rightPaddleY, PADDLE_HALF_HEIGHT, 1 - PADDLE_HALF_HEIGHT);
    }

    private int randomDirection() {
        return ThreadLocalRandom.current().nextBoolean() ? 1 : -1;
    }

    private double clamp(double value, double min, double max) {
        return Math.max(min, Math.min(max, value));
    }

    private String normalizePlayerName(String playerName) {
        if (playerName == null) {
            return "Jugador";
        }
        String trimmed = playerName.trim();
        if (trimmed.isEmpty()) {
            return "Jugador";
        }
        if (trimmed.length() > 24) {
            return trimmed.substring(0, 24);
        }
        return trimmed;
    }

    private String normalizePlayerPhoto(String playerPhoto) {
        if (playerPhoto == null) {
            return "";
        }

        String trimmed = playerPhoto.trim();
        if (trimmed.isEmpty()) {
            return "";
        }

        // Accept full data URIs as-is.
        if (trimmed.regionMatches(true, 0, "data:image/", 0, "data:image/".length())) {
            return capPhoto(trimmed);
        }

        // If DB stores raw base64 (no prefix), wrap it into a valid data URI.
        // We default to jpeg to match the common case used in the app.
        String maybeBase64 = trimmed;
        if (maybeBase64.startsWith("/9j/")) {
            return capPhoto("data:image/jpeg;base64," + maybeBase64);
        }

        // Allow http(s) URLs if you ever store them.
        if (trimmed.regionMatches(true, 0, "http://", 0, "http://".length())
                || trimmed.regionMatches(true, 0, "https://", 0, "https://".length())) {
            return capPhoto(trimmed);
        }

        // Unknown format -> don't send it (avoids invalid URL requests on the client).
        return "";
    }

    private String capPhoto(String photo) {
        if (photo == null) {
            return "";
        }

        String trimmed = photo.trim();
        // Allow bigger than before (data URIs can be larger) but still cap to avoid
        // abuse.
        int max = 200_000;
        if (trimmed.length() > max) {
            return trimmed.substring(0, max);
        }
        return trimmed;
    }

    private void ensureRooms() {
        for (int i = 1; i <= TOTAL_ROOMS; i++) {
            rooms.computeIfAbsent(i, RoomState::new);
        }
    }

    private record SessionRef(int roomIndex, Side side) {
    }

    private record QueuedPlayer(String sessionId, String playerName, String playerPhoto) {
    }

    private enum Side {
        LEFT,
        RIGHT
    }

    private static class RoomState {
        private final Object lock = new Object();
        private final int index;

        private String leftSessionId;
        private String rightSessionId;

        private String leftPlayer = "";
        private String rightPlayer = "";

        private String leftPlayerPhoto = "";
        private String rightPlayerPhoto = "";

        private double leftPaddleY = 0.5;
        private double rightPaddleY = 0.5;

        private double ballX = 0.5;
        private double ballY = 0.5;
        private double ballVX;
        private double ballVY;

        private int leftScore;
        private int rightScore;
        private String status = "WAITING";
        private String winner = "";
        private long lastTickNanos = System.nanoTime();
        private Boolean leftRematch;
        private Boolean rightRematch;

        // Preview-related fields
        private Boolean previewLeftAccepted;
        private Boolean previewRightAccepted;
        private long previewTimestampNanos;

        private RoomState(int index) {
            this.index = index;
        }

        private boolean hasBothPlayers() {
            return leftSessionId != null && rightSessionId != null;
        }

        private boolean hasAnyPlayer() {
            return leftSessionId != null || rightSessionId != null;
        }

        private int playersConnected() {
            int count = 0;
            if (leftSessionId != null) {
                count++;
            }
            if (rightSessionId != null) {
                count++;
            }
            return count;
        }
    }
}
