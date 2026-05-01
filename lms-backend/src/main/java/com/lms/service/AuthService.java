package com.lms.service;

import com.lms.dto.AuthResponse;
import com.lms.dto.LoginRequest;
import com.lms.dto.RegisterRequest;
import com.lms.entity.User;
import com.lms.repository.UserRepository;
import com.lms.security.JwtProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private JwtProvider jwtProvider;

	@Autowired
	private PasswordEncoder passwordEncoder;

	public AuthResponse login(LoginRequest request) {
		User user = userRepository.findByEmail(request.getEmail())
				.orElseThrow(() -> new RuntimeException("User not found"));

		if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
			throw new RuntimeException("Invalid credentials");
		}

		String token = jwtProvider.generateToken(user.getId(), user.getEmail(), user.getRole().toString());

		return AuthResponse.builder().id(user.getId()).name(user.getName()).email(user.getEmail())
				.role(user.getRole().toString()).token(token).message("Login successful").build();
	}

	public AuthResponse register(RegisterRequest request) {
		if (userRepository.findByEmail(request.getEmail()).isPresent()) {
			throw new RuntimeException("Email already registered");
		}

		User user = User.builder().name(request.getName()).email(request.getEmail())
				.password(passwordEncoder.encode(request.getPassword()))
				.role(User.UserRole.valueOf(request.getRole().toUpperCase())).active(true).build();

		User savedUser = userRepository.save(user);

		String token = jwtProvider.generateToken(savedUser.getId(), savedUser.getEmail(),
				savedUser.getRole().toString());

		return AuthResponse.builder().id(savedUser.getId()).name(savedUser.getName()).email(savedUser.getEmail())
				.role(savedUser.getRole().toString()).token(token).message("Registration successful").build();
	}

	public AuthResponse validateToken(String token) {
		if (!jwtProvider.validateToken(token) || jwtProvider.isTokenExpired(token)) {
			throw new RuntimeException("Invalid or expired token");
		}

		String email = jwtProvider.getUsernameFromToken(token);
		User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));

		return AuthResponse.builder().id(user.getId()).name(user.getName()).email(user.getEmail())
				.role(user.getRole().toString()).token(token).message("Token is valid").build();
	}
}
