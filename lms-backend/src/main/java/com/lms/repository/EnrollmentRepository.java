package com.lms.repository;

import com.lms.entity.Enrollment;
import com.lms.entity.User;
import com.lms.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Integer> {
	Optional<Enrollment> findByStudentAndCourse(User student, Course course);
	List<Enrollment> findByStudent(User student);
	List<Enrollment> findByCourse(Course course);
	List<Enrollment> findByStudentAndStatus(User student, Enrollment.EnrollmentStatus status);
	List<Enrollment> findByCourseAndStatus(Course course, Enrollment.EnrollmentStatus status);
}
