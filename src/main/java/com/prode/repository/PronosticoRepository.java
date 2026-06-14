package com.prode.repository;

import com.prode.entity.Pronostico;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PronosticoRepository extends JpaRepository<Pronostico, Long> {

    // Clave para el "upsert": el pronóstico de un usuario para un partido puntual.
    Optional<Pronostico> findByUsuarioIdAndPartidoId(Long usuarioId, Long partidoId);

    // Todos los pronósticos de un usuario (para "mis pronósticos").
    List<Pronostico> findByUsuarioId(Long usuarioId);

    // Todos los pronósticos de un partido (para el motor de puntos y la consulta de terceros).
    List<Pronostico> findByPartidoId(Long partidoId);
}
