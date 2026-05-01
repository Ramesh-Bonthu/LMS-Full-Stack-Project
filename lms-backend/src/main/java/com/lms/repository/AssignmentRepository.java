package com.lms.repository;

import com.lms.entity.Assignment;
import com.lms.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AssignmentRepository extends JpaRepository<Assignment, Integer> {
	List<Assignment> findByCourse(Course course);
	List<Assignment> findByCourseId(Integer courseId);
}
