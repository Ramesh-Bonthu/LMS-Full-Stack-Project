package com.lms.service;

import com.lms.dto.AssignmentDTO;
import com.lms.entity.Assignment;
import com.lms.entity.Course;
import com.lms.repository.AssignmentRepository;
import com.lms.repository.CourseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AssignmentService {

	@Autowired
	private AssignmentRepository assignmentRepository;

	@Autowired
	private CourseRepository courseRepository;

	public AssignmentDTO createAssignment(AssignmentDTO assignmentDTO) {
		Course course = courseRepository.findById(assignmentDTO.getCourseId())
				.orElseThrow(() -> new RuntimeException("Course not found"));

		Assignment assignment = Assignment.builder().title(assignmentDTO.getTitle())
				.description(assignmentDTO.getDescription()).course(course).deadline(assignmentDTO.getDeadline())
				.totalMarks(assignmentDTO.getTotalMarks()).build();

		Assignment savedAssignment = assignmentRepository.save(assignment);
		return mapToDTO(savedAssignment);
	}

	public AssignmentDTO getAssignmentById(Integer id) {
		Assignment assignment = assignmentRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("Assignment not found"));
		return mapToDTO(assignment);
	}

	public List<AssignmentDTO> getAssignmentsByCourse(Integer courseId) {
		return assignmentRepository.findByCourseId(courseId).stream().map(this::mapToDTO).collect(Collectors.toList());
	}

	public List<AssignmentDTO> getAllAssignments() {
		return assignmentRepository.findAll().stream().map(this::mapToDTO).collect(Collectors.toList());
	}

	public AssignmentDTO updateAssignment(Integer id, AssignmentDTO assignmentDTO) {
		Assignment assignment = assignmentRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("Assignment not found"));

		assignment.setTitle(assignmentDTO.getTitle());
		assignment.setDescription(assignmentDTO.getDescription());
		assignment.setDeadline(assignmentDTO.getDeadline());
		assignment.setTotalMarks(assignmentDTO.getTotalMarks());

		Assignment updatedAssignment = assignmentRepository.save(assignment);
		return mapToDTO(updatedAssignment);
	}

	public void deleteAssignment(Integer id) {
		assignmentRepository.deleteById(id);
	}

	private AssignmentDTO mapToDTO(Assignment assignment) {
		return AssignmentDTO.builder().id(assignment.getId()).title(assignment.getTitle())
				.description(assignment.getDescription()).courseId(assignment.getCourse().getId())
				.courseName(assignment.getCourse().getTitle()).deadline(assignment.getDeadline())
				.totalMarks(assignment.getTotalMarks()).createdAt(assignment.getCreatedAt())
				.updatedAt(assignment.getUpdatedAt()).build();
	}
}
