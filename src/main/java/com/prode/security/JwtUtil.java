package com.prode.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.function.Function;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private long expiration; // milisegundos (86400000 = 24 h)

    // Arma la clave de firma a partir del secreto (Base64) del application.properties.
    private SecretKey getSignKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    // Genera un token para un usuario ya autenticado.
    public String generateToken(UserDetails userDetails) {
        String rol = userDetails.getAuthorities().stream()
                .findFirst()
                .map(a -> a.getAuthority())       // ej: "ROLE_USER"
                .orElse("ROLE_USER");

        Date ahora = new Date();
        Date vencimiento = new Date(ahora.getTime() + expiration);

        return Jwts.builder()
                .subject(userDetails.getUsername())   // el email del usuario
                .claim("rol", rol)
                .issuedAt(ahora)
                .expiration(vencimiento)
                .signWith(getSignKey())
                .compact();
    }

    // Extrae el "subject" del token = el email del usuario.
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    // Extrae la fecha de vencimiento.
    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    // Lee cualquier claim del token aplicando una función sobre los claims.
    private <T> T extractClaim(String token, Function<Claims, T> resolver) {
        Claims claims = Jwts.parser()
                .verifyWith(getSignKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return resolver.apply(claims);
    }

    // ¿El token venció?
    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    // Valida que el token sea de este usuario y no esté vencido.
    public boolean validateToken(String token, UserDetails userDetails) {
        String username = extractUsername(token);
        return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
    }
}
