package com.lms.repository;

import com.lms.entity.QuizAttempt;
import com.lms.entity.Quiz;
import com.lms.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Integer> {
	List<QuizAttempt> findByQuiz(Quiz quiz);
	List<QuizAttempt> findByStudent(User student);
	List<QuizAttempt> findByQuizAndStudent(Quiz quiz, User student);
}
