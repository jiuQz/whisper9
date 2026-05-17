const fs = require('fs');

let css = fs.readFileSync('styles.css', 'utf8');
const responsiveCSS = `
/* =========================================
   Responsive Design (Mobile & Desktop)
   ========================================= */
@media (max-width: 600px), (max-height: 852px) {
    body {
        align-items: flex-start;
        background: #000;
    }
    .phone-container {
        padding: 0;
        width: 100%;
        height: 100%;
        display: flex;
    }
    .phone-body {
        width: 100vw;
        height: 100dvh; /* use dynamic viewport height for mobile */
        border-radius: 0;
        box-shadow: none;
        border: none;
    }
    .phone-body::before {
        display: none; /* remove glare effect */
    }
    .notch {
        display: none; /* remove simulated notch on real mobile */
    }
    .home-indicator {
        display: none; /* remove simulated home indicator */
    }
    /* Adjust status bar height if notch is gone */
    .status-bar {
        padding: 5px 20px;
    }
}

/* Ensure images and media don't exceed max-width */
img {
    max-width: 100%;
}
`;

if(!css.includes('@media (max-width: 600px)')) {
    css += responsiveCSS;
    fs.writeFileSync('styles.css', css);
    console.log("Responsive CSS patched");
} else {
    console.log("Already responsive");
}