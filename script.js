// --- Intro Animation ---
function typeWriter(element, text, speed = 40, callback) {
    let i = 0;
    function typing() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(typing, speed);
        } else if (callback) {
            callback();
        }
    }
    element.innerHTML = "";
    typing();
}

function glitchText(element) {
    gsap.to(element, {
        textShadow: "0 0 8px #ff0000, 0 0 20px #00fff7, 0 0 2px #fff",
        repeat: 3,
        yoyo: true,
        duration: 0.07,
        onComplete: () => {
            gsap.to(element, { textShadow: "none", duration: 0.1 });
        }
    });
}

function showMainContent() {
    const intro = document.getElementById('intro');
    const main = document.getElementById('main-content');
    intro.style.transition = "opacity 0.3s";
    intro.style.opacity = 0;
    setTimeout(() => {
        intro.style.display = 'none';
        main.classList.remove('hidden');
        main.style.opacity = 0;
        main.style.transition = "opacity 0.3s";
        setTimeout(() => {
            main.style.opacity = 1;
            glitchText(document.querySelector('#main-content h1'));
        }, 10);
    }, 300);
}

window.addEventListener('DOMContentLoaded', () => {
    const typewriter = document.getElementById('typewriter');
    const enterBtn = document.getElementById('enter-btn');
    const introText = typewriter.getAttribute('data-text') || typewriter.textContent;

    typeWriter(typewriter, introText, 40, () => {
        glitchText(typewriter);
        enterBtn.classList.add('animate-bounce');
        enterBtn.disabled = false;
    });

    enterBtn.disabled = true;
    enterBtn.addEventListener('click', showMainContent);
});

// --- Key Generation, Encryption, Decryption (Demo Only) ---

function generateKeyPair() {
    const publicKey = "PUB_" + Math.random().toString(36).substring(2, 18).toUpperCase();
    const privateKey = "PRIV_" + Math.random().toString(36).substring(2, 18).toUpperCase();
    document.getElementById('public-key').textContent = publicKey;
    document.getElementById('private-key').textContent = privateKey;
}

function downloadKeys() {
    const pub = document.getElementById('public-key').textContent;
    const priv = document.getElementById('private-key').textContent;
    const blob = new Blob([`Public Key: ${pub}\nPrivate Key: ${priv}`], {type: "text/plain"});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = "beakers-keys.txt";
    a.click();
}

function encryptMessage() {
    const pub = document.getElementById('recipient-public-key').value.trim();
    const msg = document.getElementById('message').value;
    if (!pub || !msg) {
        alert("Please enter recipient's public key and your message.");
        return;
    }
    const encrypted = btoa(unescape(encodeURIComponent(msg + "|" + pub)));
    document.getElementById('encrypted-message').value = encrypted;
}

function copyEncryptedMessage() {
    const enc = document.getElementById('encrypted-message');
    enc.select();
    document.execCommand('copy');
}

function decryptMessage() {
    const priv = document.getElementById('your-private-key').value.trim();
    const enc = document.getElementById('received-message').value;
    if (!priv || !enc) {
        alert("Please enter your private key and the encrypted message.");
        return;
    }
    try {
        const decoded = decodeURIComponent(escape(atob(enc)));
        const [msg, pub] = decoded.split("|");
        document.getElementById('decrypted-message').value = msg || "";
    } catch (e) {
        document.getElementById('decrypted-message').value = "Invalid encrypted message.";
    }
}

// --- (Optional) Three.js background animation demo ---
const canvas = document.getElementById('bg-canvas');
if (canvas && window.THREE) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({canvas, alpha:true});
    renderer.setSize(window.innerWidth, window.innerHeight);

    const geometry = new THREE.TorusKnotGeometry(10, 3, 100, 16);
    const material = new THREE.MeshStandardMaterial({ color: 0xff0051, emissive: 0x00fff7, metalness: 0.7, roughness: 0.2 });
    const torusKnot = new THREE.Mesh(geometry, material);
    scene.add(torusKnot);

    const light = new THREE.PointLight(0xffffff, 1, 100);
    light.position.set(20, 20, 20);
    scene.add(light);

    camera.position.z = 40;

    function animate() {
        requestAnimationFrame(animate);
        torusKnot.rotation.x += 0.01;
        torusKnot.rotation.y += 0.013;
        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}