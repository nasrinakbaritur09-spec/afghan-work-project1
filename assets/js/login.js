"use strict";

/* =========================================================
   AFGHAN WORK
   LOGIN SYSTEM
   ========================================================= */


/* =========================================================
   CONFIG
   ========================================================= */

const LOGIN_CONFIG = {
  USERS_KEY: "afghanWorkUsers",
  CURRENT_USER_KEY: "currentUser",
  SESSION_KEY: "afghanWorkSession",
  LANGUAGE_KEY: "afghanWorkLanguage"
};


/* =========================================================
   LOGIN TRANSLATIONS
   ========================================================= */

const LOGIN_TEXTS = {
  en: {
    show: "Show password",
    hide: "Hide password",
    loggingIn: "Logging in...",
    login: "Login",
    emailRequired: "Please enter your email address.",
    emailInvalid: "Please enter a valid email address.",
    passwordRequired: "Please enter your password.",
    userNotFound: "No account was found with this email address.",
    wrongPassword: "Incorrect password. Please try again.",
    success: "Login successful. Redirecting...",
    error: "Something went wrong. Please try again."
  },

  fa: {
    show: "نمایش رمز عبور",
    hide: "پنهان کردن رمز عبور",
    loggingIn: "در حال ورود...",
    login: "ورود",
    emailRequired: "لطفاً آدرس ایمیل خود را وارد کنید.",
    emailInvalid: "لطفاً یک آدرس ایمیل معتبر وارد کنید.",
    passwordRequired: "لطفاً رمز عبور خود را وارد کنید.",
    userNotFound: "هیچ حسابی با این آدرس ایمیل پیدا نشد.",
    wrongPassword: "رمز عبور اشتباه است. دوباره تلاش کنید.",
    success: "ورود موفق بود. در حال انتقال...",
    error: "مشکلی پیش آمد. لطفاً دوباره تلاش کنید."
  },

  ps: {
    show: "پټنوم ښکاره کول",
    hide: "پټنوم پټول",
    loggingIn: "د ننوتلو په حال کې...",
    login: "ننوتل",
    emailRequired: "مهرباني وکړئ خپل ایمیل پته دننه کړئ.",
    emailInvalid: "مهرباني وکړئ یو معتبر ایمیل پته دننه کړئ.",
    passwordRequired: "مهرباني وکړئ خپل پټنوم دننه کړئ.",
    userNotFound: "د دې ایمیل پتې لپاره هېڅ حساب ونه موندل شو.",
    wrongPassword: "پټنوم ناسم دی. بیا هڅه وکړئ.",
    success: "ننوتل بریالي شول. د انتقال په حال کې...",
    error: "یوه ستونزه رامنځته شوه. مهرباني وکړئ بیا هڅه وکړئ."
  }
};


/* =========================================================
   GET CURRENT LANGUAGE
   ========================================================= */

function getLoginLanguage() {
  const savedLanguage = localStorage.getItem(
    LOGIN_CONFIG.LANGUAGE_KEY
  );

  if (savedLanguage === "fa" || savedLanguage === "ps") {
    return savedLanguage;
  }

  return "en";
}


/* =========================================================
   GET LOGIN TEXT
   ========================================================= */

function loginText(key) {
  const language = getLoginLanguage();

  return (
    LOGIN_TEXTS[language]?.[key] ||
    LOGIN_TEXTS.en[key] ||
    key
  );
}


/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  initLogin();
});


/* =========================================================
   INIT LOGIN
   ========================================================= */

