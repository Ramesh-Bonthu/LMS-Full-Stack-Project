package com.lms.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Email;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterRequest {
	
	@NotBlank(message = "Name is required")
	private String name;
	
	@NotBlank(message = "Email is required")
	@Email(message = "Email should be valid")
	private String email;
	
	@NotBlank(message = "Password is required")
	private String password;
	
	@NotBlank(message = "Role is required")
	private String role; // STUDENT, FACULTY, ADMIN
}
