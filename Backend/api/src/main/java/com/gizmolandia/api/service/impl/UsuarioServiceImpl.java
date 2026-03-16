package com.gizmolandia.api.service.impl;

import com.gizmolandia.api.dto.UsuarioRequestDTO;
import com.gizmolandia.api.dto.UsuarioResponseDTO;
import com.gizmolandia.api.exception.ResourceNotFoundException;
import com.gizmolandia.api.model.Usuario;
import com.gizmolandia.api.repository.UsuarioRepository;
import com.gizmolandia.api.service.UsuarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class UsuarioServiceImpl implements UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public UsuarioResponseDTO crear(UsuarioRequestDTO dto) {
        if (usuarioRepository.existsByNombre(dto.getNombre())) {
            throw new IllegalArgumentException("El nombre de usuario ya existe");
        }
        if (usuarioRepository.existsByUserProfile(dto.getUserProfile())) {
            throw new IllegalArgumentException("El perfil visible ya existe");
        }

        Usuario usuario = Usuario.builder()
                .nombre(dto.getNombre())
                .userProfile(dto.getUserProfile())
                .nacionalidad(dto.getNacionalidad())
                .edad(dto.getEdad())
                .foto(dto.getFoto())
                .password(passwordEncoder.encode(dto.getPassword()))
                .build();
        return toDTO(usuarioRepository.save(usuario));
    }

    @Override
    @Transactional(readOnly = true)
    public List<UsuarioResponseDTO> listarTodos() {
        return usuarioRepository.findAll()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public UsuarioResponseDTO buscarPorId(Long id) {
        return toDTO(findOrThrow(id));
    }

    @Override
    @Transactional(readOnly = true)
    public UsuarioResponseDTO buscarPorPerfil(String userProfile) {
        return usuarioRepository.findByUserProfile(userProfile)
                .map(this::toDTO)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Usuario no encontrado con perfil: " + userProfile));
    }

    @Override
    public UsuarioResponseDTO actualizar(Long id, UsuarioRequestDTO dto) {
        Usuario usuario = findOrThrow(id);

        if (!usuario.getNombre().equals(dto.getNombre()) && usuarioRepository.existsByNombre(dto.getNombre())) {
            throw new IllegalArgumentException("El nombre de usuario ya existe");
        }
        if (!usuario.getUserProfile().equals(dto.getUserProfile()) && usuarioRepository.existsByUserProfile(dto.getUserProfile())) {
            throw new IllegalArgumentException("El perfil visible ya existe");
        }

        usuario.setNombre(dto.getNombre());
        usuario.setUserProfile(dto.getUserProfile());
        usuario.setNacionalidad(dto.getNacionalidad());
        usuario.setEdad(dto.getEdad());
        if (dto.getFoto() != null) {
            usuario.setFoto(dto.getFoto());
        }
        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            usuario.setPassword(passwordEncoder.encode(dto.getPassword()));
        }
        return toDTO(usuarioRepository.save(usuario));
    }

    @Override
    public void eliminar(Long id) {
        findOrThrow(id);
        usuarioRepository.deleteById(id);
    }

    private Usuario findOrThrow(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Usuario no encontrado con id: " + id));
    }

    private UsuarioResponseDTO toDTO(Usuario u) {
        return UsuarioResponseDTO.builder()
                .id(u.getId())
                .nombre(u.getNombre())
                .userProfile(u.getUserProfile())
                .nacionalidad(u.getNacionalidad())
                .edad(u.getEdad())
                .foto(u.getFoto())
                .fechaRegistro(u.getFechaRegistro())
                .build();
    }
}