function initLogin() {
  const form = document.getElementById("loginForm");

  if (!form) {
    console.error("loginForm not found.");
    return;
  }

  const email = document.getElementById("loginEmail");
  const password = document.getElementById("loginPassword");
  const button = document.getElementById("loginButton");

  if (!email || !password) {
    console.error("Login inputs not found.");
    return;
  }


  /* =======================================================
     PASSWORD EYE BUTTON
     ======================================================= */

  createLoginPasswordToggle(password);


  /* =======================================================
     SUBMIT
     ======================================================= */

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    clearLoginMessage();
    clearLoginErrors();

    const emailValue = email.value.trim().toLowerCase();
    const passwordValue = password.value;


    /* =====================================================
       EMAIL
       ===================================================== */

    if (!emailValue) {
      showLoginMessage(
        loginText("emailRequired"),
        "error"
      );

      email.focus();
      return;
    }

    if (!isValidLoginEmail(emailValue)) {
      showLoginMessage(
        loginText("emailInvalid"),
        "error"
      );

      email.focus();
      return;
    }


    /* =====================================================
       PASSWORD
       ===================================================== */

    if (!passwordValue) {
      showLoginMessage(
        loginText("passwordRequired"),
        "error"
      );

      password.focus();
      return;
    }


    /* =====================================================
       BUTTON LOADING
       ===================================================== */

    if (button) {
      button.disabled = true;

      button.dataset.oldText =
        button.textContent;

      button.textContent =
        loginText("loggingIn");
    }


    try {

      /* ===================================================
         GET USERS
         =================================================== */

      const users = getLoginUsers();


      /* ===================================================
         FIND USER
         =================================================== */

      const user = users.find((item) => {
        return (
          String(item.email || "")
            .trim()
            .toLowerCase() === emailValue
        );
      });


      /* ===================================================
         USER DOES NOT EXIST
         =================================================== */

      if (!user) {
        showLoginMessage(
          loginText("userNotFound"),
          "error"
        );

        email.focus();
        return;
      }


      /* ===================================================
         VERIFY PASSWORD
         =================================================== */

      let passwordCorrect = false;


      /* ===================================================
         NEW SECURE PASSWORD
         =================================================== */

      if (user.passwordHash && user.salt) {
        const hash = await hashLoginPassword(
          passwordValue,
          user.salt
        );

        passwordCorrect =
          hash === user.passwordHash;
      }


      /* ===================================================
         OLD PASSWORD COMPATIBILITY
         =================================================== */

      else if (user.password) {
        passwordCorrect =
          user.password === passwordValue;
      }


      /* ===================================================
         WRONG PASSWORD
         =================================================== */

      if (!passwordCorrect) {
        showLoginMessage(
          loginText("wrongPassword"),
          "error"
        );

        password.focus();
        return;
      }


      /* ===================================================
         CREATE SAFE USER
         =================================================== */

      const safeUser = {
        id: user.id,

        name:
          user.name ||
          `${user.firstName || ""} ${user.lastName || ""}`.trim(),

        firstName:
          user.firstName || "",

        lastName:
          user.lastName || "",

        email:
          user.email,

        role:
          normalizeRole(user.role),

        createdAt:
          user.createdAt || null
      };


      /* ===================================================
         SAVE CURRENT USER
         =================================================== */

      localStorage.setItem(
        LOGIN_CONFIG.CURRENT_USER_KEY,
        JSON.stringify(safeUser)
      );


      /* ===================================================
         SAVE SESSION
         =================================================== */

      const session = {
        userId: safeUser.id,
        email: safeUser.email,
        role: safeUser.role,
        loginAt: new Date().toISOString()
      };

      localStorage.setItem(
        LOGIN_CONFIG.SESSION_KEY,
        JSON.stringify(session)
      );


      /* ===================================================
         SUCCESS
         =================================================== */

      showLoginMessage(
        loginText("success"),
        "success"
      );


      /* ===================================================
         REDIRECT
         =================================================== */

      setTimeout(() => {
        redirectAfterLogin(safeUser);
      }, 700);


    } catch (error) {

      console.error(
        "Login error:",
        error
      );

      showLoginMessage(
        loginText("error"),
        "error"
      );

    } finally {

      if (button) {
        button.disabled = false;

        button.textContent =
          button.dataset.oldText ||
          loginText("login");
      }
    }
  });


  /* =======================================================
     LANGUAGE CHANGED
     ======================================================= */

  document.addEventListener(
    "languageChanged",
    () => {
      updateLoginPasswordToggle();
    }
  );
}


/* =========================================================
   GET USERS
   ========================================================= */

function getLoginUsers() {
  try {

    const data = localStorage.getItem(
      LOGIN_CONFIG.USERS_KEY
    );

    if (!data) {
      return [];
    }

    const users = JSON.parse(data);

    if (!Array.isArray(users)) {
      return [];
    }

    return users;

  } catch (error) {

    console.error(
      "Could not read users:",
      error
    );

    return [];
  }
}


/* =========================================================
   HASH PASSWORD
   ========================================================= */

