package com.prode.service;

import com.prode.dto.request.CrearGrupoRequest;
import com.prode.dto.request.UnirseGrupoRequest;
import com.prode.dto.response.GrupoResponse;
import com.prode.dto.response.LeaderboardEntryResponse;
import com.prode.entity.Grupo;
import com.prode.entity.MiembroGrupo;
import com.prode.entity.Usuario;
import com.prode.exception.ConflictoException;
import com.prode.exception.RecursoNoEncontradoException;
import com.prode.repository.GrupoRepository;
import com.prode.repository.MiembroGrupoRepository;
import com.prode.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GrupoService {

    private final GrupoRepository        grupoRepository;
    private final MiembroGrupoRepository miembroGrupoRepository;
    private final UsuarioRepository      usuarioRepository;
    private final LeaderboardService     leaderboardService;

    private static final String CARACTERES = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int    LONGITUD_CODIGO = 7;
    private static final SecureRandom RANDOM = new SecureRandom();

    // ── Crear grupo ─────────────────────────────────────────────────────────
    @Transactional
    public GrupoResponse crearGrupo(CrearGrupoRequest request, String emailPropietario) {

        Usuario propietario = buscarUsuarioPorEmail(emailPropietario);

        Grupo grupo = new Grupo();
        grupo.setNombre(request.getNombre());
        grupo.setCodigoInvitacion(generarCodigoUnico());
        grupo.setPropietario(propietario);
        grupoRepository.save(grupo);

        // El creador queda automáticamente como miembro
        MiembroGrupo miembro = new MiembroGrupo();
        miembro.setGrupo(grupo);
        miembro.setUsuario(propietario);
        miembroGrupoRepository.save(miembro);

        return toResponse(grupo);
    }

    // ── Unirse a grupo ──────────────────────────────────────────────────────
    @Transactional
    public GrupoResponse unirseAGrupo(UnirseGrupoRequest request, String emailUsuario) {

        Usuario usuario = buscarUsuarioPorEmail(emailUsuario);

        Grupo grupo = grupoRepository.findByCodigoInvitacion(request.getCodigoInvitacion())
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No existe un grupo con ese código de invitación"));

        if (miembroGrupoRepository.existsByGrupoAndUsuario(grupo, usuario)) {
            throw new ConflictoException("Ya sos miembro de este grupo");
        }

        MiembroGrupo miembro = new MiembroGrupo();
        miembro.setGrupo(grupo);
        miembro.setUsuario(usuario);
        miembroGrupoRepository.save(miembro);

        return toResponse(grupo);
    }

    // ── Mis grupos ──────────────────────────────────────────────────────────
    public List<GrupoResponse> obtenerMisGrupos(String emailUsuario) {
        Usuario usuario = buscarUsuarioPorEmail(emailUsuario);
        return miembroGrupoRepository.findByUsuario(usuario)
                .stream()
                .map(mg -> toResponse(mg.getGrupo()))
                .toList();
    }

    // ── Ranking del grupo ───────────────────────────────────────────────────
    public List<LeaderboardEntryResponse> obtenerRankingGrupo(Long grupoId) {
        if (!grupoRepository.existsById(grupoId)) {
            throw new RecursoNoEncontradoException("Grupo no encontrado");
        }
        return leaderboardService.obtenerLeaderboardPorGrupo(grupoId);
    }

    // ── Helpers ─────────────────────────────────────────────────────────────
    private Usuario buscarUsuarioPorEmail(String email) {
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario no encontrado"));
    }

    private String generarCodigoUnico() {
        String codigo;
        do {
            codigo = generarCodigo();
        } while (grupoRepository.findByCodigoInvitacion(codigo).isPresent());
        return codigo;
    }

    private String generarCodigo() {
        StringBuilder sb = new StringBuilder(LONGITUD_CODIGO);
        for (int i = 0; i < LONGITUD_CODIGO; i++) {
            sb.append(CARACTERES.charAt(RANDOM.nextInt(CARACTERES.length())));
        }
        return sb.toString();
    }

    private GrupoResponse toResponse(Grupo grupo) {
        return new GrupoResponse(
                grupo.getId(),
                grupo.getNombre(),
                grupo.getCodigoInvitacion(),
                grupo.getPropietario().getNombreUsuario(),
                grupo.getCreadoEn()
        );
    }
}