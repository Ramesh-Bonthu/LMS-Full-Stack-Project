package com.lms.repository;

import com.lms.entity.Quiz;
import com.lms.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, Integer> {
	List<Quiz> findByCourse(Course course);
	List<Quiz> findByCourseId(Integer courseId);
}
