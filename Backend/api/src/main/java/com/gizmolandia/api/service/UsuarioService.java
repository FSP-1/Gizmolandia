package com.gizmolandia.api.service;

import java.util.List;

import com.gizmolandia.api.dto.UsuarioPersonalizacionDTO;
import com.gizmolandia.api.dto.UsuarioRequestDTO;
import com.gizmolandia.api.dto.UsuarioResponseDTO;

public interface UsuarioService {
    UsuarioResponseDTO crear(UsuarioRequestDTO dto);
    List<UsuarioResponseDTO> listarTodos();
    UsuarioResponseDTO buscarPorId(Long id);
    UsuarioResponseDTO buscarPorPerfil(String userProfile);
    UsuarioResponseDTO actualizar(Long id, UsuarioRequestDTO dto);
    UsuarioResponseDTO actualizarPersonalizacion(Long id, UsuarioPersonalizacionDTO dto);
    void eliminar(Long id);
}
