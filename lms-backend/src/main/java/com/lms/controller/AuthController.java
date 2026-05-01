package com.lms.controller;

import com.lms.dto.AuthResponse;
import com.lms.dto.LoginRequest;
import com.lms.dto.RegisterRequest;
import com.lms.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = { "http://localhost:8080", "http://localhost:3000" })
public class AuthController {

	@Autowired
	private AuthService authService;

	@PostMapping("/login")
	public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
		try {
			AuthResponse response = authService.login(request);
			return ResponseEntity.ok(response);
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
					.body(AuthResponse.builder().message(e.getMessage()).build());
		}
	}

	@PostMapping("/register")
	public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
		try {
			AuthResponse response = authService.register(request);
			return ResponseEntity.status(HttpStatus.CREATED).body(response);
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST)
					.body(AuthResponse.builder().message(e.getMessage()).build());
		}
	}

	@GetMapping("/validate")
	public ResponseEntity<AuthResponse> validateToken(@RequestHeader("Authorization") String authHeader) {
		try {
			String token = authHeader.replace("Bearer ", "");
			AuthResponse response = authService.validateToken(token);
			return ResponseEntity.ok(response);
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
					.body(AuthResponse.builder().message(e.getMessage()).build());
		}
	}
}
