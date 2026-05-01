package com.lms.repository;

import com.lms.entity.QuizQuestion;
import com.lms.entity.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface QuizQuestionRepository extends JpaRepository<QuizQuestion, Integer> {
	List<QuizQuestion> findByQuiz(Quiz quiz);
	List<QuizQuestion> findByQuizId(Integer quizId);
}
