package com.threads;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class ThreadsFashionApplication {

    public static void main(String[] args) {
        SpringApplication.run(ThreadsFashionApplication.class, args);
    }
}
