package com.lms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "enrollments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Enrollment {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "student_id", nullable = false)
	private User student;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "course_id", nullable = false)
	private Course course;

	@Column(name = "enrolled_at", nullable = false)
	private LocalDateTime enrolledAt;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private EnrollmentStatus status;

	@Column(name = "completed_at")
	private LocalDateTime completedAt;

	@PrePersist
	protected void onCreate() {
		enrolledAt = LocalDateTime.now();
		status = EnrollmentStatus.ACTIVE;
	}

	public enum EnrollmentStatus {
		ACTIVE, COMPLETED, DROPPED
	}
}
