package com.prode.repository;

import com.prode.entity.Fecha;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FechaRepository extends JpaRepository<Fecha, Long> {

    boolean existsByNombre(String nombre);
}