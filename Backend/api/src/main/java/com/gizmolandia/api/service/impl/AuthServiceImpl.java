package com.gizmolandia.api.service.impl;

import com.gizmolandia.api.dto.LoginRequestDTO;
import com.gizmolandia.api.dto.UsuarioResponseDTO;
import com.gizmolandia.api.exception.ResourceNotFoundException;
import com.gizmolandia.api.model.Usuario;
import com.gizmolandia.api.repository.UsuarioRepository;
import com.gizmolandia.api.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthServiceImpl implements AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public UsuarioResponseDTO login(LoginRequestDTO dto) {
        Usuario usuario = usuarioRepository.findByNombre(dto.getNombre())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        if (!passwordEncoder.matches(dto.getPassword(), usuario.getPassword())) {
            throw new IllegalArgumentException("Credenciales inválidas");
        }

        return UsuarioResponseDTO.builder()
                .id(usuario.getId())
                .nombre(usuario.getNombre())
                .userProfile(usuario.getUserProfile())
                .nacionalidad(usuario.getNacionalidad())
                .edad(usuario.getEdad())
                .foto(usuario.getFoto())
            .homeBackgroundColor(usuario.getHomeBackgroundColor())
            .homeLeftImage(usuario.getHomeLeftImage())
            .homeRightImage(usuario.getHomeRightImage())
            .homeStatus(usuario.getHomeStatus())
            .homeNameColor(usuario.getHomeNameColor())
            .preferredLanguage(usuario.getPreferredLanguage())
                .fechaRegistro(usuario.getFechaRegistro())
                .build();
    }
}
