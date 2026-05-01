package com.lms.service;

import com.lms.dto.SubmissionDTO;
import com.lms.entity.Assignment;
import com.lms.entity.Submission;
import com.lms.entity.User;
import com.lms.repository.AssignmentRepository;
import com.lms.repository.SubmissionRepository;
import com.lms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SubmissionService {

	@Autowired
	private SubmissionRepository submissionRepository;

	@Autowired
	private AssignmentRepository assignmentRepository;

	@Autowired
	private UserRepository userRepository;

	public SubmissionDTO submitAssignment(Integer assignmentId, Integer studentId, String filePath) {
		Assignment assignment = assignmentRepository.findById(assignmentId)
				.orElseThrow(() -> new RuntimeException("Assignment not found"));

		User student = userRepository.findById(studentId).orElseThrow(() -> new RuntimeException("Student not found"));

		Submission submission = Submission.builder().assignment(assignment).student(student).filePath(filePath)
				.submittedAt(LocalDateTime.now()).marks(-1).build();

		Submission savedSubmission = submissionRepository.save(submission);
		return mapToDTO(savedSubmission);
	}

	public SubmissionDTO getSubmissionById(Integer id) {
		Submission submission = submissionRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("Submission not found"));
		return mapToDTO(submission);
	}

	public List<SubmissionDTO> getSubmissionsByAssignment(Integer assignmentId) {
		Assignment assignment = assignmentRepository.findById(assignmentId)
				.orElseThrow(() -> new RuntimeException("Assignment not found"));
		return submissionRepository.findByAssignment(assignment).stream().map(this::mapToDTO)
				.collect(Collectors.toList());
	}

	public List<SubmissionDTO> getSubmissionsByStudent(Integer studentId) {
		User student = userRepository.findById(studentId).orElseThrow(() -> new RuntimeException("Student not found"));
		return submissionRepository.findByStudent(student).stream().map(this::mapToDTO).collect(Collectors.toList());
	}

	public SubmissionDTO gradeSubmission(Integer submissionId, Integer marks, String feedback) {
		Submission submission = submissionRepository.findById(submissionId)
				.orElseThrow(() -> new RuntimeException("Submission not found"));

		submission.setMarks(marks);
		submission.setFeedback(feedback);
		submission.setMarkedAt(LocalDateTime.now());

		Submission gradedSubmission = submissionRepository.save(submission);
		return mapToDTO(gradedSubmission);
	}

	private SubmissionDTO mapToDTO(Submission submission) {
		return SubmissionDTO.builder().id(submission.getId()).assignmentId(submission.getAssignment().getId())
				.assignmentTitle(submission.getAssignment().getTitle()).studentId(submission.getStudent().getId())
				.studentName(submission.getStudent().getName()).filePath(submission.getFilePath())
				.submittedAt(submission.getSubmittedAt()).markedAt(submission.getMarkedAt()).marks(submission.getMarks())
				.feedback(submission.getFeedback()).createdAt(submission.getCreatedAt())
				.updatedAt(submission.getUpdatedAt()).build();
	}
}
