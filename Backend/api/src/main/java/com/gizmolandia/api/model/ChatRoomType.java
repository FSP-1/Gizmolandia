package com.gizmolandia.api.model;

public enum ChatRoomType {
    NORMAL,
    JUEGOS,
    NERD_STUFF;

    public static ChatRoomType from(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("La sala de chat es obligatoria");
        }

        String normalized = value.trim().toUpperCase().replace('-', '_').replace(' ', '_');
        try {
            return ChatRoomType.valueOf(normalized);
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Sala inválida. Valores permitidos: NORMAL, JUEGOS, NERD_STUFF");
        }
    }
}
