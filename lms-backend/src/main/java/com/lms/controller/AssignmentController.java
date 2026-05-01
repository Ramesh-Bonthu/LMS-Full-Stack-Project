package com.lms.controller;

import com.lms.dto.AssignmentDTO;
import com.lms.service.AssignmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/assignments")
@CrossOrigin(origins = { "http://localhost:8080", "http://localhost:3000" })
public class AssignmentController {

	@Autowired
	private AssignmentService assignmentService;

	@PostMapping
	public ResponseEntity<AssignmentDTO> createAssignment(@RequestBody AssignmentDTO assignmentDTO) {
		try {
			AssignmentDTO created = assignmentService.createAssignment(assignmentDTO);
			return ResponseEntity.status(HttpStatus.CREATED).body(created);
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
		}
	}

	@GetMapping("/{id}")
	public ResponseEntity<AssignmentDTO> getAssignmentById(@PathVariable Integer id) {
		try {
			AssignmentDTO assignment = assignmentService.getAssignmentById(id);
			return ResponseEntity.ok(assignment);
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
		}
	}

	@GetMapping
	public ResponseEntity<List<AssignmentDTO>> getAllAssignments() {
		try {
			List<AssignmentDTO> assignments = assignmentService.getAllAssignments();
			return ResponseEntity.ok(assignments);
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	@GetMapping("/course/{courseId}")
	public ResponseEntity<List<AssignmentDTO>> getAssignmentsByCourse(@PathVariable Integer courseId) {
		try {
			List<AssignmentDTO> assignments = assignmentService.getAssignmentsByCourse(courseId);
			return ResponseEntity.ok(assignments);
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
		}
	}

	@PutMapping("/{id}")
	public ResponseEntity<AssignmentDTO> updateAssignment(@PathVariable Integer id,
			@RequestBody AssignmentDTO assignmentDTO) {
		try {
			AssignmentDTO updated = assignmentService.updateAssignment(id, assignmentDTO);
			return ResponseEntity.ok(updated);
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
		}
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Map<String, String>> deleteAssignment(@PathVariable Integer id) {
		try {
			assignmentService.deleteAssignment(id);
			return ResponseEntity.ok(Map.of("message", "Assignment deleted successfully"));
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
		}
	}
}
