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
public class AssignmentDTO {
	private Integer id;
	private String title;
	private String description;
	private Integer courseId;
	private String courseName;
	private LocalDateTime deadline;
	private Integer totalMarks;
	private LocalDateTime createdAt;
	private LocalDateTime updatedAt;
}
