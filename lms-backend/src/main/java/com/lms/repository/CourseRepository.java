package com.lms.repository;

import com.lms.entity.Course;
import com.lms.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface CourseRepository extends JpaRepository<Course, Integer> {
	Optional<Course> findByCode(String code);
	List<Course> findByFaculty(User faculty);
	List<Course> findByStatus(Course.CourseStatus status);
}
