package com.prode.repository;

import com.prode.entity.Pronostico;
import com.prode.dto.response.LeaderboardEntryResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PronosticoRepository extends JpaRepository<Pronostico, Long> {

    Optional<Pronostico> findByUsuarioIdAndPartidoId(Long usuarioId, Long partidoId);
    List<Pronostico> findByUsuarioId(Long usuarioId);
    List<Pronostico> findByPartidoId(Long partidoId);

    // ── Leaderboard global ──────────────────────────────────────────────────
    @Query("""
        SELECT new com.prode.dto.response.LeaderboardEntryResponse(
            u.id,
            u.nombreUsuario,
            COALESCE(SUM(p.puntosObtenidos), 0L),
            COALESCE(SUM(CASE WHEN p.puntosObtenidos = 3 THEN 1L ELSE 0L END), 0L),
            u.creadoEn
        )
        FROM Usuario u
        LEFT JOIN Pronostico p ON p.usuario = u
        GROUP BY u.id, u.nombreUsuario, u.creadoEn
        ORDER BY
            COALESCE(SUM(p.puntosObtenidos), 0L)         DESC,
            COALESCE(SUM(CASE WHEN p.puntosObtenidos = 3 THEN 1L ELSE 0L END), 0L) DESC,
            u.creadoEn                                   ASC
        """)
    List<LeaderboardEntryResponse> findLeaderboardGlobal();

    // ── Ranking de un grupo (misma lógica, filtrado a miembros) ────────────
    @Query("""
        SELECT new com.prode.dto.response.LeaderboardEntryResponse(
            u.id,
            u.nombreUsuario,
            COALESCE(SUM(p.puntosObtenidos), 0L),
            COALESCE(SUM(CASE WHEN p.puntosObtenidos = 3 THEN 1L ELSE 0L END), 0L),
            u.creadoEn
        )
        FROM MiembroGrupo mg
        JOIN mg.usuario u
        LEFT JOIN Pronostico p ON p.usuario = u
        WHERE mg.grupo.id = :grupoId
        GROUP BY u.id, u.nombreUsuario, u.creadoEn
        ORDER BY
            COALESCE(SUM(p.puntosObtenidos), 0L)         DESC,
            COALESCE(SUM(CASE WHEN p.puntosObtenidos = 3 THEN 1L ELSE 0L END), 0L) DESC,
            u.creadoEn                                   ASC
        """)
    List<LeaderboardEntryResponse> findLeaderboardByGrupo(@Param("grupoId") Long grupoId);
}