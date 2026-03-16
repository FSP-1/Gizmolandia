package com.gizmolandia.api.service.impl;

import com.gizmolandia.api.dto.UsuarioRequestDTO;
import com.gizmolandia.api.dto.UsuarioResponseDTO;
import com.gizmolandia.api.exception.ResourceNotFoundException;
import com.gizmolandia.api.model.Usuario;
import com.gizmolandia.api.repository.UsuarioRepository;
import com.gizmolandia.api.service.UsuarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class UsuarioServiceImpl implements UsuarioService {

    private final UsuarioRepository usuarioRepository;

    @Override
    public UsuarioResponseDTO crear(UsuarioRequestDTO dto) {
        Usuario usuario = Usuario.builder()
                .nombre(dto.getNombre())
                .userProfile(dto.getUserProfile())
                .nacionalidad(dto.getNacionalidad())
                .edad(dto.getEdad())
                .foto(dto.getFoto())
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
        usuario.setNombre(dto.getNombre());
        usuario.setUserProfile(dto.getUserProfile());
        usuario.setNacionalidad(dto.getNacionalidad());
        usuario.setEdad(dto.getEdad());
        if (dto.getFoto() != null) {
            usuario.setFoto(dto.getFoto());
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
