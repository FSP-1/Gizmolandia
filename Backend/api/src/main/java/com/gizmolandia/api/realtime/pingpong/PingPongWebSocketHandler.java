package com.gizmolandia.api.realtime.pingpong;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

@Component
@RequiredArgsConstructor
public class PingPongWebSocketHandler extends TextWebSocketHandler {

    private final PingPongRealtimeService pingPongRealtimeService;
    private final ObjectMapper objectMapper;

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        URI uri = session.getUri();
        String room = queryParam(uri, "room", "public");
        String player = queryParam(uri, "player", "Jugador");
        pingPongRealtimeService.connect(session, room, player);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        JsonNode node = objectMapper.readTree(message.getPayload());
        String type = node.path("type").asText("");

        if ("paddle".equals(type)) {
            pingPongRealtimeService.onPaddle(session, node.path("y").asDouble(0.5));
            return;
        }

        if ("restart".equals(type)) {
            pingPongRealtimeService.onRestart(session);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        pingPongRealtimeService.disconnect(session);
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        pingPongRealtimeService.disconnect(session);
    }

    private String queryParam(URI uri, String key, String fallback) {
        if (uri == null || uri.getQuery() == null || uri.getQuery().isEmpty()) {
            return fallback;
        }

        String[] pairs = uri.getQuery().split("&");
        for (String pair : pairs) {
            String[] parts = pair.split("=", 2);
            if (parts.length == 0) {
                continue;
            }

            String currentKey = decode(parts[0]);
            if (!key.equals(currentKey)) {
                continue;
            }

            if (parts.length == 1) {
                return fallback;
            }

            String value = decode(parts[1]);
            return value.isBlank() ? fallback : value;
        }

        return fallback;
    }

    private String decode(String value) {
        return URLDecoder.decode(value, StandardCharsets.UTF_8);
    }
}
