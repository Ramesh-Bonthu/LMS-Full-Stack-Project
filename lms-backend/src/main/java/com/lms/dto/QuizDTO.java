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
public class QuizDTO {
	private Integer id;
	private String title;
	private String description;
	private Integer courseId;
	private String courseName;
	private Integer totalQuestions;
	private Integer totalMarks;
	private Integer timeLimit;
	private LocalDateTime startTime;
	private LocalDateTime endTime;
	private LocalDateTime createdAt;
	private LocalDateTime updatedAt;
}
