package com.lms.controller;

import com.lms.dto.QuizDTO;
import com.lms.service.QuizService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/quizzes")
@CrossOrigin(origins = { "http://localhost:8080", "http://localhost:3000" })
public class QuizController {

	@Autowired
	private QuizService quizService;

	@PostMapping
	public ResponseEntity<QuizDTO> createQuiz(@RequestBody QuizDTO quizDTO) {
		try {
			QuizDTO created = quizService.createQuiz(quizDTO);
			return ResponseEntity.status(HttpStatus.CREATED).body(created);
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
		}
	}

	@GetMapping("/{id}")
	public ResponseEntity<QuizDTO> getQuizById(@PathVariable Integer id) {
		try {
			QuizDTO quiz = quizService.getQuizById(id);
			return ResponseEntity.ok(quiz);
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
		}
	}

	@GetMapping
	public ResponseEntity<List<QuizDTO>> getAllQuizzes() {
		try {
			List<QuizDTO> quizzes = quizService.getAllQuizzes();
			return ResponseEntity.ok(quizzes);
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	@GetMapping("/course/{courseId}")
	public ResponseEntity<List<QuizDTO>> getQuizzesByCourse(@PathVariable Integer courseId) {
		try {
			List<QuizDTO> quizzes = quizService.getQuizzesByCourse(courseId);
			return ResponseEntity.ok(quizzes);
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
		}
	}

	@PutMapping("/{id}")
	public ResponseEntity<QuizDTO> updateQuiz(@PathVariable Integer id, @RequestBody QuizDTO quizDTO) {
		try {
			QuizDTO updated = quizService.updateQuiz(id, quizDTO);
			return ResponseEntity.ok(updated);
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
		}
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Map<String, String>> deleteQuiz(@PathVariable Integer id) {
		try {
			quizService.deleteQuiz(id);
			return ResponseEntity.ok(Map.of("message", "Quiz deleted successfully"));
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
		}
	}
}
