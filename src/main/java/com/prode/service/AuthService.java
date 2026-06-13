package com.prode.service;

import com.prode.dto.request.LoginRequest;
import com.prode.dto.request.RegistroRequest;
import com.prode.dto.response.AuthResponse;
import com.prode.entity.Rol;
import com.prode.entity.Usuario;
import com.prode.exception.ConflictoException;
import com.prode.repository.UsuarioRepository;
import com.prode.security.JwtUtil;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    public AuthService(UsuarioRepository usuarioRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil,
                       AuthenticationManager authenticationManager) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.authenticationManager = authenticationManager;
    }

    // === REGISTRO ===
    public Usuario registrar(RegistroRequest req) {
        // Unicidad: si ya existe el email o el usuario, 409.
        if (usuarioRepository.existsByEmail(req.getEmail())) {
            throw new ConflictoException("El email ya está registrado");
        }
        if (usuarioRepository.existsByNombreUsuario(req.getNombreUsuario())) {
            throw new ConflictoException("El nombre de usuario ya está en uso");
        }

        Usuario usuario = new Usuario();
        usuario.setNombreUsuario(req.getNombreUsuario());
        usuario.setEmail(req.getEmail());
        // Nunca guardamos la contraseña en texto plano: la hasheamos con BCrypt (RNF1).
        usuario.setContrasenaHash(passwordEncoder.encode(req.getPassword()));
        usuario.setRol(Rol.USER);   // rol por defecto

        return usuarioRepository.save(usuario);
    }

    // === LOGIN ===
    public AuthResponse login(LoginRequest req) {
        // Spring valida email + contraseña usando el authenticationProvider.
        // Si las credenciales son incorrectas, lanza una excepción (→ 401).
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword()));

        // Si llegó hasta acá, las credenciales son válidas. Buscamos el usuario.
        Usuario usuario = usuarioRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new ConflictoException("Usuario no encontrado"));

        UserDetails userDetails = org.springframework.security.core.userdetails.User
                .withUsername(usuario.getEmail())
                .password(usuario.getContrasenaHash())
                .authorities("ROLE_" + usuario.getRol().name())
                .build();

        String token = jwtUtil.generateToken(userDetails);

        return new AuthResponse(token, usuario.getNombreUsuario(), usuario.getRol().name());
    }
}
