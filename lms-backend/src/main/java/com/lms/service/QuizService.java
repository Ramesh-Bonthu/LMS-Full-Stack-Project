package com.lms.service;

import com.lms.dto.QuizDTO;
import com.lms.entity.Course;
import com.lms.entity.Quiz;
import com.lms.repository.CourseRepository;
import com.lms.repository.QuizRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class QuizService {

	@Autowired
	private QuizRepository quizRepository;

	@Autowired
	private CourseRepository courseRepository;

	public QuizDTO createQuiz(QuizDTO quizDTO) {
		Course course = courseRepository.findById(quizDTO.getCourseId())
				.orElseThrow(() -> new RuntimeException("Course not found"));

		Quiz quiz = Quiz.builder().title(quizDTO.getTitle()).description(quizDTO.getDescription()).course(course)
				.totalQuestions(quizDTO.getTotalQuestions()).totalMarks(quizDTO.getTotalMarks())
				.timeLimit(quizDTO.getTimeLimit()).startTime(quizDTO.getStartTime()).endTime(quizDTO.getEndTime())
				.build();

		Quiz savedQuiz = quizRepository.save(quiz);
		return mapToDTO(savedQuiz);
	}

	public QuizDTO getQuizById(Integer id) {
		Quiz quiz = quizRepository.findById(id).orElseThrow(() -> new RuntimeException("Quiz not found"));
		return mapToDTO(quiz);
	}

	public List<QuizDTO> getQuizzesByCourse(Integer courseId) {
		return quizRepository.findByCourseId(courseId).stream().map(this::mapToDTO).collect(Collectors.toList());
	}

	public List<QuizDTO> getAllQuizzes() {
		return quizRepository.findAll().stream().map(this::mapToDTO).collect(Collectors.toList());
	}

	public QuizDTO updateQuiz(Integer id, QuizDTO quizDTO) {
		Quiz quiz = quizRepository.findById(id).orElseThrow(() -> new RuntimeException("Quiz not found"));

		quiz.setTitle(quizDTO.getTitle());
		quiz.setDescription(quizDTO.getDescription());
		quiz.setTotalQuestions(quizDTO.getTotalQuestions());
		quiz.setTotalMarks(quizDTO.getTotalMarks());
		quiz.setTimeLimit(quizDTO.getTimeLimit());
		quiz.setStartTime(quizDTO.getStartTime());
		quiz.setEndTime(quizDTO.getEndTime());

		Quiz updatedQuiz = quizRepository.save(quiz);
		return mapToDTO(updatedQuiz);
	}

	public void deleteQuiz(Integer id) {
		quizRepository.deleteById(id);
	}

	private QuizDTO mapToDTO(Quiz quiz) {
		return QuizDTO.builder().id(quiz.getId()).title(quiz.getTitle()).description(quiz.getDescription())
				.courseId(quiz.getCourse().getId()).courseName(quiz.getCourse().getTitle())
				.totalQuestions(quiz.getTotalQuestions()).totalMarks(quiz.getTotalMarks())
				.timeLimit(quiz.getTimeLimit()).startTime(quiz.getStartTime()).endTime(quiz.getEndTime())
				.createdAt(quiz.getCreatedAt()).updatedAt(quiz.getUpdatedAt()).build();
	}
}
