package com.gizmolandia.api.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.gizmolandia.api.model.Usuario;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByNombre(String nombre);
    Optional<Usuario> findByUserProfile(String userProfile);
    boolean existsByNombre(String nombre);
    boolean existsByUserProfile(String userProfile);

    @Modifying
    @Query("""
            update Usuario u
               set u.homeBackgroundColor = :backgroundColor,
                   u.homeLeftImage = :leftImage,
                   u.homeRightImage = :rightImage,
                   u.homeStatus = :userStatus,
                   u.homeNameColor = :nameColor,
                   u.preferredLanguage = :language,
                   u.foto = :profileImage
             where u.id = :id
            """)
    int updatePersonalizacion(
            @Param("id") Long id,
            @Param("backgroundColor") String backgroundColor,
            @Param("leftImage") String leftImage,
            @Param("rightImage") String rightImage,
            @Param("userStatus") String userStatus,
            @Param("nameColor") String nameColor,
            @Param("language") String language,
            @Param("profileImage") String profileImage
    );
}
