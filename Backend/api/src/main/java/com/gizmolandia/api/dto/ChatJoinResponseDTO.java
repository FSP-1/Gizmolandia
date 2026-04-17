package com.gizmolandia.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatJoinResponseDTO {

    private String roomType;
    private Long usuarioId;
    private Integer activeUsers;
    private Integer maxUsers;
    private boolean joined;
}
