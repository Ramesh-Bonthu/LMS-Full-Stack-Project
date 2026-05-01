package com.lms.repository;

import com.lms.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
	Optional<User> findByEmail(String email);
	List<User> findByRole(User.UserRole role);
	List<User> findByActive(Boolean active);
}
