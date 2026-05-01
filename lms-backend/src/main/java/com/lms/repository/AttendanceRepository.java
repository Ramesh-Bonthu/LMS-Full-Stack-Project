package com.lms.repository;

import com.lms.entity.Attendance;
import com.lms.entity.User;
import com.lms.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Integer> {
	List<Attendance> findByStudent(User student);
	List<Attendance> findByCourse(Course course);
	List<Attendance> findByStudentAndCourse(User student, Course course);
	List<Attendance> findByAttendanceDateAndCourse(LocalDate date, Course course);
}
