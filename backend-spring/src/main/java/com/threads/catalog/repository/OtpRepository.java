package com.threads.catalog.repository;

import com.threads.catalog.model.Otp;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface OtpRepository extends MongoRepository<Otp, String> {
    Optional<Otp> findByUserIdAndType(String userId, String type);
    void deleteByUserId(String userId);
    void deleteByUserIdAndType(String userId, String type);
}
