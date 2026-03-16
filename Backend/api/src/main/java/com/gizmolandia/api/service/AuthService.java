package com.gizmolandia.api.service;

import com.gizmolandia.api.dto.LoginRequestDTO;
import com.gizmolandia.api.dto.UsuarioResponseDTO;

public interface AuthService {
    UsuarioResponseDTO login(LoginRequestDTO dto);
}
