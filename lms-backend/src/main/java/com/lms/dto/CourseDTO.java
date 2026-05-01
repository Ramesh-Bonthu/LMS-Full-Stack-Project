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
public class CourseDTO {
	private Integer id;
	private String title;
	private String code;
	private String description;
	private Integer facultyId;
	private String facultyName;
	private String status;
	private Integer studentCount;
	private LocalDateTime createdAt;
	private LocalDateTime updatedAt;
}