async function hashLoginPassword(password, salt) {

  const encoder = new TextEncoder();

  const data = encoder.encode(
    password + salt
  );

  const hash =
    await crypto.subtle.digest(
      "SHA-256",
      data
    );

  return Array.from(
    new Uint8Array(hash),
    (byte) =>
      byte
        .toString(16)
        .padStart(2, "0")
  ).join("");
}


/* =========================================================
   EMAIL VALIDATION
   ========================================================= */

function isValidLoginEmail(email) {

  const pattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  return pattern.test(email);
}


/* =========================================================
   NORMALIZE ROLE
   ========================================================= */

function normalizeRole(role) {

  const value =
    String(role || "")
      .trim()
      .toLowerCase();

  if (value === "employer") {
    return "employer";
  }

  if (value === "admin") {
    return "admin";
  }

  if (value === "administrator") {
    return "admin";
  }

  if (
    value === "job seeker" ||
    value === "jobseeker" ||
    value === "job_seeker"
  ) {
    return "jobseeker";
  }

  return "jobseeker";
}


/* =========================================================
   REDIRECT AFTER LOGIN
   ========================================================= */

function redirectAfterLogin(user) {

  const role =
    normalizeRole(user.role);


  if (role === "admin") {

    window.location.href =
      "../admin/index.html";

    return;
  }


  if (role === "employer") {

    window.location.href =
      "../user/dashboard.html";

    return;
  }


  /* =======================================================
     JOB SEEKER
     ======================================================= */

 if (user.role === "admin") {
  window.location.href = "../admin/index.html";
} else {
  window.location.href = "../user/dashboard.html";
}
}


/* =========================================================
   PASSWORD SHOW / HIDE
   WITH EYE ICON + RTL SUPPORT
   ========================================================= */

function createLoginPasswordToggle(input) {

  if (!input) {
    return;
  }

  const parent =
    input.parentElement;

  if (!parent) {
    return;
  }


  /* =======================================================
     DON'T CREATE TWICE
     ======================================================= */

  if (
    parent.querySelector(
      ".login-password-toggle"
    )
  ) {
    return;
  }


  /* =======================================================
     PARENT POSITION
     ======================================================= */

  parent.style.position =
    "relative";


  /* =======================================================
     INPUT SPACE FOR EYE
     ======================================================= */

  input.style.paddingRight =
    "14px";

  input.style.paddingLeft =
    "14px";


  /* =======================================================
     CREATE BUTTON
     ======================================================= */

  const button =
    document.createElement("button");

  button.type =
    "button";

  button.className =
    "login-password-toggle";

  button.setAttribute(
    "aria-label",
    loginText("show")
  );

  button.setAttribute(
    "title",
    loginText("show")
  );


  /* =======================================================
     BUTTON STYLE
     ======================================================= */

  button.style.position =
    "absolute";

  button.style.top =
    "50%";

  button.style.transform =
    "translateY(-50%)";

  button.style.width =
    "36px";

  button.style.height =
    "36px";

  button.style.display =
    "flex";

  button.style.alignItems =
    "center";

  button.style.justifyContent =
    "center";

  button.style.border =
    "none";

  button.style.outline =
    "none";

  button.style.background =
    "transparent";

  button.style.cursor =
    "pointer";

  button.style.padding =
    "0";

  button.style.margin =
    "0";

  button.style.color =
    "#64748b";

  button.style.fontSize =
    "18px";

  button.style.zIndex =
    "20";

  button.style.lineHeight =
    "1";

  button.style.boxShadow =
    "none";


  /* =======================================================
     RTL / LTR POSITION
     ======================================================= */

  updatePasswordToggleDirection(
    button,
    input
  );


  /* =======================================================
     FIRST EYE ICON
     ======================================================= */

  button.innerHTML =
    getEyeIcon(false);


  /* =======================================================
     CLICK
     ======================================================= */

  button.addEventListener(
    "click",
    () => {

      const hidden =
        input.type === "password";


      /* Change password type */

      input.type =
        hidden
          ? "text"
          : "password";


      /* Change eye */

      button.innerHTML =
        getEyeIcon(hidden);


      /* Change translation */

      const text =
        hidden
          ? loginText("hide")
          : loginText("show");


      button.setAttribute(
        "aria-label",
        text
      );

      button.setAttribute(
        "title",
        text
      );


      /* Keep focus */

      input.focus();
    }
  );


  parent.appendChild(button);
}


/* =========================================================
   EYE ICON
   ========================================================= */

