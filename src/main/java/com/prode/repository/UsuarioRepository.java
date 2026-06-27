package com.prode.repository;

import com.prode.entity.Pronostico;
import com.prode.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByEmail(String email);
    Optional<Usuario> findByNombreUsuario(String nombreUsuario);
    boolean existsByEmail(String email);
    boolean existsByNombreUsuario(String nombreUsuario);

    // --- Leaderboard ---
    @Query("""
        SELECT u,
               COALESCE(SUM(p.puntosObtenidos), 0)                                AS puntosTotales,
               COALESCE(SUM(CASE WHEN p.puntosObtenidos = 3 THEN 1 ELSE 0 END), 0) AS exactos
        FROM   Usuario u
        LEFT JOIN Pronostico p ON p.usuario = u
        GROUP BY u
        ORDER BY puntosTotales DESC, exactos DESC, u.creadoEn ASC
        """)
    List<Object[]> findLeaderboardData();
}