package com.gizmolandia.api.service;

import java.util.List;

import com.gizmolandia.api.dto.PuntuacionRequestDTO;
import com.gizmolandia.api.dto.PuntuacionResponseDTO;

public interface PuntuacionService {
    PuntuacionResponseDTO guardar(PuntuacionRequestDTO dto);
    List<PuntuacionResponseDTO> listarPorUsuario(Long usuarioId);
    List<PuntuacionResponseDTO> rankingPorJuego(String juego);
}
