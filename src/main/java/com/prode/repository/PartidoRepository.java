package com.prode.repository;

import com.prode.entity.Partido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PartidoRepository extends JpaRepository<Partido, Long> {

    List<Partido> findByFechaId(Long fechaId);

    List<Partido> findAllByOrderByHoraInicioAsc();
}