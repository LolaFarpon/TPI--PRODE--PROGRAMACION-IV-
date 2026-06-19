package com.prode.service;

import com.prode.dto.response.LeaderboardEntryResponse;
import com.prode.repository.PronosticoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LeaderboardService {

    private final PronosticoRepository pronosticoRepository;

    public List<LeaderboardEntryResponse> obtenerLeaderboardGlobal() {
        List<LeaderboardEntryResponse> lista = pronosticoRepository.findLeaderboardGlobal();
        asignarPosiciones(lista);
        return lista;
    }

    public List<LeaderboardEntryResponse> obtenerLeaderboardPorGrupo(Long grupoId) {
        List<LeaderboardEntryResponse> lista = pronosticoRepository.findLeaderboardByGrupo(grupoId);
        asignarPosiciones(lista);
        return lista;
    }

    private void asignarPosiciones(List<LeaderboardEntryResponse> lista) {
        for (int i = 0; i < lista.size(); i++) {
            lista.get(i).setPosicion(i + 1);
        }
    }
}