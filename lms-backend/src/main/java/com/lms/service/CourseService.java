package com.lms.service;

import com.lms.dto.CourseDTO;
import com.lms.entity.Course;
import com.lms.entity.User;
import com.lms.repository.CourseRepository;
import com.lms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CourseService {

	@Autowired
	private CourseRepository courseRepository;

	@Autowired
	private UserRepository userRepository;

	public CourseDTO createCourse(CourseDTO courseDTO, Integer facultyId) {
		User faculty = userRepository.findById(facultyId).orElseThrow(() -> new RuntimeException("Faculty not found"));

		if (courseRepository.findByCode(courseDTO.getCode()).isPresent()) {
			throw new RuntimeException("Course code already exists");
		}

		Course course = Course.builder().title(courseDTO.getTitle()).code(courseDTO.getCode())
				.description(courseDTO.getDescription()).faculty(faculty).build();

		Course savedCourse = courseRepository.save(course);
		return mapToDTO(savedCourse);
	}

	public CourseDTO getCourseById(Integer id) {
		Course course = courseRepository.findById(id).orElseThrow(() -> new RuntimeException("Course not found"));
		return mapToDTO(course);
	}

	public List<CourseDTO> getAllCourses() {
		return courseRepository.findAll().stream().map(this::mapToDTO).collect(Collectors.toList());
	}

	public List<CourseDTO> getCoursesByFaculty(Integer facultyId) {
		User faculty = userRepository.findById(facultyId).orElseThrow(() -> new RuntimeException("Faculty not found"));
		return courseRepository.findByFaculty(faculty).stream().map(this::mapToDTO).collect(Collectors.toList());
	}

	public List<CourseDTO> getApprovedCourses() {
		return courseRepository.findByStatus(Course.CourseStatus.APPROVED).stream().map(this::mapToDTO)
				.collect(Collectors.toList());
	}

	public CourseDTO updateCourse(Integer id, CourseDTO courseDTO) {
		Course course = courseRepository.findById(id).orElseThrow(() -> new RuntimeException("Course not found"));

		course.setTitle(courseDTO.getTitle());
		course.setDescription(courseDTO.getDescription());
		if (courseDTO.getStatus() != null) {
			course.setStatus(Course.CourseStatus.valueOf(courseDTO.getStatus()));
		}

		Course updatedCourse = courseRepository.save(course);
		return mapToDTO(updatedCourse);
	}

	public void deleteCourse(Integer id) {
		courseRepository.deleteById(id);
	}

	private CourseDTO mapToDTO(Course course) {
		return CourseDTO.builder().id(course.getId()).title(course.getTitle()).code(course.getCode())
				.description(course.getDescription()).facultyId(course.getFaculty().getId())
				.facultyName(course.getFaculty().getName()).status(course.getStatus().toString())
				.studentCount(course.getEnrolledStudents() != null ? course.getEnrolledStudents().size() : 0)
				.createdAt(course.getCreatedAt()).updatedAt(course.getUpdatedAt()).build();
	}
}
