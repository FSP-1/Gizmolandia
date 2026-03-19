package com.gizmolandia.api.realtime.pingpong;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class PingPongRealtimeService {

    private static final int TARGET_SCORE = 7;
    private static final double PADDLE_HALF_HEIGHT = 0.12;
    private static final double BALL_RADIUS = 0.015;
    private static final double LEFT_PADDLE_X = 0.03;
    private static final double RIGHT_PADDLE_X = 0.97;

    private final ObjectMapper objectMapper;

    private final Map<String, RoomState> rooms = new ConcurrentHashMap<>();
    private final Map<String, SessionRef> sessionsById = new ConcurrentHashMap<>();
    private final Map<String, WebSocketSession> rawSessions = new ConcurrentHashMap<>();

    public void connect(WebSocketSession session, String roomId, String playerName) throws IOException {
        String normalizedRoomId = normalizeRoomId(roomId);
        String normalizedPlayerName = normalizePlayerName(playerName);
        rawSessions.put(session.getId(), session);

        RoomState room = rooms.computeIfAbsent(normalizedRoomId, RoomState::new);
        Side assignedSide;

        synchronized (room.lock) {
            if (room.leftSessionId == null) {
                room.leftSessionId = session.getId();
                room.leftPlayer = normalizedPlayerName;
                assignedSide = Side.LEFT;
            } else if (room.rightSessionId == null) {
                room.rightSessionId = session.getId();
                room.rightPlayer = normalizedPlayerName;
                assignedSide = Side.RIGHT;
            } else {
                session.close();
                rawSessions.remove(session.getId());
                return;
            }

            sessionsById.put(session.getId(), new SessionRef(room.id, assignedSide));
            room.lastTickNanos = System.nanoTime();

            if (room.hasBothPlayers() && !"PLAYING".equals(room.status)) {
                room.status = "PLAYING";
                room.winner = "";
                resetBall(room, randomDirection());
            }
        }

        broadcastRoom(room.id);
    }

    public void disconnect(WebSocketSession session) {
        rawSessions.remove(session.getId());
        SessionRef ref = sessionsById.remove(session.getId());
        if (ref == null) {
            return;
        }

        RoomState room = rooms.get(ref.roomId());
        if (room == null) {
            return;
        }

        boolean deleteRoom = false;
        synchronized (room.lock) {
            if (ref.side() == Side.LEFT && session.getId().equals(room.leftSessionId)) {
                room.leftSessionId = null;
                room.leftPlayer = "";
            }
            if (ref.side() == Side.RIGHT && session.getId().equals(room.rightSessionId)) {
                room.rightSessionId = null;
                room.rightPlayer = "";
            }

            room.status = "WAITING";
            room.winner = "";
            room.ballX = 0.5;
            room.ballY = 0.5;
            room.ballVX = 0;
            room.ballVY = 0;

            if (!room.hasAnyPlayer()) {
                deleteRoom = true;
            }
        }

        if (deleteRoom) {
            rooms.remove(room.id);
            return;
        }

        broadcastRoom(room.id);
    }

    public void onPaddle(WebSocketSession session, double y) {
        SessionRef ref = sessionsById.get(session.getId());
        if (ref == null) {
            return;
        }

        RoomState room = rooms.get(ref.roomId());
        if (room == null) {
            return;
        }

        double clamped = clamp(y, PADDLE_HALF_HEIGHT, 1 - PADDLE_HALF_HEIGHT);
        synchronized (room.lock) {
            if (ref.side() == Side.LEFT) {
                room.leftPaddleY = clamped;
            } else if (ref.side() == Side.RIGHT) {
                room.rightPaddleY = clamped;
            }
        }
    }

    public void onRestart(WebSocketSession session) {
        SessionRef ref = sessionsById.get(session.getId());
        if (ref == null) {
            return;
        }

        RoomState room = rooms.get(ref.roomId());
        if (room == null) {
            return;
        }

        synchronized (room.lock) {
            if (!room.hasBothPlayers()) {
                return;
            }

            room.leftScore = 0;
            room.rightScore = 0;
            room.winner = "";
            room.status = "PLAYING";
            resetBall(room, randomDirection());
        }

        broadcastRoom(room.id);
    }

    @Scheduled(fixedRate = 16)
    public void tickRooms() {
        for (RoomState room : rooms.values()) {
            tickRoom(room);
            broadcastRoom(room.id);
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
                room.ballX = 0.5;
                room.ballY = 0.5;
                room.ballVX = 0;
                room.ballVY = 0;
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
            room.ballVX = 0;
            room.ballVY = 0;
            room.ballX = 0.5;
            room.ballY = 0.5;
            return;
        }

        if (room.rightScore >= TARGET_SCORE) {
            room.status = "FINISHED";
            room.winner = "RIGHT";
            room.ballVX = 0;
            room.ballVY = 0;
            room.ballX = 0.5;
            room.ballY = 0.5;
            return;
        }

        resetBall(room, directionForServe);
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

    private void broadcastRoom(String roomId) {
        RoomState room = rooms.get(roomId);
        if (room == null) {
            return;
        }

        String leftSessionId;
        String rightSessionId;
        Map<String, Object> baseState;

        synchronized (room.lock) {
            leftSessionId = room.leftSessionId;
            rightSessionId = room.rightSessionId;
            baseState = createBaseState(room);
        }

        if (leftSessionId != null) {
            sendToSession(leftSessionId, baseState, "LEFT");
        }
        if (rightSessionId != null) {
            sendToSession(rightSessionId, baseState, "RIGHT");
        }
    }

    private Map<String, Object> createBaseState(RoomState room) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("type", "state");
        payload.put("roomId", room.id);
        payload.put("status", room.status);
        payload.put("winner", room.winner);
        payload.put("targetScore", TARGET_SCORE);
        payload.put("playersConnected", room.playersConnected());
        payload.put("leftPlayer", room.leftPlayer);
        payload.put("rightPlayer", room.rightPlayer);
        payload.put("scoreLeft", room.leftScore);
        payload.put("scoreRight", room.rightScore);
        payload.put("leftPaddleY", room.leftPaddleY);
        payload.put("rightPaddleY", room.rightPaddleY);
        payload.put("ballX", room.ballX);
        payload.put("ballY", room.ballY);
        return payload;
    }

    private void sendToSession(String sessionId, Map<String, Object> baseState, String side) {
        WebSocketSession session = rawSessions.get(sessionId);
        if (session == null || !session.isOpen()) {
            return;
        }

        Map<String, Object> payload = new HashMap<>(baseState);
        payload.put("yourSide", side);

        try {
            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(payload)));
        } catch (JsonProcessingException ignored) {
            // Ignore malformed serialization for this tick.
        } catch (IOException ignored) {
            // Ignore broken socket writes.
        }
    }

    private double clamp(double value, double min, double max) {
        return Math.max(min, Math.min(max, value));
    }

    private String normalizeRoomId(String roomId) {
        if (roomId == null) {
            return "public";
        }
        String trimmed = roomId.trim();
        if (trimmed.isEmpty()) {
            return "public";
        }
        if (trimmed.length() > 40) {
            return trimmed.substring(0, 40);
        }
        return trimmed;
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

    private record SessionRef(String roomId, Side side) {
    }

    private enum Side {
        LEFT,
        RIGHT
    }

    private static class RoomState {
        private final Object lock = new Object();
        private final String id;

        private String leftSessionId;
        private String rightSessionId;

        private String leftPlayer = "";
        private String rightPlayer = "";

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

        private RoomState(String id) {
            this.id = id;
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
