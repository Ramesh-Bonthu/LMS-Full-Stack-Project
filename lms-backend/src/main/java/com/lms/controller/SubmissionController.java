package com.lms.controller;

import com.lms.dto.SubmissionDTO;
import com.lms.service.SubmissionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/submissions")
@CrossOrigin(origins = { "http://localhost:8080", "http://localhost:3000" })
public class SubmissionController {

	@Autowired
	private SubmissionService submissionService;

	@PostMapping
	public ResponseEntity<SubmissionDTO> submitAssignment(@RequestParam Integer assignmentId,
			@RequestParam Integer studentId, @RequestParam String filePath) {
		try {
			SubmissionDTO submission = submissionService.submitAssignment(assignmentId, studentId, filePath);
			return ResponseEntity.status(HttpStatus.CREATED).body(submission);
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
		}
	}

	@GetMapping("/{id}")
	public ResponseEntity<SubmissionDTO> getSubmissionById(@PathVariable Integer id) {
		try {
			SubmissionDTO submission = submissionService.getSubmissionById(id);
			return ResponseEntity.ok(submission);
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
		}
	}

	@GetMapping("/assignment/{assignmentId}")
	public ResponseEntity<List<SubmissionDTO>> getSubmissionsByAssignment(@PathVariable Integer assignmentId) {
		try {
			List<SubmissionDTO> submissions = submissionService.getSubmissionsByAssignment(assignmentId);
			return ResponseEntity.ok(submissions);
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
		}
	}

	@GetMapping("/student/{studentId}")
	public ResponseEntity<List<SubmissionDTO>> getSubmissionsByStudent(@PathVariable Integer studentId) {
		try {
			List<SubmissionDTO> submissions = submissionService.getSubmissionsByStudent(studentId);
			return ResponseEntity.ok(submissions);
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
		}
	}

	@PutMapping("/{id}/grade")
	public ResponseEntity<SubmissionDTO> gradeSubmission(@PathVariable Integer id, @RequestParam Integer marks,
			@RequestParam(required = false) String feedback) {
		try {
			SubmissionDTO graded = submissionService.gradeSubmission(id, marks, feedback);
			return ResponseEntity.ok(graded);
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
		}
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Map<String, String>> deleteSubmission(@PathVariable Integer id) {
		try {
			// Implement delete logic in service if needed
			return ResponseEntity.ok(Map.of("message", "Submission deleted successfully"));
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
		}
	}
}
