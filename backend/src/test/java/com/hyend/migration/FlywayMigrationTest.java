package com.hyend.migration;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.output.MigrateResult;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 실제 PostgreSQL(Testcontainers)에 db/migration의 전체 마이그레이션을 적용해
 * 순서·체크섬·SQL이 유효한지 CI에서 검증한다.
 * (일반 테스트는 H2 + ddl-auto로 스키마를 만들어 Flyway를 타지 않으므로 이 검증이 필요하다.)
 */
@Testcontainers
class FlywayMigrationTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES =
            new PostgreSQLContainer<>("postgres:16-alpine")
                    .withDatabaseName("hyend_migration_test")
                    .withUsername("test")
                    .withPassword("test");

    @Test
    void allMigrationsApplyCleanlyOnRealPostgres() throws Exception {
        Flyway flyway = Flyway.configure()
                .dataSource(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword())
                .locations("classpath:db/migration")
                .load();

        MigrateResult result = flyway.migrate();

        assertThat(result.success).isTrue();
        assertThat(result.migrationsExecuted).isGreaterThan(0);

        // 적용된 마이그레이션의 체크섬·순서 무결성 검증 (문제 시 예외 발생)
        flyway.validate();

        // 전체 체인이 순서대로 적용됐는지 확인:
        // V18에서 DROP된 테이블은 없어야 하고, 초반/후반 테이블은 존재해야 한다.
        assertThat(tableExists("refresh_tokens")).isFalse();   // V18 DROP
        assertThat(tableExists("users")).isTrue();             // V1
        assertThat(tableExists("meeting_rooms")).isTrue();     // V14
    }

    private boolean tableExists(String table) throws Exception {
        try (Connection c = DriverManager.getConnection(
                POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword());
             Statement st = c.createStatement();
             ResultSet rs = st.executeQuery(
                     "SELECT to_regclass('public." + table + "') IS NOT NULL AS present")) {
            rs.next();
            return rs.getBoolean("present");
        }
    }
}
