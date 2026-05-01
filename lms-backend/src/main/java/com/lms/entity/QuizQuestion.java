package com.lms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "quiz_questions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizQuestion {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "quiz_id", nullable = false)
	private Quiz quiz;

	@Column(nullable = false, columnDefinition = "TEXT")
	private String questionText;

	@Column(nullable = false)
	private String optionA;

	@Column(nullable = false)
	private String optionB;

	@Column(nullable = false)
	private String optionC;

	@Column(nullable = false)
	private String optionD;

	@Column(nullable = false)
	private String correctAnswer;

	@Column(nullable = false)
	private Integer marks;

	@Column(nullable = false, columnDefinition = "INT DEFAULT 0")
	private Integer questionNumber;
}
