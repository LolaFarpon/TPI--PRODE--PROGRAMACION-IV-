package com.prode.repository;

import com.prode.entity.Grupo;
import com.prode.entity.MiembroGrupo;
import com.prode.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MiembroGrupoRepository extends JpaRepository<MiembroGrupo, Long> {

    boolean existsByGrupoAndUsuario(Grupo grupo, Usuario usuario);

    List<MiembroGrupo> findByUsuario(Usuario usuario);

    List<MiembroGrupo> findByGrupo(Grupo grupo);
}