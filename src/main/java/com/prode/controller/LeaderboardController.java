package com.prode.controller;

import com.prode.dto.response.LeaderboardEntryResponse;
import com.prode.service.LeaderboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/leaderboard")
@RequiredArgsConstructor
public class LeaderboardController {

    private final LeaderboardService leaderboardService;

    @GetMapping
    public ResponseEntity<List<LeaderboardEntryResponse>> obtenerLeaderboard(
            @AuthenticationPrincipal UserDetails principal) {

        return ResponseEntity.ok(leaderboardService.obtenerLeaderboardGlobal());
    }
}