function getEyeIcon(open) {

  /* =======================================================
     OPEN EYE
     ======================================================= */

  if (open) {

    return `
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path
          d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z">
        </path>

        <circle
          cx="12"
          cy="12"
          r="3">
        </circle>
      </svg>
    `;
  }


  /* =======================================================
     CLOSED EYE
     ======================================================= */

  return `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M3 3l18 18"></path>

      <path
        d="M10.6 10.6a2 2 0 0 0 2.8 2.8">
      </path>

      <path
        d="M9.9 4.2A10.8 10.8 0 0 1 12 4c6.5 0 10 8 10 8a18.4 18.4 0 0 1-3.1 4.3">
      </path>

      <path
        d="M6.6 6.6C3.7 8.5 2 12 2 12s3.5 8 10 8c1.5 0 2.9-.3 4.1-.9">
      </path>
    </svg>
  `;
}


/* =========================================================
   UPDATE RTL / LTR POSITION
   ========================================================= */

function updatePasswordToggleDirection(
  button,
  input
) {

  const direction =
    document.documentElement.getAttribute("dir") ||
    "ltr";


  /* =======================================================
     RTL
     Dari / Pashto
     Eye = LEFT
     ======================================================= */

  if (direction === "rtl") {

    button.style.left =
      "10px";

    button.style.right =
      "auto";

    input.style.paddingLeft =
      "48px";

    input.style.paddingRight =
      "14px";

  }


  /* =======================================================
     LTR
     English
     Eye = RIGHT
     ======================================================= */

  else {

    button.style.right =
      "10px";

    button.style.left =
      "auto";

    input.style.paddingRight =
      "48px";

    input.style.paddingLeft =
      "14px";
  }
}


/* =========================================================
   UPDATE PASSWORD TOGGLE AFTER LANGUAGE CHANGE
   ========================================================= */

function updateLoginPasswordToggle() {

  const input =
    document.getElementById(
      "loginPassword"
    );

  const button =
    document.querySelector(
      ".login-password-toggle"
    );

  if (!input || !button) {
    return;
  }


  /* Update RTL / LTR */

  updatePasswordToggleDirection(
    button,
    input
  );


  /* Check password state */

  const isVisible =
    input.type === "text";


  const text =
    isVisible
      ? loginText("hide")
      : loginText("show");


  button.setAttribute(
    "aria-label",
    text
  );

  button.setAttribute(
    "title",
    text
  );


  /* Update icon */

  button.innerHTML =
    getEyeIcon(isVisible);
}


/* =========================================================
   SHOW MESSAGE
   ========================================================= */

function showLoginMessage(
  message,
  type
) {

  const box =
    document.getElementById(
      "loginMessage"
    );

  if (!box) {
    return;
  }


  box.textContent =
    message;

  box.style.display =
    "block";

  box.style.marginTop =
    "15px";

  box.style.marginBottom =
    "15px";

  box.style.padding =
    "12px 15px";

  box.style.borderRadius =
    "10px";

  box.style.fontSize =
    "14px";

  box.style.lineHeight =
    "1.5";


  if (type === "success") {

    box.style.background =
      "#dcfce7";

    box.style.color =
      "#166534";

    box.style.border =
      "1px solid #86efac";

  } else {

    box.style.background =
      "#fee2e2";

    box.style.color =
      "#991b1b";

    box.style.border =
      "1px solid #fca5a5";
  }
}


/* =========================================================
   CLEAR MESSAGE
   ========================================================= */

function clearLoginMessage() {

  const box =
    document.getElementById(
      "loginMessage"
    );

  if (!box) {
    return;
  }

  box.textContent =
    "";

  box.style.display =
    "none";
}


/* =========================================================
   CLEAR ERRORS
   ========================================================= */

function clearLoginErrors() {

  document
    .querySelectorAll(
      "#loginForm input"
    )
    .forEach((input) => {

      input.style.borderColor =
        "";
    });
}


/* =========================================================
   LOGOUT
   ========================================================= */

function logoutUser() {

  localStorage.removeItem(
    LOGIN_CONFIG.CURRENT_USER_KEY
  );

  localStorage.removeItem(
    LOGIN_CONFIG.SESSION_KEY
  );

  window.location.href =
    "../auth/login.html";
}


/* =========================================================
   EXPORT
   ========================================================= */

window.logoutUser =
  logoutUser;

window.hashLoginPassword =
  hashLoginPassword;