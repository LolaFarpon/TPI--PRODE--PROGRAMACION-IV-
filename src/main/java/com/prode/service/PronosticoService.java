package com.prode.service;

import com.prode.dto.request.PronosticoRequest;
import com.prode.entity.EstadoPartido;
import com.prode.entity.Partido;
import com.prode.entity.Pronostico;
import com.prode.entity.Usuario;
import com.prode.exception.RecursoNoEncontradoException;
import com.prode.exception.SolicitudInvalidaException;
import com.prode.repository.PartidoRepository;
import com.prode.repository.PronosticoRepository;
import com.prode.repository.UsuarioRepository;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class PronosticoService {

    private final PronosticoRepository pronosticoRepository;
    private final PartidoRepository partidoRepository;
    private final UsuarioRepository usuarioRepository;

    public PronosticoService(PronosticoRepository pronosticoRepository,
                             PartidoRepository partidoRepository,
                             UsuarioRepository usuarioRepository) {
        this.pronosticoRepository = pronosticoRepository;
        this.partidoRepository = partidoRepository;
        this.usuarioRepository = usuarioRepository;
    }

    // ¿El partido está bloqueado para pronosticar?
    // Bloqueado = faltan 30 minutos o menos para el inicio (o ya empezó).
    private boolean estaBloqueado(Partido partido) {
        Instant horaLimite = partido.getHoraInicio().minus(30, ChronoUnit.MINUTES);
        Instant ahora = Instant.now(Clock.systemUTC());   // SIEMPRE hora del servidor en UTC
        return !ahora.isBefore(horaLimite);               // true si ahora >= horaLimite
    }

    // === CREAR O MODIFICAR PRONÓSTICO (upsert) — HU-16 ===
    public Pronostico guardar(Long partidoId, PronosticoRequest req, Long usuarioId) {

        Partido partido = partidoRepository.findById(partidoId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Partido no encontrado"));

        // 1) El partido tiene que estar "POR_JUGARSE".
        if (partido.getEstado() != EstadoPartido.POR_JUGARSE) {
            throw new SolicitudInvalidaException("El partido no admite pronósticos (no está POR_JUGARSE)");
        }

        // 2) No tiene que haberse cumplido el bloqueo de 30 minutos.
        if (estaBloqueado(partido)) {
            throw new SolicitudInvalidaException("Pronóstico bloqueado: faltan 30 minutos o menos para el inicio");
        }

        // 3) Upsert: si ya existe pronóstico de este usuario para este partido, lo actualizamos.
        Pronostico pronostico = pronosticoRepository
                .findByUsuarioIdAndPartidoId(usuarioId, partidoId)
                .orElseGet(() -> {
                    Pronostico nuevo = new Pronostico();
                    Usuario usuario = usuarioRepository.findById(usuarioId)
                            .orElseThrow(() -> new RecursoNoEncontradoException("Usuario no encontrado"));
                    nuevo.setUsuario(usuario);
                    nuevo.setPartido(partido);
                    return nuevo;
                });

        pronostico.setGolesLocalPron(req.getGolesLocal());
        pronostico.setGolesVisitantePron(req.getGolesVisitante());

        return pronosticoRepository.save(pronostico);
    }

    // === MIS PRONÓSTICOS — HU-17 ===
    public List<Pronostico> misPronosticos(Long usuarioId) {
        return pronosticoRepository.findByUsuarioId(usuarioId);
    }

    // === PRONÓSTICOS DE TERCEROS — HU-18 ===
    public List<Pronostico> pronosticosDeTerceros(Long partidoId, Long usuarioId) {
        Partido partido = partidoRepository.findById(partidoId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Partido no encontrado"));

        // Solo se pueden ver si el bloqueo YA expiró (privacidad).
        if (!estaBloqueado(partido)) {
            throw new com.prode.exception.AccesoDenegadoException(
                    "Los pronósticos de terceros no son visibles hasta 30 minutos antes del inicio");
        }

        // Devolvemos todos menos el del propio usuario.
        return pronosticoRepository.findByPartidoId(partidoId).stream()
                .filter(p -> !p.getUsuario().getId().equals(usuarioId))
                .toList();
    }
}
