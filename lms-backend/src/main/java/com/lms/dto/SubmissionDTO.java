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
public class SubmissionDTO {
	private Integer id;
	private Integer assignmentId;
	private String assignmentTitle;
	private Integer studentId;
	private String studentName;
	private String filePath;
	private LocalDateTime submittedAt;
	private LocalDateTime markedAt;
	private Integer marks;
	private String feedback;
	private LocalDateTime createdAt;
	private LocalDateTime updatedAt;
}
