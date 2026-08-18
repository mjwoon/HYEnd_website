package com.hyend.config;

import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.bouncycastle.jce.ECNamedCurveTable;
import org.bouncycastle.jce.interfaces.ECPrivateKey;
import org.bouncycastle.jce.interfaces.ECPublicKey;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.bouncycastle.jce.spec.ECNamedCurveParameterSpec;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.*;
import java.util.Arrays;
import java.util.Base64;

@Component
@Getter
@Slf4j
public class VapidKeyConfig implements InitializingBean {

    @Value("${webpush.vapid.public-key:}")
    private String configuredPublicKey;

    @Value("${webpush.vapid.private-key:}")
    private String configuredPrivateKey;

    @Value("${webpush.vapid.subject:mailto:admin@hyend.ac.kr}")
    private String subject;

    private String publicKey;
    private String privateKey;

    @Override
    public void afterPropertiesSet() throws Exception {
        Security.addProvider(new BouncyCastleProvider());

        if (!configuredPublicKey.isBlank() && !configuredPrivateKey.isBlank()) {
            this.publicKey = configuredPublicKey;
            this.privateKey = configuredPrivateKey;
            return;
        }

        ECNamedCurveParameterSpec spec = ECNamedCurveTable.getParameterSpec("prime256v1");
        KeyPairGenerator kpg = KeyPairGenerator.getInstance("EC", "BC");
        kpg.initialize(spec, new SecureRandom());
        KeyPair keyPair = kpg.generateKeyPair();

        ECPublicKey ecPublic = (ECPublicKey) keyPair.getPublic();
        ECPrivateKey ecPrivate = (ECPrivateKey) keyPair.getPrivate();

        byte[] pubBytes = ecPublic.getQ().getEncoded(false); // uncompressed 65 bytes
        byte[] privRaw = ecPrivate.getD().toByteArray();
        if (privRaw.length == 33 && privRaw[0] == 0) {
            privRaw = Arrays.copyOfRange(privRaw, 1, 33);
        }

        Base64.Encoder encoder = Base64.getUrlEncoder().withoutPadding();
        this.publicKey = encoder.encodeToString(pubBytes);
        this.privateKey = encoder.encodeToString(privRaw);

        log.warn("========================================");
        log.warn("VAPID 키가 설정되지 않아 임시 키를 생성했습니다.");
        log.warn("서버 재시작 시 기존 구독이 무효화됩니다.");
        log.warn("아래 값을 환경변수에 영구 등록하세요:");
        log.warn("VAPID_PUBLIC_KEY={}", this.publicKey);
        log.warn("VAPID_PRIVATE_KEY={}", this.privateKey);
        log.warn("========================================");
    }
}
