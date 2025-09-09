(function () {
    const purpose = window.__VERIFY_PURPOSE__;
    const qs = (id) => document.getElementById(id);

    // Cache DOM once
    const els = {
        uid: qs("uid"),
        eml: qs("eml"),
        code: qs("code"),
        verifyBtn: qs("verifyBtn"),
        verifyMsg: qs("verifyMsg"),
        pwBox: qs("pwBox"),
        pwd: qs("pwd"),
        commitBtn: qs("commitBtn"),
        pwMsg: qs("pwMsg"),
    };

    let sessionToken = null;
    const ok = (msg) => `<span style="color:green">${msg}</span>`;
    const err = (msg) => `<span style="color:#b00">${msg}</span>`;

    function cryptoRandom() {
        try {
            const arr = new Uint8Array(16);
            (window.crypto || window.msCrypto).getRandomValues(arr);
            return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
        } catch {
            // Fallback: not cryptographically strong, but fine for a per-request salt
            return (
                Math.random().toString(16).slice(2) +
                Math.random().toString(16).slice(2)
            );
        }
    }

    window.addEventListener("DOMContentLoaded", function () {
        els.verifyBtn.onclick = async () => {
            els.verifyMsg.textContent = "";

            const payload = {
                user_id: els.uid.value,
                email: els.eml.value,
                purpose,
                code: els.code.value,
            };

            let errorMessage = "";

            try {
                const res = await fetch("/auth/verify-code", {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify(payload),
                });

                // Avoid throwing: compute error message instead
                if (!res.ok) {
                    let data = null;
                    try {
                        data = await res.json();
                    } catch {
                    }
                    errorMessage = (data && data.error) || "Verification failed";
                } else {
                    const data = await res.json();
                    sessionToken = data.session_token || null;
                    if (!sessionToken) {
                        errorMessage = "Missing session token";
                    }
                }
            } catch (e) {
                errorMessage = e?.message || "Network error";
            }

            if (errorMessage) {
                els.verifyMsg.innerHTML = err(errorMessage);
            } else {
                els.verifyMsg.innerHTML = ok("Code verified. You can now set a password.");
                els.pwBox.style.display = "block";
            }
        };

        els.commitBtn.onclick = async () => {
            els.pwMsg.textContent = "";

            if (!sessionToken) {
                els.pwMsg.innerHTML = err("No session token");
                return;
            }
            const newPassword = els.pwd.value || "";
            if (newPassword.length < 8) {
                els.pwMsg.innerHTML = err("Password must be at least 8 characters");
                return;
            }

            let errorMessage = "";

            try {
                const res = await fetch("/auth/change-password", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + sessionToken,
                    },
                    body: JSON.stringify({
                        userId: els.uid.value,
                        newPassword,
                        newSecret: cryptoRandom(), // you can ignore server-side if you prefer
                    }),
                });

                if (res.status === 204) {
                    els.pwMsg.innerHTML = ok("Password set. Redirecting…");
                    setTimeout(() => (location.href = "https://google.com"), 800);
                    return;
                }

                let data = null;
                try {
                    data = await res.json();
                } catch {
                }
                errorMessage = (data && data.error) || `HTTP ${res.status}`;
            } catch (e) {
                errorMessage = e?.message || "Network error";
            }

            if (errorMessage) {
                els.pwMsg.innerHTML = err(errorMessage);
            }
        };
    });
})();