package com.lms.controller;

import com.lms.dto.CourseDTO;
import com.lms.service.CourseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/courses")
@CrossOrigin(origins = { "http://localhost:8080", "http://localhost:3000" })
public class CourseController {

	@Autowired
	private CourseService courseService;

	@PostMapping
	public ResponseEntity<CourseDTO> createCourse(@RequestBody CourseDTO courseDTO,
			@RequestHeader("X-Faculty-Id") Integer facultyId) {
		try {
			CourseDTO created = courseService.createCourse(courseDTO, facultyId);
			return ResponseEntity.status(HttpStatus.CREATED).body(created);
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
		}
	}

	@GetMapping("/{id}")
	public ResponseEntity<CourseDTO> getCourseById(@PathVariable Integer id) {
		try {
			CourseDTO course = courseService.getCourseById(id);
			return ResponseEntity.ok(course);
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
		}
	}

	@GetMapping
	public ResponseEntity<List<CourseDTO>> getAllCourses() {
		try {
			List<CourseDTO> courses = courseService.getAllCourses();
			return ResponseEntity.ok(courses);
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	@GetMapping("/approved")
	public ResponseEntity<List<CourseDTO>> getApprovedCourses() {
		try {
			List<CourseDTO> courses = courseService.getApprovedCourses();
			return ResponseEntity.ok(courses);
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	@GetMapping("/faculty/{facultyId}")
	public ResponseEntity<List<CourseDTO>> getCoursesByFaculty(@PathVariable Integer facultyId) {
		try {
			List<CourseDTO> courses = courseService.getCoursesByFaculty(facultyId);
			return ResponseEntity.ok(courses);
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
		}
	}

	@PutMapping("/{id}")
	public ResponseEntity<CourseDTO> updateCourse(@PathVariable Integer id, @RequestBody CourseDTO courseDTO) {
		try {
			CourseDTO updated = courseService.updateCourse(id, courseDTO);
			return ResponseEntity.ok(updated);
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
		}
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Map<String, String>> deleteCourse(@PathVariable Integer id) {
		try {
			courseService.deleteCourse(id);
			return ResponseEntity.ok(Map.of("message", "Course deleted successfully"));
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
		}
	}
}
