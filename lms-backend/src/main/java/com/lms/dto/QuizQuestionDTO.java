package com.lms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizQuestionDTO {
	private Integer id;
	private Integer quizId;
	private String questionText;
	private String optionA;
	private String optionB;
	private String optionC;
	private String optionD;
	private String correctAnswer;
	private Integer marks;
	private Integer questionNumber;
}
