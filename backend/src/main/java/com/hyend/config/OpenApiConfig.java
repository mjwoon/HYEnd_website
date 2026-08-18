package com.hyend.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("HYEnd API")
                        .description("""
                                HYEnd 웹사이트 백엔드 REST API 명세서

                                ## 인증 방법
                                1. `/api/auth/login` 으로 로그인하여 `accessToken` 발급
                                2. 우측 상단 **Authorize** 버튼 클릭 후 토큰 입력
                                3. 이후 인증이 필요한 API에 Bearer 토큰 자동 포함
                                """)
                        .version("v1.0.0")
                        .contact(new Contact()
                                .name("HYEnd Team")
                                .email("jwmoon@hanyang.ac.kr")))
                .servers(List.of(
                        new Server().url("http://localhost:8080").description("로컬 개발 서버")
                ))
                .components(new Components()
                        .addSecuritySchemes("bearerAuth",
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("로그인 후 발급받은 accessToken 입력 (Bearer 접두사 없이)")));
    }
}
