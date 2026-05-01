package com.lms.repository;

import com.lms.entity.Announcement;
import com.lms.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, Integer> {
	List<Announcement> findByCourse(Course course);
	List<Announcement> findByCourseIsNullOrderByCreatedAtDesc();
	List<Announcement> findByCourseOrderByCreatedAtDesc(Course course);
}
