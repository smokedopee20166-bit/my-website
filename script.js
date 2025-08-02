// Three.js Vortex Background Animation
function initBackground() {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('bg-canvas'), alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    const particles = new THREE.Group();
    const geometry = new THREE.SphereGeometry(0.05, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0xFF0000, transparent: true, opacity: 0.8 });

    for (let i = 0; i < 500; i++) {
        const particle = new THREE.Mesh(geometry, material);
        const theta = Math.random() * 2 * Math.PI;
        const radius = 5 + Math.random() * 15;
        particle.position.set(
            radius * Math.cos(theta),
            (Math.random() - 0.5) * 20,
            radius * Math.sin(theta)
        );
        particle.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.05,
            (Math.random() - 0.5) * 0.05,
            (Math.random() - 0.5) * 0.05
        );
        particles.add(particle);
    }

    scene.add(particles);
    camera.position.z = 30;

    const pointLight = new THREE.PointLight(0xFF0000, 1, 100);
    pointLight.position.set(0, 0, 10);
    scene.add(pointLight);

    function animate() {
        requestAnimationFrame(animate);
        particles.children.forEach(particle => {
            particle.position.add(particle.velocity);
            if (particle.position.length() > 20) {
                particle.position.setLength(5);
            }
        });
        particles.rotation.y += 0.005;
        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    });
}

// GSAP Typewriter and Intro Animations
function initAnimations() {
    const typewriter = document.getElementById('typewriter');
    const text = "Welcome to Beakers";
    let i = 0;

    function type() {
        if (i < text.length) {
            typewriter.textContent += text.charAt(i);
            i++;
            setTimeout(type, 100);
        } else {
            gsap.to(typewriter, { borderRightColor: 'transparent', duration: 0.5 });
        }
    }
    type();

    gsap.from('#enter-btn', { scale: 0, opacity: 0, delay: 2, duration: 1, ease: 'elastic.out(1, 0.3)' });
    document.getElementById('enter-btn').addEventListener('click', () => {
        gsap.to('#intro', { opacity: 0, duration: 0.5, onComplete: () => {
            document.getElementById('intro').classList.add('hidden');
            document.getElementById('main-content').classList.remove('hidden');
            gsap.from('#main-content', { opacity: 0, y: 50, duration: 1, ease: 'power2.out' });
            gsap.from('.glass-card', { opacity: 0, y: 20, stagger: 0.2, duration: 1, ease: 'power2.out', delay: 0.5 });
        }});
    });
}

// Initialize Background and Animations
initBackground();
initAnimations();

// Encryption Functions (Unchanged)
async function generateKeyPair() {
    try {
        const keyPair = await window.crypto.subtle.generateKey(
            {
                name: "RSA-OAEP",
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: "SHA-256"
            },
            true,
            ["encrypt", "decrypt"]
        );
        
        const publicKey = await window.crypto.subtle.exportKey("jwk", keyPair.publicKey);
        const privateKey = await window.crypto.subtle.exportKey("jwk", keyPair.privateKey);
        
        document.getElementById("public-key").textContent = JSON.stringify(publicKey);
        document.getElementById("private-key").textContent = JSON.stringify(privateKey);
    } catch (error) {
        alert("Error generating keys: " + error.message);
    }
}

function downloadKeys() {
    const publicKey = document.getElementById("public-key").textContent;
    const privateKey = document.getElementById("private-key").textContent;
    const keys = `Public Key:\n${publicKey}\n\nPrivate Key:\n${privateKey}`;
    const blob = new Blob([keys], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "beakers-keys.txt";
    a.click();
    URL.revokeObjectURL(url);
}

async function encryptMessage() {
    try {
        const recipientPublicKeyJwk = JSON.parse(document.getElementById("recipient-public-key").value);
        const publicKey = await window.crypto.subtle.importKey(
            "jwk",
            recipientPublicKeyJwk,
            { name: "RSA-OAEP", hash: "SHA-256" },
            false,
            ["encrypt"]
        );

        const message = document.getElementById("message").value;
        const encoder = new TextEncoder();
        const data = encoder.encode(message);

        // Generate a symmetric key for AES-GCM
        const aesKey = await window.crypto.subtle.generateKey(
            { name: "AES-GCM", length: 256 },
            true,
            ["encrypt"]
        );

        // Encrypt the message with AES-GCM
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encryptedData = await window.crypto.subtle.encrypt(
            { name: "AES-GCM", iv },
            aesKey,
            data
        );

        // Encrypt the AES key with the recipient's public key
        const exportedAesKey = await window.crypto.subtle.exportKey("raw", aesKey);
        const encryptedAesKey = await window.crypto.subtle.encrypt(
            { name: "RSA-OAEP" },
            publicKey,
            exportedAesKey
        );

        // Combine encrypted key, IV, and encrypted data
        const combined = new Uint8Array(encryptedAesKey.byteLength + iv.byteLength + encryptedData.byteLength);
        combined.set(new Uint8Array(encryptedAesKey), 0);
        combined.set(iv, encryptedAesKey.byteLength);
        combined.set(new Uint8Array(encryptedData), encryptedAesKey.byteLength + iv.byteLength);

        // Encode to base64 for easy sharing
        const base64 = btoa(String.fromCharCode(...combined));
        document.getElementById("encrypted-message").value = base64;
    } catch (error) {
        alert("Error encrypting message: " + error.message);
    }
}

function copyEncryptedMessage() {
    const encryptedMessage = document.getElementById("encrypted-message");
    encryptedMessage.select();
    document.execCommand("copy");
    alert("Encrypted message copied to clipboard!");
}

async function decryptMessage() {
    try {
        const privateKeyJwk = JSON.parse(document.getElementById("your-private-key").value);
        const privateKey = await window.crypto.subtle.importKey(
            "jwk",
            privateKeyJwk,
            { name: "RSA-OAEP", hash: "SHA-256" },
            false,
            ["decrypt"]
        );

        const encryptedBase64 = document.getElementById("received-message").value;
        const encryptedCombined = new Uint8Array(
            atob(encryptedBase64).split("").map(c => c.charCodeAt(0))
        );

        // Split the combined data
        const encryptedAesKey = encryptedCombined.slice(0, 256); // RSA-OAEP encrypted key is 256 bytes
        const iv = encryptedCombined.slice(256, 256 + 12); // 12 bytes for IV
        const encryptedData = encryptedCombined.slice(256 + 12);

        // Decrypt the AES key
        const aesKeyData = await window.crypto.subtle.decrypt(
            { name: "RSA-OAEP" },
            privateKey,
            encryptedAesKey
        );
        const aesKey = await window.crypto.subtle.importKey(
            "raw",
            aesKeyData,
            { name: "AES-GCM" },
            false,
            ["decrypt"]
        );

        // Decrypt the message
        const decryptedData = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv },
            aesKey,
            encryptedData
        );

        const decoder = new TextDecoder();
        const decryptedMessage = decoder.decode(decryptedData);
        document.getElementById("decrypted-message").value = decryptedMessage;
    } catch (error) {
        alert("Error decrypting message: " + error.message);
    }
}