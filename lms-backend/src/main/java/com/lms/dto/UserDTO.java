package com.lms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDTO {
	private Integer id;
	private String name;
	private String email;
	private String role;
	private Boolean active;
	private LocalDateTime createdAt;
	private LocalDateTime updatedAt;
}
