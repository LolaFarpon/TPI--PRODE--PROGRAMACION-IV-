package com.prode.service;

import com.prode.entity.Partido;
import com.prode.entity.Pronostico;
import com.prode.repository.PronosticoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class MotorPuntosService {

    private final PronosticoRepository pronosticoRepository;

    public MotorPuntosService(PronosticoRepository pronosticoRepository) {
        this.pronosticoRepository = pronosticoRepository;
    }

    // Calcula y asigna los puntos a TODOS los pronósticos de un partido finalizado.
    // Lo llama Dev 2 al cargar el resultado, dentro de la misma transacción.
    @Transactional
    public void procesarPuntos(Partido partido) {
        Integer golesLocalReal = partido.getGolesLocal();
        Integer golesVisitanteReal = partido.getGolesVisitante();

        // Defensa: si no hay resultado cargado, no se puede puntuar.
        if (golesLocalReal == null || golesVisitanteReal == null) {
            throw new IllegalStateException("El partido no tiene resultado cargado");
        }

        List<Pronostico> pronosticos = pronosticoRepository.findByPartidoId(partido.getId());

        for (Pronostico p : pronosticos) {
            int puntos = calcularPuntos(
                    p.getGolesLocalPron(), p.getGolesVisitantePron(),
                    golesLocalReal, golesVisitanteReal);
            p.setPuntosObtenidos(puntos);
        }

        pronosticoRepository.saveAll(pronosticos);
    }

    // La regla 3/1/0. Público para poder testearlo de forma aislada.
    public int calcularPuntos(int localPron, int visitantePron, int localReal, int visitanteReal) {
        // 3 puntos: resultado exacto.
        if (localPron == localReal && visitantePron == visitanteReal) {
            return 3;
        }
        // 1 punto: acertó la tendencia (mismo "signo" del resultado).
        if (tendencia(localPron, visitantePron) == tendencia(localReal, visitanteReal)) {
            return 1;
        }
        // 0 puntos: no acertó nada.
        return 0;
    }

    // Tendencia de un marcador: 1 = gana local, 0 = empate, -1 = gana visitante.
    private int tendencia(int local, int visitante) {
        return Integer.compare(local, visitante);
    }
}
