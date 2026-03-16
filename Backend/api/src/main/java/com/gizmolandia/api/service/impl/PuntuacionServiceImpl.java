package com.gizmolandia.api.service.impl;

import com.gizmolandia.api.dto.PuntuacionRequestDTO;
import com.gizmolandia.api.dto.PuntuacionResponseDTO;
import com.gizmolandia.api.exception.ResourceNotFoundException;
import com.gizmolandia.api.model.Puntuacion;
import com.gizmolandia.api.model.Usuario;
import com.gizmolandia.api.repository.PuntuacionRepository;
import com.gizmolandia.api.repository.UsuarioRepository;
import com.gizmolandia.api.service.PuntuacionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class PuntuacionServiceImpl implements PuntuacionService {

    private final PuntuacionRepository puntuacionRepository;
    private final UsuarioRepository usuarioRepository;

    @Override
    public PuntuacionResponseDTO guardar(PuntuacionRequestDTO dto) {
        Usuario usuario = usuarioRepository.findById(dto.getUsuarioId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Usuario no encontrado con id: " + dto.getUsuarioId()));

        Puntuacion puntuacion = Puntuacion.builder()
                .usuario(usuario)
                .juego(dto.getJuego())
                .puntuacion(dto.getPuntuacion())
                .build();
        return toDTO(puntuacionRepository.save(puntuacion));
    }

    @Override
    @Transactional(readOnly = true)
    public List<PuntuacionResponseDTO> listarPorUsuario(Long usuarioId) {
        return puntuacionRepository.findByUsuarioId(usuarioId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PuntuacionResponseDTO> rankingPorJuego(String juego) {
        return puntuacionRepository.findTopByJuego(juego)
                .stream()
                .limit(10)
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    private PuntuacionResponseDTO toDTO(Puntuacion p) {
        return PuntuacionResponseDTO.builder()
                .id(p.getId())
                .usuarioId(p.getUsuario().getId())
                .nombreUsuario(p.getUsuario().getNombre())
            .fotoUsuario(p.getUsuario().getFoto())
                .juego(p.getJuego())
                .puntuacion(p.getPuntuacion())
                .fechaPartida(p.getFechaPartida())
                .build();
    }
}
