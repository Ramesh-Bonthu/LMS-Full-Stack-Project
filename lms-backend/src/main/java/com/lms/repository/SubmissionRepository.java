package com.lms.repository;

import com.lms.entity.Submission;
import com.lms.entity.Assignment;
import com.lms.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Integer> {
	Optional<Submission> findByAssignmentAndStudent(Assignment assignment, User student);
	List<Submission> findByAssignment(Assignment assignment);
	List<Submission> findByStudent(User student);
	List<Submission> findByAssignmentAndMarksGreaterThanEqual(Assignment assignment, Integer marks);
}
