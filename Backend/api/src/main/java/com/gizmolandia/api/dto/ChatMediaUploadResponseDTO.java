package com.gizmolandia.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMediaUploadResponseDTO {

    private String mediaUrl;
    private String mediaType;
    private String fileName;
}
